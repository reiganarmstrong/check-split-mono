module "certs" {
  source             = "../../modules/certs"
  environment        = var.environment
  root_domain        = var.root_domain
  subdomain          = var.subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}

module "auth" {
  source             = "../../modules/auth"
  validated_cert_arn = module.certs.validated_cert_arn
  environment        = var.environment
  root_domain        = var.root_domain
  subdomain          = var.subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}


