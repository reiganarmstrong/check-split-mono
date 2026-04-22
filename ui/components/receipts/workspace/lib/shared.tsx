"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { requiredHighlightFillStyle } from "./constants";

export function SectionShell({
  children,
  title,
  eyebrow,
  icon: Icon,
  tone = "default",
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "secondary" | "accent";
}) {
  const iconCircleClassName =
    tone === "primary"
      ? "border-[var(--line)] bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]"
      : tone === "secondary"
        ? "border-[var(--line)] bg-[color-mix(in_oklab,var(--secondary)_22%,transparent)]"
        : tone === "accent"
          ? "border-[var(--line)] bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
          : "border-[var(--line)] bg-[var(--surface)]";

  return (
    <section className="workspace-panel rounded-[1.75rem] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className={cn("rounded-[1rem] border p-3", iconCircleClassName)}>
            <Icon className="h-4 w-4 text-[var(--foreground)]" />
          </div>
        ) : null}
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)] sm:text-4xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="workspace-line mt-5 pt-5">{children}</div>
    </section>
  );
}

export function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span
        className={
          emphasis
            ? "text-xl font-medium text-[var(--foreground)]"
            : "text-sm font-medium text-[var(--foreground)]"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function GroupChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full p-0 transition-all duration-150 ease-out",
        active ? "bg-[var(--secondary)]" : "bg-transparent",
      )}
    >
      <span
        className={cn(
          "block rounded-full border border-[var(--foreground)] px-3 py-2 text-sm font-medium transition-all duration-150 ease-out",
          active
            ? "-translate-x-0.5 -translate-y-0.5 bg-[var(--foreground)] text-[var(--background)] hover:-translate-x-px hover:-translate-y-px"
            : "bg-[var(--panel-strong)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function EditorNotice({
  tone,
  message,
}: {
  tone: "error" | "success" | "warning";
  message: string;
}) {
  const className =
    tone === "success"
      ? "border-[var(--line)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--foreground)]"
      : tone === "warning"
        ? "border-[color-mix(in_oklab,var(--unpaid)_32%,var(--line))] bg-[color-mix(in_oklab,var(--unpaid-soft)_72%,white)] text-[var(--unpaid-foreground)]"
        : "border-destructive/25 bg-destructive/10 text-destructive";

  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-3 text-sm font-medium ${className}`}
    >
      {message}
    </div>
  );
}

export function FieldLabel({
  label,
  showRequired = false,
}: {
  label: string;
  showRequired?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      {showRequired ? (
        <span
          className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.18em]"
          style={requiredHighlightFillStyle}
        >
          Required
        </span>
      ) : null}
    </span>
  );
}
