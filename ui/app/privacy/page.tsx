import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy | CheckSplit",
  description: "Privacy information for CheckSplit.",
};

const privacySections = [
  {
    title: "Information we collect",
    body: "CheckSplit may collect account details you provide, receipt images you upload, extracted receipt data, split details you save, and basic device or usage information needed to keep product reliable and secure.",
  },
  {
    title: "How we use information",
    body: "We use collected information to create and save splits, process receipt uploads, improve extraction quality, protect accounts, and handle privacy or legal inquiries when needed.",
  },
  {
    title: "Sharing",
    body: "We do not sell personal information. We may share data with service providers that help host application, store files, authenticate users, and operate core product infrastructure, but only as needed to run CheckSplit.",
  },
  {
    title: "Retention",
    body: "We keep account and saved split data while your account is active. If you delete your account, we will stop keeping that information except where we need to retain limited records for legal or security reasons.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 pb-24">
      <section className="page-shell pt-16 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Privacy
          </p>
          <h1 className="mt-4 text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            Effective April 22, 2026. This page explains what information
            CheckSplit may collect, how it may be used, and what choices users
            have.
          </p>
        </div>
      </section>

      <section className="page-shell mt-14 sm:mt-16">
        <div className="mx-auto max-w-3xl border-t border-[var(--line)] pt-8 sm:pt-10">
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
        </div>
      </section>
    </main>
  );
}
