import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

type AnimatedBlobProps = {
  className?: string
  color: string
  driftClassName:
    | "ambient-blob-drift-a"
    | "ambient-blob-drift-b"
    | "ambient-blob-drift-c"
  morphClassName:
    | "ambient-blob-morph-a"
    | "ambient-blob-morph-b"
    | "ambient-blob-morph-c"
}

export function AnimatedBlob({
  className,
  color,
  driftClassName,
  morphClassName,
}: AnimatedBlobProps) {
  return (
    <div className={cn("ambient-blob", driftClassName, className)}>
      <div
        className={cn("ambient-blob-surface", morphClassName)}
        style={{ "--ambient-blob-color": color } as CSSProperties}
      />
    </div>
  )
}
