"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, Zap, Users, Camera, Pizza, Beer, Croissant, Coffee, HandPlatter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthSessionScreen } from "@/components/auth/auth-session-screen";
import { useAuth } from "@/components/auth/auth-provider";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  if (status === "authenticated") {
    return (
      <AuthSessionScreen
        title="Routing to your dashboard"
        description="Authenticated users land on the receipt archive instead of the marketing page."
      />
    );
  }

  const marqueeItems = [
    { text: "Late Night Pizza", icon: <Pizza className="w-6 h-6 stroke-[2.5]" /> },
    { text: "Sunday Brunch", icon: <Coffee className="w-6 h-6 stroke-[2.5]" /> },
    { text: "Happy Hour", icon: <Beer className="w-6 h-6 stroke-[2.5]" /> },
    { text: "Parisian Bakery", icon: <Croissant className="w-6 h-6 stroke-[2.5]" /> },
    { text: "Tapas Night", icon: <HandPlatter className="w-6 h-6 stroke-[2.5]" /> },
  ];
  
  // Duplicate array 4 times for seamless infinite scroll on ultra-wide screens
  const marqueeContent = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <main className="-mt-28 flex flex-1 flex-col overflow-hidden bg-background relative">
      {/* Playful Background Blobs & Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-foreground)_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]" />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 50, 0], borderRadius: ["40%", "60%", "40%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[5%] w-[600px] h-[600px] bg-[var(--color-blob-1)] opacity-20 blur-3xl rounded-full"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], borderRadius: ["60%", "40%", "60%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-[var(--color-blob-2)] opacity-20 blur-3xl rounded-full"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 20, 0], borderRadius: ["50%", "30%", "50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] -left-[10%] w-[400px] h-[400px] bg-accent opacity-10 blur-3xl rounded-full"
        />
      </div>

      {/* 1. Split Hero Section */}
      <section className="relative z-10 w-full pt-32 pb-12 md:pt-40 md:pb-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        
        {/* Left Side: Text */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="mb-8 rotate-[-2deg]"
          >
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full border-4 border-foreground shadow-[4px_4px_0px_0px_var(--color-accent)]">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-2 sm:px-3 text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent fill-accent" />
                The Group Pay Revolution
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-heading font-black text-foreground max-w-2xl tracking-tight leading-[1.05]"
          >
            Split the bill,  <div className="inline-block relative">
              skip the math.
              <svg className="absolute -bottom-3 w-full h-4 text-secondary -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 15 100 5 L 100 10 L 0 10 Z" fill="currentColor"/>
              </svg>
            </div>
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
              <Button size="lg" className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-12 text-xl sm:text-2xl font-black rounded-full group border-4 border-foreground bg-primary text-primary-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                Get Started
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="ml-3 w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
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
          <div className="relative flex items-center justify-center w-64 sm:w-72 h-80 sm:h-96">
            {/* Main Floating Receipt */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [2, 0, 2] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-full bg-white rounded-[3rem] border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-20 overflow-hidden flex flex-col p-6"
            >
              <div className="absolute top-0 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMiI+PHBhdGggZD0iTTEwIDEyTDAgMGgyMGwtMTAgMTJ6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] opacity-20 repeat-x background-size-[24px]" />
              
              <div className="w-full text-center border-b-4 border-dashed border-muted pb-4 mb-5 pt-2">
                <h3 className="font-heading font-black text-3xl text-foreground">Bistro 77</h3>
                <p className="text-muted-foreground font-bold text-sm tracking-widest uppercase mt-1">Table 4, 8:45 PM</p>
              </div>
              
              <div className="flex justify-between items-center mb-5">
                <div className="w-2/3 h-4 bg-muted rounded-full" />
                <div className="w-1/4 h-5 bg-primary rounded-full border-2 border-foreground" />
              </div>
              <div className="flex justify-between items-center mb-5">
                <div className="w-1/2 h-4 bg-muted rounded-full" />
                <div className="w-1/3 h-5 bg-secondary rounded-full border-2 border-foreground" />
              </div>
              <div className="flex justify-between items-center mb-5">
                <div className="w-3/4 h-4 bg-muted rounded-full" />
                <div className="w-1/5 h-5 bg-accent rounded-full border-2 border-foreground" />
              </div>
              
              <div className="mt-auto flex justify-between items-end w-full pt-4 border-t-4 border-dashed border-foreground">
                <span className="font-black tracking-widest uppercase text-lg text-muted-foreground">Total</span>
                <span className="font-heading font-black text-4xl text-foreground">$104.50</span>
              </div>
            </motion.div>

            {/* Floating Coral Decor */}
            <motion.div
              animate={{ y: [0, 15, 0], x: [0, -5, 0], rotate: [-20, 0, -20] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-16 sm:-left-24 top-8 sm:top-14 w-24 h-24 sm:w-28 sm:h-28 bg-secondary border-4 border-foreground rounded-full rotate-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-30"
            >
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-secondary-foreground" />
            </motion.div>

            {/* Floating Sunflower Decor */}
            <motion.div
              animate={{ y: [0, -15, 0], x: [0, 10, 0], rotate: [15, -10, 15] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-16 sm:-right-24 bottom-8 sm:bottom-12 w-20 h-20 sm:w-24 sm:h-24 bg-accent border-4 border-foreground rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-10"
            >
              <Coins className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
          </div>
        </motion.div>

      </section>

      {/* 2. Scrolling Marquee */}
      <div className="relative z-10 w-full overflow-hidden bg-white border-y-4 border-foreground py-5 sm:py-7 mt-8 sm:mt-12">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
          className="flex whitespace-nowrap w-max items-center"
        >
          {marqueeContent.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 sm:gap-5 px-6 sm:px-8 text-2xl sm:text-3xl font-black font-heading text-foreground uppercase tracking-wide">
              <span className="text-secondary bg-secondary/10 p-2 rounded-full border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{item.icon}</span>
              {item.text}
              <span className="mx-6 sm:mx-8 text-muted-foreground/30 font-black">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 3. Steps Zig-Zag Narrative */}
      <section className="relative z-10 py-20 md:py-32 px-4 sm:px-6 md:px-12 w-full max-w-6xl mx-auto flex flex-col gap-24 md:gap-32">
        
        <div className="text-center md:mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black px-2">Split it in three steps.</h2>
        </div>

        {/* Step 1: Snap */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex-1 w-full max-h-[400px] flex items-center justify-center relative p-6 md:p-8"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-[4rem] -z-10" />
            <motion.div
              whileHover={{ scale: 1.05, rotate: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-primary border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[3rem] w-full max-w-[250px] aspect-square flex items-center justify-center text-primary-foreground transform rotate-2"
            >
              <Camera className="w-24 h-24" />
            </motion.div>
          </motion.div>
          
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block py-2 px-5 rounded-full border-2 border-primary bg-primary/20 text-primary text-base font-black tracking-widest mb-6">STEP 1</span>
            <h3 className="text-4xl lg:text-6xl font-heading font-black mb-6">Scan the receipt.</h3>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
              Our super-smart AI reads the crumpled paper instantly. It extracts every line item, price, and tax perfectly. No manual entry needed.
            </p>
          </div>
        </div>

        {/* Step 2: Claim (Reversed) */}
        <div className="flex flex-col md:flex-row items-center gap-10 lg:gap-24">
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block py-2 px-5 rounded-full border-2 border-secondary bg-secondary/20 text-secondary text-base font-black tracking-widest mb-6">STEP 2</span>
            <h3 className="text-4xl lg:text-6xl font-heading font-black mb-6">Select your bites.</h3>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
              Send a link to the group. Everyone taps exactly what they ate. Did two people share the nachos? Tapping it splits it perfectly. 
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex-1 w-full max-h-[400px] flex items-center justify-center relative p-6 md:p-8"
          >
            <div className="absolute inset-0 bg-secondary/10 rounded-[4rem] -z-10" />
            <motion.div
              whileHover={{ scale: 1.05, rotate: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-white border-4 border-foreground shadow-[8px_8px_0px_0px_var(--color-secondary)] rounded-[3rem] w-full max-w-[300px] p-6 flex flex-col gap-4 transform -rotate-2"
            >
               <div className="w-full flex justify-between items-center p-4 bg-muted/50 border-2 border-border rounded-2xl hover:border-foreground transition-colors cursor-pointer">
                 <span className="font-bold text-lg">Nachos</span>
                 <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-primary shadow-sm flex items-center justify-center font-bold text-white text-xs">J</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-accent shadow-sm flex items-center justify-center font-bold text-accent-foreground text-xs">A</div>
                 </div>
               </div>
               <div className="w-full flex justify-between items-center p-4 bg-muted/50 border-2 border-border rounded-2xl hover:border-foreground transition-colors cursor-pointer">
                 <span className="font-bold text-lg">Margarita</span>
                 <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-secondary shadow-sm flex items-center justify-center font-bold text-white text-xs">K</div>
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
             className="flex-1 w-full max-h-[400px] flex items-center justify-center relative p-6 md:p-8"
           >
             <div className="absolute inset-0 bg-accent/10 rounded-[4rem] -z-10" />
             <motion.div
               whileHover={{ scale: 1.05, rotate: -4 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
               className="bg-accent border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[3rem] w-full max-w-[250px] aspect-square flex flex-col items-center justify-center p-6 transform rotate-2 relative overflow-hidden"
             >
               <div className="absolute top-0 left-0 right-0 h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMiI+PHBhdGggZD0iTTEwIDEyTDAgMGgyMGwtMTAgMTJ6IiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] opacity-20 repeat-x background-size-[20px]" />
               
               <div className="text-center z-10">
                 <div className="text-accent-foreground text-sm font-black tracking-widest uppercase mb-2">YOU OWE</div>
                 <div className="text-5xl md:text-6xl font-heading font-black text-foreground bg-white border-4 border-foreground rounded-2xl px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   $24.<span className="text-4xl text-muted-foreground">00</span>
                 </div>
               </div>
             </motion.div>
           </motion.div>
           
           <div className="flex-1 text-center md:text-left">
             <span className="inline-block py-2 px-5 rounded-full border-2 border-accent bg-accent/30 text-[color-mix(in_oklab,var(--color-accent),black_30%)] text-base font-black tracking-widest mb-6">STEP 3</span>
             <h3 className="text-4xl lg:text-6xl font-heading font-black mb-6">Never do math again.</h3>
             <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
               Tax and tip are automatically proportioned perfectly based on exactly what you ate. You just hit &ldquo;Pay&rdquo; and the relationship survives.
             </p>
           </div>
        </div>

      </section>

      {/* Geometric Visual Divider */}
      <div className="relative z-10 w-full flex justify-center items-center gap-4 py-16">
        <div className="w-20 md:w-32 h-2 bg-foreground rounded-full"></div>
        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-foreground bg-primary"></div>
        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-foreground bg-secondary"></div>
        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-foreground bg-accent"></div>
        <div className="w-20 md:w-32 h-2 bg-foreground rounded-full"></div>
      </div>
      
      {/* 4. Homogenous CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full relative z-10 py-24 md:py-40 px-6 max-w-5xl mx-auto flex flex-col items-center justify-center text-center"
      >
        <div className="w-full flex-1 bg-white border-4 border-foreground rounded-[3rem] px-8 py-16 md:py-24 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black text-foreground mb-8 leading-[1.1] tracking-tight">
            Ready to skip the math?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
            Join thousands of friends saving time, money, and their group chats. The easiest way to split the bill is here.
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-20 px-10 md:px-16 text-xl md:text-2xl font-black rounded-full group border-4 border-foreground !bg-primary !text-primary-foreground hover:!bg-primary/90 active:!bg-primary/90 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-full sm:w-auto">
              Try CheckSplit now
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="ml-4 w-6 h-6 md:w-8 md:h-8 stroke-[3]" />
              </motion.span>
            </Button>
          </Link>
        </div>
      </motion.section>

    </main>
  );
}
