import { useState, useEffect, useRef } from "react";
import { SceneBreakdown } from "./scene-breakdown";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ContinuityGroup } from "@/types/storyboard";

interface FlowDesignTabProps {
  videoId: string;
  script: string;
  scriptModel: string;
  narrativeMode?: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
  animationMode: 'image-transitions' | 'video-animation';
  autoGenerate?: boolean; // If true, automatically generate flow design on mount
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onContinuityLocked?: () => void;
  onContinuityGroupsChange?: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
  onGenerationComplete?: () => void; // Called when auto-generation finishes
  onNext: () => void;
}

export function FlowDesignTab({
  videoId,
  script,
  scriptModel,
  narrativeMode,
  scenes,
  shots,
  shotVersions,
  continuityLocked,
  continuityGroups,
  animationMode,
  autoGenerate = false,
  onScenesGenerated,
  onContinuityLocked,
  onContinuityGroupsChange,
  onGenerationComplete,
  onNext,
}: FlowDesignTabProps) {
  const { toast } = useToast();
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const hasTriggeredGeneration = useRef(false);

  // Auto-generate flow design on mount if autoGenerate is true and no data exists
  useEffect(() => {
    const shouldAutoGenerate = autoGenerate && 
                               scenes.length === 0 && 
                               Object.keys(shots).length === 0 &&
                               !hasTriggeredGeneration.current;
    
    if (shouldAutoGenerate) {
      hasTriggeredGeneration.current = true;
      handleAutoGenerate();
    }
  }, [autoGenerate, scenes.length, shots]);

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    
    try {
      const response = await fetch('/api/ambient-visual/flow-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flow design');
      }
      
      const data = await response.json() as { 
        scenes: Scene[]; 
        shots: { [sceneId: string]: Shot[] };
        shotVersions?: { [shotId: string]: ShotVersion[] };
        continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
        totalDuration?: number;
        cost?: number;
      };
      
      onScenesGenerated(data.scenes, data.shots, data.shotVersions);
      
      // Update continuity groups if provided
      if (data.continuityGroups && onContinuityGroupsChange) {
        onContinuityGroupsChange(data.continuityGroups);
      }
      
      toast({
        title: "Flow Design Complete",
        description: `Generated ${data.scenes.length} segments with ${Object.values(data.shots).flat().length} shots.`,
      });
      
      onGenerationComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate flow design';
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // Show full-screen loading during auto-generation
  if (isAutoGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 blur-xl opacity-50 animate-pulse" />
          <div className="relative inline-flex p-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
            <Sparkles className="h-12 w-12 text-cyan-400 animate-pulse" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
            Designing Your Flow
          </h3>
          <p className="text-muted-foreground max-w-md">
            AI is analyzing your atmosphere and visual settings to create the perfect visual segments...
          </p>
        </div>
        
        <div className="flex items-center gap-3 text-cyan-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Creating segments and shots...</span>
        </div>
        
        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-500/30"
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); background-color: rgb(34 211 238); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <SceneBreakdown
      videoId={videoId}
      script={script}
      scriptModel={scriptModel}
      narrativeMode={narrativeMode}
      scenes={scenes}
      shots={shots}
      shotVersions={shotVersions}
      continuityLocked={continuityLocked}
      continuityGroups={continuityGroups}
      onScenesGenerated={onScenesGenerated}
      onContinuityLocked={onContinuityLocked}
      onContinuityGroupsChange={onContinuityGroupsChange}
      onNext={onNext}
    />
  );
}
