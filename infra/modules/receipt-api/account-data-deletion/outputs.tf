output "appsync_service_role_arn" {
  description = "ARN of the AppSync service role allowed to send cleanup messages to SQS."
  value       = aws_iam_role.appsync_sqs.arn
}

output "queue_url" {
  description = "URL of the account data deletion source queue."
  value       = aws_sqs_queue.this.url
}
