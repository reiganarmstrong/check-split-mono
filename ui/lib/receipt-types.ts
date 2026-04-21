export type AllocationPolicy = "EVEN" | "PROPORTIONAL"

export type ReceiptStatus = "DRAFT" | "OPEN" | "FINALIZED"

export type ReceiptListItem = {
  locationName: string | null
  merchantName: string
  paidParticipantCount: number
  participantCount: number
  receiptId: string
  receiptOccurredAt: string
  status: ReceiptStatus
  totalCents: number
  updatedAt: string
}

export type ReceiptItemAllocation = {
  createdAt: string
  itemId: string
  participantId: string
  shareWeight: number
  updatedAt: string
}

export type ReceiptParticipant = {
  createdAt: string | null
  displayName: string
  isPaid: boolean
  notes: string | null
  paidAt: string | null
  participantId: string
  sortOrder: number | null
  updatedAt: string
}

export type ReceiptItem = {
  allocations: ReceiptItemAllocation[]
  category: string | null
  createdAt: string
  description: string
  discountCents: number
  itemId: string
  lineSubtotalCents: number
  quantity: number
  scanConfidence: number | null
  sourceLineNumber: number | null
  unitPriceCents: number
  updatedAt: string
}

export type Receipt = {
  allocationPolicy: AllocationPolicy
  capturedAt: string | null
  createdAt: string
  currencyCode: string
  discountCents: number
  feeCents: number
  itemCount: number
  items: ReceiptItem[]
  locationAddress: string | null
  locationLat: number | null
  locationLng: number | null
  locationName: string | null
  merchantName: string
  ownerUserId: string
  paidParticipantCount: number
  participantCount: number
  participants: ReceiptParticipant[]
  receiptId: string
  receiptOccurredAt: string
  status: ReceiptStatus
  subtotalCents: number
  taxCents: number
  tipCents: number
  totalCents: number
  updatedAt: string
  version: number
}

export type EditableGroup = {
  id: string
  isPaid: boolean
  participantId: string | null
  displayName: string
  notes: string
}

export type EditableItem = {
  id: string
  itemId: string | null
  description: string
  category: string
  quantity: string
  unitPrice: string
  discount: string
  selectedGroupIds: string[]
}

export type ReceiptEditorState = {
  allocationPolicy: AllocationPolicy
  capturedAt: string
  currencyCode: string
  discount: string
  fee: string
  groups: EditableGroup[]
  items: EditableItem[]
  locationAddress: string
  locationName: string
  merchantName: string
  receiptId: string | null
  receiptOccurredAt: string
  status: ReceiptStatus
  tax: string
  tip: string
  version: number | null
}

export type GroupShareSummary = {
  amountCents: number
  groupId: string
  discountShareCents: number
  feeShareCents: number
  itemSubtotalCents: number
  taxShareCents: number
  tipShareCents: number
}

export type ReceiptSavePlan = {
  createReceipt: boolean
  deleteItemIds: string[]
  deleteParticipantIds: string[]
  saveItemCount: number
  saveParticipantCount: number
  setAllocationCount: number
  updateMetadata: boolean
}
