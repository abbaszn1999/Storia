import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { GenerationStage } from "../../types";

interface ProgressTrackerProps {
  current: number; // completed items count
  total: number; // total items count
  currentStage?: GenerationStage | string;
  stageProgress?: number; // 0-100
  className?: string;
}

const stages: { id: GenerationStage; label: string }[] = [
  { id: 'script', label: 'Script' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'visuals', label: 'Visuals' },
  { id: 'audio', label: 'Audio' },
  { id: 'composing', label: 'Composing' },
];

/**
 * Map server-side stage names to client GenerationStage IDs.
 * Server sends descriptive names like 'Generating story script',
 * 'Breaking into scenes', etc. This maps them to the 5 visual stages.
 */
function mapStageToId(stage: string | undefined): GenerationStage | undefined {
  if (!stage) return undefined;
  const lower = stage.toLowerCase();
  if (lower.includes('script') || lower.includes('story script')) return 'script';
  if (lower.includes('scene') || lower.includes('storyboard')) return 'scenes';
  if (lower.includes('image') || lower.includes('video') || lower.includes('visual')) return 'visuals';
  if (lower.includes('voiceover') || lower.includes('music') || lower.includes('audio')) return 'audio';
  if (lower.includes('export') || lower.includes('composing') || lower.includes('final')) return 'composing';
  // Check if it's already a valid stage ID
  if (['script', 'scenes', 'visuals', 'audio', 'composing'].includes(stage)) return stage as GenerationStage;
  return undefined;
}

export function ProgressTracker({
  current,
  total,
  currentStage,
  stageProgress,
  className,
}: ProgressTrackerProps) {
  const overallProgress = total > 0 ? (current / total) * 100 : 0;
  const mappedStage = typeof currentStage === 'string' ? mapStageToId(currentStage) : currentStage;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Overall Progress
              </span>
              <span className="text-sm text-muted-foreground">
                {current}/{total} ({Math.round(overallProgress)}%)
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Stage Progress */}
          {mappedStage && stageProgress !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {typeof currentStage === 'string' && currentStage !== mappedStage ? currentStage : 'Current Stage'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stageProgress}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stages.map((stage, index) => {
                  const isCompleted = stages.findIndex(s => s.id === mappedStage) > index;
                  const isCurrent = stage.id === mappedStage;
                  
                  return (
                    <div 
                      key={stage.id} 
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${isCurrent ? 'bg-primary text-white' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                      `}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`
                        text-xs
                        ${isCurrent ? 'font-medium' : ''}
                        ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
                      `}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
