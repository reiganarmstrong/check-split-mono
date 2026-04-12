import { ReceiptWorkspace } from "@/components/receipts/receipt-workspace"

type ReceiptDetailPageProps = {
  params: Promise<{
    receiptId: string
  }>
}

export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const { receiptId } = await params

  return <ReceiptWorkspace receiptId={receiptId} />
}
