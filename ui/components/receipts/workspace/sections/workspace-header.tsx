"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { formatReceiptDate } from "@/lib/receipt-editor";
import { cn } from "@/lib/utils";

import {
  REQUIRED_HIGHLIGHT,
  requiredHighlightSoftStyle,
} from "../lib/constants";

export function WorkspaceHeader({
  heading,
  workspaceDescription,
  receiptOccurredAt,
  groupCount,
  itemCount,
  canSave,
}: {
  heading: string;
  workspaceDescription: string;
  receiptOccurredAt: string;
  groupCount: number;
  itemCount: number;
  canSave: boolean;
}) {
  return (
    <div className="workspace-panel overflow-hidden rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8">
      <h1 className="mt-4 max-w-4xl text-4xl leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-6xl">
        {heading}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
        {workspaceDescription}
      </p>
      <div
        className={cn(
          "mt-6 inline-flex max-w-2xl items-start gap-3 rounded-[1.1rem] border px-4 py-3 text-sm font-medium",
          canSave
            ? "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]"
            : "text-[var(--foreground)]",
        )}
        style={canSave ? undefined : requiredHighlightSoftStyle}
      >
        {canSave ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: REQUIRED_HIGHLIGHT }}
          />
        )}
        <span>
          {canSave
            ? "Required fields are filled."
            : "Complete required fields to save."}
        </span>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <div className="metric-chip rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]">
          {formatReceiptDate(receiptOccurredAt || new Date().toISOString())}
        </div>
        <div className="metric-chip rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]">
          {groupCount} group{groupCount === 1 ? "" : "s"}
        </div>
        <div className="metric-chip rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
