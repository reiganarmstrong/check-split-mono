locals {
  dummy_ip = "127.0.0.1"
}

# create the oac for cloudfront as identification for points of presence for s3
resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "oac-${var.s3_bucket_id}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# cloudfront caching policy for max cost savings
resource "aws_cloudfront_cache_policy" "this" {
  name = "default-caching-policy-${var.s3_bucket_id}"
  # set high ttl values to keep costs low for origin responses
  default_ttl = 86400
  min_ttl     = 86400
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }

    # cache compression HTTP headers to differentiate between cache versions
    # needed to support different browser needs
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}



# create cloudfront distribution
resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = var.s3_bucket_id
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = var.s3_bucket_id
    viewer_protocol_policy = "redirect-to-https"
    # let cloudfront handle compression
    compress        = true
    cache_policy_id = aws_cloudfront_cache_policy.this.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = [var.cloudfront_custom_domain]

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# policy allowing cloudfront access to s3 bucket based on arns
data "aws_iam_policy_document" "this" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${var.s3_bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

# create resource with defined iam policy allowing cloudfront get access to s3 bucket
resource "aws_s3_bucket_policy" "this" {
  bucket = var.s3_bucket_id
  policy = data.aws_iam_policy_document.this.json
}

# record to point cloudflare to cloudfront
# IMPORTANT: Uncomment after cognito user pool creation
resource "cloudflare_dns_record" "this" {
  zone_id = var.cloudflare_zone_id
  # is assumed to not be zone apex
  name    = var.cloudfront_custom_domain
  ttl     = 1
  type    = "CNAME"
  content = aws_cloudfront_distribution.this.domain_name
  proxied = false
}

# dummy record needed by cognito to not error on creation 
# cognito needs an explicit A record for a custom domain indicating there is a resource
#     behind the domain, a cname record is not enough
# IMPORTANT: Comment after cognito user pool initial creation
# resource "cloudflare_dns_record" "this" {
#   zone_id = var.cloudflare_zone_id
#   # is assumed to not be zone apex
#   name    = var.cloudfront_custom_domain
#   ttl     = 1
#   type    = "A"
#   content = local.dummy_ip
#   proxied = false
# }
