"""Complete supported lifecycle at the public runner, with local HTTP only."""
import asyncio
import io
import json

import httpx

from receipt_eval.runner import main
from test_gemini_live import successful_response as gemini_success
from test_luna_live import luna_success


def test_preflight_paired_collection_partial_failure_persistence_and_offline_replay(tmp_path):
    successful = tmp_path / "paired-success.json"
    partial = tmp_path / "paired-partial.json"
    rescored_success = tmp_path / "replayed-success.json"
    rescored_failure = tmp_path / "replayed-partial.json"
    requests = []
    destination = successful
    fail_at = None

    def handler(request):
        # Reservation and completed records are externally visible before the next request.
        saved = json.loads(destination.read_text())
        assert len(saved["records"]) == len(requests)
        requests.append(request)
        if len(requests) == fail_at:
            return httpx.Response(429, text="controlled provider failure")
        return luna_success(request) if request.url.host == "api.openai.com" else gemini_success(request)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    output = io.StringIO()
    credentials = {"GEMINI_API_KEY": "offline-key", "OPENAI_API_KEY": "offline-key"}
    try:
        assert main([], http_client=client, environ={}, stdout=output) == 0
        assert requests == []
        assert main(["--live", "--provider", "both", "--limit", "2", "--out", str(successful)],
                    http_client=client, environ=credentials, stdout=output) == 0
        good = json.loads(successful.read_text())
        assert [record["provider"] for record in good["records"]] == ["gemini", "luna", "luna", "gemini"]
        assert all(record["evaluation"]["passed"] for record in good["records"])
        successful_bytes = successful.read_bytes()
        assert main(["--replay", str(successful), "--out", str(rescored_success)],
                    http_client=client, environ={}, stdout=output) == 0
        assert len(requests) == 4
        assert successful.read_bytes() == successful_bytes
        assert len(json.loads(rescored_success.read_text())["records"]) == 4

        requests.clear()
        destination = partial
        fail_at = 3
        assert main(["--live", "--provider", "both", "--out", str(partial)],
                    http_client=client, environ=credentials, stdout=output) == 1
        failed = json.loads(partial.read_text())
        assert len(requests) == len(failed["records"]) == 3
        assert [record["provider"] for record in failed["records"]] == ["gemini", "luna", "luna"]
        assert failed["records"][0]["evaluation"]["passed"]
        assert failed["records"][1]["evaluation"]["passed"]
        assert failed["records"][2]["error"] == "Provider HTTP 429"
        assert "stoppedEarly" in failed
        partial_bytes = partial.read_bytes()
        assert main(["--replay", str(partial), "--out", str(rescored_failure)],
                    http_client=client, environ={}, stdout=output) == 1
        assert len(requests) == 3
        assert partial.read_bytes() == partial_bytes
        rescored = json.loads(rescored_failure.read_text())
        assert rescored["summary"]["luna"]["estimatedTotalCostUsd"] is None
        assert rescored["records"][2]["evaluation"]["failures"] == ["Provider HTTP 429"]
        assert "does not verify actual receipt draft correctness" in output.getvalue()
    finally:
        asyncio.run(client.aclose())
