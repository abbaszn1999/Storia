import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { GenerationStage } from "../../types";

interface ProgressTrackerProps {
  current: number; // 1-10
  total: number; // 10
  currentStage?: GenerationStage;
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

export function ProgressTracker({
  current,
  total,
  currentStage,
  stageProgress,
  className,
}: ProgressTrackerProps) {
  const overallProgress = (current / total) * 100;

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
          {currentStage && stageProgress !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Current Stage
                </span>
                <span className="text-sm text-muted-foreground">
                  {stageProgress}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stages.map((stage, index) => {
                  const isCompleted = stages.findIndex(s => s.id === currentStage) > index;
                  const isCurrent = stage.id === currentStage;
                  
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
