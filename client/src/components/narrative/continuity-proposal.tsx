import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Sparkles, Check, X, Edit2, AlertTriangle } from "lucide-react";
import type { Shot, ContinuityGroup, Scene } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContinuityProposalProps {
  scenes: Scene[];
  allShots: { [sceneId: string]: Shot[] };
  proposedGroups: { [sceneId: string]: ContinuityGroup[] };
  onGroupsApproved: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
  onGenerateProposal: () => void;
  isGenerating?: boolean;
}

export function ContinuityProposal({
  scenes,
  allShots,
  proposedGroups,
  onGroupsApproved,
  onGenerateProposal,
  isGenerating = false,
}: ContinuityProposalProps) {
  const [editedGroups, setEditedGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>(proposedGroups);
  const [isApproved, setIsApproved] = useState(false);
  const prevProposedGroupsRef = useRef<string>("");

  // Sync editedGroups with proposedGroups when new proposals are generated
  useEffect(() => {
    // Deterministic deep comparison (sort keys to avoid false positives from key ordering)
    const serializeWithSortedKeys = (obj: any) => JSON.stringify(obj, Object.keys(obj).sort());
    const newSerialized = serializeWithSortedKeys(proposedGroups);
    const contentChanged = prevProposedGroupsRef.current !== newSerialized;
    
    // Update the ref with new value
    prevProposedGroupsRef.current = newSerialized;
    
    // Always sync the groups
    setEditedGroups(proposedGroups);
    
    // Only reset approval if content actually changed
    // This prevents resetting after approval when parent re-sets the same groups
    if (contentChanged) {
      setIsApproved(false);
    }
  }, [proposedGroups]);

  const handleApprove = () => {
    // Don't allow approving if there are no groups
    const totalGroups = Object.values(editedGroups).flat().length;
    if (totalGroups === 0) {
      return;
    }
    setIsApproved(true);
    onGroupsApproved(editedGroups);
  };

  const getShotById = (sceneId: string, shotId: string) => {
    const sceneShots = allShots[sceneId] || [];
    return sceneShots.find(s => s.id === shotId);
  };

  const getSceneById = (sceneId: string) => {
    return scenes.find(s => s.id === sceneId);
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
  const totalShots = Object.values(allShots).flat().length;

  if (totalProposedGroups === 0 && !isGenerating) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-gradient-storia">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Generate Continuity Proposal</h3>
              <p className="text-muted-foreground max-w-md">
                Let AI analyze all {totalShots} shots across {scenes.length} scene{scenes.length !== 1 ? 's' : ''} and suggest which ones should connect seamlessly for cinematic flow
              </p>
            </div>
            <Button onClick={onGenerateProposal} className="bg-gradient-storia" data-testid="button-generate-continuity">
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze All Shots for Continuity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Analyzing shot continuity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!isApproved && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Review Required:</strong> AI has proposed continuity connections across all scenes. 
            Review and approve to lock the continuity before proceeding to storyboard generation.
          </AlertDescription>
        </Alert>
      )}

      <Card className={isApproved ? "border-green-500/50 bg-green-500/5" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-storia">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Continuity Proposal for All Scenes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalProposedGroups} connected group{totalProposedGroups !== 1 ? 's' : ''} proposed across {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {isApproved ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Check className="h-3 w-3 mr-1" />
                Approved & Locked
              </Badge>
            ) : (
              <Button 
                onClick={handleApprove} 
                disabled={totalProposedGroups === 0}
                className="bg-gradient-storia" 
                data-testid="button-approve-continuity"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve & Lock All
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {scenes.map((scene) => {
            const sceneGroups = editedGroups[scene.id] || [];
            if (sceneGroups.length === 0) return null;

            return (
              <div key={scene.id} className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="font-semibold">{scene.title}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {sceneGroups.length} group{sceneGroups.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {sceneGroups.map((group, idx) => (
                  <Card key={group.id} className="border-l-4 border-l-primary">
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
                          </div>
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
                ))}
              </div>
            );
          })}

          {isApproved && (
            <Alert className="border-green-500/50 bg-green-500/5">
              <Check className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                <strong>Continuity Locked:</strong> Shot connections are now final. 
                The storyboard will generate frames according to this continuity plan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
