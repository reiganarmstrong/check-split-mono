import { z } from "zod"

import type {
  EditableGroup,
  EditableItem,
  GroupShareSummary,
  Receipt,
  ReceiptEditorState,
  ReceiptSavePlan,
} from "@/lib/receipt-types"

const moneyInputSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{0,2})?$/, "Enter a valid amount with up to 2 decimals.")

const optionalMoneyInputSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+(\.\d{0,2})?$/.test(value),
    "Enter a valid amount with up to 2 decimals.",
  )

const quantityInputSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "Quantity must be a whole number greater than 0.")

const groupSchema = z.object({
  displayName: z.string().trim().min(1, "Group name is required."),
  notes: z.string(),
})

const itemSchema = z.object({
  description: z.string().trim().min(1, "Item name is required."),
  discount: optionalMoneyInputSchema,
  quantity: quantityInputSchema,
  selectedGroupIds: z.array(z.string()).min(1, "Select at least one group."),
  unitPrice: moneyInputSchema,
})

const receiptEditorSchema = z.object({
  currencyCode: z.string().trim().length(3),
  discount: optionalMoneyInputSchema,
  fee: optionalMoneyInputSchema,
  groups: z.array(groupSchema).min(1, "Add at least one group."),
  items: z.array(itemSchema).min(1, "Add at least one item."),
  merchantName: z.string().trim().min(1, "Merchant name is required."),
  receiptOccurredAt: z.string().trim().min(1, "Receipt date is required."),
  tax: optionalMoneyInputSchema,
  tip: optionalMoneyInputSchema,
})

export type ReceiptEditorValidation = {
  canSave: boolean
  issues: string[]
}

export type GroupItemShareDetail = {
  description: string
  groupId: string
  itemId: string
  lineSubtotalCents: number
  ratioLabel: string
  shareCents: number
}

function makeLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeMoneyInput(value: string) {
  return value.trim()
}

function normalizeOptionalMoneyInput(value: string) {
  const nextValue = value.trim()
  return nextValue === "" ? "0.00" : nextValue
}

export function normalizeDateTimeInput(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const localOffsetMilliseconds = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - localOffsetMilliseconds)
    .toISOString()
    .slice(0, 16)
}

function equalIdSets(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  const leftSorted = [...left].sort()
  const rightSorted = [...right].sort()

  return leftSorted.every((value, index) => value === rightSorted[index])
}

export function createEditableGroup(group?: Partial<EditableGroup>): EditableGroup {
  return {
    displayName: group?.displayName ?? "",
    id: group?.id ?? makeLocalId("group"),
    isPaid: group?.isPaid ?? false,
    notes: group?.notes ?? "",
    participantId: group?.participantId ?? null,
  }
}

export function createEditableItem(item?: Partial<EditableItem>): EditableItem {
  return {
    category: item?.category ?? "",
    description: item?.description ?? "",
    discount: item?.discount ?? "0.00",
    id: item?.id ?? makeLocalId("item"),
    itemId: item?.itemId ?? null,
    quantity: item?.quantity ?? "1",
    selectedGroupIds: item?.selectedGroupIds ?? [],
    unitPrice: item?.unitPrice ?? "0.00",
  }
}

export function createEmptyReceiptEditorState(): ReceiptEditorState {
  const defaultGroup = createEditableGroup({ displayName: "Payer" })

  return {
    allocationPolicy: "PROPORTIONAL",
    capturedAt: new Date().toISOString(),
    currencyCode: "USD",
    discount: "0.00",
    fee: "0.00",
    groups: [defaultGroup],
    items: [createEditableItem({ selectedGroupIds: [defaultGroup.id] })],
    locationAddress: "",
    locationName: "",
    merchantName: "",
    receiptId: null,
    receiptOccurredAt: normalizeDateTimeInput(new Date().toISOString()),
    tax: "0.00",
    tip: "0.00",
    version: null,
  }
}

export function parseMoneyInputToCents(value: string) {
  const normalized = normalizeOptionalMoneyInput(value)
  const numericValue = Number.parseFloat(normalized)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.round(numericValue * 100)
}

export function parseQuantityInput(value: string) {
  const numericValue = Number.parseInt(value.trim(), 10)

  if (!Number.isFinite(numericValue) || numericValue < 1) {
    return 1
  }

  return numericValue
}

export function centsToInputValue(value: number) {
  return (value / 100).toFixed(2)
}

export function toAwsDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }

  return date.toISOString()
}

export function formatReceiptDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Draft receipt"
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function formatCurrency(amountCents: number, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency: currencyCode,
    style: "currency",
  }).format(amountCents / 100)
}

export function getItemLineSubtotalCents(item: EditableItem) {
  const quantity = parseQuantityInput(item.quantity)
  const unitPriceCents = parseMoneyInputToCents(item.unitPrice)
  const discountCents = parseMoneyInputToCents(item.discount)

  return Math.max(quantity * unitPriceCents - discountCents, 0)
}

export function getReceiptSubtotalCents(state: ReceiptEditorState) {
  return state.items.reduce((sum, item) => sum + getItemLineSubtotalCents(item), 0)
}

export function getReceiptTotalCents(state: ReceiptEditorState) {
  return (
    getReceiptSubtotalCents(state) +
    parseMoneyInputToCents(state.tax) +
    parseMoneyInputToCents(state.tip) +
    parseMoneyInputToCents(state.fee) -
    parseMoneyInputToCents(state.discount)
  )
}

function distributeCentsAcrossRecipients(
  totalCents: number,
  recipientIds: string[],
) {
  const distributed = new Map<string, number>()

  for (const recipientId of recipientIds) {
    distributed.set(recipientId, 0)
  }

  if (recipientIds.length === 0 || totalCents === 0) {
    return distributed
  }

  const sign = totalCents < 0 ? -1 : 1
  const absoluteTotal = Math.abs(totalCents)
  const baseShare = Math.floor(absoluteTotal / recipientIds.length)
  let remainder = absoluteTotal % recipientIds.length

  for (const recipientId of recipientIds) {
    const extraCent = remainder > 0 ? 1 : 0
    const amountCents = sign * (baseShare + extraCent)
    distributed.set(recipientId, amountCents === 0 ? 0 : amountCents)
    remainder = Math.max(remainder - 1, 0)
  }

  return distributed
}

function distributeCentsByWeight(
  totalCents: number,
  weightedRecipients: Array<{ recipientId: string; weight: number }>,
  fallbackRecipientIds: string[],
) {
  const distributed = new Map<string, number>()

  for (const { recipientId } of weightedRecipients) {
    distributed.set(recipientId, 0)
  }

  if (totalCents === 0) {
    return distributed
  }

  const totalWeight = weightedRecipients.reduce((sum, entry) => sum + entry.weight, 0)

  if (totalWeight <= 0) {
    const fallbackDistribution = distributeCentsAcrossRecipients(totalCents, fallbackRecipientIds)

    for (const [recipientId, amountCents] of fallbackDistribution.entries()) {
      distributed.set(recipientId, amountCents)
    }

    return distributed
  }

  const sign = totalCents < 0 ? -1 : 1
  const absoluteTotal = Math.abs(totalCents)
  const rankedRecipients = weightedRecipients.map((entry, index) => {
    const weightedNumerator = absoluteTotal * entry.weight
    const baseShare = Math.floor(weightedNumerator / totalWeight)

    return {
      ...entry,
      baseShare,
      index,
      remainderNumerator: weightedNumerator % totalWeight,
    }
  })

  let remainingCents =
    absoluteTotal - rankedRecipients.reduce((sum, entry) => sum + entry.baseShare, 0)

  rankedRecipients
    .sort((left, right) => {
      if (right.remainderNumerator !== left.remainderNumerator) {
        return right.remainderNumerator - left.remainderNumerator
      }

      return left.index - right.index
    })
    .forEach((entry) => {
      const extraCent = remainingCents > 0 ? 1 : 0
      const amountCents = sign * (entry.baseShare + extraCent)
      distributed.set(entry.recipientId, amountCents === 0 ? 0 : amountCents)
      remainingCents = Math.max(remainingCents - 1, 0)
    })

  return distributed
}

export function getGroupShareSummaries(
  state: ReceiptEditorState,
): GroupShareSummary[] {
  const itemSubtotals = new Map<string, number>()
  const participatingGroupIds = new Set<string>()

  for (const group of state.groups) {
    itemSubtotals.set(group.id, 0)
  }

  for (const item of state.items) {
    if (item.selectedGroupIds.length === 0) {
      continue
    }

    for (const groupId of item.selectedGroupIds) {
      participatingGroupIds.add(groupId)
    }

    const lineSubtotal = getItemLineSubtotalCents(item)
    const distributedLineSubtotal = distributeCentsAcrossRecipients(
      lineSubtotal,
      item.selectedGroupIds,
    )

    for (const [groupId, amountCents] of distributedLineSubtotal.entries()) {
      itemSubtotals.set(groupId, (itemSubtotals.get(groupId) ?? 0) + amountCents)
    }
  }

  const weightedGroups = state.groups.map((group) => ({
    recipientId: group.id,
    weight: itemSubtotals.get(group.id) ?? 0,
  }))
  const fallbackRecipientIds = state.groups
    .map((group) => group.id)
    .filter((groupId) => participatingGroupIds.has(groupId))

  const taxShares = distributeCentsByWeight(
    parseMoneyInputToCents(state.tax),
    weightedGroups,
    fallbackRecipientIds,
  )
  const tipShares = distributeCentsByWeight(
    parseMoneyInputToCents(state.tip),
    weightedGroups,
    fallbackRecipientIds,
  )
  const feeShares = distributeCentsByWeight(
    parseMoneyInputToCents(state.fee),
    weightedGroups,
    fallbackRecipientIds,
  )
  const discountShares = distributeCentsByWeight(
    -parseMoneyInputToCents(state.discount),
    weightedGroups,
    fallbackRecipientIds,
  )

  return state.groups.map((group) => ({
    amountCents:
      (itemSubtotals.get(group.id) ?? 0) +
      (taxShares.get(group.id) ?? 0) +
      (tipShares.get(group.id) ?? 0) +
      (feeShares.get(group.id) ?? 0) +
      (discountShares.get(group.id) ?? 0),
    discountShareCents: discountShares.get(group.id) ?? 0,
    feeShareCents: feeShares.get(group.id) ?? 0,
    groupId: group.id,
    itemSubtotalCents: itemSubtotals.get(group.id) ?? 0,
    taxShareCents: taxShares.get(group.id) ?? 0,
    tipShareCents: tipShares.get(group.id) ?? 0,
  }))
}

export function getGroupItemShareDetails(
  state: ReceiptEditorState,
): GroupItemShareDetail[] {
  const details: GroupItemShareDetail[] = []

  for (const item of state.items) {
    if (item.selectedGroupIds.length === 0) {
      continue
    }

    const lineSubtotalCents = getItemLineSubtotalCents(item)
    const distributedLineSubtotal = distributeCentsAcrossRecipients(
      lineSubtotalCents,
      item.selectedGroupIds,
    )
    const ratioLabel = `1/${item.selectedGroupIds.length}`

    for (const [groupId, shareCents] of distributedLineSubtotal.entries()) {
      details.push({
        description: item.description.trim() || "Untitled item",
        groupId,
        itemId: item.id,
        lineSubtotalCents,
        ratioLabel,
        shareCents,
      })
    }
  }

  return details
}

export function getReceiptEditorValidation(
  state: ReceiptEditorState,
): ReceiptEditorValidation {
  const result = receiptEditorSchema.safeParse({
    currencyCode: state.currencyCode,
    discount: normalizeMoneyInput(state.discount),
    fee: normalizeMoneyInput(state.fee),
    groups: state.groups.map((group) => ({
      displayName: group.displayName,
      notes: group.notes,
    })),
    items: state.items.map((item) => ({
      description: item.description,
      discount: normalizeMoneyInput(item.discount),
      quantity: item.quantity,
      selectedGroupIds: item.selectedGroupIds,
      unitPrice: normalizeMoneyInput(item.unitPrice),
    })),
    merchantName: state.merchantName,
    receiptOccurredAt: state.receiptOccurredAt,
    tax: normalizeMoneyInput(state.tax),
    tip: normalizeMoneyInput(state.tip),
  })

  if (result.success) {
    return {
      canSave: true,
      issues: [],
    }
  }

  const issues = new Set<string>()

  for (const issue of result.error.issues) {
    if (issue.path[0] === "merchantName" || issue.path[0] === "receiptOccurredAt") {
      issues.add("Add the merchant name and receipt date before saving.")
      continue
    }

    if (issue.path[0] === "groups") {
      issues.add("Every split group needs a name, and the receipt needs at least one group.")
      continue
    }

    if (issue.path[0] === "items") {
      issues.add("Complete the required item fields before saving.")
      continue
    }

    issues.add(issue.message)
  }

  return {
    canSave: false,
    issues: [...issues],
  }
}

export function mapReceiptToEditorState(receipt: Receipt): ReceiptEditorState {
  const groups = receipt.participants.map((participant) =>
    createEditableGroup({
      displayName: participant.displayName,
      id: participant.participantId,
      isPaid: participant.isPaid,
      notes: participant.notes ?? "",
      participantId: participant.participantId,
    }),
  )

  const items = receipt.items.map((item) =>
    createEditableItem({
      category: item.category ?? "",
      description: item.description,
      discount: centsToInputValue(item.discountCents),
      id: item.itemId,
      itemId: item.itemId,
      quantity: String(item.quantity),
      selectedGroupIds: item.allocations.map((allocation) => allocation.participantId),
      unitPrice: centsToInputValue(item.unitPriceCents),
    }),
  )

  return {
    allocationPolicy: receipt.allocationPolicy,
    capturedAt: receipt.capturedAt ?? receipt.createdAt,
    currencyCode: receipt.currencyCode,
    discount: centsToInputValue(receipt.discountCents),
    fee: centsToInputValue(receipt.feeCents),
    groups,
    items,
    locationAddress: receipt.locationAddress ?? "",
    locationName: receipt.locationName ?? "",
    merchantName: receipt.merchantName,
    receiptId: receipt.receiptId,
    receiptOccurredAt: normalizeDateTimeInput(receipt.receiptOccurredAt),
    tax: centsToInputValue(receipt.taxCents),
    tip: centsToInputValue(receipt.tipCents),
    version: receipt.version,
  }
}

export function buildEqualAllocationInput(participantIds: string[]) {
  return participantIds.map((participantId) => ({
    participantId,
    shareWeight: 1,
  }))
}

export function buildReceiptSavePlan(
  state: ReceiptEditorState,
  receipt: Receipt | null,
): ReceiptSavePlan {
  if (!receipt) {
    return {
      createReceipt: true,
      deleteItemIds: [],
      deleteParticipantIds: [],
      saveItemCount: state.items.length,
      saveParticipantCount: state.groups.length,
      setAllocationCount: state.items.length,
      updateMetadata: true,
    }
  }

  const currentParticipantIds = new Set(
    state.groups
      .map((group) => group.participantId)
      .filter((participantId): participantId is string => Boolean(participantId)),
  )
  const serverItemsById = new Map(receipt.items.map((item) => [item.itemId, item]))
  const serverParticipantsById = new Map(
    receipt.participants.map((participant) => [participant.participantId, participant]),
  )

  const metadataChanged =
    receipt.merchantName !== state.merchantName.trim() ||
    receipt.receiptOccurredAt !== toAwsDateTime(state.receiptOccurredAt) ||
    (receipt.locationName ?? "") !== state.locationName.trim() ||
    (receipt.locationAddress ?? "") !== state.locationAddress.trim() ||
    receipt.currencyCode !== state.currencyCode.trim().toUpperCase() ||
    receipt.taxCents !== parseMoneyInputToCents(state.tax) ||
    receipt.tipCents !== parseMoneyInputToCents(state.tip) ||
    receipt.feeCents !== parseMoneyInputToCents(state.fee) ||
    receipt.discountCents !== parseMoneyInputToCents(state.discount) ||
    receipt.subtotalCents !== getReceiptSubtotalCents(state) ||
    receipt.totalCents !== getReceiptTotalCents(state)

  const saveParticipantCount = state.groups.filter((group, index) => {
    if (!group.participantId) {
      return true
    }

    const existing = serverParticipantsById.get(group.participantId)

    if (!existing) {
      return true
    }

    return (
      existing.displayName !== group.displayName.trim() ||
      existing.isPaid !== group.isPaid ||
      (existing.notes ?? "") !== group.notes.trim() ||
      (existing.sortOrder ?? index) !== index
    )
  }).length

  const saveItemCount = state.items.filter((item) => {
    if (!item.itemId) {
      return true
    }

    const existing = serverItemsById.get(item.itemId)

    if (!existing) {
      return true
    }

    return (
      existing.description !== item.description.trim() ||
      (existing.category ?? "") !== item.category.trim() ||
      existing.quantity !== parseQuantityInput(item.quantity) ||
      existing.unitPriceCents !== parseMoneyInputToCents(item.unitPrice) ||
      existing.discountCents !== parseMoneyInputToCents(item.discount) ||
      existing.lineSubtotalCents !== getItemLineSubtotalCents(item)
    )
  }).length

  const setAllocationCount = state.items.filter((item) => {
    if (!item.itemId) {
      return true
    }

    const existing = serverItemsById.get(item.itemId)

    if (!existing) {
      return true
    }

    const existingParticipantIds = existing.allocations.map((allocation) => allocation.participantId)
    return !equalIdSets(existingParticipantIds, item.selectedGroupIds)
  }).length

  return {
    createReceipt: false,
    deleteItemIds: receipt.items
      .filter((item) => !state.items.some((currentItem) => currentItem.itemId === item.itemId))
      .map((item) => item.itemId),
    deleteParticipantIds: receipt.participants
      .filter((participant) => !currentParticipantIds.has(participant.participantId))
      .map((participant) => participant.participantId),
    saveItemCount,
    saveParticipantCount,
    setAllocationCount,
    updateMetadata: metadataChanged,
  }
}

export function isMeaningfullyDirty(
  state: ReceiptEditorState,
  receipt: Receipt | null,
) {
  const plan = buildReceiptSavePlan(state, receipt)

  return (
    plan.createReceipt ||
    plan.updateMetadata ||
    plan.saveItemCount > 0 ||
    plan.saveParticipantCount > 0 ||
    plan.setAllocationCount > 0 ||
    plan.deleteItemIds.length > 0 ||
    plan.deleteParticipantIds.length > 0
  )
}
