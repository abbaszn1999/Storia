// Narrative Timeline Navigation - Bottom navigation with step indicators
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, FileText, Users, Split, Image, Play, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type NarrativeStepId = "script" | "world" | "breakdown" | "storyboard" | "animatic" | "export";

interface NarrativeStep {
  id: NarrativeStepId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const NARRATIVE_STEPS: NarrativeStep[] = [
  { id: "script", label: "Script", shortLabel: "Script", icon: <FileText className="w-5 h-5" /> },
  { id: "world", label: "World & Cast", shortLabel: "World", icon: <Users className="w-5 h-5" /> },
  { id: "breakdown", label: "Breakdown", shortLabel: "Breakdown", icon: <Split className="w-5 h-5" /> },
  { id: "storyboard", label: "Storyboard", shortLabel: "Storyboard", icon: <Image className="w-5 h-5" /> },
  { id: "animatic", label: "Animatic", shortLabel: "Animatic", icon: <Play className="w-5 h-5" /> },
  { id: "export", label: "Export", shortLabel: "Export", icon: <Download className="w-5 h-5" /> },
];

interface NarrativeTimelineNavigationProps {
  currentStep: NarrativeStepId;
  completedSteps: NarrativeStepId[];
  onStepClick: (step: NarrativeStepId) => void;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  nextLabel?: string;
}

export function NarrativeTimelineNavigation({
  currentStep,
  completedSteps,
  onStepClick,
  onNext,
  onBack,
  isNextDisabled = false,
  nextLabel
}: NarrativeTimelineNavigationProps) {
  const currentIndex = NARRATIVE_STEPS.findIndex(s => s.id === currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === NARRATIVE_STEPS.length - 1;

  const getStepStatus = (stepId: NarrativeStepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    const stepIndex = NARRATIVE_STEPS.findIndex(s => s.id === stepId);
    if (stepIndex < currentIndex) return 'completed';
    return 'upcoming';
  };

  const canNavigateTo = (stepId: NarrativeStepId) => {
    const stepIndex = NARRATIVE_STEPS.findIndex(s => s.id === stepId);
    // Can always go back
    if (stepIndex < currentIndex) return true;
    // Can go forward only if current is completed
    if (stepIndex === currentIndex) return true;
    // Can go to next if current step is completed
    return completedSteps.includes(currentStep);
  };

  // Pink accent colors for narrative mode
  const accentClasses = {
    gradient: "from-pink-500 to-pink-500",
    glow: "shadow-pink-500/30",
    bg: "bg-pink-500",
    text: "text-pink-400",
    border: "border-pink-500/30"
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

          {/* Timeline Steps */}
          <div className="flex items-center justify-center flex-shrink-0">
            <div className="flex items-center gap-1">
              {NARRATIVE_STEPS.map((step, index) => {
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
                            <motion.div
                              key="icon"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="text-white"
                            >
                              {step.icon}
                            </motion.div>
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
                            accentClasses.bg,
                            "opacity-10"
                          )}
                        />
                      )}
                    </motion.button>

                    {/* Connector Line */}
                    {index < NARRATIVE_STEPS.length - 1 && (
                      <div className="w-12 h-0.5 mx-1 relative overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className={cn("h-full rounded-full", accentClasses.bg)}
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
              size="lg"
              className={cn(
                "min-w-[120px] gap-2 font-semibold",
                accentClasses.bg,
                "hover:opacity-90 transition-opacity",
                "shadow-lg",
                accentClasses.glow,
                isNextDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {nextLabel || (isLastStep ? "Export Video" : "Continue")}
              {!isLastStep && !nextLabel && <ChevronRight className="w-4 h-4" />}
              {nextLabel && <Loader2 className="w-4 h-4 animate-spin" />}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

