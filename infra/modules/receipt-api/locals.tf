locals {
  appsync_js_runtime_version = "1.0.0"
  graphql_api_name           = "${var.application_name}-receipt-api-${var.environment}"
  graphql_schema_path        = "${path.module}/graphql/schema.graphql"
  resolver_path              = "${path.module}/resolvers"
  table_name                 = "${var.application_name}-receipts-${var.environment}"

  function_definitions = {
    add_participant = {
      name = "addParticipant"
      path = "${local.resolver_path}/functions/add-participant.js.tftpl"
    }
    batch_get_receipt_roots = {
      name = "batchGetReceiptRoots"
      path = "${local.resolver_path}/functions/batch-get-receipt-roots.js.tftpl"
    }
    commit_remove_item = {
      name = "commitRemoveReceiptItem"
      path = "${local.resolver_path}/functions/commit-remove-item.js.tftpl"
    }
    commit_remove_participant = {
      name = "commitRemoveParticipant"
      path = "${local.resolver_path}/functions/commit-remove-participant.js.tftpl"
    }
    commit_set_item_allocations = {
      name = "commitSetItemAllocations"
      path = "${local.resolver_path}/functions/commit-set-item-allocations.js.tftpl"
    }
    commit_upsert_item = {
      name = "commitUpsertReceiptItem"
      path = "${local.resolver_path}/functions/commit-upsert-item.js.tftpl"
    }
    create_receipt = {
      name = "createReceipt"
      path = "${local.resolver_path}/functions/create-receipt.js.tftpl"
    }
    delete_receipt = {
      name = "deleteReceipt"
      path = "${local.resolver_path}/functions/delete-receipt.js.tftpl"
    }
    get_receipt = {
      name = "getReceipt"
      path = "${local.resolver_path}/functions/get-receipt.js.tftpl"
    }
    list_receipts = {
      name = "listReceipts"
      path = "${local.resolver_path}/functions/list-receipts.js.tftpl"
    }
    lookup_item = {
      name = "lookupReceiptItem"
      path = "${local.resolver_path}/functions/lookup-item.js.tftpl"
    }
    lookup_participant = {
      name = "lookupParticipant"
      path = "${local.resolver_path}/functions/lookup-participant.js.tftpl"
    }
    query_item_allocations = {
      name = "queryItemAllocations"
      path = "${local.resolver_path}/functions/query-item-allocations.js.tftpl"
    }
    query_participant_allocations = {
      name = "queryParticipantAllocations"
      path = "${local.resolver_path}/functions/query-participant-allocations.js.tftpl"
    }
    update_participant = {
      name = "updateParticipant"
      path = "${local.resolver_path}/functions/update-participant.js.tftpl"
    }
    update_receipt_metadata = {
      name = "updateReceiptMetadata"
      path = "${local.resolver_path}/functions/update-receipt-metadata.js.tftpl"
    }
  }

  resolver_definitions = {
    add_participant = {
      field     = "addParticipant"
      functions = ["add_participant"]
      type      = "Mutation"
    }
    create_receipt = {
      field     = "createReceipt"
      functions = ["create_receipt"]
      type      = "Mutation"
    }
    delete_receipt = {
      field     = "deleteReceipt"
      functions = ["delete_receipt"]
      type      = "Mutation"
    }
    get_receipt = {
      field     = "getReceipt"
      functions = ["get_receipt"]
      type      = "Query"
    }
    list_receipts = {
      field     = "listReceipts"
      functions = ["list_receipts", "batch_get_receipt_roots"]
      type      = "Query"
    }
    remove_receipt_item = {
      field     = "removeReceiptItem"
      functions = ["query_item_allocations", "commit_remove_item"]
      type      = "Mutation"
    }
    remove_participant = {
      field     = "removeParticipant"
      functions = ["lookup_participant", "query_participant_allocations", "commit_remove_participant"]
      type      = "Mutation"
    }
    set_item_allocations = {
      field     = "setItemAllocations"
      functions = ["query_item_allocations", "commit_set_item_allocations"]
      type      = "Mutation"
    }
    update_participant = {
      field     = "updateParticipant"
      functions = ["lookup_participant", "update_participant"]
      type      = "Mutation"
    }
    update_receipt_metadata = {
      field     = "updateReceiptMetadata"
      functions = ["update_receipt_metadata"]
      type      = "Mutation"
    }
    upsert_receipt_item = {
      field     = "upsertReceiptItem"
      functions = ["lookup_item", "commit_upsert_item"]
      type      = "Mutation"
    }
  }

  template_vars = {
    gsi_name   = "gsi1"
    table_name = local.table_name
  }
}
