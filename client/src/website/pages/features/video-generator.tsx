import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, useVelocity, AnimatePresence, useInView } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { 
  Film,
  Play,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Video,
  Rocket,
  Star,
  PlayCircle,
  FileText,
  Users,
  Split,
  Image,
  Music,
  Download,
  Mic,
  Camera,
  ShoppingBag,
  Palette,
  Wand2,
  Layers,
  Zap,
  Globe,
  Clock,
  Share2,
  CheckCircle2,
  Youtube,
  Instagram,
  Volume2,
  Eye,
  Smartphone,
  MonitorPlay,
  Clapperboard,
  MessageSquare,
  Heart,
  TrendingUp,
  Award
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import {
  narrativeVideo,
  characterVlog,
  ambientVisual,
  socialCommerce,
  logoAnimation,
  videoPodcast
} from "@/website/assets/images";

// The 6 Video Generation Modes
const videoModes = [
  {
    id: "narrative",
    name: "Narrative Video",
    tagline: "Cinematic Storytelling",
    description: "Transform your ideas into compelling cinematic stories with AI-powered script generation, stunning visuals, and professional production.",
    longDescription: "Perfect for short films, brand stories, educational content, and any narrative-driven video. Our AI handles everything from script to screen.",
    icon: Film,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    image: narrativeVideo,
    videoUrl: "#",
    steps: [
      { name: "Script", icon: FileText, description: "AI generates compelling scripts from your ideas" },
      { name: "World & Cast", icon: Users, description: "Build characters and visual world" },
      { name: "Breakdown", icon: Split, description: "Auto scene and shot segmentation" },
      { name: "Storyboard", icon: Image, description: "Generate stunning visuals" },
      { name: "Audio", icon: Music, description: "Voice-over, music & sound effects" },
      { name: "Animatic", icon: Play, description: "Preview your complete video" },
      { name: "Export", icon: Download, description: "4K export & social publish" }
    ],
    features: [
      "7-step intelligent workflow",
      "15+ AI image models",
      "50+ voice options",
      "Multiple genres & tones",
      "4K video export",
      "Direct social publishing"
    ],
    stats: { steps: 7, models: "15+", voices: "50+" },
    useCases: ["Short Films", "Brand Stories", "Educational", "Documentaries"]
  },
  {
    id: "vlog",
    name: "Character Vlog",
    tagline: "AI-Powered Personal Content",
    description: "Create engaging vlog-style content with AI characters that speak, move, and connect with your audience authentically.",
    longDescription: "Perfect for content creators, influencers, and brands who want consistent character-driven content without being on camera.",
    icon: Camera,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
    image: characterVlog,
    videoUrl: "#",
    steps: [
      { name: "Script", icon: FileText, description: "Write or generate vlog script" },
      { name: "Character", icon: Users, description: "Choose or create AI character" },
      { name: "Scene Setup", icon: Split, description: "Configure backgrounds & settings" },
      { name: "Storyboard", icon: Image, description: "Generate character visuals" },
      { name: "Voice & Audio", icon: Music, description: "AI voice with emotion" },
      { name: "Preview", icon: Play, description: "Review your vlog" },
      { name: "Publish", icon: Download, description: "Export & share" }
    ],
    features: [
      "Consistent AI characters",
      "First/Third person narration",
      "Emotional voice acting",
      "Multiple character poses",
      "Background customization",
      "Lip-sync animation"
    ],
    stats: { steps: 7, models: "10+", voices: "50+" },
    useCases: ["YouTube", "TikTok", "Instagram", "Personal Branding"]
  },
  {
    id: "ambient",
    name: "Ambient Visual",
    tagline: "Mesmerizing Visual Experiences",
    description: "Create stunning ambient videos perfect for relaxation, meditation, backgrounds, and atmospheric content with beautiful transitions.",
    longDescription: "Ideal for meditation apps, background visuals, music videos, and any content requiring beautiful, flowing imagery.",
    icon: Palette,
    color: "#06B6D4",
    gradient: "from-cyan-500 to-teal-600",
    image: ambientVisual,
    videoUrl: "#",
    steps: [
      { name: "Atmosphere", icon: Palette, description: "Define mood and style" },
      { name: "Visual World", icon: Image, description: "Create visual elements" },
      { name: "Flow Design", icon: Zap, description: "Design transitions" },
      { name: "Composition", icon: Layers, description: "Arrange visual flow" },
      { name: "Soundscape", icon: Music, description: "Add ambient audio" },
      { name: "Preview", icon: Eye, description: "Preview experience" },
      { name: "Export", icon: Download, description: "High-quality export" }
    ],
    features: [
      "Image transitions mode",
      "Video animation mode",
      "Seamless flow design",
      "Custom soundscapes",
      "Loop-ready exports",
      "4K quality"
    ],
    stats: { steps: 7, modes: "2", duration: "∞" },
    useCases: ["Meditation", "Music Videos", "Backgrounds", "Art Installation"]
  },
  {
    id: "commerce",
    name: "Social Commerce",
    tagline: "Product Videos That Sell",
    description: "Create scroll-stopping product videos optimized for social media ads and e-commerce with AI-powered creative generation.",
    longDescription: "Designed for e-commerce brands, marketers, and sellers who need high-converting product videos at scale.",
    icon: ShoppingBag,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    image: socialCommerce,
    videoUrl: "#",
    steps: [
      { name: "Setup", icon: Camera, description: "Upload product photos" },
      { name: "Script", icon: FileText, description: "AI generates ad copy" },
      { name: "Storyboard", icon: Image, description: "Create visual scenes" },
      { name: "Voiceover", icon: Mic, description: "Add compelling narration" },
      { name: "Animatic", icon: Play, description: "Preview ad video" },
      { name: "Export", icon: Download, description: "Export for ads" }
    ],
    features: [
      "Product photo to video",
      "AI ad copy generation",
      "Multiple ad formats",
      "Beat-based timing",
      "CTA optimization",
      "A/B test variants"
    ],
    stats: { steps: 6, formats: "5+", duration: "12-36s" },
    useCases: ["Facebook Ads", "Instagram Reels", "TikTok Ads", "Product Launches"]
  },
  {
    id: "logo",
    name: "Logo Animation",
    tagline: "Bring Your Brand to Life",
    description: "Transform static logos into stunning animated intros with one click. Professional motion graphics in seconds.",
    longDescription: "Perfect for video intros, brand reveals, presentations, and anywhere you need your logo to make an impact.",
    icon: Sparkles,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    image: logoAnimation,
    videoUrl: "#",
    steps: [
      { name: "Upload & Generate", icon: Wand2, description: "Upload logo, AI creates animation" }
    ],
    features: [
      "One-click generation",
      "Multiple animation styles",
      "Transparent background",
      "Custom duration",
      "All aspect ratios",
      "Instant preview"
    ],
    stats: { steps: 1, styles: "10+", speed: "Instant" },
    useCases: ["Video Intros", "Brand Reveals", "Presentations", "Social Media"]
  },
  {
    id: "podcast",
    name: "Video Podcast",
    tagline: "Audio to Visual Content",
    description: "Transform your podcast audio into engaging video content with AI-generated visuals, captions, and dynamic animations.",
    longDescription: "Perfect for podcasters who want to expand to YouTube and social platforms without additional recording.",
    icon: Mic,
    color: "#6366F1",
    gradient: "from-indigo-500 to-blue-600",
    image: videoPodcast,
    videoUrl: "#",
    steps: [
      { name: "Upload Audio", icon: Volume2, description: "Import podcast episode" },
      { name: "Visual Style", icon: Palette, description: "Choose visual theme" },
      { name: "Generate", icon: Wand2, description: "AI creates visuals" },
      { name: "Captions", icon: MessageSquare, description: "Auto-generated subtitles" },
      { name: "Preview", icon: Play, description: "Review video podcast" },
      { name: "Export", icon: Download, description: "Publish everywhere" }
    ],
    features: [
      "Audio to video conversion",
      "Auto-generated captions",
      "Speaker visualization",
      "Waveform animations",
      "Topic-based visuals",
      "Multi-platform export"
    ],
    stats: { steps: 6, captions: "Auto", platforms: "All" },
    useCases: ["YouTube Podcasts", "Audiograms", "Clips", "Highlights"],
    comingSoon: true
  }
];

// Mode Section Component
function ModeSection({ mode, index, isReversed }: { 
  mode: typeof videoModes[0]; 
  index: number;
  isReversed: boolean;
}) {
  const Icon = mode.icon;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section 
      ref={sectionRef}
      className="py-12 sm:py-16 md:py-24 relative"
      id={mode.id}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 sm:gap-10 lg:gap-16 items-center`}>
          {/* Video/Image Side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            <div className="relative group cursor-pointer" onClick={() => setIsVideoPlaying(true)}>
              {/* Main Image/Video Container */}
              <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden">
                <img 
                  src={mode.image}
                  alt={mode.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Coming Soon Badge */}
                {mode.comingSoon && (
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-4 py-1 sm:py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs sm:text-sm font-medium text-white">
                    Coming Soon
                  </div>
                )}
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                    style={{ 
                      backgroundColor: `${mode.color}30`,
                      borderColor: mode.color,
                      boxShadow: `0 0 40px ${mode.color}40`
                    }}
                  >
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white ml-1" />
                  </motion.div>
                </div>

                {/* Mode Badge */}
                <div 
                  className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-xl border flex items-center gap-1.5 sm:gap-2"
                  style={{ 
                    backgroundColor: `${mode.color}20`,
                    borderColor: `${mode.color}40`
                  }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: mode.color }} />
                  <span className="text-white font-medium text-xs sm:text-sm md:text-base">{mode.name}</span>
                </div>
              </div>

              {/* Glowing Border */}
              <div 
                className="absolute -inset-1 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"
                style={{ backgroundColor: `${mode.color}30` }}
              />
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full lg:w-1/2"
          >
            {/* Mode Badge */}
            <div 
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border mb-4 sm:mb-6"
              style={{ 
                backgroundColor: `${mode.color}15`,
                borderColor: `${mode.color}30`
              }}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: mode.color }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: mode.color }}>{mode.tagline}</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              {mode.name}
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-white/60 mb-4 sm:mb-6 leading-relaxed">
              {mode.description}
            </p>
            <p className="text-white/40 mb-6 sm:mb-8 text-sm sm:text-base">
              {mode.longDescription}
            </p>

            {/* Stats */}
            <div className="flex gap-5 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {Object.entries(mode.stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
                  <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">{key}</div>
                </div>
              ))}
            </div>

            {/* Steps Preview */}
            <div className="mb-6 sm:mb-8">
              <h4 className="text-xs sm:text-sm font-medium text-white/70 mb-3 sm:mb-4 uppercase tracking-wider">Workflow Steps</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {mode.steps.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg bg-white/5 border border-white/10"
                    >
                      <div 
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${mode.color}30` }}
                      >
                        <StepIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: mode.color }} />
                      </div>
                      <span className="text-xs sm:text-sm text-white/70">{step.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Use Cases */}
            <div className="mb-6 sm:mb-8">
              <h4 className="text-xs sm:text-sm font-medium text-white/70 mb-2 sm:mb-3 uppercase tracking-wider">Perfect For</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {mode.useCases.map((useCase, i) => (
                  <span 
                    key={i}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm bg-white/5 text-white/60 border border-white/10"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r ${mode.gradient} shadow-lg text-sm sm:text-base w-full sm:w-auto`}
              style={{ boxShadow: `0 10px 40px ${mode.color}30` }}
              disabled={mode.comingSoon}
            >
              {mode.comingSoon ? 'Coming Soon' : 'Try ' + mode.name}
              {!mode.comingSoon && <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
        >
          {mode.features.map((feature, i) => (
            <div
              key={i}
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/10 text-center hover:bg-white/[0.06] transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2" style={{ color: mode.color }} />
              <span className="text-xs sm:text-sm text-white/60 line-clamp-2">{feature}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
      <motion.span
        key={count}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }}
      >
        {count}{suffix}
      </motion.span>
    </div>
  );
}

// Cinematic Video Player Component
function CinematicVideoPlayer({ modes, activeMode, onModeChange }: {
  modes: typeof videoModes;
  activeMode: number;
  onModeChange: (index: number) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentMode = modes[activeMode];
  const Icon = currentMode.icon;

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Main Video Container - Cinema Style */}
      <motion.div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Decorative Frame - Top - Hidden on mobile */}
        <div className="hidden sm:block absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 rounded-t-xl bg-gradient-to-b from-white/10 to-transparent backdrop-blur-xl border border-white/10 border-b-0 z-20" />
        
        {/* Glowing Border Effect */}
        <motion.div
          className="absolute -inset-1 rounded-2xl sm:rounded-3xl opacity-60 blur-xl -z-10"
          style={{ background: `linear-gradient(135deg, ${currentMode.color}40, transparent, ${currentMode.color}20)` }}
          animate={{
            background: [
              `linear-gradient(135deg, ${currentMode.color}40, transparent, ${currentMode.color}20)`,
              `linear-gradient(225deg, ${currentMode.color}40, transparent, ${currentMode.color}20)`,
              `linear-gradient(315deg, ${currentMode.color}40, transparent, ${currentMode.color}20)`,
              `linear-gradient(135deg, ${currentMode.color}40, transparent, ${currentMode.color}20)`
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Video Frame */}
        <div 
          className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2"
          style={{ borderColor: `${currentMode.color}30` }}
        >
          {/* Video/Image Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={currentMode.image}
                alt={currentMode.name}
                className="w-full h-full object-cover"
              />
              
              {/* Cinematic Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              
              {/* Scanlines Effect */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className="relative group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Outer Ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                  border: `2px sm:3px solid ${currentMode.color}`,
                  boxShadow: `0 0 30px ${currentMode.color}50`
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Play Button */}
              <div 
                className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center backdrop-blur-xl border-2 transition-all duration-300"
                style={{
                  backgroundColor: `${currentMode.color}30`,
                  borderColor: currentMode.color
                }}
              >
                <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white ml-1" />
              </div>
            </motion.button>
          </div>

          {/* Top Bar - Mode Info */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 z-10">
            <div className="flex items-center justify-between">
              {/* Mode Badge */}
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-xl border"
                style={{
                  backgroundColor: `${currentMode.color}20`,
                  borderColor: `${currentMode.color}40`
                }}
              >
                <div 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: currentMode.color }}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">{currentMode.name}</div>
                  <div className="text-[10px] sm:text-xs text-white/60 hidden sm:block">{currentMode.tagline}</div>
                </div>
              </motion.div>

              {/* Coming Soon Badge */}
              {currentMode.comingSoon && (
                <div className="px-2 sm:px-4 py-1 sm:py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs sm:text-sm text-white">
                  Coming Soon
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar - Stats & CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              {/* Left - Description */}
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md"
              >
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                  {currentMode.description}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {currentMode.useCases.slice(0, 3).map((useCase, i) => (
                    <span 
                      key={i}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs backdrop-blur-xl border"
                      style={{
                        backgroundColor: `${currentMode.color}20`,
                        borderColor: `${currentMode.color}30`,
                        color: currentMode.color
                      }}
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Right - Stats - Hidden on mobile */}
              <motion.div
                key={`stats-${activeMode}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex gap-6"
              >
                {Object.entries(currentMode.stats).map(([key, value], i) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-white/50 uppercase">{key}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Side Decorations - Hidden on mobile */}
          <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 left-4 w-1 h-20 rounded-full" style={{ backgroundColor: `${currentMode.color}60` }} />
          <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 right-4 w-1 h-20 rounded-full" style={{ backgroundColor: `${currentMode.color}60` }} />
        </div>

        {/* Decorative Frame - Bottom - Hidden on mobile */}
        <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-4 rounded-b-xl bg-gradient-to-t from-white/5 to-transparent backdrop-blur-xl border border-white/10 border-t-0" />
      </motion.div>

      {/* Mode Selector Pills - Desktop */}
      <div className="hidden md:flex justify-center gap-3 mt-8">
        {modes.map((mode, index) => {
          const ModeIcon = mode.icon;
          const isActive = activeMode === index;
          
          return (
            <motion.button
              key={mode.id}
              onClick={() => onModeChange(index)}
              className={`relative px-5 py-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                isActive ? 'border-transparent' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
              style={{
                backgroundColor: isActive ? `${mode.color}20` : undefined,
                borderColor: isActive ? `${mode.color}50` : undefined
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Glow Effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{ backgroundColor: mode.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                />
              )}
              
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isActive ? '' : 'bg-white/10'
                }`}
                style={{
                  backgroundColor: isActive ? mode.color : undefined
                }}
              >
                <ModeIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/60'}`} />
              </div>
              
              <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-white/60'}`}>
                {mode.name}
              </span>

              {mode.comingSoon && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/50">
                  Soon
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeModeIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                  style={{ backgroundColor: mode.color }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mode Selector Pills - Mobile (Horizontal Scroll) */}
      <div className="md:hidden mt-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-2 pb-2 min-w-max">
          {modes.map((mode, index) => {
            const ModeIcon = mode.icon;
            const isActive = activeMode === index;
            
            return (
              <motion.button
                key={mode.id}
                onClick={() => onModeChange(index)}
                className={`relative px-3 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                  isActive ? 'border-transparent' : 'border-white/10 bg-white/[0.03]'
                }`}
                style={{
                  backgroundColor: isActive ? `${mode.color}20` : undefined,
                  borderColor: isActive ? `${mode.color}50` : undefined
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${
                    isActive ? '' : 'bg-white/10'
                  }`}
                  style={{
                    backgroundColor: isActive ? mode.color : undefined
                  }}
                >
                  <ModeIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white/60'}`} />
                </div>
                
                <span className={`text-xs font-medium transition-colors whitespace-nowrap ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {mode.name}
                </span>

                {mode.comingSoon && (
                  <span className="px-1 py-0.5 rounded text-[8px] bg-white/10 text-white/50">
                    Soon
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-4 sm:mt-6">
        {modes.map((mode, i) => (
          <motion.button
            key={i}
            onClick={() => onModeChange(i)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: activeMode === i ? mode.color : 'rgba(255,255,255,0.2)',
              boxShadow: activeMode === i ? `0 0 10px ${mode.color}` : undefined
            }}
            whileHover={{ scale: 1.5 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function VideoGeneratorPage() {
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState(0);

  const { scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollYProgress);

  // Update LightPillar on scroll
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(latest);
    }
  });

  // Scroll to mode section
  const scrollToMode = (modeId: string) => {
    const element = document.getElementById(modeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* LightPillar Background */}
      <div className="fixed inset-0 z-0">
        <LightPillar ref={lightPillarRef} />
      </div>

      {/* Dark Overlay */}
      <div className="fixed inset-0 z-[1] bg-gray-950/60 pointer-events-none" />

      {/* Header */}
      <div className="relative z-50">
        <Header />
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 mb-6 sm:mb-8"
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span className="text-xs sm:text-sm text-violet-300">AI Video Generation Platform</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
              </motion.div>

              {/* Main Title */}
              <BlurText
                text="6 Ways to Create Amazing Videos"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 text-white px-2"
                delay={80}
                animateBy="words"
              />

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-base sm:text-lg md:text-xl text-white/60 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2"
              >
                From cinematic narratives to product ads, from vlogs to ambient visuals. 
                Choose your mode and let AI bring your vision to life.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:flex sm:justify-center gap-4 sm:gap-8 md:gap-12 mb-10 sm:mb-12 md:mb-16 px-4 sm:px-0"
              >
                {[
                  { value: 6, label: "Creation Modes", suffix: "" },
                  { value: 15, label: "AI Models", suffix: "+" },
                  { value: 4, label: "Max Resolution", suffix: "K" },
                  { value: 50, label: "Voice Options", suffix: "+" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <div className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Cinematic Video Player */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <CinematicVideoPlayer
                  modes={videoModes}
                  activeMode={activeMode}
                  onModeChange={(index) => {
                    setActiveMode(index);
                    scrollToMode(videoModes[index].id);
                  }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODE SECTIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative">
          {/* Divider */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {videoModes.map((mode, index) => (
            <ModeSection 
              key={mode.id} 
              mode={mode} 
              index={index}
              isReversed={index % 2 === 1}
            />
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COMPARISON SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6"
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-white/70">Choose Your Perfect Mode</span>
              </motion.div>

              <BlurText
                text="Which Mode is Right for You?"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white"
                delay={100}
                animateBy="words"
              />

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2"
              >
                Each mode is optimized for specific content types and workflows
              </motion.p>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {videoModes.map((mode, i) => {
                const Icon = mode.icon;
                return (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 group"
                  >
                    {mode.comingSoon && (
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-white/10 text-white/60">
                        Coming Soon
                      </div>
                    )}
                    
                    <div 
                      className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br ${mode.gradient} mb-3 sm:mb-4`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1.5 sm:mb-2">{mode.name}</h3>
                    <p className="text-xs sm:text-sm text-white/50 mb-3 sm:mb-4">{mode.tagline}</p>
                    
                    <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                      {mode.useCases.slice(0, 3).map((useCase, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: mode.color }} />
                          {useCase}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => scrollToMode(mode.id)}
                      className="w-full py-2.5 sm:py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Learn More
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM CTA */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-6 sm:p-8 md:p-12 lg:p-16 rounded-2xl sm:rounded-3xl overflow-hidden text-center"
              style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
            >
              {/* Background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-violet-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-pink-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8 shadow-2xl shadow-violet-500/30"
                >
                  <Rocket className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2">
                  Start Creating Today
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
                  Choose your mode and create your first AI-powered video in minutes. No experience required.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-violet-500 to-pink-600 rounded-xl font-semibold text-base sm:text-lg text-white shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-base sm:text-lg text-white flex items-center justify-center gap-2 sm:gap-3"
                  >
                    View Pricing
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
