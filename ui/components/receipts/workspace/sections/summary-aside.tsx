"use client";

import type { RefObject } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  LoaderCircle,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency, parseMoneyInputToCents } from "@/lib/receipt-editor";
import type { EditableGroup, ReceiptEditorState } from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

import { SummaryRow } from "../lib/shared";
import type {
  ReceiptWorkspaceGroupItemShareDetail,
  ReceiptWorkspaceGroupShare,
} from "../hooks/use-receipt-workspace";

export function SummaryAside({
  summaryRef,
  groups,
  editorState,
  subtotalCents,
  totalCents,
  groupSharesById,
  groupItemShareDetailsByGroupId,
  toggleGroupPaid,
  isSharingSummary,
  handleShareSummary,
  scrollToFullSummary,
  actionBarHeight,
  footerOffset,
}: {
  summaryRef: RefObject<HTMLElement | null>;
  groups: EditableGroup[];
  editorState: ReceiptEditorState;
  subtotalCents: number;
  totalCents: number;
  groupSharesById: Map<string, ReceiptWorkspaceGroupShare>;
  groupItemShareDetailsByGroupId: Map<
    string,
    ReceiptWorkspaceGroupItemShareDetail[]
  >;
  toggleGroupPaid: (groupId: string) => void;
  isSharingSummary: boolean;
  handleShareSummary: () => Promise<void>;
  scrollToFullSummary: () => void;
  actionBarHeight: number;
  footerOffset: number;
}) {
  return (
    <motion.aside
      ref={summaryRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.35 }}
      className="workspace-panel relative rounded-[1rem] p-6 lg:-mt-2 lg:sticky lg:top-28 lg:self-start"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Receipt summary
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-40 justify-center rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
            onClick={() => void handleShareSummary()}
            disabled={isSharingSummary}
          >
            {isSharingSummary ? (
              <LoaderCircle className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Share2 className="h-4 w-4 shrink-0" />
            )}
            <span className="whitespace-nowrap text-center">
              {isSharingSummary ? "Exporting" : "Share as image"}
            </span>
          </Button>
        </div>
      </div>
      <div className="mt-5">
        <SummaryRow
          label="Items subtotal"
          value={formatCurrency(subtotalCents)}
        />
        <SummaryRow
          label="Tax"
          value={formatCurrency(parseMoneyInputToCents(editorState.tax))}
        />
        <SummaryRow
          label="Tip"
          value={formatCurrency(parseMoneyInputToCents(editorState.tip))}
        />
        <SummaryRow
          label="Fees"
          value={formatCurrency(parseMoneyInputToCents(editorState.fee))}
        />
        <SummaryRow
          label="Discount"
          value={formatCurrency(parseMoneyInputToCents(editorState.discount))}
        />
        <SummaryRow label="Total" value={formatCurrency(totalCents)} emphasis />
      </div>

      <div className="pointer-events-none hidden h-20 lg:block">
        <div
          className="sticky z-10 flex justify-center px-2 pt-4"
          style={{ bottom: actionBarHeight + footerOffset + 16 }}
        >
          <div className="absolute inset-x-0 inset-y-0 rounded-[1rem] bg-[linear-gradient(180deg,rgba(251,251,248,0),rgba(251,251,248,0.84)_42%,#fbfbf8_100%)]" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-auto relative h-11 rounded-[0.8rem] border border-[color-mix(in_oklab,var(--line)_85%,white)] bg-[color-mix(in_oklab,var(--panel)_88%,white)] px-5 text-sm font-medium text-[var(--foreground)] shadow-[0_8px_18px_rgba(14,18,24,0.05)] backdrop-blur-md hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)]"
            onClick={scrollToFullSummary}
          >
            See full summary
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, 2, 0], opacity: [0.75, 1, 0.75] }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </Button>
        </div>
      </div>

      <div className="workspace-line mt-8 pt-6">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          Group share preview
        </p>
        <div className="mt-4 space-y-3">
          {groups.map((group) => {
            const share = groupSharesById.get(group.id);
            const itemDetails =
              groupItemShareDetailsByGroupId.get(group.id) ?? [];

            if (!share) {
              return null;
            }

            return (
              <div
                key={group.id}
                className={cn(
                  "rounded-[0.85rem] border bg-[var(--surface)] px-4 py-3",
                  group.isPaid
                    ? "border-[color-mix(in_oklab,var(--accent)_45%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_12%,white)]"
                    : "border-[color-mix(in_oklab,var(--unpaid)_36%,var(--line))] bg-[color-mix(in_oklab,var(--unpaid-soft)_46%,white)]",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {group.displayName || "Untitled group"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {group.isPaid ? "Marked paid" : "Not paid yet"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xl font-medium text-[var(--foreground)]">
                      {formatCurrency(share.amountCents)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className={cn(
                        "rounded-[0.7rem] border px-3",
                        group.isPaid
                          ? "border-[color-mix(in_oklab,var(--accent)_40%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-[var(--accent-foreground)] hover:border-[color-mix(in_oklab,var(--unpaid)_36%,var(--line))] hover:bg-[color-mix(in_oklab,var(--unpaid-soft)_72%,white)] hover:text-[var(--unpaid-foreground)]"
                          : "border-[color-mix(in_oklab,var(--unpaid)_40%,var(--line))] bg-[color-mix(in_oklab,var(--unpaid-soft)_64%,white)] text-[var(--unpaid-foreground)] hover:border-[color-mix(in_oklab,var(--accent)_42%,var(--line))] hover:bg-[color-mix(in_oklab,var(--accent)_18%,white)] hover:text-[var(--accent-foreground)]",
                      )}
                      onClick={() => toggleGroupPaid(group.id)}
                    >
                      {group.isPaid ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 group-hover/button:hidden" />
                          <CircleDashed className="hidden h-3.5 w-3.5 group-hover/button:inline" />
                        </>
                      ) : (
                        <>
                          <CircleDashed className="h-3.5 w-3.5 group-hover/button:hidden" />
                          <CheckCircle2 className="hidden h-3.5 w-3.5 group-hover/button:inline" />
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
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                  <span>Items</span>
                  <span className="text-right text-[var(--foreground)]">
                    {formatCurrency(share.itemSubtotalCents)}
                  </span>
                  <span>Tax</span>
                  <span className="text-right text-[var(--foreground)]">
                    {formatCurrency(share.taxShareCents)}
                  </span>
                  <span>Tip</span>
                  <span className="text-right text-[var(--foreground)]">
                    {formatCurrency(share.tipShareCents)}
                  </span>
                  <span>Fees</span>
                  <span className="text-right text-[var(--foreground)]">
                    {formatCurrency(share.feeShareCents)}
                  </span>
                  <span>Discount</span>
                  <span className="text-right text-[var(--foreground)]">
                    {formatCurrency(share.discountShareCents)}
                  </span>
                </div>
                <div className="workspace-line mt-4 pt-4">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Items to pay
                  </p>
                  {itemDetails.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {itemDetails.map((detail) => (
                        <div
                          key={`${group.id}-${detail.itemId}`}
                          className="rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--foreground)]">
                                {detail.description}
                              </p>
                              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                {detail.ratioLabel} share of{" "}
                                {formatCurrency(detail.lineSubtotalCents)}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {formatCurrency(detail.shareCents)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      No assigned items yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
          Receipt-level adjustments are distributed proportionally to each
          group&apos;s item subtotal.
        </p>
      </div>
    </motion.aside>
  );
}
