# Receipt extraction evaluation

Five public restaurant receipt photos and manually checked expected values make a small, reusable comparison of Gemini 3.1 Flash-Lite and GPT-6 Luna. The goal is equal or better accuracy with lower cost and equal or lower latency. This is a smoke evaluation, not evidence of production-wide accuracy or latency percentiles.

## Run without spending model tokens

Use Node 20 or newer. Install the existing UI dependencies if needed:

```sh
pnpm -C ui install --frozen-lockfile
node evals/receipts/run.mjs
node --test evals/receipts/test/*.test.mjs
```

The default command checks fixture checksums and shows the request plan. It does not contact either model. The offline tests exercise scoring, production editor mapping, request limits, and provider response handling with local data.

## Generate responses

Supply `GEMINI_API_KEY` and/or `OPENAI_API_KEY` through your shell environment. The runner does not read dotenv files or fetch deployment secrets. Start with one receipt per provider:

```sh
node evals/receipts/run.mjs --live --provider both --limit 1
```

Run either model individually or compare all five:

```sh
node evals/receipts/run.mjs --live --provider luna
node evals/receipts/run.mjs --live --provider both
```

Each invocation makes at most **10 requests**: five receipts times two providers. There are no retries or warm-up calls, and each request has a 20-second timeout and a 1,600-token output setting. `--limit 1..5` and `--max-output-tokens 256..1600` can reduce usage. Image and prompt input tokens are billed separately; these settings are not a total input-plus-output token or dollar cap. Gemini retains its default thinking behavior to match the existing request configuration, so inspect the reported reasoning usage. Luna starts with `reasoning.effort: none` and high image detail. Truncated or refused responses fail instead of triggering more requests.

Results are saved after every request under ignored `evals/receipts/results/`. HTTP errors stop the run early. Both providers' keys and the result file are checked before the first request. Existing result files are never overwritten by a new live run. Use `--out /path/run.json` for another output location.

Re-score saved responses without calling models:

```sh
node evals/receipts/run.mjs --replay evals/receipts/results/run-<timestamp>.json
```

Replay checks image identity and uses the current validation and editor code. The saved prompt/schema hash helps identify changes to the model contract. Exit status is 1 if any receipt fails or a request fails; a successful offline preflight exits 0.

## What gets scored

The evaluator imports the production prompts, JSON schema, backend validation, review normalization, UI mapper, and editor arithmetic. It checks merchant names, printed subtotal/tax/total, actual gratuity, quantities, effective unit prices, line discounts, line totals, missing or extra item rows, and the final editable subtotal and total. Comparisons use exact cents. Descriptions ignore case, accents, punctuation, and whitespace; explicit aliases cover one misspelling and the Pita Pita branch name. Rows may arrive in any order, and repeated descriptions must appear the expected number of times. Unit price may be null when the production mapper correctly derives it from a line subtotal.

Unprinted tip, fee, and discount amounts accept either null or zero, but a suggested tip cannot become an actual charge. Date/time is otherwise excluded from this first evaluation; a timestamp must be null when the photo contains no time. Addresses, currency, categories, confidence calibration, and source line numbers are not independently scored. A financial pass requires all scored monetary/item checks and any required review flag to pass. A full pass also requires scored merchant/date fields to pass.

The local metadata supplied to the UI mapper matches its existing Gemini shape. This only lets both models' extracted data exercise the same editor functions. It does not test deployed provider metadata compatibility, Cognito, API Gateway, Lambda, browser preprocessing, or network behavior on a phone.

## Fixtures and provenance

Original images come from the [ExpressExpense Sample Receipt Dataset](https://expressexpense.com/blog/free-receipt-images-ocr-machine-learning-dataset/), published under MIT. Attribution: **ExpressExpense.com**. See [the image license notice](LICENSE.receipts.md) and [the manifest](manifest.json) for provenance, hashes, expected values, and annotation notes.

| Original image | Merchant | Coverage |
| --- | --- | --- |
| [1008](fixtures/1008-receipt.jpg) | Dona Mercedes Restaurant | Multiple quantities and suggested tips |
| [1085](fixtures/1085-receipt.jpg) | Pita Pita | Quantity 20, repeated falafel rows, blank tip |
| [1144](fixtures/1144-receipt.jpg) | CHLOE81 | Included gratuity and a printed arithmetic discrepancy |
| [1113](fixtures/1113-receipt.jpg) | Golden Panda Buffet | Two quantity-2 rows and repeated payment totals |
| [1001](fixtures/1001-receipt.jpg) | Grand Lux Cafe | Repeated coffee rows and suggested gratuities |

CHLOE81 prints a $46.40 total, but its $36.00 subtotal, $3.19 tax, and $7.20 gratuity add to $46.39. The expected extracted total stays $46.40; the expected editor total is $46.39, and review must be flagged. Do not invent a one-cent fee or rewrite the source to make the numbers agree.

These are public examples with common receipt layouts and may have appeared in model training. They do not cover every failure case, including grocery receipts, handwritten paid tips, severe blur, and discounts. Add real failing cases later rather than repeatedly increasing calls on these same five images.

## Cost and latency

The report includes financial passes, valid responses, total estimated model cost, cost per valid response, cost per financial pass, median request latency, and maximum request latency. Cost per pass includes known costs from failed/truncated responses. Missing usage makes total cost unknown instead of silently treating the request as free. Provider request timings exclude local preparation, auth, and AWS infrastructure. With only five samples, use these as rough comparisons; the maximum is not a meaningful production p95.

Paid standard rates checked on 2026-10-10:

| Model | Input / million tokens | Cached input / million | Output / million |
| --- | --- | --- | --- |
| `gemini-3.1-flash-lite` | $0.25 | $0.025 | $1.50 |
| `gpt-6-luna` | $0.10 | $0.01 | $0.50 |

Sources: [Google pricing](https://ai.google.dev/gemini-api/docs/pricing) and [OpenAI pricing](https://developers.openai.com/api/docs/pricing). Gemini thinking tokens are added to candidate output tokens; OpenAI output usage already includes reasoning. Cached input is priced separately. Estimates exclude infrastructure, taxes, regional premiums, and negotiated rates. Gemini free-tier billing can make its actual cost zero; the comparison always displays paid-rate estimates. Review the rates before future runs.

The Gemini comparison uses the stable model because Google [retired the preview ID](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite-preview) still present in repository defaults. This suite does not verify which model is deployed. Request formats follow the [Gemini structured output documentation](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) and [OpenAI structured output documentation](https://developers.openai.com/api/docs/guides/structured-outputs); [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) supports image input and the selected reasoning setting.
