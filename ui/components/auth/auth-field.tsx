"use client"

import { useCallback, useEffect, useRef } from "react"
import type { ComponentProps, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FieldBinding = {
  name: string
  state: {
    value: string
    meta: {
      errors: unknown[]
      isTouched: boolean
    }
  }
  handleBlur: () => void
  handleChange: (value: string) => void
}

type AuthFieldProps = Omit<
  ComponentProps<typeof Input>,
  "name" | "value" | "onBlur" | "onChange"
> & {
  field: FieldBinding
  label: string
  labelAside?: ReactNode
  showErrors?: boolean
  onValueChange?: (value: string) => void
  tone?: "primary" | "secondary" | "accent"
}

function getFieldError(errors: unknown[]) {
  const firstError = errors.find(Boolean)
  return typeof firstError === "string" ? firstError : undefined
}

export function AuthField({
  field,
  label,
  labelAside,
  showErrors = field.state.meta.isTouched,
  onValueChange,
  tone = "primary",
  className,
  id,
  ...props
}: AuthFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fieldValueRef = useRef(field.state.value)
  const isTouchedRef = useRef(field.state.meta.isTouched)
  const onValueChangeRef = useRef(onValueChange)
  const inputId = id ?? field.name
  const errorMessage = showErrors ? getFieldError(field.state.meta.errors) : undefined
  const toneClassName =
    tone === "accent"
      ? "focus:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:ring-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
      : tone === "secondary"
      ? "focus:border-[var(--secondary)] focus-visible:border-[var(--secondary)] focus-visible:ring-[color-mix(in_oklab,var(--secondary)_28%,transparent)]"
      : "focus:border-[var(--primary)] focus:bg-[var(--surface-strong)]"
  const syncFieldValue = useCallback(
    (nextValue: string) => {
      if (nextValue === fieldValueRef.current) {
        return
      }

      fieldValueRef.current = nextValue
      field.handleChange(nextValue)
      onValueChangeRef.current?.(nextValue)

      if (
        isTouchedRef.current ||
        (typeof document !== "undefined" &&
          document.activeElement !== inputRef.current)
      ) {
        field.handleBlur()
      }
    },
    [field],
  )

  useEffect(() => {
    fieldValueRef.current = field.state.value
    isTouchedRef.current = field.state.meta.isTouched
    onValueChangeRef.current = onValueChange
  }, [field.state.meta.isTouched, field.state.value, onValueChange])

  useEffect(() => {
    const syncFromDom = () => {
      const domValue = inputRef.current?.value

      if (typeof domValue === "string") {
        syncFieldValue(domValue)
      }
    }

    syncFromDom()

    const intervalId = window.setInterval(syncFromDom, 250)
    window.addEventListener("pageshow", syncFromDom)
    window.addEventListener("focus", syncFromDom)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("pageshow", syncFromDom)
      window.removeEventListener("focus", syncFromDom)
    }
  }, [syncFieldValue])

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </Label>
        {labelAside}
      </div>
      <Input
        {...props}
        ref={inputRef}
        id={inputId}
        name={field.name}
        value={field.state.value}
        onBlur={(event) => {
          syncFieldValue(event.currentTarget.value)
          field.handleBlur()
        }}
        onChange={(event) => {
          syncFieldValue(event.currentTarget.value)
        }}
        onInput={(event) => {
          syncFieldValue(event.currentTarget.value)
        }}
        onFocus={(event) => {
          syncFieldValue(event.currentTarget.value)
        }}
        onAnimationStart={(event) => {
          if (event.animationName !== "onAutoFillStart") {
            return
          }

          syncFieldValue(event.currentTarget.value)
        }}
        aria-invalid={Boolean(errorMessage)}
        className={cn(
          "h-[3.25rem] rounded-[0.8rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 text-base font-medium text-[var(--foreground)] transition-colors focus:outline-none focus:ring-0",
          toneClassName,
          className,
        )}
      />
      {errorMessage ? (
        <p className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
