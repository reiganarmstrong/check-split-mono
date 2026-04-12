locals {
  http_api_name        = "${var.application_name}-receipt-ingestion-${var.environment}"
  lambda_function_name = "${var.application_name}-receipt-parse-${var.environment}"
  lambda_role_name     = "${local.lambda_function_name}-lambda"
  lambda_source_dir    = "${path.module}/lambda/package"
  lambda_zip_path      = "${path.module}/lambda/build/${local.lambda_function_name}.zip"
  log_group_name       = "/aws/lambda/${local.lambda_function_name}"
  route_key            = "POST /receipts/parse"
  route_path           = "/receipts/parse"
  stage_name           = "$default"
  ssm_parameter_path   = trimprefix(var.gemini_api_key_ssm_parameter_name, "/")
}
