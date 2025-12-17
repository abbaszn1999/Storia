import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Sparkles, Check, X, Edit2, AlertTriangle, Lock } from "lucide-react";
import type { Shot, ContinuityGroup, Scene } from "@/types/storyboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface ContinuityProposalProps {
  scenes: Scene[];
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
  const totalShots = Object.values(allShots).flat().length;

  const canLock = totalApprovedGroups > 0;

  // Helper to render a group card with optional action buttons
  const renderGroupCard = (
    scene: Scene,
    group: ContinuityGroup,
    idx: number,
    showActions: boolean = false,
    isApprovedGroup: boolean = false
  ) => {
    return (
      <Card key={group.id} className={`border-l-4 ${isApprovedGroup ? 'border-l-green-500' : 'border-l-primary'}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  Group {idx + 1}
                </Badge>
                <Badge variant="outline" className={getConnectionTypeColor(group.transitionType)}>
                  {getConnectionTypeIcon(group.transitionType)} {group.transitionType || 'Unknown'}
                </Badge>
                {isApprovedGroup && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <Check className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                )}
              </div>
              {showActions && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGroupApprove(scene.id, group.id)}
                    data-testid={`button-approve-group-${group.id}`}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGroupDecline(scene.id, group.id)}
                    data-testid={`button-decline-group-${group.id}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}
            </div>

            {group.description && (
              <p className="text-sm text-muted-foreground italic">
                {group.description}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {(group.shotIds as string[]).map((shotId, shotIdx) => {
                const shot = getShotById(scene.id, shotId);
                if (!shot) return null;

                return (
                  <div key={shotId} className="flex items-center">
                    <Badge
                      variant="outline"
                      className="bg-card hover-elevate"
                      data-testid={`badge-shot-${shot.shotNumber}`}
                    >
                      <span className="font-mono text-xs">Shot {shot.shotNumber}</span>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-xs">{shot.shotType}</span>
                    </Badge>
                    {shotIdx < (group.shotIds as string[]).length - 1 && (
                      <LinkIcon className="h-3 w-3 mx-2 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <span className="font-semibold">Effect:</span> {(group.shotIds as string[]).length - 1} seamless transition
              {(group.shotIds as string[]).length - 1 !== 1 ? 's' : ''} • 
              Only first shot generates start frame, last shot generates end frame
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show the generate button when there are no proposals
  if (totalProposedGroups === 0 && totalApprovedGroups === 0 && !isGenerating) {
    return (
      <div className="flex items-center justify-between p-4 bg-card/30 rounded-lg border border-dashed border-primary/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-storia">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Ready to analyze shot continuity</p>
            <p className="text-xs text-muted-foreground">
              AI will suggest which shots should connect seamlessly across {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={onGenerateProposal} className="bg-gradient-storia" data-testid="button-generate-continuity">
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze All Shots for Continuity
        </Button>
      </div>
    );
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
              className="bg-gradient-storia" 
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
