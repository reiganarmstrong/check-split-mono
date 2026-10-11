"""Public command runner. No provider calls occur during preflight or replay."""
import argparse
import asyncio
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import httpx

from .contract import load_contract, refresh_contract
from .json_data import loads_json
from .providers import PRICING_CHECKED_AT, PROVIDERS, TIMEOUT_MS, call_provider
from .reporting import print_report, summarize
from .scoring import evaluate_response, failed_evaluation

DEFAULT_DIRECTORY = Path(__file__).resolve().parents[1]
MAX_IMAGE_BYTES = 4_194_304


def load_fixtures(directory):
    manifest = loads_json((directory / "manifest.json").read_text())
    ids = set()
    for fixture in manifest["fixtures"]:
        if fixture["id"] in ids:
            raise ValueError(f"Duplicate fixture: {fixture['id']}")
        ids.add(fixture["id"])
        image = (directory / fixture["image"]).read_bytes()
        if hashlib.sha256(image).hexdigest() != fixture["sha256"]:
            raise ValueError(f"Image checksum failed: {fixture['id']}")
        if len(image) > MAX_IMAGE_BYTES:
            raise ValueError(f"Image exceeds production upload limit: {fixture['id']}")
    return manifest


def parse_options(args):
    parser = argparse.ArgumentParser(description="Five-receipt smoke evaluation; default offline preflight.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true")
    mode.add_argument("--live", action="store_true")
    mode.add_argument("--replay", type=Path)
    mode.add_argument("--refresh-contract", action="store_true")
    parser.add_argument("--provider", choices=("gemini", "luna", "both"), default="both")
    parser.add_argument("--limit", type=int, choices=range(1, 6), default=5)
    parser.add_argument("--max-output-tokens", type=int, choices=range(256, 1601), default=1600,
                        metavar="256..1600")
    parser.add_argument("--out", type=Path)
    return parser.parse_args(args)


def score_record(record, manifest, snapshot):
    if not isinstance(record, dict):
        raise ValueError("Saved record must be a JSON object")
    fixture = next((fixture for fixture in manifest["fixtures"] if fixture["id"] == record["fixtureId"]), None)
    if fixture is None or record.get("imageSha256") != fixture["sha256"]:
        raise ValueError(f"Unknown or changed fixture: {record['fixtureId']}")
    evaluation = failed_evaluation(record["error"]) if record.get("error") else evaluate_response(
        fixture, record.get("response"), snapshot["schema"])
    return {**record, "evaluation": evaluation}


def write_report(destination, report):
    destination.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    with destination.open("x") as output:
        output.write(content)


def replay_run(options, manifest, snapshot, stdout):
    if options.out and options.out.resolve() == options.replay.resolve():
        raise ValueError("Replay output must not overwrite its source artifact")
    saved = loads_json(options.replay.read_text())
    if not isinstance(saved, dict) or saved.get("version") not in (1, 2) or not isinstance(saved.get("records"), list):
        raise ValueError("Unsupported saved evaluation format")
    if saved.get("mode") == "replay":
        source_hash = saved["replay"].get("sourceContractSha256")
        source_provenance = saved["replay"].get("sourceProvenance")
    else:
        source_hash = saved.get("contractSha256") or saved.get("contract", {}).get("contractSha256")
        source_provenance = saved.get("contract", {}).get("provenance")
    differences = []
    if source_hash is None:
        differences.append("Source contract hash absent; contract comparison unknown")
    elif source_hash != snapshot["contractSha256"]:
        differences.append("Pinned prompt/schema differs from source run")
    if source_provenance is None:
        print("Source revision and contract provenance absent; legacy provenance unknown.", file=stdout)
    print("Replay uses strict JSON schema validation: extra properties, declared constraints, and date-time formats "
          "can reject legacy permissive passes. Reference arithmetic does not execute the editor.", file=stdout)
    for difference in differences:
        print(difference, file=stdout)
    records = [score_record(record, manifest, snapshot) for record in saved["records"]]
    summary = print_report(records, stdout)
    report = {"version": 2, "mode": "replay", "replayedAt": datetime.now(timezone.utc).isoformat(),
              "contract": snapshot, "contractSha256": snapshot["contractSha256"],
              "sourceRunMetadata": {key: value for key, value in saved.items() if key not in ("records", "summary")},
              "replay": {"sourceVersion": saved["version"], "sourceProvenance": source_provenance, "sourceContractSha256": source_hash,
                         "contractDifferences": differences,
                         "validationPolicy": "strict JSON schema; legacy permissive passes can change"},
              "records": records, "summary": summary}
    if options.out:
        write_report(options.out, report)
        print(f"Saved replay report {options.out}; source artifact unchanged.", file=stdout)
    return int(any(not record["evaluation"]["passed"] for record in records))


def persist_report(destination, report):
    content = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    # Completed records survive interruption, and readers observe complete JSON after each request.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=destination.parent,
                                         prefix=f".{destination.name}.", suffix=".tmp", delete=False) as output:
            temporary = Path(output.name)
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


async def collect_live(options, directory, manifest, snapshot, fixtures, providers, http_client, stdout, environ):
    for provider in providers:
        key_name = PROVIDERS[provider]["keyName"]
        if not environ.get(key_name, "").strip():
            raise ValueError(f"Missing {key_name}; no requests sent")
    created_at = datetime.now(timezone.utc).isoformat()
    destination = options.out or directory / "results" / ("run-" + created_at.replace(":", "-") + ".json")
    report = {"version": 2, "mode": "live", "createdAt": created_at, "source": manifest["source"],
              "contract": snapshot, "contractSha256": snapshot["contractSha256"],
              "settings": {"providers": providers, "maxOutputTokens": options.max_output_tokens,
                           "timeoutMs": TIMEOUT_MS, "plannedRequests": len(fixtures) * len(providers),
                           "pricingCheckedAt": PRICING_CHECKED_AT, "pricing": PROVIDERS},
              "records": [], "summary": {}}
    write_report(destination, report)  # Exclusive reservation precedes spending any tokens.
    owns_client = http_client is None
    client = http_client or httpx.AsyncClient(transport=httpx.AsyncHTTPTransport(retries=0),
                                            follow_redirects=False, timeout=TIMEOUT_MS / 1000)
    try:
        for index, fixture in enumerate(fixtures):
            image = (directory / fixture["image"]).read_bytes()
            for provider in providers if index % 2 == 0 else list(reversed(providers)):
                result = await call_provider(provider, image, snapshot, max_output_tokens=options.max_output_tokens,
                                             api_key=environ[PROVIDERS[provider]["keyName"]], client=client)
                record = score_record({"fixtureId": fixture["id"], "imageSha256": fixture["sha256"],
                                       "provider": provider, "modelId": PROVIDERS[provider]["modelId"], **result}, manifest, snapshot)
                report["records"].append(record)
                report["summary"] = summarize(report["records"])
                if result.get("error", "").startswith("Provider HTTP"):
                    report["stoppedEarly"] = "Provider HTTP error; resolve it before generating more responses"
                persist_report(destination, report)
                print(f"{provider}/{fixture['id']}: {'PASS' if record['evaluation']['passed'] else 'FAIL'} "
                      f"({record['requestLatencyMs']} ms)", file=stdout)
                if "stoppedEarly" in report:
                    print_report(report["records"], stdout)
                    print(f"Saved partial report {destination}", file=stdout)
                    return 1
        print_report(report["records"], stdout)
        print(f"Saved {destination}; replay is offline.", file=stdout)
        return int(any(not record["evaluation"]["passed"] for record in report["records"]))
    finally:
        if owns_client:
            await client.aclose()


def main(args=None, *, directory=DEFAULT_DIRECTORY, http_client=None, stdout=None, environ=None, source_root=None):
    stdout = stdout or sys.stdout
    try:
        options = parse_options(args)
        if options.refresh_contract:
            snapshot = refresh_contract(directory, source_root or DEFAULT_DIRECTORY.parents[1])
            print(f"Refreshed pinned contract {snapshot['contractSha256']}; source "
                  f"{snapshot['provenance']['sourceRevision']}; dirty sources "
                  f"{snapshot['provenance']['dirtySourcePaths']}", file=stdout)
            return 0
        snapshot = load_contract(directory)
        manifest = load_fixtures(Path(directory))
        if options.replay:
            return replay_run(options, manifest, snapshot, stdout)
        providers = ["gemini", "luna"] if options.provider == "both" else [options.provider]
        fixtures = manifest["fixtures"][:options.limit]
        print(f"{len(fixtures)} fixtures; {len(fixtures) * len(providers)} planned requests; "
              f"output cap {options.max_output_tokens} tokens/request; 20s timeout; no retries.", file=stdout)
        print(f"Selected providers: {', '.join(providers)}", file=stdout)
        for fixture in fixtures:
            print(f"{fixture['id']}: {len(fixture['expected']['items'])} rows", file=stdout)
        if options.live:
            return asyncio.run(collect_live(options, Path(directory), manifest, snapshot, fixtures, providers,
                                            http_client, stdout, os.environ if environ is None else environ))
        print("Offline preflight passed. No provider HTTP calls.", file=stdout)
        return 0
    except SystemExit as error:
        return int(error.code)
    except (OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        print(f"Error: {error}", file=stdout)
        return 1


def cli():
    raise SystemExit(main())


if __name__ == "__main__":
    cli()
