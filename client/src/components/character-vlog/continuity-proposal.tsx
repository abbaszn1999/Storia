import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Sparkles, Check, X, AlertTriangle, Lock } from "lucide-react";
import type { Shot, ContinuityGroup } from "@/types/storyboard";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContinuityProposalProps {
  scenes: Array<{ id: string; name: string }>;
  allShots: { [sceneId: string]: Shot[] };
  proposedGroups: { [sceneId: string]: ContinuityGroup[] };
  approvedGroups: { [sceneId: string]: ContinuityGroup[] };
  declinedGroups?: { [sceneId: string]: ContinuityGroup[] };
  onGroupApprove: (sceneId: string, groupId: string) => void;
  onGroupDecline: (sceneId: string, groupId: string) => void;
  onGroupEdit: (sceneId: string, updatedGroup: ContinuityGroup) => void;
  onLock: () => void;
  onGenerateProposal: () => void;
  isGenerating?: boolean;
  isLocked?: boolean;
}

export function ContinuityProposal({
  scenes,
  allShots,
  proposedGroups,
  approvedGroups,
  declinedGroups = {},
  onGroupApprove,
  onGroupDecline,
  onGroupEdit,
  onLock,
  onGenerateProposal,
  isGenerating = false,
  isLocked = false,
}: ContinuityProposalProps) {

  const getShotById = (sceneId: string, shotId: string) => {
    const sceneShots = allShots[sceneId] || [];
    return sceneShots.find((s: Shot) => s.id === shotId);
  };

  const getConnectionTypeColor = (type: string | null) => {
    switch (type) {
      case "flow": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pan": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "character-movement": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getConnectionTypeIcon = (type: string | null) => {
    switch (type) {
      case "flow": return "→";
      case "pan": return "⟿";
      case "character-movement": return "⇝";
      default: return "—";
    }
  };

  const totalProposedGroups = Object.values(proposedGroups).flat().length;
  const totalApprovedGroups = Object.values(approvedGroups).flat().length;
  const totalDeclinedGroups = Object.values(declinedGroups).flat().length;

  const canLock = totalApprovedGroups > 0;

  // Don't show generate button - continuity is automatically analyzed when shots are created
  // Return null if no groups exist (continuity will be generated automatically)
  if (totalProposedGroups === 0 && totalApprovedGroups === 0 && !isGenerating) {
    return null;
  }

  // Show loading state while generating
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-6 bg-card/30 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Analyzing shot continuity...</p>
        </div>
      </div>
    );
  }

  // Show status bar when proposals exist or are approved
  return (
    <div className="space-y-4">
      {/* Review alert for proposed connections */}
      {!isLocked && totalProposedGroups > 0 && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Review Required:</strong> AI has proposed continuity connections. 
            Review the arrows in the shot list below and approve or decline each connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Status bar showing approved and pending connections */}
      {(totalProposedGroups > 0 || totalApprovedGroups > 0) && (
        <div className="flex items-center justify-between p-4 bg-card/30 rounded-lg border">
          <div className="flex items-center gap-6">
            {totalApprovedGroups > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">
                  <span className="font-medium text-green-600 dark:text-green-400">{totalApprovedGroups}</span> approved
                </span>
              </div>
            )}
            {!isLocked && totalProposedGroups > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm">
                  <span className="font-medium text-primary">{totalProposedGroups}</span> pending review
                </span>
              </div>
            )}
          </div>
          
          {/* Lock button */}
          {!isLocked && totalApprovedGroups > 0 && (
            <Button 
              onClick={onLock} 
              disabled={!canLock}
              className="bg-gradient-to-r from-[#FF4081] to-[#FF6B4A]" 
              data-testid="button-lock-continuity"
            >
              <Lock className="h-4 w-4 mr-2" />
              Lock & Continue
            </Button>
          )}
          
          {/* Locked indicator */}
          {isLocked && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
      )}

      {/* Locked success alert */}
      {isLocked && (
        <Alert className="border-green-500/50 bg-green-500/5">
          <Lock className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            <strong>Continuity Locked:</strong> Shot connections are now final. 
            The storyboard will generate frames according to this continuity plan.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
