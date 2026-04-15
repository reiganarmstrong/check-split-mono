import { Button } from "@/components/ui/button"

type SocialAuthButtonsProps = {
  tone?: "neutral" | "primary" | "secondary"
}

export function SocialAuthButtons({
  tone = "neutral",
}: SocialAuthButtonsProps) {
  const disabledToneClassName =
    tone === "secondary"
      ? "disabled:border-[var(--line)] disabled:bg-[var(--surface)] disabled:text-[var(--muted-foreground)]"
      : tone === "primary"
        ? "disabled:border-[var(--line)] disabled:bg-[var(--surface)] disabled:text-[var(--muted-foreground)]"
        : "disabled:border-[var(--line)] disabled:bg-[var(--surface)] disabled:text-[var(--muted-foreground)]"

  const socialButtonClassName =
    `h-14 rounded-[1rem] border font-medium text-[var(--foreground)] transition-colors disabled:cursor-not-allowed ${disabledToneClassName}`

  return (
    <>
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--line)]" />
        </div>
        <div className="relative flex justify-center text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
          <span className="bg-[var(--surface-strong)] px-4">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          type="button"
          disabled
          className={`${socialButtonClassName} border-[var(--line)] bg-[var(--panel)] shadow-none hover:bg-[var(--surface)]`}
        >
          <svg className="mr-0 h-5 w-5 sm:mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="hidden sm:inline">Google</span>
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled
          className={`${socialButtonClassName} border-[var(--line)] bg-[var(--panel)] shadow-none hover:bg-[var(--surface)]`}
        >
          <svg
            className="mr-0 h-5 w-5 sm:mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 1.58-.09 2.94.51 3.76 1.65-3.37 1.88-2.82 6.03.35 7.34-.78 1.91-1.8 3.02-2.77 3.98zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span className="hidden sm:inline">Apple</span>
        </Button>
      </div>

      <p className="mt-3 text-center text-xs font-medium text-[var(--muted-foreground)]">
        Google and Apple sign-in stay disabled until OAuth providers are enabled in
        the Cognito Terraform client.
      </p>
    </>
  )
}
