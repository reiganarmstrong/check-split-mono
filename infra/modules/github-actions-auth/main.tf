# get the github oidc provider created in bootstrap environment
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# create an iam role that github actions can assume for the specified repo
resource "aws_iam_role" "github_actions_role" {
  name               = "${var.repo_name}-${var.environment}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_sts_policy.json
}

# allow github workflows in a specific repo and environment to assume the role with this policy
data "aws_iam_policy_document" "github_actions_sts_policy" {
  statement {
    sid     = "GithubActionsSTSAssumeWithWebIdentity"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo_path}:environment:${var.github_repo_environment}"]
    }
  }
}

# allow github to read and write the s3 bucket with the static web files
data "aws_iam_policy_document" "s3_read_write_policy_definition" {

  # needed for s3 sync
  statement {
    sid     = "AllowListBucket"
    effect  = "Allow"
    actions = ["s3:ListBucket"]

    resources = [var.s3_bucket_arn]
  }

  # allow read write on all objects
  statement {
    sid    = "AllowReadWriteObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    # all objects in bucket
    resources = ["${var.s3_bucket_arn}/*"]
  }
}

# create the policy resource from the definition above
resource "aws_iam_policy" "s3_read_write_policy" {
  name   = "${var.s3_bucket_name}-read-write-policy"
  policy = data.aws_iam_policy_document.s3_read_write_policy_definition.json
}

# attach the policy to the iam role
resource "aws_iam_role_policy_attachment" "github_actions_role_s3_read_write_policy_attachment" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.s3_read_write_policy.arn
}

