# Receipt API Module

This module provisions a Cognito-protected AppSync GraphQL API backed by a single DynamoDB table for receipt storage.

It packages three concerns into one deployable unit:

- the DynamoDB persistence layer
- the AppSync API, datasource, and pipeline resolvers
- the IAM roles AppSync needs for DynamoDB access and CloudWatch logging

## How It Works

1. `aws_dynamodb_table.receipts` creates a pay-per-request table with point-in-time recovery, server-side encryption, and one GSI for owner-based listing.
2. `aws_appsync_graphql_api.this` creates a Cognito-authenticated GraphQL API using the schema in `graphql/schema.graphql`.
3. `aws_appsync_datasource.receipts` points AppSync at the DynamoDB table.
4. `aws_appsync_function.this` renders APPSYNC_JS functions from the templates declared in `locals.tf`.
5. `aws_appsync_resolver.this` assembles those functions into pipeline resolvers, all using the shared `pipeline.js.tftpl` response wrapper.

## Example

```hcl
module "receipt-api" {
  source               = "../../modules/receipt-api"
  application_name     = local.application_name
  cognito_user_pool_id = module.cognito-auth.user_pool_id
  environment          = var.environment
}
```

## Why One Table

The receipt domain is modeled around two dominant access patterns:

- list receipts for the authenticated Cognito user
- load one full receipt aggregate with its participants, items, and allocations

A single-table design keeps those reads efficient without joins or scans:

- `listReceipts` queries one GSI keyed by `USER#<owner_user_id>`, then batch-gets receipt roots for archive-only counters such as payment progress
- `getReceipt` queries one receipt partition keyed by `RECEIPT#<receipt_id>`

That keeps the storage footprint small, limits index count to one, and makes the DynamoDB cost model predictable.

## Key Mapping

| Attribute | Source attribute | Used by |
| --- | --- | --- |
| `pk` | `receipt_id` | All entities under a receipt partition |
| `sk` | Entity discriminator plus entity ID | Receipt root, participants, items, allocations |
| `gsi1pk` | `owner_user_id` | User receipt listing |
| `gsi1sk` | `receipt_occurred_at` + `receipt_id` | Date-ordered user receipt listing |

## System Architecture

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#DFF2E4"
    primaryTextColor: "#132A13"
    primaryBorderColor: "#3C6E47"
    lineColor: "#4F772D"
    secondaryColor: "#E9F5DB"
    tertiaryColor: "#FEFAE0"
---
flowchart LR
  C["Cognito user"] --> A["AppSync GraphQL API"]
  A --> R["APPSYNC_JS pipeline resolvers"]
  R --> D["DynamoDB receipt table"]
  A --> L["CloudWatch logs"]

  classDef cognito fill:#DD344C,stroke:#B42336,color:#FFFFFF,stroke-width:2px;
  classDef appsync fill:#E7157B,stroke:#B10F5E,color:#FFFFFF,stroke-width:2px;
  classDef dynamodb fill:#C925D1,stroke:#8E1AA1,color:#FFFFFF,stroke-width:2px;
  classDef cloudwatch fill:#E7157B,stroke:#B10F5E,color:#FFFFFF,stroke-width:2px;

  class C cognito;
  class A,R appsync;
  class D dynamodb;
  class L cloudwatch;
```

## Resolver Composition

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
  API["AppSync field"] --> P["Pipeline resolver"]
  P --> F1["1..n APPSYNC_JS functions"]
  F1 --> DS["DynamoDB datasource"]
  DS --> T["Receipt table"]
  P --> W["Shared pipeline response wrapper"]

  classDef entry fill:#F3F4F6,stroke:#6B7280,color:#111827,stroke-width:2px;
  classDef appsync fill:#E7157B,stroke:#B10F5E,color:#FFFFFF,stroke-width:2px;
  classDef data fill:#C925D1,stroke:#8E1AA1,color:#FFFFFF,stroke-width:2px;
  classDef shared fill:#FCE7F3,stroke:#B10F5E,color:#831843,stroke-width:2px;

  class API entry;
  class P,F1,DS appsync;
  class T data;
  class W shared;
```

## Single-Table Layout

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#F8F5E9"
    primaryTextColor: "#1F2933"
    primaryBorderColor: "#556B2F"
    lineColor: "#7A8B5B"
    secondaryColor: "#E6F4EA"
    tertiaryColor: "#E8EEF9"
---
flowchart TB
  subgraph T["DynamoDB table"]
    RR["Receipt root
pk = RECEIPT#<receipt_id>
sk = RECEIPT
gsi1pk = USER#<owner_user_id>
gsi1sk = RECEIPT_DATE#<receipt_occurred_at>#RECEIPT#<receipt_id>
stores aggregate counters
including paid_participant_count"]
    RP["Participant
pk = RECEIPT#<receipt_id>
sk = PARTICIPANT#<participant_id>
stores group metadata
including is_paid and paid_at"]
    RI["Item
pk = RECEIPT#<receipt_id>
sk = ITEM#<item_id>"]
    RA["Allocation
pk = RECEIPT#<receipt_id>
sk = ALLOCATION#ITEM#<item_id>#PARTICIPANT#<participant_id>"]
  end

  RR --> RP
  RR --> RI
  RI --> RA

  style T fill:#F3E8FF,stroke:#8E1AA1,stroke-width:2px,color:#4A044E
  classDef root fill:#C925D1,stroke:#8E1AA1,color:#FFFFFF,stroke-width:2px;
  classDef participant fill:#E9D5FF,stroke:#A21CAF,color:#581C87,stroke-width:2px;
  classDef item fill:#F3E8FF,stroke:#A21CAF,color:#581C87,stroke-width:2px;
  classDef allocation fill:#FAE8FF,stroke:#A21CAF,color:#581C87,stroke-width:2px;

  class RR root;
  class RP participant;
  class RI item;
  class RA allocation;
```

## Access Patterns

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
flowchart LR
  L1["listReceipts"] --> Q1["Query GSI1 by USER#<ctx.identity.sub>"]
  Q1 --> Q1B["BatchGet receipt roots by RECEIPT#<receipt_id>"]
  Q1B --> O1["Receipt summary rows"]

  L2["getReceipt"] --> Q2["Query table by RECEIPT#<receipt_id>"]
  Q2 --> O2["Receipt aggregate"]

  L3["mutations"] --> Q3["Read current receipt state"]
  Q3 --> O3["Conditional or transactional write"]

  classDef query fill:#E7157B,stroke:#B10F5E,color:#FFFFFF,stroke-width:2px;
  classDef access fill:#F3F4F6,stroke:#6B7280,color:#111827,stroke-width:2px;
  classDef result fill:#F3E8FF,stroke:#8E1AA1,color:#581C87,stroke-width:2px;

  class L1,L2,L3 access;
  class Q1,Q1B,Q2,Q3 query;
  class O1,O2,O3 result;
```

## Authorization Flow

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#D9EAFD"
    primaryTextColor: "#102A43"
    primaryBorderColor: "#2F6690"
    actorBorder: "#6B7280"
    actorBkg: "#F3F4F6"
    actorTextColor: "#111827"
    signalColor: "#6B7280"
    signalTextColor: "#111827"
    labelBoxBkgColor: "#F9FAFB"
    labelBoxBorderColor: "#D1D5DB"
    labelTextColor: "#111827"
---
sequenceDiagram
  autonumber
  participant U as Cognito user
  participant G as AppSync resolver
  participant D as DynamoDB

  rect rgb(254, 226, 226)
  U->>G: GraphQL request with Cognito identity
  G->>G: Read ctx.identity.sub
  end
  rect rgb(243, 232, 255)
  G->>D: Load receipt or related records
  D-->>G: Receipt owner and version
  G->>G: Enforce ownership/version rules
  end
  rect rgb(252, 231, 243)
  G->>D: Execute allowed read or write
  D-->>G: Result
  G-->>U: Authorized response
  end
```

## Resolver Map

The resolver layout is declared in `locals.tf`.

| GraphQL field | Type | Pipeline functions |
| --- | --- | --- |
| `addParticipant` | `Mutation` | `add_participant` |
| `createReceipt` | `Mutation` | `create_receipt` |
| `deleteReceipt` | `Mutation` | `delete_receipt` |
| `getReceipt` | `Query` | `get_receipt` |
| `listReceipts` | `Query` | `list_receipts`, `batch_get_receipt_roots` |
| `removeReceiptItem` | `Mutation` | `query_item_allocations`, `commit_remove_item` |
| `removeParticipant` | `Mutation` | `lookup_participant`, `query_participant_allocations`, `commit_remove_participant` |
| `setItemAllocations` | `Mutation` | `query_item_allocations`, `commit_set_item_allocations` |
| `updateParticipant` | `Mutation` | `lookup_participant`, `update_participant` |
| `updateReceiptMetadata` | `Mutation` | `update_receipt_metadata` |
| `upsertReceiptItem` | `Mutation` | `lookup_item`, `commit_upsert_item` |

## Payment Tracking

- Payment state is stored on participant rows, not allocation rows.
- `is_paid` marks whether group has paid its current share.
- `paid_at` stores timestamp when group moved into paid state.
- `paid_participant_count` lives on receipt root so archive/list views can show payment progress without querying full receipt partition.
- Receipt persistence is binary: record exists in DynamoDB or it does not.

## Inputs

| Name | Type | Description |
| --- | --- | --- |
| `application_name` | `string` | Application prefix used in DynamoDB and AppSync resource names. |
| `cognito_user_pool_id` | `string` | Cognito user pool used as the GraphQL auth provider. |
| `environment` | `string` | Environment suffix used in resource names. |

## Outputs

| Name | Description |
| --- | --- |
| `dynamodb_table_arn` | ARN of the receipts table. |
| `dynamodb_table_name` | Name of the receipts table. |
| `graphql_api_arn` | ARN of the AppSync API. |
| `graphql_api_id` | AppSync API ID. |
| `graphql_api_url` | GraphQL endpoint URL. |

## Ownership Model

- The Cognito user owns the receipt through `owner_user_id`.
- Receipt participants are receipt-scoped records and are not Cognito users.
- Shared responsibility for an item is represented by allocation rows, not a separate group table.
- Group payment status is participant-scoped state and rolls up to receipt root counters for archive reads.
