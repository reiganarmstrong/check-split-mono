import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  nameClassName?: string;
  taglineClassName?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
};

export function BrandLogo({
  className,
  iconClassName,
  wordmarkClassName,
  nameClassName,
  taglineClassName,
  showWordmark = true,
  showTagline = false,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative isolate flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-primary/20 bg-[#e5efff] shadow-[inset_0_1px_0_rgba(255,255,255,0.58),inset_0_-10px_18px_rgba(116,154,230,0.16),0_18px_35px_-22px_rgba(64,103,184,0.9)] ring-1 ring-white/72",
          iconClassName
        )}
      >
        <span className="pointer-events-none absolute inset-[1.5px] rounded-[1.18rem] border border-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />
        <span className="absolute inset-x-2 top-1.5 h-3 rounded-full bg-white/55 blur-md" />
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
          <defs>
            <linearGradient id="receipt-fill" x1="32" y1="11" x2="32" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#F5F9FF" />
            </linearGradient>
            <linearGradient id="blue-row" x1="22" y1="18.5" x2="42" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#5B89EC" />
              <stop offset="1" stopColor="#77A1FA" />
            </linearGradient>
            <linearGradient id="split-blue" x1="22" y1="34" x2="29" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4E7FE4" />
              <stop offset="1" stopColor="#73A0F9" />
            </linearGradient>
            <linearGradient id="split-coral" x1="35" y1="34" x2="42" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#F58D74" />
              <stop offset="1" stopColor="#FFB39F" />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="50" rx="11" ry="3" fill="#9EBBFA" fillOpacity="0.22" />
          <rect x="17" y="11" width="30" height="39" rx="10" fill="url(#receipt-fill)" stroke="#95B0E8" strokeWidth="2.5" />
          <path d="M22 15.5H42" stroke="white" strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="22" y="18.5" width="20" height="3.5" rx="1.75" fill="url(#blue-row)" />
          <rect x="22" y="25.5" width="20" height="3" rx="1.5" fill="#AFC6FF" />
          <rect x="30.5" y="16.5" width="3" height="28" rx="1.5" fill="#6F9CF7" />
          <path d="M32 16.5V44.5" stroke="white" strokeOpacity="0.28" strokeWidth="0.75" strokeLinecap="round" />
          <rect x="22" y="34" width="7" height="4" rx="2" fill="url(#split-blue)" />
          <rect x="35" y="34" width="7" height="4" rx="2" fill="url(#split-coral)" />
          <rect x="22" y="40.5" width="7" height="4" rx="2" fill="#9EBCFF" />
          <rect x="35" y="40.5" width="7" height="4" rx="2" fill="#FFD0C4" />
        </svg>
      </div>

      {showWordmark ? (
        <div className={cn("flex flex-col leading-none", wordmarkClassName)}>
          <span
            className={cn(
              "font-heading text-[1.7rem] font-black tracking-[-0.05em] text-foreground",
              nameClassName
            )}
          >
            <span className="text-primary">Check</span>
            <span className="ml-0.5 text-secondary">Split</span>
          </span>
          {showTagline ? (
            <span
              className={cn(
                "mt-1 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-muted-foreground/90",
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
