provider "aws" {
  region = "us-east-1"
  profile = "default"
}

provider "cloudflare" {
  # CLOUDFLARE_API_TOKEN environment variable used for authentication
}