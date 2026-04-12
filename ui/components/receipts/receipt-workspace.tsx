"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, startTransition } from "react"
import { motion } from "motion/react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Camera,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  Users,
} from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ReceiptApiError,
  deleteReceipt,
  getReceipt,
  saveReceiptEditorState,
} from "@/lib/receipt-api"
import {
  buildReceiptSavePlan,
  createEditableGroup,
  createEditableItem,
  createEmptyReceiptEditorState,
  formatCurrency,
  formatReceiptDate,
  getGroupShareSummaries,
  getReceiptEditorValidation,
  getItemLineSubtotalCents,
  getReceiptSubtotalCents,
  getReceiptTotalCents,
  isMeaningfullyDirty,
  mapReceiptToEditorState,
  parseMoneyInputToCents,
} from "@/lib/receipt-editor"
import type { EditableGroup, EditableItem, Receipt, ReceiptEditorState } from "@/lib/receipt-types"
import { cn } from "@/lib/utils"

const REQUIRED_HIGHLIGHT = "#ff7a1a"
const REQUIRED_HIGHLIGHT_FOREGROUND = "#1f2847"
const REQUIRED_HIGHLIGHT_SOFT = "#ffe2cc"

const requiredHighlightFillStyle = {
  backgroundColor: REQUIRED_HIGHLIGHT,
  color: REQUIRED_HIGHLIGHT_FOREGROUND,
}

const requiredHighlightSoftStyle = {
  backgroundColor: REQUIRED_HIGHLIGHT_SOFT,
}

function SectionShell({
  children,
  title,
  eyebrow,
  icon: Icon,
  tone = "default",
}: {
  children: React.ReactNode
  title: string
  eyebrow: string
  icon?: typeof ReceiptText
  tone?: "default" | "primary" | "secondary" | "accent"
}) {
  const shadowClassName =
    tone === "primary"
      ? "shadow-[10px_10px_0px_0px_var(--color-primary)]"
      : tone === "secondary"
        ? "shadow-[10px_10px_0px_0px_var(--color-secondary)]"
        : tone === "accent"
          ? "shadow-[10px_10px_0px_0px_var(--color-accent)]"
          : "shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"

  const iconCircleClassName =
    tone === "primary"
      ? "border-foreground bg-primary/20"
      : tone === "secondary"
        ? "border-foreground bg-secondary/20"
        : tone === "accent"
          ? "border-foreground bg-accent/30"
          : "border-foreground bg-white"

  return (
    <section
      className={cn(
        "rounded-[2.6rem] border-4 border-foreground bg-white p-5 sm:p-6",
        shadowClassName,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div
            className={cn(
              "rounded-[1.4rem] border-2 p-3",
              iconCircleClassName,
            )}
          >
            <Icon className="h-4 w-4 text-foreground" />
          </div>
        ) : null}
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-heading font-black leading-none text-foreground sm:text-3xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-border py-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      <span
        className={
          emphasis
            ? "text-xl font-heading font-black text-foreground"
            : "text-sm font-black text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}

function GroupChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full p-0 transition-colors duration-150 ease-out",
        active ? "bg-accent" : "bg-transparent",
      )}
    >
      <span
        className={cn(
          "block rounded-full border-2 border-foreground px-3 py-2 text-sm font-black transition-all duration-150 ease-out",
          active
            ? "bg-foreground text-background -translate-x-1 -translate-y-1 hover:translate-x-[-3px] hover:translate-y-[-3px]"
            : "bg-white text-foreground hover:text-white hover:bg-black",
        )}
      >
        {label}
      </span>
    </button>
  )
}

function EditorNotice({
  tone,
  message,
}: {
  tone: "error" | "success" | "warning"
  message: string
}) {
  const className =
    tone === "success"
      ? "bg-primary/10 text-primary shadow-[8px_8px_0px_0px_var(--color-primary)]"
      : tone === "warning"
        ? "bg-accent/25 text-foreground shadow-[8px_8px_0px_0px_var(--color-accent)]"
        : "bg-destructive/10 text-destructive shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"

  return (
    <div
      className={`rounded-[1.8rem] border-4 border-foreground px-4 py-3 text-sm font-medium ${className}`}
    >
      {message}
    </div>
  )
}

function FieldLabel({
  label,
  showRequired = false,
}: {
  label: string
  showRequired?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-black text-foreground">
      {label}
      {showRequired ? (
        <span
          className="rounded-full border border-foreground px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.18em]"
          style={requiredHighlightFillStyle}
        >
          Required
        </span>
      ) : null}
    </span>
  )
}

export function ReceiptWorkspace({ receiptId }: { receiptId?: string }) {
  const router = useRouter()
  const { status } = useAuth()
  const summaryRef = useRef<HTMLElement | null>(null)
  const actionBarRef = useRef<HTMLDivElement | null>(null)
  const [editorState, setEditorState] = useState<ReceiptEditorState>(() =>
    createEmptyReceiptEditorState(),
  )
  const [sourceReceipt, setSourceReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(receiptId))
  const [isMissing, setIsMissing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [footerOffset, setFooterOffset] = useState(0)
  const [actionBarHeight, setActionBarHeight] = useState(128)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    if (status !== "authenticated") {
      return
    }

    const currentReceiptId = receiptId

    if (!currentReceiptId) {
      setSourceReceipt(null)
      setEditorState(createEmptyReceiptEditorState())
      setIsLoading(false)
      setIsMissing(false)
      return
    }

    const targetReceiptId: string = currentReceiptId

    let isActive = true

    async function loadReceipt() {
      setIsLoading(true)
      setWarningMessage(null)

      try {
        const receipt = await getReceipt(targetReceiptId)

        if (!isActive) {
          return
        }

        if (!receipt) {
          setIsMissing(true)
          setSourceReceipt(null)
          return
        }

        setIsMissing(false)
        setSourceReceipt(receipt)
        setEditorState(mapReceiptToEditorState(receipt))
      } catch (error) {
        if (!isActive) {
          return
        }

        logWorkspaceError("load receipt", error, "Unable to load this receipt.")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadReceipt()

    return () => {
      isActive = false
    }
  }, [receiptId, router, status])

  useEffect(() => {
    function updateFooterOffset() {
      const footer = document.querySelector("footer")

      if (!footer) {
        setFooterOffset(0)
        return
      }

      const footerRect = footer.getBoundingClientRect()
      const visibleFooterHeight = Math.max(0, window.innerHeight - footerRect.top)
      setFooterOffset(visibleFooterHeight)
    }

    updateFooterOffset()

    window.addEventListener("scroll", updateFooterOffset, { passive: true })
    window.addEventListener("resize", updateFooterOffset)

    return () => {
      window.removeEventListener("scroll", updateFooterOffset)
      window.removeEventListener("resize", updateFooterOffset)
    }
  }, [])

  useEffect(() => {
    const actionBarElement = actionBarRef.current

    if (actionBarElement === null) {
      return
    }

    const measuredActionBarElement = actionBarElement

    function updateActionBarHeight() {
      setActionBarHeight(measuredActionBarElement.getBoundingClientRect().height)
    }

    updateActionBarHeight()

    const observer = new ResizeObserver(updateActionBarHeight)
    observer.observe(measuredActionBarElement)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    setIsDeleteConfirming(false)
  }, [sourceReceipt?.receiptId])

  const validation = getReceiptEditorValidation(editorState)
  const savePlan = buildReceiptSavePlan(editorState, sourceReceipt)
  const isDirty = isMeaningfullyDirty(editorState, sourceReceipt)
  const subtotalCents = getReceiptSubtotalCents(editorState)
  const totalCents = getReceiptTotalCents(editorState)
  const groupShares = getGroupShareSummaries(editorState)
  const merchantNameMissing = editorState.merchantName.trim().length === 0
  const receiptDateMissing = editorState.receiptOccurredAt.trim().length === 0
  const unnamedGroupIds = new Set(
    editorState.groups
      .filter((group) => group.displayName.trim().length === 0)
      .map((group) => group.id),
  )
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
  )

  function logWorkspaceError(context: string, error: unknown, fallbackMessage: string) {
    if (error instanceof ReceiptApiError) {
      console.error(`[ReceiptWorkspace] ${context}: ${error.message}`, error)
      return
    }

    if (error instanceof Error) {
      console.error(`[ReceiptWorkspace] ${context}: ${error.message}`, error)
      return
    }

    console.error(`[ReceiptWorkspace] ${context}: ${fallbackMessage}`, error)
  }

  function updateField<K extends keyof ReceiptEditorState>(
    field: K,
    value: ReceiptEditorState[K],
  ) {
    setSaveMessage(null)
    setWarningMessage(null)
    setEditorState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateGroup(groupId: string, updates: Partial<EditableGroup>) {
    setSaveMessage(null)
    setEditorState((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group,
      ),
    }))
  }

  function addGroup() {
    setSaveMessage(null)
    setEditorState((current) => ({
      ...current,
      groups: [...current.groups, createEditableGroup()],
    }))
  }

  function removeGroup(groupId: string) {
    setSaveMessage(null)
    setEditorState((current) => {
      if (current.groups.length === 1) {
        return current
      }

      return {
        ...current,
        groups: current.groups.filter((group) => group.id !== groupId),
        items: current.items.map((item) => ({
          ...item,
          selectedGroupIds: item.selectedGroupIds.filter((selectedGroupId) => selectedGroupId !== groupId),
        })),
      }
    })
  }

  function addItem() {
    setSaveMessage(null)
    setEditorState((current) => ({
      ...current,
      items: [
        ...current.items,
        createEditableItem({
          selectedGroupIds: current.groups[0] ? [current.groups[0].id] : [],
        }),
      ],
    }))
  }

  function updateItem(itemId: string, updates: Partial<EditableItem>) {
    setSaveMessage(null)
    setEditorState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    }))
  }

  function removeItem(itemId: string) {
    setSaveMessage(null)
    setEditorState((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [createEditableItem({ selectedGroupIds: current.groups[0] ? [current.groups[0].id] : [] })]
          : current.items.filter((item) => item.id !== itemId),
    }))
  }

  function toggleGroupAssignment(itemId: string, groupId: string) {
    setSaveMessage(null)
    setEditorState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        const isSelected = item.selectedGroupIds.includes(groupId)

        return {
          ...item,
          selectedGroupIds: isSelected
            ? item.selectedGroupIds.filter((selectedGroupId) => selectedGroupId !== groupId)
            : [...item.selectedGroupIds, groupId],
        }
      }),
    }))
  }

  async function refreshReceiptAfterConflict(targetReceiptId: string) {
    try {
      const latestReceipt = await getReceipt(targetReceiptId)

      if (!latestReceipt) {
        return
      }

      setSourceReceipt(latestReceipt)
      setEditorState(mapReceiptToEditorState(latestReceipt))
      setWarningMessage(
        "This receipt changed while you were editing. The latest saved version has been reloaded so you can review and try again.",
      )
    } catch (error) {
      logWorkspaceError(
        "refresh after conflict",
        error,
        "Unable to reload the latest receipt after a version conflict.",
      )
      setWarningMessage(
        "This receipt changed while you were editing. Reload the page and try again.",
      )
    }
  }

  async function handleSave() {
    if (isSaving || isDeleting || !validation.canSave) {
      return
    }

    setIsSaving(true)
    setSaveMessage(null)
    setWarningMessage(null)

    try {
      const savedReceipt = await saveReceiptEditorState(editorState, sourceReceipt)
      setSourceReceipt(savedReceipt)
      setEditorState(mapReceiptToEditorState(savedReceipt))
      setSaveMessage("Receipt saved to your account.")

      if (!receiptId) {
        startTransition(() => {
          router.replace(`/dashboard/${savedReceipt.receiptId}`)
        })
      }
    } catch (error) {
      if (error instanceof ReceiptApiError) {
        if (error.code === "conflict" && (receiptId ?? editorState.receiptId ?? sourceReceipt?.receiptId)) {
          await refreshReceiptAfterConflict(
            receiptId ?? editorState.receiptId ?? sourceReceipt?.receiptId ?? "",
          )
        } else {
          logWorkspaceError("save receipt", error, "Unable to save your receipt right now.")
        }
      } else {
        logWorkspaceError("save receipt", error, "Unable to save your receipt right now.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!sourceReceipt || isSaving || isDeleting) {
      return
    }

    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true)
      return
    }

    setIsDeleting(true)
    setIsDeleteConfirming(false)
    setSaveMessage(null)
    setWarningMessage(null)

    try {
      await deleteReceipt(sourceReceipt)

      startTransition(() => {
        router.replace("/dashboard")
      })
    } catch (error) {
      if (error instanceof ReceiptApiError) {
        if (error.code === "conflict") {
          await refreshReceiptAfterConflict(sourceReceipt.receiptId)
          logWorkspaceError(
            "delete receipt",
            error,
            "This receipt changed before it could be deleted. Review the latest version and try again.",
          )
        } else {
          logWorkspaceError("delete receipt", error, "Unable to delete this receipt right now.")
        }
      } else {
        logWorkspaceError("delete receipt", error, "Unable to delete this receipt right now.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (status !== "authenticated" || isLoading) {
    return (
      <AuthSessionScreen
        title={receiptId ? "Opening receipt workspace" : "Preparing a new receipt"}
        description="Pulling the current draft into place."
      />
    )
  }

  if (isMissing) {
    return (
      <main className="relative -mt-28 flex flex-1 items-center justify-center overflow-hidden bg-background px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[3rem] border-4 border-foreground bg-white px-8 py-12 text-center shadow-[10px_10px_0px_0px_var(--color-secondary)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 border-foreground bg-secondary/15">
            <AlertCircle className="h-8 w-8 text-foreground" />
          </div>
          <h1 className="mt-6 text-4xl font-heading font-black leading-none text-foreground">
            Receipt not found
          </h1>
          <p className="mt-4 text-base font-medium leading-7 text-muted-foreground">
            This receipt either does not exist in your account or is no longer available.
          </p>
          <Button
            asChild
            className="-translate-y-[2px] mt-8 rounded-full border-4 border-foreground bg-primary px-5 font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-0 hover:bg-primary/90 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Link href="/dashboard">Back to archive</Link>
          </Button>
        </div>
      </main>
    )
  }

  const heading = editorState.merchantName.trim() || (receiptId ? "Receipt draft" : "New manual receipt")
  const workspaceDescription = receiptId
    ? "Update the draft and save."
    : "Enter the receipt, assign groups, and save."
  const hasSavedReceipt = Boolean(sourceReceipt?.receiptId)

  function scrollToSummary() {
    summaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <main
      className="relative -mt-28 flex-1 overflow-hidden bg-background pt-28"
      style={{ paddingBottom: Math.max(128, actionBarHeight + 24) }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.05]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              asChild
              variant="outline"
              className="-translate-y-[2px] rounded-full border-4 border-foreground bg-white px-4 font-black text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-0 hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to archive
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-[3rem] border-4 border-foreground bg-white px-6 py-6 sm:px-8 sm:py-8">
                <h1 className="max-w-4xl text-4xl font-heading font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl">
                  {heading}
                </h1>
                <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
                  {workspaceDescription}
                </p>
                <div
                  className={cn(
                    "mt-6 inline-flex max-w-2xl items-start gap-3 rounded-[1.6rem] border-2 border-foreground px-4 py-3 text-sm font-medium",
                    validation.canSave
                      ? "bg-primary/10 text-foreground"
                      : "text-foreground",
                  )}
                  style={validation.canSave ? undefined : requiredHighlightSoftStyle}
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
                      ? "Required fields are filled. Save is available."
                      : "Complete required fields to save."}
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="rounded-full border-2 border-foreground bg-primary/10 px-4 py-3 text-sm font-black text-foreground">
                    {formatReceiptDate(editorState.receiptOccurredAt || new Date().toISOString())}
                  </div>
                  <div className="rounded-full border-2 border-foreground bg-secondary/10 px-4 py-3 text-sm font-black text-foreground">
                    {editorState.groups.length} group{editorState.groups.length === 1 ? "" : "s"}
                  </div>
                  <div className="rounded-full border-2 border-foreground bg-accent/25 px-4 py-3 text-sm font-black text-foreground">
                    {editorState.items.length} item{editorState.items.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              {warningMessage ? <EditorNotice tone="warning" message={warningMessage} /> : null}

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
              <SectionShell title="Receipt details" eyebrow="Metadata" icon={ReceiptText} tone="primary">
                <p className="mb-4 text-sm font-medium leading-6 text-muted-foreground">
                  Merchant and receipt date are required before you can save.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <FieldLabel label="Merchant" showRequired={merchantNameMissing} />
                    <Input
                      value={editorState.merchantName}
                      onChange={(event) => updateField("merchantName", event.target.value)}
                      placeholder="The place that got paid"
                      className={cn(
                        "h-12 rounded-[1.2rem] border-2 px-4 font-medium",
                        merchantNameMissing
                          ? "border-foreground"
                          : "border-foreground bg-white",
                      )}
                      style={merchantNameMissing ? requiredHighlightSoftStyle : undefined}
                    />
                  </label>

                  <label className="space-y-2">
                    <FieldLabel label="Receipt date" showRequired={receiptDateMissing} />
                    <Input
                      type="datetime-local"
                      value={editorState.receiptOccurredAt}
                      onChange={(event) => updateField("receiptOccurredAt", event.target.value)}
                      className={cn(
                        "h-12 rounded-[1.2rem] border-2 px-4 font-medium",
                        receiptDateMissing
                          ? "border-foreground"
                          : "border-foreground bg-white",
                      )}
                      style={receiptDateMissing ? requiredHighlightSoftStyle : undefined}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-black text-foreground">Location name</span>
                    <Input
                      value={editorState.locationName}
                      onChange={(event) => updateField("locationName", event.target.value)}
                      placeholder="Optional neighborhood or venue note"
                      className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-black text-foreground">Currency</span>
                    <Input
                      value={editorState.currencyCode}
                      onChange={(event) => updateField("currencyCode", event.target.value.toUpperCase())}
                      className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium uppercase"
                      maxLength={3}
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-black text-foreground">Address or note</span>
                    <Textarea
                      value={editorState.locationAddress}
                      onChange={(event) => updateField("locationAddress", event.target.value)}
                      placeholder="Optional address, table note, or context for the receipt"
                      className="min-h-28 rounded-[1.6rem] border-2 border-foreground bg-white font-medium"
                    />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-foreground pt-5">
                  <div>
                    <p className="text-sm font-black text-foreground">Upload-based parsing</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                      Not available yet.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="rounded-full border-2 border-dashed border-foreground bg-white px-4 py-2 text-sm font-black text-muted-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Upload receipt
                    </span>
                  </button>
                </div>
              </SectionShell>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
              <SectionShell title="Split groups" eyebrow="Participants" icon={Users} tone="secondary">
                <p className="mb-4 text-sm font-medium leading-6 text-muted-foreground">
                  Every split group needs a name before the receipt can be saved.
                </p>
                <div className="space-y-4">
                  {editorState.groups.map((group, index) => (
                    <div
                      key={group.id}
                      className="rounded-[2rem] border-2 border-foreground bg-white p-4 shadow-[6px_6px_0px_0px_var(--color-secondary)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="rounded-full border-2 border-foreground bg-secondary/20 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                          Group {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full border-2 border-foreground !bg-foreground !text-background transition-all duration-200 ease-out hover:!-translate-x-0.5 hover:!-translate-y-0.5 hover:!bg-foreground/85 hover:!text-background active:!bg-foreground/75 hover:shadow-[2px_2px_0px_0px_var(--color-secondary)]"
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
                            onChange={(event) => updateGroup(group.id, { displayName: event.target.value })}
                            placeholder="Alex + Sam"
                            className={cn(
                              "h-12 rounded-[1.2rem] border-2 px-4 font-medium",
                              unnamedGroupIds.has(group.id)
                                ? "border-foreground"
                                : "border-foreground bg-white",
                            )}
                            style={unnamedGroupIds.has(group.id) ? requiredHighlightSoftStyle : undefined}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-black text-foreground">Member notes</span>
                          <Input
                            value={group.notes}
                            onChange={(event) => updateGroup(group.id, { notes: event.target.value })}
                            placeholder="Optional names or notes"
                            className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="-translate-y-[2px] mt-5 rounded-full border-4 border-foreground bg-white px-5 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-0 hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={addGroup}
                >
                  <Plus className="h-4 w-4" />
                  Add group
                </Button>
              </SectionShell>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
              <SectionShell title="Items and assignment" eyebrow="Line items" icon={MapPin} tone="accent">
                <p className="mb-4 text-sm font-medium leading-6 text-muted-foreground">
                  Each item needs a description, quantity, unit price, and at least one assigned group.
                </p>
                <div className="space-y-5">
                  {editorState.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-[2rem] border-2 border-foreground bg-white p-5 shadow-[6px_6px_0px_0px_var(--color-accent)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2">
                          <div className="rounded-full border-2 border-foreground bg-accent/30 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                            Item {index + 1}
                          </div>
                          <span className="text-sm font-black text-muted-foreground">
                            {formatCurrency(getItemLineSubtotalCents(item))}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full border-2 border-foreground !bg-foreground !text-background transition-all duration-200 ease-out hover:!-translate-x-0.5 hover:!-translate-y-0.5 hover:!bg-foreground/85 hover:!text-background active:!bg-foreground/75 hover:shadow-[2px_2px_0px_0px_var(--color-accent)]"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 md:col-span-2">
                          <FieldLabel
                            label="Description"
                            showRequired={itemValidationById.get(item.id)?.descriptionMissing ?? false}
                          />
                          <Input
                            value={item.description}
                            onChange={(event) => updateItem(item.id, { description: event.target.value })}
                            placeholder="Shared fries"
                            className={cn(
                              "h-12 rounded-[1.2rem] border-2 px-4 font-medium",
                              itemValidationById.get(item.id)?.descriptionMissing
                                ? "border-foreground"
                                : "border-foreground bg-white",
                            )}
                            style={
                              itemValidationById.get(item.id)?.descriptionMissing
                                ? requiredHighlightSoftStyle
                                : undefined
                            }
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-black text-foreground">Category</span>
                          <Input
                            value={item.category}
                            onChange={(event) => updateItem(item.id, { category: event.target.value })}
                            placeholder="Optional"
                            className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                          />
                        </label>

                        <label className="space-y-2">
                          <FieldLabel
                            label="Quantity"
                            showRequired={itemValidationById.get(item.id)?.quantityInvalid ?? false}
                          />
                          <Input
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                            className={cn(
                              "h-12 rounded-[1.2rem] border-2 px-4 font-medium",
                              itemValidationById.get(item.id)?.quantityInvalid
                                ? "border-foreground"
                                : "border-foreground bg-white",
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
                            showRequired={itemValidationById.get(item.id)?.unitPriceInvalid ?? false}
                          />
                          <Input
                            inputMode="decimal"
                            value={item.unitPrice}
                            onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                            className={cn(
                              "h-12 rounded-[1.2rem] border-2 px-4 font-medium",
                              itemValidationById.get(item.id)?.unitPriceInvalid
                                ? "border-foreground"
                                : "border-foreground bg-white",
                            )}
                            style={
                              itemValidationById.get(item.id)?.unitPriceInvalid
                                ? requiredHighlightSoftStyle
                                : undefined
                            }
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-black text-foreground">Line discount</span>
                          <Input
                            inputMode="decimal"
                            value={item.discount}
                            onChange={(event) => updateItem(item.id, { discount: event.target.value })}
                            className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                          />
                        </label>
                      </div>

                      <div
                        className={cn(
                          "mt-5 rounded-[1.8rem] border-2 px-4 py-4",
                          itemValidationById.get(item.id)?.missingGroupAssignment
                            ? "border-foreground"
                            : "border-foreground bg-muted/50",
                        )}
                        style={
                          itemValidationById.get(item.id)?.missingGroupAssignment
                            ? requiredHighlightSoftStyle
                            : undefined
                        }
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-black text-foreground">
                              Assign this item to group(s)
                              {itemValidationById.get(item.id)?.missingGroupAssignment ? (
                                <span
                                  className="ml-2 rounded-full border border-foreground px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em]"
                                  style={requiredHighlightFillStyle}
                                >
                                  Required
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-muted-foreground">
                            Equal split across selected groups
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {editorState.groups.map((group) => (
                            <GroupChip
                              key={group.id}
                              active={item.selectedGroupIds.includes(group.id)}
                              label={group.displayName || "Untitled group"}
                              onClick={() => toggleGroupAssignment(item.id, group.id)}
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
                  className="-translate-y-[2px] mt-5 rounded-full border-4 border-foreground bg-white px-5 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-0 hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </SectionShell>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
              <SectionShell title="Adjustments" eyebrow="Totals">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm font-black text-foreground">Tax</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.tax}
                      onChange={(event) => updateField("tax", event.target.value)}
                      className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-black text-foreground">Tip</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.tip}
                      onChange={(event) => updateField("tip", event.target.value)}
                      className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-black text-foreground">Fee</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.fee}
                      onChange={(event) => updateField("fee", event.target.value)}
                      className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-black text-foreground">Discount</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.discount}
                      onChange={(event) => updateField("discount", event.target.value)}
                      className="h-12 rounded-[1.2rem] border-2 border-foreground bg-white px-4 font-medium"
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
              className="rounded-[2.6rem] border-4 border-foreground bg-white p-6 lg:-mt-2 lg:sticky lg:top-28 lg:self-start"
            >
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Receipt summary
              </p>
              <div className="mt-5">
                <SummaryRow label="Items subtotal" value={formatCurrency(subtotalCents)} />
                <SummaryRow label="Tax" value={formatCurrency(parseMoneyInputToCents(editorState.tax))} />
                <SummaryRow label="Tip" value={formatCurrency(parseMoneyInputToCents(editorState.tip))} />
                <SummaryRow label="Fees" value={formatCurrency(parseMoneyInputToCents(editorState.fee))} />
                <SummaryRow label="Discount" value={formatCurrency(parseMoneyInputToCents(editorState.discount))} />
                <SummaryRow label="Total" value={formatCurrency(totalCents)} emphasis />
              </div>

              <div className="mt-8 border-t-2 border-dashed border-border pt-6">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Group share preview
                </p>
                <div className="mt-4 space-y-3">
                  {editorState.groups.map((group) => {
                    const share = groupShares.find((entry) => entry.groupId === group.id)

                    if (!share) {
                      return null
                    }

                    return (
                      <div
                        key={group.id}
                        className="rounded-[1.4rem] border-2 border-foreground bg-muted/50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black text-foreground">{group.displayName || "Untitled group"}</p>
                          </div>
                          <p className="font-heading text-xl font-black text-foreground">
                            {formatCurrency(share.amountCents)}
                          </p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
                          <span>Items</span>
                          <span className="text-right text-foreground">
                            {formatCurrency(share.itemSubtotalCents)}
                          </span>
                          <span>Tax</span>
                          <span className="text-right text-foreground">
                            {formatCurrency(share.taxShareCents)}
                          </span>
                          <span>Tip</span>
                          <span className="text-right text-foreground">
                            {formatCurrency(share.tipShareCents)}
                          </span>
                          <span>Fees</span>
                          <span className="text-right text-foreground">
                            {formatCurrency(share.feeShareCents)}
                          </span>
                          <span>Discount</span>
                          <span className="text-right text-foreground">
                            {formatCurrency(share.discountShareCents)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
                  Receipt-level adjustments are distributed proportionally to each group&apos;s item subtotal.
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
        className="fixed inset-x-0 bottom-0 z-20 border-t-4 border-foreground bg-white px-4 py-4 sm:px-6 lg:px-8"
        style={{ bottom: footerOffset }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-foreground">
              {saveMessage ?? (isDirty ? "Unsaved changes in this receipt" : "Everything saved for now")}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {isDeleteConfirming
                ? "Delete will permanently remove this saved receipt, its line items, and its split groups."
                : validation.canSave
                ? `Save ${savePlan.saveParticipantCount} groups, ${savePlan.saveItemCount} items, ${savePlan.setAllocationCount} allocations.`
                : validation.issues[0] ?? "Finish required fields to save."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border-2 border-foreground bg-muted/50 px-4 py-2 text-sm font-black text-muted-foreground">
              Total {formatCurrency(totalCents)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-full border-2 border-foreground bg-white px-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hidden"
              onClick={scrollToSummary}
            >
              Jump to summary
            </Button>
            {warningMessage ? (
              <span className="rounded-full border-2 border-foreground bg-accent/25 px-4 py-2 text-sm font-black text-foreground">
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
                    className="h-11 rounded-full border-2 border-foreground bg-white px-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                    "h-11 rounded-full border-4 border-foreground px-5 text-sm font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0",
                    isDeleteConfirming
                      ? "bg-secondary/85 text-secondary-foreground hover:bg-secondary/75 active:bg-secondary/65"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/85 active:bg-secondary/75",
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
                      {isDeleteConfirming ? "Confirm delete" : "Delete receipt"}
                    </>
                  )}
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={!validation.canSave || !isDirty || isSaving || isDeleting}
              className="h-11 rounded-full border-4 border-foreground px-5 text-sm font-black text-primary-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save receipt
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
