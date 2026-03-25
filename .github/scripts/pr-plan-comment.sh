#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# check for required environment variables
if [ -z "$GITHUB_REPOSITORY" ] || [ -z "$PR_NUMBER" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: Missing GITHUB_REPOSITORY, PR_NUMBER, or GITHUB_TOKEN."
  exit 1
fi

# read the terraform plan output from a file
if [ ! -f "plan.txt" ]; then
  echo "Error: plan.txt not found."
  exit 1
fi
PLAN_OUTPUT=$(cat plan.txt)

# hidden marker for finding the comment later
MARKER="<!--terraform-plan-comment-->"
COMMENT_BODY=$(cat <<EOF
$MARKER
#### Terraform Plan 📖

<details><summary>Click to expand the full plan</summary>

\`\`\`terraform
$PLAN_OUTPUT
\`\`\`

</details>

*Last updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")*
EOF
)

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