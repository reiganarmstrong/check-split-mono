# Bounded Gemini collection

Install the standalone locked project as described in [OFFLINE.md](OFFLINE.md).
Set `GEMINI_API_KEY` in the shell environment, then explicitly select live mode:

```sh
uv run --project evals/receipts --locked receipt-eval --live --provider gemini --limit 1 --max-output-tokens 256 --out evals/receipts/results/gemini-smoke.json
uv run --project evals/receipts --locked receipt-eval --replay evals/receipts/results/gemini-smoke.json
```

The first command makes one paid provider request; the second replays the saved
response offline. Without `--live`, the default remains offline preflight. The
runner reads only the shell key, with no dotenv loading or deployment-secret lookup.
Missing credentials or an existing/unusable output destination prevent all requests.
The output is reserved before the first request and earlier results are never
replaced by a new live run. Omit `--out` for a new timestamped file under `results/`.

Gemini uses `gemini-3.1-flash-lite`, the pinned production system and image prompts,
and the same pinned JSON schema used by local validation. Thinking behavior is
preserved by leaving `thinkingConfig` unspecified. Thought text is excluded from
extracted JSON while thought-token usage remains part of output-token estimates.

A Gemini-only run supports 1–5 receipts and 256–1600 output tokens per request, with
at most five sequential requests. Each request has a 20-second whole-request
deadline, no retries, and no warm-up calls. These request and output limits are not
a total token or dollar cap; input and any billed thinking usage also contribute.

Each completed response or failure is saved before the next request. Writes replace
the reserved artifact atomically, so a later interrupted request leaves previously
completed records readable. Provider HTTP failures, including redirects, stop further
collection and retain a partial report. Truncation, blocked output, malformed JSON,
strict-schema failures, timeouts, and transport failures are explicit failed records;
they are not retried. Other planned receipts continue after those non-HTTP failures.
Failed request or receipt checks return a nonzero exit status.

Version-2 artifacts record fixture IDs and image hashes, model ID, request settings,
pinned contract hashes and source provenance, normalized usage, request latency,
reference evaluation, and cost/latency summary. Replay retains raw responses and
source metadata without modifying this artifact. A snapshot refreshed from dirty
production content identifies those source paths rather than claiming a clean revision.

Estimated Gemini rates preserve the assumptions checked on **2026-10-10**: USD
0.25 per million input tokens, 0.025 per million cached input tokens, and 1.50 per
million output tokens. Cached input is removed from ordinary input before charging
its separate rate. Visible candidate tokens and thinking tokens are counted once
in output; the separate reasoning diagnostic is not charged again. Usage from a
truncated, blocked, or malformed extracted response remains chargeable when available.
Missing or invalid usage keeps costs unknown. Estimates are not billing records.

The five public receipt examples remain a smoke evaluation, not a production quality
gate. Accuracy and latency claims retain the limits described in [OFFLINE.md](OFFLINE.md).
Routine pytest uses local HTTP responses and never needs real provider credentials:

```sh
uv run --project evals/receipts --locked pytest evals/receipts/tests
```
