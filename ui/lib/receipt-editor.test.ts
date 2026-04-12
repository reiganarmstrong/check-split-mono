import { describe, expect, it } from "vitest"

import type { ReceiptEditorState } from "./receipt-types"
import { getGroupShareSummaries, getReceiptTotalCents } from "./receipt-editor"

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
        notes: "",
        participantId: null,
      },
      {
        displayName: "Blair",
        id: "group-b",
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
    status: "DRAFT",
    tax: "0.00",
    tip: "0.00",
    version: null,
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
