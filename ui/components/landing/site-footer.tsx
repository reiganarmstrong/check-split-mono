import Link from "next/link"

import { BrandLogo } from "@/components/brand-logo"

export function SiteFooter() {
  return (
    <footer className="mt-auto pb-4 pt-1">
      <div className="page-shell">
        <div className="py-3">
          <div className="flex items-start justify-between gap-3">
            <BrandLogo
              className="gap-2.5"
              iconClassName="h-10 w-10"
              nameClassName="text-[0.95rem] font-semibold tracking-[0.24em]"
              animateOnHover={false}
              showIcon={false}
              showIconShadow={false}
              showTagline={false}
            />

            <div className="flex shrink-0 items-center justify-end gap-5 text-right text-sm text-[var(--muted-foreground)]">
              <Link href="/privacy" className="transition-colors hover:text-[var(--foreground)]">
                Privacy
              </Link>
              <Link href="/contact" className="transition-colors hover:text-[var(--foreground)]">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
