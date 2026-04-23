# CheckSplit

CheckSplit is a work-in-progress receipt splitting app. The goal is to let a signed-in user scan a restaurant receipt, turn it into a structured draft, assign items across people or groups, track who has paid, and save the record for future reference/edits.

This repository currently has two main pieces:

- `ui/`: Includes the Next.js frontend that will statically export.
- `infra/`: Includes the Terraform modules that define the infrastructure for the application.

## Main Usage Flow

The application currently is built around one main end-to-end flow:

1. User signs up or logs in with Cognito.
2. User starts a new receipt and uploads a photo or enters data manually.
3. If a photo was uploaded, the browser compresses the image to fit the ingestion API limit (4 MB).
4. Cognito-protected HTTP API sends the image to a Lambda that calls a Gemini api and normalizes the response into the app's receipt draft shape.
5. User reviews merchant details, groups, items, discounts, tax, tip, and fees in the receipt workspace.
6. Frontend saves the receipt to a Cognito-protected AppSync GraphQL API backed by DynamoDB.
7. User can reopen saved receipts, mark groups as paid, and generate a shareable visual summary.

## Architecture Overview

At a high level, CheckSplit uses a static frontend with managed AWS backend services instead of a long-running application server. This route was chosen to scale as close to zero as possible.

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
flowchart TB
  U["Browser"] --> CF["CloudFront"]
  CF --> S3["S3 static site"]
  CF --> C["Cognito auth"]
  CF --> G["AppSync GraphQL API"]
  CF --> H["Receipt ingestion HTTP API"]
  C -. "JWT auth" .-> G
  C -. "JWT auth" .-> H
  H --> L["Lambda parser"]
  S["SSM Parameter Store<br/>Gemini API key"] --> L
  L --> M["Gemini API"]
  G --> D["DynamoDB receipt table"]

  classDef client fill:#E5E7EB,stroke:#6B7280,color:#111827,stroke-width:2px;
  classDef cloudfront fill:#8C4FFF,stroke:#6D28D9,color:#FFFFFF,stroke-width:2px;
  classDef s3 fill:#7AA116,stroke:#5B7A10,color:#FFFFFF,stroke-width:2px;
  classDef cognito fill:#DD344C,stroke:#B42336,color:#FFFFFF,stroke-width:2px;
  classDef appsync fill:#E7157B,stroke:#B10F5E,color:#FFFFFF,stroke-width:2px;
  classDef apiGateway fill:#8C4FFF,stroke:#6D28D9,color:#FFFFFF,stroke-width:2px;
  classDef lambda fill:#ED7100,stroke:#B55400,color:#FFFFFF,stroke-width:2px;
  classDef ssm fill:#E7157B,stroke:#B10F5E,color:#FFFFFF,stroke-width:2px;
  classDef dynamodb fill:#C925D1,stroke:#8E1AA1,color:#FFFFFF,stroke-width:2px;
  classDef gemini fill:#4285F4,stroke:#EA4335,color:#FFFFFF,stroke-width:2px;

  class U client;
  class CF cloudfront;
  class S3 s3;
  class C cognito;
  class G appsync;
  class H apiGateway;
  class L lambda;
  class S ssm;
  class D dynamodb;
  class M gemini;
```

## Repo Folder Structure

### `ui/`

Holds the frontend, a static-exported Next.js app. Authentication is facilitated using the Amplify js library to authenticate with Cognito. The resulting JWT is sent in the authorization header as a bearer token when communicating with backend apis.

Important UI capabilities visible in code today:

- landing page explaining general application workflow
- Cognito email/password sign-up, login, and confirmation
- saved receipt archive with search, sort, and paid/unpaid grouping
- receipt workspace for manual entry or AI-assisted draft creation
- payment tracking per group
- generated receipt summary share image

See [`ui/README.md`](./ui/README.md) for frontend-specific details.

### `infra/`

This folder contains the infrastructure definitions. It is structured with reusable Terraform modules in `infra/modules/` plus root level environment modules in `infra/environments/`.

#### Modules Overview:

- `infra/modules/static-website-hosting`: private S3 + CloudFront + Cloudflare DNS for static deploys
- `infra/modules/cognito-auth`: Cognito user pool, client configuration, and custom auth domain configuration
- `infra/modules/receipt-api`: AppSync + DynamoDB receipt persistence
- `infra/modules/receipt-ingestion-api`: Cognito-protected HTTP API + Lambda + Gemini integration
- `infra/modules/github-actions-auth`: narrow AWS role for GitHub Actions via OIDC

Module READMEs go into more detail. Use them for implementation specifics, inputs, outputs, and diagrams:

- [`infra/modules/static-website-hosting/README.md`](./infra/modules/static-website-hosting/README.md)
- [`infra/modules/cognito-auth/README.md`](./infra/modules/cognito-auth/README.md)
- [`infra/modules/receipt-api/README.md`](./infra/modules/receipt-api/README.md)
- [`infra/modules/receipt-ingestion-api/README.md`](./infra/modules/receipt-ingestion-api/README.md)
- [`infra/modules/certificates/README.md`](./infra/modules/certificates/README.md)
- [`infra/modules/github-actions-auth/README.md`](./infra/modules/github-actions-auth/README.md)

#### Environment Overview

`infra/environments/dev` is the root level module for the development environment

`infra/environments/bootstrap` includes a root level Terraform module for one-time bootstrap for:

- GitHub OIDC
- Terraform state storage
- IAM role for GitHub Actions runners

`infra/environments/prod` currently does not exist but will be the root level module for the production environment in the future

## CI/CD

GitHub Actions currently handles all CI/CD for the dev environment:

- `.github/workflows/pr-infra-dev.yml`
  - plan Terraform for infra PRs
- `.github/workflows/deploy-infra-dev.yml`
  - apply `infra/environments/dev` on `main`
- `.github/workflows/deploy-ui-dev.yml`
  - build static frontend and sync `ui/out` to S3, then invalidate CloudFront

## Local Development

Frontend local dev happens from `ui/`:

```bash
cd ui
pnpm install
pnpm dev
```

The UI expects Cognito, region, GraphQL, and receipt parsing URLs in local env vars. In practice, those values come from Terraform outputs in `infra/environments/dev`.

Infra work happens from the relevant environment directory after creating `terraform.tfvars` and backend config locally or through CI secrets.

## Status

This project is still in progress. Some signals of that in the codebase:

- social auth buttons exist in the UI, but OAuth providers are not enabled in Terraform yet
- product scope is centered on the dev environment first
- module docs are stronger than root-level project docs, which is what this README is intended to fix

If you want implementation detail, start at the module READMEs and the UI README. If you want product and system intent, this root README is the overview.
