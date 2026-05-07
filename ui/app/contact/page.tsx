import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { PageEntrance } from "@/components/layout/page-entrance";
import { ScrollToPageTop } from "@/components/navigation/scroll-to-page-top";

export const metadata: Metadata = {
  title: "Contact | CheckSplit",
  description: "Contact information for CheckSplit.",
};

const contactSections = [
  {
    title: "Connect",
    body: (
      <>
        If you want to know more about me,{" "}
        <a
          href="https://www.linkedin.com/in/reagan-armstrong-1592a51ab"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--foreground)] underline decoration-[#0a66c2]/40 underline-offset-4 transition-colors hover:text-[#0a66c2] hover:decoration-[#0a66c2]"
        >
          LinkedIn
        </a>{" "}
        is the best place to start. It has my background and the easiest path
        to reach out.
      </>
    ),
  },
  {
    title: "Source code",
    body: (
      <>
        The source for this project is on{" "}
        <a
          href="https://github.com/reiganarmstrong/check-split-mono"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--foreground)] underline decoration-[#0a66c2]/40 underline-offset-4 transition-colors hover:text-[#0a66c2] hover:decoration-[#0a66c2]"
        >
          GitHub
        </a>{" "}
        if you want to look through the code, UI decisions, infrastructure, or
        commit history.
      </>
    ),
  },
];

const simpleIconPaths = {
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

function SimpleBrandIcon({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main className="flex-1 pb-24">
      <ScrollToPageTop />
      <section className="page-shell pt-16 sm:pt-20 lg:pt-24">
        <PageEntrance className="mx-auto max-w-3xl">
          <h1 className="text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
            Contact and source
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            Hi! I&apos;m Reagan. I built CheckSplit as a solo dev. If you want to
            learn more about me or look through the code behind this project,
            the links below are the best places to go.
          </p>
        </PageEntrance>
      </section>

      <section className="page-shell mt-14 sm:mt-16">
        <PageEntrance
          delay={0.08}
          className="mx-auto max-w-3xl border-t border-[var(--line)] pt-8 sm:pt-10"
        >
          <div className="space-y-8">
            {contactSections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl leading-tight text-[var(--foreground)] sm:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                  {section.body}
                </p>
              </section>
            ))}

            <section className="grid gap-4 border-t border-[var(--line)] pt-8 sm:grid-cols-2">
              <a
                href="https://www.linkedin.com/in/reagan-armstrong-1592a51ab"
                target="_blank"
                rel="noreferrer"
                className="group rounded-[0.9rem] border border-[var(--line)] bg-white p-5 shadow-[0_10px_22px_rgba(14,18,24,0.035)] transition-all hover:-translate-y-0.5 hover:border-[#0a66c2] hover:shadow-[0_16px_30px_rgba(14,18,24,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.8rem] bg-[#0a66c2] text-white">
                    <SimpleBrandIcon
                      path={simpleIconPaths.linkedin}
                      className="h-5 w-5"
                    />
                  </span>
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-colors group-hover:text-[#0a66c2]" />
                </div>
                <p className="mt-5 text-sm font-semibold text-[var(--foreground)]">
                  Connect
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[var(--muted-foreground)]">
                  reagan-armstrong-1592a51ab
                </p>
              </a>
              <a
                href="https://github.com/reiganarmstrong/check-split-mono"
                target="_blank"
                rel="noreferrer"
                className="group rounded-[0.9rem] border border-[var(--line)] bg-white p-5 shadow-[0_10px_22px_rgba(14,18,24,0.035)] transition-all hover:-translate-y-0.5 hover:border-[#24292f] hover:shadow-[0_16px_30px_rgba(14,18,24,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.8rem] bg-[#24292f] text-white">
                    <SimpleBrandIcon
                      path={simpleIconPaths.github}
                      className="h-5 w-5"
                    />
                  </span>
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-colors group-hover:text-[#24292f]" />
                </div>
                <p className="mt-5 text-sm font-semibold text-[var(--foreground)]">
                  Source Code
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-[var(--muted-foreground)]">
                  check-split-mono
                </p>
              </a>
            </section>
          </div>
        </PageEntrance>
      </section>
    </main>
  );
}
