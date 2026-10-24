# Receipt extraction smoke evaluation

A standalone Python evaluator compares `gemini-3.1-flash-lite` and `gpt-6-luna`
on five public restaurant receipts with manually checked expected values. It
reports receipt extraction accuracy, independent derived arithmetic accuracy,
estimated cost, and request latency. This smoke corpus does not establish
production-wide accuracy, production latency percentiles, or actual receipt draft
correctness.

## Setup and offline verification

Install [uv](https://docs.astral.sh/uv/getting-started/installation/). The project
requires Python 3.11 or later; uv can manage its Python runtime. Run from the
repository root:

```sh
uv sync --project evals/receipts --locked
uv run --project evals/receipts --locked receipt-eval
uv run --project evals/receipts --locked pytest evals/receipts/tests
```

The evaluator has its own declared dependencies and committed `uv.lock`. It needs
no Node, TypeScript runtime, UI/backend dependency installation, deployment secrets,
or real provider credentials for preflight, replay, or pytest. Dependency setup can
download Python/packages; offline evaluation modes make zero provider HTTP calls.
Tests use local model-shaped inputs and controlled provider HTTP responses, not
paid model requests. Snapshot-refresh tests read production source files and use
Git, but never import or execute production code.

Default preflight validates all five image checksums, unique IDs, the 4 MiB image
limit, and pinned contract content hashes, then shows the selected request plan.
`--dry-run` explicitly selects the same offline mode. A smaller plan is also offline:

```sh
uv run --project evals/receipts --locked receipt-eval --provider luna --limit 1 --max-output-tokens 256
```

## Explicit bounded collection

Supply credentials for the selected providers: `GEMINI_API_KEY` for Gemini,
`OPENAI_API_KEY` for Luna, or both for a comparison. Set them in your shell or copy
the local environment template:

```sh
cp evals/receipts/.env.example evals/receipts/.env
```

Fill in the keys in `evals/receipts/.env`, which Git ignores. Use uv's explicit
`--env-file` option to load the file into the runner's environment:

```sh
uv run --project evals/receipts --locked --env-file evals/receipts/.env receipt-eval --live --provider both --limit 1
```

The evaluator itself does not automatically load dotenv files or fetch deployment
secrets. All selected keys and the output destination are checked before the first
request. Preflight and replay remain offline, including when using `--env-file`.

Start with one receipt per provider and a distinct output path:

```sh
uv run --project evals/receipts --locked receipt-eval --live --provider both --limit 1 --max-output-tokens 256 --out evals/receipts/results/paired-smoke.json
```

Choose an individual provider or compare all five receipts:

```sh
uv run --project evals/receipts --locked receipt-eval --live --provider gemini --limit 1
uv run --project evals/receipts --locked receipt-eval --live --provider luna --limit 1
uv run --project evals/receipts --locked receipt-eval --live --provider both
```

Omitting `--provider` selects `both`. Receipt count is 1–5, default 5; output cap is
256–1600 tokens per request, default 1600. Each request has a 20-second whole-request
deadline, with no retries, warm-up calls, or redirects. One provider sends at most
five requests; both send at most ten. Collection is sequential, alternating order
between receipts: Gemini/Luna, then Luna/Gemini. These request/output limits are
**not a total token or dollar cap**; image/prompt input and billed thinking usage
also contribute.

Both providers use the same pinned system prompt, image prompt, and expected JSON
schema. Gemini leaves `thinkingConfig` unspecified to retain its existing behavior.
Luna uses high image detail, `reasoning.effort: none`, `store: false`, and the default
service tier. Neither provider supports prompt experiments in this evaluator.

Without `--out`, live results use a timestamped file under ignored `results/`. Live
collection exclusively reserves its destination and refuses to overwrite an existing
file. Every completed response or failure is saved atomically before the next request;
a later interrupted request leaves earlier records readable. A provider HTTP error
stops collection and preserves a partial report. Blocked output, refusals, truncation,
malformed JSON, strict-schema failures, timeouts, and transport errors fail without
retries; remaining planned requests continue except after HTTP errors.

Any failed receipt or request gives a nonzero exit status. Successful preflight and
fully passing collection/replay exit zero. Live, replay, dry-run, and contract refresh
are mutually exclusive modes.

## Replay saved responses without spending tokens

```sh
uv run --project evals/receipts --locked receipt-eval --replay evals/receipts/results/paired-smoke.json
uv run --project evals/receipts --locked receipt-eval --replay evals/receipts/results/paired-smoke.json --out evals/receipts/results/paired-rescored.json
```

Replay reads legacy version-1 runs and version-2 Python artifacts, verifies fixture
IDs and image hashes, and rescores responses against the selected local snapshot and
current reference interpretation. It makes zero provider HTTP calls and never changes
the source artifact. Optional `--out` writes a distinct new report and refuses an
existing destination. A partial or failing saved run continues to exit nonzero when
its saved failures are replayed.

Contract differences are reported. Missing legacy source revision, hashes, usage, or
provenance stay unknown: current replay metadata identifies the evaluation contract,
not an undocumented contract that generated an old response. Original run metadata
and raw responses are retained, including across replay of a replay. Version-2 live
artifacts record fixture identity, model, request settings, snapshot source revision
and content hashes, usage, latency, evaluations, and pricing assumptions.

## Refresh the pinned production contract explicitly

`contract/snapshot.json` contains copied production system/image prompts and the
expected response JSON schema. Routine preflight, collection, and replay read only
that local snapshot; production changes do not silently change an evaluation.
After deciding to evaluate a changed production contract, refresh from this checkout:

```sh
uv run --project evals/receipts --locked receipt-eval --refresh-contract
```

Refresh reads the TypeScript sources as data without a Node bridge or production
imports. The snapshot records source revision, source content hashes, individual
prompt/schema hashes, and a combined contract hash compatible with legacy runs.
`dirtySourcePaths` identifies prompt/schema content that differs from the recorded
revision, so uncommitted content is never attributed solely to a clean revision.
Unsupported source syntax fails rather than copying an unintended contract. Review
and commit an intentional snapshot refresh with the production change it represents.

## Scoring and migration differences

Receipt extraction accuracy covers scoped merchant/date fields, printed monetary
values, quantities, item rows, explicit aliases, and available raw item prices and
line subtotals. Text matching ignores case, accents, punctuation, and whitespace.
Rows may arrive in any order; repeated descriptions are consumed individually using
the closest financial match. Missing or extra rows fail, even if the printed total
was copied correctly. Addresses, currency, categories, confidence calibration, and
source line numbers are not added accuracy dimensions.

Derived arithmetic accuracy covers independent effective unit prices, item discounts,
line amounts, subtotal, receipt total, and review eligibility. Null unit prices derive
from line subtotal divided by quantity when available, with `Math.round`-compatible
half cents rounded toward positive infinity and the result clamped at zero; otherwise
the fallback is zero. Item amounts are quantity times effective unit price minus item
discount, clamped at zero. Raw null prices, extracted amounts, and review flags remain
visible separately from these derived values.

Unprinted tip, fee, and receipt discount accept null or zero. Suggested gratuities
never become actual paid tips. Raw line-subtotal checks are optional when that value
is null. Review eligibility uses the raw flag, reported issues, or item confidence
below 0.8; an arithmetic disagreement alone does not invent a review flag. Date/time
checks retain the existing scope, including null where no reliable time is visible.

Reports retain schema validity, financial pass, full pass, and failed-check explanations.
Financial pass requires all scored monetary/item checks and any required review
eligibility. Full pass additionally requires the scoped merchant/date checks. Extraction
and derived-arithmetic pass fields distinguish the kind of accuracy being checked.

Validation now strictly follows the copied JSON schema: required properties, declared
types/nullability, prohibited extra properties, constraints, and date-time formats are
enforced. These rules intentionally reject some legacy permissive passes. Schema prose
is not an additional constraint, and undeclared restrictions are not invented to emulate
UI validation. Invalid/non-finite JSON and malformed provider output fail explicitly.

Legacy editor check names are renamed in Python reports:

| Legacy check | Python reference check |
| --- | --- |
| `item[n].editorLineSubtotalCents` | `item[n].derivedLineSubtotalCents` |
| `editorSubtotalCents` | `derivedSubtotalCents` |
| `editorTotalCents` | `derivedReceiptTotalCents` |

The unchanged manifest retains its original `editorSubtotalCents` and `editorTotalCents`
keys as expectation data. Neither those keys nor old saved editor metadata mean that
Python ran the application editor. Reference interpretation checks derived arithmetic;
it does **not verify actual receipt draft correctness**, deployed provider integration,
browser preprocessing, Cognito, API Gateway, Lambda, or the upload-to-draft flow.

## Fixtures and provenance

Original images come from the [ExpressExpense Sample Receipt Dataset](https://expressexpense.com/blog/free-receipt-images-ocr-machine-learning-dataset/),
published under MIT. Attribution: **ExpressExpense.com**. The [image license notice](LICENSE.receipts.md)
and [manifest](manifest.json) retain source URLs, archive checksum, image hashes,
manually checked expectations, and annotation notes. The five images are unchanged.

| Original image | Merchant | Coverage |
| --- | --- | --- |
| [1008](fixtures/1008-receipt.jpg) | Dona Mercedes Restaurant | Multiple quantities and suggested tips |
| [1085](fixtures/1085-receipt.jpg) | Pita Pita | Quantity 20, repeated falafel rows, blank tip |
| [1144](fixtures/1144-receipt.jpg) | CHLOE81 | Paid gratuity and printed arithmetic discrepancy |
| [1113](fixtures/1113-receipt.jpg) | Golden Panda Buffet | Two quantity-2 rows and repeated payment totals |
| [1001](fixtures/1001-receipt.jpg) | Grand Lux Cafe | Repeated coffee rows and suggested gratuities |

CHLOE81 prints 4640 cents, while 3600 subtotal + 319 tax + 720 paid gratuity gives
4639 cents. It passes with the printed total preserved, the correct derived receipt
total, and required review eligibility. A printed/derived disagreement does not
itself fail extraction. Do not invent a one-cent fee or rewrite the printed total.

These public examples may have appeared in model training and cover a narrow range
of restaurant layouts. They omit many real failures, including severe blur, grocery
receipts, and handwritten paid tips. Local model-shaped test inputs verify evaluator
behavior rather than either model's accuracy. The corpus is a smoke evaluation,
not an automatic production quality gate.

## Cost and request latency

Summaries show valid responses, full passes, financial passes, extraction/derived
passes, total estimated cost, cost per valid response, cost per financial pass, median
request latency, and maximum request latency. Known costs from failed/truncated
responses count toward total cost and cost per pass. If any cost is unknown,
aggregate cost and ratios remain unknown; missing usage does not imply a free request.
Legacy saved estimates are preserved rather than reconstructed from absent usage.

Preserved paid-rate assumptions, checked on **2026-10-10**, in USD per million tokens:

| Model | Input | Cached input | Output |
| --- | --- | --- | --- |
| `gemini-3.1-flash-lite` | $0.25 | $0.025 | $1.50 |
| `gpt-6-luna` | $0.10 | $0.01 | $0.50 |

Cached input is deducted from ordinary input and charged at its separate rate.
Gemini thinking tokens are added to visible candidate tokens exactly once; Luna's
output usage already includes reasoning, so reasoning is not added again. Estimates
are not billing records and exclude infrastructure, taxes, and negotiated rates.
Review pricing before interpreting future paid runs; the saved verification date
identifies these assumptions rather than promising current rates.

Latency covers individual provider requests and excludes browser preparation,
authentication, AWS, and the full application flow. Median retains the legacy upper
middle observation for even sample counts. With five receipts, maximum latency is
not a meaningful production p95.
