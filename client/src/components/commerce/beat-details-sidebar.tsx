import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Link2, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Zap,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BeatPrompt } from "@/types/commerce";
import type { BeatStatus, BeatGenerationState } from "@/types/commerce";

interface BeatDetailsSidebarProps {
  beat: BeatPrompt | null;
  status: BeatStatus;
  generationState: BeatGenerationState;
  onGenerate?: () => void;
  onRegenerate?: () => void;
}

export function BeatDetailsSidebar({
  beat,
  status,
  generationState,
  onGenerate,
  onRegenerate,
}: BeatDetailsSidebarProps) {
  if (!beat) {
    return (
      <div className="w-72 shrink-0 h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-white/50">No beat selected</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          label: 'Completed',
        };
      case 'generating':
        return {
          icon: Loader2,
          color: 'text-yellow-500',
          label: 'Generating',
          animate: true,
        };
      case 'locked':
        return {
          icon: Lock,
          color: 'text-gray-400',
          label: 'Locked',
        };
      case 'failed':
        return {
          icon: Clock,
          color: 'text-red-500',
          label: 'Failed',
        };
      case 'pending':
      default:
        return {
          icon: Zap,
          color: 'text-blue-500',
          label: 'Ready',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const beatIndex = parseInt(beat.beatId.replace('beat', '')) || 1;

  return (
    <div className="space-y-3">
      {/* Beat Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50 text-xs px-2">
            # {beatIndex}
          </Badge>
          <h4 className="font-semibold text-sm text-white">{beat.beatName}</h4>
        </div>
      </div>


      {/* Duration */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Clock className="h-3.5 w-3.5" />
        <span>{beat.total_duration}s duration</span>
      </div>

      {/* Status Display */}
      <div className="space-y-2">
        <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Status</Label>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.color, config.animate && "animate-spin")} />
          <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
        </div>
      </div>

      {/* Generate/Regenerate Button */}
      <div className="pt-2">
        {status === 'completed' && onRegenerate ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/50 text-cyan-300 hover:from-cyan-500/30 hover:to-teal-500/30 hover:text-cyan-200"
            onClick={onRegenerate}
          >
            <Zap className="mr-2 h-4 w-4" />
            Regenerate Beat
          </Button>
        ) : status !== 'locked' && onGenerate ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/50 text-cyan-300 hover:from-cyan-500/30 hover:to-teal-500/30 hover:text-cyan-200"
            onClick={onGenerate}
            disabled={status === 'generating'}
          >
            {status === 'generating' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Beat
              </>
            )}
          </Button>
        ) : status === 'locked' ? (
          <div className="text-xs text-white/50 text-center py-2">
            Complete the previous connected beat first
          </div>
        ) : null}
      </div>
    </div>
  );
}

