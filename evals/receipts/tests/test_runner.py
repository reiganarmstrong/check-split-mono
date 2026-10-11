"""Model-shaped local inputs verify behavior; they do not measure model accuracy."""
import hashlib
import io
import json
import shutil
import subprocess
from pathlib import Path

import httpx
import pytest

from receipt_eval.runner import main

DIRECTORY = Path(__file__).resolve().parents[1]


def test_default_preflight_validates_real_fixtures_without_http():
    output = io.StringIO()
    status = main([], stdout=output)
    assert status == 0
    assert "5 fixtures; 10 planned requests" in output.getvalue()
    assert "gemini, luna" in output.getvalue()
    assert "Offline preflight passed" in output.getvalue()


def test_snapshot_refresh_records_contract_and_source_provenance(tmp_path):
    output = io.StringIO()
    status = main(["--refresh-contract"], directory=tmp_path, source_root=DIRECTORY.parents[1], stdout=output)
    assert status == 0
    snapshot = json.loads((tmp_path / "contract" / "snapshot.json").read_text())
    assert snapshot["systemPrompt"].startswith("You extract structured receipt data")
    assert snapshot["imagePrompt"].startswith("Extract this receipt image")
    assert snapshot["schema"]["additionalProperties"] is False
    assert len(snapshot["provenance"]["sourceRevision"]) == 40
    assert snapshot["provenance"]["dirtySourcePaths"] == []
    assert len(snapshot["contractSha256"]) == 64
    assert "Refreshed pinned contract" in output.getvalue()


MANIFEST = json.loads((DIRECTORY / "manifest.json").read_text())


def example_response(fixture_id):
    gold = next(f["expected"] for f in MANIFEST["fixtures"] if f["id"] == fixture_id)
    first = lambda value: value[0] if isinstance(value, list) else value
    return {
        "createReceiptInputDraft": {
            "allocationPolicy": "EVEN", "capturedAt": None, "currencyCode": None,
            "discountCents": 0, "feeCents": 0, "locationAddress": None, "locationLat": None,
            "locationLng": None, "locationName": None, "receiptOccurredAt": None,
            "merchantName": first(gold["merchantName"]),
            "subtotalCents": gold["receipt"]["subtotalCents"], "taxCents": gold["receipt"]["taxCents"],
            "tipCents": first(gold["receipt"]["tipCents"]), "totalCents": gold["receipt"]["totalCents"],
        },
        "issues": [], "needsReview": gold.get("needsReview", False),
        "upsertReceiptItemInputDrafts": [
            {**item, "description": first(item["description"]), "category": None,
             "scanConfidence": None, "sourceLineNumber": index + 1}
            for index, item in enumerate(gold["items"])
        ],
    }


def replay(tmp_path, fixture_id="1008", response=None, *, records=None, metadata=None, directory=DIRECTORY):
    fixture = next(f for f in MANIFEST["fixtures"] if f["id"] == fixture_id)
    if records is None:
        records = [{"fixtureId": fixture_id, "imageSha256": fixture["sha256"], "provider": "luna",
                    "modelId": "gpt-6-luna", "response": example_response(fixture_id) if response is None else response,
                    "requestLatencyMs": 100, "estimatedCostUsd": 0.001}]
    source = tmp_path / "legacy.json"
    source.write_text(json.dumps({"version": 1, **(metadata or {}), "records": records}))
    original = source.read_bytes()
    destination = tmp_path / "rescored.json"
    output = io.StringIO()
    status = main(["--replay", str(source), "--out", str(destination)], directory=directory, stdout=output)
    assert source.read_bytes() == original
    report = json.loads(destination.read_text()) if destination.exists() else None
    return status, report, output.getvalue()


@pytest.mark.parametrize("fixture_id", ["1008", "1085", "1144", "1113", "1001"])
def test_replay_scores_all_five_real_receipts_and_retains_raw_outputs(tmp_path, fixture_id):
    response = example_response(fixture_id)
    status, report, output = replay(tmp_path, fixture_id, response)
    assert status == 0
    record = report["records"][0]
    assert record["response"] == response
    assert record["evaluation"]["schemaValid"]
    assert record["evaluation"]["passed"]
    assert record["evaluation"]["financialPassed"]
    assert record["evaluation"]["receiptExtractionPassed"]
    assert record["evaluation"]["derivedArithmeticPassed"]
    assert report["sourceRunMetadata"] == {"version": 1}
    assert report["replay"]["sourceProvenance"] is None
    assert "legacy provenance unknown" in output
    assert "does not verify actual receipt draft correctness" in output
    assert "strict JSON schema" in output


@pytest.mark.parametrize("mutation,failed_field", [
    ("wrong_price", "item[1].unitPriceCents"),
    ("missing_row", "itemCount"),
    ("extra_row", "itemCount"),
    ("suggested_tip", "tipCents"),
    ("wrong_discount", "item[1].extractedDiscountCents"),
    ("wrong_line_subtotal", "item[1].extractedLineSubtotalCents"),
    ("wrong_quantity", "item[1].quantity"),
    ("wrong_subtotal", "subtotalCents"),
    ("wrong_total", "totalCents"),
])
def test_financial_errors_fail_even_with_copied_printed_total(tmp_path, mutation, failed_field):
    response = example_response("1008")
    items = response["upsertReceiptItemInputDrafts"]
    if mutation == "wrong_price":
        items[1]["unitPriceCents"] = 675
    elif mutation == "missing_row":
        items.pop()
    elif mutation == "extra_row":
        items.append(dict(items[0]))
    elif mutation == "suggested_tip":
        response["createReceiptInputDraft"]["tipCents"] = 440
    elif mutation == "wrong_discount":
        items[1]["discountCents"] = 10
    elif mutation == "wrong_line_subtotal":
        items[1]["lineSubtotalCents"] = 674
    elif mutation == "wrong_quantity":
        items[1]["quantity"] = 1
    else:
        response["createReceiptInputDraft"]["subtotalCents" if mutation == "wrong_subtotal" else "totalCents"] = 1
    status, report, _ = replay(tmp_path, response=response)
    assert status == 1
    evaluation = report["records"][0]["evaluation"]
    assert evaluation["schemaValid"]
    assert not evaluation["financialPassed"]
    assert failed_field in evaluation["failures"]


@pytest.mark.parametrize("fixture_id", ["1085", "1001"])
def test_repeated_rows_are_consumed_individually_in_any_order(tmp_path, fixture_id):
    response = example_response(fixture_id)
    response["upsertReceiptItemInputDrafts"].reverse()
    assert replay(tmp_path, fixture_id, response)[0] == 0


def test_explicit_aliases_and_unicode_text_normalization_match(tmp_path):
    response = example_response("1085")
    response["createReceiptInputDraft"]["merchantName"] = "PÍTA—PITA"
    response["upsertReceiptItemInputDrafts"][-1]["description"] = "Miscellaneous"
    status, report, _ = replay(tmp_path, "1085", response)
    assert status == 0
    assert report["records"][0]["evaluation"]["passed"]


@pytest.mark.parametrize("unprinted", [None, 0])
def test_null_or_zero_unprinted_charges_and_optional_line_subtotals_pass(tmp_path, unprinted):
    response = example_response("1008")
    for field in ("tipCents", "feeCents", "discountCents"):
        response["createReceiptInputDraft"][field] = unprinted
    for item in response["upsertReceiptItemInputDrafts"]:
        item["lineSubtotalCents"] = None
    assert replay(tmp_path, response=response)[0] == 0


def test_null_unit_prices_are_reported_separately_from_derived_prices(tmp_path):
    response = example_response("1113")
    for item in response["upsertReceiptItemInputDrafts"]:
        item["unitPriceCents"] = None
    status, report, _ = replay(tmp_path, "1113", response)
    assert status == 0
    observations = report["records"][0]["evaluation"]["observations"]
    assert observations["raw"]["upsertReceiptItemInputDrafts"][0]["unitPriceCents"] is None
    assert observations["derived"]["items"][0]["effectiveUnitPriceCents"] == 1199


def test_fractional_cent_fallback_rounds_half_up_and_separates_extraction_from_arithmetic(tmp_path):
    response = example_response("1113")
    item = response["upsertReceiptItemInputDrafts"][0]
    item["unitPriceCents"] = None
    item["lineSubtotalCents"] = 2397  # /2 = 1198.5; Math.round gives 1199, unlike Python round.
    status, report, _ = replay(tmp_path, "1113", response)
    assert status == 1
    evaluation = report["records"][0]["evaluation"]
    assert not evaluation["receiptExtractionPassed"]
    assert evaluation["derivedArithmeticPassed"]
    assert evaluation["observations"]["derived"]["items"][0]["effectiveUnitPriceCents"] == 1199
    assert evaluation["observations"]["derived"]["receiptTotalCents"] == 2996
    assert evaluation["failures"] == ["item[0].extractedLineSubtotalCents"]


@pytest.mark.parametrize("eligibility,expected_pass", [("raw", True), ("issue", True), ("low_confidence", True),
                                                       ("boundary", False), ("none", False)])
def test_chloe_disagreement_requires_review_without_rewriting_raw_flag(tmp_path, eligibility, expected_pass):
    response = example_response("1144")
    response["needsReview"] = eligibility == "raw"
    if eligibility == "issue":
        response["issues"] = ["Printed total differs by one cent"]
    if eligibility in ("low_confidence", "boundary"):
        response["upsertReceiptItemInputDrafts"][0]["scanConfidence"] = 0.79 if eligibility == "low_confidence" else 0.8
    status, report, _ = replay(tmp_path, "1144", response)
    assert status == (0 if expected_pass else 1)
    evaluation = report["records"][0]["evaluation"]
    observations = evaluation["observations"]
    assert observations["raw"]["createReceiptInputDraft"]["totalCents"] == 4640
    assert observations["derived"]["receiptTotalCents"] == 4639
    assert observations["raw"]["needsReview"] == (eligibility == "raw")
    assert observations["derived"]["needsReview"] == expected_pass
    if not expected_pass:
        assert evaluation["failures"] == ["needsReview"]


@pytest.mark.parametrize("fixture_id,field,value", [
    ("1008", "merchantName", "Other merchant"),
    ("1144", "receiptOccurredAt", "2018-08-03T00:00:00Z"),
])
def test_merchant_and_scoped_date_errors_affect_full_pass_but_not_financial_pass(tmp_path, fixture_id, field, value):
    response = example_response(fixture_id)
    response["createReceiptInputDraft"][field] = value
    status, report, _ = replay(tmp_path, fixture_id, response)
    assert status == 1
    evaluation = report["records"][0]["evaluation"]
    assert evaluation["financialPassed"]
    assert evaluation["failures"] == [field]
    assert report["summary"]["luna"]["passedReceipts"] == 0
    assert report["summary"]["luna"]["financialPassedReceipts"] == 1


def test_unscored_visible_timestamps_do_not_add_an_accuracy_dimension(tmp_path):
    response = example_response("1113")
    response["createReceiptInputDraft"]["receiptOccurredAt"] = "2018-06-02T16:18:31-04:00"
    assert replay(tmp_path, "1113", response)[0] == 0


@pytest.mark.parametrize("location,field,value", [
    ("root", "extra", True),
    ("draft", "extra", 1),
    ("item", "extra", "invented"),
    ("root", "needsReview", "false"),
    ("draft", "totalCents", "2447"),
    ("draft", "subtotalCents", True),
    ("draft", "allocationPolicy", "WEIGHTED"),
    ("draft", "capturedAt", "not-a-date"),
    ("draft", "receiptOccurredAt", "2018-08-03"),
    ("item", "quantity", 0),
    ("item", "quantity", 1.5),
    ("item", "quantity", None),
    ("item", "scanConfidence", 1.1),
    ("item", "scanConfidence", -0.01),
    ("item", "sourceLineNumber", 0),
    ("item", "discountCents", None),
    ("item", "description", None),
])
def test_strict_schema_rejects_extra_fields_types_nullability_and_declared_constraints(tmp_path, location, field, value):
    response = example_response("1008")
    target = response if location == "root" else response["createReceiptInputDraft"] if location == "draft" \
        else response["upsertReceiptItemInputDrafts"][0]
    target[field] = value
    status, report, output = replay(tmp_path, response=response)
    assert status == 1
    evaluation = report["records"][0]["evaluation"]
    assert not evaluation["schemaValid"]
    assert not evaluation["passed"]
    assert any("schema:" in failure for failure in evaluation["failures"])
    assert "strict JSON schema" in output
    assert report["records"][0]["response"] == response


@pytest.mark.parametrize("location,field", [("root", "issues"), ("draft", "capturedAt"), ("item", "sourceLineNumber")])
def test_strict_schema_enforces_required_properties(tmp_path, location, field):
    response = example_response("1008")
    target = response if location == "root" else response["createReceiptInputDraft"] if location == "draft" \
        else response["upsertReceiptItemInputDrafts"][0]
    del target[field]
    status, report, _ = replay(tmp_path, response=response)
    assert status == 1
    assert not report["records"][0]["evaluation"]["schemaValid"]


def test_schema_integer_values_serialized_with_decimal_point_can_use_null_price_fallback(tmp_path):
    response = example_response("1113")
    item = response["upsertReceiptItemInputDrafts"][0]
    item["quantity"] = 2.0
    item["lineSubtotalCents"] = 2398.0
    item["unitPriceCents"] = None
    status, report, _ = replay(tmp_path, "1113", response)
    assert status == 0
    assert report["records"][0]["evaluation"]["observations"]["derived"]["items"][0]["effectiveUnitPriceCents"] == 1199


def test_summary_counts_chargeable_saved_failures_and_retains_latency_statistics(tmp_path):
    fixture = MANIFEST["fixtures"][0]
    base = {"fixtureId": "1008", "imageSha256": fixture["sha256"], "provider": "luna",
            "modelId": "gpt-6-luna", "response": example_response("1008"),
            "requestLatencyMs": 100, "estimatedCostUsd": 0.001}
    failure = {**base, "response": None, "error": "OpenAI response status: incomplete",
               "requestLatencyMs": 500, "estimatedCostUsd": 0.003}
    status, report, output = replay(tmp_path, records=[base, failure])
    assert status == 1
    row = report["summary"]["luna"]
    assert row["attemptedReceipts"] == 2
    assert row["validResponses"] == 1
    assert row["passedReceipts"] == 1
    assert row["financialPassedReceipts"] == 1
    assert row["estimatedTotalCostUsd"] == 0.004
    assert row["estimatedCostPerValidResponseUsd"] == 0.004
    assert row["estimatedCostPerFinancialPassUsd"] == 0.004
    assert row["medianRequestLatencyMs"] == 500  # legacy upper-middle median
    assert row["maxRequestLatencyMs"] == 500
    assert "incomplete" in output


@pytest.mark.parametrize("cost_metadata", [None, "absent"])
def test_missing_cost_metadata_remains_unknown_not_free(tmp_path, cost_metadata):
    fixture = MANIFEST["fixtures"][0]
    record = {"fixtureId": "1008", "imageSha256": fixture["sha256"], "provider": "luna",
              "modelId": "gpt-6-luna", "response": example_response("1008")}
    if cost_metadata is None:
        record["estimatedCostUsd"] = None
    status, report, _ = replay(tmp_path, records=[record])
    assert status == 0
    summary = report["summary"]["luna"]
    for field in ("estimatedTotalCostUsd", "estimatedCostPerValidResponseUsd", "estimatedCostPerFinancialPassUsd",
                  "medianRequestLatencyMs", "maxRequestLatencyMs"):
        assert summary[field] is None


def test_replay_reports_contract_change_and_preserves_legacy_metadata(tmp_path):
    metadata = {"contractSha256": "old-contract-hash", "source": "https://dataset.example/",
                "settings": {"pricingCheckedAt": "2026-10-10", "maxOutputTokens": 1600}}
    status, report, output = replay(tmp_path, metadata=metadata)
    assert status == 0
    assert report["sourceRunMetadata"] == {"version": 1, **metadata}
    assert report["replay"]["contractDifferences"] == ["Pinned prompt/schema differs from source run"]
    assert "differs from source run" in output
    assert report["replay"]["sourceProvenance"] is None


def test_replay_recognizes_matching_legacy_contract_hash(tmp_path):
    snapshot = json.loads((DIRECTORY / "contract" / "snapshot.json").read_text())
    status, report, output = replay(tmp_path, metadata={"contractSha256": snapshot["contractSha256"]})
    assert status == 0
    assert report["replay"]["contractDifferences"] == []
    assert "differs from source run" not in output


@pytest.mark.parametrize("wrong_identity", ["unknown_id", "wrong_hash"])
def test_replay_refuses_unknown_or_changed_fixture_identity(tmp_path, wrong_identity):
    fixture = MANIFEST["fixtures"][0]
    record = {"fixtureId": "unknown" if wrong_identity == "unknown_id" else "1008",
              "imageSha256": "wrong" if wrong_identity == "wrong_hash" else fixture["sha256"],
              "provider": "luna", "response": example_response("1008")}
    status, report, output = replay(tmp_path, records=[record])
    assert status == 1
    assert report is None
    assert "Unknown or changed fixture" in output


def test_replay_refuses_overwriting_source_even_through_symlink(tmp_path):
    source = tmp_path / "source.json"
    source.write_text(json.dumps({"version": 1, "records": []}))
    original = source.read_bytes()
    alias = tmp_path / "alias.json"
    alias.symlink_to(source)
    output = io.StringIO()
    status = main(["--replay", str(source), "--out", str(alias)], stdout=output)
    assert status == 1
    assert source.read_bytes() == original
    assert "must not overwrite" in output.getvalue()


def test_replay_refuses_existing_result_destination(tmp_path):
    destination = tmp_path / "rescored.json"
    destination.write_text("old result")
    status, _, output = replay_existing_destination(tmp_path)
    assert status == 1
    assert destination.read_text() == "old result"
    assert "File exists" in output


def replay_existing_destination(tmp_path):
    source = tmp_path / "legacy.json"
    source.write_text(json.dumps({"version": 1, "records": []}))
    output = io.StringIO()
    status = main(["--replay", str(source), "--out", str(tmp_path / "rescored.json")], stdout=output)
    return status, None, output.getvalue()


@pytest.mark.parametrize("args", [["--limit", "0"], ["--limit", "6"], ["--max-output-tokens", "255"],
                                  ["--max-output-tokens", "1601"], ["--max-output-tokens", "256.5"],
                                  ["--provider", "unknown"], ["--live", "--replay", "file.json"],
                                  ["--live", "--dry-run"], ["--replay", "file.json", "--refresh-contract"]])
def test_runner_rejects_invalid_limits_providers_and_incompatible_modes(args):
    assert main(args, stdout=io.StringIO()) != 0


@pytest.mark.parametrize("args,plan", [(["--provider", "luna", "--limit", "1", "--max-output-tokens", "256"],
                                       "1 fixtures; 1 planned requests; output cap 256"),
                                      (["--provider", "gemini", "--limit", "5"], "5 fixtures; 5 planned requests")])
def test_preflight_displays_selected_bounded_request_plan(args, plan):
    output = io.StringIO()
    assert main(args, stdout=output) == 0
    assert plan in output.getvalue()


def copy_fixture_directory(tmp_path):
    destination = tmp_path / "receipts"
    destination.mkdir()
    shutil.copytree(DIRECTORY / "fixtures", destination / "fixtures")
    shutil.copytree(DIRECTORY / "contract", destination / "contract")
    shutil.copy2(DIRECTORY / "manifest.json", destination / "manifest.json")
    return destination


@pytest.mark.parametrize("damage", ["missing", "checksum", "duplicate", "oversize", "contract"])
def test_preflight_checks_all_fixtures_and_contract_even_with_one_selected_receipt(tmp_path, damage):
    directory = copy_fixture_directory(tmp_path)
    manifest = json.loads((directory / "manifest.json").read_text())
    last = manifest["fixtures"][-1]
    image_path = directory / last["image"]
    if damage == "missing":
        image_path.unlink()
    elif damage == "checksum":
        image_path.write_bytes(b"wrong image")
    elif damage == "duplicate":
        last["id"] = manifest["fixtures"][0]["id"]
    elif damage == "oversize":
        image_path.write_bytes(b"x" * 4_194_305)
        last["sha256"] = hashlib.sha256(image_path.read_bytes()).hexdigest()
    else:
        snapshot_path = directory / "contract" / "snapshot.json"
        snapshot = json.loads(snapshot_path.read_text())
        snapshot["systemPrompt"] += "changed"
        snapshot_path.write_text(json.dumps(snapshot))
    (directory / "manifest.json").write_text(json.dumps(manifest))
    output = io.StringIO()
    assert main(["--limit", "1"], directory=directory, stdout=output) == 1
    assert "Error:" in output.getvalue()


def test_refresh_identifies_dirty_production_content_without_claiming_clean_revision(tmp_path):
    source_root = tmp_path / "source"
    subprocess.run(["git", "clone", "--quiet", "--shared", str(DIRECTORY.parents[1]), str(source_root)], check=True)
    prompts_path = source_root / "infra/modules/receipt-ingestion-api/lambda/src/prompts.ts"
    prompts_path.write_text(prompts_path.read_text().replace("You extract structured", "You cautiously extract structured"))
    destination = tmp_path / "receipts"
    output = io.StringIO()
    assert main(["--refresh-contract"], directory=destination, source_root=source_root, stdout=output) == 0
    snapshot = json.loads((destination / "contract" / "snapshot.json").read_text())
    assert snapshot["systemPrompt"].startswith("You cautiously extract")
    assert snapshot["provenance"]["dirtySourcePaths"] == ["infra/modules/receipt-ingestion-api/lambda/src/prompts.ts"]
    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=source_root, text=True, capture_output=True, check=True).stdout.strip()
    assert snapshot["provenance"]["sourceRevision"] == revision
    assert snapshot["provenance"]["sourceContentSha256"]["infra/modules/receipt-ingestion-api/lambda/src/prompts.ts"] \
        == hashlib.sha256(prompts_path.read_bytes()).hexdigest()


def test_repeated_descriptions_match_closest_financial_row_once(tmp_path):
    directory = copy_fixture_directory(tmp_path)
    manifest = json.loads((directory / "manifest.json").read_text())
    fixture = next(f for f in manifest["fixtures"] if f["id"] == "1001")
    fixture["expected"]["items"][-1].update(unitPriceCents=395, lineSubtotalCents=395)
    fixture["expected"]["receipt"].update(subtotalCents=6475, totalCents=7025)
    fixture["expected"].update(editorSubtotalCents=6475, editorTotalCents=7025)
    (directory / "manifest.json").write_text(json.dumps(manifest))
    response = example_response("1001")
    response["createReceiptInputDraft"].update(subtotalCents=6475, totalCents=7025)
    response["upsertReceiptItemInputDrafts"][-1].update(unitPriceCents=395, lineSubtotalCents=395)
    response["upsertReceiptItemInputDrafts"].reverse()
    status, report, _ = replay(tmp_path, "1001", response, directory=directory)
    assert status == 0
    assert report["records"][0]["evaluation"]["observations"]["derived"]["receiptTotalCents"] == 7025


def test_independent_reference_applies_item_and_receipt_discounts_and_clamps_negative_lines(tmp_path):
    directory = copy_fixture_directory(tmp_path)
    manifest = json.loads((directory / "manifest.json").read_text())
    gold = manifest["fixtures"][0]["expected"]
    gold["items"][0].update(discountCents=300, lineSubtotalCents=0)
    gold["items"][1].update(discountCents=75, lineSubtotalCents=600)
    gold["receipt"].update(subtotalCents=1925, feeCents=30, discountCents=100, totalCents=2077)
    gold.update(editorSubtotalCents=1925, editorTotalCents=2077)
    (directory / "manifest.json").write_text(json.dumps(manifest))
    response = example_response("1008")
    response["upsertReceiptItemInputDrafts"][0].update(discountCents=300, lineSubtotalCents=0)
    response["upsertReceiptItemInputDrafts"][1].update(discountCents=75, lineSubtotalCents=600)
    response["createReceiptInputDraft"].update(subtotalCents=1925, feeCents=30, discountCents=100, totalCents=2077)
    status, report, _ = replay(tmp_path, response=response, directory=directory)
    assert status == 0
    derived = report["records"][0]["evaluation"]["observations"]["derived"]
    assert derived["items"][0]["lineSubtotalCents"] == 0
    assert derived["subtotalCents"] == 1925
    assert derived["receiptTotalCents"] == 2077


def test_preflight_and_replay_emit_zero_provider_http_calls(tmp_path):
    calls = []

    def provider_boundary(request):
        calls.append(request)
        raise AssertionError("Offline mode contacted a provider")

    fixture = MANIFEST["fixtures"][0]
    source = tmp_path / "saved.json"
    source.write_text(json.dumps({"version": 1, "records": [{"fixtureId": fixture["id"],
        "imageSha256": fixture["sha256"], "provider": "luna", "response": example_response("1008")}]}))
    with httpx.Client(transport=httpx.MockTransport(provider_boundary)) as client:
        assert main([], http_client=client, stdout=io.StringIO()) == 0
        assert main(["--replay", str(source)], http_client=client, stdout=io.StringIO()) == 0
    assert calls == []


def test_non_json_nonfinite_values_are_rejected_before_schema_validation(tmp_path):
    response = example_response("1008")
    response["createReceiptInputDraft"]["locationLat"] = float("nan")
    status, report, output = replay(tmp_path, response=response)
    assert status == 1
    assert report is None
    assert "Non-finite JSON number" in output


@pytest.mark.parametrize("saved", [[], None, {"version": 9, "records": []}, {"version": 1},
                                  {"version": 1, "records": "not records"}, {"version": 1, "records": [None]}])
def test_invalid_saved_artifact_formats_return_nonzero_without_output(tmp_path, saved):
    source = tmp_path / "bad.json"
    source.write_text(json.dumps(saved))
    destination = tmp_path / "report.json"
    output = io.StringIO()
    assert main(["--replay", str(source), "--out", str(destination)], stdout=output) == 1
    assert not destination.exists()
    assert "Error:" in output.getvalue()


def test_replaying_a_replay_does_not_invent_generation_provenance(tmp_path):
    status, report, _ = replay(tmp_path, metadata={"contractSha256": "legacy-generation-hash"})
    assert status == 0
    output = io.StringIO()
    second = tmp_path / "second-replay.json"
    assert main(["--replay", str(tmp_path / "rescored.json"), "--out", str(second)], stdout=output) == 0
    rescored = json.loads(second.read_text())
    assert rescored["replay"]["sourceProvenance"] is None
    assert rescored["replay"]["sourceContractSha256"] == "legacy-generation-hash"
    assert rescored["replay"]["contractDifferences"] == ["Pinned prompt/schema differs from source run"]
    assert "legacy provenance unknown" in output.getvalue()
