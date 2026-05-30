variable "dev_website_s3_bucket_arn" {
  description = "ARN of the dev website S3 bucket that GitHub Actions manages."
  type        = string
}

variable "github_repo_path" {
  description = "GitHub repository path in owner/repo format."
  type        = string
}

variable "prod_website_s3_bucket_arn" {
  description = "ARN of the prod website S3 bucket that GitHub Actions manages."
  type        = string
}

variable "repo_name" {
  description = "Repository name used as a prefix for GitHub Actions IAM resources."
  type        = string
}

variable "staging_website_s3_bucket_arn" {
  description = "ARN of the staging website S3 bucket that GitHub Actions manages."
  type        = string
}
