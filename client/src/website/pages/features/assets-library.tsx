import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useInView } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Palette,
  User,
  MapPin,
  Upload,
  Image,
  Video,
  Plus,
  CheckCircle2,
  Wand2,
  Search,
  FolderOpen,
  Layers,
  Type,
  Play,
  Grid3X3,
  Users,
  Building2,
  Film,
  Star,
  Zap,
  Shield,
  RefreshCw,
  CloudUpload,
  Database,
  Lock,
  Eye,
  Award,
  Lightbulb,
  Settings,
  Box,
  Target
} from "lucide-react";
import {
  homeStep1,
  homeStep2,
  homeStep3,
  homeStep4
} from "@/website/assets/images";

// Asset Types
const assetTypes = [
  {
    id: "brand-kits",
    name: "Brand Kits",
    tagline: "Maintain Brand Consistency",
    description: "Define your brand colors, typography, and guidelines to maintain consistency across all your videos.",
    icon: Palette,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
    image: homeStep1,
    features: [
      { icon: Palette, label: "Brand Colors", description: "Define your color palette" },
      { icon: Type, label: "Typography", description: "Set your brand fonts" },
      { icon: Image, label: "Logo Upload", description: "Upload your brand logo" },
      { icon: Settings, label: "Guidelines", description: "Add brand voice & tone" }
    ],
    benefits: ["Visual consistency", "Professional look", "Quick setup", "Reusable across projects"],
    stats: { items: "∞", label: "Brand Kits" }
  },
  {
    id: "characters",
    name: "Characters",
    tagline: "Create Consistent AI Characters",
    description: "Build a library of AI characters with consistent appearances, personalities, and voices for your videos.",
    icon: User,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    image: homeStep2,
    features: [
      { icon: User, label: "Character Profile", description: "Name & personality" },
      { icon: Eye, label: "Appearance", description: "Visual description" },
      { icon: Image, label: "Reference Images", description: "Upload face references" },
      { icon: Wand2, label: "AI Generation", description: "Generate character images" }
    ],
    benefits: ["Consistent faces", "Story continuity", "Quick reference", "AI-powered generation"],
    stats: { items: "5", label: "References per character" }
  },
  {
    id: "locations",
    name: "Locations",
    tagline: "Build Your Visual World",
    description: "Create and manage location settings for your videos. Define atmospheres, lighting, and details for consistency.",
    icon: MapPin,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    image: homeStep3,
    features: [
      { icon: MapPin, label: "Location Profile", description: "Name & description" },
      { icon: Lightbulb, label: "Details", description: "Lighting & atmosphere" },
      { icon: Image, label: "Reference Images", description: "Visual references" },
      { icon: Wand2, label: "AI Generation", description: "Generate location images" }
    ],
    benefits: ["Scene consistency", "Immersive worlds", "Quick setup", "Reusable settings"],
    stats: { items: "5", label: "References per location" }
  },
  {
    id: "uploads",
    name: "Media Uploads",
    tagline: "Your Creative Asset Library",
    description: "Upload and manage your images, videos, and audio files. Access them across all your projects.",
    icon: Upload,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    image: homeStep4,
    features: [
      { icon: Image, label: "Images", description: "Photos & graphics" },
      { icon: Video, label: "Videos", description: "Video clips & footage" },
      { icon: CloudUpload, label: "Easy Upload", description: "Drag & drop support" },
      { icon: Search, label: "Search", description: "Find assets quickly" }
    ],
    benefits: ["Centralized storage", "Quick access", "Multi-format", "Organized library"],
    stats: { items: "∞", label: "Files" }
  }
];

// How Assets Are Used
const usageExamples = [
  {
    title: "In Narrative Videos",
    description: "Reference your characters and locations directly in scripts",
    icon: Film,
    color: "#3B82F6",
    example: "@John walks into @Modern Office..."
  },
  {
    title: "In Character Vlogs",
    description: "Use characters as consistent hosts across episodes",
    icon: Users,
    color: "#EC4899",
    example: "Host: @Emma narrates the story..."
  },
  {
    title: "In Social Commerce",
    description: "Apply brand kits for consistent product videos",
    icon: Target,
    color: "#10B981",
    example: "Brand: @MyBrand colors & fonts..."
  },
  {
    title: "Everywhere",
    description: "Your assets work across all Storia modes",
    icon: Layers,
    color: "#8B5CF6",
    example: "Universal asset library"
  }
];

// Features
const features = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description: "Generate character and location images with AI based on your descriptions"
  },
  {
    icon: RefreshCw,
    title: "Consistency Engine",
    description: "Maintain visual consistency across all your videos automatically"
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find any asset instantly with powerful search and filtering"
  },
  {
    icon: Lock,
    title: "Workspace Isolation",
    description: "Assets are private to your workspace and team members"
  },
  {
    icon: Database,
    title: "Cloud Storage",
    description: "All assets are securely stored in the cloud and always accessible"
  },
  {
    icon: Zap,
    title: "Instant Access",
    description: "Use assets in any project with simple @mentions"
  }
];

// Animated Counter
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(value === "∞" ? "∞" : "0");

  useEffect(() => {
    if (!isInView) return;
    if (value === "∞") {
      setDisplayed("∞");
      return;
    }
    const num = parseInt(value);
    const duration = 1500;
    const steps = 30;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current).toString());
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
      {displayed}{suffix}
    </div>
  );
}

// Interactive Asset Showcase
function AssetShowcase() {
  const [activeAsset, setActiveAsset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const currentAsset = assetTypes[activeAsset];
  const Icon = currentAsset.icon;

  // Auto-rotate
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveAsset(prev => (prev + 1) % assetTypes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="relative">
      <motion.div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10"
        style={{ backgroundColor: 'rgba(13, 13, 13, 0.9)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Border */}
        <motion.div
          className="absolute -inset-px rounded-2xl sm:rounded-3xl opacity-50 -z-10"
          style={{ 
            background: `conic-gradient(from 0deg, ${currentAsset.color}40, transparent, ${currentAsset.color}40)` 
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left - Preview */}
          <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAsset}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img
                  src={currentAsset.image}
                  alt={currentAsset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* Asset Badge */}
            <div className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 z-10">
              <motion.div
                key={activeAsset}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-xl border"
                style={{ backgroundColor: `${currentAsset.color}20`, borderColor: `${currentAsset.color}40` }}
              >
                <div 
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-md sm:rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: currentAsset.color }}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm md:text-base text-white font-bold">{currentAsset.name}</div>
                  <div className="text-[10px] sm:text-xs text-white/60 hidden sm:block">{currentAsset.tagline}</div>
                </div>
              </motion.div>
            </div>

            {/* Stats */}
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 right-3 sm:right-4 md:right-6 z-10">
              <motion.div
                key={`stats-${activeAsset}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 sm:gap-3 md:gap-4"
              >
                <div className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-black/50 backdrop-blur-xl border border-white/10">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{currentAsset.stats.items}</div>
                  <div className="text-[10px] sm:text-xs text-white/50">{currentAsset.stats.label}</div>
                </div>
                {currentAsset.benefits.slice(0, 2).map((benefit, i) => (
                  <div key={i} className="hidden sm:flex px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: currentAsset.color }} />
                    <span className="text-xs sm:text-sm text-white/70">{benefit}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Right - Details */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Asset Tabs */}
            <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8">
              {assetTypes.map((asset, index) => {
                const AssetIcon = asset.icon;
                const isActive = activeAsset === index;
                return (
                  <motion.button
                    key={asset.id}
                    onClick={() => { setActiveAsset(index); setIsAnimating(false); }}
                    className={`relative p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl border transition-all ${
                      isActive ? 'border-transparent' : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${asset.color}20` : 'rgba(255,255,255,0.02)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AssetIcon 
                      className="w-4 h-4 sm:w-5 sm:h-5" 
                      style={{ color: isActive ? asset.color : 'rgba(255,255,255,0.4)' }} 
                    />
                    {isActive && (
                      <motion.div
                        layoutId="activeAssetIndicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 sm:w-4 h-0.5 sm:h-1 rounded-full"
                        style={{ backgroundColor: asset.color }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAsset}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-white/60 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{currentAsset.description}</p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {currentAsset.features.map((feature, i) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <FeatureIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: currentAsset.color }} />
                          <span className="text-xs sm:text-sm font-medium text-white">{feature.label}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/40 hidden sm:block">{feature.description}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Benefits */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  {currentAsset.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/60 border border-white/5"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r ${currentAsset.gradient}`}
                  style={{ boxShadow: `0 10px 40px ${currentAsset.color}30` }}
                >
                  Explore {currentAsset.name}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
        {assetTypes.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActiveAsset(i); setIsAnimating(false); }}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
              activeAsset === i ? 'w-6 sm:w-8' : 'bg-white/20 hover:bg-white/40'
            }`}
            style={{ backgroundColor: activeAsset === i ? assetTypes[i].color : undefined }}
          />
        ))}
      </div>
    </div>
  );
}

// Asset Type Section
function AssetTypeSection({ asset, index, isReversed }: { 
  asset: typeof assetTypes[0]; 
  index: number;
  isReversed: boolean;
}) {
  const Icon = asset.icon;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-24 relative" id={asset.id}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 sm:gap-10 lg:gap-16 items-center`}>
          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2"
          >
            <div className="relative group cursor-pointer">
              <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden">
                <img 
                  src={asset.image}
                  alt={asset.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badge */}
                <div 
                  className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-xl border flex items-center gap-1.5 sm:gap-2"
                  style={{ backgroundColor: `${asset.color}20`, borderColor: `${asset.color}40` }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: asset.color }} />
                  <span className="text-xs sm:text-sm text-white font-medium">{asset.name}</span>
                </div>

                {/* Feature Pills */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {asset.features.slice(0, 3).map((feature, i) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <span 
                          key={i}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-black/50 backdrop-blur text-[10px] sm:text-xs text-white/80 flex items-center gap-1 sm:gap-1.5"
                        >
                          <FeatureIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: asset.color }} />
                          <span className="hidden sm:inline">{feature.label}</span>
                        </span>
                      );
                    })}
                    <span className="sm:hidden px-2 py-1 rounded-md bg-black/50 backdrop-blur text-[10px] text-white/60">
                      +{asset.features.length - 3}
                    </span>
                  </div>
                </div>
              </div>

              {/* Glow */}
              <div 
                className="absolute -inset-4 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl"
                style={{ backgroundColor: `${asset.color}20` }}
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
            {/* Title */}
            <div 
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4"
              style={{ backgroundColor: `${asset.color}15`, border: `1px solid ${asset.color}30` }}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: asset.color }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: asset.color }}>{asset.name}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">{asset.tagline}</h2>
            <p className="text-white/60 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{asset.description}</p>

            {/* Features List */}
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {asset.features.map((feature, i) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-start gap-2 sm:gap-3"
                  >
                    <div 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${asset.color}20` }}
                    >
                      <FeatureIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: asset.color }} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base text-white font-medium">{feature.label}</div>
                      <div className="text-xs sm:text-sm text-white/50">{feature.description}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r ${asset.gradient}`}
              style={{ boxShadow: `0 10px 40px ${asset.color}30` }}
            >
              Get Started with {asset.name}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Usage Examples Section
function UsageExamplesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 md:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-4 sm:mb-6"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm text-cyan-300">How Assets Work</span>
          </motion.div>

          <BlurText
            text="Use Assets Everywhere"
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
            Reference your characters, locations, and brand kits with simple @mentions in any mode
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {usageExamples.map((example, index) => {
            const Icon = example.icon;
            return (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
              >
                <div 
                  className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${example.color}20` }}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: example.color }} />
                </div>
                
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1.5 sm:mb-2">{example.title}</h3>
                <p className="text-xs sm:text-sm text-white/50 mb-3 sm:mb-4 line-clamp-2">{example.description}</p>
                
                <div className="p-2 sm:p-3 rounded-md sm:rounded-lg bg-black/30 border border-white/5">
                  <code className="text-[10px] sm:text-xs text-white/70 font-mono break-all">{example.example}</code>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function AssetsLibraryPage() {
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(latest);
    }
  });

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
            <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-16">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 mb-6 sm:mb-8"
              >
                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span className="text-xs sm:text-sm text-violet-300">Assets Library</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
              </motion.div>

              {/* Title */}
              <BlurText
                text="Your Creative Asset Hub"
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
                Build and manage your brand kits, characters, locations, and media files. 
                Maintain consistency across all your video projects.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:flex sm:justify-center gap-4 sm:gap-8 md:gap-12 mb-10 sm:mb-12 md:mb-16 px-4 sm:px-0"
              >
                {[
                  { value: "4", label: "Asset Types", suffix: "" },
                  { value: "∞", label: "Unlimited Storage", suffix: "" },
                  { value: "5", label: "References Each", suffix: "" },
                  { value: "100", label: "AI Generation", suffix: "%" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <div className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Interactive Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <AssetShowcase />
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ASSET TYPE SECTIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {assetTypes.map((asset, index) => (
            <AssetTypeSection 
              key={asset.id} 
              asset={asset} 
              index={index}
              isReversed={index % 2 === 1}
            />
          ))}
        </div>

        {/* Usage Examples */}
        <UsageExamplesSection />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FEATURES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 mb-4 sm:mb-6"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-emerald-300">Powerful Features</span>
              </motion.div>

              <BlurText
                text="Built for Creators"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white"
                delay={100}
                animateBy="words"
              />
            </div>

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
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform">
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
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-violet-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-emerald-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8 shadow-2xl shadow-violet-500/30"
                >
                  <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2">
                  Start Building Your Library
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
                  Create your first brand kit, character, or location today and maintain consistency across all your videos.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-violet-500 to-emerald-600 rounded-xl font-semibold text-base sm:text-lg text-white shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Create Your First Asset
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-base sm:text-lg text-white flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Watch Tutorial
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
