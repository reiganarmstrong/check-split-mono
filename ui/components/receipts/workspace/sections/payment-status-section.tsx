"use client";

import { CheckCircle2, CircleDashed, HandCoins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/receipt-editor";
import type { EditableGroup } from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

import { SectionShell } from "../lib/shared";
import type { ReceiptWorkspaceGroupShare } from "../hooks/use-receipt-workspace";

export function PaymentStatusSection({
  groups,
  groupSharesById,
  toggleGroupPaid,
}: {
  groups: EditableGroup[];
  groupSharesById: Map<string, ReceiptWorkspaceGroupShare>;
  toggleGroupPaid: (groupId: string) => void;
}) {
  const paidGroupCount = groups.filter((group) => group.isPaid).length;
  const allGroupsPaid = groups.length > 0 && paidGroupCount === groups.length;

  return (
    <SectionShell
      title="Payments"
      eyebrow="Payment status"
      icon={HandCoins}
      tone="primary"
    >
      <div className="space-y-4">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border px-4 py-3",
            allGroupsPaid
              ? "border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_12%,white)]"
              : "border-[color-mix(in_oklab,#d84b39_35%,var(--line))] bg-[color-mix(in_oklab,#d84b39_10%,white)]",
          )}
        >
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Payment tracking
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Mark groups paid here. Receipt summary mirrors same status.
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              allGroupsPaid
                ? "border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_24%,white)] text-[var(--foreground)]"
                : "border-[color-mix(in_oklab,#d84b39_42%,var(--line))] bg-[color-mix(in_oklab,#d84b39_18%,white)] text-[#8f2f22]",
            )}
          >
            {paidGroupCount}/{groups.length} paid
          </span>
        </div>

        <div className="space-y-3">
          {groups.map((group) => {
            const share = groupSharesById.get(group.id);

            return (
              <div
                key={group.id}
                className={cn(
                  "flex flex-col gap-4 rounded-[1.25rem] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                  group.isPaid
                    ? "border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_10%,white)]"
                    : "border-[var(--line)] bg-[var(--panel-strong)]",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium text-[var(--foreground)]">
                      {group.displayName || "Untitled group"}
                    </p>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]",
                        group.isPaid
                          ? "border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_20%,transparent)] text-[var(--foreground)]"
                          : "border-[color-mix(in_oklab,#d84b39_40%,var(--line))] bg-[color-mix(in_oklab,#d84b39_12%,white)] text-[#b43b2b]",
                      )}
                    >
                      {group.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Amount due{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {formatCurrency(share?.amountCents ?? 0)}
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 rounded-full border px-4 text-sm font-medium",
                    group.isPaid
                      ? "border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_20%,transparent)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--accent)_26%,transparent)]"
                      : "border-[var(--line)] bg-[var(--panel)] text-[var(--foreground)] hover:bg-[var(--surface)]",
                  )}
                  onClick={() => toggleGroupPaid(group.id)}
                >
                  {group.isPaid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <CircleDashed className="h-4 w-4" />
                  )}
                  {group.isPaid ? "Mark unpaid" : "Mark paid"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
