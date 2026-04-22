import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadResolver() {
  const sourcePath = new URL('./commit-set-item-allocations.js.tftpl', import.meta.url);
  let source = fs.readFileSync(sourcePath, 'utf8');

  source = source.replace("import { util } from '@aws-appsync/utils';\n", '');
  source = source.replace(/export function /g, 'function ');
  source += '\nthis.request = request; this.response = response;';

  const util = {
    error(message, type) {
      const error = new Error(message);
      error.type = type;
      throw error;
    },
    time: {
      nowISO8601() {
        return '2026-04-21T12:00:00.000Z';
      },
    },
    dynamodb: {
      toMapValues(value) {
        return value;
      },
    },
  };

  const context = { util };
  vm.createContext(context);
  vm.runInContext(source, context);

  return context;
}

function normalize(value) {
  return JSON.parse(JSON.stringify(value));
}

test('request avoids duplicate operations when allocations partially overlap', () => {
  const resolver = loadResolver();
  const ctx = {
    args: {
      input: {
        allocations: [
          { participantId: 'participant-a', shareWeight: 1 },
          { participantId: 'participant-c', shareWeight: 1 },
        ],
        expectedVersion: 4,
        itemId: 'item-1',
        receiptId: 'receipt-1',
      },
    },
    identity: {
      sub: 'user-1',
    },
    stash: {
      itemAllocations: [
        {
          created_at: '2026-04-20T12:00:00.000Z',
          participant_id: 'participant-a',
          pk: 'RECEIPT#receipt-1',
          share_weight: 1,
          sk: 'ALLOCATION#ITEM#item-1#PARTICIPANT#participant-a',
          updated_at: '2026-04-20T12:00:00.000Z',
        },
        {
          created_at: '2026-04-20T12:05:00.000Z',
          participant_id: 'participant-b',
          pk: 'RECEIPT#receipt-1',
          share_weight: 1,
          sk: 'ALLOCATION#ITEM#item-1#PARTICIPANT#participant-b',
          updated_at: '2026-04-20T12:05:00.000Z',
        },
      ],
    },
  };

  const result = resolver.request(ctx);
  const operationKeys = result.transactItems
    .map((item) => item.key ? `${item.operation}:${item.key.pk}|${item.key.sk}` : null)
    .filter(Boolean);

  assert.deepEqual(normalize(operationKeys), [
    'ConditionCheck:RECEIPT#receipt-1|ITEM#item-1',
    'ConditionCheck:RECEIPT#receipt-1|PARTICIPANT#participant-a',
    'ConditionCheck:RECEIPT#receipt-1|PARTICIPANT#participant-c',
    'DeleteItem:RECEIPT#receipt-1|ALLOCATION#ITEM#item-1#PARTICIPANT#participant-b',
    'PutItem:RECEIPT#receipt-1|ALLOCATION#ITEM#item-1#PARTICIPANT#participant-c',
    'UpdateItem:RECEIPT#receipt-1|RECEIPT',
  ]);

  assert.deepEqual(normalize(ctx.stash.allocations), [
    {
      createdAt: '2026-04-20T12:00:00.000Z',
      itemId: 'item-1',
      participantId: 'participant-a',
      shareWeight: 1,
      updatedAt: '2026-04-20T12:00:00.000Z',
    },
    {
      createdAt: '2026-04-21T12:00:00.000Z',
      itemId: 'item-1',
      participantId: 'participant-c',
      shareWeight: 1,
      updatedAt: '2026-04-21T12:00:00.000Z',
    },
  ]);
});
