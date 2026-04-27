"use client"

import { Suspense, useEffect, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { BadgeCheck } from "lucide-react"
import { motion } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"

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
    <div className="flex flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="page-shell my-8 w-full"
      >
        <AuthCardShell
          icon={<BadgeCheck className="h-8 w-8 text-primary" />}
          iconWrapperClassName="bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
          title="Verify your email"
          description="Enter confirmation code from Cognito, finish setup, then log in."
          footerPrompt="Already verified?"
          footerHref="/login"
          footerLinkLabel="Log in"
          footerLinkClassName="text-[var(--foreground)]"
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
              <p className="rounded-[0.8rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {authError}
              </p>
            ) : null}

            {authMessage ? (
              <p className="rounded-[0.8rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
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
                    className="h-14 w-full rounded-[0.8rem] bg-[var(--foreground)] text-base font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
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
                    className="h-12 w-full rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel)] font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
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
