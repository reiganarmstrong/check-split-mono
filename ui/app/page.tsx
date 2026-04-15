"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight, Camera, ChevronDown, Coins, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

const savedSplitFigureRows = [
  { title: "Bar Clara", state: "Unpaid", amount: "$84.20" },
  { title: "Cafe Orchard", state: "Unpaid", amount: "$41.65" },
  { title: "Late Lunch Club", state: "Paid", amount: "$63.18" },
];

function SectionReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AbstractReceiptHero() {
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-[34rem] items-center justify-center">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [2, 0, 2] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 w-[17rem] sm:w-[19rem]"
      >
        <div className="overflow-hidden rounded-[2.2rem] border border-[var(--line)] bg-white px-5 py-5 text-[var(--foreground)] shadow-[var(--shadow-strong)]">
          <div className="border-b border-dashed border-[var(--line)] pb-4">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Receipt
            </p>
            <h3 className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
              Bistro 77
            </h3>
          </div>

          <div className="space-y-4 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="h-3 w-28 rounded-full bg-[var(--muted)]" />
              <div className="h-6 w-18 rounded-full bg-[var(--primary)]" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="h-3 w-20 rounded-full bg-[var(--muted)]" />
              <div className="h-6 w-24 rounded-full bg-[var(--secondary)]" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="h-3 w-32 rounded-full bg-[var(--muted)]" />
              <div className="h-6 w-16 rounded-full bg-[var(--accent)]" />
            </div>
          </div>

          <div className="border-t border-dashed border-[var(--line)] pt-4">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Split total
            </p>
            <p className="mt-2 text-4xl font-semibold leading-none text-[var(--foreground)]">
              $104.50
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], x: [0, -4, 0], rotate: [-10, -4, -10] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 top-12 z-30 rounded-[1.4rem] bg-[var(--secondary)] px-5 py-4 text-[var(--secondary-foreground)] shadow-[var(--shadow-soft)]"
      >
        <Users className="h-9 w-9" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -14, 0], x: [0, 8, 0], rotate: [10, 4, 10] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-2 z-10 rounded-[1.6rem] bg-[var(--accent)] px-5 py-5 text-[var(--accent-foreground)] shadow-[var(--shadow-soft)]"
      >
        <Coins className="h-10 w-10" />
      </motion.div>

      <div className="absolute -left-2 bottom-24 h-20 w-20 rounded-full bg-[var(--primary)]/16" />
      <div className="absolute right-16 top-2 h-12 w-12 rounded-full bg-[var(--accent)]/24" />
    </div>
  );
}

function ParseReceiptFigure() {
  return (
    <div className="relative rounded-[2.2rem] border border-[var(--line)] bg-[#f8f8f3] p-5 shadow-[0_18px_40px_rgba(14,18,24,0.06)] sm:p-6">
      <div className="relative grid gap-5 lg:grid-cols-[0.9fr_0.46fr] lg:items-center">
        <div className="relative rounded-[2rem] border border-[var(--line)] bg-white px-5 py-5 shadow-[0_18px_38px_rgba(14,18,24,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Live parse
              </p>
              <p className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
                Receipt scan
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[var(--line)] bg-white">
              <Camera className="h-5 w-5 text-[var(--foreground)]" />
            </div>
          </div>

          <div className="relative mt-6 h-[17rem] overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-white px-5 py-5">
            <div className="flex h-full flex-col justify-between opacity-90">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-12 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-32 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-14 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-10 rounded-full bg-[var(--muted)]" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-28 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-11 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-22 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-13 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-30 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-12 rounded-full bg-[var(--muted)]" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-18 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-10 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-26 rounded-full bg-[var(--muted)]" />
                  <div className="h-3 w-14 rounded-full bg-[var(--muted)]" />
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-[var(--line)] pt-4">
                  <div className="h-3 w-16 rounded-full bg-[var(--muted)]" />
                  <div className="h-4 w-18 rounded-full bg-[var(--foreground)]/18" />
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-4 top-7 h-11 rounded-[1rem] border border-[var(--secondary)] bg-[var(--secondary)]/18" />
            <div className="pointer-events-none absolute inset-x-8 top-[5.5rem] h-11 rounded-[1rem] border border-[var(--accent)] bg-[var(--accent)]/18" />
            <div className="pointer-events-none absolute inset-x-6 top-[9.2rem] h-9 rounded-[1rem] border border-[var(--foreground)]/18" />
            <div className="pointer-events-none absolute inset-x-0 top-[46%] h-px bg-[var(--foreground)]/16" />
            <motion.div
              animate={{ y: [0, 208, 0] }}
              transition={{
                duration: 4.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute inset-x-3 top-10 h-1.5 rounded-full bg-[var(--foreground)]/80 shadow-[0_0_24px_rgba(19,24,31,0.18)]"
            />
          </div>
        </div>

        <div className="hidden gap-3 lg:grid">
          <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--secondary)] px-4 py-4 text-[var(--secondary-foreground)] shadow-[0_12px_26px_rgba(14,18,24,0.04)]">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">
              Items found
            </p>
            <p className="mt-2 text-3xl font-semibold leading-none">8</p>
          </div>
          <div className="rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-4 shadow-[0_12px_26px_rgba(14,18,24,0.04)]">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Extracted
            </p>
            <div className="mt-3 space-y-2">
              <div className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
                Tax $3.10
              </div>
              <div className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
                Tip $4.00
              </div>
              <div className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)]">
                Total $104.50
              </div>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-[var(--line)] bg-white px-4 py-4 shadow-[0_12px_26px_rgba(14,18,24,0.04)]">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Detected line
            </p>
            <p className="mt-2 text-2xl font-semibold leading-none text-[var(--foreground)]">
              House noodles
            </p>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              $18.50 ready for assignment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MakeGroupsFigure() {
  return (
    <div className="relative rounded-[2.2rem] border border-[var(--line)] bg-[#f8f8f3] p-5 shadow-[0_18px_40px_rgba(14,18,24,0.06)] sm:p-6">
      <div className="relative grid gap-5 lg:grid-cols-[0.34fr_1fr] lg:items-center">
        <div className="flex flex-wrap gap-3 lg:block lg:space-y-3">
          {[
            {
              name: "Alex",
              tone: "bg-[var(--foreground)] text-[var(--background)]",
            },
            {
              name: "Nina",
              tone: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
            },
            {
              name: "June",
              tone: "bg-[var(--accent)] text-[var(--accent-foreground)]",
            },
            { name: "Kai", tone: "bg-white text-[var(--foreground)]" },
          ].map((person) => (
            <div
              key={person.name}
              className={`w-fit rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium shadow-[0_8px_18px_rgba(14,18,24,0.04)] ${person.tone}`}
            >
              {person.name}
            </div>
          ))}
        </div>

        <div className="rounded-[1.9rem] border border-[var(--line)] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(14,18,24,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Make groups
              </p>
              <p className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
                Assign people
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[var(--line)] bg-[#f8f8f3]">
              <Users className="h-5 w-5 text-[var(--foreground)]" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-3">
              <div className="rounded-[1.3rem] border border-[var(--line)] px-4 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Couple tab
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    {
                      name: "Alex",
                      tone: "bg-[var(--foreground)] text-[var(--background)]",
                    },
                    { name: "Nina", tone: "bg-white text-[var(--foreground)]" },
                  ].map((person, index) => (
                    <motion.span
                      key={person.name}
                      animate={{
                        x: [0, index % 2 === 0 ? 5 : -5, 0],
                        y: [0, index % 2 === 0 ? -2 : 2, 0],
                      }}
                      transition={{
                        duration: 6.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.7,
                      }}
                      className={`rounded-full border border-[var(--foreground)] px-3 py-2 text-sm font-medium ${person.tone}`}
                    >
                      {person.name}
                    </motion.span>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-[var(--line)] px-4 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Team tab
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { name: "June", tone: "bg-white text-[var(--foreground)]" },
                    {
                      name: "Maya",
                      tone: "bg-[var(--foreground)] text-[var(--background)]",
                    },
                    { name: "Kai", tone: "bg-white text-[var(--foreground)]" },
                  ].map((person, index) => (
                    <motion.span
                      key={person.name}
                      animate={{
                        x: [0, index === 1 ? 6 : -4, 0],
                        y: [0, index === 1 ? -2 : 2, 0],
                      }}
                      transition={{
                        duration: 7.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.55,
                      }}
                      className={`rounded-full border border-[var(--foreground)] px-3 py-2 text-sm font-medium ${person.tone}`}
                    >
                      {person.name}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:w-36">
              <div className="rounded-[1.2rem] bg-[var(--secondary)] px-4 py-4 text-[var(--secondary-foreground)]">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">
                  Groups
                </p>
                <p className="mt-2 text-3xl font-semibold leading-none">2</p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--accent)] px-4 py-4 text-[var(--accent-foreground)]">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">
                  People
                </p>
                <p className="mt-2 text-3xl font-semibold leading-none">5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedSplitsFigure() {
  return (
    <div className="relative rounded-[2.4rem] border border-[var(--line)] bg-[#f8f8f3] px-6 py-8 shadow-[0_20px_44px_rgba(14,18,24,0.06)] sm:px-8 sm:py-10">
      <div className="relative grid gap-10 lg:grid-cols-[0.56fr_1fr] lg:items-center">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-1">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Unpaid
            </p>
            <p className="mt-3 text-6xl font-semibold leading-none text-[var(--foreground)] sm:text-7xl">
              $125
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Paid
            </p>
            <p className="mt-3 text-6xl font-semibold leading-none text-[var(--foreground)] sm:text-7xl">
              $63
            </p>
          </div>
        </div>

        <div className="relative mx-auto h-[23rem] w-full max-w-[28rem]">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-10 top-2 rotate-[-5deg] transform-gpu rounded-[1.8rem] border border-[var(--line)] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(14,18,24,0.04)]"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Paid stack
            </p>
            <p className="mt-3 text-2xl font-semibold leading-none text-[var(--foreground)]">
              Late Lunch Club
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)]">
                Paid
              </span>
              <span className="text-xl font-medium text-[var(--foreground)]">
                $63.18
              </span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 7.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-4 top-16 rotate-[3deg] transform-gpu rounded-[2rem] border border-[var(--line)] bg-white px-5 py-5 shadow-[0_18px_38px_rgba(14,18,24,0.05)]"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Open split
            </p>
            <p className="mt-3 text-2xl font-semibold leading-none text-[var(--foreground)]">
              Cafe Orchard
            </p>
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
                Unpaid
              </span>
              <span className="text-xl font-medium text-[var(--foreground)]">
                $41.65
              </span>
            </div>
          </motion.div>

          <motion.div
            animate={{ rotate: [0, 0.35, 0] }}
            transition={{ duration: 8.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 top-28 transform-gpu rounded-[2.1rem] border border-[var(--line)] bg-white px-5 py-5 shadow-[0_22px_44px_rgba(14,18,24,0.07)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Saved splits
                </p>
                <p className="mt-3 text-3xl font-semibold leading-none text-[var(--foreground)]">
                  Bar Clara
                </p>
              </div>
              <div className="rounded-[1rem] bg-[var(--secondary)] px-4 py-4 text-[var(--secondary-foreground)]">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">
                  Share
                </p>
                <p className="mt-2 text-2xl font-semibold leading-none">
                  $84.20
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {savedSplitFigureRows.map((row) => (
                <div
                  key={row.title}
                  className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[var(--line)] px-4 py-4"
                >
                  <div>
                    <p className="text-lg font-semibold leading-none text-[var(--foreground)]">
                      {row.title}
                    </p>
                    <p className="mt-2 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      {row.state}
                    </p>
                  </div>
                  <p className="text-lg font-medium text-[var(--foreground)]">
                    {row.amount}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();
  const { scrollY } = useScroll();
  const learnMoreFadeProgress = useTransform(scrollY, [340, 460], [1, 0]);
  const learnMoreOpacity = useSpring(learnMoreFadeProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.8,
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  if (status === "authenticated") {
    return (
      <AuthSessionScreen
        title="Routing to your dashboard"
        description="Authenticated users land on saved splits instead of marketing page."
      />
    );
  }

  return (
    <main className="flex-1 pb-28">
      <section className="page-shell relative flex min-h-[calc(100svh-7rem)] items-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid w-full justify-items-center gap-12 py-8 sm:py-10 lg:-translate-y-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20"
        >
          <div className="max-w-xl text-center lg:text-left">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Receipt workspace
            </p>
            <h1 className="mt-5 text-5xl leading-[0.92] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              Split receipt costs by group.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-[var(--muted-foreground)] lg:mx-0">
              Parse receipt data. Make groups. Save clean splits.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/signup">
                <Button className="h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90">
                  Get Started Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mx-auto mt-8 hidden max-w-lg gap-4 border-t border-[var(--line)] pt-6 sm:grid sm:grid-cols-3 lg:mx-0">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Parse
                </p>
                <p className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
                  Fast
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Groups
                </p>
                <p className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
                  Easy
                </p>
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Status
                </p>
                <p className="mt-2 text-3xl font-semibold leading-none text-[var(--foreground)]">
                  Paid
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="flex w-full items-center justify-center"
          >
            <AbstractReceiptHero />
          </motion.div>
        </motion.div>

        <motion.a
          href="#learn-more"
          initial={{ opacity: 0, y: 10 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ opacity: learnMoreOpacity }}
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] lg:flex"
        >
          <span>Learn more</span>
          <span className="flex flex-col items-center justify-center leading-none">
            <ChevronDown className="h-4 w-4" />
            <ChevronDown className="-mt-2 h-4 w-4" />
          </span>
        </motion.a>
      </section>

      <section id="learn-more" className="page-shell mt-16 sm:mt-20">
        <SectionReveal className="pt-12">
          <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr] lg:items-center">
            <div className="max-w-sm">
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Parse receipt
              </p>
              <h3 className="mt-4 text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
                Turn receipt into clean line items.
              </h3>
              <p className="mt-5 max-w-xs text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                Pull totals, tax, tip, and items into a format ready for
                assigning.
              </p>
            </div>

            <ParseReceiptFigure />
          </div>
        </SectionReveal>
      </section>

      <section className="page-shell mt-32 lg:mt-40">
        <SectionReveal className="pt-12">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div className="order-1 max-w-sm lg:order-2">
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Make groups
              </p>
              <h3 className="mt-4 text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
                Split items by the people sharing them.
              </h3>
              <p className="mt-5 max-w-xs text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                Build groups for couples, friends, or a whole table before
                saving final split.
              </p>
            </div>

            <div className="order-2 lg:order-1">
              <MakeGroupsFigure />
            </div>
          </div>
        </SectionReveal>
      </section>

      <section className="page-shell mt-32 lg:mt-40">
        <SectionReveal className="pt-12">
          <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr] lg:items-center">
            <div className="max-w-sm">
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                Saved splits
              </p>
              <h3 className="mt-4 text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
                Keep every split in one place.
              </h3>
              <p className="mt-5 max-w-xs text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                Reopen unpaid receipts, check what is already settled, and keep
                split totals readable.
              </p>
            </div>

            <SavedSplitsFigure />
          </div>
        </SectionReveal>
      </section>

      <section className="page-shell mt-44 pb-16 sm:mt-52 sm:pb-24 lg:mt-60">
        <SectionReveal className="py-16 sm:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="max-w-3xl">
              <h2 className="mt-4 text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                Ready to skip the math?
              </h2>
            </div>
            <div className="mt-8 flex justify-center">
              <Link href="/signup">
                <Button className="h-12 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90">
                  Get started now
                </Button>
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>
    </main>
  );
}
