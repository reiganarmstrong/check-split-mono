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
          "h-14 rounded-2xl border-transparent bg-muted/50 px-5 text-base transition-colors hover:border-border focus:bg-background",
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
