import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadResolver(filename, overrides = {}) {
  const sourcePath = new URL(`./${filename}`, import.meta.url);
  let source = fs.readFileSync(sourcePath, 'utf8');

  source = source.replace("import { util } from '@aws-appsync/utils';\n", '');
  source = source.replace(/export function /g, 'function ');
  source += '\nthis.request = request; this.response = response;';

  const util = {
    autoId() {
      return 'generated-id';
    },
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
    ...overrides,
  };

  const context = { util };
  vm.createContext(context);
  vm.runInContext(source, context);

  return context;
}

function normalize(value) {
  return JSON.parse(JSON.stringify(value));
}

test('createReceipt initializes paid participant count to zero', () => {
  const resolver = loadResolver('create-receipt.js.tftpl', {
    autoId() {
      return 'receipt-1';
    },
  });
  const ctx = {
    args: {
      input: {
        currencyCode: 'USD',
        discountCents: 0,
        feeCents: 0,
        merchantName: 'Cafe',
        receiptOccurredAt: '2026-04-20T18:00:00.000Z',
        subtotalCents: 1000,
        taxCents: 0,
        tipCents: 0,
        totalCents: 1000,
      },
    },
    identity: {
      sub: 'user-1',
    },
    stash: {},
  };

  const result = resolver.request(ctx);

  assert.equal(ctx.stash.createdReceipt.paidParticipantCount, 0);
  assert.equal(result.attributeValues.paid_participant_count, 0);
});

test('addParticipant writes paid fields and increments paid count for paid group', () => {
  const resolver = loadResolver('add-participant.js.tftpl', {
    autoId() {
      return 'participant-1';
    },
  });
  const ctx = {
    args: {
      input: {
        displayName: 'Alex',
        expectedVersion: 3,
        isPaid: true,
        receiptId: 'receipt-1',
      },
    },
    identity: {
      sub: 'user-1',
    },
    stash: {},
  };

  const result = resolver.request(ctx);
  const participantPut = result.transactItems[0];
  const receiptUpdate = result.transactItems[1];

  assert.deepEqual(normalize(ctx.stash.participant), {
    createdAt: '2026-04-21T12:00:00.000Z',
    displayName: 'Alex',
    isPaid: true,
    notes: null,
    paidAt: '2026-04-21T12:00:00.000Z',
    participantId: 'participant-1',
    sortOrder: null,
    updatedAt: '2026-04-21T12:00:00.000Z',
  });
  assert.equal(participantPut.attributeValues.is_paid, true);
  assert.equal(participantPut.attributeValues.paid_at, '2026-04-21T12:00:00.000Z');
  assert.equal(receiptUpdate.update.expressionValues[':paid_delta'], 1);
});

test('updateParticipant preserves paid state when isPaid omitted', () => {
  const resolver = loadResolver('update-participant.js.tftpl');
  const ctx = {
    args: {
      input: {
        displayName: 'Alex Updated',
        expectedVersion: 4,
        notes: 'same paid state',
        participantId: 'participant-1',
        receiptId: 'receipt-1',
      },
    },
    identity: {
      sub: 'user-1',
    },
    stash: {
      existingParticipant: {
        created_at: '2026-04-20T12:00:00.000Z',
        display_name: 'Alex',
        is_paid: true,
        notes: null,
        paid_at: '2026-04-20T13:00:00.000Z',
        participant_id: 'participant-1',
        sort_order: 0,
        updated_at: '2026-04-20T13:00:00.000Z',
      },
    },
  };

  const result = resolver.request(ctx);
  const receiptUpdate = result.transactItems[1];

  assert.equal(ctx.stash.participant.isPaid, true);
  assert.equal(ctx.stash.participant.paidAt, '2026-04-20T13:00:00.000Z');
  assert.equal(receiptUpdate.update.expression, 'SET #updated_at = :updated_at, #version = :version');
  assert.deepEqual(normalize(receiptUpdate.update.expressionValues), {
    ':updated_at': '2026-04-21T12:00:00.000Z',
    ':version': 5,
  });
});

test('updateParticipant adjusts paid count and paidAt on unpaid to paid transition', () => {
  const resolver = loadResolver('update-participant.js.tftpl');
  const ctx = {
    args: {
      input: {
        displayName: 'Blair',
        expectedVersion: 7,
        isPaid: true,
        participantId: 'participant-2',
        receiptId: 'receipt-1',
      },
    },
    identity: {
      sub: 'user-1',
    },
    stash: {
      existingParticipant: {
        created_at: '2026-04-20T12:00:00.000Z',
        display_name: 'Blair',
        is_paid: false,
        notes: null,
        paid_at: null,
        participant_id: 'participant-2',
        sort_order: 1,
        updated_at: '2026-04-20T12:00:00.000Z',
      },
    },
  };

  const result = resolver.request(ctx);
  const receiptUpdate = result.transactItems[1];

  assert.equal(ctx.stash.participant.isPaid, true);
  assert.equal(ctx.stash.participant.paidAt, '2026-04-21T12:00:00.000Z');
  assert.match(receiptUpdate.update.expression, /#paid_participant_count = if_not_exists/);
  assert.equal(receiptUpdate.update.expressionValues[':paid_delta'], 1);
});

test('commitRemoveParticipant decrements paid count for paid participant', () => {
  const resolver = loadResolver('commit-remove-participant.js.tftpl');
  const ctx = {
    args: {
      input: {
        expectedVersion: 5,
        participantId: 'participant-1',
        receiptId: 'receipt-1',
      },
    },
    identity: {
      sub: 'user-1',
    },
    stash: {
      existingParticipant: {
        is_paid: true,
      },
      participantAllocations: [],
    },
  };

  const result = resolver.request(ctx);
  const receiptUpdate = result.transactItems[1];

  assert.equal(receiptUpdate.update.expressionValues[':paid_delta'], -1);
});

test('getReceipt defaults legacy paid fields', () => {
  const resolver = loadResolver('get-receipt.js.tftpl');
  const ctx = {
    args: {
      receiptId: 'receipt-1',
    },
    identity: {
      sub: 'user-1',
    },
    result: {
      items: [
        {
          allocation_policy: 'PROPORTIONAL',
          created_at: '2026-04-20T12:00:00.000Z',
          currency_code: 'USD',
          discount_cents: 0,
          fee_cents: 0,
          item_count: 0,
          merchant_name: 'Cafe',
          owner_user_id: 'user-1',
          participant_count: 1,
          pk: 'RECEIPT#receipt-1',
          receipt_id: 'receipt-1',
          receipt_occurred_at: '2026-04-20T18:00:00.000Z',
          sk: 'RECEIPT',
          status: 'OPEN',
          subtotal_cents: 1000,
          tax_cents: 0,
          tip_cents: 0,
          total_cents: 1000,
          updated_at: '2026-04-20T12:00:00.000Z',
          version: 3,
        },
        {
          created_at: '2026-04-20T12:00:00.000Z',
          display_name: 'Alex',
          participant_id: 'participant-1',
          pk: 'RECEIPT#receipt-1',
          sk: 'PARTICIPANT#participant-1',
          updated_at: '2026-04-20T12:00:00.000Z',
        },
      ],
    },
  };

  const result = resolver.response(ctx);

  assert.equal(result.paidParticipantCount, 0);
  assert.deepEqual(normalize(result.participants[0]), {
    createdAt: '2026-04-20T12:00:00.000Z',
    displayName: 'Alex',
    isPaid: false,
    notes: null,
    paidAt: null,
    participantId: 'participant-1',
    sortOrder: null,
    updatedAt: '2026-04-20T12:00:00.000Z',
  });
});

test('batchGetReceiptRoots preserves queried order', () => {
  const resolver = loadResolver('batch-get-receipt-roots.js.tftpl');
  const ctx = {
    identity: {
      sub: 'user-1',
    },
    result: {
      data: {
        '${table_name}': [
          {
            location_name: 'Second',
            merchant_name: 'B',
            owner_user_id: 'user-1',
            paid_participant_count: 2,
            participant_count: 3,
            receipt_id: 'receipt-2',
            receipt_occurred_at: '2026-04-20T20:00:00.000Z',
            status: 'OPEN',
            total_cents: 2000,
            updated_at: '2026-04-20T21:00:00.000Z',
          },
          {
            location_name: 'First',
            merchant_name: 'A',
            owner_user_id: 'user-1',
            paid_participant_count: 0,
            participant_count: 1,
            receipt_id: 'receipt-1',
            receipt_occurred_at: '2026-04-20T18:00:00.000Z',
            status: 'DRAFT',
            total_cents: 1000,
            updated_at: '2026-04-20T19:00:00.000Z',
          },
        ],
      },
    },
    stash: {
      listReceiptOrder: ['receipt-1', 'receipt-2'],
      listReceiptsNextToken: 'next-token',
      receiptRootKeys: [],
    },
  };

  const result = resolver.response(ctx);

  assert.deepEqual(normalize(result), {
    items: [
      {
        locationName: 'First',
        merchantName: 'A',
        paidParticipantCount: 0,
        participantCount: 1,
        receiptId: 'receipt-1',
        receiptOccurredAt: '2026-04-20T18:00:00.000Z',
        status: 'DRAFT',
        totalCents: 1000,
        updatedAt: '2026-04-20T19:00:00.000Z',
      },
      {
        locationName: 'Second',
        merchantName: 'B',
        paidParticipantCount: 2,
        participantCount: 3,
        receiptId: 'receipt-2',
        receiptOccurredAt: '2026-04-20T20:00:00.000Z',
        status: 'OPEN',
        totalCents: 2000,
        updatedAt: '2026-04-20T21:00:00.000Z',
      },
    ],
    nextToken: 'next-token',
  });
});
