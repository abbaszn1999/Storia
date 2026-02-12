import { useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import { BlogSection } from "@/website/components/sections";
import BlurText from "@/website/components/ui/blur-text";
import { BookOpen } from "lucide-react";

export default function BlogPage() {
  const lightPillarRef = useRef<LightPillarRef>(null);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(progress);
    }
  });

  return (
    <div className="website min-h-screen bg-gray-950 text-white">
      <Header />

      <main className="relative">
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
        <div className="fixed inset-0 z-[1] pointer-events-none bg-gray-950/60" />

        {/* Hero */}
        <section className="relative min-h-[40vh] flex items-center justify-center pt-24 pb-16 z-10">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/70">Blog</span>
            </motion.div>
            <BlurText
              text="Learn & Get Inspired"
              delay={100}
              animateBy="words"
              direction="top"
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-heading"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 text-white/50 max-w-xl mx-auto"
            >
              Tutorials, tips, and insights to help you create amazing content
            </motion.p>
          </div>
        </section>

        <div className="relative z-10">
          <BlogSection />
        </div>

        <div className="relative z-10">
          <Footer />
        </div>
      </main>
    </div>
  );
}
