import { useRef, useState, useEffect } from "react";
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
  MessageSquare,
  TrendingUp,
  Award,
  Layers,
  RefreshCw,
  Volume2,
  Palette,
  Share2,
  Instagram,
  Youtube,
  AlertCircle,
  HelpCircle,
  Shuffle,
  Gift,
  BookOpen,
  Film
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import {
  homeStep1,
  homeStep2,
  homeStep3,
  homeStep4,
  homeStep5,
  homeStep6
} from "@/website/assets/images";

// 5 Steps of Story Creation
const storySteps = [
  {
    id: 1,
    name: "Concept",
    shortName: "Concept",
    icon: Lightbulb,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    description: "Define your story idea and let AI generate the script",
    details: [
      "Enter your topic or idea",
      "AI generates compelling script",
      "Choose aspect ratio & duration",
      "Set language & voiceover options"
    ],
    features: ["AI Script Generation", "Multi-language", "Custom Duration", "Voice Settings"]
  },
  {
    id: 2,
    name: "Script",
    shortName: "Script",
    icon: FileText,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-600",
    description: "Review and refine your AI-generated script",
    details: [
      "Edit and polish the script",
      "Adjust scene descriptions",
      "Fine-tune narration text",
      "Optimize for engagement"
    ],
    features: ["Script Editor", "Scene Breakdown", "Narration Control", "Real-time Preview"]
  },
  {
    id: 3,
    name: "Storyboard",
    shortName: "Storyboard",
    icon: Image,
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-600",
    description: "Generate stunning visuals for each scene",
    details: [
      "AI generates images for each scene",
      "Multiple image models available",
      "Add animations & transitions",
      "Regenerate any scene instantly"
    ],
    features: ["15+ Image Models", "Video Animation", "Transitions", "Batch Generation"]
  },
  {
    id: 4,
    name: "Audio",
    shortName: "Audio",
    icon: Music,
    color: "#10B981",
    gradient: "from-emerald-500 to-green-600",
    description: "Add voice-over and background music",
    details: [
      "50+ AI voices available",
      "Multiple languages & accents",
      "AI-generated background music",
      "Volume control & mixing"
    ],
    features: ["50+ Voices", "AI Music", "Sound Effects", "Audio Mixing"]
  },
  {
    id: 5,
    name: "Export",
    shortName: "Export",
    icon: Download,
    color: "#06B6D4",
    gradient: "from-cyan-500 to-blue-600",
    description: "Preview and export your finished story",
    details: [
      "Real-time video preview",
      "Multiple export formats",
      "Up to 4K quality",
      "Direct social media publishing"
    ],
    features: ["4K Export", "Multi-format", "Direct Publish", "Custom Quality"]
  }
];

// 6 Story Templates
const storyTemplates = [
  {
    id: "problem-solution",
    name: "Problem-Solution",
    tagline: "Convert Pain Points to Sales",
    description: "Present a problem and show how your product/idea solves it. Perfect for marketing and product launches.",
    longDescription: "The most effective marketing framework. Hook your audience with a relatable problem, then reveal your solution as the hero.",
    icon: Target,
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-600",
    image: homeStep1,
    structure: ["Hook", "Problem", "Solution", "Call-to-Action"],
    duration: "30-60s",
    difficulty: "Beginner",
    popular: true,
    useCases: ["Product Launches", "Service Demos", "Pain Point Marketing", "Landing Pages"],
    category: "Marketing"
  },
  {
    id: "tease-reveal",
    name: "Tease & Reveal",
    tagline: "Build Curiosity & Surprise",
    description: "Build curiosity with a teaser, then reveal the answer or product. Great for announcements and mystery content.",
    longDescription: "Create anticipation and excitement by teasing something intriguing, then deliver a satisfying reveal that keeps viewers engaged.",
    icon: Gift,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-fuchsia-500",
    image: homeStep2,
    structure: ["Hook", "Tease", "Buildup", "Reveal"],
    duration: "15-45s",
    difficulty: "Intermediate",
    popular: true,
    useCases: ["Product Reveals", "Announcements", "Mystery Content", "Brand Launches"],
    category: "Marketing"
  },
  {
    id: "before-after",
    name: "Before & After",
    tagline: "Show Transformation",
    description: "Showcase a transformation journey. Great for tutorials, testimonials, and case studies.",
    longDescription: "Nothing sells like proof. Show the dramatic difference your product or service makes with compelling before and after visuals.",
    icon: RefreshCw,
    color: "#06B6D4",
    gradient: "from-blue-500 to-cyan-500",
    image: homeStep3,
    structure: ["Before State", "Transformation", "After State", "Results"],
    duration: "30-90s",
    difficulty: "Beginner",
    popular: false,
    useCases: ["Testimonials", "Tutorials", "Case Studies", "Fitness Content"],
    category: "Educational"
  },
  {
    id: "myth-busting",
    name: "Myth-Busting",
    tagline: "Challenge Misconceptions",
    description: "Address a common misconception and reveal the truth. Perfect for thought leadership content.",
    longDescription: "Position yourself as an expert by debunking common myths in your industry. Educational content that builds trust and authority.",
    icon: AlertCircle,
    color: "#EF4444",
    gradient: "from-rose-500 to-orange-500",
    image: homeStep4,
    structure: ["Common Myth", "Why It's Wrong", "The Truth", "Takeaway"],
    duration: "30-60s",
    difficulty: "Intermediate",
    popular: false,
    useCases: ["Educational Content", "Industry Insights", "Thought Leadership", "Expert Positioning"],
    category: "Educational"
  },
  {
    id: "asmr-sensory",
    name: "ASMR / Sensory",
    tagline: "Satisfying Visual Experience",
    description: "Focus on satisfying sounds and visuals. No complex script needed - pure sensory content.",
    longDescription: "Create mesmerizing, relaxing content that captivates viewers with satisfying sounds and beautiful visuals. Perfect for product showcases.",
    icon: Volume2,
    color: "#10B981",
    gradient: "from-emerald-500 to-teal-500",
    image: homeStep5,
    structure: ["Opening", "Sensory Journey", "Closing"],
    duration: "15-60s",
    difficulty: "Beginner",
    popular: false,
    useCases: ["Product Showcases", "Relaxation Content", "Visual Appeal", "Unboxing"],
    category: "Entertainment"
  },
  {
    id: "auto-asmr",
    name: "Auto-ASMR",
    tagline: "AI-Powered Relaxation",
    description: "AI-powered relaxing, meditative stories with satisfying visuals and ambient sounds.",
    longDescription: "Let AI create peaceful, meditative content automatically. Perfect for relaxation channels, meditation apps, and sleep content.",
    icon: Sparkles,
    color: "#6366F1",
    gradient: "from-indigo-500 to-purple-600",
    image: homeStep6,
    structure: ["Peaceful Opening", "Sensory Journey", "Calm Closing"],
    duration: "15-60s",
    difficulty: "Beginner",
    popular: false,
    useCases: ["Relaxation Content", "Meditation Videos", "Sleep Content", "Ambient Videos"],
    category: "Entertainment"
  }
];

// Features
const features = [
  {
    icon: Wand2,
    title: "AI Script Generation",
    description: "Enter your topic and let AI craft engaging scripts tailored for social media"
  },
  {
    icon: Palette,
    title: "15+ Image Models",
    description: "Access FLUX, Midjourney, Ideogram, and more for stunning visuals"
  },
  {
    icon: Volume2,
    title: "50+ AI Voices",
    description: "Natural-sounding voices in multiple languages and accents"
  },
  {
    icon: Zap,
    title: "Video Animation",
    description: "Transform static images into dynamic video with AI animation"
  },
  {
    icon: Layers,
    title: "Smart Templates",
    description: "Pre-built story structures optimized for engagement"
  },
  {
    icon: Share2,
    title: "Direct Publishing",
    description: "Export to TikTok, Instagram, YouTube formats instantly"
  }
];

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

// Cinematic Video Player for Stories
function StoriesVideoPlayer({ templates, activeTemplate, onTemplateChange }: {
  templates: typeof storyTemplates;
  activeTemplate: number;
  onTemplateChange: (index: number) => void;
}) {
  const currentTemplate = templates[activeTemplate];
  const Icon = currentTemplate.icon;

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Main Video Container */}
      <motion.div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Glowing Border */}
        <motion.div
          className="absolute -inset-1 rounded-2xl sm:rounded-3xl opacity-50 blur-xl -z-10"
          style={{ background: `linear-gradient(135deg, ${currentTemplate.color}40, transparent, ${currentTemplate.color}20)` }}
          animate={{
            background: [
              `linear-gradient(135deg, ${currentTemplate.color}40, transparent, ${currentTemplate.color}20)`,
              `linear-gradient(225deg, ${currentTemplate.color}40, transparent, ${currentTemplate.color}20)`,
              `linear-gradient(315deg, ${currentTemplate.color}40, transparent, ${currentTemplate.color}20)`,
              `linear-gradient(135deg, ${currentTemplate.color}40, transparent, ${currentTemplate.color}20)`
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Video Frame */}
        <div 
          className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden border-2"
          style={{ borderColor: `${currentTemplate.color}30` }}
        >
          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTemplate}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={currentTemplate.image}
                alt={currentTemplate.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
            </motion.div>
          </AnimatePresence>

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.button
              className="relative group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: `2px sm:3px solid ${currentTemplate.color}` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div 
                className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center backdrop-blur-xl border-2"
                style={{ backgroundColor: `${currentTemplate.color}30`, borderColor: currentTemplate.color }}
              >
                <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white ml-1" />
              </div>
            </motion.button>
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 md:p-6 z-10">
            <div className="flex items-center justify-between">
              <motion.div
                key={activeTemplate}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-xl border"
                style={{ backgroundColor: `${currentTemplate.color}20`, borderColor: `${currentTemplate.color}40` }}
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center" style={{ backgroundColor: currentTemplate.color }}>
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">{currentTemplate.name}</div>
                  <div className="text-[10px] sm:text-xs text-white/60 hidden sm:block">{currentTemplate.tagline}</div>
                </div>
              </motion.div>

              {currentTemplate.popular && (
                <div className="px-2 sm:px-4 py-1 sm:py-2 rounded-full bg-amber-500/20 backdrop-blur-xl border border-amber-500/40 text-xs sm:text-sm text-amber-300 flex items-center gap-1 sm:gap-2">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Popular</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 z-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <motion.div key={activeTemplate} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">{currentTemplate.description}</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {currentTemplate.structure.slice(0, 4).map((step, i) => (
                    <span 
                      key={i}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs backdrop-blur-xl border"
                      style={{ backgroundColor: `${currentTemplate.color}20`, borderColor: `${currentTemplate.color}30`, color: currentTemplate.color }}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div key={`stats-${activeTemplate}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden md:flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{currentTemplate.duration}</div>
                  <div className="text-xs text-white/50">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{currentTemplate.structure.length}</div>
                  <div className="text-xs text-white/50">Sections</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{currentTemplate.difficulty}</div>
                  <div className="text-xs text-white/50">Level</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Template Selector Pills - Desktop */}
      <div className="hidden md:flex flex-wrap justify-center gap-3 mt-8">
        {templates.map((template, index) => {
          const TemplateIcon = template.icon;
          const isActive = activeTemplate === index;
          
          return (
            <motion.button
              key={template.id}
              onClick={() => onTemplateChange(index)}
              className={`relative px-4 py-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                isActive ? 'border-transparent' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
              style={{
                backgroundColor: isActive ? `${template.color}20` : undefined,
                borderColor: isActive ? `${template.color}50` : undefined
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl -z-10"
                  style={{ backgroundColor: template.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                />
              )}
              
              <div 
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? '' : 'bg-white/10'}`}
                style={{ backgroundColor: isActive ? template.color : undefined }}
              >
                <TemplateIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white/60'}`} />
              </div>
              
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                {template.name}
              </span>

              {template.popular && (
                <Star className="w-3 h-3 text-amber-400" />
              )}

              {isActive && (
                <motion.div
                  layoutId="activeTemplateIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full"
                  style={{ backgroundColor: template.color }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Template Selector Pills - Mobile (Horizontal Scroll) */}
      <div className="md:hidden mt-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-2 pb-2 min-w-max">
          {templates.map((template, index) => {
            const TemplateIcon = template.icon;
            const isActive = activeTemplate === index;
            
            return (
              <motion.button
                key={template.id}
                onClick={() => onTemplateChange(index)}
                className={`relative px-3 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                  isActive ? 'border-transparent' : 'border-white/10 bg-white/[0.03]'
                }`}
                style={{
                  backgroundColor: isActive ? `${template.color}20` : undefined,
                  borderColor: isActive ? `${template.color}50` : undefined
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className={`w-6 h-6 rounded-md flex items-center justify-center ${isActive ? '' : 'bg-white/10'}`}
                  style={{ backgroundColor: isActive ? template.color : undefined }}
                >
                  <TemplateIcon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-white/60'}`} />
                </div>
                
                <span className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-white/60'}`}>
                  {template.name}
                </span>

                {template.popular && (
                  <Star className="w-2.5 h-2.5 text-amber-400" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Template Section Component
function TemplateSection({ template, index, isReversed }: { 
  template: typeof storyTemplates[0]; 
  index: number;
  isReversed: boolean;
}) {
  const Icon = template.icon;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-24 relative" id={template.id}>
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
              <div className="relative aspect-[9/16] max-w-[280px] sm:max-w-sm mx-auto rounded-xl sm:rounded-2xl overflow-hidden">
                <img 
                  src={template.image}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2"
                    style={{ backgroundColor: `${template.color}30`, borderColor: template.color }}
                  >
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" />
                  </motion.div>
                </div>

                {/* Template Badge */}
                <div 
                  className="absolute top-3 sm:top-4 left-3 sm:left-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl backdrop-blur-xl border flex items-center gap-1.5 sm:gap-2"
                  style={{ backgroundColor: `${template.color}20`, borderColor: `${template.color}40` }}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: template.color }} />
                  <span className="text-white text-xs sm:text-sm font-medium">{template.name}</span>
                </div>

                {/* Popular Badge */}
                {template.popular && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500/20 backdrop-blur-xl border border-amber-500/40 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    <span className="text-amber-300 text-[10px] sm:text-xs">Popular</span>
                  </div>
                )}

                {/* Structure Flow */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
                    {template.structure.map((step, i) => (
                      <div key={i} className="flex items-center">
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/50 backdrop-blur text-[10px] sm:text-xs text-white/80">
                          {step}
                        </span>
                        {i < template.structure.length - 1 && (
                          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/40 mx-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Glow */}
              <div 
                className="absolute -inset-4 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl"
                style={{ backgroundColor: `${template.color}20` }}
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
            {/* Category & Difficulty */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span 
                className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border"
                style={{ backgroundColor: `${template.color}15`, borderColor: `${template.color}30`, color: template.color }}
              >
                {template.category}
              </span>
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/60 border border-white/10">
                {template.difficulty}
              </span>
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/60 border border-white/10 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {template.duration}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1.5 sm:mb-2">{template.name}</h2>
            <p className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4" style={{ color: template.color }}>{template.tagline}</p>

            {/* Description */}
            <p className="text-white/60 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{template.longDescription}</p>

            {/* Use Cases */}
            <div className="mb-6 sm:mb-8">
              <h4 className="text-xs sm:text-sm font-medium text-white/70 mb-2 sm:mb-3 uppercase tracking-wider">Perfect For</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {template.useCases.map((useCase, i) => (
                  <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm bg-white/5 text-white/60 border border-white/10">
                    {useCase}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r ${template.gradient} shadow-lg text-sm sm:text-base w-full sm:w-auto`}
              style={{ boxShadow: `0 10px 40px ${template.color}30` }}
            >
              Use This Template
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function StoriesGeneratorPage() {
  const lightPillarRef = useRef<LightPillarRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollYProgress);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (lightPillarRef.current) {
      lightPillarRef.current.setScrollProgress(latest);
    }
  });

  // Auto-rotate steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % storySteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTemplate = (templateId: string) => {
    const element = document.getElementById(templateId);
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
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-6 sm:mb-8"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-emerald-300">AI Stories Generator</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              </motion.div>

              {/* Title */}
              <BlurText
                text="Create Viral Stories in Minutes"
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
                6 proven story templates. 5 simple steps. AI handles the script, visuals, and audio. 
                Just add your idea.
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:flex sm:justify-center gap-4 sm:gap-8 md:gap-12 mb-10 sm:mb-12 md:mb-16 px-4 sm:px-0"
              >
                {[
                  { value: 6, label: "Story Templates", suffix: "" },
                  { value: 5, label: "Simple Steps", suffix: "" },
                  { value: 15, label: "Image Models", suffix: "+" },
                  { value: 50, label: "AI Voices", suffix: "+" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    <div className="text-xs sm:text-sm text-white/50 mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* Video Player */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <StoriesVideoPlayer
                  templates={storyTemplates}
                  activeTemplate={activeTemplate}
                  onTemplateChange={(index) => {
                    setActiveTemplate(index);
                    scrollToTemplate(storyTemplates[index].id);
                  }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 5-STEP WORKFLOW */}
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
                <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
                <span className="text-xs sm:text-sm text-white/70">Simple 5-Step Process</span>
              </motion.div>

              <BlurText
                text="From Idea to Story in 5 Steps"
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
                Each step is designed to be simple yet powerful, with AI doing the heavy lifting
              </motion.p>
            </div>

            {/* Steps Timeline - Desktop */}
            <div className="relative mb-8 sm:mb-12 hidden md:block">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 max-w-3xl mx-auto" />
              <motion.div 
                className="absolute top-5 h-0.5 max-w-3xl mx-auto left-1/2 -translate-x-1/2"
                style={{ 
                  background: `linear-gradient(to right, ${storySteps.slice(0, activeStep + 1).map(s => s.color).join(', ')})`,
                  width: `${(activeStep / (storySteps.length - 1)) * 100}%`,
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${(activeStep / (storySteps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
              
              <div className="flex justify-center gap-16 max-w-3xl mx-auto relative">
                {storySteps.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  
                  return (
                    <motion.button
                      key={step.id}
                      onClick={() => setActiveStep(i)}
                      className="relative flex flex-col items-center z-10"
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500"
                        style={{
                          backgroundColor: isActive || isPast ? step.color : 'rgb(17, 24, 39)',
                          borderColor: isActive || isPast ? step.color : 'rgba(255,255,255,0.2)',
                          boxShadow: isActive ? `0 0 30px ${step.color}60` : undefined
                        }}
                        animate={{ scale: isActive ? 1.2 : 1 }}
                      >
                        <Icon className={`w-5 h-5 ${isActive || isPast ? 'text-white' : 'text-white/40'}`} />
                      </motion.div>
                      <span className={`mt-3 text-xs font-medium ${isActive ? 'text-white' : 'text-white/40'}`}>
                        {step.shortName}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Steps Timeline - Mobile (Horizontal Scroll) */}
            <div className="md:hidden mb-6 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-2 pb-2 min-w-max">
                {storySteps.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  
                  return (
                    <motion.button
                      key={step.id}
                      onClick={() => setActiveStep(i)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                        isActive 
                          ? 'border-transparent' 
                          : 'border-white/10 bg-white/5'
                      }`}
                      style={{ 
                        backgroundColor: isActive ? step.color : undefined,
                        boxShadow: isActive ? `0 0 20px ${step.color}40` : undefined
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className={`w-4 h-4 ${isActive || isPast ? 'text-white' : 'text-white/50'}`} />
                      <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                        {step.shortName}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto"
              >
                <div 
                  className="relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden"
                  style={{ backgroundColor: 'rgba(13, 13, 13, 0.8)' }}
                >
                  <div 
                    className="absolute inset-0 opacity-10"
                    style={{ background: `radial-gradient(ellipse at top left, ${storySteps[activeStep].color}40, transparent 60%)` }}
                  />

                  <div className="relative flex flex-col md:flex-row gap-5 sm:gap-6 md:gap-8">
                    <div className="flex-shrink-0 flex items-start gap-4 md:block">
                      <div 
                        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br ${storySteps[activeStep].gradient}`}
                        style={{ boxShadow: `0 0 40px ${storySteps[activeStep].color}40` }}
                      >
                        {(() => {
                          const Icon = storySteps[activeStep].icon;
                          return <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />;
                        })()}
                      </div>
                      {/* Mobile Title */}
                      <div className="md:hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white"
                            style={{ backgroundColor: storySteps[activeStep].color }}
                          >
                            Step {storySteps[activeStep].id}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">{storySteps[activeStep].name}</h3>
                      </div>
                    </div>

                    <div className="flex-1">
                      {/* Desktop Title */}
                      <div className="hidden md:flex items-center gap-3 mb-3">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: storySteps[activeStep].color }}
                        >
                          Step {storySteps[activeStep].id}
                        </span>
                        <h3 className="text-2xl font-bold text-white">{storySteps[activeStep].name}</h3>
                      </div>

                      <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">{storySteps[activeStep].description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {storySteps[activeStep].details.map((detail, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: storySteps[activeStep].color }} />
                            <span className="text-white/60 text-xs sm:text-sm">{detail}</span>
                          </motion.div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-6">
                        {storySteps[activeStep].features.map((feature, i) => (
                          <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs bg-white/5 text-white/60 border border-white/10">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TEMPLATE SECTIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {storyTemplates.map((template, index) => (
            <TemplateSection 
              key={template.id} 
              template={template} 
              index={index}
              isReversed={index % 2 === 1}
            />
          ))}
        </div>

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
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-pink-500/30 mb-4 sm:mb-6"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                <span className="text-xs sm:text-sm text-pink-300">Powerful Features</span>
              </motion.div>

              <BlurText
                text="Everything You Need"
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
                    className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 hover:border-pink-500/30 transition-all duration-300 group"
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-pink-400" />
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
                <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-cyan-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              <div className="relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center mx-auto mb-5 sm:mb-6 md:mb-8 shadow-2xl shadow-emerald-500/30"
                >
                  <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2">
                  Start Creating Stories Today
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-2">
                  Join thousands of creators using Storia to create viral short-form content with AI.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl font-semibold text-base sm:text-lg text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 sm:gap-3"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-base sm:text-lg text-white flex items-center justify-center gap-2 sm:gap-3"
                  >
                    View Templates
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
