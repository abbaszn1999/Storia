// Script Step - Auto-generated scenes with editable cards
// ═══════════════════════════════════════════════════════════════════════════

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Layers,
  Clock,
  RefreshCw,
  Trash2,
  AlertCircle
} from "lucide-react";
import { StoryScene, StoryTemplate } from "../types";

interface ScriptStepProps {
  template: StoryTemplate;
  storyText: string;
  scenes: StoryScene[];
  duration: number;
  aspectRatio: string;
  imageMode: 'none' | 'transition' | 'image' | 'image-to-video';
  voiceoverEnabled: boolean;
  isGenerating: boolean;
  onStoryChange: (text: string) => void;
  onSceneUpdate: (id: string, updates: Partial<StoryScene>) => void;
  onGenerateScenes: () => void;
  accentColor?: string;
}

// Fullscreen Loading Component
function GeneratingScenes({ accentColor }: { accentColor: string }) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className={cn(
          "w-20 h-20 mx-auto rounded-full animate-spin",
          "border-4 border-white/10",
          "border-t-4",
          "bg-gradient-to-r",
          accentClasses
        )} style={{ borderTopColor: 'transparent' }} />
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-white">Generating Scenes...</h3>
          <p className="text-white/50">Breaking down your story into perfect scenes</p>
        </div>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ onRetry, accentColor }: { onRetry: () => void; accentColor: string }) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <GlassPanel className="max-w-md text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Failed to Generate Scenes</h3>
            <p className="text-white/60 text-sm">
              Something went wrong while generating your scenes. Please try again.
            </p>
          </div>
          <Button
            onClick={onRetry}
            className={cn(
              "gap-2 bg-gradient-to-r",
              accentClasses
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}

export function ScriptStep({
  template,
  storyText,
  scenes,
  duration,
  aspectRatio,
  imageMode,
  voiceoverEnabled,
  isGenerating,
  onStoryChange,
  onSceneUpdate,
  onGenerateScenes,
  accentColor = "primary"
}: ScriptStepProps) {
  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  // Show fullscreen loading during generation
  if (isGenerating) {
    return <GeneratingScenes accentColor={accentColor} />;
  }

  // Show error state if no scenes and not generating
  if (scenes.length === 0) {
    return <ErrorState onRetry={onGenerateScenes} accentColor={accentColor} />;
  }

  // Show scene cards
  return (
    <div className="pt-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br",
              accentClasses
            )}>
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Scene Breakdown</h2>
              <p className="text-white/60 text-sm">
                {scenes.length} scenes · {totalDuration}s total
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onGenerateScenes}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        </div>

        {/* Scene Cards */}
        <div className="space-y-4">
          {scenes.map((scene, index) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassPanel noPadding className="overflow-hidden">
                {/* Scene Header */}
                <div className={cn(
                  "px-4 py-3 flex items-center justify-between",
                  "bg-gradient-to-r",
                  accentClasses,
                  "bg-opacity-20 border-b border-white/10"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-lg text-sm font-bold",
                      "bg-gradient-to-r",
                      accentClasses
                    )}>
                      Scene {scene.sceneNumber}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <Input
                        type="number"
                        value={scene.duration}
                        onChange={(e) => onSceneUpdate(scene.id, { 
                          duration: parseInt(e.target.value) || 0 
                        })}
                        className="w-16 h-6 bg-transparent border-none text-sm text-center p-0"
                        min="1"
                        max="30"
                      />
                      <span className="text-sm">s</span>
                    </div>
                  </div>
                </div>

                {/* Scene Content */}
                <div className="p-4">
                  <Textarea
                    value={scene.narration}
                    onChange={(e) => onSceneUpdate(scene.id, { 
                      narration: e.target.value 
                    })}
                    className={cn(
                      "min-h-[100px] bg-white/5 border-white/10",
                      "focus:border-white/20 resize-none",
                      "text-sm leading-relaxed"
                    )}
                    placeholder="Enter scene narration..."
                  />
                  
                  {scene.visualPrompt && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-white/40 mb-1">Visual Description:</p>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {scene.visualPrompt}
                      </p>
                    </div>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-sm text-white/40">
            Total Duration: {totalDuration}s
            {duration && totalDuration !== duration && (
              <span className="text-yellow-500 ml-2">
                (Target: {duration}s)
              </span>
            )}
          </p>
          <p className="text-sm text-white/40">
            {aspectRatio} · {imageMode} · {voiceoverEnabled ? 'Voiceover On' : 'Voiceover Off'}
          </p>
        </div>
      </div>
    </div>
  );
}
