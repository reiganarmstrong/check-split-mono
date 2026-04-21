import { getSecureStringParameter } from "./aws-ssm"
import { IMAGE_PROMPT, SYSTEM_PROMPT } from "./prompts"
import {
  receiptDraftResponseJsonSchema,
  type ModelReceiptParseResponse,
  type ReceiptParseResponse,
} from "./schema"
import {
  normalizeNeedsReview,
  validateModelReceiptParseResponse,
} from "./validation"

type ApiGatewayJwtClaims = Record<string, string>

type ApiGatewayEvent = {
  body?: string | null
  headers?: Record<string, string | undefined>
  isBase64Encoded?: boolean
  requestContext?: {
    authorizer?: {
      jwt?: {
        claims?: ApiGatewayJwtClaims
      }
    }
  }
}

type ApiGatewayResponse = {
  body: string
  headers: Record<string, string>
  statusCode: number
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
    finishReason?: string
  }>
  promptFeedback?: {
    blockReason?: string
  }
  usageMetadata?: {
    candidatesTokenCount?: number
    promptTokenCount?: number
  }
}

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
const DEFAULT_ALLOWED_ORIGIN = "*"
const DEFAULT_MODEL_ID = "gemini-3.1-flash-lite-preview"
const DEFAULT_MAX_UPLOAD_BYTES = 4194304
const GEMINI_REQUEST_TIMEOUT_MS = 20000

let cachedGeminiApiKey: string | null = null

function getEnv(name: string, fallback?: string) {
  return process.env[name] ?? fallback
}

function getAllowedOrigins() {
  const serializedOrigins = getEnv("RECEIPT_PARSE_ALLOWED_ORIGINS")

  if (!serializedOrigins) {
    return [DEFAULT_ALLOWED_ORIGIN]
  }

  try {
    const parsedOrigins = JSON.parse(serializedOrigins) as unknown

    if (Array.isArray(parsedOrigins)) {
      const validOrigins = parsedOrigins.filter((origin): origin is string => {
        return typeof origin === "string" && origin.trim().length > 0
      })

      if (validOrigins.length > 0) {
        return validOrigins
      }
    }
  } catch {
    // Fall through to the wildcard default.
  }

  return [DEFAULT_ALLOWED_ORIGIN]
}

function getAllowedOriginForRequest(event: ApiGatewayEvent) {
  const requestOrigin = getHeaderValue(event.headers, "origin")
  const allowedOrigins = getAllowedOrigins()

  if (allowedOrigins.includes(DEFAULT_ALLOWED_ORIGIN)) {
    return DEFAULT_ALLOWED_ORIGIN
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin
  }

  return allowedOrigins[0] ?? DEFAULT_ALLOWED_ORIGIN
}

function getResponseHeaders(event: ApiGatewayEvent) {
  return {
    "access-control-allow-origin": getAllowedOriginForRequest(event),
    "content-type": "application/json",
    vary: "Origin",
  }
}

function jsonResponse(event: ApiGatewayEvent, statusCode: number, payload: unknown): ApiGatewayResponse {
  return {
    body: JSON.stringify(payload),
    headers: getResponseHeaders(event),
    statusCode,
  }
}

function getHeaderValue(headers: Record<string, string | undefined> | undefined, name: string) {
  if (!headers) {
    return undefined
  }

  const matchingKey = Object.keys(headers).find((headerName) => {
    return headerName.toLowerCase() === name.toLowerCase()
  })

  return matchingKey ? headers[matchingKey] : undefined
}

function getMimeType(event: ApiGatewayEvent) {
  const contentType = getHeaderValue(event.headers, "content-type")
  return contentType?.split(";")[0].trim().toLowerCase()
}

function decodeRequestBody(event: ApiGatewayEvent) {
  if (!event.body) {
    throw new Error("Request body is required.")
  }

  return event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body)
}

function getMaxUploadBytes() {
  const value = Number.parseInt(
    getEnv("MAX_UPLOAD_BYTES", String(DEFAULT_MAX_UPLOAD_BYTES)) ?? String(DEFAULT_MAX_UPLOAD_BYTES),
    10,
  )

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_UPLOAD_BYTES
}

function assertJwtClaims(event: ApiGatewayEvent) {
  const claims = event.requestContext?.authorizer?.jwt?.claims

  if (!claims?.sub) {
    throw new Error("Authenticated JWT claims are missing the Cognito subject.")
  }

  if (claims.token_use && claims.token_use !== "access") {
    throw new Error("Only Cognito access tokens are accepted by this endpoint.")
  }
}

async function getGeminiApiKey() {
  if (cachedGeminiApiKey) {
    return cachedGeminiApiKey
  }

  const parameterName = getEnv("GEMINI_API_KEY_PARAMETER_NAME")

  if (!parameterName) {
    throw new Error("Missing GEMINI_API_KEY_PARAMETER_NAME environment variable.")
  }

  cachedGeminiApiKey = await getSecureStringParameter(parameterName)
  return cachedGeminiApiKey
}

function extractGeminiText(response: GeminiGenerateContentResponse) {
  const candidate = response.candidates?.[0]

  if (!candidate) {
    throw new Error("Gemini returned no response candidates.")
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the request: ${response.promptFeedback.blockReason}.`)
  }

  const text = candidate.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim()

  if (!text) {
    throw new Error(
      `Gemini returned an empty structured response${candidate.finishReason ? ` (${candidate.finishReason})` : ""}.`,
    )
  }

  return text
}

function buildParserMetadata(modelId: string, response: GeminiGenerateContentResponse) {
  return {
    inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
    modelId,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    provider: "gemini-developer-api" as const,
  }
}

function ensureMateriallyUsefulResponse(response: ModelReceiptParseResponse) {
  const hasMerchant = response.createReceiptInputDraft.merchantName !== null
  const hasItems = response.upsertReceiptItemInputDrafts.length > 0
  const hasTotals =
    response.createReceiptInputDraft.totalCents !== null ||
    response.createReceiptInputDraft.subtotalCents !== null

  if (hasMerchant || hasItems || hasTotals || response.issues.length > 0) {
    return
  }

  throw new Error("Gemini returned an empty draft without any issues or extracted receipt data.")
}

async function callGemini(
  apiKey: string,
  mimeType: string,
  modelId: string,
  payload: BufferLike,
): Promise<ReceiptParseResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/${modelId}:generateContent`, {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: IMAGE_PROMPT,
              },
              {
                inlineData: {
                  data: payload.toString("base64"),
                  mimeType,
                },
              },
            ],
            role: "user",
          },
        ],
        generationConfig: {
          responseJsonSchema: receiptDraftResponseJsonSchema,
          responseMimeType: "application/json",
        },
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },
      }),
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      method: "POST",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status} ${response.statusText}.`)
    }

    const document = (await response.json()) as GeminiGenerateContentResponse
    const parsedText = extractGeminiText(document)
    const parsedJson = JSON.parse(parsedText) as unknown
    const validation = validateModelReceiptParseResponse(parsedJson)

    if (!validation.value) {
      throw new Error(validation.error ?? "Gemini returned invalid structured JSON.")
    }

    const normalizedResponse = normalizeNeedsReview(validation.value)
    ensureMateriallyUsefulResponse(normalizedResponse)

    return {
      ...normalizedResponse,
      parser: buildParserMetadata(modelId, document),
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function handler(event: ApiGatewayEvent): Promise<ApiGatewayResponse> {
  try {
    assertJwtClaims(event)

    const mimeType = getMimeType(event)

    if (mimeType !== "image/jpeg" && mimeType !== "image/png") {
      return jsonResponse(event, 415, {
        message: "Only image/jpeg and image/png requests are supported.",
      })
    }

    const body = decodeRequestBody(event)

    if (body.length > getMaxUploadBytes()) {
      return jsonResponse(event, 413, {
        message: "Uploaded image exceeds the configured maximum size.",
      })
    }

    const apiKey = await getGeminiApiKey()
    const modelId = getEnv("GEMINI_MODEL_ID", DEFAULT_MODEL_ID) ?? DEFAULT_MODEL_ID
    const response = await callGemini(apiKey, mimeType, modelId, body)

    return jsonResponse(event, 200, response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Only Cognito access tokens")) {
        return jsonResponse(event, 401, { message: error.message })
      }

      if (error.message.includes("Request body is required")) {
        return jsonResponse(event, 400, { message: error.message })
      }

      if (error.name === "AbortError") {
        return jsonResponse(event, 504, { message: "Gemini request timed out." })
      }

      if (error.message.startsWith("Gemini returned an empty draft")) {
        return jsonResponse(event, 422, { message: error.message })
      }

      if (error.message.startsWith("Gemini")) {
        return jsonResponse(event, 502, { message: error.message })
      }
    }

    return jsonResponse(event, 502, {
      message: "Receipt parsing failed unexpectedly.",
    })
  }
}
