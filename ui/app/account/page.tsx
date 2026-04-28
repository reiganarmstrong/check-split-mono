"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import { AuthField } from "@/components/auth/auth-field";
import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  changeCurrentUserPassword,
  deleteCurrentUserAccount,
  type ChangePasswordFormValues,
  type DeleteAccountFormValues,
} from "@/lib/auth";
import {
  validateChangePasswordFormField,
  validateDeleteAccountFormField,
} from "@/lib/auth-form-schemas";
import { cognitoPasswordPolicyMessage } from "@/lib/password-policy";

export default function AccountPage() {
  const router = useRouter();
  const { status, user, refreshSession } = useAuth();
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } satisfies ChangePasswordFormValues,
    onSubmit: async ({ value }) => {
      setPasswordError(null);
      setPasswordMessage(null);

      try {
        const message = await changeCurrentUserPassword(value);
        setPasswordMessage(message);
      } catch (error) {
        setPasswordError(
          error instanceof Error ? error.message : "Unable to update password.",
        );
      }
    },
  });

  const deleteForm = useForm({
    defaultValues: {
      confirmation: "",
    } satisfies DeleteAccountFormValues,
    onSubmit: async ({ value }) => {
      setDeleteError(null);

      try {
        await deleteCurrentUserAccount(value);
        await refreshSession({ showLoading: false });
        router.replace("/login?deleted=1");
      } catch (error) {
        setDeleteError(
          error instanceof Error ? error.message : "Unable to delete account.",
        );
      }
    },
  });

  if (status !== "authenticated") {
    return (
      <AuthSessionScreen
        title="Opening account controls"
        description="Checking your active session before showing account settings."
      />
    );
  }

  const accountLabel = user?.email ?? user?.username;

  return (
    <main className="flex-1 pb-20 pt-8 sm:pt-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-shell"
      >
        <section className="border-b border-[var(--line)] pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04, duration: 0.35 }}
            className="max-w-3xl"
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Account controls
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
              Manage account
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
              Change password, verify current access, or permanently remove your
              profile.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="workspace-panel mt-8 rounded-[1rem] px-5 py-5 sm:px-6"
          >
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Signed in as
              </p>
              <p className="mt-2 break-all text-2xl font-semibold leading-tight text-[var(--foreground)]">
                {accountLabel}
              </p>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.35 }}
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
              Security
            </p>
            <h2 className="mt-3 text-3xl leading-none text-[var(--foreground)]">
              Change password
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
              Use current password once. New password becomes active on future
              sign-ins.
            </p>
            <div className="section-divider mt-6 pt-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Security rule
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--foreground)]">
                {cognitoPasswordPolicyMessage}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
            className="workspace-panel rounded-[1rem] px-5 py-6 sm:px-6"
          >
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void passwordForm.handleSubmit();
              }}
            >
              <div className="grid gap-5">
                <passwordForm.Field
                  name="currentPassword"
                  validators={{
                    onMount: () =>
                      validateChangePasswordFormField(
                        "currentPassword",
                        passwordForm.state.values,
                      ),
                    onChange: ({ value }) =>
                      validateChangePasswordFormField("currentPassword", {
                        ...passwordForm.state.values,
                        currentPassword: value,
                      }),
                    onBlur: ({ value }) =>
                      validateChangePasswordFormField("currentPassword", {
                        ...passwordForm.state.values,
                        currentPassword: value,
                      }),
                  }}
                >
                  {(field) => (
                    <AuthField
                      field={field}
                      label="Current password"
                      tone="secondary"
                      type="password"
                      autoComplete="current-password"
                    />
                  )}
                </passwordForm.Field>

                <div className="grid gap-5 lg:grid-cols-2">
                  <passwordForm.Field
                    name="newPassword"
                    validators={{
                      onMount: () =>
                        validateChangePasswordFormField(
                          "newPassword",
                          passwordForm.state.values,
                        ),
                      onChange: ({ value }) =>
                        validateChangePasswordFormField("newPassword", {
                          ...passwordForm.state.values,
                          newPassword: value,
                        }),
                      onBlur: ({ value }) =>
                        validateChangePasswordFormField("newPassword", {
                          ...passwordForm.state.values,
                          newPassword: value,
                        }),
                    }}
                  >
                    {(field) => (
                      <AuthField
                        field={field}
                        label="New password"
                        tone="secondary"
                        type="password"
                        autoComplete="new-password"
                      />
                    )}
                  </passwordForm.Field>

                  <passwordForm.Field
                    name="confirmPassword"
                    validators={{
                      onMount: () =>
                        validateChangePasswordFormField(
                          "confirmPassword",
                          passwordForm.state.values,
                        ),
                      onChange: ({ value }) =>
                        validateChangePasswordFormField("confirmPassword", {
                          ...passwordForm.state.values,
                          confirmPassword: value,
                        }),
                      onBlur: ({ value }) =>
                        validateChangePasswordFormField("confirmPassword", {
                          ...passwordForm.state.values,
                          confirmPassword: value,
                        }),
                    }}
                  >
                    {(field) => (
                      <AuthField
                        field={field}
                        label="Confirm new password"
                        tone="secondary"
                        type="password"
                        autoComplete="new-password"
                      />
                    )}
                  </passwordForm.Field>
                </div>
              </div>

              {passwordError ? (
                <p className="rounded-[0.8rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {passwordError}
                </p>
              ) : null}

              {passwordMessage ? (
                <p className="rounded-[0.8rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                  {passwordMessage}
                </p>
              ) : null}

              <passwordForm.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="h-12 rounded-[0.8rem] bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                  >
                    {isSubmitting ? "Updating password..." : "Update password"}
                  </Button>
                )}
              </passwordForm.Subscribe>
            </form>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35 }}
          className="border-t border-[var(--line)] py-8 sm:py-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[var(--destructive)]">
                Destructive action
              </p>
              <h2 className="mt-3 text-3xl leading-none text-[var(--foreground)]">
                Delete account
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
                Removes account access permanently. Saved splits for this user
                stop being available after deletion.
              </p>
              <div className="section-divider mt-6 pt-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  Deletion rule
                </p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--foreground)]">
                  Type DELETE to confirm permanent removal.
                </p>
              </div>
            </div>

            <div className="workspace-panel rounded-[1rem] px-5 py-6 sm:px-6">
              <form
                className="space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void deleteForm.handleSubmit();
                }}
              >
                <div className="max-w-md">
                  <p className="text-sm leading-7 text-[var(--foreground)]">
                    Confirm by typing{" "}
                    <span className="font-semibold">DELETE</span>.
                  </p>
                </div>

                <div className="max-w-md">
                  <deleteForm.Field
                    name="confirmation"
                    validators={{
                      onMount: () =>
                        validateDeleteAccountFormField(
                          "confirmation",
                          deleteForm.state.values,
                        ),
                      onChange: ({ value }) =>
                        validateDeleteAccountFormField("confirmation", {
                          ...deleteForm.state.values,
                          confirmation: value,
                        }),
                      onBlur: ({ value }) =>
                        validateDeleteAccountFormField("confirmation", {
                          ...deleteForm.state.values,
                          confirmation: value,
                        }),
                    }}
                  >
                    {(field) => (
                      <AuthField
                        field={field}
                        label="Confirmation"
                        tone="primary"
                        placeholder='Type "DELETE"'
                        autoComplete="off"
                        spellCheck={false}
                      />
                    )}
                  </deleteForm.Field>
                </div>

                {deleteError ? (
                  <p className="rounded-[0.8rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {deleteError}
                  </p>
                ) : null}

                <deleteForm.Subscribe
                  selector={(state) => ({
                    canSubmit: state.canSubmit,
                    isSubmitting: state.isSubmitting,
                  })}
                >
                  {({ canSubmit, isSubmitting }) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="h-12 rounded-[0.8rem] bg-[#ff0000] px-5 text-sm font-semibold text-[#fff8f6] transition-opacity hover:bg-[#cc0000] hover:opacity-90 active:bg-[#cc0000] disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isSubmitting ? "Deleting account..." : "Delete account"}
                    </Button>
                  )}
                </deleteForm.Subscribe>
              </form>
            </div>
          </div>
        </motion.section>
      </motion.section>
    </main>
  );
}
