variable "environment" {
  type        = string
  description = "The environment name"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Domain specific zone id"
}

variable "root_domain" {
  type = string
}

variable "subdomain" {
  type = string
}
