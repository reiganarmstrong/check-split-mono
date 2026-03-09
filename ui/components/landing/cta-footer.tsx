import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Receipt } from 'lucide-react';

export function CtaFooter() {
  return (
    <footer className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
          <div className="p-3 bg-primary/10 rounded-full mb-2 border border-primary/20">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Ready to split your first bill?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of people who have discovered the easiest way to manage group expenses and dinner bills.
          </p>
          <div className="pt-4">
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-8 h-14 text-lg transition-all shadow-sm hover:shadow-md">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="border-t py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Check Split. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
