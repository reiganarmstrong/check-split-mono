"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 md:px-0">
      
      {/* Crisp Floating Geometry (No Gradients) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]"></div>
        
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[5%] xl:left-[15%] w-24 h-24 md:w-32 md:h-32 rounded-full border-10 sm:border-16 border-primary/10"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 15, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[5%] xl:right-[15%] w-32 h-32 md:w-48 md:h-48 bg-secondary/10 rounded-4xl rotate-12"
        />
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, -20, 0], rotate: [-12, -5, -12] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[10%] xl:left-[20%] w-48 h-12 md:w-64 md:h-16 bg-primary/5 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [45, 90, 45] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[10%] xl:right-[20%] w-20 h-20 md:w-28 md:h-28 bg-accent/15 rounded-2xl md:rounded-3xl"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md bg-white/80 dark:bg-card/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl rounded-[2.5rem] p-8 sm:p-10 relative z-10 my-16"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-secondary/20 shadow-inner mb-6">
            <LogIn className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-base">Enter your email and password to sign in.</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                className="h-14 px-5 rounded-2xl bg-muted/50 border-transparent hover:border-border focus:bg-background transition-colors text-base"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="font-bold">Password</Label>
                <Link href="#" className="text-sm font-bold text-secondary hover:underline underline-offset-4">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                className="h-14 px-5 rounded-2xl bg-muted/50 border-transparent hover:border-border focus:bg-background transition-colors text-base"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 text-lg font-black rounded-full transition-transform hover:scale-[1.03] shadow-lg shadow-secondary/20 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Sign in
          </Button>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase text-muted-foreground">
              <span className="bg-white dark:bg-card px-4 rounded-full">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" className="h-12 rounded-2xl shadow-sm hover:scale-105 transition-transform font-bold">
              <svg className="w-5 h-5 mr-0 sm:mr-2" viewBox="0 0 24 24">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="hidden sm:inline">Google</span>
            </Button>
            <Button variant="outline" type="button" className="h-12 rounded-2xl shadow-sm hover:scale-105 transition-transform font-bold">
              <svg className="w-5 h-5 mr-0 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 1.58-.09 2.94.51 3.76 1.65-3.37 1.88-2.82 6.03.35 7.34-.78 1.91-1.8 3.02-2.77 3.98zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="hidden sm:inline">Apple</span>
            </Button>
          </div>
        </form>
        
        <div className="text-center text-base mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-black text-secondary hover:underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
