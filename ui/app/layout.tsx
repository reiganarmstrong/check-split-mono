import type { Metadata } from "next";
import { Quicksand, Fredoka } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "CheckSplit",
  description: "Snap your receipt, let AI extract the items, and easily assign who pays.",
};

import { Navbar } from "@/components/landing/navbar";
import { SiteFooter } from "@/components/landing/site-footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${fredoka.variable}`}>
      <body
        className={`bg-background font-sans text-foreground antialiased selection:bg-primary/20`}
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
