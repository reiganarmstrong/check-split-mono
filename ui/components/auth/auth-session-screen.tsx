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
    <main className="flex flex-1 items-center px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-shell"
      >
        <div className="auth-shell mx-auto max-w-3xl rounded-[1rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Loading
          </div>

          <h1 className="mt-6 text-4xl leading-[0.95] text-[var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
            {description}
          </p>

          <div className="section-divider mt-8 px-1 pt-6">
            <div className="flex items-center gap-3">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="loading-dot h-3.5 w-3.5 rounded-full border border-[var(--line)] bg-[var(--primary)]"
                  style={{ animationDelay: `${index * 0.14}s` }}
                />
              ))}
              <p className="text-sm font-semibold text-[var(--foreground)]">Preparing your workspace</p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)]">
              <div className="loading-sweep gpu-loop h-full w-1/3 rounded-full bg-[var(--primary)]" />
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  )
}
