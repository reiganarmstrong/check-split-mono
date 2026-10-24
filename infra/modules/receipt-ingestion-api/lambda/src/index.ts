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

type OpenAIResponse = {
  status?: string
  output?: Array<{
    type: string
    content?: Array<{ type: string; text?: string }>
  }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
const DEFAULT_ALLOWED_ORIGIN = "*"
const DEFAULT_MODEL_ID = "gpt-6-luna"
const DEFAULT_MAX_UPLOAD_BYTES = 4194304
const OPENAI_REQUEST_TIMEOUT_MS = 20000

let cachedOpenAIApiKey: string | null = null

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

async function getOpenAIApiKey() {
  if (cachedOpenAIApiKey) {
    return cachedOpenAIApiKey
  }

  const parameterName = getEnv("OPENAI_API_KEY_PARAMETER_NAME")

  if (!parameterName) {
    throw new Error("Missing OPENAI_API_KEY_PARAMETER_NAME environment variable.")
  }

  cachedOpenAIApiKey = await getSecureStringParameter(parameterName)
  return cachedOpenAIApiKey
}

function extractOpenAIText(response: OpenAIResponse) {
  if (response.status !== "completed") {
    throw new Error("OpenAI did not complete the receipt extraction.")
  }

  if (!Array.isArray(response.output)) {
    throw new Error("OpenAI returned no structured response.")
  }

  const textParts: string[] = []

  for (const item of response.output) {
    if (item.type !== "message") continue
    if (!Array.isArray(item.content)) {
      throw new Error("OpenAI returned invalid message content.")
    }
    for (const part of item.content) {
      if (part.type === "refusal") {
        throw new Error("OpenAI refused the receipt extraction.")
      }
      if (part.type === "output_text") {
        if (typeof part.text !== "string") {
          throw new Error("OpenAI returned invalid structured text.")
        }
        textParts.push(part.text)
      }
    }
  }

  const text = textParts.join("").trim()
  if (!text) {
    throw new Error("OpenAI returned an empty structured response.")
  }
  return text
}

function buildParserMetadata(modelId: string, response: OpenAIResponse) {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    modelId,
    outputTokens: response.usage?.output_tokens ?? 0,
    provider: "openai-responses-api" as const,
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

  throw new Error("OpenAI returned an empty draft without any issues or extracted receipt data.")
}

async function callOpenAI(
  apiKey: string,
  mimeType: string,
  modelId: string,
  payload: BufferLike,
): Promise<ReceiptParseResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      body: JSON.stringify({
        model: modelId,
        store: false,
        service_tier: "default",
        reasoning: { effort: "none" },
        max_output_tokens: 8192,
        instructions: SYSTEM_PROMPT,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: IMAGE_PROMPT },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${payload.toString("base64")}`,
              detail: "high",
            },
          ],
        }],
        text: {
          format: {
            type: "json_schema",
            name: "receipt_draft",
            strict: true,
            schema: receiptDraftResponseJsonSchema,
          },
        },
      }),
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status} ${response.statusText}.`)
    }

    const document = (await response.json()) as OpenAIResponse
    const parsedText = extractOpenAIText(document)
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(parsedText)
    } catch {
      throw new Error("OpenAI returned invalid structured JSON.")
    }
    const validation = validateModelReceiptParseResponse(parsedJson)

    if (!validation.value) {
      throw new Error("OpenAI returned invalid structured JSON.")
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

    const apiKey = await getOpenAIApiKey()
    const modelId = getEnv("OPENAI_MODEL_ID", DEFAULT_MODEL_ID) ?? DEFAULT_MODEL_ID
    const response = await callOpenAI(apiKey, mimeType, modelId, body)

    return jsonResponse(event, 200, response)
  } catch (error) {
    console.error("Receipt parsing failed.", {
      message: error instanceof Error ? error.message : "Unknown error.",
      name: error instanceof Error ? error.name : "UnknownError",
    })

    if (error instanceof Error) {
      if (error.message.includes("Only Cognito access tokens")) {
        return jsonResponse(event, 401, { message: error.message })
      }

      if (error.message.includes("Request body is required")) {
        return jsonResponse(event, 400, { message: error.message })
      }

      if (error.name === "AbortError") {
        return jsonResponse(event, 504, { message: "OpenAI request timed out." })
      }

      if (error.message.startsWith("OpenAI returned an empty draft")) {
        return jsonResponse(event, 422, { message: error.message })
      }

      if (error.message.startsWith("OpenAI")) {
        return jsonResponse(event, 502, { message: error.message })
      }
    }

    return jsonResponse(event, 502, {
      message: "Receipt parsing failed unexpectedly.",
    })
  }
}
