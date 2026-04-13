"use client"

import { motion } from "motion/react"

type AuthSessionScreenProps = {
  title: string
  description: string
}

export function AuthSessionScreen({
  title,
  description,
}: AuthSessionScreenProps) {
  return (
    <main className="relative -mt-28 flex min-h-screen items-center overflow-hidden bg-background px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.05]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 mx-auto w-full max-w-2xl"
      >
        <div className="rounded-[3rem] border-4 border-foreground bg-white px-6 py-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:px-8 sm:py-10">
          <div className="inline-flex rounded-full border-2 border-foreground bg-accent/30 px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.24em] text-foreground">
            Loading
          </div>

          <h1 className="mt-6 text-4xl font-heading font-black leading-[0.95] tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-muted-foreground">
            {description}
          </p>

          <div className="mt-8 rounded-[1.8rem] border-2 border-foreground bg-muted/50 px-4 py-5">
            <div className="flex items-center gap-3">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="loading-dot h-3.5 w-3.5 rounded-full border border-foreground bg-primary"
                  style={{ animationDelay: `${index * 0.14}s` }}
                />
              ))}
              <p className="text-sm font-black text-foreground">Preparing your workspace</p>
            </div>

            <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-foreground bg-white">
              <div className="loading-sweep gpu-loop h-full w-1/3 rounded-full border-r-2 border-foreground bg-secondary" />
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  )
}
