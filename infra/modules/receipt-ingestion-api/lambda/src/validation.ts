import type {
  CreateReceiptInputDraft,
  ModelReceiptParseResponse,
  UpsertReceiptItemInputDraft,
} from "./schema"

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
}

function isNullableInteger(value: unknown) {
  return value === null || isInteger(value)
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isNullableNumber(value: unknown) {
  return value === null || isNumber(value)
}

function isNullableString(value: unknown) {
  return value === null || typeof value === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validateCreateReceiptInputDraft(value: unknown): value is CreateReceiptInputDraft {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.allocationPolicy === "EVEN" &&
    isNullableString(value.capturedAt) &&
    isNullableString(value.currencyCode) &&
    isNullableInteger(value.discountCents) &&
    isNullableInteger(value.feeCents) &&
    isNullableString(value.locationAddress) &&
    isNullableNumber(value.locationLat) &&
    isNullableNumber(value.locationLng) &&
    isNullableString(value.locationName) &&
    isNullableString(value.merchantName) &&
    isNullableString(value.receiptOccurredAt) &&
    value.status === "DRAFT" &&
    isNullableInteger(value.subtotalCents) &&
    isNullableInteger(value.taxCents) &&
    isNullableInteger(value.tipCents) &&
    isNullableInteger(value.totalCents)
  )
}

function validateReceiptItemDraft(value: unknown): value is UpsertReceiptItemInputDraft {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNullableString(value.category) &&
    typeof value.description === "string" &&
    value.description.trim().length > 0 &&
    isInteger(value.discountCents) &&
    isNullableInteger(value.lineSubtotalCents) &&
    isInteger(value.quantity) &&
    value.quantity >= 1 &&
    (value.scanConfidence === null ||
      (isNumber(value.scanConfidence) && value.scanConfidence >= 0 && value.scanConfidence <= 1)) &&
    (value.sourceLineNumber === null ||
      (isInteger(value.sourceLineNumber) && value.sourceLineNumber >= 1)) &&
    isNullableInteger(value.unitPriceCents)
  )
}

export function validateModelReceiptParseResponse(
  value: unknown,
): { error?: string; value?: ModelReceiptParseResponse } {
  if (!isRecord(value)) {
    return { error: "Model response is not a JSON object." }
  }

  if (!validateCreateReceiptInputDraft(value.createReceiptInputDraft)) {
    return { error: "createReceiptInputDraft is missing required fields or has invalid values." }
  }

  if (!Array.isArray(value.upsertReceiptItemInputDrafts)) {
    return { error: "upsertReceiptItemInputDrafts must be an array." }
  }

  if (!value.upsertReceiptItemInputDrafts.every(validateReceiptItemDraft)) {
    return { error: "One or more receipt item drafts are invalid." }
  }

  if (!Array.isArray(value.issues) || !value.issues.every((issue) => typeof issue === "string")) {
    return { error: "issues must be an array of strings." }
  }

  if (typeof value.needsReview !== "boolean") {
    return { error: "needsReview must be a boolean." }
  }

  return {
    value: {
      createReceiptInputDraft: value.createReceiptInputDraft,
      issues: value.issues,
      needsReview: value.needsReview,
      upsertReceiptItemInputDrafts: value.upsertReceiptItemInputDrafts,
    },
  }
}

export function normalizeNeedsReview(response: ModelReceiptParseResponse): ModelReceiptParseResponse {
  const hasLowConfidenceItem = response.upsertReceiptItemInputDrafts.some((item) => {
    return item.scanConfidence !== null && item.scanConfidence < 0.8
  })

  return {
    ...response,
    needsReview: response.needsReview || response.issues.length > 0 || hasLowConfidenceItem,
  }
}
