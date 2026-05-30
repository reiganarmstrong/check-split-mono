output "cloudfront_distribution_id" {
  value = module.cloudfront-cdn.cloudfront_distribution_id
}

output "s3_bucket_arn" {
  value = module.s3-website.bucket_arn
}
