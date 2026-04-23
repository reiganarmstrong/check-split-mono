# CheckSplit UI

This frontend is the user-facing part of CheckSplit: landing page, Cognito auth flow, saved receipt archive, receipt creation/editing workspace, and shareable split summaries.

It is a Next.js app using static export mode, then deployed as static files to S3 + CloudFront. Runtime behavior still stays rich because the browser talks directly to Cognito, AppSync, and the receipt parsing HTTP API.

## Frontend Responsibilities

The UI currently owns:

- marketing/landing experience at `/`
- sign up, login, and email confirmation flows
- session-aware navigation and redirects
- saved receipts archive at `/dashboard`
- new receipt workspace at `/dashboard/new`
- existing receipt workspace at `/dashboard/receipt?receiptId=...`
- local receipt editing, validation, and save planning
- summary sharing image generation for receipt splits

## Architecture Notes

Important frontend boundaries:

- Auth uses Amplify against Cognito.
- Saved receipts are loaded and mutated through the AppSync GraphQL API.
- Receipt image parsing goes through a separate Cognito-protected HTTP API.
- Parsed receipt drafts stay local in editor state until the user saves.
- Build output is static because `next.config.ts` sets `output: "export"`.

That gives the project a useful split:

- static hosting and routing simplicity
- managed auth and data services
- no custom always-on web server for the UI

## Receipt Workspace Flow

The main product flow in this package is:

1. User opens a new receipt workspace.
2. User uploads an image or starts manual entry.
3. Browser compresses JPEG/PNG uploads to fit the current `4 MB` API limit.
4. Receipt parsing API returns a normalized draft plus parse issues and review hints.
5. User edits merchant details, groups, items, and adjustments.
6. UI calculates totals, per-group shares, and save operations locally.
7. UI persists the receipt through the GraphQL API.
8. Saved receipts can be reopened later from the archive and marked as paid over time.

## Local Development

Install dependencies and start the app:

```bash
pnpm install
pnpm dev
```

Other useful commands:

```bash
pnpm test
pnpm lint
pnpm build
```

## Required Env Vars

The app expects these values locally:

```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=...
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_RECEIPT_API_GRAPHQL_URL=https://...
NEXT_PUBLIC_RECEIPT_PARSE_API_URL=https://...
```

In this repo, those values come from the Terraform-managed dev environment in `../infra/environments/dev`, especially:

- `cognito_user_pool_id`
- `cognito_user_pool_client_id`
- `receipt_api_graphql_api_url`
- `receipt_parse_api_url`

## Current Constraints

Current implementation details worth knowing:

- auth flow is email/password only right now
- social buttons are present in UI, but OAuth providers are not wired through Terraform yet
- receipt parsing currently supports JPEG and PNG uploads
- workspace save/load behavior assumes Cognito-authenticated access to backend APIs

## Deployment

The deploy target is not Vercel. CI builds this app as static files and syncs `ui/out` to the S3 bucket managed by Terraform, then invalidates CloudFront.

If you need hosting and backend details, read:

- [`../README.md`](../README.md)
- [`../infra/modules/static-website-hosting/README.md`](../infra/modules/static-website-hosting/README.md)
- [`../infra/modules/cognito-auth/README.md`](../infra/modules/cognito-auth/README.md)
- [`../infra/modules/receipt-api/README.md`](../infra/modules/receipt-api/README.md)
- [`../infra/modules/receipt-ingestion-api/README.md`](../infra/modules/receipt-ingestion-api/README.md)
