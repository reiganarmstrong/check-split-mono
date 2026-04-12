data "aws_iam_policy_document" "appsync_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["appsync.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "appsync_dynamodb_access" {
  statement {
    actions = [
      "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:TransactWriteItems",
      "dynamodb:UpdateItem",
    ]
    resources = [
      aws_dynamodb_table.receipts.arn,
      "${aws_dynamodb_table.receipts.arn}/index/${local.template_vars.gsi_name}",
    ]
  }
}

data "aws_region" "current" {}

data "aws_iam_policy" "appsync_cloudwatch" {
  name        = "AWSAppSyncPushToCloudWatchLogs"
  path_prefix = "/service-role/"
}

resource "aws_dynamodb_table" "receipts" {
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  name         = local.table_name
  range_key    = "sk"

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  global_secondary_index {
    name            = local.template_vars.gsi_name
    projection_type = "INCLUDE"
    non_key_attributes = [
      "location_name",
      "merchant_name",
      "receipt_id",
      "receipt_occurred_at",
      "status",
      "total_cents",
      "updated_at",
    ]

    key_schema {
      attribute_name = "gsi1pk"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "gsi1sk"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_iam_role" "appsync_cloudwatch" {
  assume_role_policy = data.aws_iam_policy_document.appsync_assume_role.json
  name               = "${local.graphql_api_name}-logs"
}

resource "aws_iam_role_policy_attachment" "appsync_cloudwatch" {
  policy_arn = data.aws_iam_policy.appsync_cloudwatch.arn
  role       = aws_iam_role.appsync_cloudwatch.name
}

resource "aws_iam_role" "appsync_dynamodb" {
  assume_role_policy = data.aws_iam_policy_document.appsync_assume_role.json
  name               = "${local.graphql_api_name}-dynamodb"
}

resource "aws_iam_role_policy" "appsync_dynamodb" {
  name   = "${local.graphql_api_name}-dynamodb"
  policy = data.aws_iam_policy_document.appsync_dynamodb_access.json
  role   = aws_iam_role.appsync_dynamodb.id
}

resource "aws_appsync_graphql_api" "this" {
  authentication_type = "AMAZON_COGNITO_USER_POOLS"
  name                = local.graphql_api_name
  schema              = file(local.graphql_schema_path)
  xray_enabled        = false

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_cloudwatch.arn
    exclude_verbose_content  = true
    field_log_level          = "ERROR"
  }

  user_pool_config {
    aws_region     = data.aws_region.current.region
    default_action = "ALLOW"
    user_pool_id   = var.cognito_user_pool_id
  }

  depends_on = [aws_iam_role_policy_attachment.appsync_cloudwatch]
}

resource "aws_appsync_datasource" "receipts" {
  api_id           = aws_appsync_graphql_api.this.id
  name             = "receipt_store"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.receipts.name
  }
}

resource "aws_appsync_function" "this" {
  for_each = local.function_definitions

  api_id      = aws_appsync_graphql_api.this.id
  data_source = aws_appsync_datasource.receipts.name
  name        = each.value.name

  code = templatefile(each.value.path, local.template_vars)

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = local.appsync_js_runtime_version
  }
}

resource "aws_appsync_resolver" "this" {
  for_each = local.resolver_definitions

  api_id = aws_appsync_graphql_api.this.id
  field  = each.value.field
  kind   = "PIPELINE"
  type   = each.value.type

  code = templatefile("${local.resolver_path}/pipeline.js.tftpl", local.template_vars)

  pipeline_config {
    functions = [for function_name in each.value.functions : aws_appsync_function.this[function_name].function_id]
  }

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = local.appsync_js_runtime_version
  }
}
