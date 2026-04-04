import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReceiptText, ScanLine } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center space-x-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border shadow-md transition-transform duration-300 group-hover:scale-110">
            <ReceiptText className="absolute h-5 w-5 text-black/70 z-10" />
            <ScanLine className="absolute h-10 w-10 text-secondary/50 p-1" />
          </div>
          <span className="font-heading font-bold sm:inline-block text-2xl tracking-tight text-primary">
            Check<span className="text-secondary">Split</span>
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full font-bold hover:bg-secondary/20">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full font-bold shadow-md">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
