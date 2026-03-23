variable "s3_bucket_id" {
  type = string
}
variable "s3_bucket_arn" {
  type = string
}
variable "s3_bucket_regional_domain_name" {
  type = string
}
# is assumed to not be zone apex
variable "cloudfront_custom_domain" {
  type = string
}
variable "acm_certificate_arn" {
  type = string
}
variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare domain zone id."
}
