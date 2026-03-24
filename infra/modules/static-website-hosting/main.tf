module "s3-website" {
  source      = "./s3-website"
  environment = var.environment
  bucket_name = var.bucket_name
}

module "cloudfront-cdn" {
  source                         = "./cloudfront-cdn"
  s3_bucket_id                   = module.s3-website.bucket_id
  s3_bucket_arn                  = module.s3-website.bucket_arn
  s3_bucket_regional_domain_name = module.s3-website.bucket_regional_domain
  cloudfront_custom_domain       = var.cloudfront_custom_domain
  acm_certificate_arn            = var.acm_certificate_arn
  cloudflare_zone_id             = var.cloudflare_zone_id
}
