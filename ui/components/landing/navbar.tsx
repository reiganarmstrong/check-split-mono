"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

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
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={homeHref} className="mr-6 flex items-center group">
          <BrandLogo
            className="transition-transform duration-300 group-hover:scale-103"
            wordmarkClassName="hidden sm:flex"
          />
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-3">
            {status === "authenticated" ? (
              <div ref={accountMenuRef} className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  onClick={() => {
                    setIsAccountMenuOpen((isOpen) => !isOpen);
                  }}
                  className="max-w-[min(18rem,calc(100vw-7rem))] rounded-full border-slate-900/10 bg-white/80 px-3 font-bold shadow-sm backdrop-blur hover:bg-white"
                >
                  <span className="truncate">{user?.email ?? user?.username}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isAccountMenuOpen ? "rotate-180" : ""}`}
                  />
                </Button>

                <AnimatePresence>
                  {isAccountMenuOpen ? (
                    <motion.div
                      key="account-menu"
                      role="menu"
                      aria-label="Account actions"
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.985 }}
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute right-0 mt-2 min-w-56 origin-top-right rounded-[1.4rem] border border-slate-900/10 bg-white/95 p-2 shadow-[0_24px_56px_-36px_rgba(31,59,133,0.38)] backdrop-blur transform-gpu will-change-[opacity,transform]"
                    >
                      <div className="px-3 py-2">
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-muted-foreground">
                          Signed in as
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold text-foreground">
                          {user?.email ?? user?.username}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          void handleSignOut();
                        }}
                        disabled={isSigningOut}
                        className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2 text-left text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" />
                        {isSigningOut ? "Signing out..." : "Sign out"}
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : status === "loading" ? (
              <div className="h-8 w-28 animate-pulse rounded-full bg-muted/80" />
            ) : (
              <>
                {pathname !== "/login" ? (
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full font-bold hover:bg-secondary/20"
                    >
                      Log in
                    </Button>
                  </Link>
                ) : null}
                {pathname !== "/signup" ? (
                  <Link href="/signup">
                    <Button size="sm" className="rounded-full font-bold shadow-md">
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
