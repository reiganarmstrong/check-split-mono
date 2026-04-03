terraform {
  backend "s3" {
    # define parameters in backend.hcl
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }

    # CLOUDFLARE_API_TOKEN environment variable used for authentication
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  # needed for cloudfront acm certificate
  region = "us-east-1"
}
