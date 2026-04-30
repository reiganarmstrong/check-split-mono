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
  const unpaidGroupCount = Math.max(groups.length - paidGroupCount, 0);
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
            "flex flex-wrap items-center justify-between gap-3 rounded-[0.85rem] border px-4 py-3",
            "border-[var(--line)] bg-white",
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
              "rounded-[0.75rem] border px-3 py-1.5 text-sm font-medium",
              allGroupsPaid
                ? "border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_24%,white)] text-[var(--foreground)]"
                : "border-[color-mix(in_oklab,var(--unpaid)_36%,var(--line))] bg-[color-mix(in_oklab,var(--unpaid-soft)_78%,white)] text-[var(--unpaid-foreground)]",
            )}
          >
            {allGroupsPaid ? "Everyone paid" : `${unpaidGroupCount} unpaid`}
          </span>
        </div>

        <div className="space-y-3">
          {groups.map((group) => {
            const share = groupSharesById.get(group.id);

            return (
              <div
                key={group.id}
                className={cn(
                  "flex flex-col gap-4 rounded-[0.9rem] border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                  group.isPaid
                    ? "border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_10%,white)]"
                    : "border-[color-mix(in_oklab,var(--unpaid)_36%,var(--line))] bg-[color-mix(in_oklab,var(--unpaid-soft)_60%,white)]",
                )}
              >
                <div className="min-w-0">
                  <p className="text-base font-medium text-[var(--foreground)]">
                    {group.displayName || "Untitled group"}
                  </p>
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
                  aria-label={group.isPaid ? "Mark group unpaid" : "Mark group paid"}
                  className={cn(
                    "h-10 rounded-[0.8rem] border px-4 text-sm font-medium",
                    group.isPaid
                      ? "border-[color-mix(in_oklab,var(--accent)_40%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-[var(--accent-foreground)] hover:border-[color-mix(in_oklab,var(--unpaid)_36%,var(--line))] hover:bg-[color-mix(in_oklab,var(--unpaid-soft)_72%,white)] hover:text-[var(--unpaid-foreground)]"
                      : "border-[color-mix(in_oklab,var(--unpaid)_42%,var(--line))] bg-[color-mix(in_oklab,var(--unpaid-soft)_78%,white)] text-[var(--unpaid-foreground)] hover:border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] hover:bg-[color-mix(in_oklab,var(--accent)_18%,white)] hover:text-[var(--accent-foreground)]",
                  )}
                  onClick={() => toggleGroupPaid(group.id)}
                >
                  {group.isPaid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 group-hover/button:hidden" />
                      <CircleDashed className="hidden h-4 w-4 group-hover/button:inline" />
                    </>
                  ) : (
                    <>
                      <CircleDashed className="h-4 w-4 group-hover/button:hidden" />
                      <CheckCircle2 className="hidden h-4 w-4 group-hover/button:inline" />
                    </>
                  )}
                  <span className="group-hover/button:hidden">
                    {group.isPaid ? "Paid" : "Unpaid"}
                  </span>
                  <span className="hidden group-hover/button:inline">
                    {group.isPaid ? "Mark unpaid" : "Mark paid"}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
