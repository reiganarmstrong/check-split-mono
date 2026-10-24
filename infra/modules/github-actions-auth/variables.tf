variable "environment" {
  type = string
}

variable "receipt_parse_api_key_ssm_parameter_name" {
  description = "Optional receipt API key parameter whose ARN Terraform may look up without decryption."
  type        = string
  default     = null
}

variable "repo_name" {
  type = string
}

variable "github_repo_path" {
  type = string

}

variable "github_repo_environment" {
  type = string
}

variable "website_s3_bucket_arn" {
  type = string
}

variable "tfstate_s3_bucket_object" {
  type = object({
    arn           = string,
    object_prefix = string
  })
}
