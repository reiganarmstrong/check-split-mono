import { describe, expect, it } from "vitest"

import {
  buildReceiptSummaryShareData,
  buildReceiptSummaryShareFilename,
} from "./receipt-summary-share"

describe("buildReceiptSummaryShareFilename", () => {
  it("slugifies merchant name and appends receipt date", () => {
    expect(
      buildReceiptSummaryShareFilename(
        "Cafe de l'Opera & Bar",
        "2026-04-15T18:30:00.000Z",
      ),
    ).toBe("cafe-de-l-opera-bar-summary-2026-04-15.jpeg")
  })

  it("falls back when merchant or date are missing", () => {
    expect(buildReceiptSummaryShareFilename("   ", "bad-date")).toBe(
      "receipt-summary-summary.jpeg",
    )
  })
})

describe("buildReceiptSummaryShareData", () => {
  it("preserves per-group values and falls back unnamed groups", () => {
    const data = buildReceiptSummaryShareData({
      discountLabel: "-$2.00",
      feeLabel: "$1.00",
      groups: [
        {
          amountLabel: "$12.50",
          amountValue: 1250,
          discountLabel: "-$0.50",
          feeLabel: "$0.25",
          groupDisplayName: "",
          isPaid: true,
          itemDetails: [
            {
              amountLabel: "$5.00",
              description: "Burger",
              ratioLabel: "1/2",
              subtotalLabel: "$10.00",
            },
          ],
          itemsLabel: "$10.00",
          taxLabel: "$1.25",
          tipLabel: "$1.50",
        },
      ],
      locationName: " Downtown ",
      merchantName: "  Harbor House  ",
      receiptOccurredAt: "2026-04-15T18:30",
      subtotalLabel: "$10.00",
      taxLabel: "$1.25",
      tipLabel: "$1.50",
      totalLabel: "$12.50",
    })

    expect(data).toEqual({
      discountLabel: "-$2.00",
      feeLabel: "$1.00",
      groups: [
        {
          amountLabel: "$12.50",
          amountValue: 1250,
          discountLabel: "-$0.50",
          feeLabel: "$0.25",
          groupName: "Untitled group",
          isPaid: true,
          itemDetails: [
            {
              amountLabel: "$5.00",
              description: "Burger",
              ratioLabel: "1/2",
              subtotalLabel: "$10.00",
            },
          ],
          itemsLabel: "$10.00",
          taxLabel: "$1.25",
          tipLabel: "$1.50",
        },
      ],
      locationName: "Downtown",
      merchantName: "Harbor House",
      paidGroupCount: 1,
      receiptOccurredAt: "2026-04-15T18:30",
      subtotalLabel: "$10.00",
      taxLabel: "$1.25",
      tipLabel: "$1.50",
      totalLabel: "$12.50",
      unpaidGroupCount: 0,
    })
  })

  it("sorts unpaid groups first, then highest amount due", () => {
    const data = buildReceiptSummaryShareData({
      discountLabel: "$0.00",
      feeLabel: "$0.00",
      groups: [
        {
          amountLabel: "$4.33",
          amountValue: 433,
          discountLabel: "$0.00",
          feeLabel: "$0.00",
          groupDisplayName: "Paid low",
          isPaid: true,
          itemDetails: [],
          itemsLabel: "$4.33",
          taxLabel: "$0.00",
          tipLabel: "$0.00",
        },
        {
          amountLabel: "$32.36",
          amountValue: 3236,
          discountLabel: "$0.00",
          feeLabel: "$0.00",
          groupDisplayName: "Unpaid high",
          isPaid: false,
          itemDetails: [],
          itemsLabel: "$32.36",
          taxLabel: "$0.00",
          tipLabel: "$0.00",
        },
        {
          amountLabel: "$1.99",
          amountValue: 199,
          discountLabel: "$0.00",
          feeLabel: "$0.00",
          groupDisplayName: "Paid lower",
          isPaid: true,
          itemDetails: [],
          itemsLabel: "$1.99",
          taxLabel: "$0.00",
          tipLabel: "$0.00",
        },
        {
          amountLabel: "$7.00",
          amountValue: 700,
          discountLabel: "$0.00",
          feeLabel: "$0.00",
          groupDisplayName: "Unpaid lower",
          isPaid: false,
          itemDetails: [],
          itemsLabel: "$7.00",
          taxLabel: "$0.00",
          tipLabel: "$0.00",
        },
      ],
      locationName: "",
      merchantName: "Market",
      receiptOccurredAt: "2026-04-15T18:30",
      subtotalLabel: "$45.68",
      taxLabel: "$0.00",
      tipLabel: "$0.00",
      totalLabel: "$45.68",
    })

    expect(data.groups.map((group) => group.groupName)).toEqual([
      "Unpaid high",
      "Unpaid lower",
      "Paid low",
      "Paid lower",
    ])
  })
})
