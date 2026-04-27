import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

type AuthCardShellProps = {
  icon: ReactNode
  title: string
  description: string
  footerPrompt: string
  footerHref: string
  footerLinkLabel: string
  children: ReactNode
  iconWrapperClassName?: string
  footerLinkClassName?: string
  cardShadowClassName?: string
  bandClassName?: string
  bandStyle?: CSSProperties
}

export function AuthCardShell({
  icon,
  title,
  description,
  footerPrompt,
  footerHref,
  footerLinkLabel,
  children,
  iconWrapperClassName,
  footerLinkClassName,
  cardShadowClassName,
  bandClassName,
  bandStyle,
}: AuthCardShellProps) {
  return (
    <section
      className={cn(
        "auth-shell mx-auto w-full max-w-5xl overflow-hidden rounded-[1rem]",
        cardShadowClassName,
      )}
    >
      <div className="grid md:grid-cols-[0.92fr_1.08fr]">
        <div
          className={cn(
            "auth-band px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12",
            bandClassName,
          )}
          style={bandStyle}
        >
          <div
            className={cn(
              "inline-flex h-14 w-14 items-center justify-center rounded-[0.9rem] border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)]",
              iconWrapperClassName,
            )}
          >
            {icon}
          </div>

          <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
            Account access
          </p>
          <h1 className="mt-4 max-w-md text-4xl leading-[0.95] text-[var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted-foreground)]">
            {description}
          </p>

          <div className="section-divider mt-8 pt-6 text-sm text-[var(--muted-foreground)]">
            <span>{footerPrompt} </span>
            <Link
              href={footerHref}
              className={cn("font-medium text-[var(--foreground)] underline-offset-4 hover:underline", footerLinkClassName)}
            >
              {footerLinkLabel}
            </Link>
          </div>
        </div>

        <div className="section-divider border-t border-[var(--line)] bg-[var(--surface-strong)] px-6 py-8 sm:px-8 sm:py-10 md:border-l md:border-t-0 md:px-10 md:py-12">
          {children}
        </div>
      </div>
    </section>
  )
}
