import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "CheckSplit",
  description: "Snap your receipt, let AI extract the items, and easily assign who pays.",
  icons: {
    icon: [{ url: "/favicon.svg?v=app-palette-v6", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg?v=app-palette-v6"],
  },
};

import { Navbar } from "@/components/landing/navbar";
import { SiteFooter } from "@/components/landing/site-footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-background font-sans text-foreground antialiased selection:bg-primary/20`}
      >
        <AuthProvider>
          <div className="site-shell flex min-h-screen flex-col">
            <Suspense fallback={<div className="h-[81px] shrink-0" />}>
              <Navbar />
            </Suspense>
            <div className="site-main">{children}</div>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
