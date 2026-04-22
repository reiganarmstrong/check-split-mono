"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import {
  buildReceiptParseMessage,
  mapReceiptParseResponseToEditorState,
  parseReceiptImage,
  ReceiptIngestionError,
} from "@/lib/receipt-ingestion";
import {
  ReceiptApiError,
  deleteReceipt,
  getReceipt,
  saveReceiptEditorState,
} from "@/lib/receipt-api";
import { mapReceiptToEditorState } from "@/lib/receipt-editor";
import { buildReceiptSummaryShareData, renderReceiptSummaryJpegFile } from "@/lib/receipt-summary-share";
import type { Receipt, ReceiptEditorState } from "@/lib/receipt-types";

import { logWorkspaceError } from "../lib/workspace-helpers";

export function useReceiptWorkspaceActions({
  receiptId,
  editorState,
  sourceReceipt,
  hasStartedDraft,
  isDirty,
  canSave,
  summaryShareData,
  router,
  setEditorState,
  setSourceReceipt,
  setHasStartedDraft,
  setSaveMessage,
  setShareMessage,
  setParseMessage,
  setParseIssues,
  setWarningMessage,
}: {
  receiptId?: string;
  editorState: ReceiptEditorState;
  sourceReceipt: Receipt | null;
  hasStartedDraft: boolean;
  isDirty: boolean;
  canSave: boolean;
  summaryShareData: ReturnType<typeof buildReceiptSummaryShareData>;
  router: { push: (href: string) => void; replace: (href: string) => void };
  setEditorState: React.Dispatch<React.SetStateAction<ReceiptEditorState>>;
  setSourceReceipt: React.Dispatch<React.SetStateAction<Receipt | null>>;
  setHasStartedDraft: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setShareMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setParseMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setParseIssues: React.Dispatch<React.SetStateAction<string[]>>;
  setWarningMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const shareMessageTimeoutRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isSharingSummary, setIsSharingSummary] = useState(false);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);

  useEffect(() => {
    setIsDeleteConfirming(false);
  }, [sourceReceipt?.receiptId]);

  useEffect(
    () => () => {
      if (shareMessageTimeoutRef.current !== null) {
        window.clearTimeout(shareMessageTimeoutRef.current);
      }
    },
    [],
  );

  function setTemporaryShareMessage(message: string) {
    setShareMessage(message);

    if (shareMessageTimeoutRef.current !== null) {
      window.clearTimeout(shareMessageTimeoutRef.current);
    }

    shareMessageTimeoutRef.current = window.setTimeout(() => {
      setShareMessage(null);
      shareMessageTimeoutRef.current = null;
    }, 4000);
  }

  function downloadFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = file.name;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  async function refreshReceiptAfterConflict(targetReceiptId: string) {
    try {
      const latestReceipt = await getReceipt(targetReceiptId);

      if (!latestReceipt) {
        return;
      }

      setSourceReceipt(latestReceipt);
      setEditorState(mapReceiptToEditorState(latestReceipt));
      setWarningMessage(
        "This receipt changed while you were editing. The latest saved version has been reloaded so you can review and try again.",
      );
    } catch (error) {
      logWorkspaceError(
        "refresh after conflict",
        error,
        "Unable to reload the latest receipt after a version conflict.",
      );
      setWarningMessage(
        "This receipt changed while you were editing. Reload the page and try again.",
      );
    }
  }

  async function handleSave() {
    if (isSaving || isDeleting || isParsingReceipt || !canSave) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setWarningMessage(null);

    try {
      const savedReceipt = await saveReceiptEditorState(
        editorState,
        sourceReceipt,
      );
      setSourceReceipt(savedReceipt);
      setEditorState(mapReceiptToEditorState(savedReceipt));
      setSaveMessage("Receipt saved to your account.");
      window.dispatchEvent(
        new CustomEvent("receipt-title-updated", {
          detail: {
            receiptId: savedReceipt.receiptId,
            title: savedReceipt.merchantName.trim() || "Receipt draft",
          },
        }),
      );

      if (!receiptId) {
        startTransition(() => {
          router.replace(
            `/dashboard/receipt?receiptId=${encodeURIComponent(savedReceipt.receiptId)}`,
          );
        });
      }
    } catch (error) {
      if (error instanceof ReceiptApiError) {
        if (
          error.code === "conflict" &&
          (receiptId ?? editorState.receiptId ?? sourceReceipt?.receiptId)
        ) {
          await refreshReceiptAfterConflict(
            receiptId ?? editorState.receiptId ?? sourceReceipt?.receiptId ?? "",
          );
        } else {
          logWorkspaceError(
            "save receipt",
            error,
            "Unable to save your receipt right now.",
          );
        }
      } else {
        logWorkspaceError(
          "save receipt",
          error,
          "Unable to save your receipt right now.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  function requestReceiptUpload() {
    if (isSaving || isDeleting || isParsingReceipt) {
      return false;
    }

    if (sourceReceipt?.receiptId) {
      startTransition(() => {
        router.push("/dashboard/new?prompt=upload");
      });
      return false;
    }

    if (hasStartedDraft && isDirty) {
      const shouldReplaceDraft = window.confirm(
        "Replace the current draft with a parsed receipt image? Unsaved manual edits will be lost.",
      );

      if (!shouldReplaceDraft) {
        return false;
      }
    }

    return true;
  }

  async function handleReceiptUpload(file: File) {
    if (isSaving || isDeleting || isParsingReceipt) {
      return;
    }

    setIsParsingReceipt(true);
    setSaveMessage(null);
    setShareMessage(null);
    setParseMessage(null);
    setParseIssues([]);
    setWarningMessage(null);

    try {
      const parsedReceipt = await parseReceiptImage(file);

      setSourceReceipt(null);
      setEditorState(mapReceiptParseResponseToEditorState(parsedReceipt));
      setHasStartedDraft(true);
      setParseMessage(buildReceiptParseMessage(parsedReceipt));
      setParseIssues(parsedReceipt.issues);

      if (!receiptId) {
        startTransition(() => {
          router.replace("/dashboard/new");
        });
      }
    } catch (error) {
      if (error instanceof ReceiptIngestionError) {
        setWarningMessage(error.message);
      } else {
        logWorkspaceError(
          "parse receipt",
          error,
          "Unable to parse that receipt image right now.",
        );
        setWarningMessage("Unable to parse that receipt image right now.");
      }
    } finally {
      setIsParsingReceipt(false);
    }
  }

  async function handleDelete() {
    if (!sourceReceipt || isSaving || isDeleting || isParsingReceipt) {
      return;
    }

    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true);
      return;
    }

    setIsDeleting(true);
    setIsDeleteConfirming(false);
    setSaveMessage(null);
    setWarningMessage(null);

    try {
      await deleteReceipt(sourceReceipt);

      startTransition(() => {
        router.replace("/dashboard");
      });
    } catch (error) {
      if (error instanceof ReceiptApiError) {
        if (error.code === "conflict") {
          await refreshReceiptAfterConflict(sourceReceipt.receiptId);
          logWorkspaceError(
            "delete receipt",
            error,
            "This receipt changed before it could be deleted. Review the latest version and try again.",
          );
        } else {
          logWorkspaceError(
            "delete receipt",
            error,
            "Unable to delete this receipt right now.",
          );
        }
      } else {
        logWorkspaceError(
          "delete receipt",
          error,
          "Unable to delete this receipt right now.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleShareSummary() {
    if (isSharingSummary) {
      return;
    }

    setIsSharingSummary(true);
    setWarningMessage(null);

    try {
      const summaryImageFile = await renderReceiptSummaryJpegFile(summaryShareData);
      const isSecureShareContext =
        typeof window !== "undefined" && window.isSecureContext;
      const supportsNativeShare = typeof navigator.share === "function";
      const canShareFiles =
        typeof navigator.canShare !== "function" ||
        navigator.canShare({ files: [summaryImageFile] });

      if (!isSecureShareContext && !supportsNativeShare) {
        setWarningMessage(
          "iPhone share sheet for receipt images requires HTTPS. Open this app over HTTPS to share instead of downloading.",
        );
        downloadFile(summaryImageFile);
        setTemporaryShareMessage("Summary image downloaded.");
        return;
      }

      if (supportsNativeShare && canShareFiles) {
        try {
          await navigator.share({
            files: [summaryImageFile],
            text: "Receipt summary image",
            title: `${summaryShareData.merchantName} summary`,
          });
          setTemporaryShareMessage("Summary image shared.");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          if (
            error instanceof TypeError ||
            (error instanceof DOMException &&
              (error.name === "TypeError" || error.name === "DataError"))
          ) {
            downloadFile(summaryImageFile);
            setTemporaryShareMessage("Summary image downloaded.");
            return;
          }

          throw error;
        }
      }

      downloadFile(summaryImageFile);
      setTemporaryShareMessage("Summary image downloaded.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      logWorkspaceError(
        "share receipt summary",
        error,
        "Unable to export the summary image.",
      );
      setWarningMessage(
        "Unable to export the summary image right now. Try again in a moment.",
      );
    } finally {
      setIsSharingSummary(false);
    }
  }

  return {
    isSaving,
    isDeleting,
    isDeleteConfirming,
    isSharingSummary,
    isParsingReceipt,
    setIsDeleteConfirming,
    requestReceiptUpload,
    handleReceiptUpload,
    handleSave,
    handleDelete,
    handleShareSummary,
  };
}
