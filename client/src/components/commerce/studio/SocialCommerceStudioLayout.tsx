// Social Commerce Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { COMMERCE_STEPS, CommerceStepId, getVisibleSteps } from "./types";
import { SocialCommerceStudioBackground } from "./SocialCommerceStudioBackground";
import { SocialCommerceTimelineNavigation } from "./SocialCommerceTimelineNavigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode, useState, useEffect } from "react";
import { FilmCatcherGame } from "@/components/loading-game";

interface SocialCommerceStudioLayoutProps {
  currentStep: CommerceStepId;
  completedSteps: CommerceStepId[];
  dirtySteps?: Set<CommerceStepId>;
  voiceOverEnabled?: boolean;
  direction: number;
  onStepClick: (step: CommerceStepId) => void;
  onNext: () => void;
  onBack: () => void;
  videoTitle: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
  isTransitioning?: boolean; // NEW: Track transition state
  loadingProgress?: number; // Progress for loading game (0-100)
  children: ReactNode;
}

export function SocialCommerceStudioLayout({
  currentStep,
  completedSteps,
  dirtySteps,
  voiceOverEnabled = true,
  direction,
  onStepClick,
  onNext,
  onBack,
  videoTitle,
  isNextDisabled,
  nextLabel,
  isTransitioning = false, // NEW: Default to false
  loadingProgress = 0, // Default to 0
  children
}: SocialCommerceStudioLayoutProps) {
  const [, navigate] = useLocation();
  
  // Simulate progress when transitioning (if no actual progress provided)
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  
  useEffect(() => {
    if (isTransitioning && loadingProgress === 0) {
      // Simulate progress when no real progress is provided
      setSimulatedProgress(0);
      const interval = setInterval(() => {
        setSimulatedProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Cap at 90% until actually complete
          }
          return prev + Math.random() * 15 + 5;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (!isTransitioning) {
      // Reset when not transitioning
      setSimulatedProgress(0);
    }
  }, [isTransitioning, loadingProgress]);
  
  // Use real progress if provided, otherwise use simulated
  const displayProgress = loadingProgress > 0 ? loadingProgress : simulatedProgress;
  
  const visibleSteps = getVisibleSteps(voiceOverEnabled);
  const currentStepIndex = visibleSteps.findIndex(s => s.id === currentStep);
  const currentStepInfo = visibleSteps[currentStepIndex] || COMMERCE_STEPS.find(s => s.id === currentStep);

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
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden" data-mode="social-commerce">
      {/* Commerce Background */}
      <SocialCommerceStudioBackground />

      {/* Header */}
      <header className="relative z-10 px-6 pt-5 pb-3 flex-shrink-0">
        <div className="w-full flex items-center justify-between">
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
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
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
          {/* Loading Game Overlay */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                }}
              >
                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-20"
                    style={{
                      background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
                      left: '10%',
                      top: '20%',
                    }}
                    animate={{
                      x: [0, 50, 0],
                      y: [0, 30, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-15"
                    style={{
                      background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)',
                      right: '10%',
                      bottom: '20%',
                    }}
                    animate={{
                      x: [0, -40, 0],
                      y: [0, -40, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
                
                {/* Film Catcher Game */}
                <FilmCatcherGame
                  progress={displayProgress}
                  isComplete={false}
                  title={nextLabel || "Processing..."}
                  subtitle="Play while you wait! 🎮"
                />
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
        voiceOverEnabled={voiceOverEnabled}
        onStepClick={onStepClick}
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        nextLabel={nextLabel}
      />
    </div>
  );
}

