import { formatCurrency, formatReceiptDate } from "./receipt-editor"
import type { ReceiptListItem } from "./receipt-types"

export function getReceiptPaymentState(receipt: ReceiptListItem) {
  if (
    receipt.participantCount > 0 &&
    receipt.paidParticipantCount === receipt.participantCount
  ) {
    return "paid"
  }

  return "unpaid"
}

export function getPaymentProgressLabel(receipt: ReceiptListItem) {
  if (receipt.participantCount === 0) {
    return "No groups"
  }

  if (receipt.paidParticipantCount === receipt.participantCount) {
    return "All groups paid"
  }

  return `${receipt.paidParticipantCount} of ${receipt.participantCount} paid`
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function getTokenDistance(left: string, right: string) {
  if (left === right) {
    return 0
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = Array.from({ length: right.length + 1 }, () => 0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1

      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost,
      )
    }

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index]
    }
  }

  return previous[right.length]
}

function isSubsequence(needle: string, haystack: string) {
  let needleIndex = 0

  for (const character of haystack) {
    if (character === needle[needleIndex]) {
      needleIndex += 1
    }

    if (needleIndex === needle.length) {
      return true
    }
  }

  return false
}

function getAllowedTokenDistance(token: string) {
  if (token.length >= 7) {
    return 2
  }

  if (token.length >= 4) {
    return 1
  }

  return 0
}

function tokenMatchesWord(token: string, word: string) {
  if (word.includes(token) || (word.length >= 4 && token.includes(word))) {
    return true
  }

  if (token.length < 4 || word.length < 4) {
    return false
  }

  const allowedDistance = getAllowedTokenDistance(token)

  if (
    Math.abs(token.length - word.length) <= allowedDistance &&
    getTokenDistance(token, word) <= allowedDistance
  ) {
    return true
  }

  return isSubsequence(token, word) && token.length / word.length >= 0.6
}

function fuzzyIncludes(searchText: string, token: string) {
  if (searchText.includes(token)) {
    return true
  }

  const compactSearchText = searchText.replace(/\s+/g, "")
  const compactToken = token.replace(/\s+/g, "")

  if (compactSearchText.includes(compactToken)) {
    return true
  }

  return searchText
    .split(" ")
    .some((word) => tokenMatchesWord(token, word))
}

export function getReceiptArchiveSearchFields(receipt: ReceiptListItem) {
  return [
    getReceiptPaymentState(receipt),
    getPaymentProgressLabel(receipt),
    receipt.merchantName,
    receipt.locationName ?? "",
    formatReceiptDate(receipt.receiptOccurredAt),
    formatCurrency(receipt.totalCents),
    `Updated ${formatReceiptDate(receipt.updatedAt)}`,
  ]
}

export function receiptMatchesArchiveSearch(
  receipt: ReceiptListItem,
  query: string,
) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean)

  if (tokens.length === 0) {
    return true
  }

  const searchText = normalizeSearchText(
    getReceiptArchiveSearchFields(receipt).join(" "),
  )

  return tokens.every((token) => fuzzyIncludes(searchText, token))
}
