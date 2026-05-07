data "archive_file" "this" {
  output_path = local.lambda_zip_path
  source_dir  = local.lambda_source_dir
  type        = "zip"
}

data "aws_iam_policy_document" "appsync_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["appsync.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "appsync_sqs_access" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.this.arn]
  }
}

data "aws_iam_policy_document" "worker_access" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.worker.arn}:*"]
  }

  statement {
    actions = [
      "dynamodb:BatchWriteItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
    ]
    resources = [
      var.dynamodb_table_arn,
      var.dynamodb_gsi_arn,
    ]
  }

  statement {
    actions = [
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage",
      "sqs:SendMessage",
    ]
    resources = [aws_sqs_queue.this.arn]
  }
}

resource "aws_sqs_queue" "dlq" {
  message_retention_seconds = local.message_retention_seconds
  name                      = local.dlq_name
}

resource "aws_sqs_queue" "this" {
  message_retention_seconds  = local.message_retention_seconds
  name                       = local.queue_name
  visibility_timeout_seconds = local.queue_visibility_timeout_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${local.worker_lambda_function_name}"
  retention_in_days = 7
}

resource "aws_iam_role" "appsync_sqs" {
  assume_role_policy = data.aws_iam_policy_document.appsync_assume_role.json
  name               = "${var.graphql_api_name}-account-deletion"
}

resource "aws_iam_role_policy" "appsync_sqs" {
  name   = "${var.graphql_api_name}-account-deletion"
  policy = data.aws_iam_policy_document.appsync_sqs_access.json
  role   = aws_iam_role.appsync_sqs.id
}

resource "aws_iam_role" "worker" {
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  name               = local.worker_lambda_role_name
}

resource "aws_iam_role_policy" "worker" {
  name   = "${local.worker_lambda_function_name}-access"
  policy = data.aws_iam_policy_document.worker_access.json
  role   = aws_iam_role.worker.id
}

resource "aws_lambda_function" "worker" {
  architectures    = ["arm64"]
  filename         = data.archive_file.this.output_path
  function_name    = local.worker_lambda_function_name
  handler          = "index.workerHandler"
  memory_size      = 128
  role             = aws_iam_role.worker.arn
  runtime          = "nodejs24.x"
  source_code_hash = data.archive_file.this.output_base64sha256
  timeout          = local.worker_timeout_seconds

  environment {
    variables = {
      ACCOUNT_DELETION_QUEUE_URL                   = aws_sqs_queue.this.url
      ACCOUNT_DELETION_THROTTLE_VISIBILITY_SECONDS = tostring(local.throttle_visibility_seconds)
      RECEIPTS_GSI_NAME                            = var.dynamodb_gsi_name
      RECEIPTS_TABLE_NAME                          = var.dynamodb_table_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.worker,
    aws_iam_role_policy.worker,
  ]
}

resource "aws_lambda_event_source_mapping" "worker" {
  batch_size                         = 1
  event_source_arn                   = aws_sqs_queue.this.arn
  function_name                      = aws_lambda_function.worker.arn
  function_response_types            = ["ReportBatchItemFailures"]
  maximum_batching_window_in_seconds = 0

  scaling_config {
    maximum_concurrency = local.worker_maximum_concurrency
  }

  depends_on = [aws_iam_role_policy.worker]
}
