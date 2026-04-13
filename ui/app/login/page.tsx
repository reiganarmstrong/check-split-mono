"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";

import { AnimatedBlob } from "@/components/ambient/animated-blob";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { validateLoginFormField } from "@/lib/auth-form-schemas"
import { loginWithCredentials, type LoginFormValues } from "@/lib/auth";

function LoginPageContent() {
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
        <AnimatedBlob
          color="var(--color-blob-1)"
          driftClassName="ambient-blob-drift-a"
          morphClassName="ambient-blob-morph-a"
          className="absolute top-[5%] -left-[10%] h-[500px] w-[500px] opacity-20"
        />
        <AnimatedBlob
          color="var(--color-blob-2)"
          driftClassName="ambient-blob-drift-b"
          morphClassName="ambient-blob-morph-b"
          className="absolute -bottom-[10%] -right-[10%] h-[600px] w-[600px] opacity-20"
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
                  onMount: () =>
                    validateLoginFormField("email", form.state.values),
                  onChange: ({ value }) =>
                    validateLoginFormField("email", {
                      ...form.state.values,
                      email: value,
                    }),
                  onBlur: ({ value }) =>
                    validateLoginFormField("email", {
                      ...form.state.values,
                      email: value,
                    }),
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
                  onMount: () =>
                    validateLoginFormField("password", form.state.values),
                  onChange: ({ value }) =>
                    validateLoginFormField("password", {
                      ...form.state.values,
                      password: value,
                    }),
                  onBlur: ({ value }) =>
                    validateLoginFormField("password", {
                      ...form.state.values,
                      password: value,
                    }),
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthSessionScreen
          title="Preparing sign in"
          description="Loading your sign-in form."
        />
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
