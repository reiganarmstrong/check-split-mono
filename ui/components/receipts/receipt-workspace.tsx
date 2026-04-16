"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowUpDown,
  Camera,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Plus,
  ReceiptText,
  Save,
  Share2,
  Trash2,
  Users,
} from "lucide-react";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ReceiptApiError,
  deleteReceipt,
  getReceipt,
  saveReceiptEditorState,
} from "@/lib/receipt-api";
import {
  buildReceiptSavePlan,
  createEditableGroup,
  createEditableItem,
  createEmptyReceiptEditorState,
  formatCurrency,
  formatReceiptDate,
  getGroupItemShareDetails,
  getGroupShareSummaries,
  getReceiptEditorValidation,
  getItemLineSubtotalCents,
  getReceiptSubtotalCents,
  getReceiptTotalCents,
  isMeaningfullyDirty,
  mapReceiptToEditorState,
  parseMoneyInputToCents,
} from "@/lib/receipt-editor";
import {
  buildReceiptSummaryShareData,
  renderReceiptSummaryJpegFile,
} from "@/lib/receipt-summary-share";
import type {
  EditableGroup,
  EditableItem,
  Receipt,
  ReceiptEditorState,
} from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

const REQUIRED_HIGHLIGHT = "#ff0000";
const REQUIRED_HIGHLIGHT_FOREGROUND = "#fff8f6";
const REQUIRED_HIGHLIGHT_SOFT = "#ffd6d6";

const requiredHighlightFillStyle = {
  backgroundColor: REQUIRED_HIGHLIGHT,
  color: REQUIRED_HIGHLIGHT_FOREGROUND,
};

const requiredHighlightSoftStyle = {
  backgroundColor: REQUIRED_HIGHLIGHT_SOFT,
};

function SectionShell({
  children,
  title,
  eyebrow,
  icon: Icon,
  tone = "default",
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
  icon?: typeof ReceiptText;
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

function SummaryRow({
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

function GroupChip({
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

function EditorNotice({
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
        ? "border-[var(--line)] bg-[color-mix(in_oklab,var(--accent)_22%,transparent)] text-[var(--foreground)]"
        : "border-destructive/25 bg-destructive/10 text-destructive";

  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-3 text-sm font-medium ${className}`}
    >
      {message}
    </div>
  );
}

function FieldLabel({
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

export function ReceiptWorkspace({ receiptId }: { receiptId?: string }) {
  const router = useRouter();
  const { status } = useAuth();
  const summaryRef = useRef<HTMLElement | null>(null);
  const actionBarRef = useRef<HTMLDivElement | null>(null);
  const actionBarActionsRef = useRef<HTMLDivElement | null>(null);
  const actionBarScrollYRef = useRef(0);
  const footerElementRef = useRef<HTMLElement | null>(null);
  const shareMessageTimeoutRef = useRef<number | null>(null);
  const [editorState, setEditorState] = useState<ReceiptEditorState>(() =>
    createEmptyReceiptEditorState(),
  );
  const [sourceReceipt, setSourceReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(receiptId));
  const [isMissing, setIsMissing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isSharingSummary, setIsSharingSummary] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [footerOffset, setFooterOffset] = useState(0);
  const [actionBarHeight, setActionBarHeight] = useState(128);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileActionBarCompact, setIsMobileActionBarCompact] =
    useState(false);
  const [isMobileActionBarMinimized, setIsMobileActionBarMinimized] =
    useState(false);
  const [actionBarActionsHeight, setActionBarActionsHeight] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const currentReceiptId = receiptId;

    if (!currentReceiptId) {
      setSourceReceipt(null);
      setEditorState(createEmptyReceiptEditorState());
      setIsLoading(false);
      setIsMissing(false);
      return;
    }

    const targetReceiptId: string = currentReceiptId;

    let isActive = true;

    async function loadReceipt() {
      setIsLoading(true);
      setWarningMessage(null);

      try {
        const receipt = await getReceipt(targetReceiptId);

        if (!isActive) {
          return;
        }

        if (!receipt) {
          setIsMissing(true);
          setSourceReceipt(null);
          return;
        }

        setIsMissing(false);
        setSourceReceipt(receipt);
        setEditorState(mapReceiptToEditorState(receipt));
      } catch (error) {
        if (!isActive) {
          return;
        }

        logWorkspaceError(
          "load receipt",
          error,
          "Unable to load this receipt.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReceipt();

    return () => {
      isActive = false;
    };
  }, [receiptId, router, status]);

  useEffect(() => {
    let footerIntersectionObserver: IntersectionObserver | null = null;
    let footerResizeObserver: ResizeObserver | null = null;

    function resolveFooterElement() {
      const cachedFooter = footerElementRef.current;
      const footer =
        cachedFooter && cachedFooter.isConnected
          ? cachedFooter
          : document.querySelector("footer");

      footerElementRef.current = footer;

      return footer;
    }

    function updateFooterOffset(nextOffset: number) {
      const normalizedOffset =
        nextOffset <= 2 ? 0 : Math.round(nextOffset / 6) * 6;

      setFooterOffset((currentOffset) =>
        currentOffset === normalizedOffset ? currentOffset : normalizedOffset,
      );
    }

    function measureFooterOffset() {
      const footer = resolveFooterElement();

      if (!footer) {
        updateFooterOffset(0);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      updateFooterOffset(Math.max(0, window.innerHeight - footerRect.top));
    }

    const footer = resolveFooterElement();

    if (!footer) {
      updateFooterOffset(0);
      return;
    }

    const thresholds = Array.from({ length: 21 }, (_, index) => index / 20);

    footerIntersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        updateFooterOffset(
          entry.isIntersecting ? entry.intersectionRect.height : 0,
        );
      },
      {
        threshold: thresholds,
      },
    );
    footerIntersectionObserver.observe(footer);

    footerResizeObserver = new ResizeObserver(measureFooterOffset);
    footerResizeObserver.observe(footer);
    window.addEventListener("resize", measureFooterOffset);
    measureFooterOffset();

    return () => {
      footerIntersectionObserver?.disconnect();
      footerResizeObserver?.disconnect();
      window.removeEventListener("resize", measureFooterOffset);
    };
  }, []);

  useEffect(() => {
    const actionBarElement = actionBarRef.current;

    if (actionBarElement === null) {
      return;
    }

    const measuredActionBarElement = actionBarElement;

    function updateActionBarHeight() {
      setActionBarHeight(
        measuredActionBarElement.getBoundingClientRect().height,
      );
    }

    updateActionBarHeight();

    const observer = new ResizeObserver(updateActionBarHeight);
    observer.observe(measuredActionBarElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const actionBarActionsElement = actionBarActionsRef.current;

    if (actionBarActionsElement === null) {
      return;
    }

    const measuredActionBarActionsElement = actionBarActionsElement;

    function updateActionBarActionsHeight() {
      setActionBarActionsHeight(measuredActionBarActionsElement.scrollHeight);
    }

    updateActionBarActionsHeight();

    const observer = new ResizeObserver(updateActionBarActionsHeight);
    observer.observe(measuredActionBarActionsElement);

    return () => {
      observer.disconnect();
    };
  }, [
    isMobileViewport,
    isMobileActionBarCompact,
    isDeleteConfirming,
    isSharingSummary,
    isSaving,
    sourceReceipt?.receiptId,
  ]);

  useEffect(() => {
    function updateCompactState() {
      const nextIsMobileViewport = window.innerWidth < 768;
      const currentScrollY = window.scrollY;
      const previousScrollY = actionBarScrollYRef.current;

      setIsMobileViewport(nextIsMobileViewport);

      if (!nextIsMobileViewport || currentScrollY < 96) {
        setIsMobileActionBarCompact(false);
      } else if (currentScrollY > previousScrollY + 8) {
        setIsMobileActionBarCompact(true);
      } else if (currentScrollY < previousScrollY - 8) {
        setIsMobileActionBarCompact(false);
      }

      actionBarScrollYRef.current = currentScrollY;
    }

    updateCompactState();

    window.addEventListener("scroll", updateCompactState, { passive: true });
    window.addEventListener("resize", updateCompactState);

    return () => {
      window.removeEventListener("scroll", updateCompactState);
      window.removeEventListener("resize", updateCompactState);
    };
  }, []);

  useEffect(() => {
    setIsDeleteConfirming(false);
  }, [sourceReceipt?.receiptId]);

  useEffect(() => {
    if (!isMobileViewport) {
      setIsMobileActionBarMinimized(false);
    }
  }, [isMobileViewport]);

  useEffect(
    () => () => {
      if (shareMessageTimeoutRef.current !== null) {
        window.clearTimeout(shareMessageTimeoutRef.current);
      }
    },
    [],
  );

  const validation = getReceiptEditorValidation(editorState);
  const savePlan = buildReceiptSavePlan(editorState, sourceReceipt);
  const isDirty = isMeaningfullyDirty(editorState, sourceReceipt);
  const subtotalCents = getReceiptSubtotalCents(editorState);
  const totalCents = getReceiptTotalCents(editorState);
  const groupShares = getGroupShareSummaries(editorState);
  const groupItemShareDetails = getGroupItemShareDetails(editorState);
  const groupSharesById = new Map(
    groupShares.map((share) => [share.groupId, share]),
  );
  const groupItemShareDetailsByGroupId = new Map(
    editorState.groups.map((group) => [
      group.id,
      groupItemShareDetails.filter((detail) => detail.groupId === group.id),
    ]),
  );
  const summaryShareData = buildReceiptSummaryShareData({
    discountLabel: formatCurrency(parseMoneyInputToCents(editorState.discount)),
    feeLabel: formatCurrency(parseMoneyInputToCents(editorState.fee)),
    groups: editorState.groups.map((group) => {
      const share = groupSharesById.get(group.id);

      return {
        amountLabel: formatCurrency(share?.amountCents ?? 0),
        discountLabel: formatCurrency(share?.discountShareCents ?? 0),
        feeLabel: formatCurrency(share?.feeShareCents ?? 0),
        groupDisplayName: group.displayName,
        itemsLabel: formatCurrency(share?.itemSubtotalCents ?? 0),
        itemDetails: (groupItemShareDetailsByGroupId.get(group.id) ?? []).map(
          (detail) => ({
            amountLabel: formatCurrency(detail.shareCents),
            description: detail.description,
            ratioLabel: detail.ratioLabel,
            subtotalLabel: formatCurrency(detail.lineSubtotalCents),
          }),
        ),
        taxLabel: formatCurrency(share?.taxShareCents ?? 0),
        tipLabel: formatCurrency(share?.tipShareCents ?? 0),
      };
    }),
    locationName: editorState.locationName,
    merchantName: editorState.merchantName,
    receiptOccurredAt: editorState.receiptOccurredAt,
    subtotalLabel: formatCurrency(subtotalCents),
    taxLabel: formatCurrency(parseMoneyInputToCents(editorState.tax)),
    tipLabel: formatCurrency(parseMoneyInputToCents(editorState.tip)),
    totalLabel: formatCurrency(totalCents),
  });
  const merchantNameMissing = editorState.merchantName.trim().length === 0;
  const receiptDateMissing = editorState.receiptOccurredAt.trim().length === 0;
  const unnamedGroupIds = new Set(
    editorState.groups
      .filter((group) => group.displayName.trim().length === 0)
      .map((group) => group.id),
  );
  const itemValidationById = new Map(
    editorState.items.map((item) => [
      item.id,
      {
        descriptionMissing: item.description.trim().length === 0,
        quantityInvalid: !/^[1-9]\d*$/.test(item.quantity.trim()),
        unitPriceInvalid: !/^\d+(\.\d{0,2})?$/.test(item.unitPrice.trim()),
        missingGroupAssignment: item.selectedGroupIds.length === 0,
      },
    ]),
  );
  const isCompactActionBar =
    (isMobileViewport || isMobileActionBarCompact) && !isDeleteConfirming;
  const isMinimizedMobileActionBar =
    isMobileViewport && isCompactActionBar && isMobileActionBarMinimized;

  function logWorkspaceError(
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

  function toggleMobileActionBarMinimized() {
    if (isMobileActionBarMinimized) {
      const measuredHeight = actionBarActionsRef.current?.scrollHeight ?? 0;

      if (measuredHeight > 0) {
        setActionBarActionsHeight(measuredHeight);
      }
    }

    setIsMobileActionBarMinimized((current) => !current);
  }

  function updateField<K extends keyof ReceiptEditorState>(
    field: K,
    value: ReceiptEditorState[K],
  ) {
    setSaveMessage(null);
    setShareMessage(null);
    setWarningMessage(null);
    setEditorState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateGroup(groupId: string, updates: Partial<EditableGroup>) {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group,
      ),
    }));
  }

  function addGroup() {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => ({
      ...current,
      groups: [...current.groups, createEditableGroup()],
    }));
  }

  function removeGroup(groupId: string) {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => {
      if (current.groups.length === 1) {
        return current;
      }

      return {
        ...current,
        groups: current.groups.filter((group) => group.id !== groupId),
        items: current.items.map((item) => ({
          ...item,
          selectedGroupIds: item.selectedGroupIds.filter(
            (selectedGroupId) => selectedGroupId !== groupId,
          ),
        })),
      };
    });
  }

  function addItem() {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => ({
      ...current,
      items: [
        ...current.items,
        createEditableItem({
          selectedGroupIds: current.groups[0] ? [current.groups[0].id] : [],
        }),
      ],
    }));
  }

  function updateItem(itemId: string, updates: Partial<EditableItem>) {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    }));
  }

  function removeItem(itemId: string) {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [
              createEditableItem({
                selectedGroupIds: current.groups[0]
                  ? [current.groups[0].id]
                  : [],
              }),
            ]
          : current.items.filter((item) => item.id !== itemId),
    }));
  }

  function toggleGroupAssignment(itemId: string, groupId: string) {
    setSaveMessage(null);
    setShareMessage(null);
    setEditorState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const isSelected = item.selectedGroupIds.includes(groupId);

        return {
          ...item,
          selectedGroupIds: isSelected
            ? item.selectedGroupIds.filter(
                (selectedGroupId) => selectedGroupId !== groupId,
              )
            : [...item.selectedGroupIds, groupId],
        };
      }),
    }));
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
    if (isSaving || isDeleting || !validation.canSave) {
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
            receiptId ??
              editorState.receiptId ??
              sourceReceipt?.receiptId ??
              "",
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

  async function handleDelete() {
    if (!sourceReceipt || isSaving || isDeleting) {
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
      const summaryImageFile =
        await renderReceiptSummaryJpegFile(summaryShareData);
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

  if (status !== "authenticated" || isLoading) {
    return (
      <AuthSessionScreen
        title={
          receiptId ? "Opening receipt workspace" : "Preparing a new receipt"
        }
        description="Pulling the current draft into place."
      />
    );
  }

  if (isMissing) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="auth-shell w-full max-w-xl rounded-[2rem] px-8 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.2rem] border border-[var(--line)] bg-[var(--surface)]">
            <AlertCircle className="h-8 w-8 text-[var(--foreground)]" />
          </div>
          <h1 className="mt-6 text-4xl leading-none text-[var(--foreground)]">
            Receipt not found
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
            This receipt either does not exist in your account or is no longer
            available.
          </p>
          <Button
            asChild
            className="mt-8 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            <Link href="/dashboard">Back to saved splits</Link>
          </Button>
        </div>
      </main>
    );
  }

  const heading =
    editorState.merchantName.trim() ||
    (receiptId ? "Receipt draft" : "New manual receipt");
  const workspaceDescription = receiptId
    ? "Edit and save."
    : "Parse, group, save.";
  const hasSavedReceipt = Boolean(sourceReceipt?.receiptId);

  function scrollToSummary() {
    summaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToFullSummary() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }

  return (
    <main
      className="flex-1 pt-4"
      style={{ paddingBottom: Math.max(128, actionBarHeight + 24) }}
    >
      <section className="page-shell pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
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
                    validation.canSave
                      ? "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]"
                      : "text-[var(--foreground)]",
                  )}
                  style={
                    validation.canSave ? undefined : requiredHighlightSoftStyle
                  }
                >
                  {validation.canSave ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: REQUIRED_HIGHLIGHT }}
                    />
                  )}
                  <span>
                    {validation.canSave
                      ? "Required fields are filled."
                      : "Complete required fields to save."}
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="metric-chip rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    {formatReceiptDate(
                      editorState.receiptOccurredAt || new Date().toISOString(),
                    )}
                  </div>
                  <div className="metric-chip rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    {editorState.groups.length} group
                    {editorState.groups.length === 1 ? "" : "s"}
                  </div>
                  <div className="metric-chip rounded-full px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    {editorState.items.length} item
                    {editorState.items.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              {warningMessage ? (
                <EditorNotice tone="warning" message={warningMessage} />
              ) : null}

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.3 }}
              >
                <SectionShell
                  title="Receipt details"
                  eyebrow="Metadata"
                  icon={ReceiptText}
                  tone="primary"
                >
                  <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Merchant and date required
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <FieldLabel
                        label="Merchant"
                        showRequired={merchantNameMissing}
                      />
                      <Input
                        value={editorState.merchantName}
                        onChange={(event) =>
                          updateField("merchantName", event.target.value)
                        }
                        placeholder="The place that got paid"
                        className={cn(
                          "h-12 rounded-[1rem] border px-4 font-medium",
                          merchantNameMissing
                            ? "border-[var(--line)]"
                            : "border-[var(--line)] bg-[var(--panel-strong)]",
                        )}
                        style={
                          merchantNameMissing
                            ? requiredHighlightSoftStyle
                            : undefined
                        }
                      />
                    </label>

                    <label className="w-full min-w-0 space-y-2">
                      <FieldLabel
                        label="Receipt date"
                        showRequired={receiptDateMissing}
                      />
                      <div
                        className={cn(
                          "h-12 w-full min-w-0 rounded-[1rem] border",
                          receiptDateMissing
                            ? "border-[var(--line)]"
                            : "border-[var(--line)] bg-[var(--panel-strong)]",
                        )}
                        style={
                          receiptDateMissing
                            ? requiredHighlightSoftStyle
                            : undefined
                        }
                      >
                        <input
                          type="datetime-local"
                          value={editorState.receiptOccurredAt}
                          onChange={(event) =>
                            updateField("receiptOccurredAt", event.target.value)
                          }
                          className="block h-full w-full min-w-0 rounded-[1rem] border-0 bg-transparent px-4 pt-2.5 text-left text-base font-medium text-[var(--foreground)] outline-none md:pt-0 md:leading-[3rem] md:[&::-webkit-datetime-edit]:p-0 md:[&::-webkit-datetime-edit-fields-wrapper]:flex md:[&::-webkit-datetime-edit-fields-wrapper]:h-full md:[&::-webkit-datetime-edit-fields-wrapper]:items-center"
                        />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Location name
                      </span>
                      <Input
                        value={editorState.locationName}
                        onChange={(event) =>
                          updateField("locationName", event.target.value)
                        }
                        placeholder="Optional neighborhood or venue note"
                        className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Currency
                      </span>
                      <Input
                        value={editorState.currencyCode}
                        onChange={(event) =>
                          updateField(
                            "currencyCode",
                            event.target.value.toUpperCase(),
                          )
                        }
                        className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium uppercase"
                        maxLength={3}
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Address or note
                      </span>
                      <Textarea
                        value={editorState.locationAddress}
                        onChange={(event) =>
                          updateField("locationAddress", event.target.value)
                        }
                        placeholder="Optional address, table note, or context for the receipt"
                        className="min-h-28 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] font-medium"
                      />
                    </label>
                  </div>

                  <div className="workspace-line mt-6 flex flex-wrap items-center justify-between gap-4 pt-5">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Upload-based parsing
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                        Not available yet.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Upload receipt
                      </span>
                    </button>
                  </div>
                </SectionShell>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <SectionShell
                  title="Split groups"
                  eyebrow="Participants"
                  icon={Users}
                  tone="primary"
                >
                  <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Name each group
                  </p>
                  <div className="space-y-4">
                    {editorState.groups.map((group, index) => (
                      <div
                        key={group.id}
                        className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--secondary)_20%,transparent)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                            Group {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-full border border-[var(--line)] !bg-[var(--foreground)] !text-[var(--background)] hover:!bg-[#ff0000] hover:!text-[#fff8f6] disabled:!bg-[var(--muted)] disabled:!text-[var(--muted-foreground)]"
                              onClick={() => removeGroup(group.id)}
                              disabled={editorState.groups.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                          <label className="space-y-2">
                            <FieldLabel
                              label="Group name"
                              showRequired={unnamedGroupIds.has(group.id)}
                            />
                            <Input
                              value={group.displayName}
                              onChange={(event) =>
                                updateGroup(group.id, {
                                  displayName: event.target.value,
                                })
                              }
                              placeholder="Alex + Sam"
                              className={cn(
                                "h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium",
                              )}
                              style={
                                unnamedGroupIds.has(group.id)
                                  ? requiredHighlightSoftStyle
                                  : undefined
                              }
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">
                              Member notes
                            </span>
                            <Input
                              value={group.notes}
                              onChange={(event) =>
                                updateGroup(group.id, {
                                  notes: event.target.value,
                                })
                              }
                              placeholder="Optional names or notes"
                              className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
                    onClick={addGroup}
                  >
                    <Plus className="h-4 w-4" />
                    Add group
                  </Button>
                </SectionShell>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <SectionShell
                  title="Items and assignment"
                  eyebrow="Line items"
                  icon={MapPin}
                  tone="primary"
                >
                  <div className="space-y-5">
                    {editorState.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2">
                            <div className="rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--secondary)_14%,transparent)] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                              Item {index + 1}
                            </div>
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">
                              {formatCurrency(getItemLineSubtotalCents(item))}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full border border-[var(--line)] !bg-[var(--foreground)] !text-[var(--background)] hover:!bg-[#ff0000] hover:!text-[#fff8f6] disabled:!bg-[var(--muted)] disabled:!text-[var(--muted-foreground)]"
                            onClick={() => removeItem(item.id)}
                            disabled={editorState.items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-2 md:col-span-2">
                            <FieldLabel
                              label="Description"
                              showRequired={
                                itemValidationById.get(item.id)
                                  ?.descriptionMissing ?? false
                              }
                            />
                            <Input
                              value={item.description}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  description: event.target.value,
                                })
                              }
                              placeholder="Shared fries"
                              className={cn(
                                "h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium",
                              )}
                              style={
                                itemValidationById.get(item.id)
                                  ?.descriptionMissing
                                  ? requiredHighlightSoftStyle
                                  : undefined
                              }
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">
                              Category
                            </span>
                            <Input
                              value={item.category}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  category: event.target.value,
                                })
                              }
                              placeholder="Optional"
                              className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                            />
                          </label>

                          <label className="space-y-2">
                            <FieldLabel
                              label="Quantity"
                              showRequired={
                                itemValidationById.get(item.id)
                                  ?.quantityInvalid ?? false
                              }
                            />
                            <Input
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  quantity: event.target.value,
                                })
                              }
                              className={cn(
                                "h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium",
                              )}
                              style={
                                itemValidationById.get(item.id)?.quantityInvalid
                                  ? requiredHighlightSoftStyle
                                  : undefined
                              }
                            />
                          </label>

                          <label className="space-y-2">
                            <FieldLabel
                              label="Unit price"
                              showRequired={
                                itemValidationById.get(item.id)
                                  ?.unitPriceInvalid ?? false
                              }
                            />
                            <Input
                              inputMode="decimal"
                              value={item.unitPrice}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  unitPrice: event.target.value,
                                })
                              }
                              className={cn(
                                "h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium",
                              )}
                              style={
                                itemValidationById.get(item.id)
                                  ?.unitPriceInvalid
                                  ? requiredHighlightSoftStyle
                                  : undefined
                              }
                            />
                          </label>

                          <label className="space-y-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">
                              Line discount
                            </span>
                            <Input
                              inputMode="decimal"
                              value={item.discount}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  discount: event.target.value,
                                })
                              }
                              className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                            />
                          </label>
                        </div>

                        <div
                          className={cn(
                            "mt-5 rounded-[1.1rem] border px-4 py-4",
                            itemValidationById.get(item.id)
                              ?.missingGroupAssignment
                              ? "border-[var(--line)]"
                              : "border-[var(--line)] bg-[var(--surface)]",
                          )}
                          style={
                            itemValidationById.get(item.id)
                              ?.missingGroupAssignment
                              ? requiredHighlightSoftStyle
                              : undefined
                          }
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2">
                              <ArrowUpDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                              <p className="text-sm font-semibold text-[var(--foreground)]">
                                Assign this item to group(s)
                                {itemValidationById.get(item.id)
                                  ?.missingGroupAssignment ? (
                                  <span
                                    className="ml-2 rounded-full border border-foreground px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em]"
                                    style={requiredHighlightFillStyle}
                                  >
                                    Required
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                              Equal split across selected groups
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {editorState.groups.map((group) => (
                              <GroupChip
                                key={group.id}
                                active={item.selectedGroupIds.includes(
                                  group.id,
                                )}
                                label={group.displayName || "Untitled group"}
                                onClick={() =>
                                  toggleGroupAssignment(item.id, group.id)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4" />
                    Add item
                  </Button>
                </SectionShell>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <SectionShell title="Adjustments" eyebrow="Totals">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Tax
                      </span>
                      <Input
                        inputMode="decimal"
                        value={editorState.tax}
                        onChange={(event) =>
                          updateField("tax", event.target.value)
                        }
                        className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Tip
                      </span>
                      <Input
                        inputMode="decimal"
                        value={editorState.tip}
                        onChange={(event) =>
                          updateField("tip", event.target.value)
                        }
                        className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Fee
                      </span>
                      <Input
                        inputMode="decimal"
                        value={editorState.fee}
                        onChange={(event) =>
                          updateField("fee", event.target.value)
                        }
                        className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Discount
                      </span>
                      <Input
                        inputMode="decimal"
                        value={editorState.discount}
                        onChange={(event) =>
                          updateField("discount", event.target.value)
                        }
                        className="h-12 rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 font-medium"
                      />
                    </label>
                  </div>
                </SectionShell>
              </motion.div>
            </div>

            <motion.aside
              ref={summaryRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="workspace-panel rounded-[1.75rem] p-6 lg:-mt-2 lg:sticky lg:top-28 lg:self-start"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  Receipt summary
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-w-40 justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)]"
                    onClick={() => void handleShareSummary()}
                    disabled={isSharingSummary}
                  >
                    {isSharingSummary ? (
                      <LoaderCircle className="h-4 w-4 animate-spin shrink-0" />
                    ) : (
                      <Share2 className="h-4 w-4 shrink-0" />
                    )}
                    <span className="whitespace-nowrap text-center">
                      {isSharingSummary ? "Exporting" : "Share as image"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hidden rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_12%,white)] lg:inline-flex"
                    onClick={scrollToFullSummary}
                  >
                    See full summary
                  </Button>
                </div>
              </div>
              <div className="mt-5">
                <SummaryRow
                  label="Items subtotal"
                  value={formatCurrency(subtotalCents)}
                />
                <SummaryRow
                  label="Tax"
                  value={formatCurrency(
                    parseMoneyInputToCents(editorState.tax),
                  )}
                />
                <SummaryRow
                  label="Tip"
                  value={formatCurrency(
                    parseMoneyInputToCents(editorState.tip),
                  )}
                />
                <SummaryRow
                  label="Fees"
                  value={formatCurrency(
                    parseMoneyInputToCents(editorState.fee),
                  )}
                />
                <SummaryRow
                  label="Discount"
                  value={formatCurrency(
                    parseMoneyInputToCents(editorState.discount),
                  )}
                />
                <SummaryRow
                  label="Total"
                  value={formatCurrency(totalCents)}
                  emphasis
                />
              </div>

              <div className="workspace-line mt-8 pt-6">
                <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  Group share preview
                </p>
                <div className="mt-4 space-y-3">
                  {editorState.groups.map((group) => {
                    const share = groupShares.find(
                      (entry) => entry.groupId === group.id,
                    );
                    const itemDetails =
                      groupItemShareDetailsByGroupId.get(group.id) ?? [];

                    if (!share) {
                      return null;
                    }

                    return (
                      <div
                        key={group.id}
                        className="rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {group.displayName || "Untitled group"}
                            </p>
                          </div>
                          <p className="text-xl font-medium text-[var(--foreground)]">
                            {formatCurrency(share.amountCents)}
                          </p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          <span>Items</span>
                          <span className="text-right text-[var(--foreground)]">
                            {formatCurrency(share.itemSubtotalCents)}
                          </span>
                          <span>Tax</span>
                          <span className="text-right text-[var(--foreground)]">
                            {formatCurrency(share.taxShareCents)}
                          </span>
                          <span>Tip</span>
                          <span className="text-right text-[var(--foreground)]">
                            {formatCurrency(share.tipShareCents)}
                          </span>
                          <span>Fees</span>
                          <span className="text-right text-[var(--foreground)]">
                            {formatCurrency(share.feeShareCents)}
                          </span>
                          <span>Discount</span>
                          <span className="text-right text-[var(--foreground)]">
                            {formatCurrency(share.discountShareCents)}
                          </span>
                        </div>
                        <div className="workspace-line mt-4 pt-4">
                          <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                            Items to pay
                          </p>
                          {itemDetails.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {itemDetails.map((detail) => (
                                <div
                                  key={`${group.id}-${detail.itemId}`}
                                  className="rounded-[0.9rem] border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-[var(--foreground)]">
                                        {detail.description}
                                      </p>
                                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                        {detail.ratioLabel} share of{" "}
                                        {formatCurrency(
                                          detail.lineSubtotalCents,
                                        )}
                                      </p>
                                    </div>
                                    <p className="text-sm font-medium text-[var(--foreground)]">
                                      {formatCurrency(detail.shareCents)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                              No assigned items yet.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                  Receipt-level adjustments are distributed proportionally to
                  each group&apos;s item subtotal.
                </p>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </section>

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
              isCompactActionBar
                ? "flex-col gap-2 py-3"
                : "flex-col gap-3 py-4",
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
                      {isMobileActionBarMinimized ? (
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
                          "h-11 rounded-full px-5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50",
                          isCompactActionBar &&
                            "min-w-[calc(50%-0.375rem)] flex-1 justify-center px-4",
                          "bg-[#ff0000] text-[#fff8f6] hover:bg-[#cc0000] active:bg-[#cc0000]",
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
                        {isCompactActionBar ? "Saving" : "Saving"}
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
                        "h-11 rounded-full px-5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50",
                        isCompactActionBar &&
                          "min-w-[calc(50%-0.375rem)] flex-1 justify-center px-4",
                        isDeleteConfirming
                          ? "bg-[#ff0000] text-[#fff8f6] hover:bg-[#cc0000] active:bg-[#cc0000]"
                          : "bg-[#ff0000] text-[#fff8f6] hover:bg-[#cc0000] active:bg-[#cc0000]",
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
                      {isCompactActionBar ? "Saving" : "Saving"}
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
    </main>
  );
}
