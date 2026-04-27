"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  PencilLine,
  ReceiptText,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReceiptApiError, listReceipts } from "@/lib/receipt-api";
import { formatCurrency, formatReceiptDate } from "@/lib/receipt-editor";
import type { ReceiptListItem } from "@/lib/receipt-types";
import { cn } from "@/lib/utils";

type ReceiptStatusFilter = "all" | "paid" | "unpaid";
type ReceiptSortOption =
  | "newest"
  | "oldest"
  | "largest"
  | "smallest"
  | "updated";

const statusFilterOptions: Array<{
  label: string;
  value: ReceiptStatusFilter;
}> = [
  { label: "All splits", value: "all" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Paid", value: "paid" },
];

const sortOptionLabels: Record<ReceiptSortOption, string> = {
  largest: "Largest total",
  newest: "Newest first",
  oldest: "Oldest first",
  smallest: "Smallest total",
  updated: "Recently updated",
};

function getReceiptPaymentState(receipt: ReceiptListItem) {
  if (
    receipt.participantCount > 0 &&
    receipt.paidParticipantCount === receipt.participantCount
  ) {
    return "paid";
  }

  return "unpaid";
}

function getPaymentProgressLabel(receipt: ReceiptListItem) {
  if (receipt.participantCount === 0) {
    return "No groups";
  }

  if (receipt.paidParticipantCount === receipt.participantCount) {
    return "All groups paid";
  }

  return `${receipt.paidParticipantCount} of ${receipt.participantCount} paid`;
}

function ReceiptArchiveRow({ receipt }: { receipt: ReceiptListItem }) {
  const paymentProgressLabel = getPaymentProgressLabel(receipt);
  const paymentState = getReceiptPaymentState(receipt);

  return (
    <Link
      href={`/dashboard/receipt?receiptId=${encodeURIComponent(receipt.receiptId)}`}
      className="block"
    >
      <article className="grid gap-4 rounded-[1rem] border border-[var(--line)] bg-white/90 px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(14,18,24,0.04)] md:grid-cols-[1.25fr_0.95fr_0.8fr_auto] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em]",
                paymentState === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {paymentState === "paid" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              {paymentState}
            </span>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              {paymentProgressLabel}
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            {receipt.merchantName}
          </h2>
          {receipt.locationName ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {receipt.locationName}
            </p>
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
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Updated {formatReceiptDate(receipt.updatedAt)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]">
            <ArrowRight className="h-4 w-4 text-[var(--foreground)]" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function CreateReceiptButton() {
  return (
    <Button
      asChild
      className="h-12 rounded-[0.8rem] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
    >
      <Link href="/dashboard/new">
        <PencilLine className="h-4 w-4" />
        Create new receipt
      </Link>
    </Button>
  );
}

export function ReceiptArchivePage() {
  const router = useRouter();
  const { status } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReceiptStatusFilter>("all");
  const [sortOption, setSortOption] = useState<ReceiptSortOption>("newest");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    let isActive = true;

    async function loadReceipts() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listReceipts();

        if (!isActive) {
          return;
        }

        setReceipts(response.items);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ReceiptApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to load your saved splits right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadReceipts();

    return () => {
      isActive = false;
    };
  }, [router, status]);

  if (status !== "authenticated" || isLoading) {
    return (
      <AuthSessionScreen
        title="Opening your saved splits"
        description="Loading your saved split receipts."
      />
    );
  }

  const normalizedQuery = searchValue.trim().toLowerCase();

  const filteredReceipts = receipts
    .filter((receipt) => {
      const paymentState = getReceiptPaymentState(receipt);
      const matchesStatus =
        statusFilter === "all" || paymentState === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        receipt.merchantName.toLowerCase().includes(normalizedQuery) ||
        receipt.locationName?.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    })
    .sort((left, right) => {
      switch (sortOption) {
        case "oldest":
          return (
            Date.parse(left.receiptOccurredAt) -
            Date.parse(right.receiptOccurredAt)
          );
        case "largest":
          return right.totalCents - left.totalCents;
        case "smallest":
          return left.totalCents - right.totalCents;
        case "updated":
          return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
        case "newest":
        default:
          return (
            Date.parse(right.receiptOccurredAt) -
            Date.parse(left.receiptOccurredAt)
          );
      }
    });

  const receiptGroups = [
    {
      description: "Needs follow-up or still missing paid groups.",
      items: filteredReceipts.filter(
        (receipt) => getReceiptPaymentState(receipt) === "unpaid",
      ),
      key: "unpaid" as const,
      label: "Unpaid",
    },
    {
      description: "Every group settled.",
      items: filteredReceipts.filter(
        (receipt) => getReceiptPaymentState(receipt) === "paid",
      ),
      key: "paid" as const,
      label: "Paid",
    },
  ].filter((group) => statusFilter === "all" || group.key === statusFilter);

  return (
    <main className="flex-1 pb-20 pt-8 sm:pt-10">
      <section className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-6"
        >
          <section className="border-b border-[var(--line)] pb-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
                  Saved splits
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Start a new receipt or edit an old one.
                </p>
              </div>

              <div className="flex xl:justify-end">
                <CreateReceiptButton />
              </div>
            </div>

          </section>

          <div className="workspace-panel rounded-[1rem] px-5 py-6 sm:px-6">
            <div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                  Receipts
                </p>
                <h2 className="mt-3 text-3xl leading-none text-[var(--foreground)]">
                  Recent splits
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Search merchant or location, then sort by date, total, or
                  latest changes.
                </p>
              </div>
            </div>

            <div className="workspace-line mt-6 grid gap-4 pt-6 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-center">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search merchant or location"
                  className="h-12 rounded-[0.8rem] border-[var(--line)] bg-white pl-11 pr-4 text-sm shadow-none"
                />
              </label>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                <div className="flex flex-wrap gap-2">
                  {statusFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={cn(
                        "rounded-[0.8rem] border px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition-colors",
                        statusFilter === option.value
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)] hover:text-[var(--foreground)]",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-[0.8rem] border border-[var(--line)] bg-white px-4 py-3 text-sm uppercase tracking-[0.14em] text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)] hover:text-[var(--foreground)]">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Sort</span>
                  <span className="relative ml-auto min-w-0 flex-1 pl-2">
                    <select
                      value={sortOption}
                      onChange={(event) =>
                        setSortOption(event.target.value as ReceiptSortOption)
                      }
                      className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-right text-sm font-medium text-[var(--foreground)] outline-none"
                    >
                      {Object.entries(sortOptionLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground)]" />
                  </span>
                </label>
              </div>
            </div>

            {errorMessage ? (
              <div className="workspace-line mt-5 pt-5">
                <div className="rounded-[0.9rem] border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              </div>
            ) : null}

            {receipts.length === 0 ? (
              <div className="workspace-line mt-5 pt-5">
                <div className="rounded-[1rem] border border-dashed border-[var(--line)] px-6 py-12 text-center">
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
                      className="h-12 rounded-[0.8rem] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90"
                    >
                      <Link href="/dashboard/new">Create custom receipt</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-[0.8rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                    >
                      <Link href="/dashboard/new?prompt=upload">
                        Upload receipt
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="workspace-line mt-5 pt-5">
                <div className="rounded-[1rem] border border-dashed border-[var(--line)] px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]">
                    <Search className="h-5 w-5 text-[var(--foreground)]" />
                  </div>
                  <h3 className="mt-6 text-3xl leading-none text-[var(--foreground)]">
                    No matching splits
                  </h3>
                  <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
                    Try broader search, or switch paid and unpaid filters.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchValue("");
                        setStatusFilter("all");
                        setSortOption("newest");
                      }}
                      className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-strong)]"
                    >
                      Reset filters
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="workspace-line mt-6 space-y-6 pt-6">
                {receiptGroups.map((group, groupIndex) => {
                  if (group.items.length === 0) {
                    return null;
                  }

                  const groupTotal = group.items.reduce(
                    (sum, receipt) => sum + receipt.totalCents,
                    0,
                  );

                  return (
                    <motion.section
                      key={group.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.06, duration: 0.24 }}
                      className="space-y-4"
                    >
                      <div
                        className={cn(
                          "flex flex-col gap-3 rounded-[1rem] border px-4 py-4 sm:flex-row sm:items-end sm:justify-between",
                          group.key === "paid"
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-amber-200 bg-amber-50",
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {group.key === "paid" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Clock3 className="h-4 w-4 text-amber-600" />
                            )}
                            <h3 className="text-xl font-semibold text-[var(--foreground)]">
                              {group.label}
                            </h3>
                          </div>
                          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                            {group.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-2">
                            {group.items.length} splits
                          </span>
                          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-2">
                            {formatCurrency(groupTotal)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {group.items.map((receipt, index) => (
                          <motion.div
                            key={receipt.receiptId}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: groupIndex * 0.06 + index * 0.03,
                              duration: 0.2,
                            }}
                          >
                            <ReceiptArchiveRow receipt={receipt} />
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
