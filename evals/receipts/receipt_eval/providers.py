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
    "luna": {"modelId": "gpt-6-luna", "keyName": "OPENAI_API_KEY",
             "inputRate": 0.1, "cachedRate": 0.01, "outputRate": 0.5},
}
PRICING_CHECKED_AT = "2026-10-10"
TIMEOUT_MS = 20_000


def _normalize_usage(input_tokens, output_tokens, reasoning, cached):
    reasoning = 0 if reasoning is None else reasoning
    cached = 0 if cached is None else cached
    values = (input_tokens, output_tokens, reasoning, cached)
    try:
        if any(not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value)
               or value < 0 or value != int(value) for value in values):
            return None
    except OverflowError:
        return None
    input_tokens, output_tokens, reasoning, cached = map(int, values)
    if cached > input_tokens:
        return None
    return {"inputTokens": input_tokens, "outputTokens": output_tokens,
            "cachedInputTokens": cached, "reasoningTokens": reasoning}


def _gemini_request(data, snapshot, max_output_tokens, model_id):
    return {"url": f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent",
            "body": {"contents": [{"role": "user", "parts": [{"text": snapshot["imagePrompt"]},
                     {"inlineData": {"mimeType": "image/jpeg", "data": data}}]}],
                     "systemInstruction": {"parts": [{"text": snapshot["systemPrompt"]}]},
                     "generationConfig": {"responseMimeType": "application/json", "responseJsonSchema": snapshot["schema"],
                                          "maxOutputTokens": max_output_tokens}}}


def _gemini_headers(api_key):
    return {"content-type": "application/json", "x-goog-api-key": api_key}


def _gemini_usage(document):
    metadata = document.get("usageMetadata")
    if not isinstance(metadata, dict):
        return None
    usage = _normalize_usage(metadata.get("promptTokenCount"), metadata.get("candidatesTokenCount"),
                             metadata.get("thoughtsTokenCount"), metadata.get("cachedContentTokenCount"))
    if usage is not None:
        # Gemini reports visible candidate output separately from billed thinking.
        usage["outputTokens"] += usage["reasoningTokens"]
    return usage


def _gemini_response(document):
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


def _luna_request(data, snapshot, max_output_tokens, model_id):
    return {"url": "https://api.openai.com/v1/responses", "body": {
        "model": model_id, "store": False, "service_tier": "default", "reasoning": {"effort": "none"},
        "max_output_tokens": max_output_tokens, "instructions": snapshot["systemPrompt"],
        "input": [{"role": "user", "content": [{"type": "input_text", "text": snapshot["imagePrompt"]},
                   {"type": "input_image", "image_url": f"data:image/jpeg;base64,{data}", "detail": "high"}]}],
        "text": {"format": {"type": "json_schema", "name": "receipt_draft", "strict": True, "schema": snapshot["schema"]}}}}


def _luna_headers(api_key):
    return {"content-type": "application/json", "authorization": f"Bearer {api_key}"}


def _luna_usage(document):
    metadata = document.get("usage")
    if not isinstance(metadata, dict):
        return None
    input_details = metadata.get("input_tokens_details")
    output_details = metadata.get("output_tokens_details")
    if any(details is not None and not isinstance(details, dict) for details in (input_details, output_details)):
        return None
    # Luna output usage already includes reasoning; preserve it without adding again.
    return _normalize_usage(metadata.get("input_tokens"), metadata.get("output_tokens"),
                            (output_details or {}).get("reasoning_tokens"), (input_details or {}).get("cached_tokens"))


def _luna_response(document):
    if document.get("status") != "completed":
        raise ValueError(f"OpenAI response status: {document.get('status') or 'missing'}")
    output = document.get("output", [])
    if not isinstance(output, list) or any(not isinstance(item, dict) for item in output):
        raise ValueError("OpenAI response malformed output")
    content = []
    for item in output:
        if item.get("type") != "message":
            continue
        parts = item.get("content", [])
        if not isinstance(parts, list) or any(not isinstance(part, dict) for part in parts):
            raise ValueError("OpenAI response malformed content")
        content.extend(parts)
    if any(item.get("type") == "refusal" for item in content):
        raise ValueError("OpenAI refused the image")
    text_parts = [item.get("text") for item in content if item.get("type") == "output_text"]
    if any(not isinstance(text, str) for text in text_parts):
        raise ValueError("OpenAI response malformed text")
    return loads_json("".join(text_parts))


# Concrete protocols keep each existing provider's differences together. Shared
# orchestration selects from this map instead of silently defaulting to Gemini.
_ADAPTERS = {
    "gemini": {"request": _gemini_request, "headers": _gemini_headers,
               "usage": _gemini_usage, "response": _gemini_response},
    "luna": {"request": _luna_request, "headers": _luna_headers,
             "usage": _luna_usage, "response": _luna_response},
}


def build_request(provider, image, snapshot, max_output_tokens):
    data = base64.b64encode(image).decode()
    return _ADAPTERS[provider]["request"](data, snapshot, max_output_tokens, PROVIDERS[provider]["modelId"])


def extract_usage(provider, document):
    return _ADAPTERS[provider]["usage"](document)


def extract_response(provider, document):
    adapter = _ADAPTERS[provider]
    if not isinstance(document, dict):
        raise ValueError("Provider response is not a JSON object")
    return adapter["response"](document)


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


async def call_provider(provider, image, snapshot, *, max_output_tokens, api_key, client):
    request = build_request(provider, image, snapshot, max_output_tokens)
    headers = _ADAPTERS[provider]["headers"](api_key)
    started = time.monotonic()
    usage = None
    response = None
    error = None
    try:
        # asyncio covers total wall time including response reading, unlike per-phase HTTP timeouts alone.
        result = await asyncio.wait_for(client.post(request["url"], json=request["body"],
            headers=headers,
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
