locals {
  environment_domain_prefix = var.environment == "prod" ? "" : "${var.environment}."
}

# request the ACM Certificate
resource "aws_acm_certificate" "cert" {
  domain_name               = var.root_domain
  subject_alternative_names = ["${local.environment_domain_prefix}${var.subdomain}", "*.${local.environment_domain_prefix}${var.subdomain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# create ACM mandated dns records in cloudflare to prove ownership
resource "cloudflare_dns_record" "validation" {
  # iterate over all mandated records
  for_each = {
    # remove wildcard prefix from domain_name as the key to prevent duplicate record error in cloudflare
    # we cannot use resource_record_name because it is not known until apply time
    for dvo in aws_acm_certificate.cert.domain_validation_options : trimprefix(dvo.domain_name, "*.") => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  content = each.value.record
  type    = each.value.type
  ttl     = 1
  comment = "Domain verification record"
  # needed for acm
  proxied = false
}

# trigger the validation process
resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in cloudflare_dns_record.validation : record.name]
}
