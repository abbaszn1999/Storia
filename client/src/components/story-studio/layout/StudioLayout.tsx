// Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StepId, STEPS, getStepsForTemplate, StoryTemplate } from "../types";
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
  isBackDisabled?: boolean;  // Disable back button during generation
  isNavigationDisabled?: boolean;  // Disable all step navigation during generation
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
  'auto-asmr': 'emerald',
};

const templateGradientMap: Record<string, string> = {
  'problem-solution': 'from-orange-500 to-amber-500',
  'tease-reveal': 'from-violet-500 to-purple-500',
  'before-after': 'from-blue-500 to-cyan-500',
  'myth-busting': 'from-rose-500 to-pink-500',
  'auto-asmr': 'from-emerald-500 to-teal-500',
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
  isBackDisabled = false,
  isNavigationDisabled = false,
  isLoading = false,
  nextLabel,
  children
}: StudioLayoutProps) {
  const [, navigate] = useLocation();
  const accentColor = templateAccentMap[template.id] || 'primary';
  const gradientColor = templateGradientMap[template.id] || 'from-primary to-violet-500';
  
  // Get filtered steps based on template (hide 'audio' step for auto-asmr)
  const availableSteps = getStepsForTemplate(template.id);
  const currentStepIndex = availableSteps.findIndex(s => s.id === currentStep);
  const currentStepInfo = availableSteps[currentStepIndex] || STEPS.find(s => s.id === currentStep);

  // Animation variants for step transitions - simple fade only
  const stepVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient Background */}
      <AmbientBackground accentColor={gradientColor} />

      {/* Header */}
      <header className="relative z-10 px-6 pt-5 pb-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          {/* Back to Templates - Fixed Left Position */}
          <motion.button
            onClick={() => navigate('/stories')}
            className="absolute left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Templates</span>
          </motion.button>

          {/* Template Badge + Step Title - Centered */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-muted/50 border border-border backdrop-blur-sm"
            )}>
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: template.iconColor }}
              />
              <span className="text-sm font-medium text-foreground/70">{template.name}</span>
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">{currentStepInfo.icon}</span>
              <span className="text-lg font-semibold text-foreground">{currentStepInfo.label}</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 px-6 pb-32">
        <div className="w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Timeline Navigation */}
      <TimelineNavigation
        steps={availableSteps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick}
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        isBackDisabled={isBackDisabled}
        isStepClickDisabled={isNavigationDisabled}
        isLoading={isLoading}
        nextLabel={nextLabel}
        accentColor={accentColor}
      />
    </div>
  );
}

