#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# check for required environment variables
if [ -z "$GITHUB_REPOSITORY" ] || [ -z "$PR_NUMBER" ] || [ -z "$GITHUB_TOKEN" ] || [ -z "$PLAN_STATUS" ]; then
  echo "Error: Missing GITHUB_REPOSITORY, PR_NUMBER, GITHUB_TOKEN, or PLAN_STATUS."
  exit 1
fi

MARKER="<!--terraform-plan-comment-->"

if [ "$PLAN_STATUS" = "success" ]; then
  COMMENT_BODY="$MARKER
**Terraform Plan Succeeded**"
else
  COMMENT_BODY="$MARKER
**Terraform Plan Failed**
Please check the workflow logs for details."
fi

# search for an existing comment with our marker
echo "Searching for existing Terraform plan comment on PR #$PR_NUMBER..."

# use the gh cli to get comments and jq to filter for our marker
COMMENT_ID=$(gh api repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments \
  --jq ".[] | select(.body | contains(\"$MARKER\")) | .id" | head -n 1)

# create or update the comment
if [ -z "$COMMENT_ID" ]; then
  echo "No existing comment found. Creating a new one..."
  gh api repos/$GITHUB_REPOSITORY/issues/$PR_NUMBER/comments \
    -f body="$COMMENT_BODY" > /dev/null
  echo "Created successfully."
else
  echo "Found existing comment ID: $COMMENT_ID. Updating..."
  gh api -X PATCH repos/$GITHUB_REPOSITORY/issues/comments/$COMMENT_ID \
    -f body="$COMMENT_BODY" > /dev/null
  echo "Updated successfully."
fi