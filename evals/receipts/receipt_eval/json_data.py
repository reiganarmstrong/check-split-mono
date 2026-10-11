"""Strict JSON decoding shared by local artifacts and provider responses."""
import json


def loads_json(text):
    def reject_nonfinite(value):
        raise ValueError(f"Non-finite JSON number: {value}")

    return json.loads(text, parse_constant=reject_nonfinite)
