# run only once so that github can talk to sts
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

# create a bucket once that will be used as a tfstate storage solution
resource "aws_s3_bucket" "terraform_state_storage" {
  bucket_prefix = "terraform-state-storage-"
}

# block public access
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.terraform_state_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# explicitly set default SSE-S3 encryption for documentation purposes
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.terraform_state_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# enable versioning for the bucket 
resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.terraform_state_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# lifecycle policy to keep only the last 3 versions after 1 day to save on storage costs
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.terraform_state_storage.id

  rule {
    id     = "keep-last-3-versions-after-1-day"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days           = 1
      newer_noncurrent_versions = 2
    }
  }
}

module "dev-github-actions-auth" {
  source                  = "../../modules/github-actions-auth"
  environment             = "dev"
  repo_name               = var.repo_name
  github_repo_path        = var.github_repo_path
  github_repo_environment = var.github_repo_environment
  website_s3_bucket_arn   = var.website_s3_bucket_arn
  tfstate_s3_bucket_object = {
    arn           = aws_s3_bucket.terraform_state_storage.arn,
    object_prefix = "${aws_s3_bucket.terraform_state_storage.arn}/checksplit/dev"
  }
}
