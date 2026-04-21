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

output "receipt_parse_api_url" {
  description = "The full receipt parsing HTTP API URL for the dev environment."
  value       = module.receipt-ingestion-api.parse_api_url
}

output "receipt_parse_gemini_model_id" {
  description = "The Gemini model configured for the receipt parsing Lambda."
  value       = module.receipt-ingestion-api.gemini_model_id
}

output "receipt_parse_lambda_function_name" {
  description = "The Lambda function name for the receipt parsing HTTP API."
  value       = module.receipt-ingestion-api.lambda_function_name
}
