import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const VIDEO_MODELS = [
  "Kling AI",
  "Runway Gen-4",
  "Luma Dream Machine",
  "Pika 2.0",
  "Veo 2",
  "Minimax",
];

const VIDEO_MODEL_DURATIONS: { [key: string]: number[] } = {
  "Kling AI": [5, 10],
  "Runway Gen-4": [5, 10],
  "Luma Dream Machine": [5],
  "Pika 2.0": [3],
  "Veo 2": [8],
  "Minimax": [6],
};

const LIGHTING_OPTIONS = [
  "Natural Daylight",
  "Golden Hour",
  "Blue Hour",
  "Overcast",
  "Night",
  "Studio Lighting",
  "Soft Light",
  "Hard Light",
  "Backlit",
  "Dramatic",
];

const WEATHER_OPTIONS = [
  "Clear",
  "Partly Cloudy",
  "Cloudy",
  "Overcast",
  "Light Rain",
  "Heavy Rain",
  "Foggy",
  "Misty",
  "Snowy",
  "Stormy",
];

const SHOT_TYPES = [
  "Extreme Close-up",
  "Close-up",
  "Medium Close-up",
  "Medium Shot",
  "Medium Wide Shot",
  "Wide Shot",
  "Extreme Wide Shot",
  "Over-the-Shoulder",
  "Point of View",
  "Establishing Shot",
];

interface StoryboardEditorProps {
  videoId: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  referenceImages: ReferenceImage[];
  onGenerateShot: (shotId: string) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => void;
  onReorderShots?: (sceneId: string, shotIds: string[]) => void;
  onUploadShotReference: (shotId: string, file: File) => void;
  onDeleteShotReference: (shotId: string) => void;
  onNext: () => void;
}

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  sceneModel: string | null;
  version: ShotVersion | null;
  referenceImage: ReferenceImage | null;
  isGenerating: boolean;
  onSelectShot: (shot: Shot) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdatePrompt: (shotId: string, prompt: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUploadReference: (shotId: string, file: File) => void;
  onDeleteReference: (shotId: string) => void;
  onUpdateVideoPrompt: (shotId: string, prompt: string) => void;
  onUpdateVideoDuration: (shotId: string, duration: number) => void;
}

function SortableShotCard({ 
  shot, 
  shotIndex,
  sceneModel,
  version,
  referenceImage,
  isGenerating, 
  onSelectShot,
  onRegenerateShot,
  onUpdatePrompt,
  onUpdateShot,
  onUploadReference,
  onDeleteReference,
  onUpdateVideoPrompt,
  onUpdateVideoDuration,
}: SortableShotCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [localPrompt, setLocalPrompt] = useState(shot.description || "");

  const handlePromptBlur = () => {
    if (localPrompt !== shot.description) {
      onUpdatePrompt(shot.id, localPrompt);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        return;
      }
      onUploadReference(shot.id, file);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 overflow-visible"
      data-testid={`card-shot-${shot.id}`}
    >
      <div className="aspect-video bg-muted relative group">
        {version?.imageUrl ? (
          <img
            src={version.imageUrl}
            alt={`Shot ${shotIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="h-6 w-6 flex items-center justify-center bg-background/80 rounded cursor-grab active:cursor-grabbing hover-elevate"
            data-testid={`drag-handle-${shot.id}`}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Badge className="bg-background/80 text-foreground border-0">
            # {shotIndex + 1}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="image" className="text-xs" data-testid={`tab-image-${shot.id}`}>
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs" data-testid={`tab-video-${shot.id}`}>
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Prompt</Label>
              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                onBlur={handlePromptBlur}
                placeholder="Describe the shot..."
                className="min-h-20 text-xs resize-none"
                data-testid={`input-prompt-${shot.id}`}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Reference Image</Label>
              {referenceImage ? (
                <div className="relative aspect-video rounded-md overflow-hidden border">
                  <img
                    src={referenceImage.imageUrl}
                    alt="Reference"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 left-2 h-6 w-6"
                    onClick={() => onDeleteReference(shot.id)}
                    data-testid={`button-delete-reference-${shot.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    id={`reference-upload-${shot.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid={`input-reference-${shot.id}`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById(`reference-upload-${shot.id}`)?.click()}
                    data-testid={`button-upload-reference-${shot.id}`}
                  >
                    <Upload className="mr-2 h-3 w-3" />
                    Upload Reference
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Shot Type</Label>
              <Select
                value={shot.shotType}
                onValueChange={(value) => onUpdateShot(shot.id, { shotType: value })}
              >
                <SelectTrigger className="h-8 text-xs" data-testid={`select-shot-type-${shot.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onSelectShot(shot)}
                data-testid={`button-edit-image-${shot.id}`}
              >
                <Edit className="mr-2 h-3 w-3" />
                Edit Image
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onRegenerateShot(shot.id)}
                disabled={!version}
                data-testid={`button-regenerate-${shot.id}`}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Re-generate
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Video Prompt</Label>
              <Textarea
                placeholder="Describe the motion and action for this shot..."
                value={version?.videoPrompt || ""}
                onChange={(e) => onUpdateVideoPrompt(shot.id, e.target.value)}
                className="min-h-[60px] text-xs resize-none"
                data-testid={`textarea-video-prompt-${shot.id}`}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Video Model</Label>
              <Select
                value={shot.videoModel || "scene-default"}
                onValueChange={(value) => onUpdateShot(shot.id, { videoModel: value === "scene-default" ? null : value })}
              >
                <SelectTrigger className="h-8 text-xs" data-testid={`select-video-model-${shot.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scene-default">
                    Scene Default {sceneModel ? `(${sceneModel})` : ""}
                  </SelectItem>
                  {VIDEO_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Select
                value={version?.videoDuration?.toString() || ""}
                onValueChange={(value) => onUpdateVideoDuration(shot.id, parseInt(value))}
                disabled={!shot.videoModel && !sceneModel}
              >
                <SelectTrigger className="h-8 text-xs" data-testid={`select-video-duration-${shot.id}`}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {(shot.videoModel && VIDEO_MODEL_DURATIONS[shot.videoModel] 
                    ? VIDEO_MODEL_DURATIONS[shot.videoModel]
                    : sceneModel && VIDEO_MODEL_DURATIONS[sceneModel]
                    ? VIDEO_MODEL_DURATIONS[sceneModel]
                    : []
                  ).map((duration) => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled
              data-testid={`button-generate-video-${shot.id}`}
            >
              <Video className="mr-2 h-3 w-3" />
              Generate Video
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function StoryboardEditor({
  videoId,
  scenes,
  shots,
  shotVersions,
  referenceImages,
  onGenerateShot,
  onRegenerateShot,
  onUpdateShot,
  onUpdateScene,
  onReorderShots,
  onUploadShotReference,
  onDeleteShotReference,
  onNext,
}: StoryboardEditorProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [localShots, setLocalShots] = useState(shots);
  const { toast } = useToast();

  // Sync localShots with incoming shots prop to reflect updates
  useEffect(() => {
    setLocalShots(shots);
  }, [shots]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const allShots = Object.values(localShots).flat();
  const generatedCount = allShots.filter((s) => s.currentVersionId).length;
  const totalCount = allShots.length;

  const handleGenerateAll = () => {
    allShots.forEach((shot) => {
      if (!shot.currentVersionId) {
        onGenerateShot(shot.id);
      }
    });
    toast({
      title: "Generating Storyboard",
      description: `Generating images for ${totalCount - generatedCount} shots...`,
    });
  };

  const getShotVersion = (shot: Shot): ShotVersion | null => {
    if (!shot.currentVersionId) return null;
    const versions = shotVersions[shot.id] || [];
    return versions.find((v) => v.id === shot.currentVersionId) || null;
  };

  const getShotReferenceImage = (shotId: string): ReferenceImage | null => {
    return referenceImages.find(
      (ref) => ref.shotId === shotId && ref.type === "shot_reference"
    ) || null;
  };

  const handleUploadReference = (shotId: string, file: File) => {
    onUploadShotReference(shotId, file);
    toast({
      title: "Reference Uploaded",
      description: "Reference image has been uploaded successfully",
    });
  };

  const handleDeleteReference = (shotId: string) => {
    onDeleteShotReference(shotId);
    toast({
      title: "Reference Deleted",
      description: "Reference image has been removed",
    });
  };

  const handleDragEnd = (event: DragEndEvent, sceneId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sceneShots = localShots[sceneId] || [];
      const oldIndex = sceneShots.findIndex((s) => s.id === active.id);
      const newIndex = sceneShots.findIndex((s) => s.id === over.id);

      const newSceneShots = arrayMove(sceneShots, oldIndex, newIndex);

      if (onReorderShots) {
        onReorderShots(sceneId, newSceneShots.map(s => s.id));
      }

      toast({
        title: "Shot Reordered",
        description: "Shot order has been updated",
      });
    }
  };

  const handleUpdatePrompt = (shotId: string, prompt: string) => {
    onUpdateShot(shotId, { description: prompt });
  };

  const handleSelectShot = (shot: Shot) => {
    setSelectedShot(shot);
    setEditPrompt(shot.description || "");
  };

  const handleSavePrompt = () => {
    if (selectedShot) {
      onUpdateShot(selectedShot.id, { description: editPrompt });
      toast({
        title: "Prompt Updated",
        description: "Image prompt has been updated",
      });
      setSelectedShot(null);
    }
  };

  const handleGenerateFromDialog = () => {
    if (selectedShot) {
      onUpdateShot(selectedShot.id, { description: editPrompt });
      onGenerateShot(selectedShot.id);
      toast({
        title: "Generating Image",
        description: "Creating image from your prompt...",
      });
      setSelectedShot(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Storyboard</h3>
          <p className="text-sm text-muted-foreground">
            {generatedCount} of {totalCount} shots generated • Drag to reorder
          </p>
        </div>
        <Button
          onClick={handleGenerateAll}
          disabled={generatedCount === totalCount}
          data-testid="button-generate-all"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate All Shots
        </Button>
      </div>

      <div className="space-y-8">
        {scenes.map((scene, sceneIndex) => {
          const sceneShots = localShots[scene.id] || [];
          
          return (
            <div key={scene.id} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-80 shrink-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      # {sceneIndex + 1}
                    </Badge>
                    <h4 className="font-semibold text-sm">{scene.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {scene.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Video Model</Label>
                      <Select
                        value={scene.videoModel || VIDEO_MODELS[0]}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { videoModel: value })}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-scene-video-model-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_MODELS.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Lighting</Label>
                      <Select
                        value={scene.lighting || LIGHTING_OPTIONS[0]}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { lighting: value })}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-scene-lighting-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LIGHTING_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Weather</Label>
                      <Select
                        value={scene.weather || WEATHER_OPTIONS[0]}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { weather: value })}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-scene-weather-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEATHER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-muted-foreground pt-1">
                      <div>Location: {scene.location}</div>
                      <div>{sceneShots.length} shots</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, scene.id)}
                  >
                    <SortableContext
                      items={sceneShots.map(s => s.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex gap-4 pb-2">
                        {sceneShots.map((shot, shotIndex) => {
                          const version = getShotVersion(shot);
                          const referenceImage = getShotReferenceImage(shot.id);
                          const isGenerating = false;

                          return (
                            <SortableShotCard
                              key={shot.id}
                              shot={shot}
                              shotIndex={shotIndex}
                              sceneModel={scene.videoModel || VIDEO_MODELS[0]}
                              version={version}
                              referenceImage={referenceImage}
                              isGenerating={isGenerating}
                              onSelectShot={handleSelectShot}
                              onRegenerateShot={onRegenerateShot}
                              onUpdatePrompt={handleUpdatePrompt}
                              onUpdateShot={onUpdateShot}
                              onUploadReference={handleUploadReference}
                              onDeleteReference={handleDeleteReference}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedShot && (
        <Dialog open={!!selectedShot} onOpenChange={() => setSelectedShot(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Image Prompt</DialogTitle>
              <DialogDescription>
                Modify the prompt to generate a new image for this shot
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Current Image</Label>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {getShotVersion(selectedShot)?.imageUrl ? (
                      <img
                        src={getShotVersion(selectedShot)!.imageUrl!}
                        alt="Shot"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Image Generation Prompt</Label>
                    <Textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="min-h-20 text-sm resize-none"
                      data-testid="input-edit-prompt"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Reference Image (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                      <Button size="sm" variant="outline" data-testid="button-upload-reference-dialog">
                        <Upload className="mr-2 h-3 w-3" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleSavePrompt}
                  className="flex-1"
                  data-testid="button-save-prompt"
                >
                  Save Prompt
                </Button>
                <Button
                  onClick={handleGenerateFromDialog}
                  className="flex-1"
                  data-testid="button-generate-from-dialog"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={generatedCount < totalCount}
          data-testid="button-next"
        >
          Continue to Animatic
        </Button>
      </div>
    </div>
  );
}
