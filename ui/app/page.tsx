import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CtaFooter } from "@/components/landing/cta-footer";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <CtaFooter />
    </>
  );
}
