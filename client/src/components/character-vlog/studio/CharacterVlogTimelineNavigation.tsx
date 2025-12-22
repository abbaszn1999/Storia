// Character Vlog Timeline Navigation - Bottom navigation with step indicators
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { VLOG_STEPS, VlogStepId } from "./types";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CharacterVlogTimelineNavigationProps {
  currentStep: VlogStepId;
  completedSteps: VlogStepId[];
  onStepClick: (step: VlogStepId) => void;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  nextLabel?: string;
}

export function CharacterVlogTimelineNavigation({
  currentStep,
  completedSteps,
  onStepClick,
  onNext,
  onBack,
  isNextDisabled = false,
  nextLabel
}: CharacterVlogTimelineNavigationProps) {
  const currentIndex = VLOG_STEPS.findIndex(s => s.id === currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === VLOG_STEPS.length - 1;

  const getStepStatus = (stepId: VlogStepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    const stepIndex = VLOG_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    return 'upcoming';
  };

  const canNavigateTo = (stepId: VlogStepId) => {
    // Allow free navigation to all tabs for UI/UX preview
    return true;
  };

  // Gradient pink to orange from logo for vlog theme
  const accentClasses = {
    gradient: "from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A]",
    glow: "shadow-[#FF4081]/30",
    bg: "bg-gradient-to-r from-[#FF4081] to-[#FF6B4A]",
    text: "text-transparent bg-clip-text bg-gradient-to-r from-[#FF4081] to-[#FF6B4A]",
    border: "border-[#FF4081]/30"
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Main Navigation Bar */}
      <div className="bg-black/90 backdrop-blur-xl border-t border-white/[0.06] px-6 py-2">
        <div className="w-full flex items-center justify-center gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isFirstStep}
            className={cn(
              "min-w-[80px] gap-1.5 flex-shrink-0 h-8",
              "text-white/70 hover:text-white hover:bg-white/5",
              isFirstStep && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-xs">Back</span>
          </Button>

          {/* Timeline Steps */}
          <div className="flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-0">
              {VLOG_STEPS.map((step, index) => {
                const status = getStepStatus(step.id);
                const isClickable = canNavigateTo(step.id);
                
                return (
                  <div key={step.id} className="flex items-center">
                    {/* Step Button */}
                    <motion.button
                      onClick={() => isClickable && onStepClick(step.id)}
                      disabled={!isClickable}
                      className={cn(
                        "relative flex items-center gap-2 px-3 py-1.5 rounded-lg",
                        "transition-all duration-300",
                        isClickable && "cursor-pointer",
                        !isClickable && "cursor-not-allowed opacity-50"
                      )}
                      whileHover={isClickable ? { scale: 1.02 } : undefined}
                      whileTap={isClickable ? { scale: 0.98 } : undefined}
                    >
                      {/* Step Icon/Number */}
                      <motion.div 
                        className={cn(
                          "relative flex items-center justify-center w-8 h-8 rounded-lg",
                          "border-2 transition-all duration-300",
                          status === 'active' && "border-transparent",
                          status === 'completed' && "border-transparent",
                          status === 'upcoming' && "border-white/20 bg-white/5"
                        )}
                        style={(status === 'active' || status === 'completed') ? {
                          background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 107, 74, 0.6))`
                        } : undefined}
                        animate={status === 'active' ? {
                          boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 20px 4px rgba(255,255,255,0.1)', '0 0 0 0 rgba(255,255,255,0)']
                        } : undefined}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <AnimatePresence mode="wait">
                          {status === 'completed' ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                            >
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="icon"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="text-base"
                            >
                              {step.icon}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Step Label */}
                      <span className={cn(
                        "text-xs font-semibold transition-colors duration-300",
                        status === 'active' ? "text-white" : "text-white/60"
                      )}>
                        {step.shortLabel}
                      </span>

                      {/* Active indicator bar */}
                      {status === 'active' && (
                        <motion.div
                          layoutId="activeStep"
                          className={cn(
                            "absolute inset-0 rounded-lg -z-10",
                            "bg-gradient-to-r",
                            accentClasses.gradient,
                            "opacity-60"
                          )}
                        />
                      )}
                    </motion.button>

                    {/* Connector Line */}
                    {index < VLOG_STEPS.length - 1 && (
                      <div className="w-8 h-0.5 mx-0.5 relative overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className={cn("h-full rounded-full bg-gradient-to-r opacity-60", accentClasses.gradient)}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: status === 'completed' || 
                                   (status === 'active' && completedSteps.includes(step.id)) 
                              ? '100%' 
                              : '0%' 
                          }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next/Complete Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-shrink-0">
            <Button
              onClick={onNext}
              disabled={isNextDisabled}
              size="sm"
              className="min-w-[100px] gap-1.5 font-semibold h-8 text-xs hover:opacity-90 transition-opacity shadow-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
              }}
            >
              {nextLabel || (isLastStep ? "Export Video" : "Continue")}
              {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

