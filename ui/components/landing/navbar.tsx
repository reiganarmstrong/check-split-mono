import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReceiptText, ScanLine } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center space-x-2 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-sm transition-all duration-300 group-hover:shadow-primary/40 group-hover:-translate-y-0.5">
            <ReceiptText className="absolute h-4.5 w-4.5 text-white z-10" />
            <ScanLine className="absolute h-8 w-8 text-white/40 p-1" />
          </div>
          <span className="font-extrabold sm:inline-block text-xl tracking-tight text-foreground transition-all duration-300 group-hover:text-foreground/90 group-hover:-translate-y-0.5">
            Check<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Split</span>
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-sm hover:shadow-md active:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:-translate-y-0.5">Get Started</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
