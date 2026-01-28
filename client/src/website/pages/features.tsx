import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform, AnimatePresence, useInView, useSpring } from "framer-motion";
import { useLocation } from "wouter";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Video,
  Zap,
  Bot,
  FolderOpen,
  Film,
  Play,
  Star,
  Rocket,
  Wand2,
  Globe,
  Users,
  Palette,
  MapPin,
  Calendar,
  Share2,
  CheckCircle2,
  Target,
  Layers,
  Clock,
  TrendingUp,
  Award,
  Eye,
  Image,
  Music,
  Download,
  BookOpen,
  Settings,
  MousePointer,
  ChevronDown
} from "lucide-react";
import {
  narrativeVideo,
  homeStep1,
  homeStep2,
  homeStep3,
  homeStep4
} from "@/website/assets/images";

// The 5 Core Features
const coreFeatures = [
  {
    id: "video-generator",
    name: "Video Generator",
    shortName: "Videos",
    tagline: "6 Powerful Creation Modes",
    description: "Transform ideas into cinematic videos with AI. From narrative films to character vlogs, ambient visuals to product showcases.",
    icon: Video,
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
    href: "/features/video-generator",
    image: narrativeVideo,
    stats: [
      { label: "Video Modes", value: "6" },
      { label: "AI Models", value: "15+" },
      { label: "Export Quality", value: "4K" }
    ],
    highlights: ["Narrative Video", "Character Vlog", "Ambient Visual", "Social Commerce", "Logo Animation", "Video Podcast"],
    position: { angle: 0 }
  },
  {
    id: "storyboard",
    name: "Storyboard Mode",
    shortName: "Storyboard",
    tagline: "7-Step Cinematic Workflow",
    description: "Professional filmmaking workflow with AI assistance. Script to screen in 7 intelligent steps.",
    icon: Film,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
    href: "/features/storyboard",
    image: homeStep1,
    stats: [
      { label: "Workflow Steps", value: "7" },
      { label: "AI Voices", value: "50+" },
      { label: "Languages", value: "30+" }
    ],
    highlights: ["Script Writing", "World Building", "Scene Breakdown", "Storyboard", "Audio Production", "Animatic", "Export"],
    position: { angle: 72 }
  },
  {
    id: "stories-generator",
    name: "Stories Generator",
    shortName: "Stories",
    tagline: "Viral Short-Form Content",
    description: "Create scroll-stopping stories with proven templates. 6 formats optimized for social media engagement.",
    icon: Zap,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    href: "/features/stories-generator",
    image: homeStep2,
    stats: [
      { label: "Templates", value: "6" },
      { label: "Steps", value: "5" },
      { label: "Duration", value: "15-90s" }
    ],
    highlights: ["Problem-Solution", "Tease & Reveal", "Before & After", "Myth-Busting", "ASMR", "Auto-ASMR"],
    position: { angle: 144 }
  },
  {
    id: "auto-production",
    name: "Auto Production",
    shortName: "Autopilot",
    tagline: "Content on Autopilot",
    description: "Set up once, publish forever. AI handles creation, scheduling, and publishing automatically.",
    icon: Bot,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    href: "/features/auto-production",
    image: homeStep3,
    stats: [
      { label: "Modes", value: "2" },
      { label: "Topics/Batch", value: "10" },
      { label: "Automation", value: "100%" }
    ],
    highlights: ["Auto Video", "Auto Story", "Smart Scheduling", "Multi-Platform", "Batch Generation", "Analytics"],
    position: { angle: 216 }
  },
  {
    id: "assets-library",
    name: "Assets Library",
    shortName: "Assets",
    tagline: "Your Creative Hub",
    description: "Build and manage your creative assets. Brand kits, characters, locations, and media - all in one place.",
    icon: FolderOpen,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    href: "/features/assets-library",
    image: homeStep4,
    stats: [
      { label: "Asset Types", value: "4" },
      { label: "Storage", value: "∞" },
      { label: "AI Gen", value: "Yes" }
    ],
    highlights: ["Brand Kits", "Characters", "Locations", "Media Uploads", "AI Generation", "@Mentions"],
    position: { angle: 288 }
  }
];

// Orbiting Feature Component
function OrbitingFeature({ 
  feature, 
  index, 
  totalFeatures, 
  isActive, 
  onClick,
  orbitProgress 
}: { 
  feature: typeof coreFeatures[0];
  index: number;
  totalFeatures: number;
  isActive: boolean;
  onClick: () => void;
  orbitProgress: number;
}) {
  const Icon = feature.icon;
  const angleOffset = (index / totalFeatures) * 360;
  const currentAngle = angleOffset + orbitProgress * 360;
  const radians = (currentAngle * Math.PI) / 180;
  
  // Calculate position on elliptical orbit - responsive radius
  const radiusX = typeof window !== 'undefined' && window.innerWidth < 640 ? 140 : window.innerWidth < 1024 ? 280 : 420;
  const radiusY = typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : window.innerWidth < 1024 ? 150 : 200;
  const x = Math.cos(radians) * radiusX;
  const y = Math.sin(radians) * radiusY;
  const z = Math.sin(radians); // For depth effect
  
  const scale = 0.7 + (z + 1) * 0.3; // Scale based on depth
  const opacity = 0.5 + (z + 1) * 0.25;
  const zIndex = Math.round((z + 1) * 10);

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: '50%',
        top: '50%',
        x: x,
        y: y,
        scale: isActive ? 1.2 : scale,
        opacity: isActive ? 1 : opacity,
        zIndex: isActive ? 50 : zIndex,
      }}
      onClick={onClick}
      whileHover={{ scale: scale * 1.15 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className={`relative -translate-x-1/2 -translate-y-1/2 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border backdrop-blur-xl transition-all duration-500 ${
          isActive ? 'border-white/30' : 'border-white/10 hover:border-white/20'
        }`}
        style={{
          backgroundColor: isActive ? `${feature.color}30` : 'rgba(13, 13, 13, 0.8)',
          boxShadow: isActive ? `0 0 60px ${feature.color}40, 0 0 120px ${feature.color}20` : 'none'
        }}
      >
        {/* Glow Ring */}
        {isActive && (
          <motion.div
            className="absolute -inset-1 sm:-inset-2 rounded-2xl sm:rounded-3xl"
            style={{ border: `2px solid ${feature.color}` }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${feature.color}30` }}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: feature.color }} />
          </div>
          <div className="hidden md:block">
            <div className="text-white font-bold text-xs sm:text-sm">{feature.shortName}</div>
            <div className="text-white/50 text-[10px] sm:text-xs">{feature.stats[0].value} {feature.stats[0].label}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Central Hub Component
function CentralHub({ activeFeature, onExplore }: { 
  activeFeature: typeof coreFeatures[0]; 
  onExplore: () => void;
}) {
  const Icon = activeFeature.icon;

  return (
    <motion.div
      key={activeFeature.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className="relative z-[100]"
    >
      {/* Central Glow - positioned behind card */}
      <motion.div
        className="absolute -inset-6 sm:-inset-10 rounded-full blur-3xl -z-10"
        style={{ backgroundColor: `${activeFeature.color}20` }}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Main Content - Contained Card */}
      <div 
        className="relative text-center max-w-[280px] sm:max-w-sm mx-auto p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(13, 13, 13, 0.9)' }}
      >
        {/* Icon */}
        <motion.div
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 md:mb-5 flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${activeFeature.color}40, ${activeFeature.color}20)`,
            boxShadow: `0 0 40px ${activeFeature.color}30`
          }}
          animate={{ 
            rotateY: [0, 5, 0, -5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ color: activeFeature.color }} />
        </motion.div>

        {/* Title */}
        <motion.h2 
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {activeFeature.name}
        </motion.h2>

        {/* Tagline */}
        <motion.p 
          className="text-xs sm:text-sm mb-2 sm:mb-3"
          style={{ color: activeFeature.color }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {activeFeature.tagline}
        </motion.p>

        {/* Description */}
        <motion.p 
          className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed line-clamp-3 sm:line-clamp-none"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {activeFeature.description}
        </motion.p>

        {/* Stats - Horizontal compact */}
        <motion.div 
          className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-5 py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl bg-white/5"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {activeFeature.stats.map((stat, i) => (
            <div key={i} className="text-center px-1 sm:px-2">
              <div className="text-sm sm:text-base md:text-lg font-bold text-white">{stat.value}</div>
              <div className="text-[8px] sm:text-[10px] text-white/40 whitespace-nowrap">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onExplore}
          className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r ${activeFeature.gradient}`}
          style={{ boxShadow: `0 8px 30px ${activeFeature.color}30` }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Explore {activeFeature.shortName}
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Cinematic Feature Card (for scroll section)
function CinematicFeatureCard({ feature, index }: { feature: typeof coreFeatures[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-100px" });
  const [, navigate] = useLocation();
  const Icon = feature.icon;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="relative"
    >
      <div 
        className={`grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
        style={{ direction: index % 2 === 1 ? 'rtl' : 'ltr' }}
      >
        {/* Image Side */}
        <motion.div
          initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative group"
          style={{ direction: 'ltr' }}
        >
          <div className="relative aspect-video rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden">
            {/* Image */}
            <img 
              src={feature.image}
              alt={feature.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Badge */}
            <div 
              className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-xl border flex items-center gap-1.5 sm:gap-2"
              style={{ backgroundColor: `${feature.color}20`, borderColor: `${feature.color}40` }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: feature.color }} />
              <span className="text-xs sm:text-sm text-white font-medium">{feature.name}</span>
            </div>

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-2"
                style={{ backgroundColor: `${feature.color}30`, borderColor: feature.color }}
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white ml-1" />
              </motion.div>
            </div>

            {/* Stats Bar */}
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6">
              <div className="flex gap-2 sm:gap-3 md:gap-4">
                {feature.stats.map((stat, i) => (
                  <div key={i} className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-black/50 backdrop-blur-xl border border-white/10">
                    <div className="text-sm sm:text-base md:text-lg font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow Effect */}
          <div 
            className="absolute -inset-4 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl"
            style={{ backgroundColor: `${feature.color}20` }}
          />
        </motion.div>

        {/* Content Side */}
        <motion.div
          initial={{ opacity: 0, x: index % 2 === 0 ? 100 : -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ direction: 'ltr' }}
        >
          {/* Number Badge */}
          <div 
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4"
            style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
          >
            <span 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white"
              style={{ backgroundColor: feature.color }}
            >
              {index + 1}
            </span>
            <span className="text-xs sm:text-sm font-medium" style={{ color: feature.color }}>{feature.tagline}</span>
          </div>

          {/* Title */}
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">{feature.name}</h3>
          
          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-white/60 mb-4 sm:mb-6 leading-relaxed">{feature.description}</p>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
            {feature.highlights.map((highlight, i) => (
              <motion.div
                key={highlight}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: feature.color }} />
                <span className="text-xs sm:text-sm text-white/70">{highlight}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            onClick={() => navigate(feature.href)}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r ${feature.gradient}`}
            style={{ boxShadow: `0 10px 40px ${feature.color}30` }}
          >
            Explore {feature.name}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Floating Particles
function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ 
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export default function FeaturesPage() {
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [orbitProgress, setOrbitProgress] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [, navigate] = useLocation();

  const activeFeature = coreFeatures[activeFeatureIndex];

  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(latest);
    }
  });

  // Auto-rotate orbit
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setOrbitProgress(prev => (prev + 0.002) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Auto-switch active feature
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % coreFeatures.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const handleFeatureClick = (index: number) => {
    setActiveFeatureIndex(index);
    setIsAutoRotating(false);
    // Resume auto-rotation after 10 seconds
    setTimeout(() => setIsAutoRotating(true), 10000);
  };

  const handleExplore = () => {
    navigate(activeFeature.href);
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
        {/* HERO SECTION - ORBITAL SHOWCASE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-28 md:pt-32">
          {/* Floating Particles */}
          <FloatingParticles color={activeFeature.color} />

          {/* Orbital Rings (Visual) - Hidden on mobile */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none hidden sm:block">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute border border-white/5 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${150 + ring * 100}px`,
                  height: `${75 + ring * 50}px`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30 + ring * 10, repeat: Infinity, ease: "linear" }}
              />
            ))}
          </div>

          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 w-full">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 sm:mb-8"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-white/70">Explore Our Features</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </div>
            </motion.div>

            {/* Title */}
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <BlurText
                text="The Complete AI Video Platform"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 text-white px-2"
                delay={80}
                animateBy="words"
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm sm:text-base md:text-lg lg:text-xl text-white/50 max-w-2xl mx-auto px-2"
              >
                5 powerful features. Infinite possibilities. Create stunning videos with AI.
              </motion.p>
            </div>

            {/* Orbital Feature Showcase */}
            <div className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
              {/* Orbiting Features */}
              {coreFeatures.map((feature, index) => (
                <OrbitingFeature
                  key={feature.id}
                  feature={feature}
                  index={index}
                  totalFeatures={coreFeatures.length}
                  isActive={activeFeatureIndex === index}
                  onClick={() => handleFeatureClick(index)}
                  orbitProgress={orbitProgress}
                />
              ))}

              {/* Central Hub */}
              <AnimatePresence mode="wait">
                <CentralHub 
                  key={activeFeature.id}
                  activeFeature={activeFeature} 
                  onExplore={handleExplore}
                />
              </AnimatePresence>
            </div>

            {/* Feature Navigation Dots */}
            <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
              {coreFeatures.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(index)}
                  className={`relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    activeFeatureIndex === index ? 'w-8 sm:w-10' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  style={{ 
                    backgroundColor: activeFeatureIndex === index ? feature.color : undefined 
                  }}
                >
                  {activeFeatureIndex === index && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: feature.color }}
                      layoutId="activeFeatureDot"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 sm:gap-2"
            >
              <span className="text-xs sm:text-sm text-white/40">Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CINEMATIC FEATURE SECTIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24 md:space-y-32 lg:space-y-40">
            {coreFeatures.map((feature, index) => (
              <CinematicFeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COMPARISON / WHY STORIA */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 mb-4 sm:mb-6"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span className="text-xs sm:text-sm text-violet-300">Why Choose Storia</span>
              </motion.div>

              <BlurText
                text="Everything You Need"
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
                One platform for all your video content needs
              </motion.p>
            </div>

            {/* Feature Grid Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {coreFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => navigate(feature.href)}
                    className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all cursor-pointer group text-center"
                  >
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl mx-auto mb-3 sm:mb-4 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1">{feature.shortName}</h3>
                    <p className="text-[10px] sm:text-xs text-white/40 line-clamp-2">{feature.tagline}</p>
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
              className="relative p-6 sm:p-8 md:p-12 lg:p-20 rounded-2xl sm:rounded-3xl overflow-hidden text-center"
              style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {coreFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.id}
                    className="absolute w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 rounded-full blur-3xl"
                    style={{ 
                      backgroundColor: `${feature.color}20`,
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 2) * 40}%`
                    }}
                    animate={{
                      x: [0, 30, 0],
                      y: [0, -30, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 5 + i,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                {/* Icon Row */}
                <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-5 sm:mb-6 md:mb-8">
                  {coreFeatures.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${feature.color}20` }}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: feature.color }} />
                      </motion.div>
                    );
                  })}
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2">
                  Start Creating Today
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
                  Join thousands of creators using Storia to produce stunning video content with AI.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 rounded-xl font-semibold text-base sm:text-lg text-white shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Start Free Trial
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-base sm:text-lg text-white flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Watch Demo
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
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
