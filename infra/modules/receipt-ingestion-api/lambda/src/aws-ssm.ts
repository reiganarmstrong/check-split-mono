import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"

const client = new SSMClient({})

export async function getSecureStringParameter(parameterName: string): Promise<string> {
  const response = await client.send(
    new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    }),
  )

  const value = response.Parameter?.Value

  if (!value) {
    throw new Error(`SSM parameter ${parameterName} did not return a decrypted value.`)
  }

  return value
}
