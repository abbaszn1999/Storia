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
    // Only allow navigation to:
    // 1. The current step (user is already there)
    // 2. Completed steps (steps that have been completed via Continue button)
    // Future steps that haven't been completed are disabled
    if (stepId === currentStep) return true;
    if (completedSteps.includes(stepId)) return true;
    
    // Check if it's a previous step (should be completed)
    const stepIndex = VLOG_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return true; // Allow going back to previous steps
    
    // Future steps are not clickable
    return false;
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
                        "relative flex items-center gap-2 px-3 py-2 rounded-lg",
                        "transition-all duration-300",
                        isClickable && "cursor-pointer",
                        !isClickable && "cursor-not-allowed opacity-50",
                        status === 'active' && "bg-white/[0.03]"
                      )}
                      whileHover={isClickable && status !== 'active' ? { backgroundColor: "rgba(255, 255, 255, 0.02)" } : undefined}
                      whileTap={isClickable ? { scale: 0.98 } : undefined}
                    >
                      {/* Step Icon/Number */}
                      <motion.div 
                        className={cn(
                          "relative flex items-center justify-center w-8 h-8 rounded-lg",
                          "border transition-all duration-300",
                          status === 'active' && "border-[#FF4081]/40 shadow-lg shadow-[#FF4081]/20",
                          status === 'completed' && "border-transparent",
                          status === 'upcoming' && "border-white/20 bg-white/5"
                        )}
                        style={status === 'completed' ? {
                          background: `linear-gradient(to right, rgb(255, 64, 129), rgb(255, 107, 74))`
                        } : status === 'active' ? {
                          background: 'rgba(255, 64, 129, 0.1)',
                          backdropFilter: 'blur(10px)'
                        } : undefined}
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
                            <motion.div
                              key="icon"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className={cn(
                                "flex items-center justify-center transition-colors duration-300 text-white",
                                status === 'active' && "text-white"
                              )}
                              style={status === 'active' ? {
                                filter: 'drop-shadow(0 0 8px rgba(255, 64, 129, 0.3))'
                              } : undefined}
                            >
                              <step.icon className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Step Label */}
                      <span className={cn(
                        "text-xs font-semibold transition-all duration-300",
                        status === 'active' && "text-white",
                        status !== 'active' && "text-white/60"
                      )}>
                        {step.shortLabel}
                      </span>

                      {/* Active indicator - Bottom border with gradient */}
                      {status === 'active' && (
                        <motion.div
                          layoutId="activeStepIndicator"
                          className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full mx-2"
                          style={{
                            background: 'linear-gradient(to right, #FF4081, #FF6B4A)',
                            boxShadow: '0 0 8px rgba(255, 64, 129, 0.5)'
                          }}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.button>

                    {/* Connector Line */}
                    {index < VLOG_STEPS.length - 1 && (
                      <div className="w-8 h-0.5 mx-0.5 relative overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(to right, #FF4081, #FF6B4A)'
                          }}
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
              className="min-w-[100px] gap-1.5 font-semibold h-8 text-xs hover:brightness-110 transition-all shadow-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, rgb(255, 64, 129), rgb(255, 92, 141), rgb(255, 107, 74))`,
                boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)'
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

