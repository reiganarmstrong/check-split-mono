variable "app_subdomain" {
  description = "Application domain that should be covered by the certificate."
  type        = string
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare domain zone id."
}

variable "environment" {
  type        = string
  description = "The environment name"
}
