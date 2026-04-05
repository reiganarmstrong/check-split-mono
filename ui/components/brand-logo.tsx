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
          "relative isolate flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_50%_42%,#edf4ff_0%,#d9e6ff_46%,#b5caf5_76%,#96b0e8_100%)] shadow-[0_18px_28px_-22px_rgba(40,71,144,0.52)]",
          iconClassName
        )}
      >
        <span className="pointer-events-none absolute inset-[2px] rounded-[1.18rem] bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.12),rgba(255,255,255,0.04)_34%,rgba(92,126,204,0.03)_60%,rgba(92,126,204,0)_80%)]" />
        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
          <defs>
            <radialGradient id="badge-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 31) rotate(90) scale(22 18)">
              <stop offset="0" stopColor="#F8FBFF" stopOpacity="0.92" />
              <stop offset="0.6" stopColor="#C7DAFF" stopOpacity="0.4" />
              <stop offset="1" stopColor="#86A8F1" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="receipt-fill" x1="32" y1="11" x2="32" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="0.58" stopColor="#F7FAFF" />
              <stop offset="1" stopColor="#EAF2FF" />
            </linearGradient>
            <linearGradient id="blue-row" x1="22" y1="18.5" x2="42" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3E70DA" />
              <stop offset="1" stopColor="#73A4FF" />
            </linearGradient>
            <linearGradient id="split-blue" x1="22" y1="34" x2="29" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3E6FD9" />
              <stop offset="1" stopColor="#6F9EF9" />
            </linearGradient>
            <linearGradient id="split-coral" x1="35" y1="34" x2="42" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#EB805D" />
              <stop offset="1" stopColor="#FFB18B" />
            </linearGradient>
            <linearGradient id="divider-fill" x1="32" y1="16.5" x2="32" y2="44.5" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4678E2" />
              <stop offset="1" stopColor="#2E5FC8" />
            </linearGradient>
            <filter id="receipt-shadow" x="12" y="8" width="40" height="48" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
              <feOffset dy="1.5" />
              <feGaussianBlur stdDeviation="1.5" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.243137 0 0 0 0 0.396078 0 0 0 0 0.756863 0 0 0 0.28 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape" />
            </filter>
          </defs>
          <ellipse cx="32" cy="32" rx="15.5" ry="12.5" fill="url(#badge-glow)" />
          <g filter="url(#receipt-shadow)">
            <rect x="17" y="11" width="30" height="39" rx="10" fill="url(#receipt-fill)" stroke="#6E92E5" strokeWidth="2.5" />
          </g>
          <path d="M22 15.5H42" stroke="white" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="22" y="18.5" width="20" height="3.5" rx="1.75" fill="url(#blue-row)" />
          <rect x="22" y="25.5" width="20" height="3" rx="1.5" fill="#A5C0FB" />
          <rect x="30.5" y="16.5" width="3" height="28" rx="1.5" fill="url(#divider-fill)" />
          <rect x="22" y="34" width="7" height="4" rx="2" fill="url(#split-blue)" />
          <rect x="35" y="34" width="7" height="4" rx="2" fill="url(#split-coral)" />
          <rect x="22" y="40.5" width="7" height="4" rx="2" fill="#9AB8FF" />
          <rect x="35" y="40.5" width="7" height="4" rx="2" fill="#FFD2C6" />
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
