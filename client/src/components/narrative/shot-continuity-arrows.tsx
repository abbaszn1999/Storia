import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Shot, ContinuityGroup } from "@/types/storyboard";
import { useEffect, useRef, useState } from "react";

interface ShotContinuityArrowsProps {
  sceneId: string;
  sceneShots: Shot[];
  proposedGroups: ContinuityGroup[];
  approvedGroups: ContinuityGroup[];
  isLocked: boolean;
  onApproveConnection: (shotId1: string, shotId2: string) => void;
  onDeclineConnection: (shotId1: string, shotId2: string) => void;
  shotRefs: React.RefObject<(HTMLDivElement | null)[]>;
}

export function ShotContinuityArrows({
  sceneId,
  sceneShots,
  proposedGroups,
  approvedGroups,
  isLocked,
  onApproveConnection,
  onDeclineConnection,
  shotRefs,
}: ShotContinuityArrowsProps) {
  const [shotPositions, setShotPositions] = useState<{ top: number; height: number }[]>([]);
  
  // Measure shot positions whenever shots or refs change
  useEffect(() => {
    if (!shotRefs.current) return;
    
    const positions = shotRefs.current.map((ref) => {
      if (!ref) return { top: 0, height: 68 };
      const rect = ref.getBoundingClientRect();
      const parentRect = ref.offsetParent?.getBoundingClientRect();
      return {
        top: parentRect ? rect.top - parentRect.top : ref.offsetTop,
        height: rect.height,
      };
    });
    
    setShotPositions(positions);
  }, [sceneShots, shotRefs]);
  // Build a map of shot connections from continuity groups
  const shotConnections = new Map<string, {
    nextShotId: string;
    status: 'proposed' | 'approved';
    groupId: string;
  }>();

  // Process approved groups
  approvedGroups.forEach(group => {
    const shotIds = group.shotIds as string[];
    for (let i = 0; i < shotIds.length - 1; i++) {
      shotConnections.set(shotIds[i], {
        nextShotId: shotIds[i + 1],
        status: 'approved',
        groupId: group.id,
      });
    }
  });

  // Process proposed groups (only if not locked)
  if (!isLocked) {
    proposedGroups.forEach(group => {
      const shotIds = group.shotIds as string[];
      for (let i = 0; i < shotIds.length - 1; i++) {
        // Don't override approved connections
        if (!shotConnections.has(shotIds[i])) {
          shotConnections.set(shotIds[i], {
            nextShotId: shotIds[i + 1],
            status: 'proposed',
            groupId: group.id,
          });
        }
      }
    });
  }

  // Render arrows for each connected shot using measured positions
  return (
    <>
      {sceneShots.map((shot, index) => {
        const connection = shotConnections.get(shot.id);
        if (!connection) return null;

        // Get measured position or use fallback
        const currentPos = shotPositions[index] || { top: 0, height: 68 };
        const nextPos = shotPositions[index + 1] || { top: currentPos.top + currentPos.height, height: 68 };
        
        const arrowTop = currentPos.top + currentPos.height - 12; // Start near bottom of current shot
        const arrowHeight = nextPos.top - arrowTop + 12; // End near top of next shot

        const isApproved = connection.status === 'approved';
        const arrowColor = isApproved ? 'stroke-green-500' : 'stroke-primary';

        return (
          <div
            key={`arrow-${shot.id}`}
            className="absolute left-[6px] z-10 pointer-events-none"
            style={{
              top: `${arrowTop}px`,
              height: `${Math.max(arrowHeight, 20)}px`,
            }}
          >
            {/* Curved arrow SVG */}
            <svg
              width="20"
              height={Math.max(arrowHeight, 20)}
              viewBox={`0 0 20 ${Math.max(arrowHeight, 20)}`}
              className="overflow-visible"
            >
              <path
                d={`M 4 0 Q 4 ${Math.max(arrowHeight, 20) / 2}, 4 ${Math.max(arrowHeight, 20)}`}
                fill="none"
                className={arrowColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Arrowhead at bottom */}
              <path
                d={`M 4 ${Math.max(arrowHeight, 20)} L 1 ${Math.max(arrowHeight, 20) - 6} M 4 ${Math.max(arrowHeight, 20)} L 7 ${Math.max(arrowHeight, 20) - 6}`}
                fill="none"
                className={arrowColor}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Approve/Decline buttons (only for proposed connections) */}
            {!isLocked && !isApproved && (
              <div 
                className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-md p-0.5 shadow-lg pointer-events-auto"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 hover:bg-green-500/10 hover:text-green-500"
                  onClick={() => onApproveConnection(shot.id, connection.nextShotId)}
                  data-testid={`button-approve-connection-${shot.id}`}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDeclineConnection(shot.id, connection.nextShotId)}
                  data-testid={`button-decline-connection-${shot.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Approved indicator */}
            {isApproved && (
              <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-auto">
                <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-1.5 py-0.5">
                  <Check className="h-3 w-3 text-green-500" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
