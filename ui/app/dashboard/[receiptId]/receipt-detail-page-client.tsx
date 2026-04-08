"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  ReceiptText,
  ScanSearch,
  Tag,
  Users,
} from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { getMockReceipt } from "@/lib/mock-receipts"

function getPlayfulTheme(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("paid out")) {
    return {
      card: "bg-primary/20 border-primary",
      badge: "bg-primary text-primary-foreground",
      text: "text-primary",
      shadow: "shadow-[4px_4px_0px_0px_var(--color-primary)]",
      parsedCardBorder: "border-foreground",
      pillSurface: "border-primary bg-primary/10 text-primary",
      softSurface: "bg-primary/12",
      iconSurface: "bg-primary/20 border-primary",
      iconText: "text-primary",
      panelShadow: "shadow-[8px_8px_0px_0px_var(--color-primary)]",
    }
  }

  if (
    normalizedStatus.includes("unclaimed") ||
    normalizedStatus.includes("reviewing scan") ||
    normalizedStatus.includes("not assigned")
  ) {
    return {
      card: "bg-secondary/20 border-secondary",
      badge: "bg-secondary text-secondary-foreground",
      text: "text-secondary",
      shadow: "shadow-[4px_4px_0px_0px_var(--color-secondary)]",
      parsedCardBorder: "border-foreground",
      pillSurface: "border-secondary bg-secondary/10 text-secondary",
      softSurface: "bg-secondary/12",
      iconSurface: "bg-secondary/20 border-secondary",
      iconText: "text-secondary",
      panelShadow: "shadow-[8px_8px_0px_0px_var(--color-secondary)]",
    }
  }

  return {
    card: "bg-accent/20 border-accent",
    badge: "bg-accent text-accent-foreground",
    text: "text-accent-foreground",
    shadow: "shadow-[4px_4px_0px_0px_var(--color-accent)]",
    parsedCardBorder: "border-accent",
    pillSurface: "border-accent bg-accent/20 text-accent-foreground",
    softSurface: "bg-accent/24",
    iconSurface: "bg-accent/30 border-accent",
    iconText: "text-accent-foreground",
    panelShadow: "shadow-[8px_8px_0px_0px_var(--color-accent)]",
  }
}

function parseCurrency(amount: string) {
  const normalizedAmount = Number(amount.replace(/[^0-9.-]+/g, ""))

  return Number.isNaN(normalizedAmount) ? 0 : normalizedAmount
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getStatusSummary(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("paid out")) {
    return {
      eyebrow: "Settlement complete",
      title: "Everyone on this check is squared away.",
      detail: "Keep this scan as your final receipt record and reopen it any time.",
    }
  }

  if (normalizedStatus.includes("unclaimed")) {
    return {
      eyebrow: "Needs attention",
      title: "A couple of items still need owners.",
      detail: "Review the open lines and assign them before you settle the total.",
    }
  }

  if (normalizedStatus.includes("reviewing scan")) {
    return {
      eyebrow: "Review pending",
      title: "The scan still needs a quick cleanup pass.",
      detail: "Double-check the OCR lines before sharing the split with the group.",
    }
  }

  return {
    eyebrow: "Ready for the group",
    title: "Everything is lined up for the next split step.",
    detail: "Open the parsed lines below and keep moving through assignment.",
  }
}

type ReceiptDetailPageClientProps = {
  receiptId: string
}

export function ReceiptDetailPageClient({
  receiptId,
}: ReceiptDetailPageClientProps) {
  const router = useRouter()
  const { status } = useAuth()

  const receipt = getMockReceipt(receiptId)
  const theme = receipt ? getPlayfulTheme(receipt.status) : null
  const totalAmount = receipt ? parseCurrency(receipt.amount) : 0
  const estimatedShare = receipt ? totalAmount / receipt.people : 0
  const statusSummary = receipt ? getStatusSummary(receipt.status) : null

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  if (status !== "authenticated") {
    return (
      <AuthSessionScreen
        title="Opening receipt details"
        description="Grabbing your scan for you..."
      />
    )
  }

  if (!receipt || !theme) {
    return (
      <main className="relative -mt-28 flex flex-1 items-center justify-center overflow-hidden bg-background px-4 py-10 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-[3rem] border-4 border-foreground bg-white px-8 py-16 text-center shadow-[8px_8px_0px_0px_var(--color-primary)]">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-secondary bg-secondary/20">
            <ReceiptText className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="mt-4 text-4xl font-heading font-black text-foreground">
            Scan not found.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium leading-7 text-muted-foreground">
            Looks like this receipt has vanished into the void. It&apos;s either
            deleted or doesn&apos;t exist.
          </p>
          <Link href="/dashboard" className="mt-8 inline-block">
            <Button className="h-auto rounded-full px-8 py-6 text-lg font-black transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative -mt-28 flex-1 overflow-hidden bg-background pt-28">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            borderRadius: ["40%", "60%", "40%"],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[5%] -right-[10%] h-[500px] w-[500px] rounded-full bg-[var(--color-blob-1)] opacity-20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
            borderRadius: ["60%", "40%", "60%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-[var(--color-blob-2)] opacity-20 blur-3xl"
        />
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to wall
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className={`mb-4 inline-flex items-center rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm ${theme.pillSurface}`}>
                Scan Review
              </div>
              <h1 className="mb-4 text-5xl font-heading font-black tracking-tight text-foreground sm:text-6xl">
                {receipt.merchant}
              </h1>
              <p className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
                {receipt.note}
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <div
                  className={`rounded-full border-2 border-foreground px-5 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${theme.badge}`}
                >
                  {receipt.status}
                </div>
                <div className="rounded-full border-2 border-foreground bg-white px-5 py-2 text-sm font-black text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Total {receipt.amount}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className={`mt-8 overflow-hidden rounded-[2.6rem] border-4 border-foreground bg-white ${theme.shadow}`}
              >
                <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="border-b-4 border-border px-6 py-6 lg:border-r-4 lg:border-b-0 lg:px-7 lg:py-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border-2 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] ${theme.pillSurface}`}>
                        Split snapshot
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                        {statusSummary?.eyebrow}
                      </span>
                    </div>

                    <h2 className="mt-4 max-w-xl text-2xl font-heading font-black leading-tight text-foreground sm:text-3xl">
                      {statusSummary?.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-base font-medium leading-7 text-muted-foreground">
                      {statusSummary?.detail}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className={`rounded-[1.8rem] border-2 border-foreground px-4 py-4 ${theme.softSurface}`}
                      >
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                          Est. share
                        </p>
                        <p className="mt-2 text-2xl font-heading font-black text-foreground">
                          {formatCurrency(estimatedShare)}
                        </p>
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className={`rounded-[1.8rem] border-2 border-foreground px-4 py-4 ${theme.softSurface}`}
                      >
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                          Parsed lines
                        </p>
                        <p className="mt-2 text-2xl font-heading font-black text-foreground">
                          {receipt.items.length}
                        </p>
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className={`rounded-[1.8rem] border-2 border-foreground px-4 py-4 ${theme.softSurface}`}
                      >
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                          Diners
                        </p>
                        <p className="mt-2 text-2xl font-heading font-black text-foreground">
                          {receipt.people}
                        </p>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between px-6 py-6 lg:px-7 lg:py-7">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border-2 border-foreground bg-foreground p-2 text-background">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-muted-foreground">
                            Next move
                          </p>
                          <p className="mt-1 text-lg font-heading font-black text-foreground">
                            Keep the split moving.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between rounded-full border-2 border-foreground bg-background/70 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-full border-2 p-2 ${theme.iconSurface}`}>
                              <ScanSearch className={`h-4 w-4 ${theme.iconText}`} />
                            </div>
                            <span className="text-sm font-bold text-foreground">
                              Review parsed lines
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="flex items-center justify-between rounded-full border-2 border-foreground bg-background/70 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-full border-2 p-2 ${theme.iconSurface}`}>
                              <Users className={`h-4 w-4 ${theme.iconText}`} />
                            </div>
                            <span className="text-sm font-bold text-foreground">
                              Assign to {receipt.people} diners
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-foreground" />
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-sm font-medium leading-6 text-muted-foreground lg:mt-8">
                      This estimate splits the full total evenly. Taxes, tips, and
                      item ownership can still shift once the receipt is finalized.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className={`rounded-3xl border-4 border-foreground bg-white px-5 py-5 transition-transform hover:rotate-2 ${theme.panelShadow}`}>
                <div className="mb-2 flex items-center gap-3">
                  <div className={`rounded-full border-2 p-2 ${theme.iconSurface}`}>
                    <MapPin className={`h-5 w-5 ${theme.iconText}`} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    Location
                  </p>
                </div>
                <p className="ml-1 mt-2 text-xl font-heading font-black text-foreground">
                  {receipt.location}
                </p>
              </div>
              <div className={`rounded-3xl border-4 border-foreground bg-white px-5 py-5 transition-transform hover:-rotate-2 ${theme.panelShadow}`}>
                <div className="mb-2 flex items-center gap-3">
                  <div className={`rounded-full border-2 p-2 ${theme.iconSurface}`}>
                    <Users className={`h-5 w-5 ${theme.iconText}`} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    Group
                  </p>
                </div>
                <p className="ml-1 mt-2 text-xl font-heading font-black text-foreground">
                  {receipt.people} members
                </p>
              </div>
              <div className={`rounded-3xl border-4 border-foreground bg-white px-5 py-5 transition-transform hover:rotate-1 ${theme.panelShadow}`}>
                <div className="mb-2 flex items-center gap-3">
                  <div className={`rounded-full border-2 p-2 ${theme.iconSurface}`}>
                    <ReceiptText className={`h-5 w-5 ${theme.iconText}`} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    Scanned at
                  </p>
                </div>
                <p className="ml-1 mt-2 text-xl font-heading font-black text-foreground">
                  {receipt.scannedAt}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, type: "spring", bounce: 0.4 }}
          className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]"
        >
          <div
            className={`relative overflow-hidden rounded-[3rem] border-4 p-6 ${theme.shadow} ${theme.card} ${theme.parsedCardBorder}`}
          >
            <div className="absolute top-0 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMiI+PHBhdGggZD0iTTEwIDEyTDAgMGgyMGwtMTAgMTJ6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] bg-[length:24px] bg-repeat-x opacity-30" />

            <div className="mt-4 rounded-[2rem] border-2 border-border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-end justify-between border-b-2 border-dashed border-border pb-4">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-widest ${theme.text}`}
                  >
                    Parsed Scan
                  </p>
                  <h2 className="mt-1 text-3xl font-heading font-black leading-none text-foreground">
                    {receipt.merchant}
                  </h2>
                </div>
                <div className="rounded-full border-2 border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground">
                  {receipt.date}
                </div>
              </div>

              <div className="space-y-4 py-2">
                {receipt.items.map((item, index) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm font-bold text-muted-foreground">
                      0{index + 1}.
                    </span>
                    <p className="flex-1 border-b-2 border-dotted border-border/50 pb-1 font-mono text-base font-bold text-foreground">
                      {item.label}
                    </p>
                    <span className="font-mono text-lg font-black text-foreground">
                      {item.amount}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-foreground pt-4">
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                  Total
                </span>
                <span className="text-4xl font-heading font-black text-foreground">
                  {receipt.amount}
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-[3rem] border-4 border-foreground bg-white px-8 py-8 ${theme.panelShadow}`}>
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 ${theme.iconSurface}`}>
              <Tag className={`h-5 w-5 ${theme.iconText}`} />
              <span className={`text-sm font-black uppercase tracking-widest ${theme.iconText}`}>
                Breakdown
              </span>
            </div>

            <h2 className="text-4xl font-heading font-black text-foreground">
              What&apos;s on the bill.
            </h2>
            <p className="mt-4 text-lg font-medium leading-relaxed text-muted-foreground">
              This screen will soon hold richer features like OCR fixes,
              assigning items to friends, and settling up directly.
            </p>

            <div className="mt-8 space-y-4">
              {receipt.items.map((item, i) => (
                <motion.div
                  key={item.label}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between rounded-3xl border-2 border-foreground bg-muted/30 px-6 py-5 shadow-sm transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-lg font-bold text-background">
                      {i + 1}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Line item
                      </p>
                      <p className="text-xl font-heading font-black text-foreground">
                        {item.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-heading font-black text-foreground">
                    {item.amount}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
