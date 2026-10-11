import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { evaluateResponse, loadFixtures, summarize } from "../evaluate.mjs"
import { buildRequest, callProvider, estimateCost, extractResponse, extractUsage } from "../providers.mjs"
import { main, parseOptions } from "../run.mjs"

const directory = new URL("../", import.meta.url)
const manifest = loadFixtures(directory)
const fixture = (id) => manifest.fixtures.find((item) => item.id === id)
const firstValue = (value) => Array.isArray(value) ? value[0] : value

// Local model-shaped examples only. These are not generated responses or
// evidence that either model reads the public photos accurately.
function exampleResponse(id) {
  const gold = fixture(id).expected
  return {
    createReceiptInputDraft: {
      allocationPolicy: "EVEN", capturedAt: null, currencyCode: null,
      discountCents: 0, feeCents: 0, locationAddress: null, locationLat: null,
      locationLng: null, locationName: null, receiptOccurredAt: null,
      merchantName: firstValue(gold.merchantName),
      subtotalCents: gold.receipt.subtotalCents, taxCents: gold.receipt.taxCents,
      tipCents: firstValue(gold.receipt.tipCents), totalCents: gold.receipt.totalCents,
    },
    issues: [], needsReview: gold.needsReview ?? false,
    upsertReceiptItemInputDrafts: gold.items.map((item, index) => ({
      ...item, description: firstValue(item.description), category: null,
      scanConfidence: null, sourceLineNumber: index + 1,
    })),
  }
}

test("all five manually labeled photos match their source checksums and can be scored offline", () => {
  assert.equal(manifest.fixtures.length, 5)
  for (const item of manifest.fixtures) assert.equal(evaluateResponse(item, exampleResponse(item.id)).passed, true)
})

test("wrong unit price fails even when the model copies the printed grand total correctly", () => {
  const response = exampleResponse("1008")
  response.upsertReceiptItemInputDrafts[1].unitPriceCents = 675
  const evaluation = evaluateResponse(fixture("1008"), response)
  assert.equal(evaluation.financialPassed, false)
  assert.ok(evaluation.failures.includes("item[1].unitPriceCents"))
  assert.ok(evaluation.failures.includes("editorTotalCents"))
})

test("missing and extra rows fail; legitimate repeated item descriptions remain separate", () => {
  const response = exampleResponse("1001")
  response.upsertReceiptItemInputDrafts.pop()
  assert.equal(evaluateResponse(fixture("1001"), response).financialPassed, false)
  const duplicate = exampleResponse("1001")
  duplicate.upsertReceiptItemInputDrafts.push({ ...duplicate.upsertReceiptItemInputDrafts[0] })
  assert.equal(evaluateResponse(fixture("1001"), duplicate).financialPassed, false)
  const reordered = exampleResponse("1001")
  reordered.upsertReceiptItemInputDrafts.reverse()
  assert.equal(evaluateResponse(fixture("1001"), reordered).passed, true)
})

test("suggested tips cannot become paid tips", () => {
  const response = exampleResponse("1008")
  response.createReceiptInputDraft.tipCents = 440
  const evaluation = evaluateResponse(fixture("1008"), response)
  assert.equal(evaluation.financialPassed, false)
  assert.ok(evaluation.failures.includes("tipCents"))
})

test("mapper fallback accepts null unit prices when line amounts and quantities are correct", () => {
  const response = exampleResponse("1113")
  for (const item of response.upsertReceiptItemInputDrafts) item.unitPriceCents = null
  assert.equal(evaluateResponse(fixture("1113"), response).passed, true)
})

test("CHLOE81 preserves printed 4640 cents, computes 4639 cents, and requires review", () => {
  const response = exampleResponse("1144")
  const evaluation = evaluateResponse(fixture("1144"), response)
  assert.equal(evaluation.checks.find((item) => item.field === "totalCents").actual, 4640)
  assert.equal(evaluation.checks.find((item) => item.field === "editorTotalCents").actual, 4639)
  response.needsReview = false
  assert.equal(evaluateResponse(fixture("1144"), response).passed, false)
  response.needsReview = true
  response.createReceiptInputDraft.feeCents = 1
  assert.equal(evaluateResponse(fixture("1144"), response).financialPassed, false)
})

test("invalid response shapes and invented date-only timestamps fail", () => {
  assert.equal(evaluateResponse(fixture("1008"), {}).passed, false)
  const response = exampleResponse("1144")
  response.createReceiptInputDraft.receiptOccurredAt = "2018-08-03T00:00:00Z"
  assert.ok(evaluateResponse(fixture("1144"), response).failures.includes("receiptOccurredAt"))
})

test("both request formats share production schema and enforce output settings", () => {
  const image = Buffer.from("local-image")
  const luna = buildRequest("luna", image, 1600).body
  const gemini = buildRequest("gemini", image, 1600).body
  assert.deepEqual(luna.text.format.schema, gemini.generationConfig.responseJsonSchema)
  assert.equal(luna.instructions, gemini.systemInstruction.parts[0].text)
  assert.equal(luna.max_output_tokens, 1600)
  assert.equal(gemini.generationConfig.maxOutputTokens, 1600)
  assert.equal(luna.reasoning.effort, "none")
  assert.equal(luna.store, false)
})

test("usage includes Gemini thoughts, cached input, and OpenAI reasoning exactly once", () => {
  const gemini = extractUsage("gemini", { usageMetadata: { promptTokenCount: 1000, cachedContentTokenCount: 200, candidatesTokenCount: 500, thoughtsTokenCount: 100 } })
  assert.deepEqual(gemini, { inputTokens: 1000, cachedInputTokens: 200, outputTokens: 600, reasoningTokens: 100 })
  assert.ok(Math.abs(estimateCost("gemini", gemini) - 0.001105) < 1e-10)
  const luna = extractUsage("luna", { usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 200 }, output_tokens: 600, output_tokens_details: { reasoning_tokens: 100 } } })
  assert.equal(luna.outputTokens, 600)
  assert.ok(Math.abs(estimateCost("luna", luna) - 0.000382) < 1e-10)
  assert.equal(extractUsage("luna", {}), null)
  assert.equal(extractUsage("gemini", { usageMetadata: { promptTokenCount: 10 } }), null)
})

test("truncation, refusal, and Gemini thought parts cannot masquerade as valid JSON", () => {
  assert.throws(() => extractResponse("luna", { status: "incomplete", output: [] }), /incomplete/)
  assert.throws(() => extractResponse("luna", { status: "completed", output: [{ type: "message", content: [{ type: "refusal" }] }] }), /refused/)
  assert.throws(() => extractResponse("gemini", { candidates: [{ finishReason: "MAX_TOKENS" }] }), /MAX_TOKENS/)
  const parsed = extractResponse("gemini", { candidates: [{ finishReason: "STOP", content: { parts: [{ thought: true, text: "reasoning" }, { text: '{"value":1}' }] } }] })
  assert.deepEqual(parsed, { value: 1 })
})

test("failed requests are never retried and truncated response usage remains chargeable", async () => {
  let calls = 0
  const failed = await callProvider("luna", Buffer.from("image"), { fetchImpl: async () => { calls++; return { ok: false, status: 429 } } })
  assert.equal(calls, 1)
  assert.equal(failed.error, "Provider HTTP 429")
  const truncated = await callProvider("luna", Buffer.from("image"), { fetchImpl: async () => ({ ok: true, json: async () => ({ status: "incomplete", usage: { input_tokens: 1000, output_tokens: 1600 } }) }) })
  assert.equal(truncated.response, null)
  assert.ok(truncated.estimatedCostUsd > 0)
})

test("CLI refuses extra receipts, bigger outputs, invalid providers, and mixed modes", () => {
  assert.equal(parseOptions([]).live, undefined)
  for (const args of [["--limit", "6"], ["--max-output-tokens", "1601"], ["--provider", "unknown"], ["--live", "--replay", "file.json"], ["--live", "--dry-run"]]) {
    assert.throws(() => parseOptions(args))
  }
})

test("summary includes failed costs and marks incomplete cost metadata unknown", () => {
  const base = { provider: "luna", modelId: "gpt-6-luna", requestLatencyMs: 100, estimatedCostUsd: 0.001,
    response: {}, evaluation: { schemaValid: true, passed: true, financialPassed: true } }
  const failure = { ...base, error: "truncated", response: null, evaluation: { schemaValid: false, passed: false, financialPassed: false } }
  const summary = summarize([base, failure]).luna
  assert.equal(summary.validResponses, 1)
  assert.equal(summary.estimatedCostPerFinancialPassUsd, 0.002)
  assert.equal(summarize([base, { ...failure, estimatedCostUsd: null }]).luna.estimatedTotalCostUsd, null)
  assert.equal(summarize([{ ...base, evaluation: evaluateResponse(fixture("1008"), {}) }]).luna.validResponses, 0)
})

test("live CLI sends at most ten mocked requests; default preflight and replay send none", async () => {
  const originalFetch = globalThis.fetch
  const originalLog = console.log
  const originalKeys = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENAI_API_KEY: process.env.OPENAI_API_KEY }
  const temporary = mkdtempSync(join(tmpdir(), "check-split-eval-test-"))
  const output = join(temporary, "run.json")
  let calls = 0
  const images = new Map(manifest.fixtures.map((item) => [readFileSync(new URL(item.image, directory)).toString("base64"), item.id]))
  console.log = () => {}
  process.env.GEMINI_API_KEY = "offline-test-key"
  process.env.OPENAI_API_KEY = "offline-test-key"
  globalThis.fetch = async (url, options) => {
    calls++
    const body = JSON.parse(options.body)
    const isLuna = url.includes("openai.com")
    const data = isLuna ? body.input[0].content[1].image_url.split(",")[1] : body.contents[0].parts[1].inlineData.data
    const text = JSON.stringify(exampleResponse(images.get(data)))
    return { ok: true, json: async () => isLuna
      ? { status: "completed", usage: { input_tokens: 1000, output_tokens: 500 }, output: [{ type: "message", content: [{ type: "output_text", text }] }] }
      : { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 500 }, candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] } }
  }
  try {
    await main([])
    assert.equal(calls, 0)
    await main(["--live", "--out", output])
    assert.equal(calls, 10)
    assert.equal(JSON.parse(readFileSync(output, "utf8")).records.length, 10)
    await main(["--replay", output])
    assert.equal(calls, 10)
    await assert.rejects(main(["--live", "--out", output]), /EEXIST/)
    assert.equal(calls, 10)
    delete process.env.GEMINI_API_KEY
    await assert.rejects(main(["--live", "--out", join(temporary, "missing-key.json")]), /Missing GEMINI_API_KEY/)
    assert.equal(calls, 10)
  } finally {
    globalThis.fetch = originalFetch
    console.log = originalLog
    for (const [name, value] of Object.entries(originalKeys)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
    rmSync(temporary, { recursive: true, force: true })
  }
})
