output "dynamodb_table_arn" {
  description = "ARN of the receipts DynamoDB table."
  value       = aws_dynamodb_table.receipts.arn
}

output "dynamodb_table_name" {
  description = "Name of the receipts DynamoDB table."
  value       = aws_dynamodb_table.receipts.name
}

output "graphql_api_arn" {
  description = "ARN of the AppSync GraphQL API."
  value       = aws_appsync_graphql_api.this.arn
}

output "graphql_api_id" {
  description = "ID of the AppSync GraphQL API."
  value       = aws_appsync_graphql_api.this.id
}

output "graphql_api_url" {
  description = "GraphQL endpoint URL for the AppSync API."
  value       = aws_appsync_graphql_api.this.uris["GRAPHQL"]
}
