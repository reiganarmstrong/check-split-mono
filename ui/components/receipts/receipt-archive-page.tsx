"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { ArrowRight, Camera, PencilLine, ReceiptText } from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { ReceiptApiError, listReceipts } from "@/lib/receipt-api"
import { formatCurrency, formatReceiptDate } from "@/lib/receipt-editor"
import type { ReceiptListItem, ReceiptStatus } from "@/lib/receipt-types"
import { cn } from "@/lib/utils"

function getArchiveStatusLabel(status: ReceiptStatus) {
  if (status === "DRAFT" || status === "OPEN") {
    return "Saved"
  }

  if (status === "FINALIZED") {
    return "Finalized"
  }

  return status
}

function getArchiveTone(status: ReceiptStatus) {
  const normalizedStatus = getArchiveStatusLabel(status).toLowerCase()

  if (normalizedStatus.includes("draft")) {
    return "bg-[color-mix(in_oklab,var(--secondary)_28%,transparent)] text-[var(--secondary-foreground)]"
  }

  if (
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("saved") ||
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("final")
  ) {
    return "bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] text-[var(--accent-foreground)]"
  }

  return "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] text-[var(--foreground)]"
}

function ReceiptArchiveRow({ receipt }: { receipt: ReceiptListItem }) {
  const statusLabel = getArchiveStatusLabel(receipt.status)

  return (
    <Link href={`/dashboard/receipt?receiptId=${encodeURIComponent(receipt.receiptId)}`} className="block">
      <article className="table-row-surface grid gap-4 rounded-[1.4rem] px-5 py-5 transition-transform duration-200 hover:-translate-y-0.5 md:grid-cols-[1.15fr_0.8fr_0.7fr_auto] md:items-center">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Receipt
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            {receipt.merchantName}
          </h2>
          {receipt.locationName ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{receipt.locationName}</p>
          ) : null}
        </div>

        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Occurred
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]">
            {formatReceiptDate(receipt.receiptOccurredAt)}
          </p>
        </div>

        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Total
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {formatCurrency(receipt.totalCents)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          {statusLabel ? (
            <span
              className={cn(
                "rounded-full px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em]",
                getArchiveTone(receipt.status),
              )}
            >
              {statusLabel}
            </span>
          ) : null}
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]">
            <ArrowRight className="h-4 w-4 text-[var(--foreground)]" />
          </span>
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
          setErrorMessage("Unable to load your saved splits right now.")
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
        title="Opening your saved splits"
        description="Loading your saved split receipts."
      />
    )
  }

  const savedCount = receipts.filter((receipt) => receipt.status === "DRAFT" || receipt.status === "OPEN").length
  const recentCount = receipts.filter((receipt) => {
    const occurredAt = new Date(receipt.receiptOccurredAt)
    const now = new Date()
    return (
      occurredAt.getFullYear() === now.getFullYear() &&
      occurredAt.getMonth() === now.getMonth()
    )
  }).length

  return (
    <main className="flex-1 pb-20 pt-4">
      <section className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"
        >
          <div className="workspace-panel rounded-[2rem] px-5 py-6 sm:px-6">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Saved splits
            </p>
            <h1 className="mt-4 text-4xl leading-[0.95] text-[var(--foreground)] sm:text-5xl">
              Saved splits.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
              View later. Mark paid.
            </p>

            <div className="section-divider mt-6 flex flex-wrap gap-3 pt-6">
              <Button
                asChild
                className="h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
              >
                <Link href="/dashboard/new">
                  <PencilLine className="h-4 w-4" />
                  Create custom receipt
                </Link>
              </Button>
              <button
                type="button"
                disabled
                className="inline-flex h-12 items-center gap-2 rounded-full border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--muted-foreground)]"
              >
                <Camera className="h-4 w-4" />
                Upload parsing soon
              </button>
            </div>

            <div className="section-divider mt-6 grid gap-4 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Saved splits</span>
                <span className="font-medium text-[var(--foreground)]">{receipts.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Saved and open</span>
                <span className="font-medium text-[var(--foreground)]">{savedCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Updated this month</span>
                <span className="font-medium text-[var(--foreground)]">{recentCount}</span>
              </div>
            </div>
          </div>

          <div className="workspace-panel rounded-[2rem] px-5 py-6 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  Receipts
                </p>
                <h2 className="mt-3 text-3xl leading-none text-[var(--foreground)]">
                  Recent splits
                </h2>
              </div>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Sorted newest first
              </span>
            </div>

            {errorMessage ? (
              <div className="section-divider mt-5 pt-5">
                <div className="rounded-[1.25rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              </div>
            ) : null}

            {receipts.length === 0 ? (
              <div className="section-divider mt-5 pt-5">
                <div className="rounded-[1.6rem] border border-dashed border-[var(--line)] px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]">
                    <ReceiptText className="h-6 w-6 text-[var(--foreground)]" />
                  </div>
                  <h3 className="mt-6 text-3xl leading-none text-[var(--foreground)]">
                    No saved splits yet
                  </h3>
                  <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
                    Create one, split it by group, and it will appear here.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      asChild
                      className="h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
                    >
                      <Link href="/dashboard/new">Create custom receipt</Link>
                    </Button>
                    <button
                      type="button"
                      disabled
                      className="rounded-full border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--muted-foreground)]"
                    >
                      Upload parsing in progress
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="section-divider mt-5 space-y-3 pt-5">
                {receipts.map((receipt, index) => (
                  <motion.div
                    key={receipt.receiptId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.25 }}
                  >
                    <ReceiptArchiveRow receipt={receipt} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  )
}
