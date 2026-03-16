output "user_pool_id" {
  description = "The ID of the user pool"
  value       = aws_cognito_user_pool.checksplit_user_pool.id
}

output "user_pool_client_id" {
  description = "The ID of the user pool client"
  value       = aws_cognito_user_pool_client.checksplit_user_pool_client.id
}
