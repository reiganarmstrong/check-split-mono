locals {
  environment_domain_prefix       = var.environment == "prod" ? "" : "${var.environment}."
  app_subdomain                   = "${local.environment_domain_prefix}${var.subdomain}"
  auth_subdomain                  = "auth.${local.app_subdomain}"
  cognito_user_pool_resource_name = "checksplit_user_pool_${var.environment}"
  application_name                = "checksplit"
}
