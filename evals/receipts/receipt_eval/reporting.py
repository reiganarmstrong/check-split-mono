"""Smoke-evaluation reports and compatible cost/latency summaries."""
import math


def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def summarize(records):
    summary = {}
    for provider in dict.fromkeys(record["provider"] for record in records):
        rows = [record for record in records if record["provider"] == provider]
        valid = sum(not row.get("error") and row["evaluation"]["schemaValid"] for row in rows)
        financial = sum(row["evaluation"]["financialPassed"] for row in rows)
        times = sorted(row["requestLatencyMs"] for row in rows if finite_number(row.get("requestLatencyMs")))
        cost = sum(row["estimatedCostUsd"] for row in rows) \
            if all(finite_number(row.get("estimatedCostUsd")) for row in rows) else None
        summary[provider] = {"modelId": rows[0].get("modelId"), "attemptedReceipts": len(rows),
                             "validResponses": valid, "passedReceipts": sum(row["evaluation"]["passed"] for row in rows),
                             "financialPassedReceipts": financial,
                             "receiptExtractionPassedReceipts": sum(row["evaluation"]["receiptExtractionPassed"] for row in rows),
                             "derivedArithmeticPassedReceipts": sum(row["evaluation"]["derivedArithmeticPassed"] for row in rows),
                             "medianRequestLatencyMs": times[len(times) // 2] if times else None,
                             "maxRequestLatencyMs": times[-1] if times else None,
                             "estimatedTotalCostUsd": cost,
                             "estimatedCostPerValidResponseUsd": cost / valid if cost is not None and valid else None,
                             "estimatedCostPerFinancialPassUsd": cost / financial if cost is not None and financial else None}
    return summary


def print_report(records, stdout):
    summary = summarize(records)
    print("provider: valid / full pass / financial pass / extraction / derived arithmetic; median ms; max ms; estimated USD", file=stdout)
    for provider, row in summary.items():
        cost = "unknown" if row["estimatedTotalCostUsd"] is None else f"{row['estimatedTotalCostUsd']:.6f}"
        print(f"{provider}: {row['validResponses']} / {row['passedReceipts']} / "
              f"{row['financialPassedReceipts']} / {row['receiptExtractionPassedReceipts']} / "
              f"{row['derivedArithmeticPassedReceipts']} of {row['attemptedReceipts']}; "
              f"{row['medianRequestLatencyMs']}; {row['maxRequestLatencyMs']}; {cost}", file=stdout)
        print(f"  estimated cost per valid response: {row['estimatedCostPerValidResponseUsd']}; "
              f"per financial pass: {row['estimatedCostPerFinancialPassUsd']}", file=stdout)
    for record in records:
        if not record["evaluation"]["passed"]:
            print(f"{record['provider']}/{record['fixtureId']}: " + ", ".join(record["evaluation"]["failures"]), file=stdout)
    print("Five-fixture smoke evaluation of receipt extraction accuracy and derived arithmetic accuracy; "
          "does not verify actual receipt draft correctness. Request latency excludes browser preparation, AWS, and auth.", file=stdout)
    return summary
