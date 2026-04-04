# output the ARN to use in GitHub workflow
output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_role.arn
}
