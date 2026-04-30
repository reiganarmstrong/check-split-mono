"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  centsToInputValue,
  formatCurrency,
  getReceiptSubtotalCents,
  getReceiptTipCents,
  parseMoneyInputToCents,
} from "@/lib/receipt-editor";
import type { ReceiptEditorState, TipInputMode } from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

import { SectionShell } from "../lib/shared";

type UpdateField = <K extends keyof ReceiptEditorState>(
  field: K,
  value: ReceiptEditorState[K],
) => void;

const quickTipPercentages = ["15", "18", "20", "25"];

function formatPercentageInput(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function AdjustmentsSection({
  editorState,
  updateField,
}: {
  editorState: ReceiptEditorState;
  updateField: UpdateField;
}) {
  const subtotalCents = getReceiptSubtotalCents(editorState);
  const tipCents = getReceiptTipCents(editorState);

  function selectTipInputMode(mode: TipInputMode) {
    if (mode === editorState.tipInputMode) {
      return;
    }

    if (mode === "amount") {
      updateField("tip", centsToInputValue(tipCents));
      updateField("tipInputMode", mode);
      return;
    }

    if (subtotalCents > 0 && editorState.tipInputMode === "amount") {
      const currentTipCents = parseMoneyInputToCents(editorState.tip);
      updateField(
        "tipPercentage",
        formatPercentageInput((currentTipCents / subtotalCents) * 100),
      );
    }

    updateField("tipInputMode", mode);
  }

  return (
    <SectionShell title="Adjustments" eyebrow="Receipt totals">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="flex h-8 items-center text-sm font-medium text-[var(--foreground)]">
            Tax
          </span>
          <Input
            inputMode="decimal"
            value={editorState.tax}
            onChange={(event) => updateField("tax", event.target.value)}
            className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex h-8 items-center justify-between gap-3">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Tip
            </span>
            <div
              role="group"
              className="grid grid-cols-2 rounded-[0.75rem] border border-[var(--line)] bg-[var(--surface)] p-0.5"
              aria-label="Tip input mode"
            >
              {(["amount", "percent"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={mode === "amount" ? "Tip amount" : "Tip percent"}
                  aria-pressed={editorState.tipInputMode === mode}
                  onClick={() => selectTipInputMode(mode)}
                  className={cn(
                    "h-7 rounded-[0.58rem] px-2 text-xs font-semibold",
                    editorState.tipInputMode === mode
                      ? "bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                      : "text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)]",
                  )}
                >
                  {mode === "amount" ? "$" : "%"}
                </Button>
              ))}
            </div>
          </div>
          {editorState.tipInputMode === "percent" ? (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  inputMode="decimal"
                  value={editorState.tipPercentage}
                  onChange={(event) => updateField("tipPercentage", event.target.value)}
                  className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 pr-10 font-medium"
                  aria-label="Tip percentage"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-[var(--muted-foreground)]">
                  %
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {quickTipPercentages.map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => updateField("tipPercentage", percentage)}
                    className={cn(
                      "h-7 rounded-[0.58rem] border-[var(--line)] bg-[var(--panel-strong)] px-1.5 text-xs font-semibold",
                      editorState.tipPercentage.trim() === percentage
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                        : "text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)]",
                    )}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                {formatCurrency(tipCents)} tip
              </p>
            </div>
          ) : (
            <Input
              inputMode="decimal"
              value={editorState.tip}
              onChange={(event) => updateField("tip", event.target.value)}
              className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
            />
          )}
        </div>
        <label className="space-y-2">
          <span className="flex h-8 items-center text-sm font-medium text-[var(--foreground)]">
            Fee
          </span>
          <Input
            inputMode="decimal"
            value={editorState.fee}
            onChange={(event) => updateField("fee", event.target.value)}
            className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
        <label className="space-y-2">
          <span className="flex h-8 items-center text-sm font-medium text-[var(--foreground)]">
            Discount
          </span>
          <Input
            inputMode="decimal"
            value={editorState.discount}
            onChange={(event) => updateField("discount", event.target.value)}
            className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
          />
        </label>
      </div>
    </SectionShell>
  );
}
