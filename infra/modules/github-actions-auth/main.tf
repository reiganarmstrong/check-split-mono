# get the github oidc provider created in bootstrap environment
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

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

# allow github to modify aws resources as needed while following the principle of least privilege
data "aws_iam_policy_document" "github_actions_aws_resource_permissions" {
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

  statement {
    sid    = "AllowManageBucketConfiguration"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:GetBucketLocation",
      "s3:GetBucketPolicy",
      "s3:PutBucketPolicy",
      "s3:DeleteBucketPolicy",
      "s3:GetBucketPublicAccessBlock",
      "s3:PutBucketPublicAccessBlock",
      "s3:DeleteBucketPublicAccessBlock",
      "s3:GetBucketTagging",
      "s3:PutBucketTagging",
      "s3:DeleteBucketTagging"
    ]

    resources = [var.s3_bucket_arn]
  }

  statement {
    sid    = "AllowManageAcmCertificates"
    effect = "Allow"
    actions = [
      "acm:RequestCertificate",
      "acm:DescribeCertificate",
      "acm:DeleteCertificate",
      "acm:ListTagsForCertificate",
      "acm:AddTagsToCertificate",
      "acm:RemoveTagsFromCertificate"
    ]

    resources = [
      "*",
      "arn:${data.aws_partition.current.partition}:acm:us-east-1:${data.aws_caller_identity.current.account_id}:certificate/*"
    ]
  }

  statement {
    sid    = "AllowManageCognitoUserPools"
    effect = "Allow"
    actions = [
      "cognito-idp:CreateUserPool",
      "cognito-idp:DescribeUserPool",
      "cognito-idp:UpdateUserPool",
      "cognito-idp:DeleteUserPool",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:UpdateUserPoolClient",
      "cognito-idp:DeleteUserPoolClient",
      "cognito-idp:CreateUserPoolDomain",
      "cognito-idp:DescribeUserPoolDomain",
      "cognito-idp:DeleteUserPoolDomain",
      "cognito-idp:ListUserPoolClients",
      "cognito-idp:ListTagsForResource",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource"
    ]

    resources = [
      "*",
      "arn:${data.aws_partition.current.partition}:cognito-idp:us-east-1:${data.aws_caller_identity.current.account_id}:userpool/*"
    ]
  }

  statement {
    sid    = "AllowManageCloudFront"
    effect = "Allow"
    actions = [
      "cloudfront:CreateCachePolicy",
      "cloudfront:GetCachePolicy",
      "cloudfront:GetCachePolicyConfig",
      "cloudfront:DeleteCachePolicy",
      "cloudfront:CreateDistribution",
      "cloudfront:GetDistribution",
      "cloudfront:GetDistributionConfig",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:CreateOriginAccessControl",
      "cloudfront:GetOriginAccessControl",
      "cloudfront:GetOriginAccessControlConfig",
      "cloudfront:UpdateOriginAccessControl",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:ListTagsForResource",
      "cloudfront:TagResource",
      "cloudfront:UntagResource"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowReadGithubOidcProvider"
    effect = "Allow"
    actions = [
      "iam:GetOpenIDConnectProvider",
      "iam:ListOpenIDConnectProviders"
    ]

    resources = [
      "*",
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
    ]
  }

  statement {
    sid    = "AllowManageGithubActionsRole"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:GetRole",
      "iam:DeleteRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:TagRole",
      "iam:UntagRole"
    ]

    resources = [
      "*",
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/${var.repo_name}-${var.environment}-github-actions"
    ]
  }

  statement {
    sid    = "AllowManageGithubActionsPolicy"
    effect = "Allow"
    actions = [
      "iam:CreatePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:CreatePolicyVersion",
      "iam:DeletePolicyVersion",
      "iam:DeletePolicy",
      "iam:ListPolicyVersions",
      "iam:TagPolicy",
      "iam:UntagPolicy"
    ]

    resources = [
      "*",
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:policy/${var.s3_bucket_name}-read-write-policy"
    ]
  }
}

# create the policy resource from the definition above
resource "aws_iam_policy" "github_actions_aws_resource_permissions" {
  name   = "${var.s3_bucket_name}-github-actions-aws-resource-permissions"
  policy = data.aws_iam_policy_document.github_actions_aws_resource_permissions.json
}

# attach the policy to the iam role
resource "aws_iam_role_policy_attachment" "github_actions_aws_resource_permissions" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_aws_resource_permissions.arn
}
