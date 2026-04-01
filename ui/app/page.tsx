"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Receipt, Coins, ArrowRight, Zap, Users, Camera, Pizza, Beer, Croissant, Coffee, HandPlatter } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const marqueeItems = [
    { text: "Late Night Pizza", icon: <Pizza /> },
    { text: "Sunday Brunch", icon: <Coffee /> },
    { text: "Happy Hour", icon: <Beer /> },
    { text: "Parisian Bakery", icon: <Croissant /> },
    { text: "Tapas Night", icon: <HandPlatter /> },
  ];
  
  // Duplicate array 4 times for seamless infinite scroll on ultra-wide screens
  const marqueeContent = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
      {/* Subtle Layout Backdrop Texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px]"></div>
      </div>

      {/* 1. Split Hero Section */}
      <section className="relative z-10 w-full pt-16 pb-12 md:pt-32 md:pb-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Side: Text */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-full shadow-sm border border-black/5 dark:border-white/10">
              <span className="text-xs sm:text-sm font-bold px-2 sm:px-3 text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent fill-accent" />
                The Group Pay Revolution
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-[5rem] font-heading font-black text-foreground max-w-2xl tracking-tight leading-[1.05]"
          >
            Split the bill,  <div className="inline-block">skip the math.</div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="mt-6 text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-xl"
          >
            Just snap a photo of the receipt. We magically identify the items, you claim what you ate, and everyone pays their exact share.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100, bounce: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start w-full"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 text-lg sm:text-xl font-bold rounded-full group shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105">
                Get Started
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6" />
                </motion.span>
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Interactive Abstract UI */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="flex-1 w-full max-w-sm sm:max-w-md lg:max-w-lg relative h-[380px] sm:h-[450px] flex items-center justify-center"
        >
          <div className="relative flex items-center justify-center w-56 sm:w-64 h-72 sm:h-80">
            {/* Main Floating Receipt */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full bg-white dark:bg-card rounded-3xl sm:rounded-4xl shadow-2xl border border-black/5 dark:border-white/10 z-20 overflow-hidden flex flex-col p-5 sm:p-6"
            >
              <div className="w-full text-center border-b-2 border-dashed border-muted pb-3 mb-3 sm:pb-4 sm:mb-4">
                <h3 className="font-heading font-black text-xl sm:text-2xl">Bistro 77</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">Table 4, 8:45 PM</p>
              </div>
              
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="w-2/3 h-3 sm:h-4 bg-muted/60 rounded-full" />
                <div className="w-1/4 h-3 sm:h-4 bg-primary/20 rounded-full" />
              </div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="w-1/2 h-3 sm:h-4 bg-muted/60 rounded-full" />
                <div className="w-1/3 h-3 sm:h-4 bg-secondary/20 rounded-full" />
              </div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="w-3/4 h-3 sm:h-4 bg-muted/60 rounded-full" />
                <div className="w-1/5 h-3 sm:h-4 bg-accent/20 rounded-full" />
              </div>
              
              <div className="mt-auto flex justify-between items-center w-full pt-3 sm:pt-4 border-t-2 border-dashed border-muted">
                <span className="font-bold text-lg sm:text-xl text-muted-foreground">Total</span>
                <span className="font-black text-2xl sm:text-3xl text-primary">$104.50</span>
              </div>
            </motion.div>

            {/* Floating Coral Decor */}
            <motion.div
              animate={{ y: [0, 15, 0], x: [0, -5, 0], rotate: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-16 sm:-left-24 lg:-left-32 top-10 sm:top-16 w-20 h-20 sm:w-28 sm:h-28 bg-secondary rounded-full rotate-12 shadow-xl flex items-center justify-center z-30"
            >
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-secondary-foreground" />
            </motion.div>

            {/* Floating Sunflower Decor */}
            <motion.div
              animate={{ y: [0, -15, 0], x: [0, 10, 0], rotate: [0, 15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-16 sm:-right-24 lg:-right-32 bottom-10 sm:bottom-16 w-16 h-16 sm:w-24 sm:h-24 bg-accent rounded-full shadow-lg flex items-center justify-center z-10"
            >
              <Coins className="w-6 h-6 sm:w-10 sm:h-10 text-accent-foreground" />
            </motion.div>
          </div>
        </motion.div>

      </section>

      {/* 2. Scrolling Marquee */}
      <div className="relative z-10 w-full overflow-hidden bg-white/60 dark:bg-black/20 border-y border-black/5 dark:border-white/10 py-4 sm:py-6 mt-6 sm:mt-10 backdrop-blur-md">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          className="flex whitespace-nowrap w-max items-center"
        >
          {marqueeContent.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 text-lg sm:text-xl md:text-2xl font-bold font-heading text-muted-foreground opacity-80">
              <span className="text-primary">{item.icon}</span>
              {item.text}
              <span className="mx-4 sm:mx-6 text-muted-foreground/30">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 3. Steps Zig-Zag Narrative */}
      <section className="relative z-10 py-16 md:py-24 px-4 sm:px-6 md:px-12 w-full max-w-6xl mx-auto flex flex-col gap-24 md:gap-32">
        
        <div className="text-center md:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-black px-2">Split it in three steps.</h2>
        </div>

        {/* Step 1: Snap */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex-1 w-full bg-primary/10 rounded-[3rem] md:rounded-[4rem] aspect-square max-h-[350px] md:max-h-[400px] flex items-center justify-center relative shadow-inner p-6 md:p-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-primary shadow-xl rounded-4xl md:rounded-[3rem] w-full max-w-[200px] md:max-w-[250px] aspect-square flex items-center justify-center text-primary-foreground"
            >
              <Camera className="w-16 h-16 md:w-24 md:h-24" />
            </motion.div>
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary/20 text-primary text-sm font-bold tracking-wide mb-4 md:mb-6">STEP 1</span>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black mb-4 md:mb-6">Scan the receipt.</h3>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Our super-smart AI reads the crumpled paper instantly. It extracts every line item, price, and tax perfectly. No manual entry needed.
            </p>
          </div>
        </div>

        {/* Step 2: Claim (Reversed) */}
        <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-24">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block py-1.5 px-4 rounded-full bg-secondary/20 text-secondary text-sm font-bold tracking-wide mb-4 md:mb-6">STEP 2</span>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black mb-4 md:mb-6">Select your bites.</h3>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Send a link to the group. Everyone taps exactly what they ate. Did two people share the nachos? Tapping it splits it perfectly. 
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex-1 w-full bg-secondary/10 rounded-[3rem] md:rounded-[4rem] aspect-square max-h-[350px] md:max-h-[400px] flex items-center justify-center relative shadow-inner p-6 md:p-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-white dark:bg-card border-4 border-secondary shadow-xl rounded-4xl md:rounded-[3rem] w-full max-w-[250px] md:max-w-[280px] p-5 md:p-6 flex flex-col gap-3 md:gap-4"
            >
               <div className="w-full flex justify-between items-center p-3 md:p-4 bg-muted rounded-xl md:rounded-2xl">
                 <span className="font-bold text-sm md:text-base">Nachos</span>
                 <div className="flex -space-x-2 md:-space-x-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white bg-primary"></div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white bg-accent"></div>
                 </div>
               </div>
               <div className="w-full flex justify-between items-center p-3 md:p-4 bg-muted rounded-xl md:rounded-2xl">
                 <span className="font-bold text-sm md:text-base">Margarita</span>
                 <div className="flex -space-x-2 md:-space-x-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white bg-secondary"></div>
                 </div>
               </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Step 3: Math */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 lg:gap-24">
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             className="flex-1 w-full bg-accent/10 rounded-[3rem] md:rounded-[4rem] aspect-square max-h-[350px] md:max-h-[400px] flex items-center justify-center relative shadow-inner p-6 md:p-8"
           >
             <motion.div
               whileHover={{ scale: 1.05, rotate: -3 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
               className="bg-accent shadow-xl rounded-4xl md:rounded-[3rem] w-full max-w-[200px] md:max-w-[250px] aspect-square flex items-center justify-center overflow-hidden relative"
             >
               <div className="text-center z-10 p-4">
                 <div className="text-accent-foreground/50 text-sm md:text-base font-bold mb-1 md:mb-2">YOU OWE</div>
                 <div className="text-4xl md:text-5xl font-heading font-black text-accent-foreground">$24.00</div>
               </div>
               
               {/* Decorative background shape in the yellow block */}
               <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full blur-2xl"></div>
             </motion.div>
           </motion.div>
           
           <div className="flex-1 text-center md:text-left">
             <span className="inline-block py-1.5 px-4 rounded-full bg-accent/20 text-[color-mix(in_srgb,var(--accent),black_40%)] text-sm font-bold tracking-wide mb-4 md:mb-6">STEP 3</span>
             <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black mb-4 md:mb-6">Never do math again.</h3>
             <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
               Tax and tip are automatically proportioned perfectly based on exactly what you ate. You just hit "Pay" and the relationship survives.
             </p>
           </div>
        </div>

      </section>

      {/* Geometric Visual Divider */}
      <div className="w-full flex justify-center items-center gap-4 md:gap-6 py-12 md:py-20 opacity-90">
        <div className="w-16 md:w-32 h-1.5 bg-muted rounded-full"></div>
        <div className="w-4 h-4 rounded-full bg-primary shrink-0"></div>
        <div className="w-4 h-4 rounded-md bg-secondary rotate-12 shrink-0"></div>
        <div className="w-4 h-4 rounded-full bg-accent shrink-0"></div>
        <div className="w-16 md:w-32 h-1.5 bg-muted rounded-full"></div>
      </div>
      
      {/* 4. Homogenous CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full relative z-10 py-24 md:py-40 px-6 md:px-12 max-w-5xl mx-auto flex flex-col items-center justify-center text-center"
      >
        <div className="w-full flex-1">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-black text-foreground mb-6 md:mb-8 leading-[1.1] tracking-tight">
            Ready to skip the math?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 md:mb-12 font-medium px-4 max-w-2xl mx-auto leading-relaxed">
            Join thousands of friends saving time, money, and their group chats. The easiest way to split the bill is here.
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-16 px-10 md:px-12 text-lg md:text-xl font-bold rounded-full group shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105 w-full sm:w-auto">
              Try CheckSplit for Free
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="ml-3 sm:ml-4 w-6 h-6 md:w-6 md:h-6" />
              </motion.span>
            </Button>
          </Link>
        </div>
      </motion.section>

    </main>
  );
}
