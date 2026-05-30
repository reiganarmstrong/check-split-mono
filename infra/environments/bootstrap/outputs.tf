output "dev_github_aws_role_arn" {
  value = module.dev-github-actions-auth.github_actions_role_arn
}

output "staging_github_aws_role_arn" {
  value = module.staging-github-actions-auth.github_actions_role_arn
}

output "prod_github_aws_role_arn" {
  value = module.prod-github-actions-auth.github_actions_role_arn
}
