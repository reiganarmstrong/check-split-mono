"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, ReceiptText, Sparkles, Navigation, Camera } from "lucide-react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import {
  dashboardStats,
  mockReceipts,
  type MockReceipt,
} from "@/lib/mock-receipts"

type PlayfulTheme = {
  card: string
  shadow: string
  badge: string
  text: string
  icon: string
  border: string
  iconShell: string
  actionShell: string
  avatar: string
}

function getPlayfulTheme(status: string): PlayfulTheme {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("paid out")) {
    return {
      card: "bg-primary/20 border-primary",
      shadow: "shadow-[6px_6px_0px_0px_var(--color-primary)] hover:shadow-[2px_2px_0px_0px_var(--color-primary)]",
      badge: "bg-primary text-primary-foreground",
      text: "text-primary",
      icon: "text-primary",
      border: "border-primary",
      iconShell: "bg-white border-border",
      actionShell: "bg-white",
      avatar: "bg-primary text-primary-foreground",
    }
  }

  if (
    normalizedStatus.includes("unclaimed") ||
    normalizedStatus.includes("reviewing scan") ||
    normalizedStatus.includes("not assigned")
  ) {
    return {
      card: "bg-secondary/20 border-secondary",
      shadow: "shadow-[6px_6px_0px_0px_var(--color-secondary)] hover:shadow-[2px_2px_0px_0px_var(--color-secondary)]",
      badge: "bg-secondary text-secondary-foreground",
      text: "text-secondary",
      icon: "text-secondary",
      border: "border-secondary",
      iconShell: "bg-white border-border",
      actionShell: "bg-white",
      avatar: "bg-secondary text-secondary-foreground",
    }
  }

  return {
    card: "bg-accent/20 border-accent",
    shadow: "shadow-[6px_6px_0px_0px_var(--color-accent)] hover:shadow-[2px_2px_0px_0px_var(--color-accent)]",
    badge: "bg-accent text-white",
    text: "text-accent",
    icon: "text-accent",
    border: "border-accent",
    iconShell: "bg-white border-border",
    actionShell: "bg-white",
    avatar: "bg-accent text-white",
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
  const theme = getPlayfulTheme(status)

  return (
    <article>
      <Link
        href={`/dashboard/${id}`}
        aria-label={`Open receipt from ${merchant}`}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        className="block touch-manipulation outline-none"
      >
        <motion.div
          whileHover={{ y: 4, x: 4 }}
          whileTap={{ y: 6, x: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 520, damping: 24 }}
          className={`group flex h-full flex-col rounded-3xl border-4 p-5 transition-[box-shadow,background-color] duration-150 ease-out ${theme.card} ${theme.shadow}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badge}`}>
                {status}
              </span>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm ${theme.iconShell}`}>
              <ReceiptText className={`h-5 w-5 ${theme.icon}`} />
            </div>
          </div>

          {/* Receipt Body */}
          <div className="flex-1 bg-white border-2 border-border rounded-2xl p-4 mb-4 relative overflow-hidden">
            {/* Wavy edge top decoration */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMiI+PHBhdGggZD0iTTEwIDEyTDAgMGgyMGwtMTAgMTJ6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] opacity-20 repeat-x background-size-[20px]" />
            
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
              {date}
            </p>
            <h3 className="text-2xl font-heading font-black text-foreground leading-tight mt-1 mb-4">
              {merchant}
            </h3>

            <div className="space-y-2 mb-4">
              {items.slice(0, 3).map(({ label, amount: itemAmount }) => (
                <div key={label} className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground truncate pr-4">{label}</span>
                  <span className="font-bold whitespace-nowrap">{itemAmount}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-xs text-muted-foreground font-bold text-center mt-2">
                  + {items.length - 3} more items
                </p>
              )}
            </div>

            <div className="pt-3 border-t-2 border-dashed border-border flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="text-2xl font-heading font-black text-foreground">{amount}</span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center -space-x-2">
              {/* Fake user avatars representing 'people' count */}
              {Array.from({ length: Math.min(people, 4) }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-black ${theme.avatar} opacity-${100 - i * 15}`}
                >
                  !
                </div>
              ))}
              {people > 4 && (
                <div className="border-2 border-white rounded-full bg-muted w-[auto] px-2 h-8 flex items-center justify-center text-xs font-bold text-muted-foreground z-10">
                  +{people - 4}
                </div>
              )}
            </div>
            
            <div className={`rounded-full border-2 p-2 ${theme.border} ${theme.actionShell}`}>
              <motion.div
                animate={isActive ? { x: [0, 5, 0] } : { x: 0 }}
                transition={
                  isActive
                    ? { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.2 }
                    : { duration: 0.18 }
                }
              >
                <ArrowRight className={`h-5 w-5 ${theme.icon}`} />
              </motion.div>
            </div>
          </div>
        </motion.div>
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
        description="Just checking to make sure you're cool before loading your scans."
      />
    )
  }

  return (
    <main className="relative -mt-28 flex-1 overflow-x-hidden bg-background pt-28">
      {/* Playful Background Blobs & Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], borderRadius: ["40%", "60%", "40%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-[var(--color-blob-1)] opacity-20 blur-3xl rounded-full"
        />
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -20, 0], borderRadius: ["60%", "40%", "60%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-[var(--color-blob-2)] opacity-20 blur-3xl rounded-full"
        />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="w-full flex flex-col items-center text-center lg:items-start lg:text-left mb-16"
        >
          <div className="inline-flex items-center rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary mb-6 shadow-sm">
            <motion.span
              animate={{ rotate: [-10, 10, -10] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mr-2 flex"
            >
              <Sparkles className="h-5 w-5 fill-primary" />
            </motion.span>
            <span>Your Receipt Archive</span>
          </div>

          <h1 className="text-4xl font-heading font-black tracking-tight text-foreground sm:text-5xl lg:text-7xl mb-6 max-w-3xl">
            All your snaps, <br className="hidden lg:block"/>
            <span className="text-secondary relative inline-block">
              in one messy pile.
              <svg className="absolute -bottom-2 w-full h-3 text-accent -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 15 100 5 L 100 10 L 0 10 Z" fill="currentColor"/>
              </svg>
            </span>
          </h1>
          
          <p className="max-w-xl text-base font-medium leading-relaxed text-muted-foreground lg:text-lg">
            We put the receipt wall front and center so you can instantly hop back into splitting bills. Tap a scan to see who owes what!
          </p>
        </motion.div>

        {/* Bubbly Stats Row */}
        <div className="flex gap-4 overflow-x-auto pb-6 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide py-2">
          {[...dashboardStats].map(({ label, value, icon: Icon }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8, rotate: index % 2 === 0 ? -3 : 3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              whileHover={{ rotate: index % 2 === 0 ? 2 : -2 }}
              whileFocus={{ rotate: index % 2 === 0 ? 2 : -2 }}
              viewport={{ once: true }}
              transition={{
                default: { type: "spring", stiffness: 540, damping: 24 },
                opacity: { delay: 0.1 + index * 0.1, type: "spring", bounce: 0.5 },
                scale: { delay: 0.1 + index * 0.1, type: "spring", bounce: 0.5 },
                rotate: { type: "spring", stiffness: 540, damping: 24 },
              }}
              className="min-w-[140px] flex-shrink-0 rounded-3xl border-4 border-foreground bg-white px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Icon className="h-6 w-6 text-foreground mb-3" />
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">
                {label}
              </p>
              <p className="text-3xl font-heading font-black text-foreground">
                {value}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-heading font-black text-foreground">Recent Scans</h2>
          <button className="flex items-center gap-2 rounded-full border-2 border-border bg-white px-4 py-2 text-sm font-bold shadow-sm transition-colors duration-150 ease-out hover:bg-muted/50">
            <Navigation className="h-4 w-4" />
            Filter
          </button>
        </div>

        {mockReceipts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockReceipts.map((receipt, index) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05, type: "spring", bounce: 0.4 }}
              >
                <ReceiptThumbnail
                  {...receipt}
                  isActive={activeReceiptId === receipt.id}
                  onActivate={() => setActiveReceiptId(receipt.id)}
                  onDeactivate={() => setActiveReceiptId((current) => current === receipt.id ? null : current)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-[3rem] border-4 border-dashed border-primary/30 bg-primary/5 px-6 py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary/20 border-4 border-secondary flex items-center justify-center mb-6">
              <Camera className="h-10 w-10 text-secondary" />
            </div>
            <h3 className="text-3xl font-heading font-black text-foreground mb-3">
              Nothing to see here... yet!
            </h3>
            <p className="max-w-md text-lg font-medium text-muted-foreground mb-8">
              Start snapping your receipts to easily split logic with friends. We&apos;ll handle the math (and the awkwardness).
            </p>
            <button className="rounded-full bg-primary px-8 py-4 text-lg font-black text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-[transform,box-shadow,background-color] duration-150 ease-out hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]">
              Snap a Receipt
            </button>
          </motion.div>
        )}
      </section>
    </main>
  )
}
