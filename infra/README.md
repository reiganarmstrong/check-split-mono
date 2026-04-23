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
- `receipt-api`: provisions the Cognito-protected AppSync API and DynamoDB receipt table
- `receipt-ingestion-api`: provisions the Cognito-protected HTTP API, Lambda parser, and Gemini integration
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

## Notes

- CloudFront and Cognito custom domains both rely on the ACM certificate requested in `us-east-1`
- the website deploy path is separate from Terraform and lives in `.github/workflows/deploy-ui-dev.yml`
- most implementation detail belongs in the module READMEs rather than this folder-level overview
