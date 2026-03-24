variable "app_subdomain" {
  type = string
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare domain zone id."
}

variable "root_domain" {
  type = string
}

variable "environment" {
  type        = string
  description = "The environment name"
}
