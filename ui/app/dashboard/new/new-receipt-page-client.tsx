"use client";

import { useSearchParams } from "next/navigation";

import { ReceiptWorkspace } from "@/components/receipts/receipt-workspace";

export function NewReceiptPageClient() {
  const searchParams = useSearchParams();

  return (
    <ReceiptWorkspace autoOpenUploadGate={searchParams.get("prompt") === "upload"} />
  );
}
