variable "application_name" {
  description = "Application name used in resource naming."
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Cognito user pool client ID used as the JWT authorizer audience."
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID used to construct the JWT issuer URL."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "gemini_api_key_ssm_parameter_name" {
  description = "SSM SecureString parameter name that stores the Gemini API key."
  type        = string
}

variable "gemini_model_id" {
  description = "Gemini direct API model ID used for receipt parsing."
  type        = string
  default     = "gemini-3.1-flash-lite-preview"
}

variable "lambda_memory_size" {
  description = "Memory size, in MB, for the receipt parsing Lambda."
  type        = number
  default     = 1024
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout, in seconds, for receipt parsing requests."
  type        = number
  default     = 30
}

variable "receipt_parse_allowed_origins" {
  description = "Browser origins allowed to call the receipt parsing HTTP API."
  type        = list(string)
}

variable "receipt_parse_max_upload_bytes" {
  description = "Maximum raw image upload size, in bytes, accepted by the receipt parsing API."
  type        = number
  default     = 4194304
}
