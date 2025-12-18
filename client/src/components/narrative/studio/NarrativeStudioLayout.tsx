// Narrative Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { NarrativeStudioBackground } from "./NarrativeStudioBackground";
import { NarrativeTimelineNavigation, NarrativeStepId } from "./NarrativeTimelineNavigation";
import { ArrowLeft, Film } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface NarrativeStudioLayoutProps {
  currentStep: NarrativeStepId;
  completedSteps: NarrativeStepId[];
  direction: number;
  onStepClick: (step: NarrativeStepId) => void;
  onNext: () => void;
  onBack: () => void;
  videoTitle: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
  children: ReactNode;
}

const STEP_LABELS = {
  script: "Script",
  world: "World & Cast",
  breakdown: "Breakdown",
  storyboard: "Storyboard",
  animatic: "Animatic",
  export: "Export",
};

export function NarrativeStudioLayout({
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
}: NarrativeStudioLayoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Narrative Background */}
      <NarrativeStudioBackground />

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
              <Film className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white/70">Narrative Mode</span>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-semibold">{STEP_LABELS[currentStep]}</span>
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
      <NarrativeTimelineNavigation
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

