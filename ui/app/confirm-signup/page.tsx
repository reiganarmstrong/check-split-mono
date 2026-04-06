"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { BadgeCheck } from "lucide-react"
import { motion } from "motion/react"
import { useRouter, useSearchParams } from "next/navigation"

import { AuthCardShell } from "@/components/auth/auth-card-shell"
import { AuthField } from "@/components/auth/auth-field"
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

export default function ConfirmSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seededEmail = searchParams.get("email") ?? ""

  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 md:px-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]"></div>

        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%] xl:left-[15%] h-24 w-24 rounded-full border-10 border-primary/10 md:h-32 md:w-32 sm:border-16"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 15, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[5%] h-32 w-32 rotate-12 rounded-4xl bg-secondary/10 md:h-48 md:w-48 xl:right-[15%]"
        />
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, -20, 0], rotate: [-12, -5, -12] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[10%] h-12 w-48 rounded-full bg-primary/5 md:h-16 md:w-64 xl:left-[20%]"
        />
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[10%] bottom-[10%] h-20 w-20 rounded-2xl bg-accent/15 md:h-28 md:w-28 md:rounded-3xl xl:right-[20%]"
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
