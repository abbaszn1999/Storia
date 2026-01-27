import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { WizardStep } from "../../types";

interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: number[];
  children: ReactNode;
  footer?: ReactNode;
  onStepClick?: (step: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  campaignName?: string;
  productionType?: 'video' | 'story';
}

export function WizardLayout({
  steps,
  currentStep,
  completedSteps,
  children,
  footer,
  onStepClick,
  onBack,
  onNext,
  canGoBack = true,
  canGoNext = true,
  isFirstStep = false,
  isLastStep = false,
  isSubmitting = false,
  nextLabel,
  campaignName = "New Campaign",
  productionType = 'story',
}: WizardLayoutProps) {
  const [, navigate] = useLocation();
  const currentStepIndex = steps.findIndex(s => s.number === currentStep);
  const currentStepData = steps[currentStepIndex];

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber === currentStep) return 'active';
    const stepIndex = steps.findIndex(s => s.number === stepNumber);
    if (stepIndex < currentStepIndex) return 'completed';
    return 'upcoming';
  };

  const canNavigateTo = (stepNumber: number) => {
    const stepIndex = steps.findIndex(s => s.number === stepNumber);
    if (stepIndex < currentStepIndex) return true;
    if (stepIndex === currentStepIndex) return true;
    return completedSteps.includes(currentStep);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-6 pt-5 pb-3 flex-shrink-0 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Back to Campaigns */}
          <motion.button
            onClick={() => navigate('/autoproduction/campaigns')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ x: -3 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Campaigns</span>
          </motion.button>

          {/* Badge + Step Title */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-primary/10 border border-primary/20"
            )}>
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {productionType === 'video' ? 'Auto Video' : 'Auto Story'}
              </span>
            </div>
            
            <div className="h-4 w-px bg-border/50" />
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-semibold">{currentStepData?.title}</span>
            </motion.div>
          </div>

          {/* Campaign Name */}
          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
            {campaignName}
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-32">
        <div className="px-6 pb-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Timeline Navigation - Fixed at bottom */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Gradient fade */}
        <div className="h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        
        {/* Navigation Bar */}
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
            {/* Left: Back Button */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="lg"
                onClick={onBack}
                disabled={!canGoBack}
                className={cn(
                  "min-w-[100px] gap-2",
                  !canGoBack && "opacity-0 pointer-events-none"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            {/* Center: Steps Timeline */}
            <div className="flex items-center justify-center flex-1">
              <div className="flex items-center gap-1">
                {steps.map((step, index) => {
                  const status = getStepStatus(step.number);
                  const isClickable = canNavigateTo(step.number);
                  const StepIcon = step.icon;
                  
                  return (
                    <div key={step.number} className="flex items-center">
                      {/* Step Button */}
                      <motion.button
                        onClick={() => isClickable && onStepClick?.(step.number)}
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
                        {/* Step Icon */}
                        <motion.div 
                          className={cn(
                            "relative flex items-center justify-center w-10 h-10 rounded-xl",
                            "border-2 transition-all duration-300",
                            status === 'active' && "border-transparent bg-primary shadow-lg shadow-primary/30",
                            status === 'completed' && "bg-primary border-transparent",
                            status === 'upcoming' && "border-border bg-muted/50"
                          )}
                          animate={status === 'active' ? {
                            boxShadow: [
                              '0 0 0 0 rgba(var(--primary), 0)',
                              '0 0 20px 4px rgba(var(--primary), 0.3)',
                              '0 0 0 0 rgba(var(--primary), 0)'
                            ]
                          } : undefined}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {status === 'completed' ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <StepIcon className={cn(
                              "w-5 h-5",
                              status === 'active' && "text-primary-foreground",
                              status === 'upcoming' && "text-muted-foreground"
                            )} />
                          )}
                        </motion.div>

                        {/* Step Label - Hidden on mobile */}
                        <span className={cn(
                          "text-sm font-medium hidden md:block",
                          status === 'active' && "text-foreground",
                          status === 'completed' && "text-foreground/90",
                          status === 'upcoming' && "text-muted-foreground"
                        )}>
                          {step.title}
                        </span>
                      </motion.button>

                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div className={cn(
                          "w-8 h-0.5 mx-1 transition-all duration-300",
                          index < currentStepIndex ? "bg-primary" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Continue/Submit Button */}
            <div className="flex-shrink-0">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onNext}
                  disabled={!canGoNext || isSubmitting}
                  size="lg"
                  className={cn(
                    "min-w-[120px] gap-2 font-semibold",
                    "shadow-lg"
                  )}
                >
                  {isSubmitting ? (
                    "Creating..."
                  ) : isLastStep ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {nextLabel || "Create Campaign"}
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
        </div>
      </motion.div>
    </div>
  );
}
