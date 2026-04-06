output "website_s3_bucket_arn" {
  value = module.static-website-hosting.s3_bucket_arn
}

output "cognito_user_pool_id" {
  description = "The Cognito user pool ID for the dev UI."
  value       = module.cognito-auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "The Cognito user pool client ID for the dev UI."
  value       = module.cognito-auth.user_pool_client_id
}
