"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, ScanLine } from "lucide-react";

import { cn } from "@/lib/utils";

const PARSE_PROGRESS_STEPS = [
  {
    label: "Preparing image",
    detail: "Converting and sizing the upload",
  },
  {
    label: "Reading receipt",
    detail: "Finding merchant, date, and line items",
  },
  {
    label: "Checking totals",
    detail: "Comparing subtotal, tax, tip, and fees",
  },
  {
    label: "Building draft",
    detail: "Setting up groups and editable fields",
  },
] as const;

export function ReceiptParseProgress({
  fileName,
}: {
  fileName: string | null;
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const progressPercent = useMemo(
    () =>
      Math.min(
        92,
        18 + activeStepIndex * 22 + (activeStepIndex === 0 ? 0 : 6),
      ),
    [activeStepIndex],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStepIndex((current) =>
        Math.min(current + 1, PARSE_PROGRESS_STEPS.length - 1),
      );
    }, 2300);

    return () => window.clearInterval(interval);
  }, []);

  const activeStep = PARSE_PROGRESS_STEPS[activeStepIndex];

  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="workspace-panel mx-auto flex min-h-[28rem] w-full max-w-3xl flex-col justify-between overflow-hidden rounded-[1rem] px-5 py-5 sm:px-7 sm:py-7"
    >
      <div>
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Parsing receipt
          </p>
          <h2 className="mt-2 text-3xl leading-none text-[var(--foreground)] sm:text-4xl">
            Reading the details
          </h2>
        </div>
      </div>

      <div className="workspace-line mt-6 grid flex-1 gap-6 pt-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(16rem,1fr)] lg:items-center">
        <div className="relative mx-auto flex h-80 w-full max-w-56 items-center justify-center overflow-hidden rounded-[0.85rem] border border-[var(--line)] bg-[var(--panel-strong)] px-5 py-6 shadow-[0_10px_24px_rgba(14,18,24,0.04)]">
          <div className="absolute inset-x-5 top-8 bottom-8 flex flex-col justify-between overflow-hidden">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-px bg-[var(--line)] opacity-60"
              />
            ))}
          </div>
          <div className="receipt-scan-line pointer-events-none absolute inset-x-4 top-8 h-1.5 transform-gpu rounded-full bg-[#050506]/80 shadow-[0_0_24px_rgba(5,5,6,0.2)]" />
          <ScanLine className="relative h-10 w-10 text-[var(--primary)]" />
        </div>

        <div>
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {fileName ?? "Receipt image"}
          </p>
          <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
            {activeStep?.detail ?? "Preparing receipt draft"}
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)]">
            <motion.div
              className="h-full rounded-full bg-[var(--primary)]"
              initial={{ width: "12%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="mt-6 space-y-3">
            {PARSE_PROGRESS_STEPS.map((step, index) => {
              const isComplete = index < activeStepIndex;
              const isActive = index === activeStepIndex;

              return (
                <motion.div
                  key={step.label}
                  initial={false}
                  animate={{
                    opacity: isActive || isComplete ? 1 : 0.52,
                    x: isActive ? 2 : 0,
                  }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.55rem] border text-xs font-semibold",
                      isComplete
                        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : isActive
                          ? "border-[var(--primary)] bg-white text-[var(--primary)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-foreground)]",
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
