import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  nameClassName?: string;
  taglineClassName?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
  animateOnHover?: boolean;
};

export function BrandLogo({
  className,
  iconClassName,
  wordmarkClassName,
  nameClassName,
  taglineClassName,
  showWordmark = true,
  showTagline = false,
  animateOnHover = true,
}: BrandLogoProps) {
  return (
    <div className={cn("group/brand flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative isolate flex h-14 w-14 shrink-0 items-center justify-center",
          iconClassName
        )}
      >
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
          <g transform="translate(32 32) scale(1.18) translate(-32 -32)">
            {/* Diagonal shadow stays fixed while the receipt face presses into it */}
            <rect x="21" y="15" width="30" height="39" rx="10" fill="currentColor" className="text-foreground" />
            <g
              className={cn(
                animateOnHover &&
                  "transition-transform duration-300 ease-out group-hover/brand:translate-x-[2px] group-hover/brand:translate-y-[2px]",
              )}
            >
            <rect
              x="17"
              y="11"
              width="30"
              height="39"
              rx="10"
              fill="#FFFFFF"
              stroke="currentColor"
              strokeWidth="3"
              className="text-foreground"
            />
            <path d="M22 15.5H42" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <rect
              x="22"
              y="18.5"
              width="20"
              height="3.5"
              rx="1.75"
              fill="var(--color-primary, #528BFF)"
              stroke="currentColor"
              strokeWidth="1.25"
              className="text-foreground"
            />
            <rect
              x="22"
              y="25.5"
              width="20"
              height="3"
              rx="1.5"
              fill="#AFC7FF"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
            <rect
              x="30.5"
              y="16.5"
              width="3"
              height="28"
              rx="1.5"
              fill="var(--color-primary, #528BFF)"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-foreground"
            />
            <rect
              x="22.5"
              y="34.25"
              width="6"
              height="3.5"
              rx="1.75"
              fill="var(--color-primary, #528BFF)"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
            <rect
              x="35.5"
              y="34.25"
              width="6"
              height="3.5"
              rx="1.75"
              fill="var(--color-secondary, #F7815E)"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
            <rect
              x="22.5"
              y="40.75"
              width="6"
              height="3.5"
              rx="1.75"
              fill="#AFC7FF"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
            <rect
              x="35.5"
              y="40.75"
              width="6"
              height="3.5"
              rx="1.75"
              fill="#FFD2C6"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
            </g>
          </g>
        </svg>
      </div>

      {showWordmark ? (
        <div className={cn("flex flex-col justify-center leading-none", wordmarkClassName)}>
          <span
            className={cn(
              "inline-flex items-center gap-1 font-heading text-[1.28rem] font-black uppercase tracking-[0.04em] text-foreground sm:text-[1.35rem]",
              nameClassName
            )}
          >
            <span className="text-foreground">CHECK</span>
            <span className="text-primary">SPLIT</span>
          </span>
          {showTagline ? (
            <span
              className={cn(
                "mt-1 pl-[1px] text-[0.58rem] font-black uppercase tracking-[0.24em] text-muted-foreground",
                taglineClassName
              )}
            >
              Receipts, split cleanly
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
