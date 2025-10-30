import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Edit, Trash2, Plus, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";

interface SceneBreakdownProps {
  videoId: string;
  script: string;
  scriptModel: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions?: { [shotId: string]: ShotVersion[] };
  onScenesGenerated: (scenes: Scene[], shots: { [sceneId: string]: Shot[] }, shotVersions?: { [shotId: string]: ShotVersion[] }) => void;
  onNext: () => void;
}

export function SceneBreakdown({ videoId, script, scriptModel, scenes, shots, shotVersions, onScenesGenerated, onNext }: SceneBreakdownProps) {
  const { toast } = useToast();
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [shotDialogOpen, setShotDialogOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | undefined>();
  const [editingShot, setEditingShot] = useState<Shot | undefined>();
  const [activeSceneId, setActiveSceneId] = useState<string>("");
  const [deleteSceneId, setDeleteSceneId] = useState<string | null>(null);
  const [deleteShotId, setDeleteShotId] = useState<string | null>(null);
  const [synopsis, setSynopsis] = useState<string>(script ? script.substring(0, 200) : "");

  // TEMPORARY: Load dummy data for testing UI
  useEffect(() => {
    if (scenes.length === 0 && Object.keys(shots).length === 0) {
      const dummyScenes: Scene[] = [
        {
          id: "scene-1",
          videoId,
          sceneNumber: 1,
          title: "The Discovery",
          description: "Sarah stumbles upon an ancient map in her grandmother's attic, revealing the location of a hidden temple deep in the Amazon jungle.",
          location: "Grandmother's Attic",
          timeOfDay: "Evening",
          duration: 45,
          createdAt: new Date(),
        },
        {
          id: "scene-2",
          videoId,
          sceneNumber: 2,
          title: "Journey Begins",
          description: "Sarah packs her gear and boards a small plane to Brazil. As they fly over the vast rainforest, she studies the map with growing excitement.",
          location: "Small Aircraft over Amazon",
          timeOfDay: "Morning",
          duration: 45,
          createdAt: new Date(),
        },
        {
          id: "scene-3",
          videoId,
          sceneNumber: 3,
          title: "Into the Jungle",
          description: "Sarah and her guide hack through dense vegetation. Strange sounds echo through the trees as they navigate treacherous terrain towards their destination.",
          location: "Amazon Rainforest",
          timeOfDay: "Afternoon",
          duration: 45,
          createdAt: new Date(),
        },
        {
          id: "scene-4",
          videoId,
          sceneNumber: 4,
          title: "The Temple Revealed",
          description: "Pushing through a wall of vines, Sarah gasps as an magnificent ancient temple emerges from the jungle, covered in mysterious symbols glowing faintly in the twilight.",
          location: "Ancient Temple Entrance",
          timeOfDay: "Twilight",
          duration: 45,
          createdAt: new Date(),
        },
      ];

      const dummyShots: { [sceneId: string]: Shot[] } = {
        "scene-1": [
          {
            id: "shot-1-1",
            sceneId: "scene-1",
            shotNumber: 1,
            shotType: "Close-Up",
            description: "Close-up of dusty boxes and old photographs in dim attic lighting",
            duration: 8,
            cameraMovement: "static",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-1-2",
            sceneId: "scene-1",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Sarah's hand reaches into an ornate wooden box, pulling out an aged, yellowed map",
            duration: 12,
            cameraMovement: "push in",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-1-3",
            sceneId: "scene-1",
            shotNumber: 3,
            shotType: "Medium Close-Up",
            description: "Sarah's eyes widen as she unfolds the map, candlelight illuminating ancient markings",
            duration: 15,
            cameraMovement: "dolly in",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-1-4",
            sceneId: "scene-1",
            shotNumber: 4,
            shotType: "Extreme Close-Up",
            description: "Extreme close-up of the map showing detailed illustrations of a temple hidden in jungle",
            duration: 10,
            cameraMovement: "pan right",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-2": [
          {
            id: "shot-2-1",
            sceneId: "scene-2",
            shotNumber: 1,
            shotType: "Wide Shot",
            description: "Wide shot of small propeller plane on tarmac at sunrise",
            duration: 10,
            cameraMovement: "static",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-2-2",
            sceneId: "scene-2",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Sarah climbs into the plane with her backpack and equipment",
            duration: 8,
            cameraMovement: "tracking",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-2-3",
            sceneId: "scene-2",
            shotNumber: 3,
            shotType: "Aerial",
            description: "Aerial view from plane window showing endless green canopy of Amazon rainforest",
            duration: 12,
            cameraMovement: "slow zoom",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-2-4",
            sceneId: "scene-2",
            shotNumber: 4,
            shotType: "Close-Up",
            description: "Interior shot of Sarah studying the map intensely, finger tracing route",
            duration: 15,
            cameraMovement: "push in",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-3": [
          {
            id: "shot-3-1",
            sceneId: "scene-3",
            shotNumber: 1,
            shotType: "Medium Shot",
            description: "Low angle shot of machete cutting through thick jungle vines",
            duration: 8,
            cameraMovement: "handheld",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-3-2",
            sceneId: "scene-3",
            shotNumber: 2,
            shotType: "Medium Shot",
            description: "Sarah and guide navigate through dense undergrowth, sweat on their faces",
            duration: 14,
            cameraMovement: "tracking",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-3-3",
            sceneId: "scene-3",
            shotNumber: 3,
            shotType: "POV",
            description: "POV shot looking up through canopy as mysterious bird calls echo",
            duration: 10,
            cameraMovement: "tilt up",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-3-4",
            sceneId: "scene-3",
            shotNumber: 4,
            shotType: "Close-Up",
            description: "Close-up of Sarah checking compass against map, determination in her expression",
            duration: 13,
            cameraMovement: "static",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        "scene-4": [
          {
            id: "shot-4-1",
            sceneId: "scene-4",
            shotNumber: 1,
            shotType: "Medium Shot",
            description: "Sarah's hand pushes aside wall of hanging vines in slow motion",
            duration: 10,
            cameraMovement: "push forward",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-4-2",
            sceneId: "scene-4",
            shotNumber: 2,
            shotType: "Wide Shot",
            description: "Reveal shot of massive temple structure emerging from jungle vegetation",
            duration: 18,
            cameraMovement: "crane up",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-4-3",
            sceneId: "scene-4",
            shotNumber: 3,
            shotType: "Medium Close-Up",
            description: "Sarah's face in golden hour lighting, expression of wonder and amazement",
            duration: 8,
            cameraMovement: "static",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-4-4",
            sceneId: "scene-4",
            shotNumber: 4,
            shotType: "Medium Shot",
            description: "Dolly shot along temple wall showing intricate carvings and glowing symbols",
            duration: 12,
            cameraMovement: "dolly right",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "shot-4-5",
            sceneId: "scene-4",
            shotNumber: 5,
            shotType: "Aerial",
            description: "Wide establishing shot of temple against jungle backdrop as sun sets",
            duration: 12,
            cameraMovement: "static",
            currentVersionId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Create dummy shot versions with placeholder images
      const dummyShotVersions: { [shotId: string]: ShotVersion[] } = {};
      Object.values(dummyShots).flat().forEach((shot, index) => {
        const versionId = `version-${shot.id}-1`;
        const colors = [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop', // Mountain landscape
          'https://images.unsplash.com/photo-1506709551723-4c3c5c8bbb4b?w=800&h=450&fit=crop', // Forest
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=450&fit=crop', // Nature
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=450&fit=crop', // Forest path
        ];
        const imageUrl = colors[index % colors.length];

        dummyShotVersions[shot.id] = [
          {
            id: versionId,
            shotId: shot.id,
            versionNumber: 1,
            imagePrompt: shot.description || '',
            imageUrl,
            videoPrompt: null,
            videoUrl: null,
            status: "completed",
            createdAt: new Date(),
          },
        ];
        
        // Update shot to reference this version
        shot.currentVersionId = versionId;
      });

      setSynopsis("An adventurous explorer discovers a mysterious map leading to an ancient temple deep in the Amazon rainforest. Her journey takes her from a dusty attic to the heart of the jungle, where she faces both natural obstacles and the lure of forgotten civilizations. As she pushes through the dense vegetation, the temple's secrets begin to reveal themselves.");
      onScenesGenerated(dummyScenes, dummyShots, dummyShotVersions);
    }
  }, []);

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
            <Button onClick={onNext} data-testid="button-next">
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
