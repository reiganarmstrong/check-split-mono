"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { ReceiptWorkspace } from "@/components/receipts/receipt-workspace"

export function ReceiptQueryPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const receiptId = searchParams.get("receiptId")?.trim() ?? ""

  useEffect(() => {
    if (!receiptId) {
      router.replace("/dashboard")
    }
  }, [receiptId, router])

  if (!receiptId) {
    return (
      <AuthSessionScreen
        title="Opening receipt workspace"
        description="Missing receipt id. Returning to archive."
      />
    )
  }

  return <ReceiptWorkspace receiptId={receiptId} />
}
