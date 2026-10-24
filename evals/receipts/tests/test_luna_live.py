"""Luna and paired evaluation through the public runner with controlled HTTP only."""
import asyncio
import base64
import io
import json

import httpx
import pytest

from receipt_eval.runner import main
from test_runner import DIRECTORY, MANIFEST, example_response
from test_gemini_live import SNAPSHOT, IMAGE_IDS, successful_response as gemini_success


def luna_success(request):
    body = json.loads(request.content)
    image = body["input"][0]["content"][1]["image_url"].split(",", 1)[1]
    fixture_id = IMAGE_IDS[image]
    return httpx.Response(200, json={"status": "completed", "usage": {"input_tokens": 1000, "output_tokens": 500},
        "output": [{"type": "message", "content": [{"type": "output_text", "text": json.dumps(example_response(fixture_id))}]}]})


def collect(tmp_path, handler, *, provider="luna", args=(), environ=None):
    destination = tmp_path / "live.json"
    output = io.StringIO()
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        status = main(["--live", "--provider", provider, "--out", str(destination), *args],
                      http_client=client, stdout=output, environ={"OPENAI_API_KEY": "offline-luna-key",
                      "GEMINI_API_KEY": "offline-gemini-key"} if environ is None else environ)
    finally:
        asyncio.run(client.aclose())
    return status, json.loads(destination.read_text()) if destination.exists() else None, output.getvalue()


def test_luna_collection_preserves_request_contract_settings_and_replays_without_http(tmp_path):
    requests = []

    def handler(request):
        requests.append(request)
        return luna_success(request)

    status, report, output = collect(tmp_path, handler, args=["--max-output-tokens", "256"])
    assert status == 0
    assert len(requests) == 5
    assert report["settings"]["plannedRequests"] == 5
    assert report["settings"]["pricingCheckedAt"] == "2026-10-10"
    assert report["settings"]["pricing"]["luna"] == {"modelId": "gpt-6-luna", "keyName": "OPENAI_API_KEY",
        "inputRate": 0.1, "cachedRate": 0.01, "outputRate": 0.5}
    first = requests[0]
    assert first.method == "POST"
    assert str(first.url) == "https://api.openai.com/v1/responses"
    assert first.headers["authorization"] == "Bearer offline-luna-key"
    assert "x-goog-api-key" not in first.headers
    assert all(value == 20 for value in first.extensions["timeout"].values())
    body = json.loads(first.content)
    assert body == {"model": "gpt-6-luna", "store": False, "service_tier": "default", "reasoning": {"effort": "none"},
        "max_output_tokens": 256, "instructions": SNAPSHOT["systemPrompt"],
        "input": [{"role": "user", "content": [{"type": "input_text", "text": SNAPSHOT["imagePrompt"]},
                  {"type": "input_image", "image_url": "data:image/jpeg;base64," +
                  base64.b64encode((DIRECTORY / MANIFEST["fixtures"][0]["image"]).read_bytes()).decode(), "detail": "high"}]}],
        "text": {"format": {"type": "json_schema", "name": "receipt_draft", "strict": True, "schema": SNAPSHOT["schema"]}}}
    assert report["contract"] == SNAPSHOT
    assert all(record["evaluation"]["passed"] and record["modelId"] == "gpt-6-luna" for record in report["records"])
    assert report["summary"]["luna"]["validResponses"] == 5
    assert "Five-fixture smoke" in output
    source = tmp_path / "live.json"
    original = source.read_bytes()
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        assert main(["--replay", str(source)], http_client=client, stdout=io.StringIO(), environ={}) == 0
    finally:
        asyncio.run(client.aclose())
    assert len(requests) == 5
    assert source.read_bytes() == original


def test_paired_run_alternates_sequential_provider_order_and_saves_each_response_before_next_call(tmp_path):
    requests = []
    destination = tmp_path / "live.json"

    def handler(request):
        saved = json.loads(destination.read_text())
        assert len(saved["records"]) == len(requests)
        assert saved["settings"]["plannedRequests"] == 10
        assert all(record["evaluation"]["passed"] for record in saved["records"])
        requests.append(request)
        return luna_success(request) if request.url.host == "api.openai.com" else gemini_success(request)

    status, report, output = collect(tmp_path, handler, provider="both")
    assert status == 0
    assert len(requests) == 10
    assert [record["provider"] for record in report["records"]] == [
        "gemini", "luna", "luna", "gemini", "gemini", "luna", "luna", "gemini", "gemini", "luna"]
    assert [record["fixtureId"] for record in report["records"]] == [
        "1008", "1008", "1085", "1085", "1144", "1144", "1113", "1113", "1001", "1001"]
    for request in requests:
        body = json.loads(request.content)
        if request.url.host == "api.openai.com":
            assert body["instructions"] == SNAPSHOT["systemPrompt"]
            assert body["input"][0]["content"][0]["text"] == SNAPSHOT["imagePrompt"]
            assert body["text"]["format"]["schema"] == SNAPSHOT["schema"]
        else:
            assert body["systemInstruction"]["parts"][0]["text"] == SNAPSHOT["systemPrompt"]
            assert body["contents"][0]["parts"][0]["text"] == SNAPSHOT["imagePrompt"]
            assert body["generationConfig"]["responseJsonSchema"] == SNAPSHOT["schema"]
    for provider in ("gemini", "luna"):
        row = report["summary"][provider]
        assert row["attemptedReceipts"] == row["validResponses"] == row["passedReceipts"] == row["financialPassedReceipts"] == 5
        assert row["estimatedTotalCostUsd"] == pytest.approx(0.005 if provider == "gemini" else 0.00175)
        assert row["estimatedCostPerValidResponseUsd"] == pytest.approx(0.001 if provider == "gemini" else 0.00035)
        assert row["estimatedCostPerFinancialPassUsd"] == row["estimatedCostPerValidResponseUsd"]
        assert row["medianRequestLatencyMs"] >= 0
        assert row["maxRequestLatencyMs"] >= row["medianRequestLatencyMs"]
    assert "gemini" in output and "luna" in output
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        assert main(["--replay", str(destination)], http_client=client, stdout=io.StringIO(), environ={}) == 0
    finally:
        asyncio.run(client.aclose())
    assert len(requests) == 10


@pytest.mark.parametrize("provider,environ,missing", [
    ("luna", {}, "OPENAI_API_KEY"), ("luna", {"OPENAI_API_KEY": " "}, "OPENAI_API_KEY"),
    ("both", {"GEMINI_API_KEY": "offline-key"}, "OPENAI_API_KEY"),
    ("both", {"OPENAI_API_KEY": "offline-key"}, "GEMINI_API_KEY"),
    ("both", {"GEMINI_API_KEY": "offline-key", "OPENAI_API_KEY": ""}, "OPENAI_API_KEY"),
])
def test_all_selected_credentials_are_required_before_reservation_or_first_http_call(tmp_path, provider, environ, missing):
    calls = []
    status, report, output = collect(tmp_path, lambda request: calls.append(request), provider=provider, environ=environ)
    assert status == 1
    assert calls == []
    assert report is None
    assert f"Missing {missing}" in output


def test_luna_usage_prices_cached_input_and_reasoning_once_and_ignores_reasoning_output(tmp_path):
    def handler(request):
        document = luna_success(request).json()
        document["usage"] = {"input_tokens": 1000, "input_tokens_details": {"cached_tokens": 200},
                             "output_tokens": 600, "output_tokens_details": {"reasoning_tokens": 100}}
        document["output"].insert(0, {"type": "reasoning", "summary": [{"text": "not extraction JSON"}]})
        return httpx.Response(200, json=document)

    status, report, _ = collect(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    record = report["records"][0]
    assert record["response"] == example_response("1008")
    assert record["usage"] == {"inputTokens": 1000, "cachedInputTokens": 200, "outputTokens": 600, "reasoningTokens": 100}
    assert record["estimatedCostUsd"] == pytest.approx(0.000382)


@pytest.mark.parametrize("usage", [None, {}, {"input_tokens": 1000}, {"output_tokens": 500},
    {"input_tokens": True, "output_tokens": 500}, {"input_tokens": 1000, "output_tokens": 0.5},
    {"input_tokens": 1000, "output_tokens": 500, "input_tokens_details": {"cached_tokens": 1001}},
    {"input_tokens": 1000, "output_tokens": 500, "output_tokens_details": {"reasoning_tokens": False}},
    {"input_tokens": 1000, "output_tokens": -1},
    {"input_tokens": 1000, "output_tokens": 500, "input_tokens_details": "wrong shape"}])
def test_luna_missing_or_invalid_usage_makes_total_cost_unknown(tmp_path, usage):
    def handler(request):
        document = luna_success(request).json()
        document["usage"] = usage
        return httpx.Response(200, json=document)

    status, report, _ = collect(tmp_path, handler, args=["--limit", "1"])
    assert status == 0
    assert report["records"][0]["estimatedCostUsd"] is None
    assert report["summary"]["luna"]["estimatedTotalCostUsd"] is None
    assert report["summary"]["luna"]["estimatedCostPerFinancialPassUsd"] is None


@pytest.mark.parametrize("outcome,fragment", [
    ("incomplete", "incomplete"), ("failed", "failed"), ("missing_status", "missing"),
    ("refusal", "refused"), ("malformed_json", "Expecting"), ("empty_text", "Expecting"),
    ("output_shape", "malformed output"), ("content_shape", "malformed content"),
    ("text_shape", "malformed text"), ("no_message", "Expecting")])
def test_luna_failures_are_saved_once_with_chargeable_usage_and_collection_continues(tmp_path, outcome, fragment):
    calls = []

    def handler(request):
        calls.append(request)
        document = luna_success(request).json()
        if len(calls) > 1:
            return httpx.Response(200, json=document)
        if outcome in ("incomplete", "failed"):
            document["status"] = outcome
        elif outcome == "missing_status":
            del document["status"]
        elif outcome == "refusal":
            document["output"][0]["content"].append({"type": "refusal", "refusal": "cannot process"})
        elif outcome == "malformed_json":
            document["output"][0]["content"][0]["text"] = "{"
        elif outcome == "empty_text":
            document["output"][0]["content"][0]["text"] = ""
        elif outcome == "output_shape":
            document["output"] = "wrong shape"
        elif outcome == "content_shape":
            document["output"][0]["content"] = ["wrong shape"]
        elif outcome == "text_shape":
            document["output"][0]["content"][0]["text"] = 1
        else:
            document["output"][0]["type"] = "reasoning"
        return httpx.Response(200, json=document)

    status, report, output = collect(tmp_path, handler, args=["--limit", "2"])
    assert status == 1
    assert len(calls) == 2
    failed, passed = report["records"]
    assert failed["response"] is None
    assert fragment in failed["error"]
    assert passed["evaluation"]["passed"]
    row = report["summary"]["luna"]
    assert row["validResponses"] == row["financialPassedReceipts"] == 1
    assert row["estimatedTotalCostUsd"] == pytest.approx(0.0007)
    assert row["estimatedCostPerValidResponseUsd"] == pytest.approx(0.0007)
    assert row["estimatedCostPerFinancialPassUsd"] == pytest.approx(0.0007)
    assert fragment in output


@pytest.mark.parametrize("status_code", [401, 429, 500])
def test_paired_http_failure_stops_before_remaining_requests_with_partial_report(tmp_path, status_code):
    calls = []

    def handler(request):
        calls.append(request)
        return gemini_success(request) if len(calls) == 1 else httpx.Response(status_code, text="private details")

    status, report, output = collect(tmp_path, handler, provider="both")
    assert status == 1
    assert len(calls) == 2
    assert len(report["records"]) == 2
    assert report["records"][0]["evaluation"]["passed"]
    assert report["records"][1]["error"] == f"Provider HTTP {status_code}"
    assert report["summary"]["luna"]["estimatedTotalCostUsd"] is None
    assert "stoppedEarly" in report
    assert "Saved partial report" in output
    assert "private details" not in output


@pytest.mark.parametrize("exception", [httpx.ReadTimeout("timeout"), httpx.ConnectError("failure")])
def test_luna_timeout_or_transport_failure_is_not_retried_and_has_unknown_cost(tmp_path, exception):
    calls = []

    def handler(request):
        calls.append(request)
        if len(calls) == 1:
            raise exception
        return luna_success(request)

    status, report, _ = collect(tmp_path, handler, args=["--limit", "2"])
    assert status == 1
    assert len(calls) == 2
    assert report["records"][0]["response"] is None
    assert report["records"][0]["estimatedCostUsd"] is None
    assert report["records"][1]["evaluation"]["passed"]
    assert report["summary"]["luna"]["estimatedTotalCostUsd"] is None
