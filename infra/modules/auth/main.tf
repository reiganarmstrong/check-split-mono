locals {
  environment_domain_prefix = var.environment == "prod" ? "" : "${var.environment}."
  auth_domain               = "auth.${local.environment_domain_prefix}${var.subdomain}"
}

resource "aws_cognito_user_pool" "checksplit_user_pool" {
  name = "checksplit_user_pool_${var.environment}"

  # sets the email as the username and allows cognito to handle verification of email
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # TODO: Custom email configuration for prod env

  # sets the password policy to secure defaults
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # sets the account recovery options to verified email only
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # explicit MFA configuration for readability
  mfa_configuration = "OFF"

}

resource "aws_cognito_user_pool_domain" "checksplit_custom_domain" {
  domain          = local.auth_domain
  user_pool_id    = aws_cognito_user_pool.checksplit_user_pool.id
  certificate_arn = var.validated_cert_arn
}

# create cloudflare dns records for the custom cognito domain cloudfront distribution
# this reroutes the traffic to the auth url to cognito
resource "cloudflare_dns_record" "auth_cognito" {
  zone_id = var.cloudflare_zone_id
  name    = local.auth_domain
  # ttl of 1 means automatic in cloudflare
  ttl     = 1
  type    = "CNAME"
  comment = "Domain verification record"
  content = aws_cognito_user_pool_domain.checksplit_custom_domain.cloudfront_distribution
  proxied = false
}


resource "aws_cognito_user_pool_client" "checksplit_user_pool_client" {
  name         = "client"
  user_pool_id = aws_cognito_user_pool.checksplit_user_pool.id

  # allow users to sign in with username and password with refresh tokens
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # enable refresh token rotation
  refresh_token_rotation {
    feature = "ENABLED"
    # prevents flaky network requests from causing refresh token rotation to fail
    retry_grace_period_seconds = 60
  }

  # prevent guessing of registered emails
  prevent_user_existence_errors = "ENABLED"

  # TODO: Configure google and apple federated providers
  # allowed_oauth_flows_user_pool_client = true
  # allowed_oauth_flows                  = ["code"]
  # supported_identity_providers         = ["COGNITO", "Google", "SignInWithApple"]

  # allowed_oauth_scopes = ["email", "openid", "profile"]

  # callback_urls = ["${local.environment_domain_prefix}${var.subdomain}"]
  # logout_urls   = ["${local.environment_domain_prefix}${var.subdomain}"]
}
