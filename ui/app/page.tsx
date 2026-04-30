"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Camera,
  Check,
  Link2,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

const savedSplitFigurePeople = [
  { name: "Alex", amount: "$28.10" },
  { name: "Nina", amount: "$24.25" },
  { name: "June", amount: "$31.85" },
];

const receiptRows = [
  { label: "House noodles", amount: "$18.50", tone: "bg-[var(--primary)]" },
  { label: "Tea service", amount: "$12.00", tone: "bg-[var(--secondary)]" },
  { label: "Shared plates", amount: "$31.85", tone: "bg-[var(--accent)]" },
];

const workflowChrome = [
  {
    step: "01",
    rail: "bg-[#4053ff]",
    tab: "border-[#b7bfff] bg-[#eff0ff] text-[#2337d7]",
  },
  {
    step: "02",
    rail: "bg-[#86dcae]",
    tab: "border-[#b8e8cd] bg-[#e7f7ed] text-[#116149]",
  },
  {
    step: "03",
    rail: "bg-[#050506]",
    tab: "border-[#d5d7dc] bg-[#f3f4f5] text-[#13181f]",
  },
];

function SectionReveal({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.26 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#53607e]">
      {children}
    </p>
  );
}

function PrimaryCta({ label = "Get started now" }: { label?: string }) {
  return (
    <Button
      asChild
      className="h-12 rounded-[0.85rem] bg-[#050506] px-5 text-sm font-semibold text-white shadow-none hover:bg-primary/80 hover:text-white focus-visible:bg-primary/80 focus-visible:text-white"
    >
      <Link href="/signup">
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

function HeroReceiptCard() {
  return (
    <div className="relative rounded-[1rem] border border-[var(--line)] bg-white px-7 py-7 shadow-[0_24px_60px_rgba(20,28,42,0.08)]">
      <div className="border-b border-[var(--line)] pb-5">
        <Eyebrow>Receipt</Eyebrow>
        <h3 className="mt-4 text-3xl leading-none text-[var(--foreground)]">
          Bistro 77
        </h3>
      </div>

      <div className="space-y-4 py-6">
        {receiptRows.map((row, index) => (
          <motion.div
            key={row.label}
            initial={{ x: 12 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.16 + index * 0.08, duration: 0.35 }}
            className="flex items-center justify-between gap-5"
          >
            <div
              className="h-3 rounded-full bg-[#e7e9ef]"
              style={{ width: `${7.2 - index * 1.1}rem` }}
            />
            <div
              className={`h-5 w-16 rounded-full ${row.tone} shadow-[0_8px_18px_rgba(35,55,215,0.16)]`}
            />
          </motion.div>
        ))}
      </div>

      <div className="border-t border-[var(--line)] pt-5">
        <Eyebrow>Split total</Eyebrow>
        <p className="mt-4 text-4xl font-semibold leading-none text-[#050506]">
          $104.50
        </p>
      </div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-[34rem] items-center justify-center">
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [2, 0, 2] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 w-[17rem] transform-gpu sm:w-[19rem]"
      >
        <HeroReceiptCard />
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], x: [0, -4, 0], rotate: [-10, -4, -10] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 top-12 z-30 flex h-[4.4rem] w-[4.4rem] transform-gpu items-center justify-center rounded-[1.4rem] bg-[#c9c9ff] text-[#050506] shadow-[0_18px_34px_rgba(35,55,215,0.14)] sm:h-20 sm:w-20"
      >
        <Users className="h-9 w-9" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -14, 0], x: [0, 8, 0], rotate: [10, 4, 10] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-2 z-30 flex h-16 w-16 transform-gpu items-center justify-center rounded-[1.6rem] bg-[#86dcae] text-[#052113] shadow-[0_18px_34px_rgba(18,128,82,0.14)] sm:h-[4.6rem] sm:w-[4.6rem]"
      >
        <Link2 className="h-8 w-8" />
      </motion.div>

      <div className="absolute -left-2 bottom-24 h-20 w-20 rounded-full bg-[var(--primary)]/10" />
      <div className="absolute right-16 top-2 h-12 w-12 rounded-full bg-[var(--accent)]/18" />
    </div>
  );
}

function HeroProof() {
  const items = [
    { icon: Zap, label: "Fast", detail: "Scan in seconds" },
    { icon: Users, label: "Easy", detail: "Simple groups" },
    { icon: ShieldCheck, label: "Paid", detail: "Without headache" },
  ];

  return (
    <div className="mt-9 grid w-full max-w-[36rem] grid-cols-3 gap-2 border-t border-[var(--line)] pt-7 sm:gap-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="flex min-w-0 items-start justify-center gap-2 text-left sm:gap-3"
          >
            <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#4252d7] sm:h-7 sm:w-7" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--foreground)] sm:text-sm">
                {item.label}
              </p>
              <p className="mt-1 text-[0.68rem] leading-4 text-[var(--muted-foreground)] sm:mt-2 sm:text-xs sm:leading-5">
                {item.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="mt-5 space-y-3 sm:mt-8 sm:space-y-4">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-3 text-sm">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#17a765] text-white">
            <Check className="h-3 w-3" />
          </span>
          <span className="text-[var(--foreground)]">{item}</span>
        </div>
      ))}
    </div>
  );
}

function ReceiptScanFigure() {
  return (
    <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1fr_10rem]">
      <div className="rounded-[0.9rem] border border-[var(--line)] bg-white p-4 shadow-[0_16px_36px_rgba(14,18,24,0.04)] sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl leading-none text-[var(--foreground)] sm:text-3xl">
            Receipt scan
          </h3>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] sm:h-11 sm:w-11">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="relative mt-4 h-48 overflow-hidden rounded-[0.85rem] border border-[var(--line)] bg-[#fbfbfd] px-4 py-4 sm:mt-6 sm:h-[18rem] sm:px-5 sm:py-5">
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-[#eef0f4] pb-2 last:border-b-0 sm:pb-3"
              >
                <span
                  className="h-2.5 rounded-full bg-[#e6e8ef] sm:h-3"
                  style={{ width: `${4.4 + (index % 4) * 1.35}rem` }}
                />
                <span
                  className="h-2.5 rounded-full bg-[#d8dbe4] sm:h-3"
                  style={{ width: `${2.2 + (index % 3) * 0.9}rem` }}
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-8 top-16 h-7 rounded-full bg-[#efedff]/80 sm:inset-x-11 sm:top-[5.2rem] sm:h-9" />
          <div className="pointer-events-none absolute inset-x-9 top-[6.75rem] h-8 rounded-full bg-[#dff4e8]/90 sm:inset-x-12 sm:top-[9.25rem] sm:h-10" />
          <div className="landing-receipt-scan-line pointer-events-none absolute inset-x-4 top-4 h-1.5 transform-gpu rounded-full bg-[#050506]/80 shadow-[0_0_24px_rgba(5,5,6,0.2)] [--receipt-scan-travel:9.625rem] sm:top-5 sm:[--receipt-scan-travel:15.125rem]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-1">
        <div className="rounded-[0.8rem] bg-[#cfccff] p-4 text-[#050506] sm:p-5">
          <Eyebrow>Items found</Eyebrow>
          <p className="mt-2 text-2xl font-semibold leading-none sm:mt-3 sm:text-3xl">
            8
          </p>
        </div>

        <div className="order-3 col-span-2 rounded-[0.8rem] border border-[var(--line)] bg-white p-4 sm:order-none sm:col-span-1">
          <Eyebrow>Extracted</Eyebrow>
          <div className="mt-3 flex flex-wrap gap-2 text-xs sm:mt-4 sm:block sm:space-y-2 sm:text-sm">
            {["Tax $3.10", "Tip $4.00", "Total $104.50"].map((item) => (
              <p
                key={item}
                className={`rounded-full border px-3 py-1.5 sm:py-2 ${item.startsWith("Total") ? "border-[#b8e8cd] bg-[#c8efd9] text-[#116149]" : "border-[var(--line)] bg-white"}`}
              >
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="order-2 rounded-[0.8rem] border border-[var(--line)] bg-white p-4 sm:order-none sm:p-5">
          <Eyebrow>Detected line item</Eyebrow>
          <p className="mt-3 text-xl leading-tight sm:mt-4 sm:text-2xl">
            House noodles
          </p>
          <p className="mt-1.5 text-xs text-[var(--muted-foreground)] sm:mt-2 sm:text-sm">
            $18.50 ready for assignment
          </p>
        </div>
      </div>
    </div>
  );
}

function GroupIconGrid() {
  const items = [
    { label: "Couples", icon: Users, color: "text-[#4053ff]" },
    { label: "Friends", icon: Users, color: "text-[#16a765]" },
    { label: "Teams", icon: Users, color: "text-[#050506]" },
    { label: "Any group size", icon: Users, color: "text-[#ffab18]" },
  ];

  return (
    <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:mt-8 sm:gap-x-8 sm:gap-y-6">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="flex items-center gap-3">
            <Icon className={`h-7 w-7 ${item.color}`} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function AssignPeopleFigure() {
  const groups = [
    {
      label: "Couple tab",
      note: "House noodles split",
      people: [
        { name: "Alex", active: true },
        { name: "Nina", active: true },
      ],
    },
    {
      label: "Friends tab",
      note: "Shared plates ready",
      people: [
        { name: "June", active: false },
        { name: "Maya", active: false },
        { name: "Kai", active: false },
      ],
    },
  ];

  return (
    <div className="rounded-[0.9rem] border border-[var(--line)] bg-white p-4 shadow-[0_16px_36px_rgba(14,18,24,0.04)] sm:p-6 lg:min-h-[34rem]">
      <h3 className="text-2xl leading-none text-[var(--foreground)] sm:text-3xl">
        Assign people
      </h3>

      <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-5 lg:min-h-[27rem] lg:grid-cols-[1fr_0.72fr_8.5rem] lg:items-stretch">
        <div className="space-y-3 sm:space-y-4 lg:grid lg:grid-rows-2 lg:gap-4 lg:space-y-0">
          {groups.map((group) => (
            <div
              key={group.label}
              className="relative overflow-hidden rounded-[0.8rem] border border-[var(--line)] px-4 py-3 sm:px-5 sm:py-4 lg:flex lg:flex-col lg:justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Eyebrow>{group.label}</Eyebrow>
                  <p className="mt-1.5 text-xs font-medium text-[var(--muted-foreground)] sm:mt-2">
                    {group.note}
                  </p>
                </div>
                <span className="rounded-full bg-[#edf0ff] px-2.5 py-1 text-xs font-semibold text-[#4053ff]">
                  {group.people.filter((person) => person.active).length}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 lg:mt-8">
                {group.people.map((person) => (
                  <span
                    key={person.name}
                    className={`rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm ${person.active ? "bg-[#050506] text-white" : "bg-[#f7f8fb] text-[var(--foreground)]"}`}
                  >
                    {person.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="relative hidden rounded-[0.8rem] border border-[var(--line)] bg-[#fbfbfd] p-5 lg:flex lg:flex-col">
          <div className="absolute -left-5 top-1/2 h-px w-5 bg-[var(--line)]" />
          <div className="absolute -right-5 top-1/2 h-px w-5 bg-[var(--line)]" />
          <Eyebrow>Selected item</Eyebrow>
          <div className="mt-6 rounded-[0.7rem] border border-[var(--line)] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold leading-none">
                  House noodles
                </p>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                  Assigned to Couple tab
                </p>
              </div>
              <span className="rounded-full bg-[#e2f5e8] px-3 py-1.5 text-xs font-semibold text-[#116149]">
                $18.50
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[0.7rem] border border-[var(--line)] bg-white p-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Share
              </p>
              <p className="mt-2 text-xl font-semibold">$9.25</p>
            </div>
            <div className="rounded-[0.7rem] border border-[var(--line)] bg-white p-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                People
              </p>
              <p className="mt-2 text-xl font-semibold">2</p>
            </div>
          </div>
          <div className="mt-auto rounded-[0.7rem] border border-[#c5ead6] bg-[#e7f7ed] p-4 text-[#116149]">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]">
              Allocation
            </p>
            <p className="mt-2 text-sm font-semibold">
              Alex and Nina split this item evenly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-1 lg:grid-rows-2">
          {[
            ["Groups", "2"],
            ["People", "5"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[0.8rem] bg-[#cfccff] p-4 text-[#050506] sm:p-5"
            >
              <Eyebrow>{label}</Eyebrow>
              <p className="mt-2 text-2xl font-semibold leading-none sm:mt-3 sm:text-3xl">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedSplitFigure() {
  return (
    <div className="grid gap-3 sm:gap-5 md:grid-cols-[0.45fr_1fr]">
      <div className="grid grid-cols-2 gap-4 rounded-[0.9rem] border border-[var(--line)] bg-white p-4 shadow-[0_16px_36px_rgba(14,18,24,0.04)] sm:block sm:p-7">
        <div>
          <Eyebrow>Settled total</Eyebrow>
          <p className="mt-3 text-3xl font-semibold leading-none sm:mt-7 sm:text-5xl">
            $189
          </p>
        </div>
        <div>
          <Eyebrow>
            <span className="block sm:mt-12">People paid</span>
          </Eyebrow>
          <p className="mt-3 text-3xl font-semibold leading-none sm:mt-7 sm:text-5xl">
            9/9
          </p>
        </div>
      </div>

      <div className="rounded-[0.9rem] border border-[var(--line)] bg-white p-4 shadow-[0_16px_36px_rgba(14,18,24,0.04)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-5">
          <div>
            <Eyebrow>Saved split</Eyebrow>
            <h3 className="mt-3 text-2xl leading-none sm:mt-4 sm:text-3xl">
              Bar Clara
            </h3>
            <p className="mt-2 text-xs text-[var(--muted-foreground)] sm:mt-3 sm:text-sm">
              Friday dinner settled and saved.
            </p>
          </div>

          <div className="rounded-[0.8rem] bg-[#e2f5e8] px-3 py-2.5 text-[#116149] sm:px-5 sm:py-4">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] sm:text-[0.68rem] sm:tracking-[0.2em]">
              Payment status
            </p>
            <p className="mt-1.5 text-sm font-semibold sm:mt-3 sm:text-base">
              Everyone paid
            </p>
            <p className="mt-1 text-xs font-medium sm:mt-2">3 of 3 settled</p>
          </div>
        </div>

        <div className="mt-3 rounded-[0.8rem] border border-[var(--line)] sm:mt-5">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
            <div>
              <Eyebrow>Split total</Eyebrow>
              <p className="mt-1.5 text-lg font-semibold sm:mt-2 sm:text-xl">
                $84.20
              </p>
            </div>
            <span className="rounded-full bg-[#e2f5e8] px-3 py-1.5 text-xs font-semibold text-[#116149]">
              All settled
            </span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {savedSplitFigurePeople.map((person) => (
              <div
                key={person.name}
                className="flex items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#17a765]" />
                  <div>
                    <p className="text-sm font-semibold leading-none sm:text-base">
                      {person.name}
                    </p>
                    <p className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#17a765] sm:mt-2">
                      Paid
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold leading-none sm:text-base">
                    {person.amount}
                  </p>
                  <p className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:mt-2">
                    Received
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowBand({
  eyebrow,
  title,
  description,
  children,
  sidebar,
  stackIndex,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  sidebar?: ReactNode;
  stackIndex?: number;
}) {
  const isStacked = stackIndex !== undefined;
  const chrome = isStacked ? workflowChrome[stackIndex] : undefined;
  const content = (
    <section className="relative rounded-[1rem] border border-[var(--line)] bg-[#fdfdfb] p-4 pt-14 shadow-[0_16px_34px_rgba(14,18,24,0.04)] sm:p-8 sm:pt-16 lg:flex lg:h-[calc(100svh-7.75rem)] lg:min-h-[44rem] lg:items-center lg:overflow-hidden lg:pt-16">
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[1rem] border border-[var(--line)]" />
      {chrome ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden rounded-t-[1rem]">
          <div className={`absolute inset-x-0 top-0 h-2 ${chrome.rail}`} />
          <div className="absolute inset-x-0 top-2 h-px bg-white/80" />
          <div
            className={`absolute left-0 top-2 flex h-10 items-center gap-3 rounded-br-[0.85rem] border-b border-r px-5 text-[0.66rem] font-semibold uppercase tracking-[0.2em] sm:px-6 ${chrome.tab}`}
          >
            <span>{chrome.step}</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-50" />
            <span>{eyebrow}</span>
          </div>
        </div>
      ) : null}
      <div className="grid w-full gap-6 sm:gap-10 lg:grid-cols-[0.34fr_1fr] lg:items-center">
        <div>
          <h2 className="text-[2rem] leading-[0.96] text-[var(--foreground)] sm:text-5xl lg:text-[3.2rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted-foreground)] sm:mt-5 sm:text-base">
            {description}
          </p>
          {sidebar}
        </div>
        {children}
      </div>
    </section>
  );

  if (isStacked) {
    return (
      <div
        data-workflow-card
        className="lg:sticky lg:translate-y-0"
        style={{
          top: "5.75rem",
          zIndex: 20 + stackIndex,
        }}
      >
        {content}
      </div>
    );
  }

  return <SectionReveal>{content}</SectionReveal>;
}

function WorkflowProgressRail({ progress }: { progress: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-24 left-0 top-0 hidden w-7 lg:block 2xl:-left-14"
    >
      <div className="sticky top-[5.75rem] flex h-[calc(100svh-7.75rem)] min-h-[34rem] w-7 items-center justify-center">
        <div className="relative h-[78%] w-px bg-[#cdd3df]">
          <div
            className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 rounded-full bg-[#050506]"
            style={{ height: `${progress * 100}%` }}
          />
          {workflowChrome.map((item, index) => (
            <div
              key={item.step}
              className="absolute left-1/2 flex -translate-x-1/2 items-center"
              style={{ top: `${index * 50}%` }}
            >
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 border-[#fdfdfb] shadow-[0_0_0_1px_rgba(19,24,31,0.18)] ${item.rail}`}
              />
              <span className="ml-3 font-sans text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[#53607e]">
                {item.step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();
  const workflowRef = useRef<HTMLDivElement>(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  useEffect(() => {
    const workflow = workflowRef.current;

    if (!workflow) {
      return;
    }

    const workflowElement = workflow;

    function updateWorkflowProgress() {
      const cards = Array.from(
        workflowElement.querySelectorAll<HTMLElement>("[data-workflow-card]"),
      );

      if (cards.length < 3) {
        return;
      }

      const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      );
      const stickyTop = 5.75 * rootFontSize;
      const workflowStyle = window.getComputedStyle(workflowElement);
      const workflowGap = Number.parseFloat(workflowStyle.rowGap);
      const cardStep = cards[0].getBoundingClientRect().height + workflowGap;

      if (cardStep <= 0) {
        return;
      }

      const clampProgress = (value: number) => Math.max(0, Math.min(1, value));
      const secondCardDistance =
        cards[1].getBoundingClientRect().top - stickyTop;
      const thirdCardDistance =
        cards[2].getBoundingClientRect().top - stickyTop;
      const nextProgress =
        secondCardDistance > 0
          ? (1 - clampProgress(secondCardDistance / cardStep)) * 0.5
          : 0.5 + (1 - clampProgress(thirdCardDistance / cardStep)) * 0.5;

      setWorkflowProgress(clampProgress(nextProgress));
    }

    updateWorkflowProgress();
    window.addEventListener("scroll", updateWorkflowProgress, {
      passive: true,
    });
    window.addEventListener("resize", updateWorkflowProgress);

    return () => {
      window.removeEventListener("scroll", updateWorkflowProgress);
      window.removeEventListener("resize", updateWorkflowProgress);
    };
  }, []);

  if (status === "authenticated") {
    return (
      <AuthSessionScreen
        title="Routing to your dashboard"
        description="Authenticated users land on saved splits instead of marketing page."
      />
    );
  }

  return (
    <main className="flex-1 pb-4">
      <section className="relative">
        <div className="page-shell pb-10 pt-8 sm:pt-12 lg:min-h-[650px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-10"
          >
            <div className="mx-auto max-w-[42rem] text-center lg:mx-0 lg:text-left">
              <Eyebrow>Receipt workspace</Eyebrow>
              <h1 className="mx-auto mt-7 max-w-[41rem] text-6xl leading-[0.95] text-[var(--foreground)] sm:text-7xl lg:mx-0 lg:text-[5.15rem]">
                Split receipt costs by group.
              </h1>
              <p className="mx-auto mt-7 max-w-md text-base leading-7 text-[#273246] sm:text-lg lg:mx-0">
                Parse receipt data. Make groups. Save clean splits. Keep every
                item and total organized.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
                <PrimaryCta />
              </div>

              <HeroProof />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.24, ease: "easeOut" }}
            >
              <HeroVisual />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div id="features" className="page-shell pt-4">
        <div
          ref={workflowRef}
          className="relative flex flex-col gap-8 pb-16 lg:gap-32 lg:pb-24 lg:pl-12 2xl:pl-0"
        >
          <WorkflowProgressRail progress={workflowProgress} />
          <WorkflowBand
            stackIndex={0}
            eyebrow="Parse receipt"
            title="Turn receipt into clean line items."
            description="Pull totals, tax, tip, and items into a format ready for assigning."
            sidebar={
              <Checklist
                items={[
                  "Auto-detect items, prices, and totals",
                  "Edit and clean in one place",
                  "Ready for splitting",
                ]}
              />
            }
          >
            <ReceiptScanFigure />
          </WorkflowBand>

          <WorkflowBand
            stackIndex={1}
            eyebrow="Make groups"
            title="Split items by the people sharing them."
            description="Build groups for couples, friends, or a whole table before saving the final split."
            sidebar={<GroupIconGrid />}
          >
            <AssignPeopleFigure />
          </WorkflowBand>

          <WorkflowBand
            stackIndex={2}
            eyebrow="Saved splits"
            title="Keep every split in one place."
            description="Review finished dinners, confirm who paid, and keep split totals readable."
            sidebar={
              <Checklist
                items={[
                  "Saved securely",
                  "Easy to revisit",
                  "Clear payment tracking",
                ]}
              />
            }
          >
            <SavedSplitFigure />
          </WorkflowBand>
        </div>

        <SectionReveal>
          <section className="flex min-h-[21rem] items-center justify-center px-6 pb-20 pt-14 text-center sm:min-h-[23rem] sm:px-10 sm:pb-22 sm:pt-16 lg:min-h-[24rem] lg:pb-24 lg:pt-20">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <h2 className="text-4xl leading-none text-[var(--foreground)] sm:text-5xl">
                Ready to skip the math?
              </h2>
              <p className="mt-5 text-base leading-7 text-[#273246] sm:text-lg">
                Scan, split, save. Everyone pays what&apos;s fair.
              </p>
              <div className="mt-7 flex justify-center">
                <PrimaryCta />
              </div>
            </div>
          </section>
        </SectionReveal>
      </div>
    </main>
  );
}
