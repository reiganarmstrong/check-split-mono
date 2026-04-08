import { mockReceipts } from "@/lib/mock-receipts"

import { ReceiptDetailPageClient } from "./receipt-detail-page-client"

export const dynamicParams = false

export function generateStaticParams() {
  return mockReceipts.map(({ id }) => ({
    receiptId: id,
  }))
}

type ReceiptDetailPageProps = {
  params: Promise<{
    receiptId: string
  }>
}

export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const { receiptId } = await params

  return <ReceiptDetailPageClient receiptId={receiptId} />
}
