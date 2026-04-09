variable "application_name" {
  description = "Application name used in resource naming."
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID used for AppSync authentication."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}
