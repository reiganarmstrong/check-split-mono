# Use an independent Python receipt evaluator

The receipt evaluator will use Python with uv, a dedicated command for live model collection and comparison reports, and pytest for offline checks. It will use local copies of the production prompts and expected schemas, with no production-code imports, runtime bridge, or experimental prompt overrides. Its initial purpose is comparing models by accuracy, cost, and latency; the five-receipt smoke set does not establish a production quality gate.

The migration will retain the five receipt fixtures, scoring coverage, request limits, cost and latency reports, and compatibility with existing saved-response replay. A small Python reference interpretation will preserve derived item prices, review eligibility, and financial calculations, with raw model values visible alongside derived values. These checks establish extraction and derived arithmetic accuracy, not actual editor correctness: CHLOE81 should pass with a printed total of $46.40 and a derived total of $46.39.

Production prompt and schema copies will be pinned snapshots, refreshed explicitly when evaluating a changed production contract. Saved runs will record the source revision and content hashes so comparisons identify the exact contract used.

Response validation will enforce the copied JSON schema rather than reproduce the production validator's more permissive behavior. Existing saved runs remain readable and can be rescored; differences caused by stricter schema validation will be documented rather than hidden to preserve old pass results.
