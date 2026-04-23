# GitHub Automation

This folder contains the GitHub Actions workflows and small helper scripts used by this repository.

The workflows are centered on one active environment today: `dev`.

## Workflows

### `workflows/pr-infra-dev.yml`

Runs on pull requests to `main` when files under `infra/environments/dev/**` or `infra/modules/**` change.

What it does:

- checks out only the infra and helper-script paths needed for the job
- authenticates to AWS through GitHub OIDC
- reconstructs `terraform.tfvars` and `backend.hcl` from GitHub secrets
- installs Terraform, pnpm, and Node.js
- installs and builds the `receipt-ingestion-api` Lambda package
- runs `terraform plan`
- posts or updates a PR comment with the plan result

### `workflows/deploy-infra-dev.yml`

Runs on pushes to `main` when the dev environment or any shared infra module changes.

What it does:

- checks out the dev environment and shared infra modules
- authenticates to AWS through GitHub OIDC
- reconstructs `terraform.tfvars` and `backend.hcl`
- installs Terraform plus the Lambda build toolchain
- builds the `receipt-ingestion-api` Lambda package
- runs `terraform apply` for `infra/environments/dev`

### `workflows/deploy-ui-dev.yml`

Runs on pushes to `main` when files under `ui/**` change.

What it does:

- checks out the UI only
- installs pnpm and Node.js
- writes `.env` from GitHub environment variables
- builds the static Next.js export
- authenticates to AWS through GitHub OIDC
- syncs `ui/out` to the target S3 bucket
- invalidates the CloudFront distribution

## Scripts

### `scripts/pr-plan-comment.sh`

Small helper used by `pr-infra-dev.yml`.

It finds or creates a PR comment marked with `<!--terraform-plan-comment-->` and updates that comment with either:

- `Terraform Plan Succeeded`
- `Terraform Plan Failed`

This keeps infra PRs to one rolling plan-status comment instead of creating a new comment on every workflow run.

## Required GitHub Environment Data

The workflows expect repository or environment configuration for items such as:

- AWS role ARN for OIDC-based auth
- Terraform variable content
- Terraform backend config content
- Cloudflare API token for Terraform
- UI environment variables
- S3 bucket name
- CloudFront distribution ID

## Notes

- workflow permissions are intentionally declared explicitly because OIDC requires `id-token: write`
- both infra workflows build the ingestion Lambda before Terraform so the packaged artifact exists for plan/apply
- the workflows use sparse checkout to reduce job setup time and checkout size
