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
import { validateSignupFormField } from "@/lib/auth-form-schemas";
import { signUpWithCredentials, type SignupFormValues } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    } satisfies SignupFormValues,
    onSubmit: async ({ value }) => {
      setAuthError(null);
      setAuthMessage(null);

      try {
        const result = await signUpWithCredentials(value);

        if (result.status === "confirmation-required") {
          router.push(
            `/confirm-signup?email=${encodeURIComponent(result.email)}`,
          );
          return;
        }

        router.push(
          `/login?email=${encodeURIComponent(value.email)}&created=1`,
        );
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "Unable to create account.",
        );
      }
    },
  });

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
          icon={<UserPlus className="ml-1 h-8 w-8" />}
          iconWrapperClassName="bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
          bandStyle={{
            background: "color-mix(in oklab, var(--primary) 7%, white)",
          }}
          title="Create an account"
          description="Create account, confirm email, then move straight into saved splits and editor."
          footerPrompt="Already have an account?"
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
                      void form.validateAllFields("change");
                    }}
                  />
                )}
              </form.Field>
              <form.Field
                name="confirmPassword"
                validators={{
                  onMount: () =>
                    validateSignupFormField(
                      "confirmPassword",
                      form.state.values,
                    ),
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
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-14 w-full rounded-[0.8rem] bg-[var(--foreground)] text-base font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
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
