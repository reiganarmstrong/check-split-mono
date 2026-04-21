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
          discountLabel: "-$0.50",
          feeLabel: "$0.25",
          groupDisplayName: "",
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
          discountLabel: "-$0.50",
          feeLabel: "$0.25",
          groupName: "Untitled group",
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
      receiptOccurredAt: "2026-04-15T18:30",
      subtotalLabel: "$10.00",
      taxLabel: "$1.25",
      tipLabel: "$1.50",
      totalLabel: "$12.50",
    })
  })
})
