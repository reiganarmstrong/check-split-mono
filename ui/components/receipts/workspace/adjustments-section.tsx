"use client";

import { Input } from "@/components/ui/input";
import type { ReceiptEditorState } from "@/lib/receipt-types";

import { SectionShell } from "./shared";

type UpdateField = <K extends keyof ReceiptEditorState>(
  field: K,
  value: ReceiptEditorState[K],
) => void;

export function AdjustmentsSection({
  editorState,
  updateField,
}: {
  editorState: ReceiptEditorState;
  updateField: UpdateField;
}) {
  return (
    <SectionShell title="Adjustments" eyebrow="Totals">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Tax
          </span>
          <Input
            inputMode="decimal"
            value={editorState.tax}
            onChange={(event) => updateField("tax", event.target.value)}
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Tip
          </span>
          <Input
            inputMode="decimal"
            value={editorState.tip}
            onChange={(event) => updateField("tip", event.target.value)}
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Fee
          </span>
          <Input
            inputMode="decimal"
            value={editorState.fee}
            onChange={(event) => updateField("fee", event.target.value)}
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Discount
          </span>
          <Input
            inputMode="decimal"
            value={editorState.discount}
            onChange={(event) => updateField("discount", event.target.value)}
            className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
      </div>
    </SectionShell>
  );
}
