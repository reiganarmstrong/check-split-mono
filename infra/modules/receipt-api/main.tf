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
      "dynamodb:BatchGetItem",
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
  billing_mode   = "PROVISIONED"
  hash_key       = "pk"
  name           = local.table_name
  range_key      = "sk"
  read_capacity  = local.receipt_table_min_read_capacity
  write_capacity = local.receipt_table_min_write_capacity

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
    read_capacity   = local.receipt_gsi_min_read_capacity
    write_capacity  = local.receipt_gsi_min_write_capacity
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

resource "aws_appautoscaling_target" "receipts_table_read" {
  max_capacity       = local.receipt_table_max_read_capacity
  min_capacity       = local.receipt_table_min_read_capacity
  resource_id        = "table/${aws_dynamodb_table.receipts.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "receipts_table_read" {
  name               = "${local.table_name}-read"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.receipts_table_read.resource_id
  scalable_dimension = aws_appautoscaling_target.receipts_table_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.receipts_table_read.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = local.receipt_table_target_utilization

    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
  }
}

resource "aws_appautoscaling_target" "receipts_table_write" {
  max_capacity       = local.receipt_table_max_write_capacity
  min_capacity       = local.receipt_table_min_write_capacity
  resource_id        = "table/${aws_dynamodb_table.receipts.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "receipts_table_write" {
  name               = "${local.table_name}-write"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.receipts_table_write.resource_id
  scalable_dimension = aws_appautoscaling_target.receipts_table_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.receipts_table_write.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = local.receipt_table_target_utilization

    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
  }
}

resource "aws_appautoscaling_target" "receipts_gsi_read" {
  max_capacity       = local.receipt_gsi_max_read_capacity
  min_capacity       = local.receipt_gsi_min_read_capacity
  resource_id        = "table/${aws_dynamodb_table.receipts.name}/index/${local.template_vars.gsi_name}"
  scalable_dimension = "dynamodb:index:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "receipts_gsi_read" {
  name               = "${local.table_name}-${local.template_vars.gsi_name}-read"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.receipts_gsi_read.resource_id
  scalable_dimension = aws_appautoscaling_target.receipts_gsi_read.scalable_dimension
  service_namespace  = aws_appautoscaling_target.receipts_gsi_read.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = local.receipt_gsi_target_utilization

    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
  }
}

resource "aws_appautoscaling_target" "receipts_gsi_write" {
  max_capacity       = local.receipt_gsi_max_write_capacity
  min_capacity       = local.receipt_gsi_min_write_capacity
  resource_id        = "table/${aws_dynamodb_table.receipts.name}/index/${local.template_vars.gsi_name}"
  scalable_dimension = "dynamodb:index:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "receipts_gsi_write" {
  name               = "${local.table_name}-${local.template_vars.gsi_name}-write"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.receipts_gsi_write.resource_id
  scalable_dimension = aws_appautoscaling_target.receipts_gsi_write.scalable_dimension
  service_namespace  = aws_appautoscaling_target.receipts_gsi_write.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = local.receipt_gsi_target_utilization

    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
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

module "account_data_deletion" {
  source              = "./account-data-deletion"
  application_name    = var.application_name
  dynamodb_gsi_arn    = "${aws_dynamodb_table.receipts.arn}/index/${local.template_vars.gsi_name}"
  dynamodb_gsi_name   = local.template_vars.gsi_name
  dynamodb_table_arn  = aws_dynamodb_table.receipts.arn
  dynamodb_table_name = aws_dynamodb_table.receipts.name
  environment         = var.environment
  graphql_api_name    = local.graphql_api_name
}

resource "aws_appsync_datasource" "account_data_deletion_queue" {
  api_id           = aws_appsync_graphql_api.this.id
  name             = "account_data_deletion_queue"
  service_role_arn = module.account_data_deletion.appsync_service_role_arn
  type             = "HTTP"

  http_config {
    endpoint = "https://sqs.${data.aws_region.current.region}.amazonaws.com"

    authorization_config {
      authorization_type = "AWS_IAM"

      aws_iam_config {
        signing_region       = data.aws_region.current.region
        signing_service_name = "sqs"
      }
    }
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

resource "aws_appsync_resolver" "account_data_deletion_request" {
  api_id      = aws_appsync_graphql_api.this.id
  data_source = aws_appsync_datasource.account_data_deletion_queue.name
  field       = "requestAccountDataDeletion"
  kind        = "UNIT"
  type        = "Mutation"

  code = templatefile(
    "${local.resolver_path}/account-data-deletion-request.js.tftpl",
    merge(local.template_vars, {
      account_deletion_queue_url = module.account_data_deletion.queue_url
    }),
  )

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
