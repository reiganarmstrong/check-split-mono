output "checksplit_bucket_id" {
  value = aws_s3_bucket.checksplit_bucket.id
}

output "checksplit_bucket_arn" {
  value = aws_s3_bucket.checksplit_bucket.arn
}

output "checksplit_bucket_regional_domain" {
  value = aws_s3_bucket.checksplit_bucket.bucket_regional_domain_name
}
