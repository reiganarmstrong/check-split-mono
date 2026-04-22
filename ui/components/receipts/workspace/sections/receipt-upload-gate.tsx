"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { ArrowRight, Camera, LoaderCircle, ScanSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

import { SectionShell } from "../lib/shared";

export function ReceiptUploadGate({
  autoOpenOnMount,
  isParsingReceipt,
  beginManualEntry,
  handleReceiptUpload,
}: {
  autoOpenOnMount: boolean;
  isParsingReceipt: boolean;
  beginManualEntry: () => void;
  handleReceiptUpload: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasAttemptedAutoOpenRef = useRef(false);

  useEffect(() => {
    if (!autoOpenOnMount || hasAttemptedAutoOpenRef.current) {
      return;
    }

    hasAttemptedAutoOpenRef.current = true;
    inputRef.current?.click();
  }, [autoOpenOnMount]);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    await handleReceiptUpload(file);
  }

  return (
    <SectionShell
      title="Start from a receipt image"
      eyebrow="Getting started"
      icon={ScanSearch}
      tone="primary"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_auto_minmax(19rem,1fr)] lg:items-center">
        <div className="max-w-xl">
          <p className="max-w-lg text-base leading-7 text-[var(--muted-foreground)]">
            Drop in receipt photo, review parsed draft, then finish split by
            exception instead of starting from blank fields.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={openPicker}
              disabled={isParsingReceipt}
              className="h-12 cursor-pointer rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
            >
              {isParsingReceipt ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {isParsingReceipt ? "Parsing receipt" : "Upload receipt"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={beginManualEntry}
              disabled={isParsingReceipt}
              className="h-12 cursor-pointer rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)]"
            >
              Skip to manual entry
            </Button>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="hidden lg:flex min-h-52 flex-col items-center justify-center"
        >
          <div className="h-10 w-px bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--primary)_30%,var(--line)),transparent)]" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--primary)_20%,var(--line))] bg-[color-mix(in_oklab,var(--primary)_10%,white)] text-[var(--primary)] shadow-[0_10px_24px_rgba(35,55,215,0.12)]">
            <ArrowRight className="h-4 w-4" />
          </div>
          <div className="h-10 w-px bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--primary)_30%,var(--line)),transparent)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="relative overflow-hidden rounded-[1.7rem] border border-[color-mix(in_oklab,var(--primary)_16%,var(--line))] bg-[color-mix(in_oklab,var(--primary)_5%,white)] p-5 shadow-[0_18px_38px_rgba(14,18,24,0.05)] sm:p-6"
        >
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Upload flow
          </p>
          <div className="relative mt-4 space-y-3">
            <motion.div
              whileHover={{ x: 3 }}
              transition={{ duration: 0.18 }}
              className="relative flex gap-4 rounded-[1.15rem] border border-[color-mix(in_oklab,var(--primary)_16%,var(--line))] bg-white/88 px-4 py-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--primary)_20%,var(--line))] bg-[color-mix(in_oklab,var(--primary)_12%,white)] text-sm font-semibold text-[var(--primary)]">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Choose receipt image
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                  Photo, screenshot, or export. If browser opens it, upload
                  works.
                </p>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ x: 3 }}
              transition={{ duration: 0.18 }}
              className="relative flex gap-4 rounded-[1.15rem] border border-[color-mix(in_oklab,var(--primary)_16%,var(--line))] bg-white/88 px-4 py-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--primary)_20%,var(--line))] bg-[color-mix(in_oklab,var(--primary)_12%,white)] text-sm font-semibold text-[var(--primary)]">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Confirm parsed draft
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                  Check totals, line items, and date. Edit only what needs
                  cleanup.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleInputChange(event)}
      />
    </SectionShell>
  );
}
