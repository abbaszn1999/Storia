import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Lock, Clock, Link2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BeatStatus } from "@/types/commerce";
import type { BeatPrompt } from "@/types/commerce";

interface BeatCardProps {
  beat: BeatPrompt;
  status: BeatStatus;
  isSelected: boolean;
  onClick: () => void;
}

export function BeatCard({ beat, status, isSelected, onClick }: BeatCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          borderColor: 'border-green-500/50',
          bgGradient: 'from-green-500/10 via-green-500/5 to-transparent',
          iconColor: 'text-green-500',
          badgeColor: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
          label: 'Completed',
          glow: 'shadow-green-500/20',
        };
      case 'generating':
        return {
          icon: Loader2,
          borderColor: 'border-yellow-500/50',
          bgGradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
          iconColor: 'text-yellow-500',
          badgeColor: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
          label: 'Generating',
          animate: true,
          glow: 'shadow-yellow-500/20 animate-pulse',
        };
      case 'locked':
        return {
          icon: Lock,
          borderColor: 'border-gray-400/30',
          bgGradient: 'from-gray-500/5 via-gray-500/3 to-transparent',
          iconColor: 'text-gray-400',
          badgeColor: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          label: 'Locked',
          glow: '',
        };
      case 'failed':
        return {
          icon: Clock,
          borderColor: 'border-red-500/50',
          bgGradient: 'from-red-500/10 via-red-500/5 to-transparent',
          iconColor: 'text-red-500',
          badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
          label: 'Failed',
          glow: 'shadow-red-500/20',
        };
      case 'pending':
      default:
        return {
          icon: Sparkles,
          borderColor: 'border-blue-500/50',
          bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
          iconColor: 'text-blue-500',
          badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
          label: 'Ready',
          glow: 'shadow-blue-500/20',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "group relative cursor-pointer overflow-hidden border-2 transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02]",
        config.borderColor,
        `bg-gradient-to-br ${config.bgGradient}`,
        isSelected && "ring-2 ring-primary ring-offset-2 shadow-xl",
        status === 'locked' && "opacity-60", // Keep opacity but allow clicking to view details
        config.glow
      )}
      onClick={onClick} // Always allow clicking to view details, even when locked
    >
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-300",
        "bg-gradient-to-br from-primary/5 via-transparent to-transparent",
        isSelected && "opacity-100"
      )} />
      
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-base text-foreground truncate">
                {beat.beatName}
              </h3>
              {beat.isConnectedToPrevious && (
                <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5",
                  "border-border/50 bg-background/50"
                )}
              >
                {beat.beatId}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{beat.total_duration}s</span>
              </div>
            </div>
            
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-3 py-1 border",
                config.badgeColor,
                config.animate && "animate-pulse"
              )}
            >
              <Icon className={cn(
                "mr-1.5 h-3.5 w-3.5",
                config.animate && "animate-spin"
              )} />
              {config.label}
            </Badge>
          </div>
          
          {/* Selection indicator */}
          {isSelected && (
            <div className="flex-shrink-0">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

