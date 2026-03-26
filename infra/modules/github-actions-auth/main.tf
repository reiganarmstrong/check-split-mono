# get the github oidc provider created in bootstrap environment
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# create an iam role that github actions can assume for the specified repo
resource "aws_iam_role" "github_actions_role" {
  name = "github-actions-${var.repo_name}-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = data.aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          # prevents cross-service impersonation attacks
          StringEquals = {
            "token.actions.githubusercontent.com:aud" : "sts.amazonaws.com"
          }
          # ensures that the token is meant for this repo and branch
          StringLike = {
            "token.actions.githubusercontent.com:sub" : "repo:${var.github_repo_path}:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}

# Output the ARN so you can use it in your GitHub workflow
output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_role.arn
}
