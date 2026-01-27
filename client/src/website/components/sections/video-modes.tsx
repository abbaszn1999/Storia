import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import BlurText from "../ui/blur-text";
import { AnimatedCounter } from "../common";
import { 
  Video, 
  User, 
  Sparkles, 
  ShoppingBag, 
  Shapes,
  Mic,
  ArrowRight,
  Zap
} from "lucide-react";
import {
  narrativeVideo,
  characterVlog,
  ambientVisual,
  socialCommerce,
  logoAnimation,
  videoPodcast
} from "@/website/assets/images";

// Video Generation Modes
const videoModes = [
  {
    id: "narrative",
    title: "Narrative Video",
    description: "Transform scripts into cinematic stories with AI-powered scene generation and professional transitions.",
    icon: Video,
    color: "#EC4899",
    video: narrativeVideo,
  },
  {
    id: "character",
    title: "Character Vlog",
    description: "Create engaging vlogs with AI characters. Perfect for brand mascots and virtual influencers.",
    icon: User,
    color: "#8B5CF6",
    video: characterVlog,
  },
  {
    id: "ambient",
    title: "Ambient Visual",
    description: "Generate mesmerizing abstract visuals driven by mood. Perfect for meditation and backgrounds.",
    icon: Sparkles,
    color: "#06B6D4",
    video: ambientVisual,
  },
  {
    id: "commerce",
    title: "Social Commerce",
    description: "Turn products into scroll-stopping promotional videos optimized for social platforms.",
    icon: ShoppingBag,
    color: "#F59E0B",
    video: socialCommerce,
  },
  {
    id: "logo",
    title: "Logo Animation",
    description: "Give your brand movement with stunning logo reveals and animated brand assets.",
    icon: Shapes,
    color: "#10B981",
    video: logoAnimation,
  },
  {
    id: "podcast",
    title: "Video Podcast",
    description: "Transform audio podcasts into engaging video content with AI-generated visuals.",
    icon: Mic,
    color: "#3B82F6",
    video: videoPodcast,
    comingSoon: true,
  },
];

export function VideoModes() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  // Responsive card dimensions
  const [cardDimensions, setCardDimensions] = useState({ width: 200, height: 480, expandedWidth: 420 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (window.innerWidth < 640) {
        setCardDimensions({ width: 140, height: 280, expandedWidth: 280 });
      } else if (window.innerWidth < 768) {
        setCardDimensions({ width: 160, height: 360, expandedWidth: 320 });
      } else {
        setCardDimensions({ width: 200, height: 480, expandedWidth: 420 });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <section ref={containerRef} className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 md:mb-20">
          <BlurText
            text="The Next Generation"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 font-heading"
          />
          <BlurText
            text="of Video Creation"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-heading"
          />
        </div>

        {/* Cards Container - Mobile: horizontal scroll, Desktop: flex */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex gap-3 sm:gap-4 lg:justify-center overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 lg:flex-nowrap"
        >
          {videoModes.map((mode, index) => {
            const isHovered = hoveredIndex === index;
            const Icon = mode.icon;
            
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
                onMouseEnter={() => !mode.comingSoon && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "relative overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-500 ease-out flex-shrink-0",
                  mode.comingSoon && "opacity-40 cursor-not-allowed"
                )}
                style={{
                  width: isHovered ? cardDimensions.expandedWidth : cardDimensions.width,
                  height: cardDimensions.height,
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={mode.video}
                    alt={mode.title}
                    className="w-full h-full object-cover transition-transform duration-700"
                    style={{
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                  
                  {/* Gradient Overlay - Black */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: isHovered 
                        ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.3) 100%)"
                        : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                    }}
                  />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-6">
                  {/* Title - Always Visible */}
                  <motion.div
                    animate={{
                      y: isHovered ? -120 : 0,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h3 className="text-sm sm:text-base md:text-xl font-bold text-white font-heading whitespace-nowrap">
                      {mode.title}
                    </h3>
                  </motion.div>

                  {/* Expanded Content - On Hover (Desktop only) */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      y: isHovered ? 0 : 30,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 hidden md:block"
                  >
                    <p className="text-white/90 text-sm leading-relaxed mb-6">
                      {mode.description}
                    </p>

                    <button
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white text-sm font-medium transition-all hover:bg-white hover:text-gray-900 group"
                    >
                      Try {mode.title.split(" ")[0]} Now
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                </div>

                {/* Coming Soon Badge */}
                {mode.comingSoon && (
                  <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <span className="text-[10px] sm:text-xs font-medium text-white/70">Coming Soon</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 sm:mt-14 md:mt-20 grid grid-cols-4 gap-4 sm:gap-8 md:flex md:flex-wrap md:justify-center md:gap-12 lg:gap-20"
        >
          {[
            { value: "6", label: "Creation Modes" },
            { value: "4K", label: "Max Resolution" },
            { value: "60fps", label: "Frame Rate" },
            { value: "∞", label: "Possibilities" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 font-heading">
                <AnimatedCounter value={stat.value} duration={2} />
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-white/50">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default VideoModes;
