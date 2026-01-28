import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import BlurText from "../ui/blur-text";
import { AnimatedCounter } from "../common";
import { 
  Rocket,
  Calendar,
  Video,
  Film,
  Zap,
  Clock,
  Bot,
  Sparkles,
  Play,
  Target,
  Eye,
  RefreshCw,
  Lightbulb,
  Volume2,
  Users,
  MonitorPlay,
  Send,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Waves
} from "lucide-react";

// Platform icons
const YouTubeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Production Modes Data
const productionModes = {
  video: {
    id: "video",
    name: "Auto Video",
    tagline: "Full-Length Videos",
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
    icon: Video,
    modes: [
      { name: "Narrative", icon: Film, description: "Cinematic stories" },
      { name: "Vlog", icon: Users, description: "AI characters" },
      { name: "Ambient", icon: Eye, description: "Relaxing visuals" },
      { name: "Commerce", icon: Target, description: "Product showcase" },
      { name: "Logo", icon: Sparkles, description: "Animated logos" },
      { name: "Podcast", icon: MonitorPlay, description: "Audio to video" },
    ]
  },
  story: {
    id: "story",
    name: "Auto Story",
    tagline: "Short-Form Content",
    color: "#A855F7",
    gradient: "from-purple-500 to-pink-500",
    icon: Zap,
    modes: [
      { name: "Problem-Solution", icon: Target, description: "Pain to gain" },
      { name: "Tease & Reveal", icon: Eye, description: "Build curiosity" },
      { name: "Before & After", icon: RefreshCw, description: "Transformation" },
      { name: "Myth-Busting", icon: Lightbulb, description: "Challenge myths" },
      { name: "ASMR", icon: Volume2, description: "Satisfying content" },
      { name: "Auto-ASMR", icon: Sparkles, description: "AI relaxation" },
    ]
  }
};

// Platforms
const platforms = [
  { id: "youtube", name: "YouTube", icon: YouTubeIcon, color: "#FF0000" },
  { id: "tiktok", name: "TikTok", icon: TikTokIcon, color: "#00F2EA" },
  { id: "instagram", name: "Instagram", icon: InstagramIcon, color: "#E4405F" },
  { id: "facebook", name: "Facebook", icon: FacebookIcon, color: "#1877F2" },
];

// Floating Particles Component
function FloatingParticles({ color, count = 20 }: { color: string; count?: number }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    })), [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// AI Engine Core Component
function AIEngineCore({ activeMode, isProcessing }: { activeMode: "video" | "story"; isProcessing: boolean }) {
  const mode = productionModes[activeMode];
  
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Rotating Ring */}
      <motion.div
        className="absolute w-48 h-48 rounded-full border-2 border-dashed"
        style={{ borderColor: `${mode.color}30` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle Pulsing Ring */}
      <motion.div
        className="absolute w-40 h-40 rounded-full"
        style={{ 
          border: `2px solid ${mode.color}`,
          boxShadow: `0 0 30px ${mode.color}40, inset 0 0 30px ${mode.color}20`
        }}
        animate={isProcessing ? { 
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5]
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Inner Core */}
      <motion.div
        className="relative w-32 h-32 rounded-full flex items-center justify-center"
        style={{ 
          background: `radial-gradient(circle, ${mode.color}40 0%, ${mode.color}10 70%, transparent 100%)`,
        }}
        animate={{ scale: isProcessing ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        {/* Central Icon */}
        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${mode.color}, ${mode.color}80)`,
            boxShadow: `0 0 40px ${mode.color}60`
          }}
          animate={isProcessing ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Bot className="w-10 h-10 text-white" />
        </motion.div>
      </motion.div>
      
      {/* Processing Indicator */}
      {isProcessing && (
        <motion.div
          className="absolute w-56 h-56 rounded-full border"
          style={{ borderColor: mode.color }}
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// Connection Line Component
function ConnectionLine({ 
  startX, startY, endX, endY, color, delay, isActive 
}: { 
  startX: number; startY: number; endX: number; endY: number; 
  color: string; delay: number; isActive: boolean;
}) {
  const midX = (startX + endX) / 2;
  const midY = startY - 30;
  
  const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {/* Base Path */}
      <motion.path
        d={path}
        fill="none"
        stroke={`${color}30`}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isActive ? 1 : 0.3 }}
        transition={{ duration: 1, delay }}
      />
      
      {/* Animated Glow Path */}
      {isActive && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      )}
      
      {/* Moving Dot */}
      {isActive && (
        <motion.circle
          r="4"
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{ 
            duration: 2,
            delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={path}
            begin={`${delay}s`}
          />
        </motion.circle>
      )}
    </svg>
  );
}

// Platform Node Component
function PlatformNode({ 
  platform, 
  position, 
  isActive,
  contentCount 
}: { 
  platform: typeof platforms[0]; 
  position: number;
  isActive: boolean;
  contentCount: number;
}) {
  const Icon = platform.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + position * 0.1 }}
    >
      <motion.div
        className="relative p-3 md:p-4 rounded-2xl border backdrop-blur-xl"
        style={{ 
          backgroundColor: `${platform.color}10`,
          borderColor: isActive ? platform.color : `${platform.color}30`
        }}
        whileHover={{ scale: 1.05, y: -5 }}
        animate={isActive ? { 
          boxShadow: [`0 0 20px ${platform.color}30`, `0 0 40px ${platform.color}50`, `0 0 20px ${platform.color}30`]
        } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* Platform Icon */}
        <div className="flex items-center gap-2 md:gap-3">
          <div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${platform.color}20` }}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: platform.color }} />
          </div>
          <div>
            <div className="text-white font-semibold text-sm md:text-base">{platform.name}</div>
            <div className="text-xs md:text-sm text-white/50">{contentCount} scheduled</div>
          </div>
        </div>
        
        {/* Status Indicator */}
        {isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: platform.color }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// Mode Card Component
function ModeCard({ 
  mode, 
  isActive, 
  onClick 
}: { 
  mode: typeof productionModes.video; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const Icon = mode.icon;
  
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border cursor-pointer transition-all overflow-hidden",
        isActive ? "border-transparent" : "border-white/10 hover:border-white/20"
      )}
      style={{ 
        backgroundColor: isActive ? `${mode.color}15` : "rgba(13, 13, 13, 0.6)"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active Glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 -z-10"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${mode.color}30 0%, transparent 70%)`
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        <motion.div
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${mode.color}40, ${mode.color}20)`,
            boxShadow: isActive ? `0 0 20px ${mode.color}40` : "none"
          }}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" style={{ color: mode.color }} />
        </motion.div>
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{mode.name}</h3>
          <p className="text-xs sm:text-sm" style={{ color: mode.color }}>{mode.tagline}</p>
        </div>
      </div>
      
      {/* Sub-modes Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {mode.modes.map((subMode, i) => {
          const SubIcon = subMode.icon;
          return (
            <motion.div
              key={subMode.name}
              className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white/5 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <SubIcon className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1" style={{ color: isActive ? mode.color : "rgba(255,255,255,0.4)" }} />
              <div className="text-[8px] sm:text-[10px] text-white/60 truncate">{subMode.name}</div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Selection Indicator */}
      {isActive && (
        <motion.div
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: mode.color }} />
        </motion.div>
      )}
    </motion.div>
  );
}

// Content Timeline Component
function ContentTimeline({ activeMode, isProcessing }: { activeMode: "video" | "story"; isProcessing: boolean }) {
  const mode = productionModes[activeMode];
  
  const contentItems = [
    { title: "AI Script Generation", status: "complete", time: "2s" },
    { title: "Visual Creation", status: isProcessing ? "processing" : "pending", time: "5s" },
    { title: "Audio Synthesis", status: "pending", time: "3s" },
    { title: "Final Render", status: "pending", time: "4s" },
    { title: "Auto Publish", status: "pending", time: "1s" },
  ];
  
  return (
    <div className="space-y-3">
      {contentItems.map((item, i) => {
        const isComplete = item.status === "complete";
        const isProcessingItem = item.status === "processing";
        
        return (
          <motion.div
            key={item.title}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              isComplete ? "border-green-500/30 bg-green-500/10" :
              isProcessingItem ? `border-transparent` : "border-white/5 bg-white/5"
            )}
            style={isProcessingItem ? { 
              borderColor: mode.color,
              backgroundColor: `${mode.color}10`
            } : {}}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Status Icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: isComplete ? "rgba(34, 197, 94, 0.2)" :
                                 isProcessingItem ? `${mode.color}20` : "rgba(255,255,255,0.05)"
              }}
            >
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : isProcessingItem ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu className="w-4 h-4" style={{ color: mode.color }} />
                </motion.div>
              ) : (
                <Clock className="w-4 h-4 text-white/30" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className={cn(
                "text-sm font-medium",
                isComplete ? "text-green-400" :
                isProcessingItem ? "text-white" : "text-white/40"
              )}>
                {item.title}
              </div>
            </div>
            
            {/* Time */}
            <div className={cn(
              "text-xs",
              isComplete ? "text-green-500/60" :
              isProcessingItem ? "text-white/60" : "text-white/20"
            )}>
              {item.time}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Main Component
export function AutoProduction() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeMode, setActiveMode] = useState<"video" | "story">("video");
  const [isProcessing, setIsProcessing] = useState(true);
  
  const currentMode = productionModes[activeMode];

  // Toggle processing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessing(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={containerRef} className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      {/* Background Particles */}
      <FloatingParticles color={currentMode.color} count={30} />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 mb-4 sm:mb-6"
          >
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
            <span className="text-xs sm:text-sm text-violet-300">AI-Powered Automation</span>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
          </motion.div>
          
          <BlurText
            text="Auto Production"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 font-heading"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-sm sm:text-base md:text-lg text-white/50 max-w-3xl mx-auto px-2"
          >
            Set up your campaign once and let AI handle the rest. Automatic content creation and scheduling across all platforms.
          </motion.p>
        </div>

        {/* Command Center */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden mb-8 sm:mb-12 md:mb-16"
          style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
        >
          {/* Animated Border */}
          <motion.div
            className="absolute -inset-px rounded-2xl sm:rounded-3xl opacity-50 -z-10"
            style={{ 
              background: `conic-gradient(from 0deg, ${currentMode.color}40, transparent, ${currentMode.color}40)` 
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Mode Selector */}
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
              <ModeCard 
                mode={productionModes.video} 
                isActive={activeMode === "video"}
                onClick={() => setActiveMode("video")}
              />
              <ModeCard 
                mode={productionModes.story} 
                isActive={activeMode === "story"}
                onClick={() => setActiveMode("story")}
              />
            </div>
            
            {/* AI Engine Visualization */}
            <div className="relative h-[380px] sm:h-[400px] md:h-[450px] my-4 sm:my-6 md:my-8">
              {/* Connection Lines to Platforms - Hidden on small screens */}
              <div className="absolute inset-0 hidden sm:block">
                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
                  {/* Lines from center to platforms */}
                  {platforms.map((platform, i) => {
                    const centerX = 500;
                    const centerY = 120;
                    // Position 4 platforms evenly: 100, 366, 633, 900
                    const endX = 100 + i * 266;
                    const endY = 350;
                    const midY = (centerY + endY) / 2 - 50;
                    
                    return (
                      <g key={platform.id}>
                        {/* Base path */}
                        <motion.path
                          d={`M ${centerX} ${centerY} Q ${(centerX + endX) / 2} ${midY} ${endX} ${endY}`}
                          fill="none"
                          stroke={`${platform.color}30`}
                          strokeWidth="2"
                          strokeDasharray="8 4"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                        />
                        
                        {/* Animated glow */}
                        {isProcessing && (
                          <motion.path
                            d={`M ${centerX} ${centerY} Q ${(centerX + endX) / 2} ${midY} ${endX} ${endY}`}
                            fill="none"
                            stroke={platform.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ 
                              pathLength: [0, 1],
                              opacity: [0.8, 0]
                            }}
                            transition={{ 
                              duration: 2,
                              delay: i * 0.25,
                              repeat: Infinity,
                            }}
                            style={{ filter: `drop-shadow(0 0 10px ${platform.color})` }}
                          />
                        )}
                        
                        {/* Moving particles along path */}
                        {isProcessing && (
                          <motion.circle
                            r="5"
                            fill={platform.color}
                            style={{ filter: `drop-shadow(0 0 8px ${platform.color})` }}
                          >
                            <animateMotion
                              dur={`${1.8 + i * 0.15}s`}
                              repeatCount="indefinite"
                              path={`M ${centerX} ${centerY} Q ${(centerX + endX) / 2} ${midY} ${endX} ${endY}`}
                            />
                          </motion.circle>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* Central AI Engine */}
              <div className="absolute left-1/2 top-8 sm:top-12 md:top-16 -translate-x-1/2 scale-75 sm:scale-90 md:scale-100">
                <AIEngineCore activeMode={activeMode} isProcessing={isProcessing} />
                
                {/* Processing Status */}
                <motion.div
                  className="absolute -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-xs sm:text-sm font-medium" style={{ color: currentMode.color }}>
                    {isProcessing ? "Processing Content..." : "Ready"}
                  </span>
                </motion.div>
              </div>
              
              {/* Platform Nodes */}
              <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 px-1 sm:px-2 md:px-8">
                {platforms.map((platform, i) => (
                  <PlatformNode
                    key={platform.id}
                    platform={platform}
                    position={i}
                    isActive={isProcessing}
                    contentCount={4 + i * 2}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Section: Timeline + Stats */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Content Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10"
            style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${currentMode.color}20` }}
              >
                <Waves className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentMode.color }} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white">Production Pipeline</h3>
                <p className="text-xs sm:text-sm text-white/40">Real-time processing status</p>
              </div>
            </div>
            
            <ContentTimeline activeMode={activeMode} isProcessing={isProcessing} />
          </motion.div>
          
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4"
          >
            {[
              { icon: Video, value: "12", label: "Content Types", color: "#8B5CF6" },
              { icon: Calendar, value: "10", label: "Topics/Batch", color: "#EC4899" },
              { icon: Rocket, value: "4", label: "Platforms", color: "#06B6D4" },
              { icon: Zap, value: "100%", label: "Automated", color: "#F59E0B" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border border-white/10 text-center"
                  style={{ backgroundColor: "rgba(13, 13, 13, 0.6)" }}
                >
                  <div 
                    className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: stat.color }} />
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1">
                    <AnimatedCounter value={stat.value} duration={2} />
                  </div>
                  <div className="text-xs sm:text-sm text-white/50">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-8 sm:mt-10 md:mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg text-white transition-all",
              `bg-gradient-to-r ${currentMode.gradient}`
            )}
            style={{ boxShadow: `0 0 30px ${currentMode.color}40` }}
          >
            <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
            Launch Auto Production
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

export default AutoProduction;
