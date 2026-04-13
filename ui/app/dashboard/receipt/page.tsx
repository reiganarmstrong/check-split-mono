import { Suspense } from "react"

import { AuthSessionScreen } from "@/components/auth/auth-session-screen"
import { ReceiptQueryPageClient } from "./receipt-query-page-client"

export default function ReceiptQueryPage() {
  return (
    <Suspense
      fallback={
        <AuthSessionScreen
          title="Opening receipt workspace"
          description="Loading selected receipt."
        />
      }
    >
      <ReceiptQueryPageClient />
    </Suspense>
  )
}
