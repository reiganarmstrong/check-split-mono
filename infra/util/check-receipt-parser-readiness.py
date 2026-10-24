"""Read-only deployment regression check; requires AWS CLI and IAM simulation access."""
import argparse
import json
import re
import subprocess


def aws(region, *arguments):
    result = subprocess.run(
        ["aws", *arguments, "--region", region, "--output", "json", "--no-cli-pager"],
        capture_output=True, text=True,
    )
    if result.returncode:
        code = re.search(r"\(([^)]+)\)", result.stderr)
        # Never print service response bodies, parameter values, or credentials.
        raise RuntimeError(code.group(1) if code else "AWS request failed")
    return json.loads(result.stdout)


def check(environment, region):
    name = f"/checksplit/{environment}/openai/api-key"
    role = aws(region, "iam", "get-role", "--role-name",
               f"check-split-mono-{environment}-github-actions")["Role"]["Arn"]
    partition, account = role.split(":")[1], role.split(":")[4]
    arn = f"arn:{partition}:ssm:{region}:{account}:parameter{name}"
    try:
        parameter = aws(region, "ssm", "get-parameter", "--name", name,
                        "--no-with-decryption", "--query", "{arn:Parameter.ARN,type:Parameter.Type}")
        arn = parameter["arn"]
        secure = parameter["type"] == "SecureString"
        status = parameter["type"]
    except RuntimeError as error:
        secure, status = False, str(error)

    def decision(action, resource, *extra):
        response = aws(region, "iam", "simulate-principal-policy", "--policy-source-arn", role,
                       "--action-names", action, "--resource-arns", resource, *extra)
        return response["EvaluationResults"][0]["EvalDecision"]

    read = decision("ssm:GetParameter", arn)
    decrypt = decision("kms:Decrypt", "*", "--context-entries", json.dumps([{
        "ContextKeyName": "kms:EncryptionContext:PARAMETER_ARN",
        "ContextKeyType": "string", "ContextKeyValues": [arn],
    }]))
    ready = secure and read == "allowed" and decrypt == "explicitDeny"
    print(f"{environment}: parameter={status}, CI read={read}, CI decrypt={decrypt}: "
          f"{'PASS' if ready else 'FAIL'}")
    return ready


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", action="append", choices=["dev", "staging", "prod"])
    parser.add_argument("--region", default="us-east-1")
    args = parser.parse_args()
    results = []
    for environment in args.environment or ["dev", "staging", "prod"]:
        try:
            results.append(check(environment, args.region))
        except RuntimeError as error:
            print(f"{environment}: FAIL ({error})")
            results.append(False)
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
