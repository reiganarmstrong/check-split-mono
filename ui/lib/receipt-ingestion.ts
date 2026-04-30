import { fetchAuthSession } from "aws-amplify/auth"
import { z } from "zod"

import {
  configureAmplifyAuth,
  getReceiptParseApiUrl,
  hasAmplifyAuthConfig,
  hasReceiptParseConfig,
} from "./amplify-auth"
import {
  centsToInputValue,
  createEditableItem,
  createEmptyReceiptEditorState,
  normalizeDateTimeInput,
} from "./receipt-editor"
import type { ReceiptEditorState } from "./receipt-types"

const RECEIPT_PARSE_MAX_UPLOAD_BYTES = 4_194_304
const RECEIPT_PARSE_SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png"] as const
const RECEIPT_UPLOAD_ACCEPTED_FILE_TYPES = "JPEG, PNG, or HEIC"
const RECEIPT_PARSE_SUPPORTED_HEIC_MIME_TYPES = [
  "image/heic",
  "image/heif",
] as const

type ReceiptParseSupportedMimeType =
  (typeof RECEIPT_PARSE_SUPPORTED_MIME_TYPES)[number]

type ReceiptImageCodec<
  TDecodedImage extends { height: number; width: number },
> = {
  decode: (file: File) => Promise<TDecodedImage>
  encode: (
    decodedImage: TDecodedImage,
    options: {
      height: number
      mimeType: ReceiptParseSupportedMimeType
      quality?: number
      width: number
    },
  ) => Promise<Blob | null>
  transcodeHeicToJpeg?: (file: File) => Promise<Blob>
}

type PreparedReceiptUpload = {
  file: File
  mimeType: ReceiptParseSupportedMimeType
}

type ReceiptParserMetadata = {
  inputTokens: number
  modelId: string
  outputTokens: number
  provider: "gemini-developer-api"
}

type ReceiptIngestionDependencies = {
  fetchImpl?: typeof fetch
  getAuthToken?: () => Promise<string | null>
  parseApiUrl?: string | null
  prepareReceiptUpload?: (file: File) => Promise<PreparedReceiptUpload>
}

const createReceiptInputDraftSchema = z.object({
  allocationPolicy: z.enum(["EVEN"]),
  capturedAt: z.string().nullable(),
  currencyCode: z.string().nullable(),
  discountCents: z.number().int().nullable(),
  feeCents: z.number().int().nullable(),
  locationAddress: z.string().nullable(),
  locationLat: z.number().nullable(),
  locationLng: z.number().nullable(),
  locationName: z.string().nullable(),
  merchantName: z.string().nullable(),
  receiptOccurredAt: z.string().nullable(),
  subtotalCents: z.number().int().nullable(),
  taxCents: z.number().int().nullable(),
  tipCents: z.number().int().nullable(),
  totalCents: z.number().int().nullable(),
})

const upsertReceiptItemInputDraftSchema = z.object({
  category: z.string().nullable(),
  description: z.string(),
  discountCents: z.number().int(),
  lineSubtotalCents: z.number().int().nullable(),
  quantity: z.number().int().min(1),
  scanConfidence: z.number().min(0).max(1).nullable(),
  sourceLineNumber: z.number().int().nullable(),
  unitPriceCents: z.number().int().nullable(),
})

export const receiptParseResponseSchema = z.object({
  createReceiptInputDraft: createReceiptInputDraftSchema,
  issues: z.array(z.string()),
  needsReview: z.boolean(),
  parser: z.object({
    inputTokens: z.number().int(),
    modelId: z.string(),
    outputTokens: z.number().int(),
    provider: z.literal("gemini-developer-api"),
  }),
  upsertReceiptItemInputDrafts: z.array(upsertReceiptItemInputDraftSchema),
})

export type ReceiptParseResponse = z.infer<typeof receiptParseResponseSchema>

export class ReceiptIngestionError extends Error {
  code:
    | "config"
    | "network"
    | "payload-too-large"
    | "response"
    | "unauthorized"
    | "unsupported-type"
    | "validation"

  constructor(message: string, code: ReceiptIngestionError["code"]) {
    super(message)
    this.code = code
  }
}

function trimToNull(value: string | null | undefined) {
  const normalized = value?.trim() ?? ""
  return normalized.length > 0 ? normalized : null
}

function centsToEditorMoney(value: number | null | undefined) {
  return centsToInputValue(value ?? 0)
}

function getReceiptOccurredAt(
  createReceiptInputDraft: ReceiptParseResponse["createReceiptInputDraft"],
) {
  return normalizeDateTimeInput(
    createReceiptInputDraft.receiptOccurredAt ??
      createReceiptInputDraft.capturedAt ??
      new Date().toISOString(),
  )
}

function getUnitPriceCents(
  item: ReceiptParseResponse["upsertReceiptItemInputDrafts"][number],
) {
  if (item.unitPriceCents !== null) {
    return item.unitPriceCents
  }

  if (item.lineSubtotalCents !== null && item.quantity > 0) {
    return Math.max(Math.round(item.lineSubtotalCents / item.quantity), 0)
  }

  return 0
}

function buildOutputFileName(
  originalName: string,
  mimeType: ReceiptParseSupportedMimeType,
) {
  const fallbackBaseName = "receipt-upload"
  const baseName =
    originalName.replace(/\.[^/.]+$/, "").trim() || fallbackBaseName
  const extension = mimeType === "image/png" ? "png" : "jpg"

  return `${baseName}.${extension}`
}

function isSupportedReceiptMimeType(
  mimeType: string,
): mimeType is ReceiptParseSupportedMimeType {
  return (
    RECEIPT_PARSE_SUPPORTED_MIME_TYPES as readonly string[]
  ).includes(mimeType)
}

function isHeicReceiptFile(file: File) {
  const normalizedMimeType = file.type.toLowerCase()
  const normalizedName = file.name.toLowerCase()

  return (
    (RECEIPT_PARSE_SUPPORTED_HEIC_MIME_TYPES as readonly string[]).includes(
      normalizedMimeType,
    ) ||
    normalizedName.endsWith(".heic") ||
    normalizedName.endsWith(".heif")
  )
}

function isAcceptedReceiptUploadFile(file: File) {
  return isSupportedReceiptMimeType(file.type) || isHeicReceiptFile(file)
}

function createUnsupportedReceiptFileError() {
  return new ReceiptIngestionError(
    `This file type is not accepted. Accepted receipt image types: ${RECEIPT_UPLOAD_ACCEPTED_FILE_TYPES}.`,
    "unsupported-type",
  )
}

function createUnreadableReceiptImageError(file: File) {
  return new ReceiptIngestionError(
    `This ${isHeicReceiptFile(file) ? "HEIC" : "receipt"} image could not be opened in this browser. Accepted receipt image types: ${RECEIPT_UPLOAD_ACCEPTED_FILE_TYPES}.`,
    "unsupported-type",
  )
}

async function transcodeHeicReceiptToJpeg<
  TDecodedImage extends { height: number; width: number },
>(file: File, codec: ReceiptImageCodec<TDecodedImage>) {
  if (!codec.transcodeHeicToJpeg) {
    throw createUnreadableReceiptImageError(file)
  }

  try {
    const jpegBlob = await codec.transcodeHeicToJpeg(file)

    return new File([jpegBlob], buildOutputFileName(file.name, "image/jpeg"), {
      type: "image/jpeg",
    })
  } catch {
    throw createUnreadableReceiptImageError(file)
  }
}

function getCompressionScales(width: number, height: number) {
  const longestSide = Math.max(width, height)

  if (longestSide >= 4_000) {
    return [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.32, 0.24]
  }

  if (longestSide >= 2_400) {
    return [1, 0.92, 0.82, 0.72, 0.62, 0.52, 0.42, 0.32]
  }

  return [1, 0.95, 0.86, 0.77, 0.68, 0.59, 0.5, 0.4]
}

function getCompressionQualities(mimeType: ReceiptParseSupportedMimeType) {
  if (mimeType === "image/png") {
    return [undefined]
  }

  return [0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44, 0.36]
}

async function getDefaultAuthToken() {
  if (!hasAmplifyAuthConfig()) {
    throw new ReceiptIngestionError(
      "Missing Cognito env vars. Define the auth config in ui/.env.local.",
      "config",
    )
  }

  configureAmplifyAuth()

  const session = await fetchAuthSession()
  return session.tokens?.accessToken?.toString() ?? null
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: unknown }

    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message
    }
  } catch {
    // Fall back to the status text below.
  }

  return response.statusText || null
}

function mapHttpError(status: number, message: string | null) {
  switch (status) {
    case 400:
    case 422:
      return new ReceiptIngestionError(
        message ?? "The receipt image could not be parsed into a usable draft.",
        "validation",
      )
    case 401:
      return new ReceiptIngestionError(
        message ?? "You need to log in again before parsing receipts.",
        "unauthorized",
      )
    case 413:
      return new ReceiptIngestionError(
        message ?? "The prepared image still exceeds the 4 MB upload limit.",
        "payload-too-large",
      )
    case 415:
      return new ReceiptIngestionError(
        message ??
          `This file type is not accepted. Accepted receipt image types: ${RECEIPT_UPLOAD_ACCEPTED_FILE_TYPES}.`,
        "unsupported-type",
      )
    default:
      return new ReceiptIngestionError(
        message ?? `Receipt parsing failed with status ${status}.`,
        "network",
      )
  }
}

function createBrowserImageCodec(): ReceiptImageCodec<{
  cleanup: () => void
  height: number
  source: CanvasImageSource
  width: number
}> {
  return {
    async decode(file) {
      if (typeof createImageBitmap === "function") {
        const imageBitmap = await createImageBitmap(file)

        return {
          cleanup: () => imageBitmap.close(),
          height: imageBitmap.height,
          source: imageBitmap,
          width: imageBitmap.width,
        }
      }

      const objectUrl = URL.createObjectURL(file)

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const element = new Image()

          element.onload = () => resolve(element)
          element.onerror = () =>
            reject(new Error("The selected file could not be decoded as an image."))
          element.src = objectUrl
        })

        return {
          cleanup: () => URL.revokeObjectURL(objectUrl),
          height: image.naturalHeight,
          source: image,
          width: image.naturalWidth,
        }
      } catch (error) {
        URL.revokeObjectURL(objectUrl)
        throw error
      }
    },
    async encode(decodedImage, options) {
      if (typeof document === "undefined") {
        throw new Error("Image compression requires a browser canvas environment.")
      }

      const canvas = document.createElement("canvas")

      canvas.width = options.width
      canvas.height = options.height

      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Image compression could not access a 2D canvas context.")
      }

      context.drawImage(decodedImage.source, 0, 0, options.width, options.height)

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          options.mimeType,
          options.quality,
        )
      })
    },
    async transcodeHeicToJpeg(file) {
      const { heicTo } = await import("heic-to/next")

      return heicTo({
        blob: file,
        quality: 0.92,
        type: "image/jpeg",
      })
    },
  }
}

export async function prepareReceiptUploadWithCodec<
  TDecodedImage extends { height: number; width: number },
>(
  file: File,
  codec: ReceiptImageCodec<TDecodedImage>,
  maxUploadBytes = RECEIPT_PARSE_MAX_UPLOAD_BYTES,
): Promise<PreparedReceiptUpload> {
  if (isSupportedReceiptMimeType(file.type) && file.size <= maxUploadBytes) {
    return {
      file,
      mimeType: file.type,
    }
  }

  if (!isAcceptedReceiptUploadFile(file)) {
    throw createUnsupportedReceiptFileError()
  }

  const sourceFile = isHeicReceiptFile(file)
    ? await transcodeHeicReceiptToJpeg(file, codec)
    : file

  if (sourceFile.size <= maxUploadBytes) {
    return {
      file: sourceFile,
      mimeType: "image/jpeg",
    }
  }

  let decodedImage: TDecodedImage | null = null

  try {
    decodedImage = await codec.decode(sourceFile)
  } catch {
    throw createUnreadableReceiptImageError(file)
  }

  try {
    const targetMimeTypes: ReceiptParseSupportedMimeType[] =
      sourceFile.type === "image/png" && sourceFile.size <= maxUploadBytes
        ? ["image/png"]
        : ["image/jpeg"]

    for (const mimeType of targetMimeTypes) {
      for (const scale of getCompressionScales(
        decodedImage.width,
        decodedImage.height,
      )) {
        const width = Math.max(1, Math.round(decodedImage.width * scale))
        const height = Math.max(1, Math.round(decodedImage.height * scale))

        for (const quality of getCompressionQualities(mimeType)) {
          const encodedBlob = await codec.encode(decodedImage, {
            height,
            mimeType,
            quality,
            width,
          })

          if (!encodedBlob) {
            continue
          }

          if (encodedBlob.size <= maxUploadBytes) {
            return {
              file: new File(
                [encodedBlob],
                buildOutputFileName(file.name, mimeType),
                { type: mimeType },
              ),
              mimeType,
            }
          }
        }
      }
    }
  } finally {
    if (
      decodedImage &&
      "cleanup" in decodedImage &&
      typeof decodedImage.cleanup === "function"
    ) {
      decodedImage.cleanup()
    }
  }

  throw new ReceiptIngestionError(
    "This image cannot be compressed below 4 MB. Try a tighter crop or a lower-resolution photo.",
    "payload-too-large",
  )
}

export function prepareReceiptUpload(file: File) {
  return prepareReceiptUploadWithCodec(file, createBrowserImageCodec())
}

export function mapReceiptParseResponseToEditorState(
  payload: ReceiptParseResponse,
): ReceiptEditorState {
  const nextState = createEmptyReceiptEditorState()
  const defaultGroup = nextState.groups[0]

  return {
    ...nextState,
    allocationPolicy: payload.createReceiptInputDraft.allocationPolicy,
    capturedAt:
      payload.createReceiptInputDraft.capturedAt ?? new Date().toISOString(),
    currencyCode:
      trimToNull(payload.createReceiptInputDraft.currencyCode)?.toUpperCase() ??
      nextState.currencyCode,
    discount: centsToEditorMoney(payload.createReceiptInputDraft.discountCents),
    fee: centsToEditorMoney(payload.createReceiptInputDraft.feeCents),
    items:
      payload.upsertReceiptItemInputDrafts.length > 0
        ? payload.upsertReceiptItemInputDrafts.map((item) =>
            createEditableItem({
              category: item.category ?? "",
              description: item.description.trim(),
              discount: centsToEditorMoney(item.discountCents),
              quantity: String(item.quantity),
              selectedGroupIds: defaultGroup ? [defaultGroup.id] : [],
              unitPrice: centsToEditorMoney(getUnitPriceCents(item)),
            }),
          )
        : nextState.items,
    locationAddress: payload.createReceiptInputDraft.locationAddress ?? "",
    locationName:
      trimToNull(payload.createReceiptInputDraft.locationName) ?? "",
    merchantName:
      trimToNull(payload.createReceiptInputDraft.merchantName) ?? "",
    receiptId: null,
    receiptOccurredAt: getReceiptOccurredAt(payload.createReceiptInputDraft),
    tax: centsToEditorMoney(payload.createReceiptInputDraft.taxCents),
    tip: centsToEditorMoney(payload.createReceiptInputDraft.tipCents),
    version: null,
  }
}

export function createReceiptIngestionClient(
  dependencies: ReceiptIngestionDependencies = {},
) {
  const fetchImpl = dependencies.fetchImpl ?? fetch
  const getAuthToken = dependencies.getAuthToken ?? getDefaultAuthToken
  const prepareUpload =
    dependencies.prepareReceiptUpload ?? prepareReceiptUpload

  return {
    async parseReceiptImage(file: File) {
      if (!hasReceiptParseConfig() && !dependencies.parseApiUrl) {
        throw new ReceiptIngestionError(
          "Missing NEXT_PUBLIC_RECEIPT_PARSE_API_URL. Define the receipt parsing endpoint in ui/.env.local.",
          "config",
        )
      }

      const preparedUpload = await prepareUpload(file)
      const authToken = await getAuthToken()

      if (!authToken) {
        throw new ReceiptIngestionError(
          "You need to log in again before parsing receipts.",
          "unauthorized",
        )
      }

      let response: Response

      try {
        response = await fetchImpl(
          dependencies.parseApiUrl ?? (getReceiptParseApiUrl() as string),
          {
            body: preparedUpload.file,
            headers: {
              authorization: authToken,
              "content-type": preparedUpload.mimeType,
            },
            method: "POST",
          },
        )
      } catch {
        throw new ReceiptIngestionError(
          "Receipt parsing is unavailable right now. Try again in a moment.",
          "network",
        )
      }

      if (!response.ok) {
        throw mapHttpError(response.status, await parseErrorMessage(response))
      }

      let payload: unknown

      try {
        payload = await response.json()
      } catch {
        throw new ReceiptIngestionError(
          "The receipt parsing API returned invalid JSON.",
          "response",
        )
      }

      const result = receiptParseResponseSchema.safeParse(payload)

      if (!result.success) {
        throw new ReceiptIngestionError(
          "The receipt parsing API returned an unexpected response.",
          "response",
        )
      }

      return result.data
    },
  }
}

export async function parseReceiptImage(file: File) {
  return createReceiptIngestionClient().parseReceiptImage(file)
}

export function buildReceiptParseMessage(payload: ReceiptParseResponse) {
  if (payload.needsReview || payload.issues.length > 0) {
    return "Review the parsed draft before saving."
  }

  return "Receipt image parsed. Review and save when ready."
}

export type { PreparedReceiptUpload, ReceiptImageCodec, ReceiptParserMetadata }
