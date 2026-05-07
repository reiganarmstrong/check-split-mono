locals {
  dlq_name                         = "${var.application_name}-account-data-deletion-dlq-${var.environment}"
  queue_name                       = "${var.application_name}-account-data-deletion-${var.environment}"
  worker_lambda_function_name      = "${var.application_name}-account-data-deletion-worker-${var.environment}"
  worker_lambda_role_name          = "${local.worker_lambda_function_name}-lambda"
  lambda_source_dir                = "${path.module}/lambda/src"
  lambda_zip_path                  = "${path.module}/lambda/build/account-data-deletion.zip"
  message_retention_seconds        = 1209600
  throttle_visibility_seconds      = 21600
  worker_timeout_seconds           = 30
  queue_visibility_timeout_seconds = local.worker_timeout_seconds + 5
}
