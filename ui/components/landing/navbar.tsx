import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center group">
          <BrandLogo
            className="transition-transform duration-300 group-hover:scale-103"
            wordmarkClassName="hidden sm:flex"
          />
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
