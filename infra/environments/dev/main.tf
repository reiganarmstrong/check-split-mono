locals {
  environment_domain_prefix       = var.environment == "prod" ? "" : "${var.environment}."
  auth_domain                     = "auth.${local.environment_domain_prefix}${var.subdomain}"
  cognito_user_pool_resource_name = "checksplit_user_pool_${var.environment}"
}

module "certificates" {
  source             = "../../modules/certificates"
  environment        = var.environment
  root_domain        = var.root_domain
  subdomain          = var.subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}

module "cognito-auth" {
  source                          = "../../modules/cognito-auth"
  validated_cert_arn              = module.certificates.validated_cert_arn
  environment                     = var.environment
  root_domain                     = var.root_domain
  subdomain                       = var.subdomain
  cloudflare_zone_id              = var.cloudflare_zone_id
  auth_domain                     = local.auth_domain
  cognito_user_pool_resource_name = local.cognito_user_pool_resource_name
}


