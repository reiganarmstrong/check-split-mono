"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeft, MapPin, ReceiptText, Users } from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { getMockReceipt, getReceiptAccent } from "@/lib/mock-receipts"

export default function ReceiptDetailPage() {
  const params = useParams<{ receiptId: string }>()
  const router = useRouter()
  const { status } = useAuth()

  const receipt = getMockReceipt(params.receiptId)
  const accent = receipt ? getReceiptAccent(receipt.status) : ""

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  if (status !== "authenticated") {
    return (
      <AuthSessionScreen
        title="Opening receipt details"
        description="Checking the browser session before loading the selected scan."
      />
    )
  }

  if (!receipt) {
    return (
      <main className="relative flex-1 overflow-hidden bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2.2rem] border border-dashed border-border bg-white/70 px-6 py-16 text-center shadow-[0_24px_70px_-48px_rgba(31,59,133,0.38)]">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">
            Receipt not found
          </p>
          <h1 className="mt-4 text-3xl font-heading font-black text-foreground">
            That scan is not in this mock archive.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-muted-foreground">
            The dashboard link is pointing to a receipt id that does not exist in the
            current UI data set.
          </p>
          <Link href="/dashboard" className="mt-8 inline-flex">
            <Button className="rounded-full px-6">Back to dashboard</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex-1 overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-size-[34px_34px]" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 -z-10 m-auto h-[280px] w-[280px] rounded-full bg-primary/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[360px] w-[360px] translate-x-1/4 translate-y-1/4 rounded-full bg-secondary/20 blur-[120px]" />

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/72 px-4 py-2 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to receipts
          </Link>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">
                Receipt detail
              </p>
              <h1 className="mt-3 text-4xl font-heading font-black tracking-tight text-foreground sm:text-5xl">
                {receipt.merchant}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {receipt.note}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full border border-black/8 bg-white/72 px-4 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm">
                  {receipt.date}
                </div>
                <div className="rounded-full border border-black/8 bg-white/72 px-4 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm">
                  {receipt.status}
                </div>
                <div className="rounded-full border border-black/8 bg-white/72 px-4 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm">
                  Total {receipt.amount}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.6rem] border border-black/8 bg-white/72 px-5 py-4 backdrop-blur-sm">
                <MapPin className="h-5 w-5 text-secondary" />
                <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  Location
                </p>
                <p className="mt-2 text-lg font-heading font-black text-foreground">
                  {receipt.location}
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/8 bg-white/72 px-5 py-4 backdrop-blur-sm">
                <Users className="h-5 w-5 text-secondary" />
                <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  People
                </p>
                <p className="mt-2 text-lg font-heading font-black text-foreground">
                  {receipt.people} in group
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-black/8 bg-white/72 px-5 py-4 backdrop-blur-sm">
                <ReceiptText className="h-5 w-5 text-secondary" />
                <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  Scanned at
                </p>
                <p className="mt-2 text-lg font-heading font-black text-foreground">
                  {receipt.scannedAt}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="rounded-[2rem] border border-slate-900/8 bg-white px-5 py-5 shadow-[0_24px_60px_-46px_rgba(31,59,133,0.42)]">
            <div className={`mb-4 h-28 rounded-[1.6rem] bg-gradient-to-br ${accent}`} />
            <div className="rounded-[1.6rem] border border-dashed border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,255,0.98))] p-4 shadow-inner">
              <div className="flex items-start justify-between border-b border-dashed border-border/80 pb-3">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-primary">
                    Saved scan
                  </p>
                  <h2 className="mt-2 text-2xl font-heading font-black text-foreground">
                    {receipt.merchant}
                  </h2>
                </div>
                <div className="rounded-full border border-slate-900/10 bg-white/95 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-foreground shadow-sm">
                  {receipt.date}
                </div>
              </div>

              <div className="space-y-3 py-4">
                {receipt.items.map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground/70">
                        0{index + 1}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {item.amount}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-border/80 pt-4">
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Total
                </span>
                <span className="text-2xl font-heading font-black text-foreground">
                  {receipt.amount}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/8 bg-white/72 px-6 py-6 shadow-[0_22px_70px_-52px_rgba(31,59,133,0.38)] backdrop-blur-sm">
            <p className="text-sm font-black uppercase tracking-[0.26em] text-primary">
              Parsed items
            </p>
            <h2 className="mt-3 text-3xl font-heading font-black text-foreground">
              What this receipt contains.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              This detail screen is ready for richer backend data later, including OCR output,
              item ownership, and split status per line item.
            </p>

            <div className="mt-6 space-y-3">
              {receipt.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[1.4rem] border border-black/8 bg-background/70 px-4 py-4"
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">
                      Line item
                    </p>
                    <p className="mt-1 text-lg font-heading font-black text-foreground">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-lg font-heading font-black text-foreground">
                    {item.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
