# Migrate receipt evaluation to standalone Python

## Problem Statement

The maintainer wants to develop and run receipt extraction evaluations in Python rather than JavaScript or TypeScript. The current evaluator requires Node and UI dependencies because it imports production prompts, validation, normalization, mapping, and editor arithmetic. That coupling makes it harder to maintain an independent model comparison tool.

The migration must retain useful scoring and operational behavior without implying that an independent evaluator verifies the real application. Receipt extraction accuracy, derived arithmetic accuracy, and actual receipt draft correctness are different claims. Existing saved responses must remain useful without repeating paid model requests.

## Solution

Provide a standalone Python evaluator managed with uv. A dedicated command handles offline preflight, explicitly requested live model collection, and offline replay. pytest verifies its behavior without contacting model providers.

Use pinned local copies of the production prompts and expected JSON schema. Validate responses strictly against that schema, and use a small Python reference interpretation for item prices, review eligibility, and financial calculations. Report raw extracted values separately from derived values. Preserve the existing five-receipt comparison, request limits, cost and latency reporting, and saved-response replay.

The evaluator supports choosing between models using receipt extraction accuracy, derived arithmetic accuracy, estimated cost, and request latency. It does not establish actual editor correctness or a production quality gate.

## User Stories

1. As a maintainer, I want to manage the evaluator with uv, so that I can install dependencies and run evaluations using Python tooling.
2. As a maintainer, I want evaluation commands to run without Node, TypeScript, or UI dependencies, so that the evaluator remains independent of application runtimes.
3. As a maintainer, I want pytest to exercise the evaluator offline, so that routine tests do not spend model tokens or require provider credentials.
4. As a maintainer, I want the default command to validate fixtures and show the request plan without contacting models, so that I can check setup before spending money.
5. As a maintainer, I want live collection to require explicit selection, so that model calls are deliberate.
6. As a maintainer, I want to run either existing provider or both, so that I can evaluate one model or compare models on the same receipts.
7. As a maintainer, I want to limit receipt count and output tokens within the existing bounds, so that I can reduce request volume during smoke evaluations.
8. As a maintainer, I want the existing request timeout and absence of retries to remain, so that a run has predictable request behavior.
9. As a maintainer, I want all required credentials checked before the first request, so that a missing key does not leave a partially executed comparison.
10. As a maintainer, I want the output file reserved before requests begin, so that a run does not spend tokens before discovering that its destination is unusable.
11. As a maintainer, I want new live runs to refuse to overwrite existing results, so that previous comparisons remain available.
12. As a maintainer, I want results saved after every request, so that completed responses remain available if a later request fails.
13. As a maintainer, I want provider HTTP errors to stop further collection, so that a broken request configuration does not consume the entire planned run.
14. As a maintainer, I want to use pinned copies of the production prompts and schema, so that comparisons evaluate an identifiable production contract.
15. As a maintainer, I want contract snapshots refreshed explicitly, so that production changes do not silently change an evaluation.
16. As a maintainer, I want saved runs to identify the source revision, contract hashes, model, and request settings, so that I can understand which configuration produced a response.
17. As a maintainer, I want both providers to use the same prompt and expected schema snapshot, so that their receipt extraction results are comparable.
18. As a maintainer, I want invalid response shapes and prohibited extra properties rejected by the copied JSON schema, so that the evaluation has one explicit validation contract.
19. As a maintainer, I want truncated, refused, blocked, or malformed responses recorded as failures, so that they cannot count as valid receipt extractions.
20. As a maintainer, I want the existing five fixture images, checksums, annotations, expected values, and attribution retained, so that the migration preserves the comparison corpus.
21. As a maintainer, I want missing and extra item rows to fail scoring, so that copying a printed total cannot conceal incorrect receipt items.
22. As a maintainer, I want item order ignored and repeated descriptions matched individually, so that legitimate duplicate items are preserved without requiring a particular response order.
23. As a maintainer, I want the existing text normalization and explicit aliases retained, so that equivalent receipt descriptions continue to match.
24. As a maintainer, I want quantities, effective unit prices, discounts, and line amounts checked in exact cents, so that item-level financial mistakes remain visible.
25. As a maintainer, I want permitted null unit prices interpreted from line amounts and quantities, so that incomplete but financially usable extractions retain their current treatment.
26. As a maintainer, I want suggested gratuities kept separate from actual paid tips, so that an extraction cannot invent a charge from a suggestion.
27. As a maintainer, I want printed totals preserved separately from derived receipt totals, so that the evaluator does not rewrite the source receipt to make its arithmetic agree.
28. As a maintainer, I want CHLOE81 to pass with a printed total of $46.40 and a derived receipt total of $46.39 when its other checks and review eligibility are correct, so that a real printed discrepancy is not mistaken for extraction failure.
29. As a maintainer, I want raw review flags and derived review eligibility visible separately, so that I can distinguish model output from reference interpretation.
30. As a maintainer, I want extraction checks and derived arithmetic checks distinguishable in reports, so that I can identify the kind of failure and avoid treating reference calculations as editor verification.
31. As a maintainer, I want the existing financial-pass and full-pass distinctions retained, so that monetary accuracy can be compared separately from the additional scored merchant and date fields.
32. As a maintainer, I want saved responses replayed without network access, so that I can investigate failures or change scoring without repeating model calls.
33. As a maintainer, I want the existing saved-run format readable, so that prior evaluation work survives the migration.
34. As a maintainer, I want replay to verify fixture identity and identify contract changes, so that I do not mistake results from different receipts or contracts for equivalent comparisons.
35. As a maintainer, I want stricter-validation replay differences documented, so that a changed pass result has an explanation rather than hidden compatibility behavior.
36. As a maintainer, I want known costs from failed responses included in cost per pass, so that unsuccessful requests do not make a model look artificially cheap.
37. As a maintainer, I want missing usage to produce unknown cost rather than zero cost, so that incomplete provider metadata does not distort a comparison.
38. As a maintainer, I want cached input and reasoning usage accounted for correctly, so that estimates do not omit or double-count billed usage.
39. As a maintainer, I want valid responses, passes, estimated total cost, cost per valid response, cost per financial pass, median latency, and maximum latency reported, so that I can compare the same dimensions as today.
40. As a maintainer, I want failed runs to return a nonzero exit status and explain failed checks, so that scripts and humans can recognize unsuccessful evaluations.
41. As a maintainer, I want Python run, test, and replay instructions documented, so that future contributors can operate the evaluator independently.
42. As a maintainer, I want reports to identify this corpus as a smoke evaluation, so that five public receipt examples are not presented as proof of production-wide quality or latency percentiles.

## Implementation Decisions

- Use a standalone uv-managed Python project with declared dependencies and a committed dependency lock. The evaluator must not import production code, invoke a Node bridge, or require installation of the UI or backend dependency trees.
- Keep the existing conceptual responsibilities: command orchestration, fixture loading, provider request and response handling, reference interpretation and scoring, saved-run handling, and reporting. Module boundaries are implementation choices; avoid adding a service or framework to perform these responsibilities.
- Use a dedicated command for live collection and reports. pytest is an offline verification tool, not the live model orchestration interface.
- Copy the production system prompt, image prompt, and expected response JSON schema into a pinned local contract snapshot. Use only that production prompt snapshot; do not add prompt experiment overrides.
- Refresh snapshots explicitly when evaluating a changed production contract. Record the source revision and content hashes in new saved runs alongside the model, settings, and fixture identity. When production source has uncommitted changes, identify that provenance honestly rather than attributing changed content solely to a clean revision.
- Validate model responses strictly against the copied JSON schema, including its required fields, types, nullability, extra-property restrictions, and declared constraints. Do not emulate a more permissive production validator merely to retain legacy passes.
- Retain the current fixture corpus and manually checked expectations. Validate image hashes, unique fixture IDs, and the existing image-size constraint before model requests. Retain dataset provenance and license attribution.
- Preserve the existing scoring coverage and accepted financial interpretations in a small Python reference calculation. It must not recreate UI state or claim to execute the actual editor.
- Preserve exact-cent comparisons, current text normalization and aliases, order-independent row matching, and separate consumption of repeated descriptions. Missing or extra rows fail.
- Preserve effective unit-price derivation when a unit price is null and a line subtotal is available. Preserve current quantity, discount, line-subtotal, derived subtotal, and derived receipt total behavior, including compatible rounding where a derived price is fractional cents. Do not silently substitute Python's default rounding for the existing interpretation.
- Keep raw extracted values intact. Label derived prices, amounts, and review eligibility separately so that reference interpretation does not appear to be original model output.
- Preserve review eligibility from the raw review flag, reported issues, and the existing low-confidence rule. Report the raw flag and derived eligibility separately. Do not invent a new rule that automatically fixes every incorrect review flag from an arithmetic mismatch.
- Retain the existing treatment of null or zero for unprinted tip, fee, and receipt discount amounts. A suggested gratuity must not become an actual paid tip. Preserve current optional line-subtotal checks and scoped merchant/date checks.
- Keep printed totals separate from derived receipt totals. A printed/derived disagreement is observable information, not automatically a failed extraction. CHLOE81 remains the explicit example: printed 4640 cents, derived 4639 cents, with the required review eligibility.
- Report receipt extraction accuracy and derived arithmetic accuracy distinctly while retaining schema validity, financial pass, and full pass. Continue to explain which checks failed. New terminology must not imply verification of actual receipt draft correctness.
- Preserve provider selection and request settings for the existing comparison. Keep request ordering sequential with the existing alternation between providers when both are selected.
- Default to offline preflight. Retain explicit live and replay modes, reject incompatible mode selections, and retain the supported receipt count of 1 through 5 and output-token range of 256 through 1600. With both providers, at most 10 model requests are planned.
- Retain a 20-second request timeout, no retries, and no warm-up requests. Output-token and request-count limits are not a total token or dollar cap. Refusals, truncation, and blocked or malformed responses fail without additional calls.
- Obtain provider credentials from the existing shell environment variables. Do not add deployment-secret fetching or automatic dotenv loading. Check all selected providers' credentials and reserve the output before the first model request.
- Never overwrite an existing live-run result. Save completed records after each request. Stop collection early on a provider HTTP error and preserve the partial report.
- Keep existing saved runs readable and replayable offline. Replay uses the selected local contract snapshot and current Python scoring, verifies fixture identity, identifies contract differences, and does not overwrite the source artifact or fabricate missing provenance for older runs.
- Document changed replay outcomes caused by strict schema validation. Preserve unaffected scoring behavior and make other migration differences explicit rather than hiding them to manufacture equivalence.
- Preserve usage normalization and estimated-cost accounting, including known costs from failed or truncated requests, separate cached input treatment, and reasoning-token handling without double counting. Missing usage yields unknown cost rather than a free request. Preserve pricing assumptions and their recorded verification date as evaluation metadata; do not treat estimates as billing records.
- Preserve the existing report dimensions and nonzero exit status for a failed receipt or request. Offline preflight succeeds with status zero when its checks pass.
- Update contributor documentation for uv installation, offline testing, preflight, bounded live collection, snapshot refresh, and replay. Replace obsolete evaluator runtime instructions as part of the migration.

## Testing Decisions

- Confirmed primary test seam: the evaluator's public command runner. Drive it with arguments, real fixture inputs, temporary result destinations, and controlled provider HTTP responses. Observe exit status, reports, saved artifacts, and emitted requests. This carries forward the existing runner-level preflight/live/replay tests.
- Use pytest parameterization to exercise the five receipts and meaningful failure scenarios through this seam. Tests should check externally visible behavior, not private function calls, module layout, helper names, or implementation-mirroring arithmetic.
- Substitute responses at the provider HTTP boundary for mocked live runs. No verification test contacts a real model provider or needs real credentials. Observe request counts and bodies to establish provider selection, contract use, request settings, and lack of retries.
- Exercise fixture handling, snapshot loading, schema validation, reference interpretation, row matching, reporting, artifact persistence, and replay together through the runner wherever possible. Prefer this existing high-level seam to a new set of per-module test interfaces.
- Preserve the behavioral scenarios already covered by the current offline suite: fixture integrity, wrong unit prices despite correct printed totals, missing and extra rows, repeated rows in different orders, suggested tips, null-price fallback, the CHLOE81 discrepancy, required review eligibility, and scoped date checks.
- Add focused runner/replay cases for the intentional validation change: prohibited extra properties, wrong types, missing required fields, and other constraints in the copied schema. Assert explicit validation failures rather than implementation-specific exception messages.
- Verify raw and derived observations remain distinguishable, including a null unit price that is successfully derived and a raw review flag whose derived eligibility differs because of an issue or low confidence. Include fractional-cent rounding behavior as an observable reference-calculation case.
- Retain provider response cases for refusal, truncation, blocked output, malformed JSON, thought-part exclusion, missing usage, cached input, and reasoning usage. Assert failures and reported costs without additional requests.
- Verify operational behavior: default preflight and replay issue zero HTTP calls; a complete mocked comparison issues at most 10; failed requests are not retried; provider HTTP failure stops collection; existing outputs and missing credentials prevent requests; completed records survive an interrupted run.
- Replay representative version-1 saved records and compare externally visible checks and reports. Explain strict-schema differences and preserve unaffected outcomes. Hand-built model-shaped examples are test inputs, not evidence of actual model accuracy.
- Verify summary metrics include chargeable failed responses, retain unknown-cost behavior, and preserve financial-pass versus full-pass distinctions. Test latency reporting without depending on real network speed or brittle elapsed-time thresholds.
- Verify the documented uv workflow operates without the application dependency trees or Node. Offline pytest may run in CI; live model accuracy results must not become an automatic production quality gate.

## Out of Scope

- Changes to production receipt extraction, application prompts, backend validation, editor behavior, or deployed provider integration.
- Production-code imports, runtime bridges, a deployed evaluation service, or replication of full UI state.
- Verification of actual receipt draft correctness, browser preprocessing, Cognito, API Gateway, Lambda, phone networking, or the deployed upload-to-draft flow.
- Experimental prompt overrides, prompt sweeps, new providers, or a general-purpose evaluation platform.
- Expanding the five-receipt corpus or adding new independent accuracy dimensions such as address extraction, currency accuracy, categories, confidence calibration, or source line numbers.
- Paid model runs as part of implementation verification, automatic retries, warm-up calls, or larger request budgets.
- Production accuracy guarantees, meaningful production latency percentiles, or an automated quality gate based on this smoke corpus.

## Further Notes

This specification synthesizes the agreed architecture recorded in ADR 0001. The choice to copy and pin production contracts is intentional: the evaluator must remain independent, and snapshot refresh is explicit.

Reading an old saved run does not guarantee that it receives the old pass result. Strict JSON schema validation is an agreed behavioral change. Legacy metadata that describes the old editor checks must not be mistaken for evidence that the Python evaluator exercised the application.

The five images are public restaurant receipt examples with manually checked labels and retained ExpressExpense attribution. They may have appeared in model training, and they do not cover the full range of real receipt failures. Cost and latency observations describe these bounded requests rather than production traffic.
