"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { getReceipt } from "@/lib/receipt-api";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  href?: string;
  isCurrent?: boolean;
  label: string;
};

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
  const breadcrumbs: BreadcrumbItem[] =
    status === "authenticated"
      ? [
          {
            href: isSavedSplitsPage ? undefined : "/dashboard",
            isCurrent: isSavedSplitsPage,
            label: "Saved splits",
          },
          ...(isNewReceiptPage
            ? [{ isCurrent: true, label: "New receipt" }]
            : []),
          ...(isSavedReceiptEditPage
            ? [
                {
                  isCurrent: true,
                  label: activeReceiptTitle || "Receipt draft",
                },
              ]
            : []),
        ]
      : [];

  function renderBreadcrumbs({
    mobile = false,
  }: {
    mobile?: boolean;
  }) {
    return breadcrumbs.map((item, index) => (
      <div
        key={`${mobile ? "mobile" : "desktop"}-${item.label}-${index}`}
        className={cn("flex min-w-0 items-center", mobile ? "gap-1" : "gap-1 md:gap-2")}
      >
        {index > 0 ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
        ) : null}

        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              "rounded-full text-[var(--muted-foreground)] underline-offset-4 transition-[color,text-decoration-color] hover:text-[var(--foreground)] hover:underline hover:decoration-[var(--foreground)]",
              mobile ? "px-1.5 py-1 text-xs" : "px-1.5 py-1.5 sm:px-2",
            )}
          >
            {item.label}
          </Link>
        ) : (
          <span
            aria-current={item.isCurrent ? "page" : undefined}
            className={cn(
              "block truncate rounded-full font-medium underline decoration-[var(--foreground)] decoration-1 underline-offset-4",
              mobile ? "max-w-32 px-1.5 py-1 text-xs" : "max-w-28 px-1.5 py-1.5 sm:max-w-40 sm:px-2 md:max-w-56",
              item.isCurrent
                ? "text-[var(--foreground)]"
                : "text-[var(--muted-foreground)]",
            )}
          >
            {item.label}
          </span>
        )}
      </div>
    ));
  }

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: isNavVisible ? 0 : -120, opacity: isNavVisible ? 1 : 0.92 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="sticky top-0 z-50 px-3 py-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto w-full max-w-[86rem]">
        <div className="topbar-surface rounded-[1.6rem] px-3 py-3 sm:px-5">
          <div className="flex min-h-[4.5rem] items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={homeHref} className="flex items-center">
                <BrandLogo showIcon={false} />
              </Link>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
              {status === "authenticated" ? (
                <nav
                  aria-label="Breadcrumb"
                  className="hidden min-w-0 flex-1 items-center justify-start gap-1 px-2 text-xs sm:flex sm:text-sm md:gap-2"
                >
                  {renderBreadcrumbs({ mobile: false })}
                </nav>
              ) : null}

              <div className="flex shrink-0 items-center gap-2">
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
                        "panel-surface-strong inline-flex h-11 max-w-[min(22rem,calc(100vw-2rem))] cursor-pointer items-center gap-3 px-4 text-left text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_10%,white)]",
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
                        <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleSignOut()}
                        disabled={isSigningOut}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#ff0000] px-4 text-sm font-medium text-[#fff8f6] transition-colors hover:bg-[#cc0000] disabled:opacity-60"
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

          {status === "authenticated" && breadcrumbs.length > 0 ? (
            <nav
              aria-label="Breadcrumb"
              className="workspace-line mt-1 flex min-w-0 items-center justify-start gap-1 overflow-x-auto px-1 pt-3 text-xs sm:hidden"
            >
              {renderBreadcrumbs({ mobile: true })}
            </nav>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}
