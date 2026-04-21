import { Suspense } from "react";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";

import { NewReceiptPageClient } from "./new-receipt-page-client";

export default function NewReceiptPage() {
  return (
    <Suspense
      fallback={
        <AuthSessionScreen
          title="Preparing a new receipt"
          description="Loading the upload workspace."
        />
      }
    >
      <NewReceiptPageClient />
    </Suspense>
  );
}
