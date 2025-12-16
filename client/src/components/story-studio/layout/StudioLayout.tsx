// Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StepId, STEPS, StoryTemplate } from "../types";
import { AmbientBackground } from "../shared/AmbientBackground";
import { TimelineNavigation } from "../shared/TimelineNavigation";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface StudioLayoutProps {
  template: StoryTemplate;
  currentStep: StepId;
  completedSteps: StepId[];
  direction: number;
  onStepClick: (step: StepId) => void;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  isLoading?: boolean;  // Loading state for export button
  nextLabel?: string;
  children: ReactNode;
}

// Template to accent color mapping
const templateAccentMap: Record<string, string> = {
  'problem-solution': 'orange',
  'tease-reveal': 'violet',
  'before-after': 'blue',
  'myth-busting': 'rose',
};

const templateGradientMap: Record<string, string> = {
  'problem-solution': 'from-orange-500 to-amber-500',
  'tease-reveal': 'from-violet-500 to-purple-500',
  'before-after': 'from-blue-500 to-cyan-500',
  'myth-busting': 'from-rose-500 to-pink-500',
};

export function StudioLayout({
  template,
  currentStep,
  completedSteps,
  direction,
  onStepClick,
  onNext,
  onBack,
  isNextDisabled,
  isLoading = false,
  nextLabel,
  children
}: StudioLayoutProps) {
  const [, navigate] = useLocation();
  const accentColor = templateAccentMap[template.id] || 'primary';
  const gradientColor = templateGradientMap[template.id] || 'from-primary to-violet-500';
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const currentStepInfo = STEPS[currentStepIndex];

  // Animation variants for step transitions
  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Ambient Background */}
      <AmbientBackground accentColor={gradientColor} />

      {/* Header */}
      <header className="relative z-10 px-6 pt-5 pb-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back to Templates */}
          <motion.button
            onClick={() => navigate('/stories')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Templates</span>
          </motion.button>

          {/* Template Badge + Step Title */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-white/5 border border-white/10"
            )}>
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: template.iconColor }}
              />
              <span className="text-sm font-medium text-white/70">{template.name}</span>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">{currentStepInfo.icon}</span>
              <span className="text-lg font-semibold">{currentStepInfo.label}</span>
            </motion.div>
          </div>

          {/* Placeholder for balance */}
          <div className="w-24" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 px-6 pb-32">
        <div className="w-full h-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Timeline Navigation */}
      <TimelineNavigation
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick}
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        isLoading={isLoading}
        nextLabel={nextLabel}
        accentColor={accentColor}
      />
    </div>
  );
}

