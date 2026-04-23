# GitHub Workflows

This folder contains the GitHub Actions workflows for this repository.

The active automation target today is the `dev` environment.

## `pr-infra-dev.yml`

Runs on pull requests to `main` when files under `infra/environments/dev/**` or `infra/modules/**` change.

What it does:

- checks out only the infra and helper-script paths needed for the job
- authenticates to AWS through GitHub OIDC
- reconstructs `terraform.tfvars` and `backend.hcl` from GitHub secrets
- installs Terraform, pnpm, and Node.js
- installs and builds the `receipt-ingestion-api` Lambda package
- runs `terraform plan`
- posts or updates a PR comment with the plan result

## `deploy-infra-dev.yml`

Runs on pushes to `main` when the dev environment or any shared infra module changes.

What it does:

- checks out the dev environment and shared infra modules
- authenticates to AWS through GitHub OIDC
- reconstructs `terraform.tfvars` and `backend.hcl`
- installs Terraform plus the Lambda build toolchain
- builds the `receipt-ingestion-api` Lambda package
- runs `terraform apply` for `infra/environments/dev`

## `deploy-ui-dev.yml`

Runs on pushes to `main` when files under `ui/**` change.

What it does:

- checks out the UI only
- installs pnpm and Node.js
- writes `.env` from GitHub environment variables
- builds the static Next.js export
- authenticates to AWS through GitHub OIDC
- syncs `ui/out` to the target S3 bucket
- invalidates the CloudFront distribution

## Required GitHub Environment Data

These workflows expect repository or environment configuration for items such as:

- AWS role ARN for OIDC-based auth
- Terraform variable content
- Terraform backend config content
- Cloudflare API token for Terraform
- UI environment variables
- S3 bucket name
- CloudFront distribution ID

## Notes

- workflow permissions are declared explicitly because OIDC requires `id-token: write`
- both infra workflows build the ingestion Lambda before Terraform so the package exists for plan/apply
- the workflows use sparse checkout to reduce job setup time and checkout size
