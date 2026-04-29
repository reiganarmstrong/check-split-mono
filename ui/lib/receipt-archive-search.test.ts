import { describe, expect, it } from "vitest"

import {
  getPaymentProgressLabel,
  getReceiptPaymentState,
  receiptMatchesArchiveSearch,
} from "./receipt-archive-search"
import type { ReceiptListItem } from "./receipt-types"

const receipt: ReceiptListItem = {
  locationName: "Brooklyn Heights",
  merchantName: "Saffron Table",
  paidParticipantCount: 1,
  participantCount: 3,
  receiptId: "receipt-1",
  receiptOccurredAt: "2026-02-14T18:30:00.000Z",
  totalCents: 8675,
  updatedAt: "2026-02-16T12:00:00.000Z",
}

describe("receipt archive search", () => {
  it("keeps payment labels shared with archive rows", () => {
    expect(getReceiptPaymentState(receipt)).toBe("unpaid")
    expect(getPaymentProgressLabel(receipt)).toBe("1 of 3 paid")
  })

  it("matches fuzzy merchant and location queries", () => {
    expect(receiptMatchesArchiveSearch(receipt, "safron")).toBe(true)
    expect(receiptMatchesArchiveSearch(receipt, "brklyn hghts")).toBe(true)
  })

  it("matches visible status, date, progress, and total values", () => {
    expect(receiptMatchesArchiveSearch(receipt, "unpaid")).toBe(true)
    expect(receiptMatchesArchiveSearch(receipt, "1 of 3")).toBe(true)
    expect(receiptMatchesArchiveSearch(receipt, "Feb 14")).toBe(true)
    expect(receiptMatchesArchiveSearch(receipt, "$86.75")).toBe(true)
    expect(receiptMatchesArchiveSearch(receipt, "updated feb 16")).toBe(true)
  })

  it("does not match unrelated queries", () => {
    expect(receiptMatchesArchiveSearch(receipt, "coffee")).toBe(false)
  })
})
