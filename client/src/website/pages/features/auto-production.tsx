import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useScroll, useMotionValueEvent, useVelocity, AnimatePresence, useInView } from "framer-motion";
import { Header } from "@/website/components/layout/header";
import { Footer } from "@/website/components/layout/footer";
import { LightPillar, LightPillarRef } from "@/website/components/ui/light-pillar";
import BlurText from "@/website/components/ui/blur-text";
import { 
  Play,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Video,
  Rocket,
  Star,
  Lightbulb,
  FileText,
  Image,
  Music,
  Download,
  Zap,
  CheckCircle2,
  Clock,
  Wand2,
  Target,
  Eye,
  Calendar,
  TrendingUp,
  Award,
  Layers,
  RefreshCw,
  Volume2,
  Palette,
  Share2,
  Instagram,
  Youtube,
  Settings,
  Plus,
  Check,
  Bot,
  Globe,
  BarChart3,
  Users,
  PlayCircle,
  BookOpen,
  Film,
  Timer,
  Repeat,
  Send,
  CalendarCheck,
  CalendarDays,
  AlarmClock,
  Workflow,
  Cpu,
  CirclePlay,
  MonitorPlay,
  Bell
} from "lucide-react";
import { SiTiktok } from "react-icons/si";

// Production Modes
const productionModes = [
  {
    id: "auto-video",
    name: "Auto Video",
    tagline: "Full-Length Video Automation",
    description: "Automatically generate complete videos with AI-powered narratives, characters, and scenes",
    icon: Video,
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
    features: ["Narrative Videos", "Character Vlogs", "Ambient Visuals", "Social Commerce", "Logo Animation", "Video Podcast"],
    modes: [
      { name: "Narrative Video", description: "Cinematic storytelling", icon: Film },
      { name: "Character Vlog", description: "AI character hosts", icon: Users },
      { name: "Ambient Visual", description: "Relaxing visuals", icon: Eye },
      { name: "Social Commerce", description: "Product showcases", icon: Target },
      { name: "Logo Animation", description: "Animated logos", icon: Sparkles },
      { name: "Video Podcast", description: "Audio to video", icon: MonitorPlay }
    ]
  },
  {
    id: "auto-story",
    name: "Auto Story",
    tagline: "Short-Form Content at Scale",
    description: "Create viral short-form social content using proven templates for maximum engagement",
    icon: Zap,
    color: "#A855F7",
    gradient: "from-purple-500 to-pink-500",
    features: ["Problem-Solution", "Tease & Reveal", "Before & After", "Myth-Busting", "ASMR", "Auto-ASMR"],
    modes: [
      { name: "Problem-Solution", description: "Pain to solution", icon: Target },
      { name: "Tease & Reveal", description: "Build curiosity", icon: Eye },
      { name: "Before & After", description: "Show transformation", icon: RefreshCw },
      { name: "Myth-Busting", description: "Challenge myths", icon: Lightbulb },
      { name: "ASMR / Sensory", description: "Satisfying content", icon: Volume2 },
      { name: "Auto-ASMR", description: "AI relaxation", icon: Sparkles }
    ]
  }
];

// Workflow Steps
const workflowSteps = [
  {
    id: 1,
    name: "Campaign Setup",
    icon: Settings,
    color: "#F59E0B",
    description: "Name your campaign and define your goals",
    details: ["Campaign title", "Production mode", "Target platforms"]
  },
  {
    id: 2,
    name: "Topics Input",
    icon: FileText,
    color: "#8B5CF6",
    description: "Add up to 10 topics for batch generation",
    details: ["Multiple topics", "AI suggestions", "Bulk import"]
  },
  {
    id: 3,
    name: "Style Settings",
    icon: Palette,
    color: "#EC4899",
    description: "Configure visual style and audio preferences",
    details: ["Image model", "Video style", "Voice selection", "Music style"]
  },
  {
    id: 4,
    name: "Schedule",
    icon: Calendar,
    color: "#10B981",
    description: "Set your content calendar and posting times",
    details: ["Start date", "Frequency", "Best times", "Platform rules"]
  },
  {
    id: 5,
    name: "Launch",
    icon: Rocket,
    color: "#06B6D4",
    description: "Review and start automated production",
    details: ["Preview", "Confirm", "Auto-publish", "Notifications"]
  }
];

// Platforms
const platforms = [
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "#000000" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000" },
];

// Sample Schedule Data
const generateScheduleData = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const schedule = [];
  
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const hasContent = Math.random() > 0.3;
      if (hasContent) {
        schedule.push({
          week,
          day,
          dayName: days[day],
          time: `${9 + Math.floor(Math.random() * 12)}:00`,
          platform: platforms[Math.floor(Math.random() * platforms.length)],
          status: week < 1 ? "published" : week < 2 ? "scheduled" : "pending"
        });
      }
    }
  }
  return schedule;
};

// Animated Counter
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
      {count}{suffix}
    </div>
  );
}

// Interactive Demo Component
function InteractiveDemo() {
  const [activeMode, setActiveMode] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [topics, setTopics] = useState(["AI in Marketing", "Social Media Tips", "Content Creation"]);
  const [campaignName] = useState("Summer Campaign 2024");
  
  const currentMode = productionModes[activeMode];

  // Auto-progress steps
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= workflowSteps.length - 1) {
          setTimeout(() => {
            setActiveStep(0);
            setActiveMode(m => (m + 1) % productionModes.length);
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="relative">
      {/* Main Demo Container */}
      <motion.div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10"
        style={{ backgroundColor: 'rgba(13, 13, 13, 0.9)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Glowing Border Animation */}
        <motion.div
          className="absolute -inset-px rounded-2xl sm:rounded-3xl opacity-50 -z-10"
          style={{ 
            background: `conic-gradient(from 0deg, ${currentMode.color}40, transparent, ${currentMode.color}40)` 
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Mode Toggle */}
              <div className="flex bg-white/5 rounded-xl p-1 w-full sm:w-auto">
                {productionModes.map((mode, index) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => { setActiveMode(index); setActiveStep(0); }}
                      className={`relative flex-1 sm:flex-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all ${
                        activeMode === index ? 'text-white' : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      {activeMode === index && (
                        <motion.div
                          layoutId="activeModeBg"
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: `${mode.color}30` }}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="text-xs sm:text-sm font-medium relative z-10">{mode.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs sm:text-sm text-white/60">Live Preview</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left: Workflow Visualization */}
            <div className="space-y-4 sm:space-y-6">
              {/* Campaign Info */}
              <motion.div
                key={`campaign-${activeMode}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentMode.color}30` }}
                  >
                    {(() => {
                      const Icon = currentMode.icon;
                      return <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: currentMode.color }} />;
                    })()}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-white/50">Campaign</div>
                    <div className="text-sm sm:text-base text-white font-semibold">{campaignName}</div>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {topics.map((topic, i) => (
                    <motion.span
                      key={topic}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs bg-white/10 text-white/70"
                    >
                      {topic}
                    </motion.span>
                  ))}
                  <button className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/40 border border-dashed border-white/20 hover:border-white/40 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>

              {/* Workflow Steps */}
              <div className="space-y-2 sm:space-y-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === activeStep;
                  const isPast = index < activeStep;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setActiveStep(index)}
                      className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl border cursor-pointer transition-all ${
                        isActive 
                          ? 'border-transparent' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                      style={{
                        backgroundColor: isActive ? `${step.color}15` : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      {/* Progress Line */}
                      {index < workflowSteps.length - 1 && (
                        <div 
                          className="absolute left-[22px] sm:left-7 top-12 sm:top-14 w-0.5 h-3 sm:h-4"
                          style={{ 
                            backgroundColor: isPast ? step.color : 'rgba(255,255,255,0.1)' 
                          }}
                        />
                      )}

                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Step Icon */}
                        <motion.div
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive || isPast ? '' : 'bg-white/5'
                          }`}
                          style={{
                            backgroundColor: isActive || isPast ? step.color : undefined
                          }}
                          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          {isPast ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          ) : (
                            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive || isPast ? 'text-white' : 'text-white/40'}`} />
                          )}
                        </motion.div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs sm:text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                            {step.name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-white/40 truncate">{step.description}</div>
                        </div>

                        {/* Status */}
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: `${step.color}30`, color: step.color }}
                          >
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: step.color }}
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            In Progress
                          </motion.div>
                        )}
                        {isPast && (
                          <div className="text-[10px] sm:text-xs text-green-400">Done</div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Preview/Calendar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Mode Templates */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`templates-${activeMode}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="text-xs sm:text-sm font-medium text-white/70">Available Modes</div>
                    <div className="text-[10px] sm:text-xs text-white/40">{currentMode.modes.length} templates</div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {currentMode.modes.map((mode, i) => {
                      const Icon = mode.icon;
                      return (
                        <motion.div
                          key={mode.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div 
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                              style={{ backgroundColor: `${currentMode.color}20` }}
                            >
                              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: currentMode.color }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] sm:text-xs font-medium text-white/80 group-hover:text-white transition-colors truncate">
                                {mode.name}
                              </div>
                              <div className="text-[8px] sm:text-[10px] text-white/40 truncate hidden sm:block">{mode.description}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Mini Calendar Preview */}
              <motion.div
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    <span className="text-xs sm:text-sm font-medium text-white/70">Schedule Preview</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/40">January 2024</div>
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <div key={i} className="text-center text-[8px] sm:text-[10px] text-white/30 py-0.5 sm:py-1">{day}</div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {Array.from({ length: 28 }, (_, i) => {
                    const hasPost = Math.random() > 0.5;
                    const isToday = i === 14;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className={`relative aspect-square rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs transition-all cursor-pointer ${
                          isToday 
                            ? 'bg-white/20 text-white' 
                            : hasPost 
                              ? 'bg-white/5 text-white/60 hover:bg-white/10' 
                              : 'text-white/20 hover:bg-white/5'
                        }`}
                      >
                        {i + 1}
                        {hasPost && (
                          <motion.div
                            className="absolute bottom-0.5 sm:bottom-1 w-0.5 sm:w-1 h-0.5 sm:h-1 rounded-full"
                            style={{ backgroundColor: currentMode.color }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-white">12</div>
                    <div className="text-[8px] sm:text-[10px] text-white/40">Scheduled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-green-400">8</div>
                    <div className="text-[8px] sm:text-[10px] text-white/40">Published</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-amber-400">4</div>
                    <div className="text-[8px] sm:text-[10px] text-white/40">Pending</div>
                  </div>
                </div>
              </motion.div>

              {/* Platform Distribution - Hidden on very small screens */}
              <div className="hidden sm:flex gap-2">
                {platforms.map((platform, i) => {
                  const Icon = platform.icon;
                  return (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: platform.color }} />
                        <span className="text-[10px] sm:text-xs text-white/60">{platform.name}</span>
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-white">{4 + Math.floor(Math.random() * 5)}</div>
                      <div className="text-[8px] sm:text-[10px] text-white/40">posts/week</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/50">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              AI Processing
            </div>
            <motion.div 
              className="flex gap-0.5"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                  style={{ backgroundColor: currentMode.color }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r ${currentMode.gradient}`}
          >
            <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Launch Campaign
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// How It Works Section
function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % workflowSteps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 md:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4 sm:mb-6"
          >
            <Workflow className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-xs sm:text-sm text-amber-300">5-Step Workflow</span>
          </motion.div>

          <BlurText
            text="How Auto Production Works"
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
            Set up once, publish forever. Our AI handles everything automatically.
          </motion.p>
        </div>

        {/* Steps Visualization */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-16 left-0 right-0 h-1 bg-white/5 hidden lg:block">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-500"
              style={{ width: `${((activeStep + 1) / workflowSteps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Mobile: Horizontal scroll steps */}
          <div className="md:hidden overflow-x-auto scrollbar-hide mb-6">
            <div className="flex gap-2 px-2 pb-2 min-w-max">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isPast = index < activeStep;
                
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                      isActive ? 'border-transparent' : 'border-white/10 bg-white/5'
                    }`}
                    style={{ 
                      backgroundColor: isActive ? step.color : undefined,
                      boxShadow: isActive ? `0 0 20px ${step.color}40` : undefined
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className={`w-4 h-4 ${isActive || isPast ? 'text-white' : 'text-white/50'}`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {step.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Mobile: Active step card */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: workflowSteps[activeStep].color }}
                  >
                    {(() => {
                      const Icon = workflowSteps[activeStep].icon;
                      return <Icon className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                  <div>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ 
                        backgroundColor: `${workflowSteps[activeStep].color}30`,
                        color: workflowSteps[activeStep].color
                      }}
                    >
                      Step {workflowSteps[activeStep].id}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-1">{workflowSteps[activeStep].name}</h3>
                  </div>
                </div>
                <p className="text-sm text-white/60 mb-4">{workflowSteps[activeStep].description}</p>
                <div className="space-y-2">
                  {workflowSteps[activeStep].details.map((detail, i) => (
                    <div key={detail} className="flex items-center gap-2 text-xs text-white/60">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: workflowSteps[activeStep].color }} />
                      {detail}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isPast = index < activeStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveStep(index)}
                  className="relative cursor-pointer group"
                >
                  {/* Step Circle */}
                  <div className="flex justify-center mb-4 md:mb-6">
                    <motion.div
                      className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                        isActive || isPast ? '' : 'bg-white/5 border-white/10'
                      }`}
                      style={{
                        backgroundColor: isActive || isPast ? step.color : undefined,
                        borderColor: isActive || isPast ? step.color : undefined,
                        boxShadow: isActive ? `0 0 30px ${step.color}50` : undefined
                      }}
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                    >
                      <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isActive || isPast ? 'text-white' : 'text-white/40'}`} />
                      
                      {/* Pulse Ring */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-xl md:rounded-2xl"
                          style={{ border: `2px solid ${step.color}` }}
                          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold"
                        style={{ 
                          backgroundColor: isActive || isPast ? `${step.color}30` : 'rgba(255,255,255,0.05)',
                          color: isActive || isPast ? step.color : 'rgba(255,255,255,0.4)'
                        }}
                      >
                        Step {step.id}
                      </span>
                    </div>
                    <h3 className={`text-base md:text-lg font-semibold mb-1 md:mb-2 transition-colors ${
                      isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'
                    }`}>
                      {step.name}
                    </h3>
                    <p className="text-xs md:text-sm text-white/40">{step.description}</p>

                    {/* Details */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 md:mt-4 space-y-1"
                        >
                          {step.details.map((detail, i) => (
                            <motion.div
                              key={detail}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center justify-center gap-2 text-[10px] md:text-xs text-white/60"
                            >
                              <CheckCircle2 className="w-3 h-3" style={{ color: step.color }} />
                              {detail}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// Calendar Showcase Section
function CalendarShowcase() {
  const scheduleData = useMemo(() => generateScheduleData(), []);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const shortDays = ["M", "T", "W", "T", "F", "S", "S"];

  const weekData = scheduleData.filter(s => s.week === selectedWeek);

  return (
    <section className="py-16 sm:py-24 md:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 mb-4 sm:mb-6"
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm text-emerald-300">Smart Scheduling</span>
          </motion.div>

          <BlurText
            text="Automated Content Calendar"
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
            AI schedules your content at optimal times for each platform. Never miss a posting window.
          </motion.p>
        </div>

        {/* Calendar Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10"
          style={{ backgroundColor: 'rgba(13, 13, 13, 0.9)' }}
        >
          {/* Calendar Header */}
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              <div>
                <h3 className="text-sm sm:text-lg font-semibold text-white">Content Schedule</h3>
                <p className="text-xs sm:text-sm text-white/50">Week {selectedWeek + 1} of 4</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setSelectedWeek(w => Math.max(0, w - 1))}
                className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                disabled={selectedWeek === 0}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
              </button>
              <button 
                onClick={() => setSelectedWeek(w => Math.min(3, w + 1))}
                className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                disabled={selectedWeek === 3}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {days.map((day, i) => (
              <div 
                key={day} 
                className={`p-2 sm:p-4 text-center text-xs sm:text-sm font-medium border-r border-white/5 last:border-r-0 ${
                  i === 5 || i === 6 ? 'text-white/30' : 'text-white/60'
                }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{shortDays[i]}</span>
              </div>
            ))}
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-7">
            {days.map((_, dayIndex) => {
              const daySchedule = weekData.filter(s => s.day === dayIndex);
              const isWeekend = dayIndex === 5 || dayIndex === 6;

              return (
                <motion.div
                  key={dayIndex}
                  className={`min-h-[100px] sm:min-h-[150px] md:min-h-[200px] p-1.5 sm:p-2 md:p-3 border-r border-white/5 last:border-r-0 transition-colors ${
                    hoveredDay === dayIndex ? 'bg-white/5' : isWeekend ? 'bg-white/[0.01]' : ''
                  }`}
                  onMouseEnter={() => setHoveredDay(dayIndex)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Day Number */}
                  <div className="text-right mb-1.5 sm:mb-2 md:mb-3">
                    <span className={`text-xs sm:text-sm md:text-lg font-bold ${isWeekend ? 'text-white/20' : 'text-white/40'}`}>
                      {selectedWeek * 7 + dayIndex + 1}
                    </span>
                  </div>

                  {/* Scheduled Posts */}
                  <div className="space-y-1 sm:space-y-2">
                    <AnimatePresence>
                      {daySchedule.slice(0, 2).map((post, i) => {
                        const PlatformIcon = post.platform.icon;
                        return (
                          <motion.div
                            key={`${post.week}-${post.day}-${i}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                              post.status === 'published' 
                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                : post.status === 'scheduled'
                                  ? 'bg-blue-500/10 border-blue-500/30'
                                  : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-1 sm:gap-2">
                              <PlatformIcon 
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" 
                                style={{ color: post.platform.color }} 
                              />
                              <span className="text-[8px] sm:text-[10px] md:text-xs text-white/70 hidden sm:inline">{post.time}</span>
                            </div>
                            <div className="mt-0.5 sm:mt-1 hidden sm:block">
                              <span className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded ${
                                post.status === 'published' 
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : post.status === 'scheduled'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {post.status}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      {daySchedule.length > 2 && (
                        <div className="text-[8px] sm:text-[10px] text-white/40 text-center">
                          +{daySchedule.length - 2} more
                        </div>
                      )}
                    </AnimatePresence>

                    {daySchedule.length === 0 && hoveredDay === dayIndex && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hidden md:flex w-full p-2 sm:p-3 rounded-lg border border-dashed border-white/20 text-white/40 text-xs hover:border-white/40 hover:text-white/60 transition-colors items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Calendar Footer Stats */}
          <div className="p-4 sm:p-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: "Total Scheduled", value: scheduleData.length, icon: CalendarCheck, color: "#10B981" },
              { label: "Published", value: scheduleData.filter(s => s.status === 'published').length, icon: CheckCircle2, color: "#3B82F6" },
              { label: "This Week", value: weekData.length, icon: Timer, color: "#F59E0B" },
              { label: "Automation", value: "100%", icon: Bot, color: "#A855F7" }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-white/50">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Features Section
const features = [
  {
    icon: Bot,
    title: "Full Automation",
    description: "Set up once and let AI handle everything - from content creation to publishing"
  },
  {
    icon: Cpu,
    title: "Batch Generation",
    description: "Input 10 topics, get 10 complete videos or stories ready for publishing"
  },
  {
    icon: CalendarDays,
    title: "Smart Scheduling",
    description: "AI finds the optimal posting times for maximum engagement on each platform"
  },
  {
    icon: Share2,
    title: "Multi-Platform",
    description: "One click to publish across TikTok, Instagram, YouTube, and more"
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track performance and let AI optimize your content strategy"
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Get notified when content is published or needs your attention"
  }
];

export default function AutoProductionPage() {
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
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span className="text-xs sm:text-sm text-violet-300">AI-Powered Automation</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
              </motion.div>

              {/* Title */}
              <BlurText
                text="Content Production on Autopilot"
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
                Set up your campaign. Input your topics. Let AI create, schedule, and publish 
                content automatically across all platforms.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:flex sm:justify-center gap-4 sm:gap-8 md:gap-12 mb-10 sm:mb-12 md:mb-16 px-4 sm:px-0"
              >
                {[
                  { value: 2, label: "Production Modes", suffix: "" },
                  { value: 12, label: "Content Templates", suffix: "" },
                  { value: 10, label: "Topics per Batch", suffix: "" },
                  { value: 100, label: "Automation", suffix: "%" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <div className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <InteractiveDemo />
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <HowItWorksSection />

        {/* Calendar Showcase */}
        <CalendarShowcase />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MODES COMPARISON */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4 sm:mb-6"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-xs sm:text-sm text-blue-300">Two Powerful Modes</span>
              </motion.div>

              <BlurText
                text="Choose Your Production Mode"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white"
                delay={100}
                animateBy="words"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {productionModes.map((mode, index) => {
                const Icon = mode.icon;
                return (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ y: -10 }}
                    className="relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden group cursor-pointer"
                    style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
                  >
                    {/* Gradient Background */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at top left, ${mode.color}20, transparent 60%)` }}
                    />

                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 sm:mb-6">
                        <div 
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${mode.color}40, ${mode.color}20)` }}
                        >
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" style={{ color: mode.color }} />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">{mode.name}</h3>
                      <p className="text-sm sm:text-base md:text-lg mb-1 sm:mb-2" style={{ color: mode.color }}>{mode.tagline}</p>
                      <p className="text-white/50 mb-4 sm:mb-6 text-sm sm:text-base">{mode.description}</p>

                      {/* Modes Grid */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        {mode.modes.map((subMode) => {
                          const SubIcon = subMode.icon;
                          return (
                            <div 
                              key={subMode.name}
                              className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5 sm:gap-2"
                            >
                              <SubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: mode.color }} />
                              <div className="min-w-0">
                                <div className="text-[10px] sm:text-xs font-medium text-white/70 truncate">{subMode.name}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white flex items-center justify-center gap-2 bg-gradient-to-r ${mode.gradient}`}
                      >
                        Start with {mode.name}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

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
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-4 sm:mb-6"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="text-xs sm:text-sm text-cyan-300">Powerful Features</span>
              </motion.div>

              <BlurText
                text="Everything Automated"
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
                    className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-cyan-400" />
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
                  Start Automating Today
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
                  Join creators who save hours every week with automated content production.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-violet-500 to-pink-600 rounded-xl font-semibold text-base sm:text-lg text-white shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Launch Auto Production
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-base sm:text-lg text-white flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Watch Demo
                    <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
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
