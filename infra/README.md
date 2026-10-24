# Infrastructure

This folder contains the Terraform code for CheckSplit.

Infra is split into reusable modules under `modules/` and root level environment modules under `environments/`. The current active application environment is `environments/dev`. `environments/bootstrap` is the one-time setup for Terraform state storage and GitHub Actions AWS access.

## Layout

- `AGENTS.md`: local Terraform editing rules for this part of the repo
- `modules/`: reusable infrastructure building blocks
- `environments/`: root modules that wire those building blocks together per environment
- `util/`: helper scripts for local operator workflows

## Modules

- `static-website-hosting`: wraps private S3 origin hosting and CloudFront delivery
- `certificates`: requests and validates the ACM certificate used by CloudFront and Cognito custom domains
- `cognito-auth`: provisions the Cognito user pool, client, and custom auth domain
- `receipt-api`: provisions the Cognito-protected AppSync API and fixed-capacity DynamoDB receipt table
- `receipt-ingestion-api`: provisions the Cognito-protected HTTP API, Lambda parser, and OpenAI integration
- `github-actions-auth`: provisions the IAM role GitHub Actions assumes through OIDC

Each module has its own README with architecture notes, inputs, outputs, and Mermaid diagrams.

## Environments

### `environments/bootstrap`

Bootstraps the shared AWS pieces that must exist before normal CI-driven deploys can work:

- GitHub OIDC provider in AWS IAM
- S3 bucket for Terraform remote state
- GitHub Actions IAM role for the `dev` environment

Run this once initially. It is not part of the normal application deploy loop.

### `environments/dev`

Composes the current development stack:

- ACM certificate
- static website hosting
- Cognito auth
- receipt persistence API
- receipt ingestion API

This is the environment targeted by the infra deployment workflows in `.github/workflows/`.

### `environments/prod`

Will house the future production environment.

## Local Workflow

Terraform runs from the environment directory, not from the module directories directly. In practice that means:

```bash
cd infra/environments/dev
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

The environment directories expect local `terraform.tfvars` and `backend.hcl` files. In CI those are created from GitHub environment secrets before `terraform init` and `terraform apply`.

The receipt ingestion Lambda is built separately before Terraform plan/apply so the package exists when Terraform references it.

## Helper Script

`util/cf-env-loader.sh` is a local convenience wrapper that loads the Cloudflare API token from Bitwarden and then runs Terraform with that token in the environment.

Before deploying receipt extraction, provision each environment's OpenAI key as a SecureString at `/checksplit/<environment>/openai/api-key` and apply bootstrap so its CI role can look up that parameter. Application deployment cannot grant this permission to its own CI role.

Run the read-only readiness check with operator credentials that allow SSM reads and IAM policy simulation:

```bash
python3 infra/util/check-receipt-parser-readiness.py
# Or check a single environment:
python3 infra/util/check-receipt-parser-readiness.py --environment staging
```

The check requires an existing SecureString, CI read access, and an explicit denial of CI decryption. It never decrypts or prints key values. It checks the default parameter paths; check custom paths separately if overriding them. Staging and production workflows retain Terraform diagnostics in their logs so a failed deployment reports its cause.

Both release workflows also accept `deploy_target=plan-only`. This builds the Lambda and runs Terraform plan with the environment's actual CI credentials and secrets, while skipping infrastructure apply and UI deployment:

```bash
gh workflow run deploy-prod.yml --ref main -f deploy_target=plan-only
```

## Notes

- CloudFront and Cognito custom domains both rely on the ACM certificate requested in `us-east-1`
- receipt tables use fixed provisioned capacity totaling `12 RCU / 12 WCU` across dev, staging, and prod; see the receipt API module README for the per-environment allocation
- the website deploy path is separate from Terraform and lives in `.github/workflows/deploy-ui-dev.yml`
- most implementation detail belongs in the module READMEs rather than this folder-level overview
