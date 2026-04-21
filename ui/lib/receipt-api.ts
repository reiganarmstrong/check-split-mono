import { fetchAuthSession } from "aws-amplify/auth"
import { z } from "zod"

import {
  configureAmplifyAuth,
  getAwsRegion,
  getReceiptApiGraphqlUrl,
  hasAmplifyDataConfig,
} from "@/lib/amplify-auth"
import {
  buildEqualAllocationInput,
  buildReceiptSavePlan,
  getItemLineSubtotalCents,
  getReceiptEditorValidation,
  getReceiptSubtotalCents,
  getReceiptTotalCents,
  parseMoneyInputToCents,
  parseQuantityInput,
  toAwsDateTime,
} from "@/lib/receipt-editor"
import type {
  EditableGroup,
  EditableItem,
  Receipt,
  ReceiptEditorState,
  ReceiptItem,
  ReceiptListItem,
  ReceiptParticipant,
  ReceiptSavePlan,
} from "@/lib/receipt-types"

const allocationPolicySchema = z.enum(["EVEN", "PROPORTIONAL"])

const receiptItemAllocationSchema = z.object({
  createdAt: z.string(),
  itemId: z.string(),
  participantId: z.string(),
  shareWeight: z.number(),
  updatedAt: z.string(),
})

const receiptParticipantSchema = z.object({
  createdAt: z.string().nullable(),
  displayName: z.string(),
  isPaid: z.boolean(),
  notes: z.string().nullable(),
  paidAt: z.string().nullable(),
  participantId: z.string(),
  sortOrder: z.number().nullable(),
  updatedAt: z.string(),
})

const receiptItemSchema = z.object({
  allocations: z.array(receiptItemAllocationSchema),
  category: z.string().nullable(),
  createdAt: z.string(),
  description: z.string(),
  discountCents: z.number(),
  itemId: z.string(),
  lineSubtotalCents: z.number(),
  quantity: z.number(),
  scanConfidence: z.number().nullable(),
  sourceLineNumber: z.number().nullable(),
  unitPriceCents: z.number(),
  updatedAt: z.string(),
})

const receiptSchema = z.object({
  allocationPolicy: allocationPolicySchema,
  capturedAt: z.string().nullable(),
  createdAt: z.string(),
  currencyCode: z.string(),
  discountCents: z.number(),
  feeCents: z.number(),
  itemCount: z.number(),
  items: z.array(receiptItemSchema),
  locationAddress: z.string().nullable(),
  locationLat: z.number().nullable(),
  locationLng: z.number().nullable(),
  locationName: z.string().nullable(),
  merchantName: z.string(),
  ownerUserId: z.string(),
  paidParticipantCount: z.number(),
  participantCount: z.number(),
  participants: z.array(receiptParticipantSchema),
  receiptId: z.string(),
  receiptOccurredAt: z.string(),
  subtotalCents: z.number(),
  taxCents: z.number(),
  tipCents: z.number(),
  totalCents: z.number(),
  updatedAt: z.string(),
  version: z.number(),
})

const receiptListItemSchema = z.object({
  locationName: z.string().nullable(),
  merchantName: z.string(),
  paidParticipantCount: z.number(),
  participantCount: z.number(),
  receiptId: z.string(),
  receiptOccurredAt: z.string(),
  totalCents: z.number(),
  updatedAt: z.string(),
})

const receiptConnectionSchema = z.object({
  items: z.array(receiptListItemSchema),
  nextToken: z.string().nullable(),
})

const receiptMutationResultSchema = z.object({
  itemCount: z.number().nullable().optional(),
  participantCount: z.number().nullable().optional(),
  receiptId: z.string(),
  updatedAt: z.string(),
  version: z.number(),
})

const participantMutationResultSchema = z.object({
  participant: receiptParticipantSchema.nullable(),
  participantCount: z.number().nullable().optional(),
  receiptId: z.string(),
  updatedAt: z.string(),
  version: z.number(),
})

const itemMutationResultSchema = z.object({
  item: receiptItemSchema.nullable(),
  itemCount: z.number().nullable().optional(),
  receiptId: z.string(),
  updatedAt: z.string(),
  version: z.number(),
})

const allocationMutationResultSchema = z.object({
  allocations: z.array(receiptItemAllocationSchema),
  itemId: z.string(),
  receiptId: z.string(),
  updatedAt: z.string(),
  version: z.number(),
})

type GraphQLErrorPayload = {
  errorType?: string
  message?: string
}

export class ReceiptApiError extends Error {
  code: "config" | "conflict" | "network" | "response" | "unauthorized" | "validation"

  constructor(
    message: string,
    code: ReceiptApiError["code"],
  ) {
    super(message)
    this.code = code
  }
}

function trimToNull(value: string) {
  const nextValue = value.trim()
  return nextValue === "" ? null : nextValue
}

function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase().slice(0, 3) || "USD"
}

function ensureConfigured() {
  if (!hasAmplifyDataConfig()) {
    throw new ReceiptApiError(
      "Missing GraphQL env vars. Define NEXT_PUBLIC_AWS_REGION and NEXT_PUBLIC_RECEIPT_API_GRAPHQL_URL in ui/.env.local.",
      "config",
    )
  }
}

function getAuthToken(session: Awaited<ReturnType<typeof fetchAuthSession>>) {
  return (
    session.tokens?.accessToken?.toString() ??
    session.tokens?.idToken?.toString() ??
    null
  )
}

function toReceiptApiError(error: GraphQLErrorPayload) {
  const message = error.message ?? "GraphQL request failed."
  const errorType = error.errorType ?? ""
  const normalized = `${errorType} ${message}`.toLowerCase()

  if (
    normalized.includes("conditionalcheckfailed") ||
    normalized.includes("transaction cancelled") ||
    normalized.includes("transaction cancelled")
  ) {
    return new ReceiptApiError(
      "This receipt changed in another session. Review the latest data and try saving again.",
      "conflict",
    )
  }

  if (normalized.includes("unauthorized")) {
    return new ReceiptApiError("You need to log in again before editing receipts.", "unauthorized")
  }

  if (normalized.includes("validation")) {
    return new ReceiptApiError(message, "validation")
  }

  return new ReceiptApiError(message, "network")
}

async function graphQLRequest<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  schema: z.ZodType<T>,
): Promise<T> {
  ensureConfigured()
  configureAmplifyAuth()

  const session = await fetchAuthSession()
  const token = getAuthToken(session)

  if (!token) {
    throw new ReceiptApiError("You need to log in before loading receipts.", "unauthorized")
  }

  const response = await fetch(getReceiptApiGraphqlUrl() as string, {
    body: JSON.stringify({
      query,
      variables,
    }),
    headers: {
      authorization: token,
      "content-type": "application/json",
      "x-amz-user-agent": "checksplit-ui",
    },
    method: "POST",
  })

  if (!response.ok) {
    throw new ReceiptApiError(
      `GraphQL request failed with status ${response.status}.`,
      "network",
    )
  }

  const payload = (await response.json()) as {
    data?: unknown
    errors?: GraphQLErrorPayload[]
  }

  if (payload.errors?.length) {
    throw toReceiptApiError(payload.errors[0] ?? {})
  }

  const result = schema.safeParse(payload.data)

  if (!result.success) {
    throw new ReceiptApiError("The receipt API returned an unexpected response.", "response")
  }

  return result.data
}

function buildMetadataInput(state: ReceiptEditorState, receiptId: string, version: number) {
  return {
    allocationPolicy: state.allocationPolicy,
    capturedAt: state.capturedAt || new Date().toISOString(),
    currencyCode: normalizeCurrencyCode(state.currencyCode),
    discountCents: parseMoneyInputToCents(state.discount),
    expectedVersion: version,
    feeCents: parseMoneyInputToCents(state.fee),
    locationAddress: trimToNull(state.locationAddress),
    locationName: trimToNull(state.locationName),
    merchantName: state.merchantName.trim(),
    receiptId,
    receiptOccurredAt: toAwsDateTime(state.receiptOccurredAt),
    subtotalCents: getReceiptSubtotalCents(state),
    taxCents: parseMoneyInputToCents(state.tax),
    tipCents: parseMoneyInputToCents(state.tip),
    totalCents: getReceiptTotalCents(state),
  }
}

function didParticipantChange(
  group: EditableGroup,
  index: number,
  serverParticipant: ReceiptParticipant | undefined,
) {
  if (!serverParticipant) {
    return true
  }

  return (
    serverParticipant.displayName !== group.displayName.trim() ||
    serverParticipant.isPaid !== group.isPaid ||
    (serverParticipant.notes ?? "") !== group.notes.trim() ||
    (serverParticipant.sortOrder ?? index) !== index
  )
}

function didItemChange(item: EditableItem, serverItem: ReceiptItem | undefined) {
  if (!serverItem) {
    return true
  }

  return (
    serverItem.description !== item.description.trim() ||
    (serverItem.category ?? "") !== item.category.trim() ||
    serverItem.quantity !== parseQuantityInput(item.quantity) ||
    serverItem.unitPriceCents !== parseMoneyInputToCents(item.unitPrice) ||
    serverItem.discountCents !== parseMoneyInputToCents(item.discount) ||
    serverItem.lineSubtotalCents !== getItemLineSubtotalCents(item)
  )
}

function didAllocationsChange(item: EditableItem, serverItem: ReceiptItem | undefined, participantIds: string[]) {
  if (!serverItem) {
    return true
  }

  const existing = serverItem.allocations.map((allocation) => allocation.participantId).sort()
  const next = [...participantIds].sort()

  if (existing.length !== next.length) {
    return true
  }

  return existing.some((value, index) => value !== next[index])
}

const listReceiptsQuery = /* GraphQL */ `
  query ListReceipts($limit: Int, $nextToken: String) {
    listReceipts(limit: $limit, nextToken: $nextToken) {
      items {
        locationName
        merchantName
        paidParticipantCount
        participantCount
        receiptId
        receiptOccurredAt
        totalCents
        updatedAt
      }
      nextToken
    }
  }
`

const getReceiptQuery = /* GraphQL */ `
  query GetReceipt($receiptId: ID!) {
    getReceipt(receiptId: $receiptId) {
      allocationPolicy
      capturedAt
      createdAt
      currencyCode
      discountCents
      feeCents
      itemCount
      items {
        allocations {
          createdAt
          itemId
          participantId
          shareWeight
          updatedAt
        }
        category
        createdAt
        description
        discountCents
        itemId
        lineSubtotalCents
        quantity
        scanConfidence
        sourceLineNumber
        unitPriceCents
        updatedAt
      }
      locationAddress
      locationLat
      locationLng
      locationName
      merchantName
      ownerUserId
      paidParticipantCount
      participantCount
      participants {
        createdAt
        displayName
        isPaid
        notes
        paidAt
        participantId
        sortOrder
        updatedAt
      }
      receiptId
      receiptOccurredAt
      subtotalCents
      taxCents
      tipCents
      totalCents
      updatedAt
      version
    }
  }
`

const createReceiptMutation = /* GraphQL */ `
  mutation CreateReceipt($input: CreateReceiptInput!) {
    createReceipt(input: $input) {
      allocationPolicy
      capturedAt
      createdAt
      currencyCode
      discountCents
      feeCents
      itemCount
      items {
        allocations {
          createdAt
          itemId
          participantId
          shareWeight
          updatedAt
        }
        category
        createdAt
        description
        discountCents
        itemId
        lineSubtotalCents
        quantity
        scanConfidence
        sourceLineNumber
        unitPriceCents
        updatedAt
      }
      locationAddress
      locationLat
      locationLng
      locationName
      merchantName
      ownerUserId
      paidParticipantCount
      participantCount
      participants {
        createdAt
        displayName
        isPaid
        notes
        paidAt
        participantId
        sortOrder
        updatedAt
      }
      receiptId
      receiptOccurredAt
      subtotalCents
      taxCents
      tipCents
      totalCents
      updatedAt
      version
    }
  }
`

const deleteReceiptMutation = /* GraphQL */ `
  mutation DeleteReceipt($input: DeleteReceiptInput!) {
    deleteReceipt(input: $input) {
      itemCount
      participantCount
      receiptId
      updatedAt
      version
    }
  }
`

const updateReceiptMetadataMutation = /* GraphQL */ `
  mutation UpdateReceiptMetadata($input: UpdateReceiptMetadataInput!) {
    updateReceiptMetadata(input: $input) {
      receiptId
      updatedAt
      version
    }
  }
`

const addParticipantMutation = /* GraphQL */ `
  mutation AddParticipant($input: AddParticipantInput!) {
    addParticipant(input: $input) {
      participant {
        createdAt
        displayName
        isPaid
        notes
        paidAt
        participantId
        sortOrder
        updatedAt
      }
      receiptId
      updatedAt
      version
    }
  }
`

const updateParticipantMutation = /* GraphQL */ `
  mutation UpdateParticipant($input: UpdateParticipantInput!) {
    updateParticipant(input: $input) {
      participant {
        createdAt
        displayName
        isPaid
        notes
        paidAt
        participantId
        sortOrder
        updatedAt
      }
      receiptId
      updatedAt
      version
    }
  }
`

const removeParticipantMutation = /* GraphQL */ `
  mutation RemoveParticipant($input: RemoveParticipantInput!) {
    removeParticipant(input: $input) {
      receiptId
      updatedAt
      version
    }
  }
`

const upsertReceiptItemMutation = /* GraphQL */ `
  mutation UpsertReceiptItem($input: UpsertReceiptItemInput!) {
    upsertReceiptItem(input: $input) {
      item {
        allocations {
          createdAt
          itemId
          participantId
          shareWeight
          updatedAt
        }
        category
        createdAt
        description
        discountCents
        itemId
        lineSubtotalCents
        quantity
        scanConfidence
        sourceLineNumber
        unitPriceCents
        updatedAt
      }
      receiptId
      updatedAt
      version
    }
  }
`

const setItemAllocationsMutation = /* GraphQL */ `
  mutation SetItemAllocations($input: SetItemAllocationsInput!) {
    setItemAllocations(input: $input) {
      allocations {
        createdAt
        itemId
        participantId
        shareWeight
        updatedAt
      }
      itemId
      receiptId
      updatedAt
      version
    }
  }
`

const removeReceiptItemMutation = /* GraphQL */ `
  mutation RemoveReceiptItem($input: RemoveReceiptItemInput!) {
    removeReceiptItem(input: $input) {
      receiptId
      updatedAt
      version
    }
  }
`

export async function listReceipts(limit = 24): Promise<{
  items: ReceiptListItem[]
  nextToken: string | null
}> {
  const data = await graphQLRequest(
    listReceiptsQuery,
    {
      limit,
    },
    z.object({
      listReceipts: receiptConnectionSchema,
    }),
  )

  return data.listReceipts
}

export async function getReceipt(receiptId: string): Promise<Receipt | null> {
  const data = await graphQLRequest(
    getReceiptQuery,
    {
      receiptId,
    },
    z.object({
      getReceipt: receiptSchema.nullable(),
    }),
  )

  return data.getReceipt
}

async function mutateReceiptMetadata(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    updateReceiptMetadataMutation,
    { input },
    z.object({
      updateReceiptMetadata: receiptMutationResultSchema,
    }),
  )

  return data.updateReceiptMetadata
}

async function addParticipant(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    addParticipantMutation,
    { input },
    z.object({
      addParticipant: participantMutationResultSchema,
    }),
  )

  return data.addParticipant
}

async function updateParticipant(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    updateParticipantMutation,
    { input },
    z.object({
      updateParticipant: participantMutationResultSchema,
    }),
  )

  return data.updateParticipant
}

async function removeParticipant(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    removeParticipantMutation,
    { input },
    z.object({
      removeParticipant: participantMutationResultSchema.pick({
        receiptId: true,
        updatedAt: true,
        version: true,
      }),
    }),
  )

  return data.removeParticipant
}

async function upsertReceiptItem(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    upsertReceiptItemMutation,
    { input },
    z.object({
      upsertReceiptItem: itemMutationResultSchema,
    }),
  )

  return data.upsertReceiptItem
}

async function setItemAllocations(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    setItemAllocationsMutation,
    { input },
    z.object({
      setItemAllocations: allocationMutationResultSchema,
    }),
  )

  return data.setItemAllocations
}

async function removeReceiptItem(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    removeReceiptItemMutation,
    { input },
    z.object({
      removeReceiptItem: receiptMutationResultSchema,
    }),
  )

  return data.removeReceiptItem
}

async function createReceipt(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    createReceiptMutation,
    { input },
    z.object({
      createReceipt: receiptSchema,
    }),
  )

  return data.createReceipt
}

async function deleteReceiptRoot(input: Record<string, unknown>) {
  const data = await graphQLRequest(
    deleteReceiptMutation,
    { input },
    z.object({
      deleteReceipt: receiptMutationResultSchema,
    }),
  )

  return data.deleteReceipt
}

function requireVersion(version: number | null) {
  if (typeof version !== "number") {
    throw new ReceiptApiError("The current receipt version is missing.", "validation")
  }

  return version
}

async function persistGroups(
  state: ReceiptEditorState,
  receipt: Receipt | null,
  receiptId: string,
  version: number,
) {
  const participantIdByGroupId = new Map<string, string>()
  const participantsById = new Map(receipt?.participants.map((participant) => [participant.participantId, participant]) ?? [])
  let nextVersion = version

  for (const [index, group] of state.groups.entries()) {
    if (group.participantId) {
      participantIdByGroupId.set(group.id, group.participantId)
    }

    if (!group.participantId) {
      const result = await addParticipant({
        displayName: group.displayName.trim(),
        expectedVersion: nextVersion,
        isPaid: group.isPaid,
        notes: trimToNull(group.notes),
        receiptId,
        sortOrder: index,
      })

      if (!result.participant) {
        throw new ReceiptApiError("The receipt API did not return the new group.", "response")
      }

      participantIdByGroupId.set(group.id, result.participant.participantId)
      nextVersion = result.version
      continue
    }

    const existing = participantsById.get(group.participantId)

    if (!didParticipantChange(group, index, existing)) {
      continue
    }

    const result = await updateParticipant({
      displayName: group.displayName.trim(),
      expectedVersion: nextVersion,
      isPaid: group.isPaid,
      notes: trimToNull(group.notes),
      participantId: group.participantId,
      receiptId,
      sortOrder: index,
    })

    participantIdByGroupId.set(group.id, group.participantId)
    nextVersion = result.version
  }

  return {
    participantIdByGroupId,
    version: nextVersion,
  }
}

async function persistItems(
  state: ReceiptEditorState,
  receipt: Receipt | null,
  receiptId: string,
  version: number,
) {
  const itemIdByEditorId = new Map<string, string>()
  const itemsById = new Map(receipt?.items.map((item) => [item.itemId, item]) ?? [])
  let nextVersion = version

  for (const item of state.items) {
    if (item.itemId) {
      itemIdByEditorId.set(item.id, item.itemId)
    }

    const existing = item.itemId ? itemsById.get(item.itemId) : undefined

    if (!didItemChange(item, existing)) {
      continue
    }

    const result = await upsertReceiptItem({
      category: trimToNull(item.category),
      description: item.description.trim(),
      discountCents: parseMoneyInputToCents(item.discount),
      expectedVersion: nextVersion,
      itemId: item.itemId,
      lineSubtotalCents: getItemLineSubtotalCents(item),
      quantity: parseQuantityInput(item.quantity),
      receiptId,
      unitPriceCents: parseMoneyInputToCents(item.unitPrice),
    })

    if (!result.item) {
      throw new ReceiptApiError("The receipt API did not return the saved item.", "response")
    }

    itemIdByEditorId.set(item.id, result.item.itemId)
    nextVersion = result.version
  }

  return {
    itemIdByEditorId,
    version: nextVersion,
  }
}

async function persistAllocations(
  state: ReceiptEditorState,
  receipt: Receipt | null,
  receiptId: string,
  version: number,
  participantIdByGroupId: Map<string, string>,
  itemIdByEditorId: Map<string, string>,
) {
  const itemsById = new Map(receipt?.items.map((item) => [item.itemId, item]) ?? [])
  let nextVersion = version

  for (const item of state.items) {
    const itemId = itemIdByEditorId.get(item.id) ?? item.itemId

    if (!itemId) {
      continue
    }

    const participantIds = item.selectedGroupIds
      .map((groupId) => participantIdByGroupId.get(groupId) ?? null)
      .filter((groupId): groupId is string => Boolean(groupId))

    const existing = itemsById.get(itemId)

    if (!didAllocationsChange(item, existing, participantIds)) {
      continue
    }

    const result = await setItemAllocations({
      allocations: buildEqualAllocationInput(participantIds),
      expectedVersion: nextVersion,
      itemId,
      receiptId,
    })

    nextVersion = result.version
  }

  return nextVersion
}

async function removeDeletedItems(
  plan: ReceiptSavePlan,
  receiptId: string,
  version: number,
) {
  let nextVersion = version

  for (const itemId of plan.deleteItemIds) {
    const result = await removeReceiptItem({
      expectedVersion: nextVersion,
      itemId,
      receiptId,
    })

    nextVersion = result.version
  }

  return nextVersion
}

async function removeDeletedParticipants(
  plan: ReceiptSavePlan,
  receiptId: string,
  version: number,
) {
  let nextVersion = version

  for (const participantId of plan.deleteParticipantIds) {
    const result = await removeParticipant({
      expectedVersion: nextVersion,
      participantId,
      receiptId,
    })

    nextVersion = result.version
  }

  return nextVersion
}

export async function saveReceiptEditorState(
  state: ReceiptEditorState,
  existingReceipt: Receipt | null,
) {
  const validation = getReceiptEditorValidation(state)

  if (!validation.canSave) {
    throw new ReceiptApiError(validation.issues[0] ?? "The receipt is incomplete.", "validation")
  }

  const plan = buildReceiptSavePlan(state, existingReceipt)

  if (!existingReceipt && plan.createReceipt === false) {
    throw new ReceiptApiError("Unable to initialize a new receipt.", "validation")
  }

  if (
    existingReceipt &&
    !plan.updateMetadata &&
    plan.saveItemCount === 0 &&
    plan.saveParticipantCount === 0 &&
    plan.setAllocationCount === 0 &&
    plan.deleteItemIds.length === 0 &&
    plan.deleteParticipantIds.length === 0
  ) {
    return existingReceipt
  }

  let receiptId = existingReceipt?.receiptId ?? state.receiptId
  let version = state.version ?? existingReceipt?.version ?? null

  if (!existingReceipt) {
    const created = await createReceipt({
      allocationPolicy: state.allocationPolicy,
      capturedAt: state.capturedAt || new Date().toISOString(),
      currencyCode: normalizeCurrencyCode(state.currencyCode),
      discountCents: parseMoneyInputToCents(state.discount),
      feeCents: parseMoneyInputToCents(state.fee),
      locationAddress: trimToNull(state.locationAddress),
      locationName: trimToNull(state.locationName),
      merchantName: state.merchantName.trim(),
      receiptOccurredAt: toAwsDateTime(state.receiptOccurredAt),
      subtotalCents: getReceiptSubtotalCents(state),
      taxCents: parseMoneyInputToCents(state.tax),
      tipCents: parseMoneyInputToCents(state.tip),
      totalCents: getReceiptTotalCents(state),
    })

    receiptId = created.receiptId
    version = created.version
  } else if (plan.updateMetadata) {
    const metadataResult = await mutateReceiptMetadata(
      buildMetadataInput(state, existingReceipt.receiptId, requireVersion(version)),
    )
    version = metadataResult.version
  }

  if (!receiptId) {
    throw new ReceiptApiError("The receipt ID is missing after save setup.", "response")
  }

  const groupResult = await persistGroups(
    state,
    existingReceipt,
    receiptId,
    requireVersion(version),
  )
  version = groupResult.version

  const itemResult = await persistItems(
    state,
    existingReceipt,
    receiptId,
    requireVersion(version),
  )
  version = itemResult.version

  version = await persistAllocations(
    state,
    existingReceipt,
    receiptId,
    requireVersion(version),
    groupResult.participantIdByGroupId,
    itemResult.itemIdByEditorId,
  )

  version = await removeDeletedItems(plan, receiptId, requireVersion(version))
  version = await removeDeletedParticipants(plan, receiptId, requireVersion(version))

  const freshReceipt = await getReceipt(receiptId)

  if (!freshReceipt) {
    throw new ReceiptApiError("The receipt was saved but could not be reloaded.", "response")
  }

  return freshReceipt
}

export async function deleteReceipt(receipt: Receipt) {
  let version = receipt.version

  for (const item of receipt.items) {
    const result = await removeReceiptItem({
      expectedVersion: requireVersion(version),
      itemId: item.itemId,
      receiptId: receipt.receiptId,
    })

    version = result.version
  }

  for (const participant of receipt.participants) {
    const result = await removeParticipant({
      expectedVersion: requireVersion(version),
      participantId: participant.participantId,
      receiptId: receipt.receiptId,
    })

    version = result.version
  }

  return deleteReceiptRoot({
    expectedVersion: requireVersion(version),
    receiptId: receipt.receiptId,
  })
}

export function getReceiptRegion() {
  return getAwsRegion() ?? "us-east-1"
}
