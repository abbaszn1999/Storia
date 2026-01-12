import { ScrollArea } from "@/components/ui/scroll-area";
import { BeatCard } from "./beat-card";
import { ConnectionLine } from "./connection-line";
import type { BeatPrompt } from "@/types/commerce";
import type { BeatStatus, BeatGenerationState } from "@/types/commerce";

interface BeatListProps {
  beats: BeatPrompt[];
  selectedBeatId: string | null;
  generationState: BeatGenerationState;
  onBeatSelect: (beatId: string) => void;
}

export function BeatList({
  beats,
  selectedBeatId,
  generationState,
  onBeatSelect,
}: BeatListProps) {
  const getBeatStatus = (beat: BeatPrompt): BeatStatus => {
    const state = generationState[beat.beatId];
    if (state) return state.status;
    
    // All beats are now independent - no connection logic needed
    return 'pending';
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-br from-background/95 via-background/90 to-muted/10 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 shadow-md">
            <span className="text-xl">🎬</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Video Beats</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {beats.length} beat{beats.length !== 1 ? 's' : ''} • {beats[0]?.total_duration || 12}s each
            </p>
          </div>
        </div>
      </div>
      
      {/* Beat List */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-6 space-y-5">
          {beats.map((beat, index) => {
            const status = getBeatStatus(beat);
            const isSelected = selectedBeatId === beat.beatId;
            const previousBeat = index > 0 ? beats[index - 1] : null;
            const previousStatus = previousBeat ? getBeatStatus(previousBeat) : null;

            return (
              <div key={beat.beatId} className="relative">
                <BeatCard
                  beat={beat}
                  status={status}
                  isSelected={isSelected}
                  onClick={() => onBeatSelect(beat.beatId)}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

