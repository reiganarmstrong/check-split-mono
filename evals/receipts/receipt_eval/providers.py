"""Provider HTTP boundary. Every request has a whole-request deadline and no retries."""
import asyncio
import base64
import math
import time

import httpx

from .json_data import loads_json

PROVIDERS = {
    "gemini": {"modelId": "gemini-3.1-flash-lite", "keyName": "GEMINI_API_KEY",
               "inputRate": 0.25, "cachedRate": 0.025, "outputRate": 1.5},
}
PRICING_CHECKED_AT = "2026-10-10"
TIMEOUT_MS = 20_000


def build_request(provider, image, snapshot, max_output_tokens):
    model_id = PROVIDERS[provider]["modelId"]
    data = base64.b64encode(image).decode()
    return {"url": f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent",
            "body": {"contents": [{"role": "user", "parts": [{"text": snapshot["imagePrompt"]},
                     {"inlineData": {"mimeType": "image/jpeg", "data": data}}]}],
                     "systemInstruction": {"parts": [{"text": snapshot["systemPrompt"]}]},
                     "generationConfig": {"responseMimeType": "application/json", "responseJsonSchema": snapshot["schema"],
                                          "maxOutputTokens": max_output_tokens}}}


def extract_usage(provider, document):
    metadata = document.get("usageMetadata")
    if not isinstance(metadata, dict):
        return None
    input_tokens = metadata.get("promptTokenCount")
    candidates = metadata.get("candidatesTokenCount")
    reasoning = metadata.get("thoughtsTokenCount")
    cached = metadata.get("cachedContentTokenCount")
    reasoning = 0 if reasoning is None else reasoning
    cached = 0 if cached is None else cached
    values = (input_tokens, candidates, reasoning, cached)
    try:
        if any(not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value)
               or value < 0 or value != int(value) for value in values):
            return None
    except OverflowError:
        return None
    input_tokens, candidates, reasoning, cached = map(int, values)
    if cached > input_tokens:
        return None
    return {"inputTokens": input_tokens, "outputTokens": candidates + reasoning,
            "cachedInputTokens": cached, "reasoningTokens": reasoning}


def estimate_cost(provider, usage):
    if usage is None:
        return None
    rates = PROVIDERS[provider]
    try:
        cost = ((usage["inputTokens"] - usage["cachedInputTokens"]) * rates["inputRate"]
                + usage["cachedInputTokens"] * rates["cachedRate"]
                + usage["outputTokens"] * rates["outputRate"]) / 1_000_000
        return cost if math.isfinite(cost) else None
    except OverflowError:
        return None


def extract_response(provider, document):
    if not isinstance(document, dict):
        raise ValueError("Provider response is not a JSON object")
    candidates = document.get("candidates")
    candidate = candidates[0] if isinstance(candidates, list) and candidates else None
    feedback = document.get("promptFeedback")
    if feedback is not None and not isinstance(feedback, dict):
        raise ValueError("Gemini response malformed prompt feedback")
    if not isinstance(candidate, dict) or candidate.get("finishReason") != "STOP" \
            or (feedback or {}).get("blockReason"):
        reason = candidate.get("finishReason") if isinstance(candidate, dict) else "blocked or missing"
        raise ValueError(f"Gemini response finish: {reason}")
    content = candidate.get("content")
    if not isinstance(content, dict):
        raise ValueError("Gemini response malformed content")
    parts = content.get("parts")
    if not isinstance(parts, list) or any(not isinstance(part, dict) for part in parts):
        raise ValueError("Gemini response malformed parts")
    text_parts = []
    for part in parts:
        if part.get("thought"):
            continue
        text = part.get("text")
        if text is not None and not isinstance(text, str):
            raise ValueError("Gemini response malformed text")
        text_parts.append(text or "")
    return loads_json("".join(text_parts))


async def call_provider(provider, image, snapshot, *, max_output_tokens, api_key, client):
    request = build_request(provider, image, snapshot, max_output_tokens)
    started = time.monotonic()
    usage = None
    response = None
    error = None
    try:
        # asyncio covers total wall time including response reading, unlike per-phase HTTP timeouts alone.
        result = await asyncio.wait_for(client.post(request["url"], json=request["body"],
            headers={"content-type": "application/json", "x-goog-api-key": api_key},
            timeout=TIMEOUT_MS / 1000, follow_redirects=False), timeout=TIMEOUT_MS / 1000)
        if not 200 <= result.status_code < 300:
            raise ValueError(f"Provider HTTP {result.status_code}")
        document = loads_json(result.text)
        if isinstance(document, dict):
            usage = extract_usage(provider, document)
        response = extract_response(provider, document)
    except (TimeoutError, httpx.TimeoutException):
        error = "Request timed out"
    except httpx.RequestError as exception:
        error = f"Provider transport failure: {type(exception).__name__}"
    except (ValueError, TypeError, KeyError, IndexError, AttributeError) as exception:
        error = str(exception)
    return {"response": response, **({"error": error} if error else {}), "usage": usage,
            "estimatedCostUsd": estimate_cost(provider, usage),
            "requestLatencyMs": math.floor((time.monotonic() - started) * 1000 + 0.5)}
