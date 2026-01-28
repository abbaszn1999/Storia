import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, useVelocity, AnimatePresence, useInView } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { 
  FileText, 
  Users, 
  Split, 
  Image, 
  Music, 
  Play, 
  Download,
  ArrowRight,
  Sparkles,
  Wand2,
  Film,
  Palette,
  Globe,
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Volume2,
  Mic,
  AudioLines,
  Video,
  Layers,
  Share2,
  Youtube,
  Instagram,
  Star,
  Quote,
  Lightbulb,
  Target,
  Rocket,
  Award,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";
import {
  homeStep1,
  homeStep2,
  homeStep3,
  homeStep4,
  logoNano,
  logoMidjourney,
  logoSora2,
  logoSeedance,
  logoGemini,
  logoKling,
  logoVeo3,
  logoHailuo,
  logoQwen
} from "@/website/assets/images";

// The 7 Steps of Narrative Mode
const narrativeSteps = [
  {
    id: 1,
    name: "Script",
    shortName: "Script",
    icon: FileText,
    color: "#06B6D4",
    gradient: "from-cyan-500 to-cyan-600",
    description: "Transform your idea into a compelling script",
    details: [
      "AI-powered script generation from your idea",
      "Multiple genres: Adventure, Fantasy, Sci-Fi, Drama",
      "Customizable tone and duration",
      "Support for 10+ languages"
    ],
    features: ["Duration: 30s to 20min+", "Smart scene structure", "Character dialogue", "Narration styles"]
  },
  {
    id: 2,
    name: "World & Cast",
    shortName: "World",
    icon: Users,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
    description: "Build your visual world and characters",
    details: [
      "10+ art styles: Cinematic, Pixar, Anime, Ghibli",
      "Create detailed character profiles",
      "Design unique locations",
      "Upload reference images for consistency"
    ],
    features: ["Character references", "Location library", "Style presets", "Visual consistency"]
  },
  {
    id: 3,
    name: "Scene Breakdown",
    shortName: "Breakdown",
    icon: Split,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    description: "AI intelligently divides your script into scenes",
    details: [
      "Automatic scene & shot detection",
      "Camera movement suggestions",
      "Shot type recommendations",
      "Continuity group linking"
    ],
    features: ["Auto-segmentation", "Shot types", "Transitions", "Timing control"]
  },
  {
    id: 4,
    name: "Storyboard",
    shortName: "Storyboard",
    icon: Image,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    description: "Generate stunning visuals for every shot",
    details: [
      "AI image generation with top models",
      "FLUX, Midjourney, DALL-E, Ideogram",
      "Start/End frame for smooth transitions",
      "Edit and regenerate any shot"
    ],
    features: ["15+ image models", "Prompt editing", "Reference matching", "Batch generation"]
  },
  {
    id: 5,
    name: "Audio Production",
    shortName: "Audio",
    icon: Music,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    description: "Bring your story to life with sound",
    details: [
      "AI voice-over with 50+ voices",
      "Multiple languages and accents",
      "Background music generation",
      "Sound effects library"
    ],
    features: ["Voice cloning", "Music styles", "SFX library", "Audio mixing"]
  },
  {
    id: 6,
    name: "Animatic Preview",
    shortName: "Animatic",
    icon: Play,
    color: "#6366F1",
    gradient: "from-indigo-500 to-blue-600",
    description: "Preview your complete video before rendering",
    details: [
      "Real-time video preview",
      "Subtitle customization",
      "Music and SFX mixing",
      "Scene timeline navigation"
    ],
    features: ["Live preview", "Subtitle styles", "Volume control", "Scene timeline"]
  },
  {
    id: 7,
    name: "Export & Publish",
    shortName: "Export",
    icon: Download,
    color: "#EF4444",
    gradient: "from-red-500 to-rose-600",
    description: "Export in any format and publish everywhere",
    details: [
      "Export up to 4K resolution",
      "MP4, MOV, WebM formats",
      "Direct publish to social media",
      "Schedule posts for later"
    ],
    features: ["4K quality", "Multi-platform", "Auto-scheduling", "SEO metadata"]
  }
];

// AI Models showcase with actual logos
const aiModels = {
  image: [
    { name: "FLUX.2 Max", logo: logoNano, description: "Professional-grade visual intelligence" },
    { name: "Midjourney V7", logo: logoMidjourney, description: "Cinematic and artistic" },
    { name: "GPT Image", logo: logoSora2, description: "High-fidelity generation" },
    { name: "Ideogram 3.0", logo: logoSeedance, description: "Best text rendering" },
    { name: "Seedream 4.5", logo: logoSeedance, description: "Ultra-fast 4K rendering" },
    { name: "Google Imagen 4", logo: logoGemini, description: "Advanced prompts" }
  ],
  video: [
    { name: "Kling AI", logo: logoKling, description: "Cinematic video generation" },
    { name: "Runway Gen-4", logo: logoSora2, description: "Professional video creation" },
    { name: "Veo 3", logo: logoVeo3, description: "Google's latest video AI" },
    { name: "Hailuo AI", logo: logoHailuo, description: "Dreamlike video effects" },
    { name: "Qwen Video", logo: logoQwen, description: "Fast video synthesis" },
    { name: "Sora 2", logo: logoSora2, description: "OpenAI's video model" }
  ],
  voice: [
    { name: "ElevenLabs", logo: logoNano, description: "Ultra-realistic voices" },
    { name: "OpenAI TTS", logo: logoSora2, description: "Natural speech" },
    { name: "Gemini Voice", logo: logoGemini, description: "Multi-language support" },
    { name: "Custom Clone", logo: logoQwen, description: "Clone any voice" }
  ]
};

// Video showcase data
const showcaseVideos = [
  {
    id: 1,
    title: "The Lost Kingdom",
    genre: "Fantasy Adventure",
    duration: "3:24",
    thumbnail: homeStep1,
    videoUrl: "#",
    stats: { views: "12.4K", likes: "2.1K" }
  },
  {
    id: 2,
    title: "Neon Dreams",
    genre: "Sci-Fi",
    duration: "2:45",
    thumbnail: homeStep2,
    videoUrl: "#",
    stats: { views: "8.7K", likes: "1.5K" }
  },
  {
    id: 3,
    title: "The Last Journey",
    genre: "Drama",
    duration: "4:12",
    thumbnail: homeStep3,
    videoUrl: "#",
    stats: { views: "15.2K", likes: "3.2K" }
  },
  {
    id: 4,
    title: "Cosmic Voyage",
    genre: "Documentary",
    duration: "5:30",
    thumbnail: homeStep4,
    videoUrl: "#",
    stats: { views: "21.8K", likes: "4.5K" }
  }
];

// Features highlights
const features = [
  {
    icon: Wand2,
    title: "AI-Powered Creation",
    description: "Advanced AI transforms your ideas into professional videos with minimal effort"
  },
  {
    icon: Palette,
    title: "10+ Art Styles",
    description: "From cinematic realism to anime, Pixar-style 3D, and everything in between"
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Create content in 10+ languages with native-sounding AI voices"
  },
  {
    icon: Clock,
    title: "Fast Rendering",
    description: "Priority rendering queue for professional users with instant preview"
  },
  {
    icon: Layers,
    title: "Version Control",
    description: "Save multiple versions of each shot and compare results"
  },
  {
    icon: Share2,
    title: "Direct Publishing",
    description: "Publish directly to YouTube, TikTok, Instagram, and Facebook"
  }
];

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
    <div ref={ref} className="text-2xl sm:text-3xl font-bold text-white">
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

// Step Card Component for the 7-step journey - Equal Height
function StepCard({ step, index, isActive, onClick }: { 
  step: typeof narrativeSteps[0]; 
  index: number; 
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;
  
  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer group h-full"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Card - Fixed Height */}
      <div
        className={`relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border transition-all duration-500 h-full flex flex-col ${
          isActive 
            ? 'bg-white/10 border-white/20 shadow-2xl' 
            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
        }`}
        style={{
          boxShadow: isActive ? `0 0 60px ${step.color}30, 0 0 100px ${step.color}15` : undefined,
          minHeight: '220px'
        }}
      >
        {/* Step Number Badge */}
        <div 
          className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white"
          style={{ backgroundColor: step.color }}
        >
          {step.id}
        </div>

        {/* Icon */}
        <div 
          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 bg-gradient-to-br ${step.gradient}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1.5 sm:mb-2">{step.name}</h3>
        <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4 flex-grow line-clamp-3">{step.description}</p>

        {/* Features Pills */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto">
          {step.features.slice(0, 2).map((feature, i) => (
            <span 
              key={i}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/50 border border-white/10"
            >
              {feature}
            </span>
          ))}
          <span className="hidden md:inline-block px-2 py-1 rounded-full text-xs bg-white/5 text-white/50 border border-white/10">
            {step.features[2]}
          </span>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <motion.div
            layoutId="activeStepIndicator"
            className="absolute inset-0 rounded-xl sm:rounded-2xl border-2"
            style={{ borderColor: step.color }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Video Player Modal Component
function VideoModal({ video, onClose }: { video: typeof showcaseVideos[0] | null; onClose: () => void }) {
  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Video placeholder - replace with actual video player */}
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={video.thumbnail} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center cursor-pointer border border-white/30"
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </motion.div>
            </div>
          </div>

          {/* Video Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
            <h3 className="text-2xl font-bold text-white mb-1">{video.title}</h3>
            <div className="flex items-center gap-4 text-white/60">
              <span>{video.genre}</span>
              <span>•</span>
              <span>{video.duration}</span>
              <span>•</span>
              <span>{video.stats.views} views</span>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function StoryboardPage() {
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<typeof showcaseVideos[0] | null>(null);
  const [activeModelTab, setActiveModelTab] = useState<'image' | 'video' | 'voice'>('image');

  const { scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollYProgress);

  // Update LightPillar on scroll
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(latest);
      lightPillarRef.current.setScrollVelocity(scrollVelocity.get());
    }
  });

  // Auto-rotate active step
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % narrativeSteps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <section className="relative pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24 overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6 sm:mb-8"
              >
                <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                <span className="text-xs sm:text-sm text-pink-300">Narrative Video Mode</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              </motion.div>

              {/* Main Title */}
              <BlurText
                text="Transform Ideas into Cinematic Stories"
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
                From a simple idea to a fully produced video in 7 intelligent steps. 
                AI-powered script writing, stunning visuals, professional audio, and seamless publishing.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2"
                >
                  Start Creating
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Watch Demo
                </motion.button>
              </motion.div>

              {/* Stats Row with Animated Numbers */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-2 sm:flex sm:justify-center gap-6 sm:gap-8 md:gap-12 mt-10 sm:mt-12 md:mt-16 px-4 sm:px-0"
              >
                {[
                  { value: 7, label: "Smart Steps", suffix: "" },
                  { value: 15, label: "AI Models", suffix: "+" },
                  { value: 50, label: "Voice Options", suffix: "+" },
                  { value: 4, label: "Max Quality", suffix: "K" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <div className="text-xs sm:text-sm text-white/50">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 7-STEP JOURNEY SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6"
              >
                <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-xs sm:text-sm text-white/70">The Creative Journey</span>
              </motion.div>

              <BlurText
                text="7 Steps to Video Magic"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                delay={100}
                animateBy="words"
              />

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2"
              >
                Each step is carefully designed to guide you from initial concept to polished production
              </motion.p>
            </div>

            {/* Timeline Progress - Desktop Only */}
            <div className="relative mb-8 sm:mb-12 hidden md:block">
              {/* Background Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 max-w-5xl mx-auto" style={{ left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 80px)' }} />
              
              {/* Animated Progress Line */}
              <motion.div 
                className="absolute top-5 h-0.5 max-w-5xl mx-auto"
                style={{ 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(to right, ${narrativeSteps.slice(0, activeStep + 1).map(s => s.color).join(', ')})`,
                  width: `calc((100% - 80px) * ${activeStep / (narrativeSteps.length - 1)})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `calc((100% - 80px) * ${activeStep / (narrativeSteps.length - 1)})` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
              
              <div className="flex justify-between items-center max-w-5xl mx-auto px-10">
                {narrativeSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isCurrentActive = i === activeStep;
                  const isPast = i < activeStep;
                  
                  return (
                    <div key={step.id} className="relative flex flex-col items-center z-10">
                      {/* Step Circle */}
                      <motion.button
                        onClick={() => setActiveStep(i)}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          isCurrentActive 
                            ? 'border-transparent' 
                            : isPast 
                              ? 'border-transparent' 
                              : 'border-white/20 bg-gray-900'
                        }`}
                        style={{ 
                          backgroundColor: isCurrentActive || isPast ? step.color : undefined,
                          boxShadow: isCurrentActive ? `0 0 30px ${step.color}60, 0 0 60px ${step.color}30` : undefined
                        }}
                        animate={{
                          scale: isCurrentActive ? 1.3 : 1,
                        }}
                        whileHover={{ scale: isCurrentActive ? 1.35 : 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className={`w-5 h-5 ${isCurrentActive || isPast ? 'text-white' : 'text-white/40'}`} />
                        
                        {/* Pulse Animation for Active */}
                        {isCurrentActive && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{ backgroundColor: step.color }}
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                      </motion.button>

                      {/* Step Label */}
                      <motion.span 
                        className={`mt-3 text-xs font-medium transition-all duration-300`}
                        animate={{
                          color: isCurrentActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                          fontWeight: isCurrentActive ? 600 : 400
                        }}
                      >
                        {step.shortName}
                      </motion.span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Timeline - Horizontal Scroll */}
            <div className="md:hidden mb-8 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-2 pb-4 min-w-max">
                {narrativeSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isCurrentActive = i === activeStep;
                  const isPast = i < activeStep;
                  
                  return (
                    <motion.button
                      key={step.id}
                      onClick={() => setActiveStep(i)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                        isCurrentActive 
                          ? 'border-transparent' 
                          : 'border-white/10 bg-white/5'
                      }`}
                      style={{ 
                        backgroundColor: isCurrentActive ? step.color : undefined,
                        boxShadow: isCurrentActive ? `0 0 20px ${step.color}40` : undefined
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`w-4 h-4 ${isCurrentActive || isPast ? 'text-white' : 'text-white/50'}`} />
                      <span className={`text-xs font-medium ${isCurrentActive ? 'text-white' : 'text-white/50'}`}>
                        {step.shortName}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Detail Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                <div 
                  className="relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden"
                  style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
                >
                  {/* Background Gradient */}
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{ 
                      background: `radial-gradient(ellipse at top left, ${narrativeSteps[activeStep].color}40, transparent 60%)` 
                    }}
                  />

                  <div className="relative flex flex-col md:flex-row gap-5 sm:gap-6 md:gap-8">
                    {/* Left - Icon & Title */}
                    <div className="flex-shrink-0 flex items-start gap-4 md:block">
                      <div 
                        className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br ${narrativeSteps[activeStep].gradient} shadow-2xl`}
                        style={{ boxShadow: `0 0 40px ${narrativeSteps[activeStep].color}40` }}
                      >
                        {(() => {
                          const Icon = narrativeSteps[activeStep].icon;
                          return <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />;
                        })()}
                      </div>
                      {/* Mobile Title */}
                      <div className="md:hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white"
                            style={{ backgroundColor: narrativeSteps[activeStep].color }}
                          >
                            Step {narrativeSteps[activeStep].id}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">{narrativeSteps[activeStep].name}</h3>
                      </div>
                    </div>

                    {/* Right - Content */}
                    <div className="flex-1">
                      {/* Desktop Title */}
                      <div className="hidden md:flex items-center gap-3 mb-3">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: narrativeSteps[activeStep].color }}
                        >
                          Step {narrativeSteps[activeStep].id}
                        </span>
                        <h3 className="text-2xl font-bold text-white">{narrativeSteps[activeStep].name}</h3>
                      </div>

                      <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">{narrativeSteps[activeStep].description}</p>

                      {/* Details List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {narrativeSteps[activeStep].details.map((detail, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <CheckCircle2 
                              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" 
                              style={{ color: narrativeSteps[activeStep].color }}
                            />
                            <span className="text-white/60 text-xs sm:text-sm">{detail}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                        {narrativeSteps[activeStep].features.map((feature, i) => (
                          <span 
                            key={i}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/60 border border-white/10"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Step Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mt-10 sm:mt-12 md:mt-16">
              {narrativeSteps.slice(0, 4).map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={index === activeStep}
                  onClick={() => setActiveStep(index)}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mt-4 sm:mt-5 md:mt-6 max-w-4xl mx-auto">
              {narrativeSteps.slice(4).map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={index + 4}
                  isActive={index + 4 === activeStep}
                  onClick={() => setActiveStep(index + 4)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIDEO SHOWCASE SECTION - SPECIAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 mb-4 sm:mb-6"
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                <span className="text-xs sm:text-sm text-rose-300">Created with Storia</span>
              </motion.div>

              <BlurText
                text="Stunning Videos, Created by AI"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                delay={100}
                animateBy="words"
              />

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2"
              >
                See what's possible with our Narrative Mode. From fantasy epics to corporate videos.
              </motion.p>
            </div>

            {/* Featured Video - Large */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative mb-6 sm:mb-8 md:mb-12"
            >
              <div 
                className="relative aspect-video max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer group"
                onClick={() => setSelectedVideo(showcaseVideos[0])}
              >
                <img 
                  src={showcaseVideos[0].thumbnail}
                  alt={showcaseVideos[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/30 group-hover:bg-white/20 transition-colors"
                  >
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white ml-1" />
                  </motion.div>
                </div>

                {/* Video Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs sm:text-sm border border-pink-500/30 mb-2 sm:mb-3 inline-block">
                        Featured
                      </span>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{showcaseVideos[0].title}</h3>
                      <p className="text-white/60 text-sm sm:text-base">{showcaseVideos[0].genre} • {showcaseVideos[0].duration}</p>
                    </div>
                    <div className="flex gap-3 sm:gap-4 text-white/60 text-sm">
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {showcaseVideos[0].stats.views}
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {showcaseVideos[0].stats.likes}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Glowing Border */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-white/10 group-hover:border-pink-500/50 transition-colors" />
              </div>
            </motion.div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {showcaseVideos.slice(1).map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden">
                    <img 
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Overlay - Always visible on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center"
                      >
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white ml-0.5" />
                      </motion.div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/60 backdrop-blur text-[10px] sm:text-xs text-white">
                      {video.duration}
                    </div>

                    {/* Info - Always visible on mobile */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:transform md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
                      <h4 className="font-bold text-white text-sm sm:text-base mb-0.5 sm:mb-1">{video.title}</h4>
                      <p className="text-white/60 text-xs sm:text-sm">{video.genre}</p>
                    </div>

                    {/* Border */}
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* AI MODELS SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 mb-4 sm:mb-6"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span className="text-xs sm:text-sm text-violet-300">Powered by Leading AI</span>
              </motion.div>

              <BlurText
                text="Best-in-Class AI Models"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                delay={100}
                animateBy="words"
              />

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2"
              >
                Access the world's most powerful AI models for image, video, and voice generation
              </motion.p>
            </div>

            {/* Model Tabs */}
            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-8 sm:mb-10 md:mb-12 overflow-x-auto scrollbar-hide px-2">
              {(['image', 'video', 'voice'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setActiveModelTab(tab)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                    activeModelTab === tab
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {tab === 'image' && <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {tab === 'video' && <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {tab === 'voice' && <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)} Models</span>
                  <span className="sm:hidden">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </motion.button>
              ))}
            </div>

            {/* Models Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModelTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
              >
                {aiModels[activeModelTab].map((model, index) => (
                  <motion.div
                    key={model.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/30 hover:bg-white/[0.06] transition-all duration-300 text-center group"
                    style={{ minHeight: '140px' }}
                  >
                    {/* Logo Image */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-lg sm:rounded-xl bg-white/5 p-1.5 sm:p-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <img 
                        src={model.logo} 
                        alt={model.name}
                        className="w-full h-full object-contain filter brightness-100 group-hover:brightness-110"
                      />
                    </div>
                    <h4 className="font-semibold text-white mb-0.5 sm:mb-1 text-xs sm:text-sm">{model.name}</h4>
                    <p className="text-white/40 text-[10px] sm:text-xs line-clamp-2">{model.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FEATURES SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            {/* Section Header */}
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4 sm:mb-6"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-emerald-300">Why Choose Narrative Mode</span>
              </motion.div>

              <BlurText
                text="Everything You Need"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4"
                delay={100}
                animateBy="words"
              />

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto px-2"
              >
                Professional video creation tools designed for creators of all levels
              </motion.p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all duration-300 group"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                    <p className="text-white/50 leading-relaxed text-sm sm:text-base">{feature.description}</p>
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
              {/* Background Gradients */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-pink-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8 shadow-2xl shadow-pink-500/30"
                >
                  <Rocket className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2">
                  Ready to Create Your Story?
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
                  Join thousands of creators using Storia to bring their ideas to life with AI-powered video production.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold text-base sm:text-lg text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Start Free Trial
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

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}
