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

output "receipt_api_graphql_api_id" {
  description = "The receipt AppSync GraphQL API ID for the dev environment."
  value       = module.receipt-api.graphql_api_id
}

output "receipt_api_graphql_api_url" {
  description = "The receipt AppSync GraphQL API URL for the dev environment."
  value       = module.receipt-api.graphql_api_url
}

output "receipt_api_table_name" {
  description = "The receipts DynamoDB table name for the dev environment."
  value       = module.receipt-api.dynamodb_table_name
}
