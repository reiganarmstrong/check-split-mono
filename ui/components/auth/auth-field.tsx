"use client"

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
  const inputId = id ?? field.name
  const errorMessage = showErrors ? getFieldError(field.state.meta.errors) : undefined

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
        id={inputId}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const nextValue = event.target.value
          field.handleChange(nextValue)
          onValueChange?.(nextValue)
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
