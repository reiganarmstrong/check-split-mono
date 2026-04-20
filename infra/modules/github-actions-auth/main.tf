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
data "aws_iam_policy_document" "github_actions_foundation_permissions" {
  statement {
    sid     = "AllowListBucket"
    effect  = "Allow"
    actions = ["s3:ListBucket"]

    resources = [
      var.website_s3_bucket_arn,
      var.tfstate_s3_bucket_object.arn
    ]
  }

  statement {
    sid    = "AllowReadWriteObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    # relevant objects in each bucket
    resources = [
      "${var.website_s3_bucket_arn}/*",
      "${var.tfstate_s3_bucket_object.object_prefix}/*"
    ]
  }

  statement {
    sid    = "AllowManageBucketConfiguration"
    effect = "Allow"
    actions = [
      "s3:*"
    ]

    resources = [var.website_s3_bucket_arn]
  }

  statement {
    sid     = "AllowRequestAcmCertificates"
    effect  = "Allow"
    actions = ["acm:RequestCertificate"]

    resources = ["*"]
  }

  statement {
    sid    = "AllowManageAcmCertificates"
    effect = "Allow"
    actions = [
      "acm:DescribeCertificate",
      "acm:DeleteCertificate",
      "acm:ListTagsForCertificate",
      "acm:AddTagsToCertificate",
      "acm:RemoveTagsFromCertificate"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:acm:us-east-1:${data.aws_caller_identity.current.account_id}:certificate/*"
    ]
  }

  statement {
    sid     = "AllowCreateCognitoUserPools"
    effect  = "Allow"
    actions = ["cognito-idp:CreateUserPool"]

    resources = ["*"]
  }

  statement {
    sid    = "AllowManageCognitoUserPools"
    effect = "Allow"
    actions = [
      "cognito-idp:DescribeUserPool",
      "cognito-idp:GetUserPoolMfaConfig",
      "cognito-idp:SetUserPoolMfaConfig",
      "cognito-idp:UpdateUserPool",
      "cognito-idp:DeleteUserPool",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:UpdateUserPoolClient",
      "cognito-idp:DeleteUserPoolClient",
      "cognito-idp:ListUserPoolClients",
      "cognito-idp:ListTagsForResource",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:cognito-idp:us-east-1:${data.aws_caller_identity.current.account_id}:userpool/*"
    ]
  }

  statement {
    sid    = "AllowManageCognitoUserPoolDomains"
    effect = "Allow"
    actions = [
      "cognito-idp:CreateUserPoolDomain",
      "cognito-idp:DescribeUserPoolDomain",
      "cognito-idp:DeleteUserPoolDomain"
    ]

    resources = ["*"]
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
    sid    = "AllowManageCloudFrontFunctions"
    effect = "Allow"
    actions = [
      "cloudfront:CreateFunction",
      "cloudfront:DescribeFunction",
      "cloudfront:GetFunction",
      "cloudfront:ListFunctions",
      "cloudfront:PublishFunction",
      "cloudfront:UpdateFunction",
      "cloudfront:DeleteFunction"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:cloudfront::${data.aws_caller_identity.current.account_id}:function/*"
    ]
  }

  statement {
    sid     = "AllowListGithubOidcProviders"
    effect  = "Allow"
    actions = ["iam:ListOpenIDConnectProviders"]

    resources = ["*"]
  }

  statement {
    sid     = "AllowReadGithubOidcProvider"
    effect  = "Allow"
    actions = ["iam:GetOpenIDConnectProvider"]

    resources = [data.aws_iam_openid_connect_provider.github.arn]
  }
}

data "aws_iam_policy_document" "github_actions_receipt_api_permissions" {
  statement {
    sid     = "AllowCreateAppSyncApis"
    effect  = "Allow"
    actions = ["appsync:CreateGraphqlApi"]

    resources = ["*"]
  }

  statement {
    sid    = "AllowManageAppSyncReceiptApi"
    effect = "Allow"
    actions = [
      "appsync:CreateDataSource",
      "appsync:CreateFunction",
      "appsync:CreateResolver",
      "appsync:DeleteDataSource",
      "appsync:DeleteFunction",
      "appsync:DeleteGraphqlApi",
      "appsync:DeleteResolver",
      "appsync:GetIntrospectionSchema",
      "appsync:GetDataSource",
      "appsync:GetFunction",
      "appsync:GetGraphqlApi",
      "appsync:GetResolver",
      "appsync:GetSchemaCreationStatus",
      "appsync:ListDataSources",
      "appsync:ListFunctions",
      "appsync:ListGraphqlApis",
      "appsync:ListResolvers",
      "appsync:ListTagsForResource",
      "appsync:StartSchemaCreation",
      "appsync:TagResource",
      "appsync:UntagResource",
      "appsync:UpdateDataSource",
      "appsync:UpdateFunction",
      "appsync:UpdateGraphqlApi",
      "appsync:UpdateResolver"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowManageReceiptTable"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListTagsOfResource",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:UpdateTable"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:dynamodb:us-east-1:${data.aws_caller_identity.current.account_id}:table/checksplit-receipts-${var.environment}",
      "arn:${data.aws_partition.current.partition}:dynamodb:us-east-1:${data.aws_caller_identity.current.account_id}:table/checksplit-receipts-${var.environment}/index/*"
    ]
  }

  statement {
    sid    = "AllowManageAppSyncServiceRoles"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:ListRoleTags",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/checksplit-receipt-api-${var.environment}-*"
    ]
  }

  statement {
    sid    = "AllowReadAppSyncManagedPolicies"
    effect = "Allow"
    actions = [
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListPolicies"
    ]

    resources = [
      "*"
    ]
  }
}

data "aws_iam_policy_document" "github_actions_receipt_ingestion_permissions" {
  statement {
    sid    = "AllowManageReceiptIngestionHttpApi"
    effect = "Allow"
    actions = [
      "apigateway:DELETE",
      "apigateway:GET",
      "apigateway:PATCH",
      "apigateway:POST",
      "apigateway:PUT",
      "apigateway:TagResource",
      "apigateway:UntagResource"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/authorizers",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/authorizers/*",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/cors",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/deployments",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/deployments/*",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/integrations",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/integrations/*",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/routes",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/routes/*",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/stages",
      "arn:${data.aws_partition.current.partition}:apigateway:us-east-1::/apis/*/stages/*"
    ]
  }

  statement {
    sid    = "AllowManageReceiptParsingLambda"
    effect = "Allow"
    actions = [
      "lambda:AddPermission",
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:GetPolicy",
      "lambda:ListTags",
      "lambda:RemovePermission",
      "lambda:TagResource",
      "lambda:UntagResource",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:lambda:us-east-1:${data.aws_caller_identity.current.account_id}:function:checksplit-receipt-parse-${var.environment}"
    ]
  }

  statement {
    sid    = "AllowManageReceiptParsingLambdaRoles"
    effect = "Allow"
    actions = [
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:ListRoleTags",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/checksplit-receipt-parse-${var.environment}-lambda"
    ]
  }

  statement {
    sid    = "AllowReadReceiptParsingLogGroups"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowManageReceiptParsingLogGroups"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/checksplit-receipt-parse-${var.environment}"
    ]
  }
}

# create the policy resources from the definitions above
resource "aws_iam_policy" "github_actions_foundation_permissions" {
  name   = "${var.repo_name}-${var.environment}-github-actions-foundation-permissions"
  policy = data.aws_iam_policy_document.github_actions_foundation_permissions.json
}

resource "aws_iam_policy" "github_actions_receipt_api_permissions" {
  name   = "${var.repo_name}-${var.environment}-github-actions-receipt-api-permissions"
  policy = data.aws_iam_policy_document.github_actions_receipt_api_permissions.json
}

resource "aws_iam_policy" "github_actions_receipt_ingestion_permissions" {
  name   = "${var.repo_name}-${var.environment}-github-actions-receipt-ingestion-permissions"
  policy = data.aws_iam_policy_document.github_actions_receipt_ingestion_permissions.json
}

# attach the policies to the iam role
resource "aws_iam_role_policy_attachment" "github_actions_foundation_permissions" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_foundation_permissions.arn
}

resource "aws_iam_role_policy_attachment" "github_actions_receipt_api_permissions" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_receipt_api_permissions.arn
}

resource "aws_iam_role_policy_attachment" "github_actions_receipt_ingestion_permissions" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = aws_iam_policy.github_actions_receipt_ingestion_permissions.arn
}
