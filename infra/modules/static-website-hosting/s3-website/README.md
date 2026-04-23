# S3 Website Submodule

This submodule creates the private S3 bucket used as the origin for the static website.

It does not configure static website hosting mode or any public bucket policy. The bucket is intended to be read only through CloudFront origin access control.

## How It Works

1. `aws_s3_bucket.this` creates the bucket and tags it with the environment.
2. `aws_s3_bucket_public_access_block.this` blocks all public ACL and bucket-policy based access paths.

## Architecture

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#E6F4EA"
    primaryTextColor: "#132A13"
    primaryBorderColor: "#3C6E47"
    lineColor: "#4F772D"
    secondaryColor: "#D9EAFD"
    tertiaryColor: "#FFF4CC"
---
flowchart LR
  A["Terraform apply"] --> B["S3 bucket"]
  B --> C["Public access block<br/>private bucket for CloudFront origin"]

  classDef terraform fill:#844FBA,stroke:#6B21A8,color:#FFFFFF,stroke-width:2px;
  classDef s3 fill:#7AA116,stroke:#5B7A10,color:#FFFFFF,stroke-width:2px;

  class A terraform;
  class B,C s3;
```

## Example

```hcl
module "s3-website" {
  source      = "./s3-website"
  environment = var.environment
  bucket_name = var.bucket_name
}
```

## Inputs

| Name | Type | Description |
| --- | --- | --- |
| `bucket_name` | `string` | Name of the S3 bucket to create. |
| `environment` | `string` | Environment tag value applied to the bucket. |

## Outputs

| Name | Description |
| --- | --- |
| `bucket_id` | Bucket ID used by downstream modules. |
| `bucket_arn` | Bucket ARN used for policies and permissions. |
| `bucket_regional_domain` | Regional S3 domain name used as the CloudFront origin. |
