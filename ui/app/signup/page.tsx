"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { signUpWithCredentials, type SignupFormValues } from "@/lib/auth";
import { validateCognitoPassword } from "@/lib/password-policy";

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
  return validateCognitoPassword(value)
}

function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!confirmPassword) {
    return "Confirm your password"
  }

  if (confirmPassword !== password) {
    return "Passwords must match"
  }

  return undefined
}

export default function SignupPage() {
  const router = useRouter()
  const { status } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [router, status])

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    } satisfies SignupFormValues,
    onSubmit: async ({ value }) => {
      setAuthError(null)
      setAuthMessage(null)

      try {
        const result = await signUpWithCredentials(value)

        if (result.status === "confirmation-required") {
          router.push(`/confirm-signup?email=${encodeURIComponent(result.email)}`)
          return
        }

        router.push(`/login?email=${encodeURIComponent(value.email)}&created=1`)
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "Unable to create account.",
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 md:px-0">
      
      {/* Crisp Floating Geometry (No Gradients) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]"></div>
        
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%] xl:left-[15%] w-24 h-24 md:w-32 md:h-32 rounded-full border-10 sm:border-16 border-primary/10"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 15, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[5%] xl:right-[15%] w-32 h-32 md:w-48 md:h-48 bg-secondary/10 rounded-4xl rotate-12"
        />
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, -20, 0], rotate: [-12, -5, -12] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[10%] xl:left-[20%] w-48 h-12 md:w-64 md:h-16 bg-primary/5 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[10%] xl:right-[20%] w-20 h-20 md:w-28 md:h-28 bg-accent/15 rounded-2xl md:rounded-3xl"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="relative z-10 my-16 w-full"
      >
        <AuthCardShell
          icon={<UserPlus className="ml-1 h-8 w-8 text-primary" />}
          iconWrapperClassName="bg-primary/20"
          title="Create an account"
          description="Enter your details below to get started."
          footerPrompt="Already have an account?"
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
                    type="password"
                    autoComplete="new-password"
                    onValueChange={() => {
                      void form.validateAllFields("change")
                    }}
                  />
                )}
              </form.Field>
              <form.Field
                name="confirmPassword"
                validators={{
                  onMount: ({ value }) =>
                    validateConfirmPassword(form.getFieldValue("password"), value),
                  onChange: ({ value }) =>
                    validateConfirmPassword(form.getFieldValue("password"), value),
                  onBlur: ({ value }) =>
                    validateConfirmPassword(form.getFieldValue("password"), value),
                }}
              >
                {(field) => (
                  <AuthField
                    field={field}
                    label="Confirm Password"
                    type="password"
                    autoComplete="new-password"
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
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-14 w-full rounded-full text-lg font-black shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03]"
                >
                  {isSubmitting ? "Creating account..." : "Sign up"}
                </Button>
              )}
            </form.Subscribe>

            <SocialAuthButtons />
          </form>
        </AuthCardShell>
      </motion.div>
    </div>
  );
}
