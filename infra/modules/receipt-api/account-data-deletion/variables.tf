variable "application_name" {
  description = "Application name used in resource naming."
  type        = string
}

variable "dynamodb_gsi_arn" {
  description = "ARN of the receipts DynamoDB user listing GSI."
  type        = string
}

variable "dynamodb_gsi_name" {
  description = "Name of the receipts DynamoDB user listing GSI."
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the receipts DynamoDB table."
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the receipts DynamoDB table."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "graphql_api_name" {
  description = "Name of the parent AppSync GraphQL API."
  type        = string
}
