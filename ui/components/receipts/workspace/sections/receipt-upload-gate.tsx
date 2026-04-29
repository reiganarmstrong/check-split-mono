"use client";

import { useEffect, useRef, type ChangeEvent } from "react";
import { Camera, LoaderCircle } from "lucide-react";

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
      title="Start from an image, or enter things manually"
      eyebrow="Getting started"
      // icon={ScanSearch}
      tone="primary"
      className="mx-auto flex aspect-square w-full max-w-120 flex-col sm:max-h-90"
      contentClassName="flex flex-1"
    >
      <div className="flex flex-1 flex-col justify-between gap-8">
        <div className="max-w-xl">
          <p className="max-w-lg text-base leading-7 text-[var(--muted-foreground)]">
            {
              "If you upload your receipt, we extract the contents so you don't have to :)"
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={openPicker}
            disabled={isParsingReceipt}
            className="h-12 cursor-pointer rounded-[0.8rem] bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] hover:opacity-90"
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
            className="h-12 cursor-pointer rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)]"
          >
            Skip to manual entry
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
        className="sr-only"
        onChange={(event) => void handleInputChange(event)}
      />
    </SectionShell>
  );
}
