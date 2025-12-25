// Social Commerce Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { COMMERCE_STEPS, CommerceStepId } from "./types";
import { SocialCommerceStudioBackground } from "./SocialCommerceStudioBackground";
import { SocialCommerceTimelineNavigation } from "./SocialCommerceTimelineNavigation";
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface SocialCommerceStudioLayoutProps {
  currentStep: CommerceStepId;
  completedSteps: CommerceStepId[];
  dirtySteps?: Set<CommerceStepId>;
  direction: number;
  onStepClick: (step: CommerceStepId) => void;
  onNext: () => void;
  onBack: () => void;
  videoTitle: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
  isTransitioning?: boolean; // NEW: Track transition state
  children: ReactNode;
}

export function SocialCommerceStudioLayout({
  currentStep,
  completedSteps,
  dirtySteps,
  direction,
  onStepClick,
  onNext,
  onBack,
  videoTitle,
  isNextDisabled,
  nextLabel,
  isTransitioning = false, // NEW: Default to false
  children
}: SocialCommerceStudioLayoutProps) {
  const [, navigate] = useLocation();
  
  const currentStepIndex = COMMERCE_STEPS.findIndex(s => s.id === currentStep);
  const currentStepInfo = COMMERCE_STEPS[currentStepIndex];

  // Animation variants for smooth transitions
  const contentVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 20 : -20,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -20 : 20,
      scale: 0.98,
    }),
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Commerce Background */}
      <SocialCommerceStudioBackground />

      {/* Header */}
      <header className="relative z-10 px-6 pt-5 pb-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back to Videos */}
          <motion.button
            onClick={() => navigate('/videos')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Videos</span>
          </motion.button>

          {/* Template Badge + Step Title */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-white/5 border border-white/10"
            )}>
              <ShoppingBag className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-medium text-white/70">Social Commerce</span>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">{currentStepInfo.icon}</span>
              <span className="text-lg font-semibold">{currentStepInfo.label}</span>
            </motion.div>
          </div>

          {/* Video Title (right side) */}
          <div className="text-sm text-white/50 max-w-[200px] truncate">
            {videoTitle}
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable with Smooth Transitions */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-24 custom-scrollbar">
        <div className="relative px-6 pb-6 min-h-full">
          {/* Loading Overlay */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-4"
                >
                  <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-white/80 font-medium"
                  >
                    {nextLabel || "Loading..."}
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content with Smooth Transitions */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1], // Custom easing for smooth feel
              }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Timeline Navigation - Fixed at bottom */}
      <SocialCommerceTimelineNavigation
        currentStep={currentStep}
        completedSteps={completedSteps}
        dirtySteps={dirtySteps}
        onStepClick={onStepClick}
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        nextLabel={nextLabel}
      />
    </div>
  );
}

