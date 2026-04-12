"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  Camera,
  LayoutList,
  PencilLine,
  ReceiptText,
} from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  ReceiptApiError,
  listReceipts,
} from "@/lib/receipt-api"
import { formatCurrency, formatReceiptDate } from "@/lib/receipt-editor"
import type { ReceiptListItem } from "@/lib/receipt-types"
import { cn } from "@/lib/utils"

function getArchiveTone(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("draft")) {
    return {
      badge: "bg-primary text-primary-foreground",
      surface: "bg-[color-mix(in_oklab,var(--color-primary)_11%,white)]",
      edge: "bg-primary",
      arrow: "bg-primary text-primary-foreground",
    }
  }

  if (
    normalizedStatus.includes("saved") ||
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("final")
  ) {
    return {
      badge: "bg-primary text-primary-foreground",
      surface: "bg-[color-mix(in_oklab,var(--color-primary)_11%,white)]",
      edge: "bg-primary",
      arrow: "bg-primary text-primary-foreground",
    }
  }

  if (normalizedStatus.includes("open")) {
    return {
      badge: "bg-primary text-primary-foreground",
      surface: "bg-[color-mix(in_oklab,var(--color-primary)_14%,white)]",
      edge: "bg-primary",
      arrow: "bg-primary text-primary-foreground",
    }
  }

  return {
    badge: "bg-[color-mix(in_oklab,var(--color-primary)_18%,white)] text-foreground",
    surface: "bg-[color-mix(in_oklab,var(--color-primary)_10%,white)]",
    edge: "bg-primary",
    arrow: "bg-primary text-primary-foreground",
  }
}

function ReceiptArchiveRow({ receipt }: { receipt: ReceiptListItem }) {
  const tone = getArchiveTone(receipt.status)
  const showStatusBadge = receipt.status !== "DRAFT"

  return (
    <Link href={`/dashboard/${receipt.receiptId}`} className="group block">
      <article
        className={cn(
          "relative grid gap-4 overflow-hidden rounded-[2.25rem] border-4 border-foreground px-5 py-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:grid-cols-[minmax(0,1.2fr)_0.8fr_0.7fr_auto] sm:items-center sm:px-6",
          tone.surface,
        )}
      >
        <div className={cn("absolute inset-y-0 left-0 w-3 border-r-4 border-foreground", tone.edge)} />
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Receipt
          </p>
          <h2 className="mt-2 text-2xl font-heading font-black leading-tight text-foreground sm:text-[2rem]">
            {receipt.merchantName}
          </h2>
          {receipt.locationName ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {receipt.locationName}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Occurred
          </p>
          <p className="mt-2 text-base font-black text-foreground">
            {formatReceiptDate(receipt.receiptOccurredAt)}
          </p>
        </div>

        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
            Total
          </p>
          <p className="mt-2 text-2xl font-heading font-black leading-none text-foreground">
            {formatCurrency(receipt.totalCents)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          {showStatusBadge ? (
            <div
              className={cn(
                "rounded-full border-2 border-foreground px-4 py-2 text-xs font-black uppercase tracking-[0.24em]",
                tone.badge,
              )}
            >
              {receipt.status}
            </div>
          ) : null}
          <div
            className={cn(
              "rounded-full border-2 border-foreground p-3 transition-transform group-hover:translate-x-1",
              tone.arrow,
            )}
          >
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
    <main className="relative -mt-28 flex-1 overflow-hidden bg-background pb-24 pt-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:42px_42px] opacity-[0.06]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]"
        >
          <div className="relative overflow-hidden rounded-[3rem] border-4 border-foreground bg-white px-6 py-6 sm:px-8 sm:py-8 xl:col-span-2">
            <h1 className="max-w-4xl text-4xl font-heading font-black leading-[0.95] tracking-tight text-foreground sm:text-6xl xl:text-[4.5rem]">
              Your receipt archive.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
              Open drafts, check totals, and keep moving.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="-translate-y-[2px] h-14 rounded-full border-4 border-foreground bg-primary px-6 text-base font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-0 hover:bg-primary/90 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/dashboard/new">
                  <PencilLine className="h-4 w-4" />
                  Create custom receipt
                </Link>
              </Button>
              <button
                type="button"
                disabled
                className="flex h-14 items-center gap-3 rounded-full border-4 border-dashed border-foreground bg-muted/60 px-5 text-sm font-black text-muted-foreground"
              >
                <Camera className="h-4 w-4" />
                Upload receipt scan
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="mt-6"
        >
          <div className="grid gap-px overflow-hidden rounded-[2rem] border-4 border-foreground bg-foreground sm:grid-cols-3">
            <div className="bg-[color-mix(in_oklab,var(--color-primary)_14%,white)] px-5 py-4">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Saved receipts
              </p>
              <p className="mt-2 text-3xl font-heading font-black leading-none text-foreground">
                {receipts.length}
              </p>
            </div>
            <div className="bg-[color-mix(in_oklab,var(--color-secondary)_14%,white)] px-5 py-4">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Draft receipts
              </p>
              <p className="mt-2 text-3xl font-heading font-black leading-none text-foreground">
                {draftCount}
              </p>
            </div>
            <div className="bg-[color-mix(in_oklab,var(--color-accent)_24%,white)] px-5 py-4">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Updated this month
              </p>
              <p className="mt-2 text-3xl font-heading font-black leading-none text-foreground">
                {recentCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          className="mt-8 rounded-[3rem] border-4 border-foreground bg-white px-5 py-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sm:px-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Receipt workspace
              </p>
              <h2 className="mt-2 text-3xl font-heading font-black leading-none text-foreground sm:text-4xl">
                Recent receipts
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-accent/30 px-4 py-2 text-sm font-black text-foreground">
              <LayoutList className="h-4 w-4" />
              Sorted newest first
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-[1.8rem] border-4 border-foreground bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {receipts.length === 0 ? (
            <div className="mt-6 rounded-[2.5rem] border-4 border-dashed border-foreground bg-muted/60 px-6 py-14 text-center">
              <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border-4 border-foreground bg-secondary/15">
                <ReceiptText className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="mt-6 text-3xl font-heading font-black leading-none text-foreground">
                No receipts saved yet
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-muted-foreground">
                Create one, assign groups, and save it here.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  asChild
                  className="-translate-y-[2px] rounded-full border-4 border-foreground bg-primary px-5 font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ease-out hover:translate-x-[2px] hover:translate-y-0 hover:bg-primary/90 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Link href="/dashboard/new">Create custom receipt</Link>
                </Button>
                <button
                  type="button"
                  disabled
                  className="rounded-full border-4 border-dashed border-foreground bg-white px-5 py-2.5 text-sm font-black text-muted-foreground"
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
                  transition={{ delay: 0.04 * index, duration: 0.25 }}
                >
                  <ReceiptArchiveRow receipt={receipt} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </section>
    </main>
  )
}
