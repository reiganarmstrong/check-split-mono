import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
  iconClassName?: string
  wordmarkClassName?: string
  nameClassName?: string
  taglineClassName?: string
  showIcon?: boolean
  showWordmark?: boolean
  showTagline?: boolean
  animateOnHover?: boolean
  showIconShadow?: boolean
}

export function BrandLogo({
  className,
  iconClassName,
  wordmarkClassName,
  nameClassName,
  taglineClassName,
  showIcon = true,
  showWordmark = true,
  showTagline = false,
  animateOnHover = true,
  showIconShadow = true,
}: BrandLogoProps) {
  return (
    <div className={cn("group/brand flex items-center gap-3", className)}>
      {showIcon ? (
        <div
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)]",
            showIconShadow && "shadow-[var(--shadow-soft)]",
            iconClassName,
          )}
        >
          <svg
            viewBox="0 0 40 40"
            aria-hidden="true"
            className={cn(
              "h-7 w-7 transition-transform duration-300",
              animateOnHover && "group-hover/brand:-translate-y-0.5 group-hover/brand:translate-x-0.5",
            )}
          >
            <rect x="8" y="6" width="18" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <path d="M12 12h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.65" />
            <path d="M12 17h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.45" />
            <path d="M20 10v15" stroke="var(--color-primary, currentColor)" strokeWidth="2" strokeLinecap="round" />
            <path d="M11.5 24.5h4.5" stroke="var(--color-accent, currentColor)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M23.5 24.5h3" stroke="var(--color-secondary, currentColor)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      ) : null}

      {showWordmark ? (
        <div className={cn("flex flex-col justify-center", wordmarkClassName)}>
          <span
            className={cn(
              "text-[1.05rem] font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]",
              nameClassName,
            )}
          >
            CheckSplit
          </span>
          {showTagline ? (
            <span
              className={cn(
                "mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted-foreground)]",
                taglineClassName,
              )}
            >
              Receipt workspace
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
