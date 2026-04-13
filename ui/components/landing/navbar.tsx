"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const homeHref = status === "authenticated" ? "/dashboard" : "/";
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

  return (
    <header className="sticky top-4 z-50 w-full px-4 pb-4 mt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between rounded-[2.5rem] border-4 border-foreground bg-white px-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform">
        <Link href={homeHref} className="mr-6 flex items-center group">
          <BrandLogo
            iconClassName="-translate-y-[2px]"
            wordmarkClassName="hidden sm:flex"
          />
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-3">
            {status === "authenticated" ? (
              <div ref={accountMenuRef} className="relative h-16">
                <div className="absolute right-0 top-1 z-50 max-w-[min(22rem,calc(100vw-2.5rem))] origin-top-right">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-[1.75rem] bg-foreground"
                  />
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[1.75rem] border-3 border-foreground bg-white transition-transform duration-200 ease-out transform-gpu",
                      isAccountMenuOpen
                        ? ""
                        : "hover:translate-x-[2px] hover:translate-y-[2px]",
                    )}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isAccountMenuOpen}
                      onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                      className="flex h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm font-bold text-foreground"
                    >
                      <span className="truncate">{user?.email ?? user?.username}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isAccountMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      role="menu"
                      aria-label="Account actions"
                      aria-hidden={!isAccountMenuOpen}
                      className={cn(
                        "overflow-hidden transition-[max-height,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isAccountMenuOpen
                          ? "max-h-48 opacity-100"
                          : "pointer-events-none max-h-0 opacity-0",
                      )}
                    >
                      <div>
                        <div className="border-t-2 border-dashed border-border px-4 pb-4 pt-3">
                          <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">
                            Signed in as
                          </p>
                          <p className="mt-1 break-all text-sm font-bold text-foreground">
                            {user?.email ?? user?.username}
                          </p>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => void handleSignOut()}
                            disabled={isSigningOut}
                            className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-full border-3 border-foreground bg-destructive px-5 text-sm font-black text-destructive-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                          >
                            <LogOut className="h-5 w-5" />
                            {isSigningOut ? "Signing out..." : "Sign out"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : status === "loading" ? (
              <div className="h-12 w-28 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full bg-muted border-2 border-border" />
            ) : (
              <>
                {pathname !== "/login" ? (
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="inline-flex h-11 rounded-full border-2 border-transparent px-4 text-sm font-black text-foreground transition-all hover:border-foreground hover:bg-primary/10 sm:h-12 sm:px-5 sm:text-base"
                    >
                      Log in
                    </Button>
                  </Link>
                ) : null}
                {pathname !== "/signup" ? (
                  <Link href="/signup" className="group/nav-cta relative inline-flex">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 translate-x-[6px] translate-y-[2px] rounded-full bg-foreground"
                    />
                    <Button className="relative z-10 translate-x-[2px] -translate-y-[2px] rounded-full border-4 border-foreground bg-primary px-6 text-base font-black text-primary-foreground transition-all hover:translate-x-1 hover:translate-y-0 hover:bg-primary/90 h-12">
                      Get Started
                    </Button>
                  </Link>
                ) : null}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
