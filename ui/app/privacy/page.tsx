import type { Metadata } from "next";

import { PageEntrance } from "@/components/layout/page-entrance";
import { ScrollToPageTop } from "@/components/navigation/scroll-to-page-top";

export const metadata: Metadata = {
  title: "Privacy | CheckSplit",
  description: "Privacy information for CheckSplit.",
};

const privacySections = [
  {
    title: "Information we collect",
    body: "CheckSplit collects only the account details you provide, the receipt images you upload, extracted receipt data, split details you save, and basic device or usage information needed to keep product reliable and secure.",
  },
  {
    title: "How we use information",
    body: "CheckSplit uses collected information to create and save splits, protect accounts, and prevent abuse of our service.",
  },
  {
    title: "Sharing",
    body: "I (the solo dev) will not sell your personal information. This is just a side project I made to help people (like me) split purchase costs. I don't intend to make money on this.",
  },
  {
    title: "Retention",
    body: "Your account and saved split data are stored while your account is active. If you delete your account, we will delete all the information we have stored that is linked to your account.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 pb-24">
      <ScrollToPageTop />
      <section className="page-shell pt-16 sm:pt-20 lg:pt-24">
        <PageEntrance className="mx-auto max-w-3xl">
          <h1 className="text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            Effective May 03, 2026. This page explains what information
            CheckSplit collects, how it is used, and how it will be deleted.
          </p>
        </PageEntrance>
      </section>

      <section className="page-shell mt-14 sm:mt-16">
        <PageEntrance
          delay={0.08}
          className="mx-auto max-w-3xl border-t border-[var(--line)] pt-8 sm:pt-10"
        >
          <div className="space-y-8">
            {privacySections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl leading-tight text-[var(--foreground)] sm:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </PageEntrance>
      </section>
    </main>
  );
}
