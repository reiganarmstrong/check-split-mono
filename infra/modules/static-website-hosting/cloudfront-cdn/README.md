# CloudFront CDN Submodule

This submodule turns a private S3 bucket into a public website endpoint behind CloudFront and Cloudflare DNS.

It owns the edge-specific concerns:

- origin access control
- caching policy
- route rewriting for extensionless URLs
- TLS configuration with ACM
- S3 bucket policy for CloudFront access
- Cloudflare DNS for the custom hostname

## How It Works

1. `aws_cloudfront_origin_access_control.this` enables signed CloudFront access to S3.
2. `aws_cloudfront_cache_policy.this` defines a long-lived static caching profile and varies on gzip/brotli support.
3. `aws_cloudfront_function.static_route_rewrite` rewrites extensionless paths like `/pricing` to `/pricing.html`.
4. `aws_cloudfront_distribution.this` creates the CDN with HTTPS redirects, compression, and the custom hostname alias.
5. `aws_s3_bucket_policy.this` grants `s3:GetObject` only to this CloudFront distribution via `AWS:SourceArn`.
6. `cloudflare_dns_record.this` publishes the custom hostname as a CNAME to the CloudFront distribution.

CloudFront needs the ACM certificate because it must present a valid TLS certificate for the custom domain during the HTTPS handshake; the default CloudFront certificate only covers the `cloudfront.net` hostname.

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
  U["Browser"] --> D["Cloudflare CNAME"]
  D --> CF["CloudFront distribution"]
  CF --> F["CloudFront Function<br/>static-route-rewrite"]
  CF --> OAC["Origin access control"]
  OAC --> S3["S3 origin bucket"]
  BP["Bucket policy<br/>SourceArn = distribution"] --> S3
  ACM["ACM certificate"] --> CF

  classDef user fill:#E5E7EB,stroke:#6B7280,color:#111827,stroke-width:2px;
  classDef cloudflare fill:#F48120,stroke:#C96410,color:#FFFFFF,stroke-width:2px;
  classDef cloudfront fill:#8C4FFF,stroke:#6D28D9,color:#FFFFFF,stroke-width:2px;
  classDef s3 fill:#7AA116,stroke:#5B7A10,color:#FFFFFF,stroke-width:2px;
  classDef iam fill:#DD344C,stroke:#B42336,color:#FFFFFF,stroke-width:2px;
  classDef acm fill:#DD344C,stroke:#B42336,color:#FFFFFF,stroke-width:2px;

  class U user;
  class D cloudflare;
  class CF,F,OAC cloudfront;
  class S3 s3;
  class BP iam;
  class ACM acm;
```

## Request Rewrite

The rewrite is necessary because the UI is deployed with Next.js static export (`output: "export"` in [`ui/next.config.ts`](../../../ui/next.config.ts)), and that build emits concrete HTML files such as `login.html`, `dashboard.html`, and `dashboard/new.html` in `ui/out/` instead of a server that can resolve clean app routes dynamically.

Users still navigate to extensionless paths like `/login` or `/dashboard/new`. With S3 acting as a private object origin behind CloudFront, the origin lookup is by exact object key, so `/login` would not automatically resolve to `login.html`. The CloudFront Function rewrites those extensionless requests to the exported `.html` object keys before the request reaches S3.

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
flowchart TD
  A["Viewer request"] --> B{"URI is / ?"}
  B -->|Yes| R1["Leave as /"]
  B -->|No| C{"URI contains . ?"}
  C -->|Yes| R2["Leave unchanged"]
  C -->|No| D{"Ends with / ?"}
  D -->|Yes| E["Trim trailing /"]
  D -->|No| F["Use URI as-is"]
  E --> G["Append .html"]
  F --> G
  G --> H["Forward rewritten request"]

  classDef request fill:#E5E7EB,stroke:#6B7280,color:#111827,stroke-width:2px;
  classDef decision fill:#8C4FFF,stroke:#6D28D9,color:#FFFFFF,stroke-width:2px;
  classDef result fill:#EDE9FE,stroke:#6D28D9,color:#4C1D95,stroke-width:2px;

  class A request;
  class B,C,D decision;
  class R1,R2,E,F,G,H result;
```

## Example

```hcl
module "cloudfront-cdn" {
  source                         = "./cloudfront-cdn"
  s3_bucket_id                   = module.s3-website.bucket_id
  s3_bucket_arn                  = module.s3-website.bucket_arn
  s3_bucket_regional_domain_name = module.s3-website.bucket_regional_domain
  cloudfront_custom_domain       = var.cloudfront_custom_domain
  acm_certificate_arn            = var.acm_certificate_arn
  cloudflare_zone_id             = var.cloudflare_zone_id
}
```

## Inputs

| Name | Type | Description |
| --- | --- | --- |
| `s3_bucket_id` | `string` | Bucket ID used as the CloudFront origin ID and bucket-policy target. |
| `s3_bucket_arn` | `string` | Bucket ARN used in the S3 read policy. |
| `s3_bucket_regional_domain_name` | `string` | Regional S3 domain name used as the CloudFront origin domain. |
| `cloudfront_custom_domain` | `string` | Custom hostname that should resolve to the distribution. Assumed to be non-apex. |
| `acm_certificate_arn` | `string` | ACM certificate ARN used for HTTPS on the distribution. |
| `cloudflare_zone_id` | `string` | Cloudflare zone where the website CNAME is created. |

## Outputs

| Name | Description |
| --- | --- |
| `cloudfront_domain_name` | CloudFront-generated distribution domain name. |

## Notes

- The source contains commented guidance about temporarily using an A record during Cognito custom-domain bootstrap. The active resource in this module is the Cloudflare CNAME.
- Allowed methods are intentionally limited to `GET` and `HEAD`, which matches static-site delivery.
