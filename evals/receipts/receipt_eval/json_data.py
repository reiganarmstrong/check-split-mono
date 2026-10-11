"""Strict JSON decoding shared by local artifacts and provider responses."""
import json
import math


def loads_json(text):
    def reject_nonfinite(value):
        raise ValueError(f"Non-finite JSON number: {value}")

    def parse_finite_float(value):
        parsed = float(value)
        if not math.isfinite(parsed):
            reject_nonfinite(value)
        return parsed

    return json.loads(text, parse_constant=reject_nonfinite, parse_float=parse_finite_float)
