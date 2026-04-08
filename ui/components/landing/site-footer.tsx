import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="bg-white border-t-4 border-foreground py-10 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm font-bold text-muted-foreground uppercase tracking-wider">
        <BrandLogo
          className="gap-3"
          iconClassName="h-12 w-12"
          nameClassName="text-[1.6rem] font-black"
          animateOnHover={false}
        />
        <div className="flex space-x-6 mt-8 md:mt-0">
          <Link href="/privacy" className="hover:text-foreground hover:underline underline-offset-4 decoration-2 transition-all">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-foreground hover:underline underline-offset-4 decoration-2 transition-all">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
