# Python offline receipt evaluation

This evaluator is a standalone [uv](https://docs.astral.sh/uv/getting-started/installation/)
project. It needs Python 3.11 or later and its own locked dependencies, with no Node,
UI installation, backend installation, provider credentials, or production imports.
Run these commands from the repository root:

```sh
uv sync --project evals/receipts --locked
uv run --project evals/receipts --locked receipt-eval
uv run --project evals/receipts --locked pytest evals/receipts/tests
```

The default command is offline preflight. It validates all five images against the
manifest, unique fixture IDs, image checksums, the 4 MiB upload limit, and the pinned
contract's content hashes. It prints the selected providers and request plan, without
provider HTTP calls. `--dry-run` explicitly selects the same mode. For a smaller plan:

```sh
uv run --project evals/receipts --locked receipt-eval --provider luna --limit 1 --max-output-tokens 256
```

`--provider` accepts `gemini`, `luna`, or `both`. Receipt count is 1–5 and output
cap is 256–1600 tokens per request; both providers plan at most ten requests. Plans
retain a 20-second timeout and no retries. These bounds are not a total token or
dollar cap. Initial dependency installation may download packages; preflight and
replay themselves make no provider HTTP requests.

## Replay existing saved runs

```sh
uv run --project evals/receipts --locked receipt-eval --replay /absolute/path/old-run.json
uv run --project evals/receipts --locked receipt-eval --replay /absolute/path/old-run.json --out /absolute/path/new-report.json
```

Replay accepts version-1 legacy runs and version-2 Python artifacts, verifies receipt
IDs and image hashes, and scores saved responses with the selected pinned contract.
It leaves the source artifact unchanged. An optional `--out` writes a distinct new
report and refuses an existing destination. Failed receipt checks and saved request
failures exit nonzero; a successful offline preflight or passing replay exits zero.
Live, replay, preflight, and snapshot refresh are mutually exclusive modes.

Replay reports contract differences. Missing source revision or provenance remains
unknown; current snapshot metadata identifies the replay contract, not the unknown
contract that generated an old response. Original run metadata and raw responses are
retained in the replay report. Missing cost metadata remains unknown rather than zero.

## Pinned production contract

`contract/snapshot.json` contains exact copies of the production system prompt,
image prompt, and JSON schema. Routine commands load only this local snapshot.
Refresh explicitly after deciding to evaluate a changed production contract:

```sh
uv run --project evals/receipts --locked receipt-eval --refresh-contract
```

Refresh reads the production TypeScript files as data; it neither imports nor runs
them. It records their source revision, source content hashes, and paths whose current
content differs from that revision. An uncommitted prompt/schema is therefore recorded
as dirty content, never attributed solely to a clean revision. Unsupported changes to
the source syntax fail rather than silently copying a different contract.

## Reading results

Receipt extraction accuracy checks printed merchant/date fields within the existing
scope, monetary values, quantities, item rows, explicit aliases, and available raw
line subtotals and unit prices. Derived arithmetic accuracy checks independent
reference interpretations: effective unit prices, item discounts and line amounts,
subtotal, receipt total, and review eligibility. Reports retain schema validity,
financial pass, full pass, failed checks, costs, and request latency. They expose raw
extracted values and derived values separately.

Null unit prices can derive from a line subtotal divided by quantity, rounded as
JavaScript `Math.round` (half cents toward positive infinity), then clamped at zero.
Discounts are subtracted from item quantity times effective unit price, with line
amounts clamped at zero. A null line subtotal is optional when the price is present.
Unprinted tip, fee, and receipt discount accept null or zero; suggested gratuities
are not paid tips. Review eligibility uses the raw flag, reported issues, or a
confidence below 0.8. An arithmetic discrepancy does not invent review eligibility.
CHLOE81 preserves printed total 4640 cents and derived receipt total 4639 cents and
passes when its extraction and required review eligibility are correct.

Schema validation deliberately differs from the old permissive validator: prohibited
extra properties are rejected at every declared level, required fields and declared
types/nullability are enforced, and declared constraints and date-time formats are
checked. A legacy pass can become a schema failure for these reasons. The copied
schema remains authoritative; descriptions in schema prose are not extra constraints.
The validator does not invent undeclared restrictions to emulate UI state validation.

Known estimated costs from failed responses count toward total cost and cost per pass.
If any request's cost is unknown, aggregate cost and cost ratios remain unknown. Median
request latency retains the old upper-middle convention for even sample counts, and
maximum latency remains available. Saved legacy usage/cost estimates are preserved,
not reconstructed from absent metadata or treated as billing records.

These five public, manually annotated examples are a smoke evaluation. Local
model-shaped pytest inputs prove evaluator behavior, not model accuracy. Reference
arithmetic does not verify actual receipt draft correctness or the application editor.
Latency excludes browser preparation, AWS, authentication, and the full upload flow;
five examples do not establish production latency percentiles or a quality gate.
Corpus attribution remains in `LICENSE.receipts.md` and `manifest.json`.
