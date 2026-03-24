locals {
  environment_domain_prefix       = var.environment == "prod" ? "" : "${var.environment}."
  app_subdomain                   = "${local.environment_domain_prefix}${var.subdomain}"
  auth_subdomain                  = "auth.${local.app_subdomain}"
  cognito_user_pool_resource_name = "checksplit_user_pool_${var.environment}"
}

module "certificates" {
  source             = "../../modules/certificates"
  environment        = var.environment
  root_domain        = var.root_domain
  subdomain          = var.subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}

module "static-website-hosting" {
  source                   = "../../modules/static-website-hosting"
  environment              = var.environment
  bucket_name              = var.bucket_name
  cloudflare_zone_id       = var.cloudflare_zone_id
  acm_certificate_arn      = module.certificates.validated_cert_arn
  cloudfront_custom_domain = local.app_subdomain
}


module "cognito-auth" {
  source                          = "../../modules/cognito-auth"
  validated_cert_arn              = module.certificates.validated_cert_arn
  environment                     = var.environment
  root_domain                     = var.root_domain
  subdomain                       = var.subdomain
  cloudflare_zone_id              = var.cloudflare_zone_id
  auth_domain                     = local.auth_subdomain
  cognito_user_pool_resource_name = local.cognito_user_pool_resource_name
  depends_on                      = [module.static-website-hosting]
}



