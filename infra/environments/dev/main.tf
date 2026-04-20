module "certificates" {
  source             = "../../modules/certificates"
  environment        = var.environment
  root_domain        = var.root_domain
  app_subdomain      = local.app_subdomain
  cloudflare_zone_id = var.cloudflare_zone_id
}

module "static-website-hosting" {
  source                   = "../../modules/static-website-hosting"
  environment              = var.environment
  bucket_name              = var.website_s3_bucket_name
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

module "receipt-api" {
  source               = "../../modules/receipt-api"
  application_name     = local.application_name
  cognito_user_pool_id = module.cognito-auth.user_pool_id
  environment          = var.environment
}

module "receipt-ingestion-api" {
  source                            = "../../modules/receipt-ingestion-api"
  application_name                  = local.application_name
  cognito_user_pool_client_id       = module.cognito-auth.user_pool_client_id
  cognito_user_pool_id              = module.cognito-auth.user_pool_id
  environment                       = var.environment
  gemini_api_key_ssm_parameter_name = var.gemini_api_key_ssm_parameter_name
  gemini_model_id                   = var.gemini_model_id
  receipt_parse_allowed_origins     = var.receipt_parse_allowed_origins
  receipt_parse_max_upload_bytes    = var.receipt_parse_max_upload_bytes
}
