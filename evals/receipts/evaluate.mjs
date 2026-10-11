import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import production from "./production.cjs"

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

export function loadFixtures(directory) {
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", directory), "utf8"))
  const ids = new Set()
  for (const fixture of manifest.fixtures) {
    if (ids.has(fixture.id)) throw new Error(`Duplicate fixture: ${fixture.id}`)
    ids.add(fixture.id)
    const image = readFileSync(new URL(fixture.image, directory))
    if (sha256(image) !== fixture.sha256) throw new Error(`Image checksum failed: ${fixture.id}`)
    if (image.length > 4_194_304) throw new Error(`Image exceeds production upload limit: ${fixture.id}`)
  }
  return manifest
}

function normalizeText(value) {
  return (value ?? "").normalize("NFKD").replace(/\p{M}/gu, "")
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
}

function matches(actual, expected) {
  return (Array.isArray(expected) ? expected : [expected]).some((value) =>
    typeof value === "string" ? normalizeText(value) === normalizeText(actual) : actual === value,
  )
}

export function evaluateResponse(fixture, response) {
  const validation = production.validateModelReceiptParseResponse(response)
  if (!validation.value) {
    return { schemaValid: false, passed: false, financialPassed: false, failures: [validation.error], checks: [] }
  }
  const parsed = production.normalizeNeedsReview(validation.value)
  // Parser metadata is not model output. Supply the existing mapper's metadata
  // shape locally; this does not assert that the deployed UI accepts OpenAI.
  const payload = production.receiptParseResponseSchema.parse({
    ...parsed,
    parser: { provider: "gemini-developer-api", modelId: "offline-eval", inputTokens: 0, outputTokens: 0 },
  })
  const editor = production.mapReceiptParseResponseToEditorState(payload)
  const checks = []
  const check = (field, actual, expected, financial = true) => {
    checks.push({ field, actual, expected, passed: matches(actual, expected), financial })
  }

  check("merchantName", parsed.createReceiptInputDraft.merchantName, fixture.expected.merchantName, false)
  for (const [field, expected] of Object.entries(fixture.expected.receipt)) {
    check(field, parsed.createReceiptInputDraft[field], expected, field.endsWith("Cents"))
  }
  check("itemCount", editor.items.length, fixture.expected.items.length)
  const unused = new Set(editor.items.map((_, index) => index))
  for (const [goldIndex, gold] of fixture.expected.items.entries()) {
    const candidates = [...unused].filter((index) => matches(editor.items[index].description, gold.description))
    // Pair repeated descriptions with their closest financial match, once each.
    const errors = (index) => {
      const item = editor.items[index]
      return Number(Number(item.quantity) !== gold.quantity)
        + Number(production.parseMoneyInputToCents(item.unitPrice) !== gold.unitPriceCents)
        + Number(production.parseMoneyInputToCents(item.discount) !== gold.discountCents)
    }
    candidates.sort((a, b) => errors(a) - errors(b))
    const index = candidates[0]
    const prefix = `item[${goldIndex}]`
    if (index === undefined) {
      check(`${prefix}.description`, null, gold.description)
      continue
    }
    unused.delete(index)
    const item = editor.items[index]
    check(`${prefix}.quantity`, Number(item.quantity), gold.quantity)
    check(`${prefix}.unitPriceCents`, production.parseMoneyInputToCents(item.unitPrice), gold.unitPriceCents)
    check(`${prefix}.discountCents`, production.parseMoneyInputToCents(item.discount), gold.discountCents)
    check(`${prefix}.extractedDiscountCents`, parsed.upsertReceiptItemInputDrafts[index].discountCents, gold.discountCents)
    check(`${prefix}.editorLineSubtotalCents`, production.getItemLineSubtotalCents(item), gold.lineSubtotalCents)
    const rawLine = parsed.upsertReceiptItemInputDrafts[index].lineSubtotalCents
    if (rawLine !== null) check(`${prefix}.extractedLineSubtotalCents`, rawLine, gold.lineSubtotalCents)
  }
  check("editorSubtotalCents", production.getReceiptSubtotalCents(editor), fixture.expected.editorSubtotalCents)
  check("editorTotalCents", production.getReceiptTotalCents(editor), fixture.expected.editorTotalCents)
  if (fixture.expected.needsReview !== undefined) check("needsReview", parsed.needsReview, fixture.expected.needsReview)
  return {
    schemaValid: true,
    passed: checks.every((item) => item.passed),
    financialPassed: checks.filter((item) => item.financial).every((item) => item.passed),
    failures: checks.filter((item) => !item.passed).map((item) => item.field),
    checks,
  }
}

export function summarize(records) {
  const summary = {}
  for (const provider of new Set(records.map((record) => record.provider))) {
    const rows = records.filter((record) => record.provider === provider)
    const valid = rows.filter((record) => !record.error && record.evaluation.schemaValid)
    const financial = rows.filter((record) => record.evaluation.financialPassed)
    const times = rows.map((record) => record.requestLatencyMs).filter(Number.isFinite).sort((a, b) => a - b)
    const costsKnown = rows.every((record) => Number.isFinite(record.estimatedCostUsd))
    const cost = costsKnown ? rows.reduce((sum, record) => sum + record.estimatedCostUsd, 0) : null
    summary[provider] = {
      modelId: rows[0].modelId,
      attemptedReceipts: rows.length,
      validResponses: valid.length,
      passedReceipts: rows.filter((record) => record.evaluation.passed).length,
      financialPassedReceipts: financial.length,
      medianRequestLatencyMs: times.length ? times[Math.floor(times.length / 2)] : null,
      maxRequestLatencyMs: times.length ? times.at(-1) : null,
      estimatedTotalCostUsd: cost,
      estimatedCostPerValidResponseUsd: cost !== null && valid.length ? cost / valid.length : null,
      estimatedCostPerFinancialPassUsd: cost !== null && financial.length ? cost / financial.length : null,
    }
  }
  return summary
}
