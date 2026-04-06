export const cognitoPasswordPolicy = {
  minimumLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialCharacters: true,
} as const

export const cognitoPasswordPolicyMessage =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol characters."

export function validateCognitoPassword(value: string) {
  if (!value) {
    return "Password is required"
  }

  if (value.length < cognitoPasswordPolicy.minimumLength) {
    return cognitoPasswordPolicyMessage
  }

  if (cognitoPasswordPolicy.requireLowercase && !/[a-z]/.test(value)) {
    return cognitoPasswordPolicyMessage
  }

  if (cognitoPasswordPolicy.requireUppercase && !/[A-Z]/.test(value)) {
    return cognitoPasswordPolicyMessage
  }

  if (cognitoPasswordPolicy.requireNumbers && !/[0-9]/.test(value)) {
    return cognitoPasswordPolicyMessage
  }

  if (
    cognitoPasswordPolicy.requireSpecialCharacters &&
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return cognitoPasswordPolicyMessage
  }

  return undefined
}
