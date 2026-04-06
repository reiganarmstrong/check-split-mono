import { Amplify } from "aws-amplify"

import { cognitoPasswordPolicy } from "@/lib/password-policy"

let isAmplifyConfigured = false

const cognitoUserPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
const cognitoUserPoolClientId =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID

export function configureAmplifyAuth() {
  if (isAmplifyConfigured) {
    return
  }

  if (!cognitoUserPoolId) {
    throw new Error(
      "Missing NEXT_PUBLIC_COGNITO_USER_POOL_ID. Define the Cognito env vars in ui/.env.local.",
    )
  }

  if (!cognitoUserPoolClientId) {
    throw new Error(
      "Missing NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID. Define the Cognito env vars in ui/.env.local.",
    )
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: cognitoUserPoolId,
        userPoolClientId: cognitoUserPoolClientId,
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: "code",
        passwordFormat: {
          minLength: cognitoPasswordPolicy.minimumLength,
          requireLowercase: cognitoPasswordPolicy.requireLowercase,
          requireUppercase: cognitoPasswordPolicy.requireUppercase,
          requireNumbers: cognitoPasswordPolicy.requireNumbers,
          requireSpecialCharacters:
            cognitoPasswordPolicy.requireSpecialCharacters,
        },
      },
    },
  })

  isAmplifyConfigured = true
}
