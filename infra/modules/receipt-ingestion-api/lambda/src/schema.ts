export type AllocationPolicy = "EVEN"
export type ReceiptStatus = "DRAFT"

export type CreateReceiptInputDraft = {
  allocationPolicy: AllocationPolicy
  capturedAt: string | null
  currencyCode: string | null
  discountCents: number | null
  feeCents: number | null
  locationAddress: string | null
  locationLat: number | null
  locationLng: number | null
  locationName: string | null
  merchantName: string | null
  receiptOccurredAt: string | null
  status: ReceiptStatus
  subtotalCents: number | null
  taxCents: number | null
  tipCents: number | null
  totalCents: number | null
}

export type UpsertReceiptItemInputDraft = {
  category: string | null
  description: string
  discountCents: number
  lineSubtotalCents: number | null
  quantity: number
  scanConfidence: number | null
  sourceLineNumber: number | null
  unitPriceCents: number | null
}

export type ModelReceiptParseResponse = {
  createReceiptInputDraft: CreateReceiptInputDraft
  issues: string[]
  needsReview: boolean
  upsertReceiptItemInputDrafts: UpsertReceiptItemInputDraft[]
}

export type ReceiptParseResponse = ModelReceiptParseResponse & {
  parser: {
    inputTokens: number
    modelId: string
    outputTokens: number
    provider: "gemini-developer-api"
  }
}

export const receiptDraftResponseJsonSchema = {
  additionalProperties: false,
  properties: {
    createReceiptInputDraft: {
      additionalProperties: false,
      properties: {
        allocationPolicy: {
          description: "Always EVEN for this receipt parsing draft workflow.",
          enum: ["EVEN"],
          type: "string",
        },
        capturedAt: {
          description: "RFC 3339 timestamp when the receipt was captured, if confidently visible.",
          format: "date-time",
          type: ["string", "null"],
        },
        currencyCode: {
          description: "Three-letter ISO currency code only when clearly supported by the receipt.",
          type: ["string", "null"],
        },
        discountCents: {
          description: "Receipt-level discount in integer cents.",
          type: ["integer", "null"],
        },
        feeCents: {
          description: "Receipt-level fee in integer cents.",
          type: ["integer", "null"],
        },
        locationAddress: {
          description: "Street address shown on the receipt, if visible.",
          type: ["string", "null"],
        },
        locationLat: {
          description: "Latitude if the receipt explicitly shows coordinates.",
          type: ["number", "null"],
        },
        locationLng: {
          description: "Longitude if the receipt explicitly shows coordinates.",
          type: ["number", "null"],
        },
        locationName: {
          description: "Branch or venue name if distinct from the merchant name.",
          type: ["string", "null"],
        },
        merchantName: {
          description: "Merchant or store name taken directly from the receipt.",
          type: ["string", "null"],
        },
        receiptOccurredAt: {
          description: "RFC 3339 timestamp for when the receipt transaction occurred, if confidently visible.",
          format: "date-time",
          type: ["string", "null"],
        },
        status: {
          description: "Always DRAFT for this workflow.",
          enum: ["DRAFT"],
          type: "string",
        },
        subtotalCents: {
          description: "Subtotal in integer cents.",
          type: ["integer", "null"],
        },
        taxCents: {
          description: "Tax total in integer cents.",
          type: ["integer", "null"],
        },
        tipCents: {
          description: "Tip total in integer cents.",
          type: ["integer", "null"],
        },
        totalCents: {
          description: "Grand total in integer cents.",
          type: ["integer", "null"],
        },
      },
      required: [
        "allocationPolicy",
        "capturedAt",
        "currencyCode",
        "discountCents",
        "feeCents",
        "locationAddress",
        "locationLat",
        "locationLng",
        "locationName",
        "merchantName",
        "receiptOccurredAt",
        "status",
        "subtotalCents",
        "taxCents",
        "tipCents",
        "totalCents",
      ],
      type: "object",
    },
    issues: {
      description: "Short explanations of any ambiguity, missing data, or suspected OCR problems.",
      items: {
        type: "string",
      },
      type: "array",
    },
    needsReview: {
      description: "Whether a human should review the parsed receipt before persisting it.",
      type: "boolean",
    },
    upsertReceiptItemInputDrafts: {
      description: "Line-item drafts extracted from the receipt.",
      items: {
        additionalProperties: false,
        properties: {
          category: {
            description: "Optional item category when visible or strongly implied by the receipt.",
            type: ["string", "null"],
          },
          description: {
            description: "Short item description copied from the receipt text.",
            type: "string",
          },
          discountCents: {
            description: "Line-item discount in integer cents. Use zero when no item-level discount is shown.",
            type: "integer",
          },
          lineSubtotalCents: {
            description: "Item subtotal in integer cents if shown or reliably derived from the receipt line.",
            type: ["integer", "null"],
          },
          quantity: {
            description: "Integer quantity for the line item.",
            minimum: 1,
            type: "integer",
          },
          scanConfidence: {
            description: "Confidence score between 0 and 1 for the line extraction.",
            maximum: 1,
            minimum: 0,
            type: ["number", "null"],
          },
          sourceLineNumber: {
            description: "Visible line order on the receipt when available.",
            minimum: 1,
            type: ["integer", "null"],
          },
          unitPriceCents: {
            description: "Unit price in integer cents if shown or confidently derived.",
            type: ["integer", "null"],
          },
        },
        required: [
          "category",
          "description",
          "discountCents",
          "lineSubtotalCents",
          "quantity",
          "scanConfidence",
          "sourceLineNumber",
          "unitPriceCents",
        ],
        type: "object",
      },
      type: "array",
    },
  },
  required: [
    "createReceiptInputDraft",
    "issues",
    "needsReview",
    "upsertReceiptItemInputDrafts",
  ],
  type: "object",
} as const
