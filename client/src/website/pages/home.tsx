import { Link } from "wouter";
import { motion, useScroll, useMotionValueEvent, useVelocity } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import { StoryboardShowcase, VideoModes, StoriesLab, AutoProduction, AboutSection, PricingSection, BlogSection } from "@/website/components/sections";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useRef } from "react";
import {
  logoGemini,
  logoHailuo,
  logoKling,
  logoMidjourney,
  logoNano,
  logoQwen,
  logoSeedance,
  logoSora2,
  logoVeo3
} from "@/website/assets/images";

export default function Home() {
  // Ref for controlling LightPillar
  const lightPillarRef = useRef<LightPillarRef>(null);

  // Track scroll progress and velocity
  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Update LightPillar with progress
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(progress);
    }
  });

  // Update LightPillar with velocity (normalized and dampened)
  useMotionValueEvent(scrollVelocity, "change", (velocity) => {
    if (lightPillarRef.current) {
      // Normalize velocity to a smaller, more controlled range (-0.5 to 0.5)
      // Using 4000 as divisor for more subtle response
      const normalizedVelocity = Math.max(-0.5, Math.min(0.5, velocity / 4000));
      lightPillarRef.current.setScrollVelocity(normalizedVelocity);
    }
  });

  return (
    <div className="website min-h-screen bg-gray-950 text-white">
      {/* Header - Fixed */}
      <Header />

      {/* Main Content with Background */}
      <main className="relative">
        {/* LightPillar Background - Fixed, with advanced scroll animations */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <LightPillar
            ref={lightPillarRef}
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={1}
            rotationSpeed={0.3}
            glowAmount={0.002}
            pillarWidth={3}
            pillarHeight={0.4}
            noiseIntensity={0.5}
            pillarRotation={25}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
            enableScrollAnimation={true}
          />
        </div>

        {/* Global Dark Overlay - Uniform across all sections */}
        <div className="fixed inset-0 z-[1] pointer-events-none bg-gray-950/60" />

        {/* Hero Section */}
        <HeroSection />

        {/* About Section */}
        <div className="relative z-10">
          <AboutSection />
        </div>

        {/* Storyboard Showcase - Cinematic 3D Section */}
        <div className="relative z-10">
          <StoryboardShowcase />
        </div>

        {/* Video Modes Section */}
        <div className="relative z-10">
          <VideoModes />
        </div>

        {/* Stories Lab Section */}
        <div className="relative z-10">
          <StoriesLab />
        </div>

        {/* Auto Production Section */}
        <div className="relative z-10">
          <AutoProduction />
        </div>

        {/* Blog Section */}
        <div className="relative z-10">
          <BlogSection />
        </div>

        {/* Pricing Section */}
        <div className="relative z-10">
          <PricingSection />
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 z-10">
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-white/80">
              Introducing Storia AI Video Platform
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              New
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 font-heading"
          >
            <span className="block font-heading">Create Videos</span>
            <span className="block mt-2 font-heading text-white">
              Like Magic
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Transform your ideas into stunning videos with AI. Generate scripts,
            create storyboards, and produce professional content in minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/sign-up">
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 group relative overflow-hidden"
              >
                {/* Shine Effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/25 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>

            <Button 
              size="lg" 
              variant="outline"
              className="h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 hover:border-white/30 group"
            >
              <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust Indicators - Logo Marquee */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 pt-16 border-t border-white/10"
          >
            <p className="text-sm text-white/40 mb-8">
              Powered by leading AI technologies
            </p>
            <div className="relative overflow-hidden">
              {/* Gradient overlays for smooth edges */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-950 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-950 to-transparent z-10" />
              
              {/* Scrolling container */}
              <motion.div
                className="flex items-center gap-12"
                animate={{ x: [0, -1200] }}
                transition={{
                  x: {
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
              >
                {/* First set of logos */}
                {[
                  { name: "Gemini", src: logoGemini },
                  { name: "Hailuo", src: logoHailuo },
                  { name: "Kling", src: logoKling },
                  { name: "Midjourney", src: logoMidjourney },
                  { name: "Nano", src: logoNano },
                  { name: "Qwen", src: logoQwen },
                  { name: "Seedance", src: logoSeedance },
                  { name: "Sora", src: logoSora2 },
                  { name: "Veo", src: logoVeo3 },
                ].map((logo, i) => (
                  <motion.div
                    key={`logo-1-${i}`}
                    className="flex-shrink-0 group"
                    whileHover={{ scale: 1.1 }}
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="h-8 md:h-10 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0"
                    />
                  </motion.div>
                ))}
                {/* Duplicate set for seamless loop */}
                {[
                  { name: "Gemini", src: logoGemini },
                  { name: "Hailuo", src: logoHailuo },
                  { name: "Kling", src: logoKling },
                  { name: "Midjourney", src: logoMidjourney },
                  { name: "Nano", src: logoNano },
                  { name: "Qwen", src: logoQwen },
                  { name: "Seedance", src: logoSeedance },
                  { name: "Sora", src: logoSora2 },
                  { name: "Veo", src: logoVeo3 },
                ].map((logo, i) => (
                  <motion.div
                    key={`logo-2-${i}`}
                    className="flex-shrink-0 group"
                    whileHover={{ scale: 1.1 }}
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="h-8 md:h-10 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 grayscale group-hover:grayscale-0"
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-0 sm:bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
