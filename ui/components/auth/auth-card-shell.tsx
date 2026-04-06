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
}: AuthCardShellProps) {
  return (
    <Card className="mx-auto w-full max-w-md gap-0 rounded-[2.5rem] border border-black/5 bg-white/80 px-8 py-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/80 sm:px-10 sm:py-10">
      <CardHeader className="justify-items-center gap-0 p-0 text-center">
        <div
          className={cn(
            "relative mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] shadow-inner",
            iconWrapperClassName,
          )}
        >
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-10">{children}</CardContent>
      <CardFooter className="justify-center gap-1 p-0 pt-8 text-center text-base">
        <span>{footerPrompt}</span>
        <Link
          href={footerHref}
          className={cn(
            "font-black hover:underline underline-offset-4",
            footerLinkClassName,
          )}
        >
          {footerLinkLabel}
        </Link>
      </CardFooter>
    </Card>
  )
}
