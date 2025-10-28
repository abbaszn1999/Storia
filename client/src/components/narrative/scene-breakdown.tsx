import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Sparkles, Edit, Trash2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot } from "@shared/schema";
import { SceneDialog } from "./scene-dialog";
import { ShotDialog } from "./shot-dialog";
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

interface SceneBreakdownProps {
  videoId: string;
  script: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }) => void;
  onNext: () => void;
}

export function SceneBreakdown({ videoId, script, scenes, shots, onScenesGenerated, onNext }: SceneBreakdownProps) {
  const { toast } = useToast();
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | undefined>();
  const [editingShot, setEditingShot] = useState<Shot | undefined>();
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);

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
        }),
      });
      if (!response.ok) throw new Error('Failed to generate breakdown');
      return response.json() as Promise<{ scenes: Scene[]; shots: { [sceneId: string]: Shot[] } }>;
    },
    onSuccess: (data) => {
      onScenesGenerated(data.scenes, data.shots);
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

  const hasBreakdown = scenes.length > 0;

  return (
    <div className="space-y-6">
      {!hasBreakdown ? (
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
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Scene Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                {scenes.length} scenes with {Object.values(shots).flat().length} total shots
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openAddSceneDialog}
                data-testid="button-add-scene"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Scene
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => breakdownMutation.mutate()}
                disabled={breakdownMutation.isPending}
                data-testid="button-regenerate-breakdown"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {scenes.map((scene, sceneIndex) => {
              const sceneShots = shots[scene.id] || [];
              return (
                <AccordionItem key={scene.id} value={scene.id}>
                  <Card>
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-semibold text-primary">{sceneIndex + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{scene.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {scene.location} · {scene.timeOfDay}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" data-testid={`badge-scene-${scene.id}-shots`}>
                            {sceneShots.length} shots
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSceneDialog(scene);
                            }}
                            data-testid={`button-edit-scene-${scene.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteSceneId(scene.id);
                            }}
                            data-testid={`button-delete-scene-${scene.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="space-y-4 pt-4">
                        <p className="text-sm">{scene.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold">Shots</h5>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAddShotDialog(scene.id)}
                              data-testid={`button-add-shot-${scene.id}`}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Add Shot
                            </Button>
                          </div>
                          {sceneShots.map((shot, shotIndex) => (
                            <Card key={shot.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                    <span className="text-sm font-medium">{shotIndex + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {shot.shotType}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {shot.cameraMovement}
                                      </Badge>
                                    </div>
                                    <p className="text-sm">{shot.description}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
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
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="flex justify-end">
            <Button onClick={onNext} data-testid="button-next">
              Continue to World & Cast
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
