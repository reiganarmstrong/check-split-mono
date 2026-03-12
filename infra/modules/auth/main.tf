resource "aws_cognito_user_pool" "checksplit_user_pool" {
  name = "checksplit_user_pool_${var.environment}"

  # sets the email as the username and allows cognito to handle verification of email
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # sets the password policy to secure defaults
  password_policy {
    minimum_length = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers = true
    require_symbols = true
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