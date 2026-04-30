# GitHub Scripts

This folder contains small helper scripts used by the GitHub Actions workflows.

## `pr-plan-comment.sh`

Used by `../workflows/pr-infra-dev.yml`.

The script:

- checks that the required GitHub environment variables are present
- searches the current pull request for a comment marked with `<!--terraform-plan-comment-->`
- creates the comment if it does not exist yet
- updates the existing comment if it already exists

The resulting PR comment reports either:

- `Terraform Plan Succeeded`
- `Terraform Plan Failed`

That keeps infra PRs to one rolling Terraform plan-status comment instead of adding a new comment on every workflow run.
