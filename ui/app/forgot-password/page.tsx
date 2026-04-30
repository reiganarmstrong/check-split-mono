"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { KeyRound } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthCardShell } from "@/components/auth/auth-card-shell";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  validateConfirmPasswordResetFormField,
  validateRequestPasswordResetFormField,
} from "@/lib/auth-form-schemas";
import {
  confirmPasswordResetWithCode,
  requestPasswordReset,
  type ConfirmPasswordResetFormValues,
} from "@/lib/auth";

type ResetStep = "request" | "confirm";

function ForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const seededEmail = searchParams.get("email") ?? "";

  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  const form = useForm({
    defaultValues: {
      email: seededEmail,
      code: "",
      newPassword: "",
      confirmPassword: "",
    } satisfies ConfirmPasswordResetFormValues,
    onSubmit: async ({ value }) => {
      setAuthError(null);

      try {
        if (resetStep === "request") {
          const result = await requestPasswordReset({ email: value.email });
          setAuthMessage(result.message);
          setResetStep("confirm");
          return;
        }

        await confirmPasswordResetWithCode(value);
        router.push(`/login?email=${encodeURIComponent(value.email)}&reset=1`);
      } catch (error) {
        setAuthMessage(null);
        setAuthError(
          error instanceof Error
            ? error.message
            : resetStep === "request"
              ? "Unable to send reset code."
              : "Unable to reset password.",
        );
      }
    },
  });

  async function handleResendCode() {
    const email = form.getFieldValue("email");
    const emailError = validateRequestPasswordResetFormField("email", {
      email,
    });

    if (emailError) {
      setAuthMessage(null);
      setAuthError(emailError);
      return;
    }

    setIsResending(true);
    setAuthError(null);

    try {
      const result = await requestPasswordReset({ email });
      setAuthMessage(result.message);
      setResetStep("confirm");
    } catch (error) {
      setAuthMessage(null);
      setAuthError(
        error instanceof Error ? error.message : "Unable to send reset code.",
      );
    } finally {
      setIsResending(false);
    }
  }

  if (status !== "unauthenticated") {
    return (
      <AuthSessionScreen
        title="Checking your sign-in state"
        description="Signed-in users are redirected straight to the dashboard."
      />
    );
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
          icon={<KeyRound className="h-8 w-8 text-[var(--foreground)]" />}
          iconWrapperClassName="bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
          bandStyle={{
            background: "color-mix(in oklab, var(--accent) 7%, white)",
          }}
          title="Reset password"
          description="Get a password reset code, then choose a new password for your account."
          footerPrompt="Remembered your password?"
          footerHref="/login"
          footerLinkLabel="Log in"
          footerLinkClassName="text-[var(--foreground)]"
        >
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <div className="space-y-5">
              <form.Field
                name="email"
                validators={{
                  onMount: ({ value }) =>
                    validateRequestPasswordResetFormField("email", {
                      email: value,
                    }),
                  onChange: ({ value }) =>
                    validateRequestPasswordResetFormField("email", {
                      email: value,
                    }),
                  onBlur: ({ value }) =>
                    validateRequestPasswordResetFormField("email", {
                      email: value,
                    }),
                }}
              >
                {(field) => (
                  <AuthField
                    field={field}
                    label="Email"
                    tone="accent"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    disabled={resetStep === "confirm"}
                  />
                )}
              </form.Field>

              {resetStep === "confirm" ? (
                <>
                  <form.Field
                    name="code"
                    validators={{
                      onMount: ({ value }) =>
                        validateConfirmPasswordResetFormField("code", {
                          ...form.state.values,
                          code: value,
                        }),
                      onChange: ({ value }) =>
                        validateConfirmPasswordResetFormField("code", {
                          ...form.state.values,
                          code: value,
                        }),
                      onBlur: ({ value }) =>
                        validateConfirmPasswordResetFormField("code", {
                          ...form.state.values,
                          code: value,
                        }),
                    }}
                  >
                    {(field) => (
                      <AuthField
                        field={field}
                        label="Reset code"
                        tone="accent"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        placeholder="123456"
                      />
                    )}
                  </form.Field>

                  <form.Field
                    name="newPassword"
                    validators={{
                      onMount: ({ value }) =>
                        validateConfirmPasswordResetFormField("newPassword", {
                          ...form.state.values,
                          newPassword: value,
                        }),
                      onChange: ({ value }) =>
                        validateConfirmPasswordResetFormField("newPassword", {
                          ...form.state.values,
                          newPassword: value,
                        }),
                      onBlur: ({ value }) =>
                        validateConfirmPasswordResetFormField("newPassword", {
                          ...form.state.values,
                          newPassword: value,
                        }),
                    }}
                  >
                    {(field) => (
                      <AuthField
                        field={field}
                        label="New password"
                        tone="accent"
                        type="password"
                        autoComplete="new-password"
                      />
                    )}
                  </form.Field>

                  <form.Field
                    name="confirmPassword"
                    validators={{
                      onMount: ({ value }) =>
                        validateConfirmPasswordResetFormField(
                          "confirmPassword",
                          {
                            ...form.state.values,
                            confirmPassword: value,
                          },
                        ),
                      onChange: ({ value }) =>
                        validateConfirmPasswordResetFormField(
                          "confirmPassword",
                          {
                            ...form.state.values,
                            confirmPassword: value,
                          },
                        ),
                      onBlur: ({ value }) =>
                        validateConfirmPasswordResetFormField(
                          "confirmPassword",
                          {
                            ...form.state.values,
                            confirmPassword: value,
                          },
                        ),
                    }}
                  >
                    {(field) => (
                      <AuthField
                        field={field}
                        label="Confirm new password"
                        tone="accent"
                        type="password"
                        autoComplete="new-password"
                      />
                    )}
                  </form.Field>
                </>
              ) : null}
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
                    disabled={!canSubmit || isSubmitting || isResending}
                    className="h-14 w-full rounded-[0.8rem] bg-foreground text-base font-semibold text-background transition-opacity hover:bg-accent hover:text-accent-foreground hover:opacity-90 active:bg-[color-mix(in_srgb,var(--accent)_88%,black)] active:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[color-mix(in_srgb,var(--accent)_32%,transparent)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    {isSubmitting
                      ? resetStep === "request"
                        ? "Sending code..."
                        : "Resetting password..."
                      : resetStep === "request"
                        ? "Send reset code"
                        : "Reset password"}
                  </Button>

                  {resetStep === "confirm" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        type="button"
                        disabled={isSubmitting || isResending}
                        onClick={() => {
                          void handleResendCode();
                        }}
                        className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel)] font-semibold text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--accent)_18%,white)] hover:text-[var(--accent-foreground)] focus-visible:border-[var(--accent)] focus-visible:bg-[color-mix(in_oklab,var(--accent)_18%,white)] focus-visible:text-[var(--accent-foreground)] focus-visible:ring-[color-mix(in_srgb,var(--accent)_32%,transparent)]"
                      >
                        {isResending ? "Sending..." : "Resend code"}
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={isSubmitting || isResending}
                        onClick={() => {
                          setResetStep("request");
                          setAuthError(null);
                          setAuthMessage(null);
                        }}
                        className="h-12 rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel)] font-semibold text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[color-mix(in_oklab,var(--accent)_18%,white)] hover:text-[var(--accent-foreground)] focus-visible:border-[var(--accent)] focus-visible:bg-[color-mix(in_oklab,var(--accent)_18%,white)] focus-visible:text-[var(--accent-foreground)] focus-visible:ring-[color-mix(in_srgb,var(--accent)_32%,transparent)]"
                      >
                        Change email
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </form.Subscribe>

            <p className="text-center text-sm text-[var(--muted-foreground)]">
              Back to{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--foreground)] underline-offset-4 hover:underline"
              >
                log in
              </Link>
            </p>
          </form>
        </AuthCardShell>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthSessionScreen
          title="Preparing password reset"
          description="Loading your password reset form."
        />
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
