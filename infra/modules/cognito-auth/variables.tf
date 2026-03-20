variable "environment" {
  description = "The environment name"
  type        = string
}

variable "root_domain" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare zone ID for the auth service"
  type        = string
}

variable "validated_cert_arn" {
  description = "The arn of the acm certificate indicating ownership of the domain"
  type        = string
}
