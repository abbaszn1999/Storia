import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Edit, Trash2, Plus, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ContinuityGroup } from "@shared/schema";
import { SceneDialog } from "./scene-dialog";
import { ShotDialog } from "./shot-dialog";
import { ContinuityProposal } from "./continuity-proposal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface SceneBreakdownProps {
  videoId: string;
  script: string;
  scriptModel: string;
  narrativeMode?: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  continuityLocked?: boolean;
  continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onContinuityLocked?: () => void;
  onContinuityGroupsChange?: (groups: { [sceneId: string]: ContinuityGroup[] }) => void;
  onNext: () => void;
}

export function SceneBreakdown({ 
  videoId, 
  script, 
  scriptModel, 
  narrativeMode,
  scenes, 
  shots, 
  shotVersions, 
  continuityLocked = false,
  continuityGroups: propsGroups = {},
  onScenesGenerated, 
  onContinuityLocked,
  onContinuityGroupsChange,
  onNext 
}: SceneBreakdownProps) {
  const { toast } = useToast();
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | undefined>();
  const [editingShot, setEditingShot] = useState<Shot | undefined>();
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);
  const [synopsis, setSynopsis] = useState<string>(script ? script.substring(0, 200) : "");
  const [isGeneratingContinuity, setIsGeneratingContinuity] = useState(false);
  const [localContinuityLocked, setLocalContinuityLocked] = useState(continuityLocked);
  
  // Use props continuityGroups if available, otherwise local state
  const continuityGroups = propsGroups;
  const setContinuityGroups = onContinuityGroupsChange || (() => {});

  // Sync localContinuityLocked with prop when it changes
  useEffect(() => {
    setLocalContinuityLocked(continuityLocked);
  }, [continuityLocked]);

  const handleGenerateContinuityProposal = async (sceneId: string) => {
    setIsGeneratingContinuity(true);
    try {
      // TODO: Call Agent 3.4 (Continuity Producer) to generate proposal
      // For now, create a dummy proposal
      const sceneShots = shots[sceneId] || [];
      if (sceneShots.length < 2) {
        toast({
          title: "Not enough shots",
          description: "At least 2 shots are needed to create continuity connections.",
          variant: "destructive",
        });
        return;
      }

      // Create a simple continuity group proposal (first 2 shots connected)
      const dummyGroup: ContinuityGroup = {
        id: `group-${Date.now()}`,
        sceneId,
        groupNumber: 1,
        shotIds: [sceneShots[0].id, sceneShots[1].id],
        description: "AI detected continuous camera movement between these shots",
        transitionType: "flow",
        createdAt: new Date(),
      };

      // Use functional updater to avoid stale state
      if (onContinuityGroupsChange) {
        onContinuityGroupsChange((prev: { [sceneId: string]: ContinuityGroup[] }) => ({
          ...prev,
          [sceneId]: [dummyGroup],
        }));
      }

      toast({
        title: "Continuity Proposal Generated",
        description: "Review and approve the proposed shot connections.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate continuity proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContinuity(false);
    }
  };

  const handleContinuityApproval = async (sceneId: string, groups: ContinuityGroup[]) => {
    try {
      // Save the approved groups to the backend
      for (const group of groups) {
        await apiRequest('POST', `/api/narrative/continuity-groups`, {
          sceneId: group.sceneId,
          groupNumber: group.groupNumber,
          shotIds: group.shotIds,
          description: group.description,
          transitionType: group.transitionType,
        });
      }

      // Lock the continuity for the entire video
      await apiRequest('POST', `/api/narrative/videos/${videoId}/lock-continuity`);

      // Only update state after successful API calls
      if (onContinuityLocked) {
        onContinuityLocked();
      }

      toast({
        title: "Continuity Locked",
        description: "Shot connections are now final. Proceeding to storyboard generation.",
      });
    } catch (error: any) {
      // Reset local lock state on failure
      setLocalContinuityLocked(false);
      toast({
        title: "Lock Failed",
        description: error.message || "Failed to lock continuity. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Seed demo data from backend if needed
  useEffect(() => {
    // Only seed if we have no scenes
    if (scenes.length > 0) return;
    
    const seedDemoData = async () => {
      try {
        const response = await apiRequest<{
          scenes: Scene[];
          shots: Shot[];
          shotVersions: ShotVersion[];
          continuityGroups?: ContinuityGroup[];
          message: string;
        }>('POST', `/api/narrative/videos/${videoId}/seed-demo`);
        
        if (response.scenes && response.shots) {
          // Group shots by scene
          const shotsByScene: { [sceneId: string]: Shot[] } = {};
          response.shots.forEach((shot) => {
            if (!shotsByScene[shot.sceneId]) {
              shotsByScene[shot.sceneId] = [];
            }
            shotsByScene[shot.sceneId].push(shot);
          });
          
          // Group shot versions by shot
          const versionsByShot: { [shotId: string]: ShotVersion[] } = {};
          response.shotVersions.forEach((version) => {
            if (!versionsByShot[version.shotId]) {
              versionsByShot[version.shotId] = [];
            }
            versionsByShot[version.shotId].push(version);
          });
          
          // Group continuity groups by scene if available
          if (response.continuityGroups && onContinuityGroupsChange) {
            const groupsByScene: { [sceneId: string]: ContinuityGroup[] } = {};
            response.continuityGroups.forEach((group) => {
              if (!groupsByScene[group.sceneId]) {
                groupsByScene[group.sceneId] = [];
              }
              groupsByScene[group.sceneId].push(group);
            });
            onContinuityGroupsChange(groupsByScene);
          }
          
          onScenesGenerated(response.scenes, shotsByScene, versionsByShot);
        }
      } catch (error) {
        console.error('Failed to seed demo data:', error);
        toast({
          title: "Failed to load demo data",
          description: "Unable to initialize the scene breakdown. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    seedDemoData();
  }, [videoId, scenes.length, onScenesGenerated, toast]);

  const moveScene = async (sceneId: string, direction: 'up' | 'down') => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex < 0) return;
    
    const targetIndex = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const currentScene = scenes[sceneIndex];
    const targetScene = scenes[targetIndex];

    const updatedScenes = [...scenes];
    updatedScenes[sceneIndex] = { ...currentScene, sceneNumber: targetScene.sceneNumber };
    updatedScenes[targetIndex] = { ...targetScene, sceneNumber: currentScene.sceneNumber };
    updatedScenes.sort((a, b) => a.sceneNumber - b.sceneNumber);

    onScenesGenerated(updatedScenes, shots);

    try {
      await Promise.all([
        apiRequest('PUT', `/api/narrative/scenes/${currentScene.id}`, { sceneNumber: targetScene.sceneNumber }),
        apiRequest('PUT', `/api/narrative/scenes/${targetScene.id}`, { sceneNumber: currentScene.sceneNumber }),
      ]);

      toast({ title: "Scene order updated" });
    } catch (error) {
      onScenesGenerated(scenes, shots);
      toast({
        title: "Failed to reorder scenes",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshSceneData = (updatedScene: Scene, updatedShot?: Shot) => {
    const updatedScenes = [...scenes];
    const sceneIndex = updatedScenes.findIndex(s => s.id === updatedScene.id);
    
    if (sceneIndex >= 0) {
      updatedScenes[sceneIndex] = updatedScene;
    } else {
      updatedScenes.push(updatedScene);
      updatedScenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
    }

    const updatedShots = { ...shots };
    if (updatedShot) {
      const shotList = updatedShots[updatedShot.sceneId] || [];
      const shotIndex = shotList.findIndex(s => s.id === updatedShot.id);
      
      if (shotIndex >= 0) {
        shotList[shotIndex] = updatedShot;
      } else {
        shotList.push(updatedShot);
        shotList.sort((a, b) => a.shotNumber - b.shotNumber);
      }
      updatedShots[updatedShot.sceneId] = shotList;
    }

    onScenesGenerated(updatedScenes, updatedShots);
  };

  const removeSceneData = (sceneId: string) => {
    const updatedScenes = scenes.filter(s => s.id !== sceneId);
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onScenesGenerated(updatedScenes, updatedShots);
  };

  const removeShotData = (shotId: string, sceneId: string) => {
    const updatedShots = { ...shots };
    if (updatedShots[sceneId]) {
      updatedShots[sceneId] = updatedShots[sceneId].filter(s => s.id !== shotId);
    }
    onScenesGenerated(scenes, updatedShots);
  };

  const breakdownMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/narrative/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          script,
          model: scriptModel,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate breakdown');
      return response.json() as Promise<{ scenes: Scene[]; shots: { [sceneId: string]: Shot[] } }>;
    },
    onSuccess: (data) => {
      onScenesGenerated(data.scenes, data.shots);
      setSynopsis(script.substring(0, 200));
      toast({
        title: "Breakdown Complete",
        description: `Generated ${data.scenes.length} scenes with shots.`,
      });
    },
    onError: () => {
      toast({
        title: "Breakdown Failed",
        description: "Failed to analyze script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createSceneMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/narrative/scenes', { ...data, videoId });
      return await res.json() as Scene;
    },
    onSuccess: (scene: Scene) => {
      refreshSceneData(scene);
      toast({ title: "Scene created successfully" });
      setSceneDialogOpen(false);
      setEditingScene(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to create scene",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSceneMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PUT', `/api/narrative/scenes/${id}`, data);
      return await res.json() as Scene;
    },
    onSuccess: (scene: Scene) => {
      refreshSceneData(scene);
      toast({ title: "Scene updated successfully" });
      setSceneDialogOpen(false);
      setEditingScene(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to update scene",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/narrative/scenes/${id}`);
      return id;
    },
    onSuccess: (id: string) => {
      removeSceneData(id);
      toast({ title: "Scene deleted successfully" });
      setDeleteSceneId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete scene",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const createShotMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/narrative/shots', { ...data, sceneId: activeSceneId });
      return await res.json() as Shot;
    },
    onSuccess: (shot: Shot) => {
      const scene = scenes.find(s => s.id === shot.sceneId);
      if (scene) refreshSceneData(scene, shot);
      toast({ title: "Shot created successfully" });
      setShotDialogOpen(false);
      setEditingShot(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to create shot",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateShotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest('PUT', `/api/narrative/shots/${id}`, data);
      return await res.json() as Shot;
    },
    onSuccess: (shot: Shot) => {
      const scene = scenes.find(s => s.id === shot.sceneId);
      if (scene) refreshSceneData(scene, shot);
      toast({ title: "Shot updated successfully" });
      setShotDialogOpen(false);
      setEditingShot(undefined);
    },
    onError: () => {
      toast({
        title: "Failed to update shot",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteShotMutation = useMutation({
    mutationFn: async (id: string) => {
      const shot = Object.values(shots).flat().find(s => s.id === id);
      await apiRequest('DELETE', `/api/narrative/shots/${id}`);
      return shot;
    },
    onSuccess: (shot) => {
      if (shot) removeShotData(shot.id, shot.sceneId);
      toast({ title: "Shot deleted successfully" });
      setDeleteShotId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete shot",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSceneSubmit = async (data: any) => {
    if (editingScene) {
      await updateSceneMutation.mutateAsync({ id: editingScene.id, data });
    } else {
      await createSceneMutation.mutateAsync(data);
    }
  };

  const handleShotSubmit = async (data: any) => {
    if (editingShot) {
      await updateShotMutation.mutateAsync({ id: editingShot.id, data });
    } else {
      await createShotMutation.mutateAsync(data);
    }
  };

  const openAddSceneDialog = () => {
    setEditingScene(undefined);
    setSceneDialogOpen(true);
  };

  const openEditSceneDialog = (scene: Scene) => {
    setEditingScene(scene);
    setSceneDialogOpen(true);
  };

  const openAddShotDialog = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setEditingShot(undefined);
    setShotDialogOpen(true);
  };

  const openEditShotDialog = (shot: Shot, sceneId: string) => {
    setActiveSceneId(sceneId);
    setEditingShot(shot);
    setShotDialogOpen(true);
  };

  const duplicateScene = (scene: Scene) => {
    const newSceneData = {
      sceneNumber: scenes.length + 1,
      title: `${scene.title} (Copy)`,
      description: scene.description,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      duration: scene.duration,
    };
    createSceneMutation.mutate(newSceneData);
  };

  const totalShots = Object.values(shots).flat().length;
  const totalDuration = scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0);
  const hasBreakdown = scenes.length > 0;

  return (
    <div className="space-y-6">
      {!hasBreakdown ? (
        <div className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-6">
              AI will analyze your script and break it down into scenes and shots.
            </p>
            <Button
              size="lg"
              onClick={() => breakdownMutation.mutate()}
              disabled={breakdownMutation.isPending}
              data-testid="button-generate-breakdown"
            >
              {breakdownMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Script...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Scene Breakdown
                </>
              )}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button
              variant="outline"
              onClick={openAddSceneDialog}
              data-testid="button-add-scene"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scene Manually
            </Button>
          </div>
        </div>
      ) : (
        <>
          {synopsis && (
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-2">Synopsis</h3>
                <Textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="text-sm resize-none"
                  rows={3}
                  data-testid="input-synopsis"
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {scenes.map((scene, sceneIndex) => {
              const sceneShots = shots[scene.id] || [];
              return (
                <Card key={scene.id} className="bg-card/50" data-testid={`scene-${scene.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        Scene{sceneIndex + 1}: {scene.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicateScene(scene)}
                          data-testid={`button-copy-scene-${scene.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditSceneDialog(scene)}
                          data-testid={`button-edit-scene-${scene.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={sceneIndex === 0}
                          onClick={() => moveScene(scene.id, 'up')}
                          data-testid={`button-move-up-scene-${scene.id}`}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={sceneIndex === scenes.length - 1}
                          onClick={() => moveScene(scene.id, 'down')}
                          data-testid={`button-move-down-scene-${scene.id}`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteSceneId(scene.id)}
                          data-testid={`button-delete-scene-${scene.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {sceneShots.map((shot, shotIndex) => (
                        <div
                          key={shot.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover-elevate"
                          data-testid={`shot-${shot.id}`}
                        >
                          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium mr-2">Shot {shotIndex + 1}</span>
                            <span className="text-sm text-muted-foreground mr-2">subtitles:</span>
                            <span className="text-sm">{shot.description}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {shot.description?.length || 0}/200
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditShotDialog(shot, scene.id)}
                              data-testid={`button-edit-shot-${shot.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteShotId(shot.id)}
                              data-testid={`button-delete-shot-${shot.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddShotDialog(scene.id)}
                        className="w-full mt-2"
                        data-testid={`button-add-shot-${scene.id}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shot
                      </Button>
                    </div>

                    {/* Continuity Proposal for Start-End Mode */}
                    {narrativeMode === "start-end" && !localContinuityLocked && (
                      <div className="mt-6 pt-6 border-t">
                        <ContinuityProposal
                          sceneId={scene.id}
                          sceneTitle={scene.title}
                          shots={sceneShots}
                          proposedGroups={continuityGroups[scene.id] || []}
                          onGroupsApproved={(groups) => handleContinuityApproval(scene.id, groups)}
                          onGenerateProposal={() => handleGenerateContinuityProposal(scene.id)}
                          isGenerating={isGeneratingContinuity}
                          isLocked={localContinuityLocked}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="outline"
              onClick={openAddSceneDialog}
              className="w-full"
              data-testid="button-add-scene"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scene
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              The video is approximately{' '}
              <span className="text-foreground font-medium">
                {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
              </span>{' '}
              ({totalShots} shots)
            </div>
            <Button 
              onClick={onNext} 
              disabled={narrativeMode === "start-end" && !localContinuityLocked}
              data-testid="button-next"
            >
              Next
              <span className="ml-2">→</span>
            </Button>
          </div>

          <SceneDialog
            open={sceneDialogOpen}
            onOpenChange={setSceneDialogOpen}
            scene={editingScene}
            videoId={videoId}
            sceneCount={scenes.length}
            onSubmit={handleSceneSubmit}
            isPending={createSceneMutation.isPending || updateSceneMutation.isPending}
          />

          <ShotDialog
            open={shotDialogOpen}
            onOpenChange={setShotDialogOpen}
            shot={editingShot}
            sceneId={activeSceneId}
            shotCount={activeSceneId ? (shots[activeSceneId] || []).length : 0}
            onSubmit={handleShotSubmit}
            isPending={createShotMutation.isPending || updateShotMutation.isPending}
          />

          <AlertDialog open={!!deleteSceneId} onOpenChange={(open) => !open && setDeleteSceneId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Scene</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this scene? This will also delete all shots in this scene. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-scene">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSceneId && deleteSceneMutation.mutate(deleteSceneId)}
                  data-testid="button-confirm-delete-scene"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!deleteShotId} onOpenChange={(open) => !open && setDeleteShotId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Shot</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this shot? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-shot">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteShotId && deleteShotMutation.mutate(deleteShotId)}
                  data-testid="button-confirm-delete-shot"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
