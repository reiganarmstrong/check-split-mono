"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  Camera,
  FolderClock,
  LayoutList,
  PencilLine,
  ReceiptText,
  ScanSearch,
} from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  ReceiptApiError,
  getReceiptRegion,
  listReceipts,
} from "@/lib/receipt-api"
import { formatCurrency, formatReceiptDate } from "@/lib/receipt-editor"
import type { ReceiptListItem } from "@/lib/receipt-types"

function ArchiveStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-white/80 px-5 py-4 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
      <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-heading font-black text-foreground">{value}</p>
    </div>
  )
}

function ReceiptArchiveRow({ receipt }: { receipt: ReceiptListItem }) {
  return (
    <Link href={`/dashboard/${receipt.receiptId}`} className="group block">
      <article className="grid gap-4 rounded-[2rem] border border-border/70 bg-white/85 px-5 py-5 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] transition-transform duration-200 hover:-translate-y-1 sm:grid-cols-[1.3fr_0.8fr_0.6fr_auto] sm:items-center">
        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
            Receipt
          </p>
          <h2 className="mt-2 text-2xl font-heading font-black text-foreground">
            {receipt.merchantName}
          </h2>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {receipt.locationName ?? "Manual receipt"}
          </p>
        </div>

        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
            Occurred
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {formatReceiptDate(receipt.receiptOccurredAt)}
          </p>
        </div>

        <div>
          <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
            Total
          </p>
          <p className="mt-2 text-2xl font-heading font-black text-foreground">
            {formatCurrency(receipt.totalCents)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="rounded-full border border-border/80 bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
            {receipt.status}
          </div>
          <div className="rounded-full border border-border/70 bg-foreground p-3 text-background transition-transform group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </article>
    </Link>
  )
}

export function ReceiptArchivePage() {
  const router = useRouter()
  const { status } = useAuth()
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    if (status !== "authenticated") {
      return
    }

    let isActive = true

    async function loadReceipts() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await listReceipts()

        if (!isActive) {
          return
        }

        setReceipts(response.items)
      } catch (error) {
        if (!isActive) {
          return
        }

        if (error instanceof ReceiptApiError) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage("Unable to load your receipt archive right now.")
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadReceipts()

    return () => {
      isActive = false
    }
  }, [router, status])

  if (status !== "authenticated" || isLoading) {
    return (
      <AuthSessionScreen
        title="Opening your receipt archive"
        description="Loading the latest receipts in your account."
      />
    )
  }

  const draftCount = receipts.filter((receipt) => receipt.status === "DRAFT").length
  const recentCount = receipts.filter((receipt) => {
    const occurredAt = new Date(receipt.receiptOccurredAt)
    const now = new Date()
    return (
      occurredAt.getFullYear() === now.getFullYear() &&
      occurredAt.getMonth() === now.getMonth()
    )
  }).length

  return (
    <main className="relative -mt-28 flex-1 overflow-hidden bg-background pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.03]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-muted-foreground shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)]">
              <FolderClock className="h-4 w-4" />
              Live archive
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-heading font-black tracking-tight text-foreground sm:text-6xl">
              Manual receipts, saved where your split work actually lives.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Build and revise receipt drafts against your AppSync data model, then reopen them whenever the group needs another pass.
            </p>
          </div>

          <div className="rounded-[2.4rem] border border-border/70 bg-white/80 p-6 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
              Actions
            </p>
            <div className="mt-5 space-y-3">
              <Button asChild className="h-auto w-full justify-between rounded-full px-5 py-4 text-left text-base font-bold">
                <Link href="/dashboard/new">
                  <span className="inline-flex items-center gap-3">
                    <PencilLine className="h-4 w-4" />
                    New custom receipt
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-full border border-dashed border-border/80 bg-background/70 px-5 py-4 text-left text-base font-bold text-muted-foreground opacity-80"
              >
                <span className="inline-flex items-center gap-3">
                  <Camera className="h-4 w-4" />
                  Upload receipt scan
                </span>
                <span className="rounded-full border border-border/80 bg-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em]">
                  WIP
                </span>
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Upload-based parsing is visible here intentionally, but still disabled while the OCR workflow is being built.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Region {getReceiptRegion()}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          <ArchiveStat label="Saved receipts" value={String(receipts.length)} />
          <ArchiveStat label="Draft receipts" value={String(draftCount)} />
          <ArchiveStat label="Updated this month" value={String(recentCount)} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="mt-12"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.28em] text-muted-foreground">
                Receipt workspace
              </p>
              <h2 className="mt-2 text-3xl font-heading font-black text-foreground">
                Recent drafts and saved checks
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/75 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)] md:inline-flex">
              <LayoutList className="h-4 w-4" />
              Sorted newest first
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-[2rem] border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {receipts.length === 0 ? (
            <div className="mt-6 rounded-[2.6rem] border border-dashed border-border/80 bg-white/80 px-6 py-16 text-center shadow-[0_18px_48px_-28px_rgba(15,23,42,0.35)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-background">
                <ReceiptText className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="mt-6 text-3xl font-heading font-black text-foreground">
                No receipts saved yet
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Start with a custom receipt, assign groups to each line, and save the draft back to DynamoDB through AppSync.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="rounded-full px-5">
                  <Link href="/dashboard/new">Create custom receipt</Link>
                </Button>
                <button
                  type="button"
                  disabled
                  className="rounded-full border border-dashed border-border/80 px-5 py-2.5 text-sm font-bold text-muted-foreground"
                >
                  Upload parsing in progress
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {receipts.map((receipt, index) => (
                <motion.div
                  key={receipt.receiptId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.25 }}
                >
                  <ReceiptArchiveRow receipt={receipt} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <ScanSearch className="h-4 w-4" />
            This page is backed by the authenticated user&apos;s live AppSync receipt list.
          </div>
        </motion.div>
      </section>
    </main>
  )
}
