import production from "./production.cjs"

// Standard paid rates checked 2026-10-10. These are estimates, not billing data.
export const PROVIDERS = {
  gemini: { modelId: "gemini-3.1-flash-lite", keyName: "GEMINI_API_KEY", inputRate: 0.25, cachedRate: 0.025, outputRate: 1.5 },
  luna: { modelId: "gpt-6-luna", keyName: "OPENAI_API_KEY", inputRate: 0.1, cachedRate: 0.01, outputRate: 0.5 },
}

export function buildRequest(provider, image, maxOutputTokens) {
  const modelId = PROVIDERS[provider].modelId
  const data = image.toString("base64")
  if (provider === "luna") {
    return {
      url: "https://api.openai.com/v1/responses",
      body: {
        model: modelId,
        store: false,
        service_tier: "default",
        reasoning: { effort: "none" },
        max_output_tokens: maxOutputTokens,
        instructions: production.SYSTEM_PROMPT,
        input: [{ role: "user", content: [
          { type: "input_text", text: production.IMAGE_PROMPT },
          { type: "input_image", image_url: `data:image/jpeg;base64,${data}`, detail: "high" },
        ] }],
        text: { format: { type: "json_schema", name: "receipt_draft", strict: true, schema: production.receiptDraftResponseJsonSchema } },
      },
    }
  }
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    body: {
      contents: [{ role: "user", parts: [{ text: production.IMAGE_PROMPT }, { inlineData: { mimeType: "image/jpeg", data } }] }],
      systemInstruction: { parts: [{ text: production.SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: production.receiptDraftResponseJsonSchema,
        maxOutputTokens,
      },
    },
  }
}

export function extractUsage(provider, document) {
  const metadata = provider === "luna" ? document.usage : document.usageMetadata
  if (!metadata) return null
  const inputTokens = provider === "luna" ? metadata.input_tokens : metadata.promptTokenCount
  const outputTokens = provider === "luna" ? metadata.output_tokens
    : Number.isFinite(metadata.candidatesTokenCount) ? metadata.candidatesTokenCount + (metadata.thoughtsTokenCount ?? 0) : null
  const cachedInputTokens = provider === "luna" ? (metadata.input_tokens_details?.cached_tokens ?? 0) : (metadata.cachedContentTokenCount ?? 0)
  const reasoningTokens = provider === "luna" ? (metadata.output_tokens_details?.reasoning_tokens ?? 0) : (metadata.thoughtsTokenCount ?? 0)
  if (![inputTokens, outputTokens, cachedInputTokens, reasoningTokens].every((count) => Number.isInteger(count) && count >= 0)
    || cachedInputTokens > inputTokens) return null
  return { inputTokens, outputTokens, cachedInputTokens, reasoningTokens }
}

export function estimateCost(provider, usage) {
  if (!usage) return null
  const rates = PROVIDERS[provider]
  return ((usage.inputTokens - usage.cachedInputTokens) * rates.inputRate
    + usage.cachedInputTokens * rates.cachedRate + usage.outputTokens * rates.outputRate) / 1_000_000
}

export function extractResponse(provider, document) {
  if (provider === "luna") {
    if (document.status !== "completed") throw new Error(`OpenAI response status: ${document.status ?? "missing"}`)
    const content = (document.output ?? []).filter((item) => item.type === "message").flatMap((item) => item.content ?? [])
    if (content.some((item) => item.type === "refusal")) throw new Error("OpenAI refused the image")
    return JSON.parse(content.filter((item) => item.type === "output_text").map((item) => item.text).join(""))
  }
  const candidate = document.candidates?.[0]
  if (document.promptFeedback?.blockReason || candidate?.finishReason !== "STOP") {
    throw new Error(`Gemini response finish: ${candidate?.finishReason ?? "blocked or missing"}`)
  }
  return JSON.parse((candidate.content?.parts ?? []).filter((part) => !part.thought).map((part) => part.text ?? "").join(""))
}

export async function callProvider(provider, image, { maxOutputTokens = 1600, timeoutMs = 20000, fetchImpl = fetch } = {}) {
  const request = buildRequest(provider, image, maxOutputTokens)
  const headers = { "content-type": "application/json" }
  const apiKey = process.env[PROVIDERS[provider].keyName]
  if (provider === "luna") headers.authorization = `Bearer ${apiKey}`
  else headers["x-goog-api-key"] = apiKey
  const started = performance.now()
  let usage = null
  try {
    const response = await fetchImpl(request.url, {
      method: "POST", headers, body: JSON.stringify(request.body), signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) throw new Error(`Provider HTTP ${response.status}`)
    const document = await response.json()
    usage = extractUsage(provider, document)
    const parsed = extractResponse(provider, document)
    return { response: parsed, usage, estimatedCostUsd: estimateCost(provider, usage), requestLatencyMs: Math.round(performance.now() - started) }
  } catch (error) {
    const message = error.name === "TimeoutError" || error.name === "AbortError" ? "Request timed out" : error.message
    return { response: null, error: message, usage, estimatedCostUsd: estimateCost(provider, usage), requestLatencyMs: Math.round(performance.now() - started) }
  }
}
