import Link from "next/link"
import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
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
}: AuthCardShellProps) {
  return (
    <Card
      className={cn(
        "relative mx-auto w-full max-w-md gap-0 overflow-hidden rounded-[3rem] border-4 border-foreground bg-white px-8 py-10 sm:px-10 sm:py-12",
        cardShadowClassName ??
          "shadow-[8px_8px_0px_0px_var(--color-primary)]",
      )}
    >
      {/* Decorative Wavy Header */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMiI+PHBhdGggZD0iTTEwIDEyTDAgMGgyMGwtMTAgMTJ6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] opacity-20 repeat-x background-size-[20px]" />
      
      <CardHeader className="justify-items-center gap-0 p-0 text-center relative z-10">
        <div
          className={cn(
            "mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transform -rotate-3",
            iconWrapperClassName,
          )}
        >
          {icon}
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-heading font-black tracking-tight sm:text-5xl text-foreground">
            {title}
          </h1>
          <p className="text-lg font-medium text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 pt-10 relative z-10">{children}</CardContent>
      
      <CardFooter className="justify-center gap-2 p-0 pt-10 text-center text-base relative z-10">
        <span className="font-medium text-muted-foreground">{footerPrompt}</span>
        <Link
          href={footerHref}
          className={cn(
            "font-black hover:underline underline-offset-4 decoration-2",
            footerLinkClassName,
          )}
        >
          {footerLinkLabel}
        </Link>
      </CardFooter>
    </Card>
  )
}
