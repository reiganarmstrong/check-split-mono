"""Pinned contract loading and explicit refresh, independent of TypeScript runtimes."""
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import json5
from jsonschema import Draft202012Validator

from .json_data import loads_json

PROMPTS_PATH = "infra/modules/receipt-ingestion-api/lambda/src/prompts.ts"
SCHEMA_PATH = "infra/modules/receipt-ingestion-api/lambda/src/schema.ts"


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def compact_json(value):
    # Matches JSON.stringify for this pinned string/object/integer contract.
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def contract_hashes(system, image, schema):
    return {"systemPromptSha256": sha256(system.encode()),
            "imagePromptSha256": sha256(image.encode()),
            "schemaSha256": sha256(compact_json(schema).encode()),
            "contractSha256": sha256(compact_json({"system": system, "image": image, "schema": schema}).encode())}


def refresh_contract(directory, source_root):
    source_root = Path(source_root)
    prompts_bytes = (source_root / PROMPTS_PATH).read_bytes()
    schema_bytes = (source_root / SCHEMA_PATH).read_bytes()
    prompts = prompts_bytes.decode()
    extracted = []
    for name in ("SYSTEM_PROMPT", "IMAGE_PROMPT"):
        match = re.search(r"export const " + name + r"\s*=\s*`([^`]*)`", prompts)
        if not match or "${" in match.group(1) or "\\" in match.group(1):
            raise ValueError(f"Cannot safely copy {name}; update snapshot extraction for changed source syntax")
        extracted.append(match.group(1))
    match = re.search(r"export const receiptDraftResponseJsonSchema\s*=\s*(\{.*\})\s*as const", schema_bytes.decode(), re.S)
    if not match:
        raise ValueError("Cannot safely copy production JSON schema")
    schema = json5.loads(match.group(1), allow_duplicate_keys=False)
    Draft202012Validator.check_schema(schema)
    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=source_root,
                              check=True, text=True, capture_output=True).stdout.strip()
    dirty = []
    for path in (PROMPTS_PATH, SCHEMA_PATH):
        at_revision = subprocess.run(["git", "show", f"{revision}:{path}"], cwd=source_root,
                                     check=True, capture_output=True).stdout
        if at_revision != (source_root / path).read_bytes():
            dirty.append(path)
    hashes = contract_hashes(*extracted, schema)
    snapshot = {"version": 1, "refreshedAt": datetime.now(timezone.utc).isoformat(),
                "systemPrompt": extracted[0], "imagePrompt": extracted[1], "schema": schema,
                **hashes,
                "provenance": {"sourceRevision": revision, "dirtySourcePaths": dirty,
                               "sourceContentSha256": {PROMPTS_PATH: sha256(prompts_bytes),
                                                       SCHEMA_PATH: sha256(schema_bytes)}}}
    destination = Path(directory) / "contract" / "snapshot.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    return snapshot


def load_contract(directory):
    snapshot = loads_json((Path(directory) / "contract" / "snapshot.json").read_text())
    if snapshot.get("version") != 1:
        raise ValueError("Unsupported pinned contract version")
    hashes = contract_hashes(snapshot["systemPrompt"], snapshot["imagePrompt"], snapshot["schema"])
    if any(snapshot.get(key) != value for key, value in hashes.items()):
        raise ValueError("Pinned contract checksum failed; refresh explicitly")
    Draft202012Validator.check_schema(snapshot["schema"])
    return snapshot
