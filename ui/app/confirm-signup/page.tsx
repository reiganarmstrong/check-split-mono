"use client"

import { Suspense, useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { BadgeCheck } from "lucide-react"
import { motion } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"

import { AnimatedBlob } from "@/components/ambient/animated-blob"
import { AuthCardShell } from "@/components/auth/auth-card-shell"
import { AuthField } from "@/components/auth/auth-field"
import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  confirmSignupWithCode,
  resendSignupConfirmationCode,
  type ConfirmSignupFormValues,
} from "@/lib/auth"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(value: string) {
  if (!value) {
    return "Email is required"
  }

  if (!emailPattern.test(value)) {
    return "Enter a valid email address"
  }

  return undefined
}

function validateCode(value: string) {
  if (!value) {
    return "Verification code is required"
  }

  return undefined
}

function ConfirmSignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useAuth()
  const seededEmail = searchParams.get("email") ?? ""

  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [router, status])

  const form = useForm({
    defaultValues: {
      email: seededEmail,
      code: "",
    } satisfies ConfirmSignupFormValues,
    onSubmit: async ({ value }) => {
      setAuthError(null)
      setAuthMessage(null)

      try {
        await confirmSignupWithCode(value)
        router.push(`/login?email=${encodeURIComponent(value.email)}&confirmed=1`)
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "Unable to verify your email.",
        )
      }
    },
  })

  async function handleResendCode() {
    const email = form.getFieldValue("email")
    const emailError = validateEmail(email)

    if (emailError) {
      setAuthMessage(null)
      setAuthError(emailError)
      return
    }

    setIsResending(true)
    setAuthError(null)

    try {
      const message = await resendSignupConfirmationCode(email)
      setAuthMessage(message)
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Unable to resend the code.",
      )
    } finally {
      setIsResending(false)
    }
  }

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
          icon={<BadgeCheck className="h-8 w-8 text-primary" />}
          iconWrapperClassName="bg-primary/20"
          title="Verify your email"
          description="Enter the confirmation code Cognito sent to finish creating your account."
          footerPrompt="Already verified?"
          footerHref="/login"
          footerLinkLabel="Sign in"
          footerLinkClassName="text-primary"
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
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                )}
              </form.Field>
              <form.Field
                name="code"
                validators={{
                  onMount: ({ value }) => validateCode(value),
                  onChange: ({ value }) => validateCode(value),
                  onBlur: ({ value }) => validateCode(value),
                }}
              >
                {(field) => (
                  <AuthField
                    field={field}
                    label="Verification Code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder="123456"
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
              <p className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
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
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="h-14 w-full rounded-full text-lg font-black shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03]"
                  >
                    {isSubmitting ? "Verifying..." : "Verify email"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isSubmitting || isResending}
                    onClick={() => {
                      void handleResendCode()
                    }}
                    className="h-12 w-full rounded-full font-bold"
                  >
                    {isResending ? "Sending new code..." : "Resend code"}
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </AuthCardShell>
      </motion.div>
    </div>
  )
}

export default function ConfirmSignupPage() {
  return (
    <Suspense
      fallback={
        <AuthSessionScreen
          title="Preparing verification"
          description="Loading your confirmation form."
        />
      }
    >
      <ConfirmSignupPageContent />
    </Suspense>
  )
}
