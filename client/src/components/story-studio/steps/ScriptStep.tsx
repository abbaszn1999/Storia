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
  AlertCircle,
  Plus
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
  error?: string | null;
  onStoryChange: (text: string) => void;
  onSceneUpdate: (id: string, updates: Partial<StoryScene>) => void;
  onSceneAdd: () => void;
  onSceneDelete: (id: string) => void;
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
function ErrorState({ 
  onRetry, 
  accentColor, 
  errorMessage 
}: { 
  onRetry: () => void; 
  accentColor: string;
  errorMessage?: string | null;
}) {
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
              {errorMessage || 'Something went wrong while generating your scenes. Please try again.'}
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
  error,
  onStoryChange,
  onSceneUpdate,
  onSceneAdd,
  onSceneDelete,
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
    return <ErrorState onRetry={onGenerateScenes} accentColor={accentColor} errorMessage={error} />;
  }

  // Show scene cards
  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-lg bg-gradient-to-br",
              accentClasses
            )}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Scene Breakdown</h2>
              <p className="text-white/40 text-sm">
                {scenes.length} scenes · {totalDuration}s total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onSceneAdd}
              className="gap-2 h-9 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Scene
            </Button>
            <Button
              variant="outline"
              onClick={onGenerateScenes}
              className="gap-2 h-9 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
          </div>
        </div>
      </div>

      {/* Scene Cards Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenes.map((scene, index) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="h-full"
            >
              <GlassPanel noPadding className="h-full flex flex-col overflow-hidden">
                {/* Scene Header - Compact */}
                <div className={cn(
                  "px-3 py-2.5 flex items-center justify-between",
                  "bg-gradient-to-r",
                  accentClasses,
                  "bg-opacity-10 border-b border-white/10"
                )}>
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-bold",
                    "bg-gradient-to-r",
                    accentClasses,
                    "text-white"
                  )}>
                    Scene {scene.sceneNumber}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-white/60" />
                      <Input
                        type="number"
                        value={scene.duration}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const clampedValue = Math.min(Math.max(value, 1), 10);
                          onSceneUpdate(scene.id, { duration: clampedValue });
                        }}
                        className="w-10 h-5 bg-transparent border-none text-xs text-center p-0 text-white"
                        min="1"
                        max="10"
                      />
                      <span className="text-xs text-white/60">s</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSceneDelete(scene.id)}
                      className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Scene Content - Flexible */}
                <div className="flex-1 p-3">
                  <Textarea
                    value={scene.narration}
                    onChange={(e) => onSceneUpdate(scene.id, { narration: e.target.value })}
                    className={cn(
                      "h-full min-h-[180px] bg-white/5 border-white/10",
                      "focus:border-white/20 resize-none",
                      "text-sm leading-relaxed text-white/90",
                      "placeholder:text-white/20"
                    )}
                    placeholder="Enter scene narration..."
                  />
                </div>
              </GlassPanel>
            </motion.div>
          ))}
          
          {/* Add Scene Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: scenes.length * 0.03 }}
            className="h-full min-h-[280px]"
          >
            <button
              onClick={onSceneAdd}
              className={cn(
                "w-full h-full rounded-xl border-2 border-dashed border-white/20",
                "bg-white/[0.02] hover:bg-white/[0.05]",
                "flex flex-col items-center justify-center gap-3",
                "transition-all duration-200 group"
              )}
            >
              <div className={cn(
                "p-3 rounded-lg bg-gradient-to-br",
                accentClasses,
                "group-hover:scale-110 transition-transform"
              )}>
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/70">Add New Scene</p>
                <p className="text-xs text-white/40 mt-1">Click to add a scene</p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer Stats - Fixed */}
      <div className="flex-shrink-0 px-8 py-4 border-t border-white/[0.06] bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-white/50">
              Total Duration: 
              <span className={cn(
                "ml-2 font-semibold",
                totalDuration === duration ? "text-green-400" : "text-yellow-400"
              )}>
                {totalDuration}s
              </span>
            </p>
            {duration && totalDuration !== duration && (
              <span className="text-sm text-yellow-400/80">
                (Target: {duration}s)
              </span>
            )}
            {totalDuration === duration && (
              <span className="text-xs text-green-400 flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10">
                ✓ Ready to proceed
              </span>
            )}
          </div>
          <p className="text-xs text-white/30">
            {aspectRatio} · {imageMode} · {voiceoverEnabled ? 'Voiceover On' : 'Voiceover Off'}
          </p>
        </div>
      </div>
    </div>
  );
}
