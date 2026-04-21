import { describe, expect, it, vi } from "vitest"

import {
  buildReceiptParseMessage,
  createReceiptIngestionClient,
  mapReceiptParseResponseToEditorState,
  prepareReceiptUploadWithCodec,
  ReceiptIngestionError,
  type ReceiptParseResponse,
} from "./receipt-ingestion"

const MAX_UPLOAD_BYTES = 4_194_304

function createParsePayload(
  overrides: Partial<ReceiptParseResponse> = {},
): ReceiptParseResponse {
  return {
    createReceiptInputDraft: {
      allocationPolicy: "EVEN",
      capturedAt: "2026-04-19T22:41:00.000Z",
      currencyCode: "usd",
      discountCents: 125,
      feeCents: 75,
      locationAddress: "123 Market Street",
      locationLat: null,
      locationLng: null,
      locationName: "Downtown",
      merchantName: "Bodega Club",
      receiptOccurredAt: "2026-04-19T22:30:00.000Z",
      subtotalCents: 2_150,
      taxCents: 180,
      tipCents: 420,
      totalCents: 2_700,
    },
    issues: [],
    needsReview: false,
    parser: {
      inputTokens: 120,
      modelId: "gemini-test",
      outputTokens: 80,
      provider: "gemini-developer-api",
    },
    upsertReceiptItemInputDrafts: [
      {
        category: "Food",
        description: "Pasta",
        discountCents: 0,
        lineSubtotalCents: 1_250,
        quantity: 1,
        scanConfidence: 0.97,
        sourceLineNumber: 1,
        unitPriceCents: 1_250,
      },
      {
        category: null,
        description: "Lemonade",
        discountCents: 25,
        lineSubtotalCents: 900,
        quantity: 2,
        scanConfidence: 0.84,
        sourceLineNumber: 2,
        unitPriceCents: null,
      },
    ],
    ...overrides,
  }
}

describe("prepareReceiptUploadWithCodec", () => {
  it("keeps a supported image unchanged when already under the limit", async () => {
    const file = new File([new Uint8Array(128)], "receipt.jpg", {
      type: "image/jpeg",
    })
    const codec = {
      decode: vi.fn(),
      encode: vi.fn(),
    }

    const result = await prepareReceiptUploadWithCodec(file, codec)

    expect(result.file).toBe(file)
    expect(result.mimeType).toBe("image/jpeg")
    expect(codec.decode).not.toHaveBeenCalled()
  })

  it("transcodes an unsupported image format into a JPEG upload", async () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 32)], "receipt.heic", {
      type: "image/heic",
    })
    const codec = {
      decode: vi.fn().mockResolvedValue({
        height: 3000,
        width: 2400,
      }),
      encode: vi.fn().mockResolvedValue(
        new Blob([new Uint8Array(512_000)], { type: "image/jpeg" }),
      ),
    }

    const result = await prepareReceiptUploadWithCodec(file, codec)

    expect(result.mimeType).toBe("image/jpeg")
    expect(result.file.type).toBe("image/jpeg")
    expect(result.file.name).toBe("receipt.jpg")
    expect(codec.decode).toHaveBeenCalledOnce()
    expect(codec.encode).toHaveBeenCalled()
  })

  it("fails when an image cannot be compressed below the API limit", async () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 16)], "receipt.png", {
      type: "image/png",
    })
    const codec = {
      decode: vi.fn().mockResolvedValue({
        height: 4000,
        width: 3000,
      }),
      encode: vi.fn().mockResolvedValue(
        new Blob([new Uint8Array(MAX_UPLOAD_BYTES + 1)], { type: "image/jpeg" }),
      ),
    }

    await expect(prepareReceiptUploadWithCodec(file, codec)).rejects.toMatchObject({
      code: "payload-too-large",
    })
  })

  it("rejects files the browser codec cannot decode", async () => {
    const file = new File([new Uint8Array(256)], "receipt.txt", {
      type: "text/plain",
    })
    const codec = {
      decode: vi.fn().mockRejectedValue(new Error("decode failed")),
      encode: vi.fn(),
    }

    await expect(prepareReceiptUploadWithCodec(file, codec)).rejects.toMatchObject({
      code: "unsupported-type",
    })
  })
})

describe("mapReceiptParseResponseToEditorState", () => {
  it("hydrates a parsed draft into the existing receipt editor shape", () => {
    const editorState = mapReceiptParseResponseToEditorState(createParsePayload())

    expect(editorState.receiptId).toBeNull()
    expect(editorState.version).toBeNull()
    expect(editorState.allocationPolicy).toBe("EVEN")
    expect(editorState.merchantName).toBe("Bodega Club")
    expect(editorState.currencyCode).toBe("USD")
    expect(editorState.locationName).toBe("Downtown")
    expect(editorState.groups).toHaveLength(1)
    expect(editorState.groups[0]?.displayName).toBe("Payer")
    expect(editorState.items).toHaveLength(2)
    expect(editorState.items[0]?.selectedGroupIds).toEqual([
      editorState.groups[0]?.id,
    ])
    expect(editorState.items[1]?.unitPrice).toBe("4.50")
    expect(editorState.discount).toBe("1.25")
    expect(editorState.tax).toBe("1.80")
    expect(editorState.tip).toBe("4.20")
    expect(editorState.fee).toBe("0.75")
  })

  it("handles sparse parse payloads without breaking the editor defaults", () => {
    const editorState = mapReceiptParseResponseToEditorState(
      createParsePayload({
        createReceiptInputDraft: {
          allocationPolicy: "EVEN",
          capturedAt: null,
          currencyCode: null,
          discountCents: null,
          feeCents: null,
          locationAddress: null,
          locationLat: null,
          locationLng: null,
          locationName: null,
          merchantName: null,
          receiptOccurredAt: null,
          subtotalCents: null,
          taxCents: null,
          tipCents: null,
          totalCents: null,
        },
        upsertReceiptItemInputDrafts: [],
      }),
    )

    expect(editorState.currencyCode).toBe("USD")
    expect(editorState.merchantName).toBe("")
    expect(editorState.items).toHaveLength(1)
    expect(editorState.groups).toHaveLength(1)
    expect(editorState.receiptOccurredAt).not.toBe("")
  })
})

describe("createReceiptIngestionClient", () => {
  it("returns a config error when the parse API URL is missing", async () => {
    const client = createReceiptIngestionClient({
      parseApiUrl: null,
      prepareReceiptUpload: vi.fn(),
    })

    await expect(
      client.parseReceiptImage(
        new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({
      code: "config",
    })
  })

  it("returns an unauthorized error when there is no access token", async () => {
    const client = createReceiptIngestionClient({
      getAuthToken: vi.fn().mockResolvedValue(null),
      parseApiUrl: "https://example.com/receipts/parse",
      prepareReceiptUpload: vi.fn().mockResolvedValue({
        file: new File([new Uint8Array(32)], "receipt.jpg", {
          type: "image/jpeg",
        }),
        mimeType: "image/jpeg",
      }),
    })

    await expect(
      client.parseReceiptImage(
        new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({
      code: "unauthorized",
    })
  })

  it("maps API status codes into UI-safe ingestion errors", async () => {
    const parseApiUrl = "https://example.com/receipts/parse"
    const prepareReceiptUpload = vi.fn().mockResolvedValue({
      file: new File([new Uint8Array(32)], "receipt.jpg", {
        type: "image/jpeg",
      }),
      mimeType: "image/jpeg" as const,
    })

    const createClient = (status: number, message: string) =>
      createReceiptIngestionClient({
        fetchImpl: vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ message }), { status }),
        ),
        getAuthToken: vi.fn().mockResolvedValue("token"),
        parseApiUrl,
        prepareReceiptUpload,
      })

    await expect(
      createClient(413, "too large").parseReceiptImage(
        new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({ code: "payload-too-large" })

    await expect(
      createClient(415, "bad type").parseReceiptImage(
        new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({ code: "unsupported-type" })

    await expect(
      createClient(422, "needs review").parseReceiptImage(
        new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({ code: "validation" })
  })

  it("rejects malformed success payloads", async () => {
    const client = createReceiptIngestionClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
      getAuthToken: vi.fn().mockResolvedValue("token"),
      parseApiUrl: "https://example.com/receipts/parse",
      prepareReceiptUpload: vi.fn().mockResolvedValue({
        file: new File([new Uint8Array(32)], "receipt.jpg", {
          type: "image/jpeg",
        }),
        mimeType: "image/jpeg",
      }),
    })

    await expect(
      client.parseReceiptImage(
        new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({
      code: "response",
    })
  })

  it("returns a validated parse payload on success", async () => {
    const payload = createParsePayload({
      issues: ["Check the tip line."],
      needsReview: true,
    })
    const client = createReceiptIngestionClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), { status: 200 }),
      ),
      getAuthToken: vi.fn().mockResolvedValue("token"),
      parseApiUrl: "https://example.com/receipts/parse",
      prepareReceiptUpload: vi.fn().mockResolvedValue({
        file: new File([new Uint8Array(32)], "receipt.jpg", {
          type: "image/jpeg",
        }),
        mimeType: "image/jpeg",
      }),
    })

    const result = await client.parseReceiptImage(
      new File([new Uint8Array(1)], "receipt.jpg", { type: "image/jpeg" }),
    )

    expect(result).toEqual(payload)
    expect(buildReceiptParseMessage(result)).toBe(
      "Review the parsed draft before saving.",
    )
  })
})

describe("ReceiptIngestionError", () => {
  it("preserves the error code for UI branching", () => {
    const error = new ReceiptIngestionError("bad request", "validation")

    expect(error.code).toBe("validation")
    expect(error.message).toBe("bad request")
  })
})
