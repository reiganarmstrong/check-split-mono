"""Small independent reference interpretation, not the application editor."""
import math
import unicodedata
from fractions import Fraction

from jsonschema import Draft202012Validator, FormatChecker


def normalize_text(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(c for c in value if not unicodedata.category(c).startswith("M"))
    value = "".join(c.lower() if unicodedata.category(c)[0] in "LN" else " " for c in value)
    return " ".join(value.split())


def matches(actual, expected):
    choices = expected if isinstance(expected, list) else [expected]
    return any(normalize_text(actual) == normalize_text(choice) if isinstance(choice, str)
               else actual == choice for choice in choices)


def failed_evaluation(message):
    return {"schemaValid": False, "passed": False, "financialPassed": False,
            "receiptExtractionPassed": False, "derivedArithmeticPassed": False,
            "failures": [message], "checks": []}


def evaluate_response(fixture, response, schema):
    errors = list(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(response))
    if errors:
        evaluation = failed_evaluation("Response failed strict JSON schema validation")
        evaluation["failures"] = ["schema: " + ".".join(map(str, error.absolute_path)) + ": " + error.message
                                  for error in errors]
        return evaluation
    draft = response["createReceiptInputDraft"]
    raw_items = response["upsertReceiptItemInputDrafts"]
    items = []
    for raw in raw_items:
        price = raw["unitPriceCents"]
        if price is None:
            # Math.round-compatible halves toward positive infinity; Python round uses ties-to-even.
            price = max(math.floor(Fraction(int(raw["lineSubtotalCents"]), int(raw["quantity"])) + Fraction(1, 2)), 0) \
                if raw["lineSubtotalCents"] is not None else 0
        # Schema integers may arrive as whole floats. Interpret with exact integer cents.
        price, quantity, discount = int(price), int(raw["quantity"]), int(raw["discountCents"])
        items.append({"description": raw["description"], "quantity": quantity,
                      "effectiveUnitPriceCents": price, "discountCents": discount,
                      "lineSubtotalCents": max(quantity * price - discount, 0)})
    subtotal = sum(item["lineSubtotalCents"] for item in items)
    total = subtotal + int(draft["taxCents"] or 0) + int(draft["tipCents"] or 0) \
        + int(draft["feeCents"] or 0) - int(draft["discountCents"] or 0)
    needs_review = response["needsReview"] or bool(response["issues"]) or any(
        item["scanConfidence"] is not None and item["scanConfidence"] < 0.8 for item in raw_items)
    checks = []

    def check(field, actual, expected, financial=True, category="receiptExtraction"):
        checks.append({"field": field, "actual": actual, "expected": expected,
                       "passed": matches(actual, expected), "financial": financial, "category": category})

    expected = fixture["expected"]
    check("merchantName", draft["merchantName"], expected["merchantName"], False)
    for field, value in expected["receipt"].items():
        check(field, draft[field], value, field.endswith("Cents"))
    check("itemCount", len(items), len(expected["items"]))
    unused = set(range(len(items)))
    for gold_index, gold in enumerate(expected["items"]):
        candidates = [index for index in sorted(unused) if matches(items[index]["description"], gold["description"])]

        def errors(index):
            item = items[index]
            return (int(item["quantity"] != gold["quantity"]) +
                    int(item["effectiveUnitPriceCents"] != gold["unitPriceCents"]) +
                    int(item["discountCents"] != gold["discountCents"]))

        prefix = f"item[{gold_index}]"
        if not candidates:
            check(f"{prefix}.description", None, gold["description"])
            continue
        index = min(candidates, key=errors)
        unused.remove(index)
        item, raw = items[index], raw_items[index]
        check(f"{prefix}.quantity", item["quantity"], gold["quantity"])
        check(f"{prefix}.unitPriceCents", item["effectiveUnitPriceCents"], gold["unitPriceCents"],
              category="derivedArithmetic")
        check(f"{prefix}.discountCents", item["discountCents"], gold["discountCents"], category="derivedArithmetic")
        check(f"{prefix}.extractedDiscountCents", raw["discountCents"], gold["discountCents"])
        check(f"{prefix}.derivedLineSubtotalCents", item["lineSubtotalCents"], gold["lineSubtotalCents"],
              category="derivedArithmetic")
        if raw["unitPriceCents"] is not None:
            check(f"{prefix}.extractedUnitPriceCents", raw["unitPriceCents"], gold["unitPriceCents"])
        if raw["lineSubtotalCents"] is not None:
            check(f"{prefix}.extractedLineSubtotalCents", raw["lineSubtotalCents"], gold["lineSubtotalCents"])
    check("derivedSubtotalCents", subtotal, expected["editorSubtotalCents"], category="derivedArithmetic")
    check("derivedReceiptTotalCents", total, expected["editorTotalCents"], category="derivedArithmetic")
    if "needsReview" in expected:
        check("needsReview", needs_review, expected["needsReview"], category="derivedArithmetic")
    return {"schemaValid": True, "passed": all(check["passed"] for check in checks),
            "financialPassed": all(check["passed"] for check in checks if check["financial"]),
            "receiptExtractionPassed": all(check["passed"] for check in checks if check["category"] == "receiptExtraction"),
            "derivedArithmeticPassed": all(check["passed"] for check in checks if check["category"] == "derivedArithmetic"),
            "failures": [check["field"] for check in checks if not check["passed"]], "checks": checks,
            "observations": {"raw": response, "derived": {"items": items, "subtotalCents": subtotal,
                             "receiptTotalCents": total, "needsReview": needs_review}}}
