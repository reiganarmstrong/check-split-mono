"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, ReceiptText, Sparkles } from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import {
  archiveDetails,
  dashboardStats,
  getReceiptAccent,
  mockReceipts,
  type MockReceipt,
} from "@/lib/mock-receipts"

function getReceiptHoverTheme(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("paid out")) {
    return {
      tile:
        "hover:border-primary/30 hover:shadow-[0_38px_96px_-40px_rgba(82,139,238,0.58)] focus-visible:border-primary/40 focus-visible:ring-primary/20",
      footerOverlay:
        "bg-[linear-gradient(135deg,oklch(0.68_0.14_248),oklch(0.56_0.16_252))]",
      footerMeta:
        "group-hover:text-white/78 group-focus-visible:text-white/78",
      button:
        "group-hover:border-white/16 group-hover:bg-white/10 group-focus-visible:border-white/16 group-focus-visible:bg-white/10",
    }
  }

  if (
    normalizedStatus.includes("unclaimed") ||
    normalizedStatus.includes("reviewing scan") ||
    normalizedStatus.includes("not assigned")
  ) {
    return {
      tile:
        "hover:border-secondary/30 hover:shadow-[0_38px_96px_-40px_rgba(247,129,94,0.6)] focus-visible:border-secondary/40 focus-visible:ring-secondary/20",
      footerOverlay:
        "bg-[linear-gradient(135deg,oklch(0.73_0.12_24),oklch(0.62_0.16_14))]",
      footerMeta:
        "group-hover:text-white/78 group-focus-visible:text-white/78",
      button:
        "group-hover:border-white/16 group-hover:bg-white/10 group-focus-visible:border-white/16 group-focus-visible:bg-white/10",
    }
  }

  return {
    tile:
      "hover:border-accent/45 hover:shadow-[0_38px_96px_-40px_rgba(234,198,74,0.62)] focus-visible:border-accent/55 focus-visible:ring-accent/20",
    footerOverlay:
      "bg-[linear-gradient(135deg,oklch(0.78_0.12_82),oklch(0.69_0.13_68))]",
    footerMeta:
      "group-hover:text-white/78 group-focus-visible:text-white/78",
    button:
      "group-hover:border-white/16 group-hover:bg-white/10 group-focus-visible:border-white/16 group-focus-visible:bg-white/10",
  }
}

type ReceiptThumbnailProps = MockReceipt & {
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

function ReceiptThumbnail({
  id,
  merchant,
  date,
  amount,
  people,
  status,
  items,
  isActive,
  onActivate,
  onDeactivate,
}: ReceiptThumbnailProps) {
  const accent = getReceiptAccent(status)
  const hoverTheme = getReceiptHoverTheme(status)

  return (
    <article>
      <Link
        href={`/dashboard/${id}`}
        aria-label={`Open receipt from ${merchant}`}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        className={`group relative block overflow-hidden rounded-[2rem] border border-slate-900/8 bg-white shadow-[0_24px_56px_-42px_rgba(31,59,133,0.38)] outline-none transition-[box-shadow,border-color,background-color] duration-200 active:bg-slate-50 focus-visible:ring-4 ${hoverTheme.tile}`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${accent} transition-[height,opacity] duration-300 group-hover:h-full group-focus-visible:h-full`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.08))] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />

        <div className="relative flex h-full flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-200 group-hover:text-foreground/78 group-focus-visible:text-foreground/78">
              Tap to open
            </p>
            <div className="rounded-full border border-slate-900/10 bg-white/95 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground shadow-sm backdrop-blur transition-colors duration-200 group-hover:bg-white/88 group-focus-visible:bg-white/88">
              {date}
            </div>
          </div>

          <div className="mb-5 rounded-[1.6rem] border border-dashed border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,255,0.98))] p-4 shadow-inner">
            <div className="flex items-start justify-between border-b border-dashed border-border/80 pb-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">
                  Receipt Scan
                </p>
                <h3 className="mt-2 text-xl font-heading font-black text-foreground">
                  {merchant}
                </h3>
              </div>
              <ReceiptText className="mt-1 h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-3 py-4">
              {items.map(({ label, amount: itemAmount }, index) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground/70">
                      0{index + 1}
                    </span>
                    <div className="h-2.5 flex-1 rounded-full bg-muted/80" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {itemAmount}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-border/80 pt-4">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Total
              </span>
              <span className="text-2xl font-heading font-black text-foreground">
                {amount}
              </span>
            </div>
          </div>

          <div
            className="relative mt-auto flex items-center justify-between gap-4 overflow-hidden rounded-[1.4rem] bg-slate-950 px-4 py-3 text-white"
          >
            <div
              className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[320ms] ease-out group-hover:opacity-100 group-focus-visible:opacity-100 ${hoverTheme.footerOverlay}`}
            />
            <div className="relative z-10">
              <p
                className={`text-xs font-bold uppercase tracking-[0.22em] text-white/60 transition-colors duration-200 ${hoverTheme.footerMeta}`}
              >
                Status
              </p>
              <p className="mt-1 text-sm font-semibold [text-shadow:0_1px_1px_rgba(0,0,0,0.14)]">{status}</p>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="text-right">
                <p
                  className={`text-xs font-bold uppercase tracking-[0.22em] text-white/60 transition-colors duration-200 ${hoverTheme.footerMeta}`}
                >
                  People
                </p>
                <p className="mt-1 text-lg font-heading font-black [text-shadow:0_1px_1px_rgba(0,0,0,0.14)]">{people}</p>
              </div>
              <div
                className={`flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-sm font-bold tracking-[0.02em] transition-[background-color,border-color,color] duration-200 ${hoverTheme.button}`}
              >
                View
                <motion.span
                  animate={isActive ? { x: [0, 3, 0] } : { x: 0 }}
                  transition={
                    isActive
                      ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.15, ease: "easeOut" }
                  }
                  className="flex"
                >
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" />
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { status } = useAuth()
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  if (status !== "authenticated") {
    return (
      <AuthSessionScreen
        title="Opening your receipt archive"
        description="Checking the browser session before loading your saved scans."
      />
    )
  }

  return (
    <main className="relative flex-1 overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]" />

        <motion.div
          aria-hidden="true"
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[8%] left-[4%] hidden h-20 w-20 rounded-full border-10 border-primary/10 sm:h-24 sm:w-24 sm:border-16 md:block md:h-32 md:w-32 xl:left-[12%]"
        />
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, 30, 0], y: [0, 15, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[14%] right-[3%] hidden h-24 w-24 rotate-12 rounded-[1.75rem] bg-secondary/10 sm:h-32 sm:w-32 md:block md:h-48 md:w-48 md:rounded-4xl xl:right-[12%]"
        />
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, -20, 0], x: [0, -20, 0], rotate: [-12, -5, -12] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[18%] left-[6%] hidden h-10 w-36 rounded-full bg-primary/5 sm:h-12 sm:w-48 md:block md:h-16 md:w-64 xl:left-[16%]"
        />
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, 30, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[8%] bottom-[10%] hidden h-16 w-16 rounded-2xl bg-accent/15 sm:h-20 sm:w-20 md:block md:h-28 md:w-28 md:rounded-3xl xl:right-[16%]"
        />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 pt-4 pb-12 sm:px-6 lg:px-8 lg:pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <motion.span
                animate={{ rotate: [0, 12, -6, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="mr-2 flex"
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
              <span>Receipt archive</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.95fr] lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-heading font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Saved receipts first.
                <span className="block text-secondary">Everything else stays compact.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Mobile and desktop both prioritize the receipt wall, so users can
                start browsing scans immediately instead of scrolling through dashboard chrome.
              </p>
            </div>

            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0">
              {[...dashboardStats, ...archiveDetails].map(({ label, value, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + index * 0.05, duration: 0.32 }}
                  className="min-w-[9.5rem] rounded-[1.5rem] border border-black/8 bg-white/70 px-4 py-3 backdrop-blur-sm lg:min-w-0"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                      {label}
                    </p>
                  </div>
                  <p className="mt-3 text-lg font-heading font-black text-foreground">
                    {value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.26em] text-primary">
              Receipt thumbnails
            </p>
            <h2 className="mt-2 text-2xl font-heading font-black text-foreground sm:text-3xl">
              Scan history as a browsable wall.
            </h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-muted-foreground sm:text-right">
            Every tile opens a receipt detail view with more scan information.
          </p>
        </div>

        {mockReceipts.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mockReceipts.map((receipt, index) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.04, duration: 0.35 }}
              >
                <ReceiptThumbnail
                  {...receipt}
                  isActive={activeReceiptId === receipt.id}
                  onActivate={() => {
                    setActiveReceiptId(receipt.id)
                  }}
                  onDeactivate={() => {
                    setActiveReceiptId((currentId) =>
                      currentId === receipt.id ? null : currentId,
                    )
                  }}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-[2.2rem] border border-dashed border-border bg-white/65 px-6 py-16 text-center shadow-[0_20px_60px_-48px_rgba(31,59,133,0.38)]"
          >
            <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">
              No scans yet
            </p>
            <h3 className="mt-4 text-3xl font-heading font-black text-foreground">
              Your receipt wall is ready.
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-muted-foreground">
              When backend data is connected, new scans can drop straight into this
              grid and keep the same thumbnail treatment, metadata row, and status badge.
            </p>
          </motion.div>
        )}
      </section>
    </main>
  )
}
