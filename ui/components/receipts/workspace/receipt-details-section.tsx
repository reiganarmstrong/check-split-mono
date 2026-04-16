"use client";

import { Camera, ReceiptText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ReceiptEditorState } from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

import { requiredHighlightSoftStyle } from "./constants";
import { FieldLabel, SectionShell } from "./shared";

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
      eyebrow="Metadata"
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
            className={cn(
              "h-12 rounded-[1rem] border px-4 font-medium",
              merchantNameMissing
                ? "border-[var(--line)]"
                : "border-[var(--line)] bg-[var(--panel-strong)]",
            )}
            style={merchantNameMissing ? requiredHighlightSoftStyle : undefined}
          />
        </label>

        <label className="w-full min-w-0 space-y-2">
          <FieldLabel label="Receipt date" showRequired={receiptDateMissing} />
          <div
            className={cn(
              "h-12 w-full min-w-0 rounded-[1rem] border",
              receiptDateMissing
                ? "border-[var(--line)]"
                : "border-[var(--line)] bg-[var(--panel-strong)]",
            )}
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

      <div className="workspace-line mt-6 flex flex-wrap items-center justify-between gap-4 pt-5">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            Upload-based parsing
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            Not available yet.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]"
        >
          <span className="inline-flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Upload receipt
          </span>
        </button>
      </div>
    </SectionShell>
  );
}
