import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { parseArgs } from "node:util"
import { fileURLToPath } from "node:url"
import production from "./production.cjs"
import { evaluateResponse, loadFixtures, sha256, summarize } from "./evaluate.mjs"
import { callProvider, PROVIDERS } from "./providers.mjs"

const directory = new URL("./", import.meta.url)

export function parseOptions(args) {
  const { values } = parseArgs({ args, options: {
    live: { type: "boolean" },
    "dry-run": { type: "boolean" },
    replay: { type: "string" },
    provider: { type: "string", default: "both" },
    limit: { type: "string", default: "5" },
    "max-output-tokens": { type: "string", default: "1600" },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  } })
  if (!["gemini", "luna", "both"].includes(values.provider)) throw new Error("--provider must be gemini, luna, or both")
  if (!/^[1-5]$/.test(values.limit)) throw new Error("--limit must be 1 through 5")
  const maxOutputTokens = Number(values["max-output-tokens"])
  if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 256 || maxOutputTokens > 1600) {
    throw new Error("--max-output-tokens must be an integer from 256 through 1600")
  }
  if ((values.live && values["dry-run"]) || (values.replay && (values.live || values["dry-run"]))) {
    throw new Error("Choose only one mode: --live, --dry-run, or --replay")
  }
  return { ...values, limit: Number(values.limit), maxOutputTokens }
}

function scoreRecord(record, manifest) {
  const fixture = manifest.fixtures.find((item) => item.id === record.fixtureId)
  if (!fixture || record.imageSha256 !== fixture.sha256) throw new Error(`Unknown or changed fixture: ${record.fixtureId}`)
  return {
    ...record,
    evaluation: record.error ? { schemaValid: false, passed: false, financialPassed: false, failures: [record.error], checks: [] }
      : evaluateResponse(fixture, record.response),
  }
}

function printReport(records) {
  const summary = summarize(records)
  console.log("provider  pass  financial  median ms  max ms  estimated USD")
  for (const [provider, row] of Object.entries(summary)) {
    console.log(`${provider.padEnd(8)}  ${row.passedReceipts}/${row.attemptedReceipts}   ${row.financialPassedReceipts}/${row.attemptedReceipts}        ${row.medianRequestLatencyMs ?? "unknown"}       ${row.maxRequestLatencyMs ?? "unknown"}     ${row.estimatedTotalCostUsd?.toFixed(6) ?? "unknown"}`)
  }
  for (const record of records.filter((item) => !item.evaluation.passed)) {
    console.log(`${record.provider}/${record.fixtureId}: ${record.evaluation.failures.join(", ")}`)
  }
  console.log("Five-fixture smoke evaluation; request latency excludes browser preparation, AWS, and auth.")
  return summary
}

export async function main(args = process.argv.slice(2)) {
  const options = parseOptions(args)
  if (options.help) {
    console.log("Usage: node evals/receipts/run.mjs [--dry-run | --live | --replay FILE]\n  --provider gemini|luna|both  --limit 1..5  --max-output-tokens 256..1600  --out FILE\nDefault is offline. Live mode needs GEMINI_API_KEY and/or OPENAI_API_KEY.")
    return
  }
  const manifest = loadFixtures(directory)
  const contractSha256 = sha256(JSON.stringify({
    system: production.SYSTEM_PROMPT, image: production.IMAGE_PROMPT, schema: production.receiptDraftResponseJsonSchema,
  }))
  if (options.replay) {
    const saved = JSON.parse(readFileSync(resolve(options.replay), "utf8"))
    if (saved.version !== 1 || !Array.isArray(saved.records)) throw new Error("Unsupported saved evaluation format")
    if (saved.contractSha256 !== contractSha256) console.log("Production prompt/schema changed; rescoring saved responses with current validation and editor code.")
    const records = saved.records.map((record) => scoreRecord(record, manifest))
    printReport(records)
    if (records.some((record) => !record.evaluation.passed)) process.exitCode = 1
    return
  }
  const fixtures = manifest.fixtures.slice(0, options.limit)
  const providers = options.provider === "both" ? ["gemini", "luna"] : [options.provider]
  const plannedRequests = fixtures.length * providers.length
  console.log(`${fixtures.length} fixtures; ${plannedRequests} planned requests; output cap ${options.maxOutputTokens} tokens/request; 20s timeout; no retries.`)
  for (const fixture of fixtures) console.log(`${fixture.id}: ${Array.isArray(fixture.expected.merchantName) ? fixture.expected.merchantName[0] : fixture.expected.merchantName} (${fixture.expected.items.length} rows)`)
  if (!options.live) {
    console.log("Offline preflight passed. No model requests sent. Use --live to generate responses or --replay FILE to rescore.")
    return
  }
  for (const provider of providers) {
    if (!process.env[PROVIDERS[provider].keyName]) throw new Error(`Missing ${PROVIDERS[provider].keyName}; no requests sent`)
  }
  const output = resolve(options.out ?? fileURLToPath(new URL(`results/run-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, directory)))
  const report = { version: 1, createdAt: new Date().toISOString(), contractSha256, source: manifest.source,
    settings: { maxOutputTokens: options.maxOutputTokens, timeoutMs: 20000, plannedRequests, pricingCheckedAt: "2026-10-10", pricing: PROVIDERS }, records: [] }
  mkdirSync(dirname(output), { recursive: true })
  // Reserve the file before spending tokens; refuse to overwrite an earlier run.
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" })
  const save = () => writeFileSync(output, JSON.stringify(report, null, 2) + "\n")
  for (const [index, fixture] of fixtures.entries()) {
    const image = readFileSync(new URL(fixture.image, directory))
    // Alternate provider order to reduce systematic first-request bias.
    for (const provider of index % 2 ? [...providers].reverse() : providers) {
      const result = await callProvider(provider, image, { maxOutputTokens: options.maxOutputTokens })
      const record = scoreRecord({ fixtureId: fixture.id, imageSha256: fixture.sha256, provider,
        modelId: PROVIDERS[provider].modelId, ...result }, manifest)
      report.records.push(record)
      save()
      console.log(`${provider}/${fixture.id}: ${record.evaluation.passed ? "PASS" : "FAIL"} (${record.requestLatencyMs} ms)`)
      // Invalid credentials or unsupported requests should not burn the whole run.
      if (result.error?.startsWith("Provider HTTP")) {
        report.stoppedEarly = "Provider HTTP error; resolve it before generating more responses"
        report.summary = printReport(report.records)
        save()
        process.exitCode = 1
        console.log(`Saved ${output}`)
        return
      }
    }
  }
  report.summary = printReport(report.records)
  save()
  console.log(`Saved ${output}; replay is offline.`)
  if (report.records.some((record) => !record.evaluation.passed)) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
