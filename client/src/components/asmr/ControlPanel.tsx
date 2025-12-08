// ASMR Control Panel - Left Side Glass Panel

import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowLeft, ImagePlus, Upload, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";

import { CategorySelector } from "./CategorySelector";
import { ModelSelector } from "./ModelSelector";
import { PromptInput } from "./PromptInput";
import { SettingsPanel } from "./SettingsPanel";
import type { ASMRGeneratorState, ASMRGeneratorActions } from "./useASMRGenerator";

interface ControlPanelProps {
  state: ASMRGeneratorState;
  actions: ASMRGeneratorActions;
}

export function ControlPanel({ state, actions }: ControlPanelProps) {
  const showSoundControls = !state.selectedModelInfo.generatesAudio;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        actions.setReferenceImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn(
      "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
      "bg-black/40 backdrop-blur-xl",
      "border-r border-white/[0.06]",
      "flex flex-col"
    )}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/stories">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">ASMR Generator</h1>
              <p className="text-xs text-muted-foreground">Create satisfying videos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Category Selector */}
          <CategorySelector
            selectedCategory={state.selectedCategory}
            onSelect={actions.setCategory}
          />

          {/* Model Selector */}
          <ModelSelector
            value={state.videoModel}
            onChange={actions.setVideoModel}
            selectedModelInfo={state.selectedModelInfo}
          />

          {/* Visual Prompt - with Enhance button (always visible) */}
          <PromptInput
            value={state.visualPrompt}
            onChange={actions.setVisualPrompt}
            onEnhance={actions.enhancePrompt}
            isEnhancing={state.isEnhancing}
            placeholder="Describe the visual scene you want to create..."
            label="Visual Prompt"
            minRows={3}
            showEnhance={true}
          />

          {/* Reference Image Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Reference Image</span>
              {state.referenceImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.setReferenceImage(null)}
                  className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Image Preview or Action Buttons */}
            {state.referenceImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-lg overflow-hidden border border-white/10"
              >
                <img
                  src={state.referenceImage}
                  alt="Reference"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-xs bg-white/10"
                    onClick={actions.generateImage}
                    disabled={state.isGeneratingImage || !state.visualPrompt.trim()}
                  >
                    {state.isGeneratingImage ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3 mr-1" />
                    )}
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-xs bg-white/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Replace
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="flex gap-2">
                {/* AI Generate Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={actions.generateImage}
                  disabled={state.isGeneratingImage || !state.visualPrompt.trim()}
                  className={cn(
                    "flex-1 h-10",
                    "bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10",
                    "border-purple-500/30 hover:border-purple-500/50",
                    "hover:bg-purple-500/20",
                    "transition-all duration-300"
                  )}
                >
                  {state.isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 text-purple-400" />
                      AI Generate
                    </>
                  )}
                </Button>

                {/* Upload Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-3 border-white/10 hover:border-white/20"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/50">
              {state.referenceImage 
                ? "Image will be used as first frame for video generation"
                : "Generate or upload an image as starting frame"}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Settings Panel */}
          <SettingsPanel
            aspectRatio={state.aspectRatio}
            resolution={state.resolution}
            duration={state.duration}
            loopMultiplier={state.loopMultiplier}
            modelInfo={state.selectedModelInfo}
            onAspectRatioChange={actions.setAspectRatio}
            onResolutionChange={actions.setResolution}
            onDurationChange={actions.setDuration}
            onLoopMultiplierChange={actions.setLoopMultiplier}
            showAudioSettings={showSoundControls}
            soundIntensity={state.soundIntensity}
            onSoundIntensityChange={actions.setSoundIntensity}
          />

          {/* Sound Prompt (if model doesn't generate audio) */}
          {showSoundControls && (
            <PromptInput
              value={state.soundPrompt}
              onChange={actions.setSoundPrompt}
              onEnhance={actions.enhanceSoundPrompt}
              isEnhancing={state.isEnhancingSound}
              enhanceDisabled={!state.visualPrompt.trim()}
              placeholder="Describe the sounds you want..."
              label="Sound Effect Prompt"
              minRows={2}
              showEnhance={true}
            />
          )}
        </div>
      </ScrollArea>

      {/* Footer - Generate Button */}
      <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
        {/* Error Display */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <p className="text-xs text-red-400">{state.error}</p>
          </motion.div>
        )}

        {/* Generate Button */}
        <Button
          onClick={actions.generateVideo}
          disabled={!state.visualPrompt.trim() || state.isGenerating}
          className={cn(
            "w-full h-12",
            "bg-gradient-to-r from-primary to-purple-500",
            "hover:from-primary/90 hover:to-purple-500/90",
            "border-0 shadow-lg shadow-primary/25",
            "transition-all duration-300",
            state.isGenerating && "opacity-80"
          )}
        >
          {state.isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {state.generationStatus || "Generating..."}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate ASMR Video
            </>
          )}
        </Button>

        {/* Quick Stats */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/50">
          <span>Model: {state.selectedModelInfo.label}</span>
          <span>{state.aspectRatio} • {state.resolution} • {state.duration}s</span>
        </div>
      </div>
    </div>
  );
}

