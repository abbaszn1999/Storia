import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useVelocity } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { AnimatedCounter } from "@/website/components/common";
import { 
  ArrowRight,
  Check,
  Zap,
  Clock,
  BarChart3,
  Layers,
  Sparkles,
  Globe,
  Calendar,
  Hash,
  Image,
  Video,
  Play,
  Share2,
  Settings,
  RefreshCcw,
  TrendingUp,
  Users,
  LinkIcon,
  CheckCircle2
} from "lucide-react";

// Platform data
const platforms = [
  {
    id: "youtube",
    name: "YouTube",
    icon: "/image/platforms/youtube.svg",
    color: "#FF0000",
    bgColor: "rgba(255, 0, 0, 0.1)",
    description: "Reach billions with long-form and short-form video content",
    contentTypes: ["Videos", "Shorts", "Live Streams"],
    features: [
      "Auto-upload with metadata",
      "Custom thumbnails",
      "SEO-optimized titles & tags",
      "Playlist management",
      "Scheduled publishing",
      "Analytics integration"
    ],
    stats: { label: "Monthly Users", value: "2.7B+" }
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "/image/platforms/instagram.svg",
    color: "#E4405F",
    bgColor: "rgba(228, 64, 95, 0.1)",
    description: "Engage your audience with Reels, Stories, and Posts",
    contentTypes: ["Reels", "Stories", "Feed Posts", "Carousels"],
    features: [
      "Auto-resize to 9:16",
      "Story & Reel optimization",
      "Hashtag suggestions",
      "Carousel creation",
      "Cross-post to Facebook",
      "Engagement analytics"
    ],
    stats: { label: "Monthly Users", value: "2B+" }
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "/image/platforms/tiktok.svg",
    color: "#000000",
    bgColor: "rgba(0, 0, 0, 0.2)",
    description: "Go viral with trending short-form video content",
    contentTypes: ["Videos", "Stories", "LIVE"],
    features: [
      "Trending sound integration",
      "Auto-captions",
      "Duet & Stitch settings",
      "Hashtag optimization",
      "Best time to post",
      "Viral potential analysis"
    ],
    stats: { label: "Monthly Users", value: "1.5B+" }
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "/image/platforms/facebook.svg",
    color: "#1877F2",
    bgColor: "rgba(24, 119, 242, 0.1)",
    description: "Share with friends, pages, and groups worldwide",
    contentTypes: ["Videos", "Reels", "Stories", "Live"],
    features: [
      "Page & Group posting",
      "Cross-post from Instagram",
      "Auto-scheduling",
      "Audience targeting",
      "Boost integration",
      "Insights dashboard"
    ],
    stats: { label: "Monthly Users", value: "3B+" }
  },
];

// How it works steps
const steps = [
  {
    number: "01",
    title: "Connect Your Accounts",
    description: "Link your social media accounts with one-click OAuth. Secure and instant connection.",
    icon: LinkIcon,
    color: "#8B5CF6"
  },
  {
    number: "02",
    title: "Create Your Video",
    description: "Use Storia's AI to generate stunning videos in any format you need.",
    icon: Video,
    color: "#EC4899"
  },
  {
    number: "03",
    title: "Customize & Optimize",
    description: "AI automatically adapts your content for each platform's requirements.",
    icon: Settings,
    color: "#F59E0B"
  },
  {
    number: "04",
    title: "Publish Everywhere",
    description: "Post instantly or schedule for the perfect time. One click, all platforms.",
    icon: Share2,
    color: "#10B981"
  },
];

// Features
const features = [
  {
    icon: RefreshCcw,
    title: "Smart Auto-Resize",
    description: "Automatically convert your video to the perfect aspect ratio for each platform",
    color: "#8B5CF6"
  },
  {
    icon: Calendar,
    title: "Advanced Scheduling",
    description: "Plan your content calendar and let Storia post at the optimal times",
    color: "#EC4899"
  },
  {
    icon: BarChart3,
    title: "Unified Analytics",
    description: "Track performance across all platforms in one comprehensive dashboard",
    color: "#06B6D4"
  },
  {
    icon: Layers,
    title: "Bulk Publishing",
    description: "Upload and distribute multiple videos to all platforms simultaneously",
    color: "#F59E0B"
  },
  {
    icon: Hash,
    title: "AI Hashtags & Captions",
    description: "Generate platform-optimized captions and trending hashtags automatically",
    color: "#10B981"
  },
  {
    icon: TrendingUp,
    title: "Best Time to Post",
    description: "AI analyzes your audience to recommend the perfect posting schedule",
    color: "#3B82F6"
  },
];

// Stats
const stats = [
  { value: "10M+", label: "Videos Published" },
  { value: "500K+", label: "Connected Accounts" },
  { value: "99.9%", label: "Uptime" },
  { value: "4", label: "Platforms" },
];

export default function IntegrationsPage() {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  
  // Ref for controlling LightPillar
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress and velocity
  const { scrollYProgress, scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Update LightPillar with progress
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(progress);
    }
  });

  // Update LightPillar with velocity
  useMotionValueEvent(scrollVelocity, "change", (velocity) => {
    if (lightPillarRef.current) {
      const normalizedVelocity = Math.max(-0.5, Math.min(0.5, velocity / 4000));
      lightPillarRef.current.setScrollVelocity(normalizedVelocity);
    }
  });

  return (
    <div className="website min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <Header />

      {/* Main Content with Background */}
      <main className="relative">
        {/* LightPillar Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <LightPillar
            ref={lightPillarRef}
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={1}
            rotationSpeed={0.3}
          />
        </div>

        {/* Dark Overlay */}
        <div className="fixed inset-0 z-[1] bg-gray-950/60 pointer-events-none" />

        {/* Content */}
        <div ref={containerRef} className="relative z-10">
          
          {/* Hero Section */}
          <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4">
            <div className="max-w-[1400px] mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-6 sm:mb-8"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm text-white/70">Publish to 4+ Platforms</span>
              </motion.div>

              {/* Title */}
              <BlurText
                text="Create Once, Share Everywhere"
                delay={100}
                animateBy="words"
                direction="top"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 font-heading px-2"
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 px-2"
              >
                Automatically publish your AI-generated videos to YouTube, Instagram, 
                TikTok, and Facebook with a single click.
              </motion.p>

              {/* Animated Platform Icons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 md:mb-12"
              >
                {platforms.map((platform, index) => (
                  <motion.div
                    key={platform.id}
                    className="relative"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.5 + index * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <motion.div
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: platform.bgColor }}
                      whileHover={{ 
                        scale: 1.1, 
                        boxShadow: `0 0 40px ${platform.color}40`
                      }}
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{
                        y: {
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.2,
                          ease: "easeInOut"
                        }
                      }}
                    >
                      <PlatformIcon platform={platform.id} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                    </motion.div>
                    
                    {/* Connection line - hidden on small screens */}
                    {index < platforms.length - 1 && (
                      <motion.div
                        className="absolute top-1/2 -right-1.5 sm:-right-2 md:-right-3 w-3 sm:w-4 md:w-6 h-0.5 bg-gradient-to-r from-white/20 to-transparent hidden sm:block"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              >
                <motion.button
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Connect Your Accounts
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
                <motion.button
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/20 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  See How It Works
                </motion.button>
              </motion.div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-8 sm:py-10 md:py-12 px-4">
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10"
                    style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
                  >
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                      <AnimatedCounter value={stat.value} duration={2} />
                    </div>
                    <div className="text-xs sm:text-sm text-white/50">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Platforms Showcase */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-8 sm:mb-12 md:mb-16"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading">
                  Supported Platforms
                </h2>
                <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
                  Seamlessly connect and publish to all major social media platforms
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {platforms.map((platform, index) => (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden group"
                    style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
                    onMouseEnter={() => setHoveredPlatform(platform.id)}
                    onMouseLeave={() => setHoveredPlatform(null)}
                  >
                    {/* Background glow on hover */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${platform.color}15 0%, transparent 70%)`
                      }}
                    />

                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <motion.div
                            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: platform.bgColor }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <PlatformIcon platform={platform.id} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                          </motion.div>
                          <div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{platform.name}</h3>
                            <p className="text-xs sm:text-sm text-white/50">{platform.stats.value} {platform.stats.label}</p>
                          </div>
                        </div>
                        <motion.div
                          className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium"
                          style={{ 
                            backgroundColor: `${platform.color}20`,
                            color: platform.color
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          Connected
                        </motion.div>
                      </div>

                      {/* Description */}
                      <p className="text-sm sm:text-base text-white/60 mb-4 sm:mb-6">{platform.description}</p>

                      {/* Content Types */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        {platform.contentTypes.map((type, i) => (
                          <span
                            key={i}
                            className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-white/10 text-white/70"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {platform.features.map((feature, i) => (
                          <motion.div
                            key={i}
                            className="flex items-center gap-1.5 sm:gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                          >
                            <Check 
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" 
                              style={{ color: platform.color }}
                            />
                            <span className="text-xs sm:text-sm text-white/60">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works - Simple & Clean */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8 sm:mb-12 md:mb-16"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading">
                  How It Works
                </h2>
                <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
                  From creation to global publication in minutes
                </p>
              </motion.div>

              {/* Steps Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                      style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
                    >
                      {/* Step Number */}
                      <div 
                        className="absolute top-3 sm:top-4 right-3 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold text-white"
                        style={{ backgroundColor: `${step.color}30`, color: step.color }}
                      >
                        {step.number}
                      </div>

                      {/* Icon */}
                      <div 
                        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                        style={{ backgroundColor: `${step.color}15` }}
                      >
                        <StepIcon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: step.color }} />
                      </div>

                      {/* Content */}
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-1.5 sm:mb-2 pr-6">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-white/50 leading-relaxed line-clamp-3">{step.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-8 sm:mb-12 md:mb-16"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading">
                  Powerful Publishing Features
                </h2>
                <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto px-2">
                  Everything you need to manage your social media presence
                </p>
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hover:border-white/20 transition-colors group"
                    style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
                  >
                    <motion.div
                      className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                      style={{ backgroundColor: `${feature.color}20` }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: feature.color }} />
                    </motion.div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50 line-clamp-2 sm:line-clamp-none">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Visual Demo Section - Cinematic Distribution Flow */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-[1400px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.9)" }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Gradient Orbs */}
                  <motion.div 
                    className="absolute top-0 left-1/4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-primary/20 rounded-full blur-[100px] sm:blur-[150px]"
                    animate={{ 
                      x: [0, 50, 0],
                      y: [0, 30, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute bottom-0 right-1/4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-pink-500/20 rounded-full blur-[100px] sm:blur-[150px]"
                    animate={{ 
                      x: [0, -50, 0],
                      y: [0, -30, 0],
                      scale: [1.2, 1, 1.2]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-cyan-500/10 rounded-full blur-[80px] sm:blur-[100px]"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  {/* Grid Pattern */}
                  <div 
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                      backgroundSize: '50px 50px'
                    }}
                  />
                </div>

                <div className="relative p-6 sm:p-8 md:p-16">
                  {/* Header */}
                  <div className="text-center mb-8 md:mb-16">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-4 sm:mb-6"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs sm:text-sm text-cyan-300">Instant Multi-Platform Distribution</span>
                    </motion.div>
                    
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-4 font-heading">
                      One Video, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-cyan-500">Four Platforms</span>
                    </h2>
                    <p className="text-white/50 max-w-2xl mx-auto text-sm sm:text-base md:text-lg px-4">
                      Watch your content seamlessly transform and distribute across all major platforms in real-time
                    </p>
                  </div>

                  {/* Main Visualization - Mobile Layout */}
                  <div className="md:hidden flex flex-col items-center gap-8">
                    {/* Central Video Source - Mobile */}
                    <motion.div
                      className="relative"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {/* Outer ring */}
                      <motion.div
                        className="absolute -inset-6 rounded-full border-2 border-dashed border-primary/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      />
                      
                      {/* Middle pulsing ring */}
                      <motion.div
                        className="absolute -inset-3 rounded-3xl"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
                          boxShadow: "0 0 40px rgba(139,92,246,0.4)"
                        }}
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      
                      {/* Main video container */}
                      <motion.div 
                        className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))",
                          border: "2px solid rgba(139,92,246,0.5)"
                        }}
                      >
                        {/* Animated background pattern */}
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.3) 0%, transparent 50%)"
                          }}
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        />
                        
                        {/* Video icon with pulse */}
                        <motion.div
                          className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              "0 0 15px rgba(139,92,246,0.5)",
                              "0 0 30px rgba(139,92,246,0.8)",
                              "0 0 15px rgba(139,92,246,0.5)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Video className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </motion.div>
                      </motion.div>
                      
                      {/* Label */}
                      <motion.div 
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-xs sm:text-sm font-bold whitespace-nowrap shadow-lg"
                        style={{ boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Your Video
                      </motion.div>
                    </motion.div>

                    {/* Animated Arrow Down - Mobile */}
                    <motion.div
                      className="flex flex-col items-center gap-1"
                      animate={{ y: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-transparent rounded-full" />
                      <ArrowRight className="w-5 h-5 text-primary rotate-90" />
                    </motion.div>

                    {/* Platform Cards Grid - Mobile */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                      {platforms.map((platform, index) => (
                        <motion.div
                          key={platform.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 0.5, 
                            delay: 0.3 + index * 0.1,
                            type: "spring",
                            stiffness: 200
                          }}
                          className="relative group"
                        >
                          <motion.div
                            className="relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border backdrop-blur-xl cursor-pointer overflow-hidden"
                            style={{ 
                              backgroundColor: `${platform.color}10`,
                              borderColor: `${platform.color}30`
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Platform Icon */}
                            <motion.div
                              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${platform.color}20` }}
                            >
                              <PlatformIcon platform={platform.id} className="w-5 h-5 sm:w-6 sm:h-6" />
                              
                              {/* Status indicator */}
                              <motion.div
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: platform.color }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Check className="w-2 h-2 text-white" />
                              </motion.div>
                            </motion.div>
                            
                            {/* Platform Info */}
                            <div className="text-center">
                              <div className="text-white font-semibold text-sm">{platform.name}</div>
                              <div className="text-[10px] sm:text-xs text-white/50">Ready to publish</div>
                            </div>
                            
                            {/* Progress bar */}
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 rounded-full"
                              style={{ backgroundColor: platform.color }}
                              initial={{ width: "0%" }}
                              whileInView={{ width: "100%" }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, delay: 0.8 + index * 0.2 }}
                            />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Main Visualization - Desktop Layout */}
                  <div className="relative h-[450px] hidden md:block">
                    
                    {/* SVG Connection Lines - Desktop Only */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 450" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        {/* Gradient for lines */}
                        <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#FF0000" />
                        </linearGradient>
                        <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#E4405F" />
                        </linearGradient>
                        <linearGradient id="line-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#00F2EA" />
                        </linearGradient>
                        <linearGradient id="line-gradient-4" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#1877F2" />
                        </linearGradient>
                        
                        {/* Glow filter */}
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Connection paths from center to platforms */}
                      {[
                        { endX: 750, endY: 80, color: "#FF0000", gradient: "url(#line-gradient-1)" },
                        { endX: 850, endY: 180, color: "#E4405F", gradient: "url(#line-gradient-2)" },
                        { endX: 850, endY: 280, color: "#00F2EA", gradient: "url(#line-gradient-3)" },
                        { endX: 750, endY: 380, color: "#1877F2", gradient: "url(#line-gradient-4)" },
                      ].map((path, i) => {
                        const startX = 350;
                        const startY = 225;
                        const controlX = (startX + path.endX) / 2;
                        
                        return (
                          <g key={i}>
                            {/* Base path */}
                            <motion.path
                              d={`M ${startX} ${startY} Q ${controlX} ${startY} ${path.endX} ${path.endY}`}
                              fill="none"
                              stroke={`${path.color}20`}
                              strokeWidth="2"
                              strokeDasharray="8 4"
                              initial={{ pathLength: 0 }}
                              whileInView={{ pathLength: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, delay: i * 0.2 }}
                            />
                            
                            {/* Animated energy flow */}
                            <motion.path
                              d={`M ${startX} ${startY} Q ${controlX} ${startY} ${path.endX} ${path.endY}`}
                              fill="none"
                              stroke={path.gradient}
                              strokeWidth="3"
                              strokeLinecap="round"
                              filter="url(#glow)"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ 
                                pathLength: [0, 1],
                                opacity: [0.8, 0]
                              }}
                              transition={{ 
                                duration: 2,
                                delay: i * 0.3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                            
                            {/* Traveling particle */}
                            <motion.circle
                              r="6"
                              fill={path.color}
                              filter="url(#glow)"
                            >
                              <animateMotion
                                dur={`${2.5 + i * 0.2}s`}
                                repeatCount="indefinite"
                                path={`M ${startX} ${startY} Q ${controlX} ${startY} ${path.endX} ${path.endY}`}
                              />
                            </motion.circle>
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* Central Video Source - Desktop */}
                    <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <motion.div
                        className="relative"
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {/* Outer ring */}
                        <motion.div
                          className="absolute -inset-8 rounded-full border-2 border-dashed border-primary/30"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        />
                        
                        {/* Middle pulsing ring */}
                        <motion.div
                          className="absolute -inset-4 rounded-3xl"
                          style={{ 
                            background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
                            boxShadow: "0 0 60px rgba(139,92,246,0.4)"
                          }}
                          animate={{ 
                            scale: [1, 1.05, 1],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        {/* Main video container */}
                        <motion.div 
                          className="relative w-52 h-52 rounded-3xl flex items-center justify-center overflow-hidden"
                          style={{ 
                            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))",
                            border: "2px solid rgba(139,92,246,0.5)"
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {/* Animated background pattern */}
                          <motion.div
                            className="absolute inset-0"
                            style={{
                              background: "radial-gradient(circle at 30% 30%, rgba(139,92,246,0.3) 0%, transparent 50%)"
                            }}
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          />
                          
                          {/* Video icon with pulse */}
                          <motion.div
                            className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"
                            animate={{ 
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 0 20px rgba(139,92,246,0.5)",
                                "0 0 40px rgba(139,92,246,0.8)",
                                "0 0 20px rgba(139,92,246,0.5)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Video className="w-10 h-10 text-white" />
                          </motion.div>
                        </motion.div>
                        
                        {/* Label */}
                        <motion.div 
                          className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-sm font-bold whitespace-nowrap shadow-lg"
                          style={{ boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Your Video
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    {/* Platform Cards - Desktop */}
                    <div className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col gap-4">
                      {platforms.map((platform, index) => (
                        <motion.div
                          key={platform.id}
                          initial={{ opacity: 0, x: 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 0.5, 
                            delay: 0.5 + index * 0.15,
                            type: "spring",
                            stiffness: 200
                          }}
                          whileHover={{ scale: 1.05, x: -10 }}
                          className="relative group"
                        >
                          <motion.div
                            className="relative flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl cursor-pointer overflow-hidden"
                            style={{ 
                              backgroundColor: `${platform.color}10`,
                              borderColor: `${platform.color}30`
                            }}
                          >
                            {/* Hover glow */}
                            <motion.div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{
                                background: `radial-gradient(circle at 0% 50%, ${platform.color}30 0%, transparent 70%)`
                              }}
                            />
                            
                            {/* Platform Icon */}
                            <motion.div
                              className="relative w-14 h-14 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${platform.color}20` }}
                              whileHover={{ rotate: [0, -5, 5, 0] }}
                              transition={{ duration: 0.5 }}
                            >
                              <PlatformIcon platform={platform.id} className="w-7 h-7" />
                              
                              {/* Status indicator */}
                              <motion.div
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: platform.color }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <Check className="w-2.5 h-2.5 text-white" />
                              </motion.div>
                            </motion.div>
                            
                            {/* Platform Info */}
                            <div className="relative">
                              <div className="text-white font-bold">{platform.name}</div>
                              <div className="text-xs text-white/50">Ready to publish</div>
                            </div>
                            
                            {/* Progress bar */}
                            <motion.div
                              className="absolute bottom-0 left-0 h-0.5 rounded-full"
                              style={{ backgroundColor: platform.color }}
                              initial={{ width: "0%" }}
                              whileInView={{ width: "100%" }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, delay: 1 + index * 0.2 }}
                            />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
                  >
                    {[
                      { value: "1", label: "Video Upload", color: "#8B5CF6", icon: Video },
                      { value: "4", label: "Platforms", color: "#EC4899", icon: Globe },
                      { value: "<1s", label: "Distribution Time", color: "#06B6D4", icon: Zap },
                      { value: "AI", label: "Auto-Optimization", color: "#10B981", icon: Sparkles }
                    ].map((stat, i) => {
                      const StatIcon = stat.icon;
                      return (
                        <motion.div
                          key={i}
                          className="text-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10"
                          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                          whileHover={{ 
                            scale: 1.05,
                            borderColor: stat.color,
                            backgroundColor: `${stat.color}10`
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                            <StatIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                            <span className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: stat.color }}>
                              {stat.value}
                            </span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-white/40">{stat.label}</div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="py-12 sm:py-16 md:py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-white/10 relative overflow-hidden"
                style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
              >
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-primary/20 rounded-full blur-[100px]" />
                  <div className="absolute bottom-0 right-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-pink-500/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative">
                  <motion.div
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center mx-auto mb-4 sm:mb-5 md:mb-6"
                    animate={{ 
                      boxShadow: [
                        "0 0 30px rgba(139,92,246,0.3)",
                        "0 0 60px rgba(139,92,246,0.5)",
                        "0 0 30px rgba(139,92,246,0.3)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 font-heading px-2">
                    Ready to Reach Your Audience?
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 mb-6 sm:mb-8 max-w-lg mx-auto px-2">
                    Connect your social accounts and start publishing your AI-generated 
                    videos to millions of viewers worldwide.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <motion.button
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    <motion.button
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/20 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View Documentation
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <Footer />
        </div>
      </main>
    </div>
  );
}

// Platform Icon Component
function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const iconStyle = "w-full h-full";
  
  switch (platform) {
    case "youtube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case "instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="url(#instagram-gradient)">
          <defs>
            <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFDC80" />
              <stop offset="50%" stopColor="#F56040" />
              <stop offset="100%" stopColor="#C13584" />
            </linearGradient>
          </defs>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case "tiktok":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="white">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    default:
      return null;
  }
}
