"use client";

import type { RefObject } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Save,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/receipt-editor";
import { cn } from "@/lib/utils";

import type {
  ReceiptWorkspaceSavePlan,
  ReceiptWorkspaceValidation,
} from "./use-receipt-workspace";

export function ReceiptActionBar({
  actionBarRef,
  actionBarActionsRef,
  footerOffset,
  isCompactActionBar,
  isMinimizedMobileActionBar,
  isMobileViewport,
  isDeleteConfirming,
  isDeleting,
  isSaving,
  isSharingSummary,
  isDirty,
  hasSavedReceipt,
  warningMessage,
  shareMessage,
  saveMessage,
  totalCents,
  validation,
  savePlan,
  actionBarActionsHeight,
  toggleMobileActionBarMinimized,
  setIsDeleteConfirming,
  scrollToSummary,
  handleShareSummary,
  handleDelete,
  handleSave,
}: {
  actionBarRef: RefObject<HTMLDivElement | null>;
  actionBarActionsRef: RefObject<HTMLDivElement | null>;
  footerOffset: number;
  isCompactActionBar: boolean;
  isMinimizedMobileActionBar: boolean;
  isMobileViewport: boolean;
  isDeleteConfirming: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isSharingSummary: boolean;
  isDirty: boolean;
  hasSavedReceipt: boolean;
  warningMessage: string | null;
  shareMessage: string | null;
  saveMessage: string | null;
  totalCents: number;
  validation: ReceiptWorkspaceValidation;
  savePlan: ReceiptWorkspaceSavePlan;
  actionBarActionsHeight: number;
  toggleMobileActionBarMinimized: () => void;
  setIsDeleteConfirming: (value: boolean) => void;
  scrollToSummary: () => void;
  handleShareSummary: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleSave: () => Promise<void>;
}) {
  return (
    <motion.div
      ref={actionBarRef}
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.35 }}
      className="fixed inset-x-0 bottom-0 z-20 px-4 py-4 sm:px-6 lg:px-8"
    >
      <div
        style={{
          transform: `translate3d(0, -${footerOffset}px, 0)`,
          transition: "transform 140ms ease-out",
          willChange: "transform",
        }}
      >
        <div
          className={cn(
            "page-shell topbar-surface flex max-w-7xl rounded-[1.4rem] px-4 md:flex-row md:items-center md:justify-between",
            isCompactActionBar ? "flex-col gap-2 py-3" : "flex-col gap-3 py-4",
          )}
        >
          <div
            className={cn(
              isCompactActionBar && "flex items-center justify-between gap-3",
            )}
          >
            <p className="text-sm font-medium text-[var(--foreground)]">
              {shareMessage ??
                saveMessage ??
                (isDirty
                  ? "Unsaved changes in this receipt"
                  : "Everything saved for now")}
            </p>
            {isCompactActionBar ? (
              <div className="flex items-center gap-2">
                <span className="flex min-w-26 flex-col items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-center">
                  <span className="text-[0.58rem] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                    Total
                  </span>
                  <span className="text-sm leading-none font-medium text-[var(--foreground)]">
                    {formatCurrency(totalCents)}
                  </span>
                </span>
                {isMobileViewport ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
                    onClick={toggleMobileActionBarMinimized}
                  >
                    {isMinimizedMobileActionBar ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show actions
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Minimize
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            ) : null}
            <p
              className={cn(
                "mt-1 text-sm text-[var(--muted-foreground)]",
                isCompactActionBar && "hidden",
              )}
            >
              {isDeleteConfirming
                ? "Delete will permanently remove this saved receipt, its line items, and its split groups."
                : validation.canSave
                  ? `Save ${savePlan.saveParticipantCount} groups, ${savePlan.saveItemCount} items, ${savePlan.setAllocationCount} allocations.`
                  : (validation.issues[0] ??
                    "Finish required fields to save.")}
            </p>
          </div>

          {isMobileViewport ? (
            <motion.div
              initial={false}
              animate={
                isMinimizedMobileActionBar
                  ? { maxHeight: 0, opacity: 0, y: 8 }
                  : { maxHeight: actionBarActionsHeight, opacity: 1, y: 0 }
              }
              transition={{
                duration: isMinimizedMobileActionBar ? 0.22 : 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "w-full overflow-hidden",
                isMinimizedMobileActionBar && "pointer-events-none",
              )}
            >
              <motion.div
                ref={actionBarActionsRef}
                initial={false}
                animate={
                  isMinimizedMobileActionBar
                    ? { opacity: 0, scaleY: 0.96, y: -6 }
                    : { opacity: 1, scaleY: 1, y: 0 }
                }
                transition={{
                  duration: isMinimizedMobileActionBar ? 0.18 : 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "flex origin-top items-center gap-3",
                  isCompactActionBar ? "w-full flex-wrap" : "flex-wrap",
                )}
              >
                <span
                  className={cn(
                    "rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]",
                    isCompactActionBar && "hidden",
                  )}
                >
                  Total {formatCurrency(totalCents)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] md:hidden",
                    isCompactActionBar &&
                      "min-w-[calc(50%-0.375rem)] flex-1 justify-center",
                  )}
                  onClick={scrollToSummary}
                >
                  Jump to summary
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-10 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] md:hidden",
                    isCompactActionBar &&
                      "min-w-[calc(50%-0.375rem)] flex-1 justify-center",
                  )}
                  onClick={() => void handleShareSummary()}
                  disabled={isSharingSummary}
                >
                  {isSharingSummary ? (
                    <LoaderCircle className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <Share2 className="h-4 w-4 shrink-0" />
                  )}
                  <span className="whitespace-nowrap text-center">
                    {isSharingSummary ? "Exporting" : "Share receipt"}
                  </span>
                </Button>
                {hasSavedReceipt ? (
                  <>
                    {isDeleteConfirming ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-11 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]",
                          isCompactActionBar &&
                            "min-w-[calc(50%-0.375rem)] flex-1 justify-center",
                        )}
                        onClick={() => setIsDeleteConfirming(false)}
                        disabled={isDeleting}
                      >
                        Keep receipt
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isSaving || isDeleting}
                      className={cn(
                        "h-11 rounded-full bg-[#ff0000] px-5 text-sm font-medium text-[#fff8f6] transition-opacity hover:bg-[#cc0000] hover:opacity-90 active:bg-[#cc0000] disabled:opacity-50",
                        isCompactActionBar &&
                          "min-w-[calc(50%-0.375rem)] flex-1 justify-center px-4",
                      )}
                    >
                      {isDeleting ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Deleting
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          {isDeleteConfirming
                            ? "Confirm delete"
                            : "Delete receipt"}
                        </>
                      )}
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={
                    !validation.canSave || !isDirty || isSaving || isDeleting
                  }
                  className={cn(
                    "h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]",
                    isCompactActionBar &&
                      "min-w-[calc(50%-0.375rem)] flex-1 justify-center px-4",
                  )}
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isCompactActionBar ? "Save" : "Save receipt"}
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-3",
                isCompactActionBar ? "w-full flex-wrap" : "flex-wrap",
              )}
            >
              <span
                className={cn(
                  "rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]",
                  isCompactActionBar && "hidden",
                )}
              >
                Total {formatCurrency(totalCents)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] md:hidden",
                  isCompactActionBar &&
                    "min-w-[calc(50%-0.375rem)] flex-1 justify-center",
                )}
                onClick={scrollToSummary}
              >
                Jump to summary
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-10 min-w-40 justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] md:hidden",
                  isCompactActionBar &&
                    "min-w-[calc(50%-0.375rem)] flex-1 justify-center",
                )}
                onClick={() => void handleShareSummary()}
                disabled={isSharingSummary}
              >
                {isSharingSummary ? (
                  <LoaderCircle className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <Share2 className="h-4 w-4 shrink-0" />
                )}
                <span className="whitespace-nowrap text-center">
                  {isSharingSummary ? "Exporting" : "Share receipt"}
                </span>
              </Button>
              {warningMessage && !isCompactActionBar ? (
                <span className="rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
                  Review latest version before saving again
                </span>
              ) : null}
              {hasSavedReceipt ? (
                <>
                  {isDeleteConfirming ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-11 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]",
                        isCompactActionBar &&
                          "min-w-[calc(50%-0.375rem)] flex-1 justify-center",
                      )}
                      onClick={() => setIsDeleteConfirming(false)}
                      disabled={isDeleting}
                    >
                      Keep receipt
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isSaving || isDeleting}
                    className={cn(
                      "h-11 rounded-full bg-[#ff0000] px-5 text-sm font-medium text-[#fff8f6] transition-opacity hover:bg-[#cc0000] hover:opacity-90 active:bg-[#cc0000] disabled:opacity-50",
                      isCompactActionBar &&
                        "min-w-[calc(50%-0.375rem)] flex-1 justify-center px-4",
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Deleting
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {isDeleteConfirming
                          ? "Confirm delete"
                          : "Delete receipt"}
                      </>
                    )}
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={
                  !validation.canSave || !isDirty || isSaving || isDeleting
                }
                className={cn(
                  "h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]",
                  isCompactActionBar &&
                    "min-w-[calc(50%-0.375rem)] flex-1 justify-center px-4",
                )}
              >
                {isSaving ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isCompactActionBar ? "Save" : "Save receipt"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
