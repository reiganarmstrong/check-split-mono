"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, startTransition } from "react"
import { motion } from "motion/react"
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Camera,
  GripVertical,
  LoaderCircle,
  MapPin,
  Plus,
  ReceiptText,
  Save,
  Sparkles,
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

function SectionShell({
  children,
  title,
  eyebrow,
  icon: Icon,
}: {
  children: React.ReactNode
  title: string
  eyebrow: string
  icon: typeof ReceiptText
}) {
  return (
    <section className="rounded-[2.4rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-border/70 bg-background p-2.5">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-heading font-black text-foreground">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
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
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span
        className={
          emphasis
            ? "text-xl font-heading font-black text-foreground"
            : "text-sm font-semibold text-foreground"
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
      className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border/80 bg-background text-foreground hover:bg-muted"
      }`}
    >
      {label}
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
      ? "border-primary/25 bg-primary/10 text-primary"
      : tone === "warning"
        ? "border-accent/30 bg-accent/20 text-foreground"
        : "border-destructive/30 bg-destructive/10 text-destructive"

  return (
    <div className={`rounded-[1.6rem] border px-4 py-3 text-sm font-medium ${className}`}>
      {message}
    </div>
  )
}

export function ReceiptWorkspace({ receiptId }: { receiptId?: string }) {
  const router = useRouter()
  const { status } = useAuth()
  const [editorState, setEditorState] = useState<ReceiptEditorState>(() =>
    createEmptyReceiptEditorState(),
  )
  const [sourceReceipt, setSourceReceipt] = useState<Receipt | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(receiptId))
  const [isMissing, setIsMissing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)

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
      setErrorMessage(null)
      return
    }

    const targetReceiptId: string = currentReceiptId

    let isActive = true

    async function loadReceipt() {
      setIsLoading(true)
      setErrorMessage(null)
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

        if (error instanceof ReceiptApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage("Unable to load this receipt.")
        }
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

  const validation = getReceiptEditorValidation(editorState)
  const savePlan = buildReceiptSavePlan(editorState, sourceReceipt)
  const isDirty = isMeaningfullyDirty(editorState, sourceReceipt)
  const subtotalCents = getReceiptSubtotalCents(editorState)
  const totalCents = getReceiptTotalCents(editorState)
  const groupShares = getGroupShareSummaries(editorState)

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

  function moveGroup(groupId: string, direction: -1 | 1) {
    setSaveMessage(null)
    setEditorState((current) => {
      const nextGroups = [...current.groups]
      const currentIndex = nextGroups.findIndex((group) => group.id === groupId)
      const nextIndex = currentIndex + direction

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextGroups.length) {
        return current
      }

      const [group] = nextGroups.splice(currentIndex, 1)
      nextGroups.splice(nextIndex, 0, group)

      return {
        ...current,
        groups: nextGroups,
      }
    })
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
    } catch {
      setWarningMessage(
        "This receipt changed while you were editing. Reload the page and try again.",
      )
    }
  }

  async function handleSave() {
    if (isSaving || !validation.canSave) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
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
          setErrorMessage(error.message)
        }
      } else {
        setErrorMessage("Unable to save your receipt right now.")
      }
    } finally {
      setIsSaving(false)
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
        <div className="w-full max-w-xl rounded-[2.4rem] border border-border/70 bg-white/85 px-8 py-12 text-center shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-background">
            <AlertCircle className="h-8 w-8 text-foreground" />
          </div>
          <h1 className="mt-6 text-4xl font-heading font-black text-foreground">
            Receipt not found
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            This receipt either does not exist in your account or is no longer available.
          </p>
          <Button asChild className="mt-8 rounded-full px-5">
            <Link href="/dashboard">Back to archive</Link>
          </Button>
        </div>
      </main>
    )
  }

  const heading = editorState.merchantName.trim() || (receiptId ? "Receipt draft" : "New manual receipt")

  return (
    <main className="relative -mt-28 flex-1 overflow-hidden bg-background pb-32 pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.03]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button asChild variant="outline" className="rounded-full bg-white/80 px-4">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to archive
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)]">
                {editorState.status}
              </div>
              <button
                type="button"
                disabled
                className="rounded-full border border-dashed border-border/80 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground"
              >
                Upload parsing WIP
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)]">
                <Sparkles className="h-4 w-4" />
                Manual split workspace
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-heading font-black tracking-tight text-foreground sm:text-6xl">
                {heading}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Create the receipt exactly how the group remembers it, assign every line to one or more named groups, and save the draft back into your account.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="rounded-full border border-border/70 bg-white/75 px-4 py-2">
                  {formatReceiptDate(editorState.receiptOccurredAt || new Date().toISOString())}
                </div>
                <div className="rounded-full border border-border/70 bg-white/75 px-4 py-2">
                  {editorState.groups.length} group{editorState.groups.length === 1 ? "" : "s"}
                </div>
                <div className="rounded-full border border-border/70 bg-white/75 px-4 py-2">
                  {editorState.items.length} item{editorState.items.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="rounded-[2.4rem] border border-border/70 bg-white/85 p-6 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] backdrop-blur lg:sticky lg:top-28 lg:self-start"
            >
              <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
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

              <div className="mt-8 border-t border-border/60 pt-6">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
                  Group share preview
                </p>
                <div className="mt-4 space-y-3">
                  {editorState.groups.map((group) => {
                    const share = groupShares.find((entry) => entry.groupId === group.id)?.amountCents ?? 0

                    return (
                      <div
                        key={group.id}
                        className="flex items-center justify-between rounded-[1.4rem] border border-border/70 bg-background/70 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{group.displayName || "Untitled group"}</p>
                          <p className="text-xs text-muted-foreground">Items only</p>
                        </div>
                        <p className="font-heading text-xl font-black text-foreground">
                          {formatCurrency(share)}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Item subtotals split evenly across the selected groups. Tax, tip, fees, and receipt-level discounts stay editable on the receipt itself.
                </p>
              </div>
            </motion.aside>
          </div>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {warningMessage ? <EditorNotice tone="warning" message={warningMessage} /> : null}
            {errorMessage ? <EditorNotice tone="error" message={errorMessage} /> : null}
            {saveMessage ? <EditorNotice tone="success" message={saveMessage} /> : null}

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
              <SectionShell title="Receipt details" eyebrow="Metadata" icon={ReceiptText}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Merchant</span>
                    <Input
                      value={editorState.merchantName}
                      onChange={(event) => updateField("merchantName", event.target.value)}
                      placeholder="The place that got paid"
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Receipt date</span>
                    <Input
                      type="datetime-local"
                      value={editorState.receiptOccurredAt}
                      onChange={(event) => updateField("receiptOccurredAt", event.target.value)}
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Location name</span>
                    <Input
                      value={editorState.locationName}
                      onChange={(event) => updateField("locationName", event.target.value)}
                      placeholder="Optional neighborhood or venue note"
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Currency</span>
                    <Input
                      value={editorState.currencyCode}
                      onChange={(event) => updateField("currencyCode", event.target.value.toUpperCase())}
                      className="h-12 rounded-2xl bg-background/70 px-4 uppercase"
                      maxLength={3}
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-foreground">Address or note</span>
                    <Textarea
                      value={editorState.locationAddress}
                      onChange={(event) => updateField("locationAddress", event.target.value)}
                      placeholder="Optional address, table note, or context for the receipt"
                      className="min-h-28 rounded-[1.8rem] bg-background/70"
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-[2rem] border border-dashed border-border/80 bg-background/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Upload-based parsing</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Keep the upload path visible while the OCR pipeline is under construction.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="rounded-full border border-dashed border-border/80 bg-white px-4 py-2 text-sm font-bold text-muted-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Upload receipt
                      </span>
                    </button>
                  </div>
                </div>
              </SectionShell>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
              <SectionShell title="Split groups" eyebrow="Participants" icon={Users}>
                <div className="space-y-4">
                  {editorState.groups.map((group, index) => (
                    <div
                      key={group.id}
                      className="rounded-[2rem] border border-border/70 bg-background/60 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                          Group {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => moveGroup(group.id, -1)}
                            disabled={index === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => moveGroup(group.id, 1)}
                            disabled={index === editorState.groups.length - 1}
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                            onClick={() => removeGroup(group.id)}
                            disabled={editorState.groups.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-foreground">Group name</span>
                          <Input
                            value={group.displayName}
                            onChange={(event) => updateGroup(group.id, { displayName: event.target.value })}
                            placeholder="Alex + Sam"
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-foreground">Member notes</span>
                          <Input
                            value={group.notes}
                            onChange={(event) => updateGroup(group.id, { notes: event.target.value })}
                            placeholder="Optional names or notes"
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 rounded-full bg-white px-5"
                  onClick={addGroup}
                >
                  <Plus className="h-4 w-4" />
                  Add group
                </Button>
              </SectionShell>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
              <SectionShell title="Items and assignment" eyebrow="Line items" icon={MapPin}>
                <div className="space-y-5">
                  {editorState.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-[2rem] border border-border/70 bg-background/60 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2">
                          <div className="rounded-full border border-border/80 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                            Item {index + 1}
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">
                            {formatCurrency(getItemLineSubtotalCents(item))}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 md:col-span-2">
                          <span className="text-sm font-semibold text-foreground">Description</span>
                          <Input
                            value={item.description}
                            onChange={(event) => updateItem(item.id, { description: event.target.value })}
                            placeholder="Shared fries"
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-foreground">Category</span>
                          <Input
                            value={item.category}
                            onChange={(event) => updateItem(item.id, { category: event.target.value })}
                            placeholder="Optional"
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-foreground">Quantity</span>
                          <Input
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-foreground">Unit price</span>
                          <Input
                            inputMode="decimal"
                            value={item.unitPrice}
                            onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })}
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-foreground">Line discount</span>
                          <Input
                            inputMode="decimal"
                            value={item.discount}
                            onChange={(event) => updateItem(item.id, { discount: event.target.value })}
                            className="h-12 rounded-2xl bg-white px-4"
                          />
                        </label>
                      </div>

                      <div className="mt-5 rounded-[1.6rem] border border-border/70 bg-white px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-semibold text-foreground">Assign this item to group(s)</p>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
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
                  className="mt-5 rounded-full bg-white px-5"
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </SectionShell>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
              <SectionShell title="Adjustments" eyebrow="Totals" icon={Save}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Tax</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.tax}
                      onChange={(event) => updateField("tax", event.target.value)}
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Tip</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.tip}
                      onChange={(event) => updateField("tip", event.target.value)}
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Fee</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.fee}
                      onChange={(event) => updateField("fee", event.target.value)}
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-foreground">Discount</span>
                    <Input
                      inputMode="decimal"
                      value={editorState.discount}
                      onChange={(event) => updateField("discount", event.target.value)}
                      className="h-12 rounded-2xl bg-background/70 px-4"
                    />
                  </label>
                </div>
              </SectionShell>
            </motion.div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </section>

      <motion.div
        initial={{ y: 96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-white/92 px-4 py-4 backdrop-blur sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isDirty ? "Unsaved changes in this receipt" : "Everything saved for now"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {validation.canSave
                ? `Save plan: ${savePlan.saveParticipantCount} group updates, ${savePlan.saveItemCount} item updates, ${savePlan.setAllocationCount} allocation updates.`
                : validation.issues[0] ?? "Finish the required fields before saving."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {warningMessage ? (
              <span className="rounded-full border border-accent/40 bg-accent/20 px-4 py-2 text-sm font-semibold text-foreground">
                Review latest version before saving again
              </span>
            ) : null}
            <span className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-muted-foreground">
              Total {formatCurrency(totalCents)}
            </span>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={!validation.canSave || !isDirty || isSaving}
              className="h-11 rounded-full px-5 text-sm font-bold"
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
