// Character Vlog Studio Layout - Main container with step transitions
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { VLOG_STEPS, VlogStepId } from "./types";
import { CharacterVlogStudioBackground } from "./CharacterVlogStudioBackground";
import { CharacterVlogTimelineNavigation } from "./CharacterVlogTimelineNavigation";
import { ArrowLeft, User } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface CharacterVlogStudioLayoutProps {
  currentStep: VlogStepId;
  completedSteps: VlogStepId[];
  highestStepReached?: number;
  direction: number;
  onStepClick: (step: VlogStepId) => void;
  onNext: () => void;
  onBack: () => void;
  videoTitle: string;
  isNextDisabled?: boolean;
  nextLabel?: string;
  children: ReactNode;
}

export function CharacterVlogStudioLayout({
  currentStep,
  completedSteps,
  highestStepReached = 0,
  direction,
  onStepClick,
  onNext,
  onBack,
  videoTitle,
  isNextDisabled,
  nextLabel,
  children
}: CharacterVlogStudioLayoutProps) {
  const [, navigate] = useLocation();
  
  const currentStepIndex = VLOG_STEPS.findIndex(s => s.id === currentStep);
  const currentStepInfo = VLOG_STEPS[currentStepIndex];

  return (
    <div className="h-screen flex flex-col bg-[#121212] text-white overflow-hidden">
      {/* Vlog Background */}
      <CharacterVlogStudioBackground />

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
              <div className="p-1 rounded-md relative">
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A] opacity-60" />
                <User className="w-3 h-3 text-white relative z-10" />
              </div>
              <span className="text-sm font-medium text-white/70">Character Vlog</span>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <currentStepInfo.icon className="w-6 h-6" />
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
      <main className="relative z-10 flex-1 overflow-y-auto pb-12 custom-scrollbar">
        <div className="px-6 pb-4">
          {children}
        </div>
      </main>

      {/* Timeline Navigation - Fixed at bottom */}
      <CharacterVlogTimelineNavigation
        currentStep={currentStep}
        completedSteps={completedSteps}
        highestStepReached={highestStepReached}
        onStepClick={onStepClick}
        onNext={onNext}
        onBack={onBack}
        isNextDisabled={isNextDisabled}
        nextLabel={nextLabel}
      />
    </div>
  );
}

