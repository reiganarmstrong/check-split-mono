module "certificates" {
  source             = "../../modules/certificates"
  environment        = var.environment
  root_domain        = var.root_domain
  subdomain          = var.subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}

module "cognito-auth" {
  source             = "../../modules/cognito-auth"
  validated_cert_arn = module.certificates.validated_cert_arn
  environment        = var.environment
  root_domain        = var.root_domain
  subdomain          = var.subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}


