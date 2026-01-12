// Ambient Timeline Navigation - Bottom navigation with step indicators
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AMBIENT_STEPS, AmbientStepId } from "./types";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AmbientTimelineNavigationProps {
  currentStep: AmbientStepId;
  completedSteps: AmbientStepId[];
  onStepClick: (step: AmbientStepId) => void;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  nextLabel?: string;
  hideNextButton?: boolean;
  hideBackButton?: boolean;
}

export function AmbientTimelineNavigation({
  currentStep,
  completedSteps,
  onStepClick,
  onNext,
  onBack,
  isNextDisabled = false,
  nextLabel,
  hideNextButton = false,
  hideBackButton = false
}: AmbientTimelineNavigationProps) {
  const currentIndex = AMBIENT_STEPS.findIndex(s => s.id === currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === AMBIENT_STEPS.length - 1;

  const getStepStatus = (stepId: AmbientStepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    const stepIndex = AMBIENT_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    return 'upcoming';
  };

  const canNavigateTo = (stepId: AmbientStepId) => {
    const stepIndex = AMBIENT_STEPS.findIndex(s => s.id === stepId);
    // Can always go back
    if (stepIndex < currentIndex) return true;
    // Can go forward only if current is completed
    if (stepIndex === currentIndex) return true;
    // Can go to next if current step is completed
    return completedSteps.includes(currentStep);
  };

  // Cyan/Teal accent colors for ambient visual
  const accentClasses = {
    gradient: "from-cyan-500 via-teal-500 to-blue-500",
    glow: "shadow-cyan-500/30",
    bg: "bg-cyan-500",
    text: "text-cyan-500",
    border: "border-cyan-500/30"
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Gradient fade at top */}
      <div className="h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      
      {/* Main Navigation Bar */}
      <div className="bg-black/90 backdrop-blur-xl border-t border-white/[0.06] px-6 py-4">
        <div className="w-full flex items-center justify-center gap-6">
          {/* Back Button */}
          {!hideBackButton && (
            <Button
              variant="ghost"
              size="lg"
              onClick={onBack}
              disabled={isFirstStep}
              className={cn(
                "min-w-[100px] gap-2 flex-shrink-0",
                "text-white/70 hover:text-white hover:bg-white/5",
                isFirstStep && "opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {hideBackButton && <div className="min-w-[100px]" />}

          {/* Timeline Steps */}
          <div className="flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-1">
              {AMBIENT_STEPS.map((step, index) => {
                const status = getStepStatus(step.id);
                const isClickable = canNavigateTo(step.id);
                
                return (
                  <div key={step.id} className="flex items-center">
                    {/* Step Button */}
                    <motion.button
                      onClick={() => isClickable && onStepClick(step.id)}
                      disabled={!isClickable}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-2.5 rounded-xl",
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
                          "relative flex items-center justify-center w-10 h-10 rounded-xl",
                          "border-2 transition-all duration-300",
                          status === 'active' && cn("border-transparent", accentClasses.bg),
                          status === 'completed' && cn(accentClasses.bg, "border-transparent"),
                          status === 'upcoming' && "border-white/20 bg-white/5"
                        )}
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
                              <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="icon"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="text-lg"
                            >
                              {step.icon}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Step Label */}
                      <div className="flex flex-col items-start">
                        <span className={cn(
                          "text-xs font-medium transition-colors duration-300",
                          status === 'active' ? accentClasses.text : "text-white/40"
                        )}>
                          Step {index + 1}
                        </span>
                        <span className={cn(
                          "text-sm font-semibold transition-colors duration-300",
                          status === 'active' ? "text-white" : "text-white/60"
                        )}>
                          {step.shortLabel}
                        </span>
                      </div>

                      {/* Active indicator bar */}
                      {status === 'active' && (
                        <motion.div
                          layoutId="activeStep"
                          className={cn(
                            "absolute inset-0 rounded-xl -z-10",
                            "bg-gradient-to-r",
                            accentClasses.gradient,
                            "opacity-10"
                          )}
                        />
                      )}
                    </motion.button>

                    {/* Connector Line */}
                    {index < AMBIENT_STEPS.length - 1 && (
                      <div className="w-12 h-0.5 mx-1 relative overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className={cn("h-full rounded-full bg-gradient-to-r", accentClasses.gradient)}
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
          {!hideNextButton ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-shrink-0">
              <Button
                onClick={onNext}
                disabled={isNextDisabled}
                size="lg"
                className={cn(
                  "min-w-[120px] gap-2 font-semibold",
                  "bg-gradient-to-r",
                  accentClasses.gradient,
                  "hover:opacity-90 transition-opacity",
                  "shadow-lg",
                  accentClasses.glow
                )}
              >
                {nextLabel || (isLastStep ? "Export Video" : "Continue")}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </motion.div>
          ) : (
            <div className="min-w-[120px]" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

