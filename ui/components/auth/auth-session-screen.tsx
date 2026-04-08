"use client"

import { motion } from "motion/react"

import { Card, CardContent } from "@/components/ui/card"

type AuthSessionScreenProps = {
  title: string
  description: string
}

export function AuthSessionScreen({
  title,
  description,
}: AuthSessionScreenProps) {
  return (
    <div className="relative -mt-28 flex min-h-screen items-center justify-center overflow-hidden px-4 pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,139,238,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(247,129,94,0.16),transparent_32%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
        className="relative w-full max-w-md"
      >
        <Card className="rounded-[2rem] border-border/70 bg-white/75 py-0 text-center shadow-[0_24px_80px_-48px_rgba(42,78,166,0.45)] backdrop-blur-xl">
          <CardContent className="flex flex-col items-center px-8 py-10">
            <div className="mb-6 flex gap-2">
              {["bg-primary", "bg-secondary", "bg-accent"].map((className, index) => (
                <motion.span
                  key={className}
                  animate={{ y: [0, -5, 0], opacity: [0.55, 1, 0.55] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.14,
                  }}
                  className={`h-3 w-3 rounded-full ${className}`}
                />
              ))}
            </div>
            <h1 className="text-3xl font-heading font-black text-foreground">{title}</h1>
            <p className="mt-3 text-base font-medium text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
