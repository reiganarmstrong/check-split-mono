"""Controlled HTTP responses verify live orchestration without model requests."""
import asyncio
import base64
import io
import json
from pathlib import Path

import httpx
import pytest

from receipt_eval.runner import main
from test_runner import DIRECTORY, MANIFEST, example_response

SNAPSHOT = json.loads((DIRECTORY / "contract" / "snapshot.json").read_text())
IMAGE_IDS = {base64.b64encode((DIRECTORY / f["image"]).read_bytes()).decode(): f["id"] for f in MANIFEST["fixtures"]}


def successful_response(request, *, usage=None):
    body = json.loads(request.content)
    fixture_id = IMAGE_IDS[body["contents"][0]["parts"][1]["inlineData"]["data"]]
    return httpx.Response(200, json={
        "candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(example_response(fixture_id))}]}}],
        "usageMetadata": usage if usage is not None else {"promptTokenCount": 1000, "candidatesTokenCount": 500},
    })


def live(tmp_path, handler, *, args=None, environ=None):
    destination = tmp_path / "live.json"
    output = io.StringIO()
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        status = main(["--live", "--provider", "gemini", "--out", str(destination), *(args or [])],
                      http_client=client, stdout=output,
                      environ={"GEMINI_API_KEY": "offline-test-key"} if environ is None else environ)
    finally:
        asyncio.run(client.aclose())
    report = json.loads(destination.read_text()) if destination.exists() else None
    return status, report, output.getvalue()


def test_explicit_gemini_collection_sends_five_pinned_bounded_requests_and_replays_offline(tmp_path):
    requests = []

    def handler(request):
        requests.append(request)
        return successful_response(request)

    status, report, _ = live(tmp_path, handler, args=["--max-output-tokens", "256"])
    assert status == 0
    assert len(requests) == 5
    assert len(report["records"]) == 5
    first = requests[0]
    assert first.method == "POST"
    assert str(first.url) == "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"
    assert first.headers["x-goog-api-key"] == "offline-test-key"
    assert first.headers["content-type"] == "application/json"
    assert all(value == 20 for value in first.extensions["timeout"].values())
    body = json.loads(first.content)
    assert body["systemInstruction"]["parts"][0]["text"] == SNAPSHOT["systemPrompt"]
    assert body["contents"][0]["parts"][0]["text"] == SNAPSHOT["imagePrompt"]
    assert body["contents"][0]["parts"][1]["inlineData"]["mimeType"] == "image/jpeg"
    assert body["generationConfig"] == {"responseMimeType": "application/json",
                                       "responseJsonSchema": SNAPSHOT["schema"], "maxOutputTokens": 256}
    assert report["version"] == 2
    assert report["mode"] == "live"
    assert report["contract"] == SNAPSHOT
    assert report["contractSha256"] == SNAPSHOT["contractSha256"]
    assert report["settings"]["timeoutMs"] == 20000
    assert report["settings"]["plannedRequests"] == 5
    assert report["settings"]["pricingCheckedAt"] == "2026-10-10"
    assert report["settings"]["pricing"]["gemini"]["modelId"] == "gemini-3.1-flash-lite"
    for record, fixture in zip(report["records"], MANIFEST["fixtures"]):
        assert record["fixtureId"] == fixture["id"]
        assert record["imageSha256"] == fixture["sha256"]
        assert record["modelId"] == "gemini-3.1-flash-lite"
        assert record["provider"] == "gemini"
        assert record["evaluation"]["passed"]
        assert record["requestLatencyMs"] >= 0
        assert record["estimatedCostUsd"] > 0
    source = tmp_path / "live.json"
    original = source.read_bytes()
    output = io.StringIO()
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        assert main(["--replay", str(source)], http_client=client, stdout=output) == 0
    finally:
        asyncio.run(client.aclose())
    assert len(requests) == 5
    assert source.read_bytes() == original
    assert "legacy provenance unknown" not in output.getvalue()


def test_usage_counts_cached_input_and_thoughts_once_without_extracting_thought_text(tmp_path):
    def handler(request):
        response = successful_response(request, usage={"promptTokenCount": 1000, "cachedContentTokenCount": 200,
                                                       "candidatesTokenCount": 500, "thoughtsTokenCount": 100})
        document = response.json()
        document["candidates"][0]["content"]["parts"].insert(0, {"thought": True, "text": "internal reasoning is not JSON"})
        return httpx.Response(200, json=document)

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    record = report["records"][0]
    assert record["usage"] == {"inputTokens": 1000, "cachedInputTokens": 200, "outputTokens": 600, "reasoningTokens": 100}
    assert record["estimatedCostUsd"] == pytest.approx(0.001105)
    assert record["response"] == example_response("1008")


@pytest.mark.parametrize("usage", [None, {}, {"promptTokenCount": 1000}, {"candidatesTokenCount": 500},
    {"promptTokenCount": True, "candidatesTokenCount": 500},
    {"promptTokenCount": 1000, "candidatesTokenCount": False},
    {"promptTokenCount": 1000, "candidatesTokenCount": 500, "thoughtsTokenCount": False},
    {"promptTokenCount": 1000, "candidatesTokenCount": 500, "cachedContentTokenCount": False},
    {"promptTokenCount": 1000, "candidatesTokenCount": 500, "thoughtsTokenCount": ""},
    {"promptTokenCount": 1000, "candidatesTokenCount": 500, "cachedContentTokenCount": 1001},
    {"promptTokenCount": 1000, "candidatesTokenCount": -1},
    {"promptTokenCount": 1000, "candidatesTokenCount": 0.5},
])
def test_missing_or_invalid_usage_remains_unknown_instead_of_free(tmp_path, usage):
    def handler(request):
        document = successful_response(request).json()
        document["usageMetadata"] = usage
        return httpx.Response(200, json=document)

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    record = report["records"][0]
    assert record["usage"] is None
    assert record["estimatedCostUsd"] is None
    assert report["summary"]["gemini"]["estimatedTotalCostUsd"] is None
    assert report["summary"]["gemini"]["estimatedCostPerFinancialPassUsd"] is None


def test_overflowed_json_number_is_persisted_as_failed_response_with_known_cost(tmp_path):
    def handler(request):
        document = successful_response(request).json()
        text = document["candidates"][0]["content"]["parts"][0]["text"]
        document["candidates"][0]["content"]["parts"][0]["text"] = text.replace('"locationLat": null', '"locationLat": 1e999')
        return httpx.Response(200, json=document)

    status, report, output = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 1
    assert report is not None
    assert len(report["records"]) == 1
    record = report["records"][0]
    assert record["response"] is None
    assert "Non-finite JSON number" in record["error"]
    assert record["estimatedCostUsd"] > 0
    assert not record["evaluation"]["schemaValid"]
    assert "Non-finite JSON number" in output


@pytest.mark.parametrize("outcome,fragment", [
    ("blocked", "Gemini response finish"), ("truncated", "MAX_TOKENS"), ("safety", "SAFETY"),
    ("malformed_json", "Expecting"), ("empty_text", "Expecting"), ("no_candidates", "Gemini response"),
    ("thought_only", "Expecting"), ("outer_array", "not a JSON object"),
    ("wrong_parts", "Gemini response"), ("wrong_candidate", "Gemini response"),
])
def test_failed_provider_outputs_are_persisted_once_without_retry(tmp_path, outcome, fragment):
    calls = []

    def handler(request):
        calls.append(request)
        document = successful_response(request).json()
        candidate = document["candidates"][0]
        if outcome == "blocked":
            document["promptFeedback"] = {"blockReason": "SAFETY"}
        elif outcome in ("truncated", "safety"):
            candidate["finishReason"] = "MAX_TOKENS" if outcome == "truncated" else "SAFETY"
        elif outcome in ("malformed_json", "empty_text"):
            candidate["content"]["parts"] = [{"text": "{" if outcome == "malformed_json" else ""}]
        elif outcome == "no_candidates":
            document["candidates"] = []
        elif outcome == "thought_only":
            candidate["content"]["parts"] = [{"thought": True, "text": json.dumps(example_response("1008"))}]
        elif outcome == "outer_array":
            document = []
        elif outcome == "wrong_parts":
            candidate["content"]["parts"] = "invalid parts"
        else:
            document["candidates"] = ["wrong shape"]
        return httpx.Response(200, json=document)

    status, report, output = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 1
    assert len(calls) == 1
    assert len(report["records"]) == 1
    record = report["records"][0]
    assert record["response"] is None
    assert fragment in record["error"]
    assert not record["evaluation"]["schemaValid"]
    if outcome != "outer_array":
        assert record["estimatedCostUsd"] == pytest.approx(0.001)
        assert report["summary"]["gemini"]["estimatedTotalCostUsd"] == pytest.approx(0.001)
    else:
        assert record["estimatedCostUsd"] is None
    assert "FAIL" in output


def test_strict_schema_failure_is_saved_with_usage_and_nonzero_status(tmp_path):
    calls = []

    def handler(request):
        calls.append(request)
        document = successful_response(request).json()
        response = example_response("1008")
        response["extra"] = "forbidden"
        document["candidates"][0]["content"]["parts"][0]["text"] = json.dumps(response)
        return httpx.Response(200, json=document)

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 1
    assert len(calls) == 1
    record = report["records"][0]
    assert record["response"]["extra"] == "forbidden"
    assert not record["evaluation"]["schemaValid"]
    assert record["estimatedCostUsd"] == pytest.approx(0.001)


def test_truncated_attempt_cost_is_included_in_cost_per_success_and_collection_continues(tmp_path):
    calls = []

    def handler(request):
        calls.append(request)
        document = successful_response(request).json()
        if len(calls) == 1:
            document["candidates"][0]["finishReason"] = "MAX_TOKENS"
        return httpx.Response(200, json=document)

    status, report, _ = live(tmp_path, handler, args=["--limit", "2"])
    assert status == 1
    assert len(calls) == 2
    summary = report["summary"]["gemini"]
    assert summary["validResponses"] == 1
    assert summary["financialPassedReceipts"] == 1
    assert summary["estimatedTotalCostUsd"] == pytest.approx(0.002)
    assert summary["estimatedCostPerValidResponseUsd"] == pytest.approx(0.002)
    assert summary["estimatedCostPerFinancialPassUsd"] == pytest.approx(0.002)
    assert report["records"][1]["evaluation"]["passed"]


@pytest.mark.parametrize("status_code", [301, 401, 429, 500])
def test_provider_http_error_stops_collection_and_preserves_partial_records_without_redirects(tmp_path, status_code):
    calls = []

    def handler(request):
        calls.append(request)
        if len(calls) == 1:
            return successful_response(request)
        return httpx.Response(status_code, headers={"location": "https://redirect.example/"}, text="private provider body")

    status, report, output = live(tmp_path, handler)
    assert status == 1
    assert len(calls) == 2
    assert len(report["records"]) == 2
    assert report["records"][0]["evaluation"]["passed"]
    assert report["records"][1]["error"] == f"Provider HTTP {status_code}"
    assert report["summary"]["gemini"]["attemptedReceipts"] == 2
    assert report["summary"]["gemini"]["estimatedTotalCostUsd"] is None
    assert "stoppedEarly" in report
    assert "Saved partial report" in output
    assert "private provider body" not in output
    assert "offline-test-key" not in json.dumps(report)


@pytest.mark.parametrize("exception", [httpx.ReadTimeout("timeout"), httpx.ConnectTimeout("timeout"),
                                        httpx.ConnectError("unavailable")])
def test_timeout_and_transport_failures_are_recorded_without_retries_and_other_requests_continue(tmp_path, exception):
    calls = []

    def handler(request):
        calls.append(request)
        if len(calls) == 1:
            raise exception
        return successful_response(request)

    status, report, _ = live(tmp_path, handler, args=["--limit", "2"])
    assert status == 1
    assert len(calls) == 2
    assert len(report["records"]) == 2
    first = report["records"][0]
    assert first["response"] is None
    assert first["error"] == "Request timed out" if isinstance(exception, httpx.TimeoutException) \
        else first["error"].startswith("Provider transport failure")
    assert first["usage"] is None
    assert first["estimatedCostUsd"] is None
    assert report["records"][1]["evaluation"]["passed"]


def test_malformed_outer_http_json_is_persisted_as_unknown_cost_failure(tmp_path):
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(200, text="not JSON")

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 1
    assert len(calls) == 1
    assert report["records"][0]["response"] is None
    assert report["records"][0]["usage"] is None
    assert report["records"][0]["estimatedCostUsd"] is None


@pytest.mark.parametrize("key", [None, "", "   "])
def test_missing_environment_key_prevents_reservation_and_all_requests(tmp_path, key):
    calls = []

    def handler(request):
        calls.append(request)
        return successful_response(request)

    status, report, output = live(tmp_path, handler, environ={} if key is None else {"GEMINI_API_KEY": key})
    assert status == 1
    assert calls == []
    assert report is None
    assert "Missing GEMINI_API_KEY" in output


def test_dotenv_is_not_loaded_and_shell_credentials_are_required(tmp_path):
    from test_runner import copy_fixture_directory
    directory = copy_fixture_directory(tmp_path)
    (directory / ".env").write_text("GEMINI_API_KEY=dotenv-key\n")
    calls = []
    client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: calls.append(request)))
    output = io.StringIO()
    destination = tmp_path / "result.json"
    try:
        status = main(["--live", "--provider", "gemini", "--out", str(destination)], directory=directory,
                      http_client=client, environ={}, stdout=output)
    finally:
        asyncio.run(client.aclose())
    assert status == 1
    assert not destination.exists()
    assert calls == []


@pytest.mark.parametrize("obstacle", ["existing", "directory", "parent_file"])
def test_output_collision_or_unusable_destination_prevents_any_request(tmp_path, obstacle):
    destination = tmp_path / "live.json"
    if obstacle == "existing":
        destination.write_text("earlier result")
    elif obstacle == "directory":
        destination.mkdir()
    else:
        blocking_parent = tmp_path / "blocked"
        blocking_parent.write_text("not a directory")
        destination = blocking_parent / "run.json"
    calls = []
    client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: calls.append(request)))
    try:
        status = main(["--live", "--provider", "gemini", "--out", str(destination)], http_client=client,
                      environ={"GEMINI_API_KEY": "offline-test-key"}, stdout=io.StringIO())
    finally:
        asyncio.run(client.aclose())
    assert status == 1
    assert calls == []
    if obstacle == "existing":
        assert destination.read_text() == "earlier result"


def test_output_is_reserved_and_each_completed_record_is_saved_before_next_request(tmp_path):
    calls = []
    destination = tmp_path / "live.json"

    def handler(request):
        saved = json.loads(destination.read_text())
        assert len(saved["records"]) == len(calls)
        assert saved["contract"] == SNAPSHOT
        if calls:
            assert saved["records"][-1]["evaluation"]["passed"]
            assert saved["summary"]["gemini"]["attemptedReceipts"] == len(calls)
        calls.append(request)
        return successful_response(request)

    status, report, _ = live(tmp_path, handler)
    assert status == 0
    assert len(calls) == 5
    assert len(report["records"]) == 5
    assert list(tmp_path.glob("*.tmp")) == []



def test_integral_json_numbers_in_usage_preserve_legacy_cost_semantics(tmp_path):
    def handler(request):
        return successful_response(request, usage={"promptTokenCount": 1000.0, "cachedContentTokenCount": 200.0,
                                                  "candidatesTokenCount": 500.0, "thoughtsTokenCount": 100.0})

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    record = report["records"][0]
    assert record["usage"] == {"inputTokens": 1000, "cachedInputTokens": 200, "outputTokens": 600, "reasoningTokens": 100}
    assert record["estimatedCostUsd"] == pytest.approx(0.001105)


def test_completed_records_survive_interruption_of_later_request(tmp_path):
    calls = []

    def handler(request):
        calls.append(request)
        if len(calls) == 2:
            raise asyncio.CancelledError("controlled interruption")
        return successful_response(request)

    with pytest.raises(asyncio.CancelledError):
        live(tmp_path, handler)
    report = json.loads((tmp_path / "live.json").read_text())
    assert len(calls) == 2
    assert len(report["records"]) == 1
    assert report["records"][0]["evaluation"]["passed"]
    assert report["summary"]["gemini"]["attemptedReceipts"] == 1


@pytest.mark.parametrize("optional", [{}, {"thoughtsTokenCount": None, "cachedContentTokenCount": None}])
def test_absent_or_null_optional_usage_counts_default_to_zero(tmp_path, optional):
    def handler(request):
        return successful_response(request, usage={"promptTokenCount": 1000, "candidatesTokenCount": 500, **optional})

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    assert report["records"][0]["usage"] == {"inputTokens": 1000, "outputTokens": 500,
                                            "reasoningTokens": 0, "cachedInputTokens": 0}
    assert report["records"][0]["estimatedCostUsd"] == pytest.approx(0.001)


def test_extreme_valid_numeric_prices_still_persist_a_failed_financial_evaluation(tmp_path):
    def handler(request):
        document = successful_response(request).json()
        response = example_response("1008")
        response["upsertReceiptItemInputDrafts"][0].update(unitPriceCents=1e308, quantity=10)
        document["candidates"][0]["content"]["parts"][0]["text"] = json.dumps(response)
        return httpx.Response(200, json=document)

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 1
    assert len(report["records"]) == 1
    assert report["records"][0]["evaluation"]["schemaValid"]
    assert not report["records"][0]["evaluation"]["financialPassed"]
    assert report["records"][0]["estimatedCostUsd"] == pytest.approx(0.001)


def test_impossibly_large_usage_counts_are_unknown_and_do_not_drop_completed_response(tmp_path):
    def handler(request):
        return successful_response(request, usage={"promptTokenCount": 10**400, "candidatesTokenCount": 500})

    status, report, _ = live(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    assert report["records"][0]["usage"] is None
    assert report["records"][0]["estimatedCostUsd"] is None
