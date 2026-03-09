import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background min-h-[calc(100vh-3.5rem)] flex items-center pt-8 pb-16">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="mx-auto max-w-4xl flex flex-col items-center">
          
          <div className="mb-8 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            <span>AI-powered receipt scanning</span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-[1.1]">
            <span className="block text-foreground drop-shadow-sm">Split the bill,</span>
            <span className="block bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent pb-2 mt-1">
              skip the math.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl mb-12 leading-relaxed">
            Snap your receipt, let us extract the items, and tap to assign who pays. <strong className="text-foreground font-semibold">It's that easy.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-8 text-lg w-full rounded-full shadow-md hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 group">
                Start Splitting for Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg w-full rounded-full border-2 hover:bg-accent active:bg-accent transition-all duration-300 shadow-sm hover:shadow-md">
                See How It Works
              </Button>
            </Link>
          </div>
          

        </div>
      </div>
      
      {/* Additional Decorative Gradients */}
      <div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-secondary opacity-30 blur-[130px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
      <div className="absolute top-1/4 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
    </section>
  );
}
