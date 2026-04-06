import {
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signUp,
} from "aws-amplify/auth"

import { configureAmplifyAuth } from "@/lib/amplify-auth"
import { cognitoPasswordPolicyMessage } from "@/lib/password-policy"

export type LoginFormValues = {
  email: string
  password: string
}

export type SignupFormValues = {
  email: string
  password: string
  confirmPassword: string
}

export type ConfirmSignupFormValues = {
  email: string
  code: string
}

export type LoginResult =
  | {
      status: "done"
      message: string
    }
  | {
      status: "confirmation-required"
      email: string
      message: string
    }

export type SignupResult =
  | {
      status: "done"
      message: string
    }
  | {
      status: "confirmation-required"
      email: string
      message: string
    }

function getErrorName(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    return error.name
  }

  return undefined
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return undefined
}

function formatCodeDestination(destination?: string) {
  return destination ? ` at ${destination}` : ""
}

function toAuthError(error: unknown) {
  const errorName = getErrorName(error)

  switch (errorName) {
    case "UserAlreadyAuthenticatedException":
      return new Error("This browser already has an active session for that user.")
    case "UserNotConfirmedException":
      return new Error("Verify your email before signing in.")
    case "NotAuthorizedException":
      return new Error("Incorrect email or password.")
    case "UserNotFoundException":
      return new Error("No account exists for that email.")
    case "UsernameExistsException":
      return new Error("An account with that email already exists.")
    case "InvalidPasswordException":
      return new Error(cognitoPasswordPolicyMessage)
    case "CodeMismatchException":
      return new Error("That verification code is invalid.")
    case "ExpiredCodeException":
      return new Error("That verification code has expired. Request a new one.")
    case "LimitExceededException":
      return new Error("Too many attempts. Wait a moment and try again.")
    default: {
      const fallbackMessage = getErrorMessage(error)
      return new Error(fallbackMessage ?? "Authentication request failed.")
    }
  }
}

export async function loginWithCredentials(
  values: LoginFormValues,
): Promise<LoginResult> {
  configureAmplifyAuth()

  try {
    const result = await signIn({
      username: values.email,
      password: values.password,
    })

    switch (result.nextStep.signInStep) {
      case "DONE":
        return {
          status: "done",
          message: "Signed in successfully. Your Cognito session is active in this browser.",
        }
      case "CONFIRM_SIGN_UP":
        return {
          status: "confirmation-required",
          email: values.email,
          message: "Verify your email before signing in.",
        }
      default:
        throw new Error(
          `This UI currently supports the basic email/password flow only. Cognito requested ${result.nextStep.signInStep}.`,
        )
    }
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function signUpWithCredentials(
  values: SignupFormValues,
): Promise<SignupResult> {
  if (values.password !== values.confirmPassword) {
    throw new Error("Passwords must match.")
  }

  configureAmplifyAuth()

  try {
    const result = await signUp({
      username: values.email,
      password: values.password,
      options: {
        userAttributes: {
          email: values.email,
        },
      },
    })

    switch (result.nextStep.signUpStep) {
      case "DONE":
        return {
          status: "done",
          message: "Account created successfully. You can sign in now.",
        }
      case "CONFIRM_SIGN_UP":
        return {
          status: "confirmation-required",
          email: values.email,
          message: `We sent a verification code to your email${formatCodeDestination(
            result.nextStep.codeDeliveryDetails.destination,
          )}.`,
        }
      default:
        throw new Error(
          `This UI currently supports the standard Cognito email confirmation flow only. Cognito requested ${result.nextStep.signUpStep}.`,
        )
    }
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function confirmSignupWithCode(
  values: ConfirmSignupFormValues,
): Promise<string> {
  configureAmplifyAuth()

  try {
    const result = await confirmSignUp({
      username: values.email,
      confirmationCode: values.code,
    })

    if (result.nextStep.signUpStep !== "DONE") {
      throw new Error(
        `Sign-up confirmation completed, but Cognito requested ${result.nextStep.signUpStep} next.`,
      )
    }

    return "Email verified. You can sign in now."
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function resendSignupConfirmationCode(email: string): Promise<string> {
  configureAmplifyAuth()

  try {
    const result = await resendSignUpCode({
      username: email,
    })

    return `A new verification code was sent${formatCodeDestination(
      result.destination,
    )}.`
  } catch (error) {
    throw toAuthError(error)
  }
}
