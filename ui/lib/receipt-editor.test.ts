import { describe, expect, it } from "vitest"

import type { Receipt, ReceiptEditorState } from "./receipt-types"
import {
  buildReceiptSavePlan,
  getGroupItemShareDetails,
  getGroupShareSummaries,
  getReceiptTotalCents,
  mapReceiptToEditorState,
} from "./receipt-editor"

function createState(overrides?: Partial<ReceiptEditorState>): ReceiptEditorState {
  return {
    allocationPolicy: "PROPORTIONAL",
    capturedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
    currencyCode: "USD",
    discount: "0.00",
    fee: "0.00",
    groups: [
      {
        displayName: "Alex",
        id: "group-a",
        isPaid: false,
        notes: "",
        participantId: null,
      },
      {
        displayName: "Blair",
        id: "group-b",
        isPaid: false,
        notes: "",
        participantId: null,
      },
    ],
    items: [
      {
        category: "",
        description: "Item A",
        discount: "0.00",
        id: "item-a",
        itemId: null,
        quantity: "1",
        selectedGroupIds: ["group-a"],
        unitPrice: "10.00",
      },
      {
        category: "",
        description: "Item B",
        discount: "0.00",
        id: "item-b",
        itemId: null,
        quantity: "1",
        selectedGroupIds: ["group-b"],
        unitPrice: "20.00",
      },
    ],
    locationAddress: "",
    locationName: "",
    merchantName: "Test Receipt",
    receiptId: null,
    receiptOccurredAt: "2025-01-01T00:00",
    tax: "0.00",
    tip: "0.00",
    version: null,
    ...overrides,
  }
}

function createReceipt(overrides?: Partial<Receipt>): Receipt {
  return {
    allocationPolicy: "PROPORTIONAL",
    capturedAt: "2025-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    currencyCode: "USD",
    discountCents: 0,
    feeCents: 0,
    itemCount: 1,
    items: [
      {
        allocations: [
          {
            createdAt: "2025-01-01T00:00:00.000Z",
            itemId: "item-a",
            participantId: "participant-a",
            shareWeight: 1,
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        category: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        description: "Item A",
        discountCents: 0,
        itemId: "item-a",
        lineSubtotalCents: 1000,
        quantity: 1,
        scanConfidence: null,
        sourceLineNumber: null,
        unitPriceCents: 1000,
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    locationAddress: null,
    locationLat: null,
    locationLng: null,
    locationName: null,
    merchantName: "Test Receipt",
    ownerUserId: "user-1",
    paidParticipantCount: 0,
    participantCount: 1,
    participants: [
      {
        createdAt: "2025-01-01T00:00:00.000Z",
        displayName: "Alex",
        isPaid: false,
        notes: null,
        paidAt: null,
        participantId: "participant-a",
        sortOrder: 0,
        updatedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    receiptId: "receipt-1",
    receiptOccurredAt: "2025-01-01T00:00:00.000Z",
    subtotalCents: 1000,
    taxCents: 0,
    tipCents: 0,
    totalCents: 1000,
    updatedAt: "2025-01-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  }
}

describe("getGroupShareSummaries", () => {
  it("distributes tax proportionally to each group's item subtotal", () => {
    const summaries = getGroupShareSummaries(
      createState({
        tax: "3.00",
      }),
    )

    expect(summaries).toEqual([
      {
        amountCents: 1100,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-a",
        itemSubtotalCents: 1000,
        taxShareCents: 100,
        tipShareCents: 0,
      },
      {
        amountCents: 2200,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-b",
        itemSubtotalCents: 2000,
        taxShareCents: 200,
        tipShareCents: 0,
      },
    ])
  })

  it("includes tip, fees, and discount in the final all-in totals", () => {
    const summaries = getGroupShareSummaries(
      createState({
        discount: "3.00",
        fee: "1.50",
        tax: "3.00",
        tip: "6.00",
      }),
    )

    expect(summaries).toEqual([
      {
        amountCents: 1250,
        discountShareCents: -100,
        feeShareCents: 50,
        groupId: "group-a",
        itemSubtotalCents: 1000,
        taxShareCents: 100,
        tipShareCents: 200,
      },
      {
        amountCents: 2500,
        discountShareCents: -200,
        feeShareCents: 100,
        groupId: "group-b",
        itemSubtotalCents: 2000,
        taxShareCents: 200,
        tipShareCents: 400,
      },
    ])
  })

  it("uses shared item allocations as the weighting base before distributing adjustments", () => {
    const summaries = getGroupShareSummaries(
      createState({
        items: [
          {
            category: "",
            description: "Shared",
            discount: "0.00",
            id: "shared-item",
            itemId: null,
            quantity: "1",
            selectedGroupIds: ["group-a", "group-b"],
            unitPrice: "9.99",
          },
        ],
        tax: "1.00",
      }),
    )

    expect(summaries).toEqual([
      {
        amountCents: 550,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-a",
        itemSubtotalCents: 500,
        taxShareCents: 50,
        tipShareCents: 0,
      },
      {
        amountCents: 549,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-b",
        itemSubtotalCents: 499,
        taxShareCents: 50,
        tipShareCents: 0,
      },
    ])
  })

  it("reconciles rounding so distributed shares exactly match the receipt total", () => {
    const state = createState({
      discount: "0.01",
      fee: "0.01",
      tax: "0.01",
      tip: "0.01",
    })
    const summaries = getGroupShareSummaries(state)
    const totalFromSummaries = summaries.reduce((sum, summary) => sum + summary.amountCents, 0)

    expect(totalFromSummaries).toBe(getReceiptTotalCents(state))
    expect(summaries.reduce((sum, summary) => sum + summary.taxShareCents, 0)).toBe(1)
    expect(summaries.reduce((sum, summary) => sum + summary.tipShareCents, 0)).toBe(1)
    expect(summaries.reduce((sum, summary) => sum + summary.feeShareCents, 0)).toBe(1)
    expect(summaries.reduce((sum, summary) => sum + summary.discountShareCents, 0)).toBe(-1)
  })

  it("assigns a one-cent receipt discount to the largest proportional share", () => {
    const summaries = getGroupShareSummaries(
      createState({
        discount: "0.01",
      }),
    )

    expect(summaries).toEqual([
      {
        amountCents: 1000,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-a",
        itemSubtotalCents: 1000,
        taxShareCents: 0,
        tipShareCents: 0,
      },
      {
        amountCents: 1999,
        discountShareCents: -1,
        feeShareCents: 0,
        groupId: "group-b",
        itemSubtotalCents: 2000,
        taxShareCents: 0,
        tipShareCents: 0,
      },
    ])
  })

  it("falls back to an equal split of adjustments when subtotal is zero", () => {
    const summaries = getGroupShareSummaries(
      createState({
        items: [
          {
            category: "",
            description: "Comped A",
            discount: "10.00",
            id: "item-a",
            itemId: null,
            quantity: "1",
            selectedGroupIds: ["group-a"],
            unitPrice: "10.00",
          },
          {
            category: "",
            description: "Comped B",
            discount: "20.00",
            id: "item-b",
            itemId: null,
            quantity: "1",
            selectedGroupIds: ["group-b"],
            unitPrice: "20.00",
          },
        ],
        tax: "3.00",
      }),
    )

    expect(summaries).toEqual([
      {
        amountCents: 150,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-a",
        itemSubtotalCents: 0,
        taxShareCents: 150,
        tipShareCents: 0,
      },
      {
        amountCents: 150,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-b",
        itemSubtotalCents: 0,
        taxShareCents: 150,
        tipShareCents: 0,
      },
    ])
  })

  it("returns zero shares when no groups participate in any items", () => {
    const summaries = getGroupShareSummaries(
      createState({
        items: [
          {
            category: "",
            description: "Unassigned",
            discount: "0.00",
            id: "item-a",
            itemId: null,
            quantity: "1",
            selectedGroupIds: [],
            unitPrice: "10.00",
          },
        ],
        tax: "3.00",
      }),
    )

    expect(summaries).toEqual([
      {
        amountCents: 0,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-a",
        itemSubtotalCents: 0,
        taxShareCents: 0,
        tipShareCents: 0,
      },
      {
        amountCents: 0,
        discountShareCents: 0,
        feeShareCents: 0,
        groupId: "group-b",
        itemSubtotalCents: 0,
        taxShareCents: 0,
        tipShareCents: 0,
      },
    ])
  })
})

describe("payment state editor mapping", () => {
  it("maps receipt participant paid state into editable groups", () => {
    const editorState = mapReceiptToEditorState(
      createReceipt({
        paidParticipantCount: 1,
        participants: [
          {
            createdAt: "2025-01-01T00:00:00.000Z",
            displayName: "Alex",
            isPaid: true,
            notes: null,
            paidAt: "2025-01-01T01:00:00.000Z",
            participantId: "participant-a",
            sortOrder: 0,
            updatedAt: "2025-01-01T01:00:00.000Z",
          },
        ],
      }),
    )

    expect(editorState.groups).toEqual([
      {
        displayName: "Alex",
        id: "participant-a",
        isPaid: true,
        notes: "",
        participantId: "participant-a",
      },
    ])
  })
})

describe("buildReceiptSavePlan", () => {
  it("marks participant save when paid state changes", () => {
    const receipt = createReceipt()
    const state = mapReceiptToEditorState(receipt)

    state.groups = state.groups.map((group) =>
      group.participantId === "participant-a"
        ? { ...group, isPaid: true }
        : group,
    )

    expect(buildReceiptSavePlan(state, receipt)).toMatchObject({
      saveParticipantCount: 1,
    })
  })
})

describe("getGroupItemShareDetails", () => {
  it("returns per-group item rows with ratio and distributed cost", () => {
    const details = getGroupItemShareDetails(
      createState({
        items: [
          {
            category: "",
            description: "Fries",
            discount: "0.00",
            id: "item-fries",
            itemId: null,
            quantity: "1",
            selectedGroupIds: ["group-a", "group-b"],
            unitPrice: "3.99",
          },
          {
            category: "",
            description: "Burger",
            discount: "0.00",
            id: "item-burger",
            itemId: null,
            quantity: "1",
            selectedGroupIds: ["group-a"],
            unitPrice: "5.00",
          },
        ],
      }),
    )

    expect(details).toEqual([
      {
        description: "Fries",
        groupId: "group-a",
        itemId: "item-fries",
        lineSubtotalCents: 399,
        ratioLabel: "1/2",
        shareCents: 200,
      },
      {
        description: "Fries",
        groupId: "group-b",
        itemId: "item-fries",
        lineSubtotalCents: 399,
        ratioLabel: "1/2",
        shareCents: 199,
      },
      {
        description: "Burger",
        groupId: "group-a",
        itemId: "item-burger",
        lineSubtotalCents: 500,
        ratioLabel: "1/1",
        shareCents: 500,
      },
    ])
  })
})
