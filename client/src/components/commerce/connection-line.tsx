import { cn } from "@/lib/utils";
import type { BeatStatus } from "@/types/commerce";

interface ConnectionLineProps {
  fromBeatId: string;
  toBeatId: string;
  isConnected: boolean;
  fromStatus: BeatStatus;
  toStatus: BeatStatus;
}

export function ConnectionLine({
  isConnected,
  fromStatus,
  toStatus,
}: ConnectionLineProps) {
  if (!isConnected) return null;

  const getLineColor = () => {
    // Both completed: green
    if (fromStatus === 'completed' && toStatus === 'completed') {
      return 'stroke-green-500';
    }
    // Previous completed, current generating: animated yellow
    if (fromStatus === 'completed' && toStatus === 'generating') {
      return 'stroke-yellow-500 animate-pulse';
    }
    // Previous completed, current pending: blue
    if (fromStatus === 'completed' && (toStatus === 'pending' || toStatus === 'locked')) {
      return 'stroke-blue-500';
    }
    // Locked: gray dashed
    return 'stroke-gray-400';
  };

  const isDashed = fromStatus !== 'completed' || toStatus === 'locked';
  const isAnimated = fromStatus === 'completed' && toStatus === 'generating';

  return (
    <div className="relative flex items-center justify-center py-3">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2">
        <div className={cn(
          "h-full w-full transition-all duration-500",
          fromStatus === 'completed' && toStatus === 'completed' 
            ? "bg-gradient-to-b from-green-500 via-green-400 to-green-500 shadow-lg shadow-green-500/30"
            : fromStatus === 'completed' && toStatus === 'generating'
            ? "bg-gradient-to-b from-green-500 via-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/30 animate-pulse"
            : fromStatus === 'completed' && (toStatus === 'pending' || toStatus === 'locked')
            ? "bg-gradient-to-b from-green-500 via-blue-400 to-blue-500 shadow-lg shadow-blue-500/30"
            : "bg-gradient-to-b from-gray-400/30 via-gray-400/20 to-gray-400/30"
        )} />
      </div>
      
      {/* Connection node */}
      <div className={cn(
        "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all duration-300",
        fromStatus === 'completed' && toStatus === 'completed'
          ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/30"
          : fromStatus === 'completed' && toStatus === 'generating'
          ? "border-yellow-500 bg-yellow-500/20 shadow-lg shadow-yellow-500/30 animate-pulse"
          : fromStatus === 'completed' && (toStatus === 'pending' || toStatus === 'locked')
          ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30"
          : "border-gray-400/50 bg-gray-400/10"
      )}>
        <div className={cn(
          "h-2 w-2 rounded-full transition-all duration-300",
          fromStatus === 'completed'
            ? "bg-green-500 shadow-lg shadow-green-500/50"
            : "bg-gray-400/50"
        )} />
      </div>
    </div>
  );
}

