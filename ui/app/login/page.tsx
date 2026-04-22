"use client";

import { Suspense, useEffect, useState } from "react";
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
import { validateLoginFormField } from "@/lib/auth-form-schemas";
import { loginWithCredentials, type LoginFormValues } from "@/lib/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, refreshSession } = useAuth();
  const seededEmail = searchParams.get("email") ?? "";
  const confirmedMessage =
    searchParams.get("confirmed") === "1"
      ? "Email verified. You can log in now."
      : searchParams.get("created") === "1"
        ? "Account created successfully. Log in to continue."
        : null;

  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(
    confirmedMessage,
  );

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  const form = useForm({
    defaultValues: {
      email: seededEmail,
      password: "",
    } satisfies LoginFormValues,
    onSubmit: async ({ value }) => {
      setAuthError(null);

      try {
        const result = await loginWithCredentials(value);

        if (result.status === "confirmation-required") {
          router.push(
            `/confirm-signup?email=${encodeURIComponent(result.email)}`,
          );
          return;
        }

        await refreshSession();
        router.replace("/dashboard");
      } catch (error) {
        setAuthMessage(null);
        setAuthError(
          error instanceof Error ? error.message : "Unable to log in.",
        );
      }
    },
  });

  if (status !== "unauthenticated") {
    return (
      <AuthSessionScreen
        title="Checking your sign-in state"
        description="Logged-in users are redirected straight to the dashboard."
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
          icon={<LogIn className="ml-1 h-8 w-8" />}
          iconWrapperClassName="bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
          bandStyle={{
            background: "color-mix(in oklab, var(--accent) 7%, white)",
          }}
          title="Welcome back"
          description="Log in to reopen drafts and saved split receipts."
          footerPrompt="Don't have an account?"
          footerHref="/signup"
          footerLinkLabel="Sign up"
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
                    tone="accent"
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
                    tone="accent"
                    type="password"
                    autoComplete="current-password"
                    labelAside={
                      <Link
                        href="#"
                        className="text-sm font-bold text-[var(--accent)] hover:underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    }
                  />
                )}
              </form.Field>
            </div>

            {authError ? (
              <p className="rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {authError}
              </p>
            ) : null}

            {authMessage ? (
              <p className="rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
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
                  className="h-14 w-full rounded-[1rem] bg-foreground text-base font-medium text-background transition-opacity hover:opacity-90 hover:bg-accent hover:text-accent-foreground active:bg-[color-mix(in_srgb,var(--accent)_88%,black)] active:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[color-mix(in_srgb,var(--accent)_32%,transparent)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                >
                  {isSubmitting ? "Logging in..." : "Log in"}
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
          title="Preparing log in"
          description="Loading your log in form."
        />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
