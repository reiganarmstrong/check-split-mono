# Cognito Auth Module

This module provisions the authentication layer for the application:

- a Cognito user pool
- a Cognito user pool client
- a custom Cognito domain backed by ACM
- a Cloudflare CNAME that points the auth hostname at Cognito's managed CloudFront distribution

The result is a Cognito setup that uses the app's own domain instead of the default Cognito domain.

## How It Works

1. `aws_cognito_user_pool.this` creates the user pool with email-based sign-in and auto-verification.
2. The password policy enforces secure defaults and account recovery is limited to verified email.
3. `aws_cognito_user_pool_domain.this` attaches a custom domain to the pool using the validated ACM certificate.
4. `cloudflare_dns_record.this` creates a CNAME from `var.auth_domain` to Cognito's CloudFront distribution.
5. `aws_cognito_user_pool_client.this` creates the application client with SRP auth and refresh-token rotation enabled.

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
  U["User browser"] --> D["auth custom domain"]
  D --> CF["Cognito-managed CloudFront distribution"]
  CF --> C["Cognito user pool domain"]
  C --> P["Cognito user pool"]
  P --> CL["User pool client"]
  Z["Cloudflare zone"] --> D
  A["Validated ACM certificate"] --> C

  classDef user fill:#FFF4CC,stroke:#C99700,color:#4A3A00,stroke-width:2px;
  classDef edge fill:#F4D8CD,stroke:#BC6C25,color:#5F370E,stroke-width:2px;
  classDef auth fill:#D9EAFD,stroke:#2F6690,color:#102A43,stroke-width:2px;
  classDef dns fill:#E6F4EA,stroke:#3C6E47,color:#132A13,stroke-width:2px;

  class U user;
  class D,CF edge;
  class C,P,CL,A auth;
  class Z dns;
```

## Request Flow

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
  participant B as Browser
  participant CF as Cloudflare DNS
  participant CD as Cognito custom domain
  participant UP as User Pool

  rect rgb(255, 249, 219)
  B->>CF: Resolve auth hostname
  CF-->>B: CNAME to Cognito distribution
  end
  rect rgb(217, 234, 253)
  B->>CD: Start sign-in flow
  CD->>UP: Authenticate against user pool
  end
  rect rgb(230, 244, 234)
  UP-->>B: Cognito-hosted auth response
  end
```

## Example

```hcl
module "cognito-auth" {
  source                          = "../../modules/cognito-auth"
  validated_cert_arn              = module.certificates.validated_cert_arn
  environment                     = var.environment
  root_domain                     = var.root_domain
  subdomain                       = var.subdomain
  cloudflare_zone_id              = var.cloudflare_zone_id
  auth_domain                     = local.auth_subdomain
  cognito_user_pool_resource_name = local.cognito_user_pool_resource_name
  depends_on                      = [module.static-website-hosting]
}
```

## Inputs

| Name | Type | Description |
| --- | --- | --- |
| `environment` | `string` | Environment label supplied by the caller. |
| `root_domain` | `string` | Root domain for the application. Present for composition consistency; not currently used inside the module. |
| `subdomain` | `string` | Application subdomain. Present for composition consistency; not currently used inside the module. |
| `cloudflare_zone_id` | `string` | Cloudflare zone ID that will host the auth CNAME record. |
| `validated_cert_arn` | `string` | ACM certificate ARN used for the Cognito custom domain. |
| `auth_domain` | `string` | Fully-qualified auth hostname, such as `auth.dev.example.com`. |
| `cognito_user_pool_resource_name` | `string` | Resource name for the Cognito user pool. |

## Outputs

| Name | Description |
| --- | --- |
| `user_pool_id` | Cognito user pool ID. |
| `user_pool_client_id` | Cognito user pool client ID. |

## Notes

- MFA is explicitly disabled in the current implementation.
- OAuth and social identity providers are intentionally left as TODOs in the Terraform.
- In this repo, the caller waits for website hosting to exist before creating the custom auth domain. That matches the inline comment in the CDN module about Cognito's custom-domain bootstrap behavior.
