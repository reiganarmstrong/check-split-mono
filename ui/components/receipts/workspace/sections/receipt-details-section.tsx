"use client";

import { useEffect } from "react";
import { ChevronDown, ReceiptText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReceiptEditorState } from "@/lib/receipt-types";

import { requiredHighlightSoftStyle } from "../lib/constants";
import { FieldLabel, SectionShell } from "../lib/shared";

type UpdateField = <K extends keyof ReceiptEditorState>(
  field: K,
  value: ReceiptEditorState[K],
) => void;

const currencyOptions = [{ value: "USD", label: "USD" }] as const;

export function ReceiptDetailsSection({
  editorState,
  merchantNameMissing,
  receiptDateMissing,
  updateField,
}: {
  editorState: ReceiptEditorState;
  merchantNameMissing: boolean;
  receiptDateMissing: boolean;
  updateField: UpdateField;
}) {
  useEffect(() => {
    if (editorState.currencyCode !== "USD") {
      updateField("currencyCode", "USD");
    }
  }, [editorState.currencyCode, updateField]);

  return (
    <SectionShell
      title="Receipt details"
      eyebrow="Receipt info"
      icon={ReceiptText}
      tone="primary"
    >
      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Merchant and date required
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor="receipt-merchant-name"
            label="Merchant"
            showRequired={merchantNameMissing}
          />
          <Input
            id="receipt-merchant-name"
            value={editorState.merchantName}
            onChange={(event) => updateField("merchantName", event.target.value)}
            placeholder="The place that got paid"
            className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
            style={merchantNameMissing ? requiredHighlightSoftStyle : undefined}
          />
        </div>

        <div className="w-full min-w-0 space-y-2">
          <FieldLabel
            htmlFor="receipt-occurred-at"
            label="Receipt date"
            showRequired={receiptDateMissing}
          />
          <Input
            id="receipt-occurred-at"
            type="datetime-local"
            value={editorState.receiptOccurredAt}
            onChange={(event) =>
              updateField("receiptOccurredAt", event.target.value)
            }
            className="block h-12 w-full min-w-0 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 pt-2.5 text-left text-base font-medium text-[var(--foreground)] md:pt-0 md:leading-[3rem] md:[&::-webkit-datetime-edit]:p-0 md:[&::-webkit-datetime-edit-fields-wrapper]:flex md:[&::-webkit-datetime-edit-fields-wrapper]:h-full md:[&::-webkit-datetime-edit-fields-wrapper]:items-center"
            style={receiptDateMissing ? requiredHighlightSoftStyle : undefined}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="receipt-location-name"
            className="text-sm font-medium text-[var(--foreground)]"
          >
            Location name
          </Label>
          <Input
            id="receipt-location-name"
            value={editorState.locationName}
            onChange={(event) => updateField("locationName", event.target.value)}
            placeholder="Optional neighborhood or venue note"
            className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="receipt-currency-code"
            className="text-sm font-medium text-[var(--foreground)]"
          >
            Currency
          </Label>
          <div className="relative">
            <select
              id="receipt-currency-code"
              value={editorState.currencyCode === "USD" ? "USD" : ""}
              onChange={() => updateField("currencyCode", "USD")}
              className="h-12 w-full cursor-pointer appearance-none rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 pr-10 font-medium uppercase text-[var(--foreground)] outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label
            htmlFor="receipt-location-address"
            className="text-sm font-medium text-[var(--foreground)]"
          >
            Address or note
          </Label>
          <Textarea
            id="receipt-location-address"
            value={editorState.locationAddress}
            onChange={(event) =>
              updateField("locationAddress", event.target.value)
            }
            placeholder="Optional address, table note, or context for the receipt"
            className="min-h-28 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] font-medium"
          />
        </div>
      </div>
    </SectionShell>
  );
}
