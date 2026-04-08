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
  tone?: "primary" | "secondary"
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
    tone === "secondary"
      ? "shadow-[4px_4px_0px_0px_var(--color-secondary)] hover:shadow-[2px_2px_0px_0px_var(--color-secondary)] focus:border-secondary focus:shadow-[2px_2px_0px_0px_var(--color-secondary)]"
      : "shadow-[4px_4px_0px_0px_var(--color-primary)] hover:shadow-[2px_2px_0px_0px_var(--color-primary)] focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)]"
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
    <div className="space-y-2">
      <div className="ml-1 flex items-center justify-between gap-4">
        <Label htmlFor={inputId} className="font-bold">
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
          "h-14 rounded-full border-4 border-foreground bg-white px-6 text-base font-medium transition-all hover:translate-x-1 hover:translate-y-1 focus:outline-none focus:ring-0",
          toneClassName,
          className,
        )}
      />
      {errorMessage ? (
        <p className="pl-1 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
