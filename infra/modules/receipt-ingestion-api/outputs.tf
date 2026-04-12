output "gemini_model_id" {
  description = "Gemini model ID configured for the receipt parsing Lambda."
  value       = var.gemini_model_id
}

output "lambda_function_name" {
  description = "Name of the receipt parsing Lambda function."
  value       = aws_lambda_function.this.function_name
}

output "parse_api_url" {
  description = "Full receipt parsing HTTP API URL."
  value       = "${aws_apigatewayv2_api.this.api_endpoint}${local.route_path}"
}
