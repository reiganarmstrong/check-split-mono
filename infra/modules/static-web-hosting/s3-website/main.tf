resource "aws_s3_bucket" "checksplit_bucket" {
  bucket = var.bucket_name
  tags = {
    Environment = var.environment
  }
}

# block all public access, will use OAC via cloudfront to access the bucket
resource "aws_s3_bucket_public_access_block" "checksplit_bucket_public_access_block" {
  bucket = aws_s3_bucket.checksplit_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
