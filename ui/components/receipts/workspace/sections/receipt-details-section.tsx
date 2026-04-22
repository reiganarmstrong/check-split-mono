"use client";

import { ReceiptText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ReceiptEditorState } from "@/lib/receipt-types";

import { requiredHighlightSoftStyle } from "../lib/constants";
import { FieldLabel, SectionShell } from "../lib/shared";

type UpdateField = <K extends keyof ReceiptEditorState>(
  field: K,
  value: ReceiptEditorState[K],
) => void;

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
        <label className="space-y-2">
          <FieldLabel label="Merchant" showRequired={merchantNameMissing} />
          <Input
            value={editorState.merchantName}
            onChange={(event) => updateField("merchantName", event.target.value)}
            placeholder="The place that got paid"
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
            style={merchantNameMissing ? requiredHighlightSoftStyle : undefined}
          />
        </label>

        <label className="w-full min-w-0 space-y-2">
          <FieldLabel label="Receipt date" showRequired={receiptDateMissing} />
          <div
            className="h-12 w-full min-w-0 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)]"
            style={receiptDateMissing ? requiredHighlightSoftStyle : undefined}
          >
            <input
              type="datetime-local"
              value={editorState.receiptOccurredAt}
              onChange={(event) =>
                updateField("receiptOccurredAt", event.target.value)
              }
              className="block h-full w-full min-w-0 rounded-[1rem] border-0 bg-transparent px-4 pt-2.5 text-left text-base font-medium text-[var(--foreground)] outline-none md:pt-0 md:leading-[3rem] md:[&::-webkit-datetime-edit]:p-0 md:[&::-webkit-datetime-edit-fields-wrapper]:flex md:[&::-webkit-datetime-edit-fields-wrapper]:h-full md:[&::-webkit-datetime-edit-fields-wrapper]:items-center"
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Location name
          </span>
          <Input
            value={editorState.locationName}
            onChange={(event) => updateField("locationName", event.target.value)}
            placeholder="Optional neighborhood or venue note"
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Currency
          </span>
          <Input
            value={editorState.currencyCode}
            onChange={(event) =>
              updateField("currencyCode", event.target.value.toUpperCase())
            }
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium uppercase"
            maxLength={3}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Address or note
          </span>
          <Textarea
            value={editorState.locationAddress}
            onChange={(event) =>
              updateField("locationAddress", event.target.value)
            }
            placeholder="Optional address, table note, or context for the receipt"
            className="min-h-28 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] font-medium"
          />
        </label>
      </div>
    </SectionShell>
  );
}
