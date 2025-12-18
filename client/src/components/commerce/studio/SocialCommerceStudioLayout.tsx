// Social Commerce Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { COMMERCE_STEPS, CommerceStepId } from "./types";
import { SocialCommerceStudioBackground } from "./SocialCommerceStudioBackground";
import { SocialCommerceTimelineNavigation } from "./SocialCommerceTimelineNavigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface SocialCommerceStudioLayoutProps {
  currentStep: CommerceStepId;
  completedSteps: CommerceStepId[];
  direction: number;
  onStepClick: (step: CommerceStepId) => void;
  onNext: () => void;
  onBack: () => void;
  videoTitle: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
  children: ReactNode;
}

export function SocialCommerceStudioLayout({
  currentStep,
  completedSteps,
  direction,
  onStepClick,
  onNext,
  onBack,
  videoTitle,
  isNextDisabled,
  nextLabel,
  children
}: SocialCommerceStudioLayoutProps) {
  const [, navigate] = useLocation();
  
  const currentStepIndex = COMMERCE_STEPS.findIndex(s => s.id === currentStep);
  const currentStepInfo = COMMERCE_STEPS[currentStepIndex];

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

      {/* Main Content Area - Scrollable */}
      <main className="relative z-10 flex-1 overflow-y-auto pb-24 custom-scrollbar">
        <div className="px-6 pb-6">
          {children}
        </div>
      </main>

      {/* Timeline Navigation - Fixed at bottom */}
      <SocialCommerceTimelineNavigation
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick}
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        nextLabel={nextLabel}
      />
    </div>
  );
}

