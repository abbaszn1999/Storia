// Timeline Navigation - Bottom navigation with step indicators
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { STEPS, Step, StepId } from "../types";
import { Check, ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineNavigationProps {
  steps?: Step[];  // Optional: filtered steps (e.g., hide 'audio' for auto-asmr)
  currentStep: StepId;
  completedSteps: StepId[];
  onStepClick: (step: StepId) => void;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;  // Disable back button during generation
  isStepClickDisabled?: boolean;  // Disable step clicking during generation
  isLoading?: boolean;  // Loading state for export button
  nextLabel?: string;
  /** Template accent color */
  accentColor?: string;
}

export function TimelineNavigation({
  steps = STEPS,  // Default to all steps if not provided (for backward compatibility)
  currentStep,
  completedSteps,
  onStepClick,
  onNext,
  onBack,
  isNextDisabled = false,
  isBackDisabled = false,
  isStepClickDisabled = false,
  isLoading = false,
  nextLabel,
  accentColor = "primary"
}: TimelineNavigationProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;

  const getStepStatus = (stepId: StepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    return 'upcoming';
  };

  const canNavigateTo = (stepId: StepId) => {
    // If step clicking is disabled (during generation), block all navigation
    if (isStepClickDisabled) return false;
    
    const stepIndex = steps.findIndex(s => s.id === stepId);
    // Can always go back
    if (stepIndex < currentIndex) return true;
    // Can go forward only if current is completed
    if (stepIndex === currentIndex) return true;
    // Can go to next if current step is completed
    return completedSteps.includes(currentStep);
  };

  // Dynamic accent colors
  const accentClasses = {
    primary: {
      gradient: "from-primary via-primary to-violet-500",
      glow: "shadow-primary/30",
      bg: "bg-primary",
      text: "text-primary",
      border: "border-primary/30"
    },
    orange: {
      gradient: "from-orange-500 via-orange-400 to-amber-500",
      glow: "shadow-orange-500/30",
      bg: "bg-orange-500",
      text: "text-orange-500",
      border: "border-orange-500/30"
    },
    violet: {
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      glow: "shadow-violet-500/30",
      bg: "bg-violet-500",
      text: "text-violet-500",
      border: "border-violet-500/30"
    },
    blue: {
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      glow: "shadow-blue-500/30",
      bg: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500/30"
    },
    rose: {
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
      glow: "shadow-rose-500/30",
      bg: "bg-rose-500",
      text: "text-rose-500",
      border: "border-rose-500/30"
    }
  }[accentColor] || {
    gradient: "from-primary via-primary to-violet-500",
    glow: "shadow-primary/30",
    bg: "bg-primary",
    text: "text-primary",
    border: "border-primary/30"
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
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={onBack}
            disabled={isFirstStep || isBackDisabled}
            className={cn(
              "min-w-[120px] gap-2",
              "text-white/70 hover:text-white hover:bg-white/5",
              isFirstStep && "opacity-0 pointer-events-none",
              isBackDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Timeline Steps */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1">
              {steps.map((step, index) => {
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
                    {index < steps.length - 1 && (
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
          <motion.div whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}>
            <Button
              onClick={onNext}
              disabled={isNextDisabled || isLoading}
              size="lg"
              className={cn(
                "min-w-[160px] gap-2 font-semibold",
                "bg-gradient-to-r",
                accentClasses.gradient,
                "hover:opacity-90 transition-opacity",
                "shadow-lg",
                accentClasses.glow
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : isLastStep ? (
                <>
                  <Download className="w-4 h-4" />
                  {nextLabel || "Export Video"}
                </>
              ) : (
                <>
                  {nextLabel || "Continue"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

