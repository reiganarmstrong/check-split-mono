const CHILD_BATCH_LIMIT = 25;
const ROOT_SK = "RECEIPT";
const THROTTLE_ERROR_NAMES = new Set([
  "BandwidthLimitExceeded",
  "ProvisionedThroughputExceededException",
  "RequestLimitExceeded",
  "ThrottlingException",
  "ThrottlingError",
  "TooManyRequestsException",
]);

class BackpressureError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackpressureError";
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }

  return value;
}

function stringAttribute(value) {
  return { S: value };
}

function getStringAttribute(item, name) {
  return item?.[name]?.S ?? null;
}

function receiptPk(receiptId) {
  return `RECEIPT#${receiptId}`;
}

function parseReceiptId(item) {
  const receiptId = getStringAttribute(item, "receipt_id");

  if (receiptId) {
    return receiptId;
  }

  const pk = getStringAttribute(item, "pk");

  if (pk?.startsWith("RECEIPT#")) {
    return pk.slice("RECEIPT#".length);
  }

  return null;
}

function parseDeletionMessage(body) {
  const parsed = JSON.parse(body);
  const userSub = typeof parsed.userSub === "string" ? parsed.userSub : "";
  const receiptId = typeof parsed.receiptId === "string" ? parsed.receiptId : null;

  if (!userSub) {
    throw new Error("Account data deletion message missing userSub.");
  }

  return {
    receiptId,
    userSub,
  };
}

function countUnprocessedItems(unprocessedItems) {
  return Object.values(unprocessedItems ?? {}).reduce(
    (count, items) => count + items.length,
    0,
  );
}

function isBackpressureError(error) {
  if (error instanceof BackpressureError) {
    return true;
  }

  const name = error?.name ?? error?.Code ?? error?.code ?? "";
  const message = error?.message ?? "";

  return (
    THROTTLE_ERROR_NAMES.has(name) ||
    message.toLowerCase().includes("throttl") ||
    message.toLowerCase().includes("provisionedthroughput")
  );
}

function isConditionalCheckFailed(error) {
  return error?.name === "ConditionalCheckFailedException";
}

async function loadAwsClients() {
  const [
    dynamodb,
    sqs,
  ] = await Promise.all([
    import("@aws-sdk/client-dynamodb"),
    import("@aws-sdk/client-sqs"),
  ]);

  const dynamoDbClient = new dynamodb.DynamoDBClient({
    maxAttempts: 1,
  });
  const sqsClient = new sqs.SQSClient({
    maxAttempts: 1,
  });

  return {
    dynamoDb: {
      batchWriteItem: (input) =>
        dynamoDbClient.send(new dynamodb.BatchWriteItemCommand(input)),
      deleteItem: (input) =>
        dynamoDbClient.send(new dynamodb.DeleteItemCommand(input)),
      query: (input) =>
        dynamoDbClient.send(new dynamodb.QueryCommand(input)),
    },
    sqs: {
      changeMessageVisibility: (input) =>
        sqsClient.send(new sqs.ChangeMessageVisibilityCommand(input)),
      sendMessage: (input) =>
        sqsClient.send(new sqs.SendMessageCommand(input)),
    },
  };
}

async function enqueueContinuation(sqs, config, message) {
  await sqs.sendMessage({
    MessageBody: JSON.stringify(message),
    QueueUrl: config.queueUrl,
  });
}

async function queryNextReceiptRoot(dynamoDb, config, userSub) {
  const result = await dynamoDb.query({
    ExpressionAttributeValues: {
      ":gsi1pk": stringAttribute(`USER#${userSub}`),
    },
    IndexName: config.gsiName,
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    Limit: 1,
    ProjectionExpression: "pk, receipt_id",
    TableName: config.tableName,
  });

  const item = result.Items?.[0];

  return item ? parseReceiptId(item) : null;
}

async function queryReceiptChildren(dynamoDb, config, receiptId) {
  const result = await dynamoDb.query({
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#sk": "sk",
    },
    ExpressionAttributeValues: {
      ":pk": stringAttribute(receiptPk(receiptId)),
      ":root_sk": stringAttribute(ROOT_SK),
    },
    KeyConditionExpression: "#pk = :pk AND #sk < :root_sk",
    Limit: CHILD_BATCH_LIMIT,
    ProjectionExpression: "#pk, #sk",
    TableName: config.tableName,
  });

  return (result.Items ?? []).slice(0, CHILD_BATCH_LIMIT);
}

async function deleteReceiptChildren(dynamoDb, config, children) {
  if (children.length === 0) {
    return;
  }

  const result = await dynamoDb.batchWriteItem({
    RequestItems: {
      [config.tableName]: children.map((item) => ({
        DeleteRequest: {
          Key: {
            pk: item.pk,
            sk: item.sk,
          },
        },
      })),
    },
  });

  if (countUnprocessedItems(result.UnprocessedItems) > 0) {
    throw new BackpressureError("DynamoDB returned unprocessed delete items.");
  }
}

async function deleteReceiptRoot(dynamoDb, config, userSub, receiptId) {
  try {
    await dynamoDb.deleteItem({
      ConditionExpression:
        "attribute_not_exists(#pk) OR #owner_user_id = :owner_user_id",
      ExpressionAttributeNames: {
        "#owner_user_id": "owner_user_id",
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":owner_user_id": stringAttribute(userSub),
      },
      Key: {
        pk: stringAttribute(receiptPk(receiptId)),
        sk: stringAttribute(ROOT_SK),
      },
      TableName: config.tableName,
    });
  } catch (error) {
    if (isConditionalCheckFailed(error)) {
      throw new Error("Receipt root owner did not match deletion user.");
    }

    throw error;
  }
}

export async function processDeletionMessage(message, clients, config) {
  const { receiptId: messageReceiptId, userSub } = parseDeletionMessage(message.body);
  const receiptId =
    messageReceiptId ?? (await queryNextReceiptRoot(clients.dynamoDb, config, userSub));

  if (!receiptId) {
    return;
  }

  const children = await queryReceiptChildren(clients.dynamoDb, config, receiptId);

  if (children.length > 0) {
    await deleteReceiptChildren(clients.dynamoDb, config, children);
    await enqueueContinuation(clients.sqs, config, {
      receiptId,
      userSub,
    });
    return;
  }

  await deleteReceiptRoot(clients.dynamoDb, config, userSub, receiptId);
  await enqueueContinuation(clients.sqs, config, {
    userSub,
  });
}

async function backoffMessage(sqs, config, record) {
  try {
    await sqs.changeMessageVisibility({
      QueueUrl: config.queueUrl,
      ReceiptHandle: record.receiptHandle,
      VisibilityTimeout: config.throttleVisibilitySeconds,
    });
  } catch {
    // Normal queue visibility handles retry if explicit backoff cannot be set.
  }
}

export async function processDeletionRecord(record, clients, config) {
  try {
    await processDeletionMessage(
      {
        body: record.body,
      },
      clients,
      config,
    );
    return null;
  } catch (error) {
    if (isBackpressureError(error)) {
      await backoffMessage(clients.sqs, config, record);
    }

    console.error("Account data deletion failed.", error);
    return {
      itemIdentifier: record.messageId,
    };
  }
}

export async function workerHandler(event) {
  const clients = await loadAwsClients();
  const config = {
    gsiName: requireEnv("RECEIPTS_GSI_NAME"),
    queueUrl: requireEnv("ACCOUNT_DELETION_QUEUE_URL"),
    tableName: requireEnv("RECEIPTS_TABLE_NAME"),
    throttleVisibilitySeconds: Number(
      process.env.ACCOUNT_DELETION_THROTTLE_VISIBILITY_SECONDS ?? 21600,
    ),
  };
  const batchItemFailures = [];

  for (const record of event.Records ?? []) {
    const failure = await processDeletionRecord(record, clients, config);

    if (failure) {
      batchItemFailures.push(failure);
    }
  }

  return {
    batchItemFailures,
  };
}
