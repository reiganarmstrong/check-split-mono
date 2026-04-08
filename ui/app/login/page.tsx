"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { loginWithCredentials, type LoginFormValues } from "@/lib/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string) {
  if (!value) {
    return "Email is required"
  }

  if (!emailPattern.test(value)) {
    return "Enter a valid email address"
  }

  return undefined
}

function validatePassword(value: string) {
  if (!value) {
    return "Password is required"
  }

  return undefined
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, refreshSession } = useAuth()
  const seededEmail = searchParams.get("email") ?? ""
  const confirmedMessage =
    searchParams.get("confirmed") === "1"
      ? "Email verified. You can sign in now."
      : searchParams.get("created") === "1"
        ? "Account created successfully. Sign in to continue."
        : null

  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(confirmedMessage)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [router, status])

  const form = useForm({
    defaultValues: {
      email: seededEmail,
      password: "",
    } satisfies LoginFormValues,
    onSubmit: async ({ value }) => {
      setAuthError(null)

      try {
        const result = await loginWithCredentials(value)

        if (result.status === "confirmation-required") {
          router.push(`/confirm-signup?email=${encodeURIComponent(result.email)}`)
          return
        }

        await refreshSession()
        router.replace("/dashboard")
      } catch (error) {
        setAuthMessage(null)
        setAuthError(
          error instanceof Error ? error.message : "Unable to sign in.",
        )
      }
    },
  })

  if (status !== "unauthenticated") {
    return (
      <AuthSessionScreen
        title="Checking your sign-in state"
        description="Signed-in users are redirected straight to the dashboard."
      />
    )
  }

  return (
    <div className="relative -mt-28 flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 pt-28 md:px-0">
      
      {/* Playful Background Blobs & Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--color-background)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 50, 0], borderRadius: ["40%", "60%", "40%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] -left-[10%] w-[500px] h-[500px] bg-[var(--color-blob-1)] opacity-20 blur-3xl rounded-full"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], borderRadius: ["60%", "40%", "60%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-[var(--color-blob-2)] opacity-20 blur-3xl rounded-full"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="relative z-10 my-16 w-full"
      >
        <AuthCardShell
          icon={<LogIn className="h-8 w-8 text-secondary" />}
          iconWrapperClassName="bg-secondary/20"
          cardShadowClassName="shadow-[8px_8px_0px_0px_var(--color-secondary)]"
          title="Welcome back"
          description="Enter your email and password to sign in."
          footerPrompt="Don't have an account?"
          footerHref="/signup"
          footerLinkLabel="Sign up"
          footerLinkClassName="text-secondary"
        >
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <div className="space-y-5">
              <form.Field
                name="email"
                validators={{
                  onMount: ({ value }) => validateEmail(value),
                  onChange: ({ value }) => validateEmail(value),
                  onBlur: ({ value }) => validateEmail(value),
                }}
              >
                {(field) => (
                  <AuthField
                    field={field}
                    label="Email"
                    tone="secondary"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                )}
              </form.Field>
              <form.Field
                name="password"
                validators={{
                  onMount: ({ value }) => validatePassword(value),
                  onChange: ({ value }) => validatePassword(value),
                  onBlur: ({ value }) => validatePassword(value),
                }}
              >
                {(field) => (
                  <AuthField
                    field={field}
                    label="Password"
                    tone="secondary"
                    type="password"
                    autoComplete="current-password"
                    labelAside={
                      <Link
                        href="#"
                        className="text-sm font-bold text-secondary hover:underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    }
                  />
                )}
              </form.Field>
            </div>

            {authError ? (
              <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {authError}
              </p>
            ) : null}

            {authMessage ? (
              <p className="rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm font-medium text-secondary">
                {authMessage}
              </p>
            ) : null}

            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-16 w-full rounded-full border-4 border-foreground bg-secondary text-lg font-black text-secondary-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-secondary/95 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:border-secondary/35 disabled:bg-secondary/20 disabled:text-secondary/70 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              )}
            </form.Subscribe>

            <SocialAuthButtons tone="secondary" />
          </form>
        </AuthCardShell>
      </motion.div>
    </div>
  );
}
