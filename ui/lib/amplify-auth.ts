import { Amplify } from "aws-amplify"

import { cognitoPasswordPolicy } from "@/lib/password-policy"

let isAmplifyConfigured = false

const cognitoUserPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
const cognitoUserPoolClientId =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
const awsRegion = process.env.NEXT_PUBLIC_AWS_REGION
const receiptApiGraphqlUrl = process.env.NEXT_PUBLIC_RECEIPT_API_GRAPHQL_URL

export function hasAmplifyAuthConfig() {
  return Boolean(cognitoUserPoolId && cognitoUserPoolClientId)
}

export function hasAmplifyDataConfig() {
  return Boolean(
    cognitoUserPoolId &&
      cognitoUserPoolClientId &&
      awsRegion &&
      receiptApiGraphqlUrl,
  )
}

export function getReceiptApiGraphqlUrl() {
  return receiptApiGraphqlUrl
}

export function getAwsRegion() {
  return awsRegion
}

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

  const dataConfig = hasAmplifyDataConfig()
    ? {
        API: {
          GraphQL: {
            defaultAuthMode: "userPool" as const,
            endpoint: receiptApiGraphqlUrl as string,
            region: awsRegion as string,
          },
        },
      }
    : {}

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
    ...dataConfig,
  })

  isAmplifyConfigured = true
}
