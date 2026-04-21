"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { Camera, LoaderCircle, ScanSearch } from "lucide-react";

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
      tone="accent"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
        <div>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            Upload a photo and the new ingestion API will prefill the draft for
            review. JPEG and PNG are supported, and the browser will compress
            the upload under 4 MB before it is sent.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={openPicker}
              disabled={isParsingReceipt}
              className="h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
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
              className="h-12 rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              Skip to manual entry
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.3 }}
          className="rounded-[1.6rem] border border-[var(--line)] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(233,240,255,0.82))] p-5"
        >
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Upload flow
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.1rem] border border-[var(--line)] bg-white/80 px-4 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                1. Choose a receipt photo
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Snapshots, exports, and gallery images all work if the browser
                can open them.
              </p>
            </div>
            <div className="rounded-[1.1rem] border border-[var(--line)] bg-white/80 px-4 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                2. Review the parsed draft
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                Check totals, line items, and the receipt date before saving it
                into the account.
              </p>
            </div>
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
