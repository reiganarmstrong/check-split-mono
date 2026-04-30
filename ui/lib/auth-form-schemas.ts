import { z } from "zod"

import { validateCognitoPassword } from "@/lib/password-policy"

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")

const loginPasswordSchema = z.string().min(1, "Password is required")

const signupPasswordSchema = z.string().superRefine((value, context) => {
  const message = validateCognitoPassword(value)

  if (!message) {
    return
  }

  context.addIssue({
    code: "custom",
    message,
  })
})

const confirmPasswordSchema = z.string().min(1, "Confirm your password")

export const loginFormSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
})

export type LoginFormValues = z.infer<typeof loginFormSchema>

export const signupFormSchema = z
  .object({
    email: emailSchema,
    password: signupPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (!confirmPassword || confirmPassword === password) {
      return
    }

    context.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords must match",
    })
  })

export type SignupFormValues = z.infer<typeof signupFormSchema>

export const confirmSignupFormSchema = z.object({
  email: emailSchema,
  code: z.string().min(1, "Verification code is required"),
})

export type ConfirmSignupFormValues = z.infer<typeof confirmSignupFormSchema>

export const requestPasswordResetFormSchema = z.object({
  email: emailSchema,
})

export type RequestPasswordResetFormValues = z.infer<
  typeof requestPasswordResetFormSchema
>

export const confirmPasswordResetFormSchema = z
  .object({
    email: emailSchema,
    code: z.string().min(1, "Reset code is required"),
    newPassword: signupPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine(({ newPassword, confirmPassword }, context) => {
    if (!confirmPassword || confirmPassword === newPassword) {
      return
    }

    context.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords must match",
    })
  })

export type ConfirmPasswordResetFormValues = z.infer<
  typeof confirmPasswordResetFormSchema
>

const currentPasswordSchema = z.string().min(1, "Current password is required")

const deleteAccountConfirmationSchema = z
  .string()
  .trim()
  .superRefine((value, context) => {
    if (value === "DELETE") {
      return
    }

    context.addIssue({
      code: "custom",
      message: 'Type "DELETE" to confirm',
    })
  })

export const changePasswordFormSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: signupPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine(({ newPassword, confirmPassword }, context) => {
    if (!confirmPassword || confirmPassword === newPassword) {
      return
    }

    context.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords must match",
    })
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

export const deleteAccountFormSchema = z.object({
  confirmation: deleteAccountConfirmationSchema,
})

export type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>

function getFieldError<FieldName extends string>(
  error: z.ZodError,
  fieldName: FieldName,
) {
  return error.issues.find((issue) => issue.path[0] === fieldName)?.message
}

function validateFormField<
  FormValues extends Record<string, string>,
  FieldName extends keyof FormValues & string,
>(
  schema: z.ZodType<FormValues>,
  fieldName: FieldName,
  values: FormValues,
) {
  const result = schema.safeParse(values)

  if (result.success) {
    return undefined
  }

  return getFieldError(result.error, fieldName)
}

export function validateLoginFormField(
  fieldName: keyof LoginFormValues,
  values: LoginFormValues,
) {
  return validateFormField(loginFormSchema, fieldName, values)
}

export function validateSignupFormField(
  fieldName: keyof SignupFormValues,
  values: SignupFormValues,
) {
  return validateFormField(signupFormSchema, fieldName, values)
}

export function validateRequestPasswordResetFormField(
  fieldName: keyof RequestPasswordResetFormValues,
  values: RequestPasswordResetFormValues,
) {
  return validateFormField(requestPasswordResetFormSchema, fieldName, values)
}

export function validateConfirmPasswordResetFormField(
  fieldName: keyof ConfirmPasswordResetFormValues,
  values: ConfirmPasswordResetFormValues,
) {
  return validateFormField(confirmPasswordResetFormSchema, fieldName, values)
}

export function validateChangePasswordFormField(
  fieldName: keyof ChangePasswordFormValues,
  values: ChangePasswordFormValues,
) {
  return validateFormField(changePasswordFormSchema, fieldName, values)
}

export function validateDeleteAccountFormField(
  fieldName: keyof DeleteAccountFormValues,
  values: DeleteAccountFormValues,
) {
  return validateFormField(deleteAccountFormSchema, fieldName, values)
}
