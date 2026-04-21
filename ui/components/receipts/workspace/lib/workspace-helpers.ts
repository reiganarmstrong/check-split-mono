"use client";

import { ReceiptApiError } from "@/lib/receipt-api";

export function logWorkspaceError(
  context: string,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof ReceiptApiError) {
    console.error(`[ReceiptWorkspace] ${context}: ${error.message}`, error);
    return;
  }

  if (error instanceof Error) {
    console.error(`[ReceiptWorkspace] ${context}: ${error.message}`, error);
    return;
  }

  console.error(`[ReceiptWorkspace] ${context}: ${fallbackMessage}`, error);
}
