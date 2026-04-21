data "archive_file" "this" {
  output_path = local.lambda_zip_path
  source_dir  = local.lambda_source_dir
  type        = "zip"
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

data "aws_iam_policy_document" "lambda_access" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.this.arn}:*"]
  }

  statement {
    actions = ["ssm:GetParameter"]
    resources = [
      "arn:${data.aws_partition.current.partition}:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter/${local.ssm_parameter_path}",
    ]
  }
}

data "aws_partition" "current" {}

data "aws_region" "current" {}

resource "aws_apigatewayv2_api" "this" {
  name          = local.http_api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = [
      "Authorization",
      "Content-Type",
    ]
    allow_methods = [
      "OPTIONS",
      "POST",
    ]
    allow_origins = var.receipt_parse_allowed_origins
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "this" {
  api_id           = aws_apigatewayv2_api.this.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

resource "aws_apigatewayv2_integration" "this" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.this.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = min(var.lambda_timeout_seconds * 1000, 30000)
}

resource "aws_apigatewayv2_route" "this" {
  api_id             = aws_apigatewayv2_api.this.id
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.this.id
  route_key          = local.route_key
  target             = "integrations/${aws_apigatewayv2_integration.this.id}"
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  auto_deploy = true
  name        = local.stage_name
}

resource "aws_cloudwatch_log_group" "this" {
  name              = local.log_group_name
  retention_in_days = 7
}

resource "aws_iam_role" "this" {
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  name               = local.lambda_role_name
}

resource "aws_iam_role_policy" "this" {
  name   = "${local.lambda_function_name}-access"
  policy = data.aws_iam_policy_document.lambda_access.json
  role   = aws_iam_role.this.id
}

resource "aws_lambda_function" "this" {
  architectures    = ["arm64"]
  filename         = data.archive_file.this.output_path
  function_name    = local.lambda_function_name
  handler          = "dist/index.handler"
  memory_size      = var.lambda_memory_size
  role             = aws_iam_role.this.arn
  runtime          = "nodejs24.x"
  source_code_hash = data.archive_file.this.output_base64sha256
  timeout          = var.lambda_timeout_seconds

  environment {
    variables = {
      GEMINI_API_KEY_PARAMETER_NAME = var.gemini_api_key_ssm_parameter_name
      GEMINI_MODEL_ID               = var.gemini_model_id
      MAX_UPLOAD_BYTES              = tostring(var.receipt_parse_max_upload_bytes)
      RECEIPT_PARSE_ALLOWED_ORIGINS = jsonencode(var.receipt_parse_allowed_origins)
    }
  }

  depends_on = [aws_cloudwatch_log_group.this]
}

resource "aws_lambda_permission" "this" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
  statement_id  = "AllowHttpApiInvoke"
}
