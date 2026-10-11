# Bounded Python provider collection

Use the standalone uv project from the repository root. Offline preflight checks the five fixture images and pinned contract, then shows the request plan without contacting providers:

```sh
uv sync --project evals/receipts --locked
uv run --project evals/receipts receipt-eval --provider both
uv run --project evals/receipts pytest evals/receipts/tests
```

Tests substitute HTTP responses and require no real provider credentials. Supply live credentials through shell environment variables: `GEMINI_API_KEY` for Gemini, `OPENAI_API_KEY` for Luna, or both for a comparison. The runner does not load dotenv files or fetch deployment secrets. It validates all selected keys and reserves the output before the first request; existing result files are preserved.

Start with one receipt, then choose one provider or the paired five-receipt comparison:

```sh
uv run --project evals/receipts receipt-eval --live --provider gemini --limit 1 --out /tmp/gemini-smoke.json
uv run --project evals/receipts receipt-eval --live --provider luna --limit 1 --out /tmp/luna-smoke.json
uv run --project evals/receipts receipt-eval --live --provider both --out /tmp/paired-smoke.json
```

Omitting `--provider` selects both. `--limit` accepts 1 through 5 and `--max-output-tokens` accepts 256 through 1600, with defaults of 5 and 1600. Each request has a total 20-second deadline, with no retries, warm-up calls, or redirects. A single provider sends at most five requests; both send at most ten. Paired collection runs sequentially and alternates order between receipts: Gemini/Luna, then Luna/Gemini. Request and output limits are not a total token or dollar cap: image/prompt input and Gemini thinking can add billed usage.

Gemini uses `gemini-3.1-flash-lite` with its existing default thinking behavior. Luna uses `gpt-6-luna`, high image detail, `reasoning.effort: none`, `store: false`, and the default service tier. Both use the same pinned system prompt, image prompt, and expected JSON schema, followed by strict local validation.

Every completed response or failure is saved before the next request. HTTP errors stop the run and preserve its partial report. Timeout, refusal, truncation, malformed JSON, and schema failure produce failed records without retries; later planned requests continue except after HTTP errors. Any failed record gives a nonzero exit status.

Replay saved responses offline, including compatible version-1 artifacts:

```sh
uv run --project evals/receipts receipt-eval --replay /tmp/paired-smoke.json
```

Replay checks fixture identity and uses the selected local snapshot and current reference scoring. It identifies contract differences and missing legacy provenance, and preserves the source artifact. Strict schema validation can reject older permissive passes. New live artifacts identify fixture hashes, snapshot source revision and content hashes, models, request settings, normalized usage, latency, and the preserved pricing assumptions checked on **2026-10-10**.

Reports distinguish receipt extraction accuracy and derived arithmetic accuracy, schema-valid responses, full passes, and financial passes. A reference interpretation does not verify actual editor behavior or receipt draft correctness. Cost totals and cost per valid response or financial pass include known costs of failed requests. Missing required usage makes cost unknown. Cached input is priced separately; Gemini thought tokens are added to candidate tokens, while Luna output tokens already include reasoning. Estimates are not billing records.

Median and maximum describe these provider requests, excluding browser preparation, AWS, and authentication. The legacy median uses the upper middle observed latency for an even number of samples. This five-fixture smoke evaluation cannot establish production-wide accuracy or meaningful production latency percentiles.
