import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import BlurText from "../ui/blur-text";
import { 
  Clock, ChevronDown, Sparkles, Film,
  FileText, Globe, LayoutGrid, Image, Volume2, Eye, Download,
  Wand2, Users, Layers, Palette, Music, Share2, Play
} from "lucide-react";
import {
  homeStep1,
  homeStep2,
  homeStep3,
  homeStep4,
  homeStep5,
  homeStep6,
  homeStep7
} from "@/website/assets/images";

// The 7 Steps of Narrative Mode
const steps = [
  {
    id: 1,
    step: "Step 1",
    title: "Write Your Story",
    subtitle: "Script",
    image: homeStep1,
    icon: FileText,
    color: "#EC4899",
    description: "Start with a simple idea and watch AI transform it into a complete screenplay",
    features: [
      "Enter your story idea in one sentence",
      "AI generates a full 500+ word script",
      "Edit and refine your narrative"
    ],
    duration: "~30 seconds"
  },
  {
    id: 2,
    step: "Step 2",
    title: "Build Your World",
    subtitle: "World & Cast",
    image: homeStep2,
    icon: Globe,
    color: "#8B5CF6",
    description: "Choose your visual style and define your story's characters",
    features: [
      "Select from styles: Cinematic, Pixar, Anime, Vintage...",
      "Upload style references",
      "Define world settings and atmosphere"
    ],
    duration: "~1 minute"
  },
  {
    id: 3,
    step: "Step 3",
    title: "Scene Breakdown",
    subtitle: "Breakdown",
    image: homeStep3,
    icon: Layers,
    color: "#F59E0B",
    description: "AI automatically divides your script into scenes and shots",
    features: [
      "Auto-generated scene synopsis",
      "Shot-by-shot breakdown with descriptions",
      "Continuity locking for consistency"
    ],
    duration: "~45 seconds"
  },
  {
    id: 4,
    step: "Step 4",
    title: "Visual Storyboard",
    subtitle: "Storyboard",
    image: homeStep4,
    icon: Image,
    color: "#10B981",
    description: "Generate stunning images for each shot and animate them into video",
    features: [
      "AI image generation for every shot",
      "One-click video animation",
      "Cards & Timeline view modes"
    ],
    duration: "~2-5 minutes"
  },
  {
    id: 5,
    step: "Step 5",
    title: "Design Soundscape",
    subtitle: "Sound",
    image: homeStep5,
    icon: Volume2,
    color: "#06B6D4",
    description: "Add sound effects, background music, and voiceover narration",
    features: [
      "AI-generated sound effects",
      "Voiceover setup with multiple voices",
      "Background music library"
    ],
    duration: "~2 minutes"
  },
  {
    id: 6,
    step: "Step 6",
    title: "Animatic Preview",
    subtitle: "Preview",
    image: homeStep6,
    icon: Eye,
    color: "#3B82F6",
    description: "Watch your complete video before final export",
    features: [
      "Full video preview with audio",
      "Scene-by-scene navigation",
      "Make final adjustments"
    ],
    duration: "Real-time"
  },
  {
    id: 7,
    step: "Step 7",
    title: "Export & Share",
    subtitle: "Export",
    image: homeStep7,
    icon: Download,
    color: "#EF4444",
    description: "Export in high quality and share instantly with the world",
    features: [
      "Resolution: 720p to 4K",
      "MP4 format with quality control",
      "Instant publish or schedule"
    ],
    duration: "~1-3 minutes"
  }
];

export function StoryboardShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Track scroll to update active step
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const adjustedProgress = Math.max(0, Math.min(1, (progress - 0.12) / 0.76));
    const stepIndex = Math.floor(adjustedProgress * steps.length);
    setActiveStep(Math.min(stepIndex, steps.length - 1));
  });

  const activeData = steps[activeStep];
  const IconComponent = activeData.icon;

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[350vh] py-20"
    >
      {/* No background - allows LightPillar to show through seamlessly */}

      {/* Sticky container - with top padding for header space */}
      <div className="sticky top-0 min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-8">

        {/* Main Editor Interface */}
        <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="relative backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            style={{ backgroundColor: "rgba(13, 13, 13, 0.8)" }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-white/10" style={{ backgroundColor: "rgba(13, 13, 13, 0.5)" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Film className="w-4 h-4 text-primary" />
                  <span className="text-sm text-white/70">Narrative Mode</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">AI Powered</span>
                </div>
                <div 
                  className="px-3 py-1.5 rounded-lg text-xs text-white font-medium"
                  style={{ backgroundColor: `${activeData.color}30`, color: activeData.color }}
                >
                  {activeData.step} of 7
                </div>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex flex-col lg:flex-row">
              
              {/* Left Sidebar - Steps List */}
              <div className="hidden lg:block w-64 xl:w-72 border-r border-white/10 p-4 max-h-[650px] overflow-y-auto" style={{ backgroundColor: "rgba(13, 13, 13, 0.5)" }}>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-white/60">Creation Steps</span>
                </div>
                
                <div className="space-y-2">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === activeStep;
                    const isPast = index < activeStep;
                    
                    return (
                      <motion.div
                        key={step.id}
                        className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                          isActive 
                            ? "bg-white/10 border border-white/20" 
                            : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                              isActive ? "shadow-lg" : isPast ? "opacity-60" : "opacity-40"
                            }`}
                            style={{ 
                              backgroundColor: isActive ? step.color : isPast ? `${step.color}60` : `${step.color}30`
                            }}
                          >
                            <StepIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/70"}`}>
                              {step.subtitle}
                            </p>
                            <p className="text-xs text-white/40">{step.duration}</p>
                          </div>
                          
                          {isPast && (
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {isActive && (
                          <motion.div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                            style={{ backgroundColor: step.color }}
                            layoutId="sidebarIndicator"
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Main Preview Area */}
              <div className="flex-1 p-4 lg:p-6">
                {/* 3D Cards Stack */}
                <div className="relative h-[280px] sm:h-[320px] lg:h-[380px] perspective-[2500px]">
                  {steps.map((step, index) => {
                    const offset = index - activeStep;
                    const isActive = index === activeStep;
                    const isHovered = hoveredStep === index;
                    
                    return (
                      <StepCard
                        key={step.id}
                        step={step}
                        offset={offset}
                        isActive={isActive}
                        isHovered={isHovered}
                        onHover={() => setHoveredStep(index)}
                        onLeave={() => setHoveredStep(null)}
                      />
                    );
                  })}
                </div>

                {/* Step Details Panel */}
                <motion.div 
                  className="mt-6 lg:mt-8 p-4 lg:p-6 rounded-2xl bg-white/5 border border-white/10"
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${activeData.color}20` }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: activeData.color }} />
                        </div>
                        <div>
                          <span 
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: activeData.color }}
                          >
                            {activeData.step}
                          </span>
                          <span className="text-xs text-white/40 mx-2">•</span>
                          <span className="text-xs text-white/40">{activeData.subtitle}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
                        {activeData.title}
                      </h3>
                      
                      <p className="text-white/60 text-sm lg:text-base mb-4">
                        {activeData.description}
                      </p>
                      
                      {/* Features List */}
                      <div className="space-y-2">
                        {activeData.features.map((feature, idx) => (
                          <motion.div 
                            key={idx}
                            className="flex items-center gap-2 text-sm"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: activeData.color }}
                            />
                            <span className="text-white/70">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Clock className="w-4 h-4" />
                        <span>{activeData.duration}</span>
                      </div>
                      <button 
                        className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                        style={{ backgroundColor: activeData.color }}
                      >
                        <Play className="w-4 h-4" />
                        Try Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}

interface StepCardProps {
  step: typeof steps[0];
  offset: number;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function StepCard({ step, offset, isActive, isHovered, onHover, onLeave }: StepCardProps) {
  const IconComponent = step.icon;
  
  // Show only active card and immediate neighbors
  // Hide cards that are too far
  if (Math.abs(offset) > 1) return null;
  
  // Enhanced 3D transforms - more subtle for cleaner look
  const zDistance = offset * -150;
  const xOffset = offset * 250;
  const yOffset = 0;
  const rotateY = offset * -15;
  const rotateX = 0;
  const scale = isActive ? 1 : 0.85;
  const opacity = isActive ? 1 : 0.4;
  
  // z-index: active card on top, neighbors below
  const zIndex = 10 - Math.abs(offset);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[92%] sm:w-[480px] lg:w-[560px] cursor-pointer"
      style={{
        transformStyle: "preserve-3d",
        zIndex: zIndex,
      }}
      animate={{
        x: `calc(-50% + ${xOffset}px)`,
        y: `calc(-50% + ${yOffset}px)`,
        z: zDistance,
        rotateY: rotateY,
        rotateX: rotateX,
        scale: isHovered && isActive ? 1.03 : scale,
        opacity: opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 85,
        damping: 22,
        mass: 1.1
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Card */}
      <div 
        className={`relative rounded-2xl overflow-hidden backdrop-blur-sm border-2 transition-all duration-300 ${
          isActive 
            ? "border-white/30" 
            : "border-white/10"
        }`}
        style={{
          backgroundColor: "rgba(13, 13, 13, 0.95)",
          boxShadow: isActive 
            ? `0 30px 60px -15px ${step.color}40, 0 0 0 1px ${step.color}20` 
            : "0 20px 40px -15px rgba(0,0,0,0.5)"
        }}
      >
        {/* Step Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
          <div 
            className="absolute inset-0 opacity-30"
            style={{ background: `linear-gradient(135deg, ${step.color}40 0%, transparent 60%)` }}
          />
          
          {/* Step Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div 
              className="px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-lg flex items-center gap-2"
              style={{ backgroundColor: step.color }}
            >
              <IconComponent className="w-4 h-4" />
              {step.step}
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-sm text-white flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {step.duration}
            </div>
          </div>
        </div>

        {/* Step Info Bar */}
        <div 
          className="px-5 py-4"
          style={{ backgroundColor: `${step.color}10` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="text-sm text-white/50">{step.subtitle}</p>
            </div>
            
            {isActive && (
              <motion.div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${step.color}30`, color: step.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Current Step
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default StoryboardShowcase;
