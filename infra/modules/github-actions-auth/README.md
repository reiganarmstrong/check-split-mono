# GitHub Actions Auth Module

This module creates an IAM role that GitHub Actions can assume through GitHub's OIDC provider, then attaches a policy that grants the workflow the AWS permissions needed to manage this stack.

The trust policy is intentionally narrow: only a specific repository path and GitHub Actions environment can assume the role.

## How It Works

1. The module looks up the existing GitHub OIDC provider in AWS IAM.
2. It creates `aws_iam_role.github_actions_role` with an STS web-identity trust policy.
3. The trust policy requires:
   - audience `sts.amazonaws.com`
   - subject `repo:${var.github_repo_path}:environment:${var.github_repo_environment}`
4. It builds an IAM policy covering the specific AWS services this infrastructure needs:
   - S3 bucket and object access
   - ACM certificate lifecycle operations
   - Cognito user pool and domain management
   - CloudFront distribution, cache policy, function, and OAC management
   - API Gateway HTTP API management for receipt parsing ingress
   - Lambda and CloudWatch Logs management for the receipt parsing function
   - read access to the GitHub OIDC provider metadata
5. The policy is attached to the role and the role ARN is exported for workflow configuration.

## Architecture

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#D9EAFD"
    primaryTextColor: "#102A43"
    primaryBorderColor: "#2F6690"
    lineColor: "#486581"
    secondaryColor: "#E6F4EA"
    tertiaryColor: "#FFF4CC"
---
flowchart LR
  G["GitHub Actions job"] --> T["OIDC token from GitHub"]
  T --> R["IAM role trust policy"]
  R --> S["sts:AssumeRoleWithWebIdentity"]
  S --> I["GitHub Actions IAM role"]
  I --> A["AWS permissions policy"]
  A --> AG["API Gateway"]
  A --> CF["CloudFront"]
  A --> C["Cognito"]
  A --> ACM["ACM"]
  A --> L["Lambda"]
  A --> S3["S3"]

  classDef ci fill:#FFF4CC,stroke:#C99700,color:#4A3A00,stroke-width:2px;
  classDef trust fill:#F4D8CD,stroke:#BC6C25,color:#5F370E,stroke-width:2px;
  classDef iam fill:#D9EAFD,stroke:#2F6690,color:#102A43,stroke-width:2px;
  classDef aws fill:#E6F4EA,stroke:#3C6E47,color:#132A13,stroke-width:2px;

  class G,T ci;
  class R,S trust;
  class I,A iam;
  class AG,CF,C,ACM,L,S3 aws;
```

## Trust Boundary

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#D9EAFD"
    primaryTextColor: "#102A43"
    primaryBorderColor: "#2F6690"
    actorBorder: "#2F6690"
    actorBkg: "#FFF4CC"
    actorTextColor: "#4A3A00"
    signalColor: "#486581"
    signalTextColor: "#102A43"
    labelBoxBkgColor: "#E6F4EA"
    labelBoxBorderColor: "#3C6E47"
    labelTextColor: "#132A13"
---
sequenceDiagram
  participant GH as GitHub Actions
  participant OIDC as GitHub OIDC
  participant STS as AWS STS
  participant IAM as IAM role

  rect rgb(255, 249, 219)
  GH->>OIDC: Request OIDC token
  OIDC-->>GH: Token with repo/environment claims
  end
  rect rgb(244, 216, 205)
  GH->>STS: AssumeRoleWithWebIdentity(token)
  STS->>IAM: Evaluate aud + sub conditions
  IAM-->>STS: Allow for matching repo/environment only
  end
  rect rgb(230, 244, 234)
  STS-->>GH: Temporary AWS credentials
  end
```

## Example

```hcl
module "dev-github-actions-auth" {
  source                  = "../../modules/github-actions-auth"
  environment             = "dev"
  repo_name               = var.repo_name
  github_repo_path        = var.github_repo_path
  github_repo_environment = var.github_repo_environment
  website_s3_bucket_arn   = var.website_s3_bucket_arn
  tfstate_s3_bucket_object = {
    arn           = aws_s3_bucket.terraform_state_storage.arn
    object_prefix = "${aws_s3_bucket.terraform_state_storage.arn}/checksplit/dev"
  }
}
```

## Inputs

| Name | Type | Description |
| --- | --- | --- |
| `environment` | `string` | Environment suffix used in IAM role and policy names. |
| `repo_name` | `string` | Repository short name used in IAM resource naming. |
| `github_repo_path` | `string` | GitHub repository path used in the OIDC subject condition, for example `owner/repo`. |
| `github_repo_environment` | `string` | GitHub Actions environment name required by the trust policy. |
| `website_s3_bucket_arn` | `string` | ARN of the website bucket that workflows need to manage. |
| `tfstate_s3_bucket_object` | `object({ arn = string, object_prefix = string })` | Terraform state bucket ARN plus the object-prefix scope for read/write object access. |

## Outputs

| Name | Description |
| --- | --- |
| `github_actions_role_arn` | IAM role ARN to configure in GitHub Actions. |

## Notes

- This module assumes the GitHub OIDC provider already exists in the account.
- The attached policy is broad enough to support the currently-managed infra modules, but it is still scoped by service and resource shape rather than using full admin access.
- The module intentionally does not grant GitHub Actions write access to the Gemini API key in SSM Parameter Store. That secret is created and rotated out of band.
