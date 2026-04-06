export type LoginFormValues = {
  email: string
  password: string
}

export type SignupFormValues = {
  email: string
  password: string
  confirmPassword: string
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// placeholder function
export async function loginWithCredentials(
  values: LoginFormValues,
): Promise<void> {
  await wait(400)
  console.info("Login auth stub invoked", {
    email: values.email,
  })
}

// placeholder function
export async function signUpWithCredentials(
  values: SignupFormValues,
): Promise<void> {
  await wait(400)
  console.info("Signup auth stub invoked", {
    email: values.email,
    hasConfirmation: values.password === values.confirmPassword,
  })
}
