variable "environment" {
  type        = string
  description = "The environment name"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Domain specific zone id"
}

variable "root_domain" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "website_s3_bucket_name" {
  type = string

}

variable "gemini_api_key_ssm_parameter_name" {
  description = "SSM SecureString parameter name that stores the Gemini API key."
  type        = string
  default     = "/checksplit/dev/gemini/api-key"
}

variable "gemini_model_id" {
  description = "Gemini direct API model ID used by the receipt parsing Lambda."
  type        = string
  default     = "gemini-3.1-flash-lite-preview"
}

variable "receipt_parse_allowed_origins" {
  description = "Optional browser origins allowed to call the receipt parsing HTTP API."
  type        = list(string)
}

variable "receipt_parse_max_upload_bytes" {
  description = "Maximum raw image upload size, in bytes, accepted by the receipt parsing API."
  type        = number
  default     = 4194304
}
