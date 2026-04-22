import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | CheckSplit",
  description: "Contact information for CheckSplit.",
};

const contactSections = [
  {
    title: "About CheckSplit",
    body: "I built CheckSplit as solo project around receipt parsing and shared bill workflows. It is one of the main places I have been pushing on product feel, frontend polish, and implementation detail.",
  },
  {
    title: "Connect",
    body: "If you want to know more about me, LinkedIn is best place to start. It has my background and easiest path to reach out.",
  },
  {
    title: "Source code",
    body: "Source for project is on GitHub if you want to look through code, UI decisions, infrastructure, or commit history.",
  },
];

export default function ContactPage() {
  return (
    <main className="flex-1 pb-24">
      <section className="page-shell pt-16 sm:pt-20 lg:pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Contact
          </p>
          <h1 className="mt-4 text-4xl leading-[0.92] text-[var(--foreground)] sm:text-5xl">
            Contact and source
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            I built CheckSplit myself. If you want to learn more about me or
            look through code behind project, links below are best place to go.
          </p>
        </div>
      </section>

      <section className="page-shell mt-14 sm:mt-16">
        <div className="mx-auto max-w-3xl border-t border-[var(--line)] pt-8 sm:pt-10">
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
                className="rounded-[1.4rem] border border-[var(--line)] bg-white px-5 py-5 transition-colors hover:border-[var(--foreground)]"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  LinkedIn
                </p>
                <p className="mt-3 text-xl font-semibold leading-none text-[var(--foreground)]">
                  reagan-armstrong-1592a51ab
                </p>
              </a>
              <a
                href="https://github.com/reiganarmstrong/check-split-mono"
                target="_blank"
                rel="noreferrer"
                className="rounded-[1.4rem] border border-[var(--line)] bg-white px-5 py-5 transition-colors hover:border-[var(--foreground)]"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Source code
                </p>
                <p className="mt-3 text-xl font-semibold leading-none text-[var(--foreground)]">
                  check-split-mono
                </p>
              </a>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
