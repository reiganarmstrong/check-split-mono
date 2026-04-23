# Static Website Hosting Module

This is a composition module that assembles the application's static hosting stack from two child modules:

- [`s3-website`](./s3-website) for private object storage
- [`cloudfront-cdn`](./cloudfront-cdn) for edge delivery, TLS, route rewriting, and DNS

Use this module when you want the full website-hosting stack rather than managing the S3 and CloudFront pieces separately.

## How It Works

1. `module "s3-website"` creates the S3 bucket and blocks public access.
2. `module "cloudfront-cdn"` uses that bucket as the CloudFront origin.
3. The CDN module creates:
   - an origin access control so CloudFront can read the bucket privately
   - a cache policy optimized for static assets
   - a CloudFront Function that rewrites extensionless routes to `.html`
   - a distribution bound to the custom hostname and ACM certificate
   - a Cloudflare DNS record that points the hostname at CloudFront

## Architecture

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#D9EAFD"
    primaryTextColor: "#102A43"
    primaryBorderColor: "#2F6690"
    lineColor: "#486581"
    secondaryColor: "#E6F4EA"
    tertiaryColor: "#FFF4CC"
---
flowchart LR
  U["Browser"] --> DNS["Cloudflare DNS"]
  DNS --> CF["CloudFront distribution"]
  CF --> F["Viewer-request function<br/>route rewrite"]
  CF --> OAC["Origin access control"]
  OAC --> S3["Private S3 bucket"]
  ACM["Validated ACM certificate"] --> CF

  classDef user fill:#E5E7EB,stroke:#6B7280,color:#111827,stroke-width:2px;
  classDef cloudflare fill:#F48120,stroke:#C96410,color:#FFFFFF,stroke-width:2px;
  classDef cloudfront fill:#8C4FFF,stroke:#6D28D9,color:#FFFFFF,stroke-width:2px;
  classDef s3 fill:#7AA116,stroke:#5B7A10,color:#FFFFFF,stroke-width:2px;
  classDef acm fill:#DD344C,stroke:#B42336,color:#FFFFFF,stroke-width:2px;

  class U user;
  class DNS cloudflare;
  class CF,F,OAC cloudfront;
  class S3 s3;
  class ACM acm;
```

## Module Composition

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#E8EEF9"
    primaryTextColor: "#102A43"
    primaryBorderColor: "#486581"
    lineColor: "#486581"
    secondaryColor: "#E6F4EA"
    tertiaryColor: "#FFF4CC"
---
flowchart TB
  M["static-website-hosting"] --> S["s3-website submodule"]
  M --> C["cloudfront-cdn submodule"]
  S --> O1["bucket_id"]
  S --> O2["bucket_arn"]
  S --> O3["bucket_regional_domain"]
  O1 --> C
  O2 --> C
  O3 --> C

  classDef terraform fill:#844FBA,stroke:#6B21A8,color:#FFFFFF,stroke-width:2px;
  classDef s3 fill:#7AA116,stroke:#5B7A10,color:#FFFFFF,stroke-width:2px;
  classDef cloudfront fill:#8C4FFF,stroke:#6D28D9,color:#FFFFFF,stroke-width:2px;
  classDef output fill:#7AA116,stroke:#5B7A10,color:#FFFFFF,stroke-width:2px;

  class M terraform;
  class S s3;
  class C cloudfront;
  class O1,O2,O3 output;
```

## Example

```hcl
module "static-website-hosting" {
  source                   = "../../modules/static-website-hosting"
  environment              = var.environment
  bucket_name              = var.website_s3_bucket_name
  cloudflare_zone_id       = var.cloudflare_zone_id
  acm_certificate_arn      = module.certificates.validated_cert_arn
  cloudfront_custom_domain = local.app_subdomain
}
```

## Inputs

| Name | Type | Description |
| --- | --- | --- |
| `environment` | `string` | Environment label passed to the bucket submodule. |
| `bucket_name` | `string` | Name of the S3 bucket that stores the site artifacts. |
| `cloudfront_custom_domain` | `string` | Non-apex hostname that CloudFront should answer for. |
| `acm_certificate_arn` | `string` | ACM certificate ARN used by CloudFront for TLS. |
| `cloudflare_zone_id` | `string` | Cloudflare zone where the website DNS record is created. |

## Outputs

| Name | Description |
| --- | --- |
| `s3_bucket_arn` | ARN of the S3 bucket created by the `s3-website` child module. |

## Notes

- The top-level module only exposes the bucket ARN today. If callers need CloudFront attributes, they would need additional outputs added here.
- The current implementation assumes the custom domain is not the zone apex.
