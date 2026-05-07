import assert from "node:assert/strict";
import test from "node:test";

import {
  processDeletionMessage,
  processDeletionRecord,
} from "../src/index.mjs";

const config = {
  gsiName: "gsi1",
  queueUrl: "https://sqs.example/account-data-deletion",
  tableName: "receipts",
  throttleVisibilitySeconds: 21600,
};

function attr(value) {
  return { S: value };
}

function child(sk) {
  return {
    pk: attr("RECEIPT#receipt-1"),
    sk: attr(sk),
  };
}

function root(receiptId = "receipt-1") {
  return {
    pk: attr(`RECEIPT#${receiptId}`),
    receipt_id: attr(receiptId),
  };
}

function createClients({ queryResults = [], batchWriteResult = {}, deleteError } = {}) {
  const calls = [];

  return {
    calls,
    dynamoDb: {
      batchWriteItem: async (input) => {
        calls.push(["batchWriteItem", input]);
        return batchWriteResult;
      },
      deleteItem: async (input) => {
        calls.push(["deleteItem", input]);

        if (deleteError) {
          throw deleteError;
        }

        return {};
      },
      query: async (input) => {
        calls.push(["query", input]);
        const result = queryResults.shift();

        if (result instanceof Error) {
          throw result;
        }

        return result ?? {};
      },
    },
    sqs: {
      changeMessageVisibility: async (input) => {
        calls.push(["changeMessageVisibility", input]);
        return {};
      },
      sendMessage: async (input) => {
        calls.push(["sendMessage", input]);
        return {};
      },
    },
  };
}

async function withMutedConsoleError(callback) {
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    return await callback();
  } finally {
    console.error = originalConsoleError;
  }
}

test("deletes child rows before root rows", async () => {
  const clients = createClients({
    queryResults: [
      { Items: [root()] },
      { Items: [child("ITEM#item-1")] },
    ],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clients,
    config,
  );

  assert.deepEqual(
    clients.calls.map(([name]) => name),
    ["query", "query", "batchWriteItem", "sendMessage"],
  );
});

test("delete batches are capped at 25 child rows", async () => {
  const children = Array.from({ length: 30 }, (_, index) => child(`ITEM#${index}`));
  const clients = createClients({
    queryResults: [
      { Items: [root()] },
      { Items: children },
    ],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clients,
    config,
  );

  const batchWriteCall = clients.calls.find(([name]) => name === "batchWriteItem");
  assert.equal(batchWriteCall[1].RequestItems.receipts.length, 25);

  const childQueryCall = clients.calls[1][1];
  assert.equal(childQueryCall.Limit, 25);
});

test("successful partial cleanup enqueues immediate same-receipt continuation", async () => {
  const clients = createClients({
    queryResults: [
      { Items: [root()] },
      { Items: [child("PARTICIPANT#participant-1")] },
    ],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clients,
    config,
  );

  const sendCall = clients.calls.find(([name]) => name === "sendMessage");
  assert.deepEqual(JSON.parse(sendCall[1].MessageBody), {
    receiptId: "receipt-1",
    userSub: "user-1",
  });
});

test("root deletion only happens after no children remain", async () => {
  const clientsWithChildren = createClients({
    queryResults: [
      { Items: [root()] },
      { Items: [child("ALLOCATION#ITEM#item-1#PARTICIPANT#participant-1")] },
    ],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clientsWithChildren,
    config,
  );

  assert.equal(
    clientsWithChildren.calls.some(([name]) => name === "deleteItem"),
    false,
  );

  const clientsWithoutChildren = createClients({
    queryResults: [
      { Items: [root()] },
      { Items: [] },
    ],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clientsWithoutChildren,
    config,
  );

  assert.equal(
    clientsWithoutChildren.calls.some(([name]) => name === "deleteItem"),
    true,
  );
});

test("root deletion enqueues immediate next-receipt continuation", async () => {
  const clients = createClients({
    queryResults: [
      { Items: [root()] },
      { Items: [] },
    ],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clients,
    config,
  );

  const sendCall = clients.calls.find(([name]) => name === "sendMessage");
  assert.deepEqual(JSON.parse(sendCall[1].MessageBody), {
    userSub: "user-1",
  });
});

test("throttled query sets 6-hour visibility and returns batch failure", async () => {
  const throttled = new Error("rate exceeded");
  throttled.name = "ProvisionedThroughputExceededException";
  const clients = createClients({
    queryResults: [throttled],
  });

  const failure = await withMutedConsoleError(() =>
    processDeletionRecord(
      {
        body: JSON.stringify({ userSub: "user-1" }),
        messageId: "message-1",
        receiptHandle: "receipt-handle-1",
      },
      clients,
      config,
    ),
  );

  assert.deepEqual(failure, { itemIdentifier: "message-1" });
  assert.deepEqual(
    clients.calls.find(([name]) => name === "changeMessageVisibility")?.[1],
    {
      QueueUrl: config.queueUrl,
      ReceiptHandle: "receipt-handle-1",
      VisibilityTimeout: 21600,
    },
  );
});

test("unprocessed batch deletes set 6-hour visibility and return batch failure", async () => {
  const clients = createClients({
    batchWriteResult: {
      UnprocessedItems: {
        receipts: [
          {
            DeleteRequest: {
              Key: child("ITEM#item-1"),
            },
          },
        ],
      },
    },
    queryResults: [
      { Items: [root()] },
      { Items: [child("ITEM#item-1")] },
    ],
  });

  const failure = await withMutedConsoleError(() =>
    processDeletionRecord(
      {
        body: JSON.stringify({ userSub: "user-1" }),
        messageId: "message-1",
        receiptHandle: "receipt-handle-1",
      },
      clients,
      config,
    ),
  );

  assert.deepEqual(failure, { itemIdentifier: "message-1" });
  assert.equal(
    clients.calls.some(([name]) => name === "changeMessageVisibility"),
    true,
  );
});

test("duplicate messages are idempotent when no receipt roots remain", async () => {
  const clients = createClients({
    queryResults: [{ Items: [] }],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ userSub: "user-1" }),
    },
    clients,
    config,
  );

  assert.deepEqual(
    clients.calls.map(([name]) => name),
    ["query"],
  );
});

test("duplicate receipt continuation is idempotent after root deletion", async () => {
  const clients = createClients({
    queryResults: [{ Items: [] }],
  });

  await processDeletionMessage(
    {
      body: JSON.stringify({ receiptId: "receipt-1", userSub: "user-1" }),
    },
    clients,
    config,
  );

  assert.deepEqual(
    clients.calls.map(([name]) => name),
    ["query", "deleteItem", "sendMessage"],
  );
});
