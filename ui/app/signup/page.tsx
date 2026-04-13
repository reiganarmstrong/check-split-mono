"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import { AnimatedBlob } from "@/components/ambient/animated-blob";
import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { validateSignupFormField } from "@/lib/auth-form-schemas"
import { signUpWithCredentials, type SignupFormValues } from "@/lib/auth";

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
                  onMount: () =>
                    validateSignupFormField("email", form.state.values),
                  onChange: ({ value }) =>
                    validateSignupFormField("email", {
                      ...form.state.values,
                      email: value,
                    }),
                  onBlur: ({ value }) =>
                    validateSignupFormField("email", {
                      ...form.state.values,
                      email: value,
                    }),
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
                  onMount: () =>
                    validateSignupFormField("password", form.state.values),
                  onChange: ({ value }) =>
                    validateSignupFormField("password", {
                      ...form.state.values,
                      password: value,
                    }),
                  onBlur: ({ value }) =>
                    validateSignupFormField("password", {
                      ...form.state.values,
                      password: value,
                    }),
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
                  onMount: () =>
                    validateSignupFormField("confirmPassword", form.state.values),
                  onChange: ({ value }) =>
                    validateSignupFormField("confirmPassword", {
                      ...form.state.values,
                      confirmPassword: value,
                    }),
                  onBlur: ({ value }) =>
                    validateSignupFormField("confirmPassword", {
                      ...form.state.values,
                      confirmPassword: value,
                    }),
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
                  className="h-16 w-full rounded-full border-4 border-foreground bg-primary text-lg font-black text-primary-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-primary/95 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
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
