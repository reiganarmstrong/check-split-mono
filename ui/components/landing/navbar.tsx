"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { getReceipt } from "@/lib/receipt-api";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [activeReceiptTitle, setActiveReceiptTitle] = useState<string | null>(
    null,
  );
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const lastScrollYRef = useRef(0);
  const receiptId = searchParams.get("receiptId")?.trim() ?? "";

  const homeHref = status === "authenticated" ? "/dashboard" : "/";

  useEffect(() => {
    function handleReceiptTitleUpdate(event: Event) {
      const customEvent = event as CustomEvent<{
        receiptId: string;
        title: string;
      }>;

      if (customEvent.detail.receiptId !== receiptId) {
        return;
      }

      setActiveReceiptTitle(customEvent.detail.title || "Receipt draft");
    }

    window.addEventListener(
      "receipt-title-updated",
      handleReceiptTitleUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "receipt-title-updated",
        handleReceiptTitleUpdate as EventListener,
      );
    };
  }, [receiptId]);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      pathname !== "/dashboard/receipt" ||
      !receiptId
    ) {
      setActiveReceiptTitle(null);
      return;
    }

    let isActive = true;

    async function loadActiveReceiptTitle() {
      try {
        const receipt = await getReceipt(receiptId);

        if (!isActive) {
          return;
        }

        setActiveReceiptTitle(receipt?.merchantName?.trim() || "Receipt draft");
      } catch {
        if (isActive) {
          setActiveReceiptTitle("Receipt draft");
        }
      }
    }

    void loadActiveReceiptTitle();

    return () => {
      isActive = false;
    };
  }, [pathname, receiptId, status]);

  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [pathname, status]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (accountMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsAccountMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;

      if (currentScrollY <= 24) {
        setIsNavVisible(true);
      } else if (currentScrollY > previousScrollY + 8) {
        setIsNavVisible(false);
      } else if (currentScrollY < previousScrollY - 8) {
        setIsNavVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isAccountMenuOpen) {
      setIsNavVisible(true);
    }
  }, [isAccountMenuOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setIsAccountMenuOpen(false);

    try {
      await signOut();
      router.replace("/");
    } finally {
      setIsSigningOut(false);
    }
  }

  const isSavedSplitsPage = pathname === "/dashboard";
  const isNewReceiptPage = pathname === "/dashboard/new";
  const isSavedReceiptEditPage =
    pathname === "/dashboard/receipt" && receiptId.length > 0;
  const navButtonClassName =
    "inline-flex h-11 items-center rounded-[0.95rem] px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-300";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: isNavVisible ? 0 : -120, opacity: isNavVisible ? 1 : 0.92 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="sticky top-0 z-50 px-3 py-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto w-full max-w-[86rem]">
        <div className="topbar-surface flex min-h-[4.5rem] items-center justify-between rounded-[1.6rem] px-3 py-3 sm:px-5">
          <div className="flex items-center gap-4">
            <Link href={homeHref} className="flex items-center">
              <BrandLogo showIcon={false} />
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            {status === "authenticated" ? (
              <nav className="hidden items-center rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-1 md:flex">
                <Link
                  href="/dashboard"
                  aria-current={isSavedSplitsPage ? "page" : undefined}
                  className={cn(
                    navButtonClassName,
                    isSavedSplitsPage
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-[0_10px_24px_rgba(19,24,31,0.12)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]",
                  )}
                >
                  Saved splits
                </Link>
                {isSavedReceiptEditPage && activeReceiptTitle ? (
                  <Link
                    href={`/dashboard/receipt?receiptId=${encodeURIComponent(receiptId)}`}
                    aria-current="page"
                    className={cn(
                      navButtonClassName,
                      "max-w-56 bg-[var(--foreground)] text-[var(--background)] shadow-[0_10px_24px_rgba(19,24,31,0.12)]",
                    )}
                  >
                    <span className="truncate">{activeReceiptTitle}</span>
                  </Link>
                ) : null}
                <Link
                  href="/dashboard/new"
                  aria-current={isNewReceiptPage ? "page" : undefined}
                  className={cn(
                    navButtonClassName,
                    isNewReceiptPage
                      ? "bg-[var(--foreground)] text-[var(--background)] shadow-[0_10px_24px_rgba(19,24,31,0.12)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]",
                  )}
                >
                  New receipt
                </Link>
              </nav>
            ) : null}

            <div className="flex items-center gap-2">
              {status === "authenticated" ? (
                <div
                  ref={accountMenuRef}
                  className="relative inline-flex shrink-0"
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isAccountMenuOpen}
                    onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                    className={cn(
                      "panel-surface-strong inline-flex h-11 max-w-[min(22rem,calc(100vw-2rem))] items-center gap-3 px-4 text-left text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)]",
                      isAccountMenuOpen
                        ? "rounded-b-none rounded-t-[1.35rem] border-b-transparent shadow-none"
                        : "rounded-[1.35rem]",
                    )}
                  >
                    <span className="truncate">
                      {user?.email ?? user?.username}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isAccountMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    role="menu"
                    aria-label="Account actions"
                    aria-hidden={!isAccountMenuOpen}
                    className={cn(
                      "absolute right-0 top-[calc(100%-1px)] z-50 w-full origin-top-right overflow-hidden rounded-b-[1.35rem] transition-[max-height,opacity] duration-180 ease-out",
                      isAccountMenuOpen
                        ? "max-h-40 opacity-100"
                        : "pointer-events-none max-h-0 opacity-0",
                    )}
                  >
                    <div className="panel-surface-strong rounded-b-[1.35rem] border-t-0 px-4 pb-4 pt-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                        Signed in as
                      </p>
                      <p className="mt-2 break-all text-sm font-medium text-[var(--foreground)]">
                        {user?.email ?? user?.username}
                      </p>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleSignOut()}
                        disabled={isSigningOut}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#ff0000] px-4 text-sm font-medium text-[#fff8f6] transition-colors hover:bg-[#cc0000] disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" />
                        {isSigningOut ? "Signing out..." : "Sign out"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : status === "loading" ? (
                <div className="h-11 w-28 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full border border-[var(--line)] bg-[var(--surface)]" />
              ) : (
                <>
                  {pathname !== "/login" ? (
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        className="inline-flex h-11 rounded-full px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] active:bg-[color-mix(in_srgb,var(--accent)_88%,black)] active:text-[var(--accent-foreground)] focus-visible:bg-[var(--accent)] focus-visible:text-[var(--accent-foreground)] focus-visible:ring-[color-mix(in_srgb,var(--accent)_32%,transparent)]"
                      >
                        Log in
                      </Button>
                    </Link>
                  ) : null}
                  {pathname !== "/signup" ? (
                    <Link href="/signup">
                      <Button className="inline-flex h-11 rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] hover:opacity-90">
                        Sign up
                      </Button>
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
