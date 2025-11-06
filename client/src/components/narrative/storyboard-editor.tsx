import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical, X, Volume2, Plus, Zap, Smile, User, Camera, Wand2, History, Settings2, ChevronRight, ChevronLeft, Shirt, Eraser, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ReferenceImage, Character } from "@shared/schema";
import { VOICE_LIBRARY } from "@/constants/voice-library";
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

const IMAGE_MODELS = [
  "Flux",
  "Midjourney",
  "Nano Banana",
  "GPT Image",
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

const CAMERA_MOVEMENTS = [
  "Static",
  "Pan Left",
  "Pan Right",
  "Tilt Up",
  "Tilt Down",
  "Zoom In",
  "Zoom Out",
  "Dolly In",
  "Dolly Out",
  "Tracking Shot",
  "Crane Up",
  "Crane Down",
  "Handheld",
  "Steadicam",
];

interface StoryboardEditorProps {
  videoId: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  referenceImages: ReferenceImage[];
  characters: Character[];
  voiceActorId: string | null;
  soundEffectsEnabled: boolean;
  onVoiceActorChange: (voiceActorId: string) => void;
  onSoundEffectsToggle: (enabled: boolean) => void;
  onGenerateShot: (shotId: string) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUpdateShotVersion?: (shotId: string, versionId: string, updates: Partial<ShotVersion>) => void;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => void;
  onReorderShots?: (sceneId: string, shotIds: string[]) => void;
  onUploadShotReference: (shotId: string, file: File) => void;
  onDeleteShotReference: (shotId: string) => void;
  onSelectVersion?: (shotId: string, versionId: string) => void;
  onDeleteVersion?: (shotId: string, versionId: string) => void;
  onAddScene?: (afterSceneIndex: number) => void;
  onAddShot?: (sceneId: string, afterShotIndex: number) => void;
  onDeleteScene?: (sceneId: string) => void;
  onDeleteShot?: (shotId: string) => void;
  onNext: () => void;
}

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  sceneModel: string | null;
  sceneImageModel: string | null;
  version: ShotVersion | null;
  referenceImage: ReferenceImage | null;
  isGenerating: boolean;
  soundEffectsEnabled: boolean;
  onSelectShot: (shot: Shot) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdatePrompt: (shotId: string, prompt: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUploadReference: (shotId: string, file: File) => void;
  onDeleteReference: (shotId: string) => void;
  onUpdateVideoPrompt: (shotId: string, prompt: string) => void;
  onUpdateVideoDuration: (shotId: string, duration: number) => void;
  onDeleteShot?: (shotId: string) => void;
  shotsCount: number;
}

function SortableShotCard({ 
  shot, 
  shotIndex,
  sceneModel,
  sceneImageModel,
  version,
  referenceImage,
  isGenerating,
  soundEffectsEnabled,
  onSelectShot,
  onRegenerateShot,
  onUpdatePrompt,
  onUpdateShot,
  onUploadReference,
  onDeleteReference,
  onUpdateVideoPrompt,
  onUpdateVideoDuration,
  onDeleteShot,
  shotsCount,
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
        {onDeleteShot && shotsCount > 1 && (
          <div className="absolute top-2 right-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-background/80 text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (window.confirm(`Delete shot #${shotIndex + 1}?`)) {
                  onDeleteShot(shot.id);
                }
              }}
              data-testid={`button-delete-shot-${shot.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
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

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Image Model</Label>
              <Select
                value={shot.imageModel || "scene-default"}
                onValueChange={(value) => onUpdateShot(shot.id, { imageModel: value === "scene-default" ? null : value })}
              >
                <SelectTrigger className="h-8 text-xs" data-testid={`select-image-model-${shot.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scene-default">
                    Scene Default {sceneImageModel ? `(${sceneImageModel})` : ""}
                  </SelectItem>
                  {IMAGE_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Reference Image</Label>
              {referenceImage ? (
                <div className="relative">
                  <div className="aspect-video rounded-md overflow-hidden border">
                    <img
                      src={referenceImage.imageUrl}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
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

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Voiceover Script</Label>
              <Textarea
                placeholder="Narration for this shot..."
                value={shot.voiceoverScript || ""}
                onChange={(e) => onUpdateShot(shot.id, { voiceoverScript: e.target.value })}
                className="min-h-[60px] text-xs resize-none"
                data-testid={`textarea-voiceover-script-${shot.id}`}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Sound Effects</Label>
              <Switch
                checked={shot.soundEffectsEnabled ?? true}
                onCheckedChange={(checked) => onUpdateShot(shot.id, { soundEffectsEnabled: checked })}
                disabled={!soundEffectsEnabled}
                data-testid={`toggle-sound-effects-${shot.id}`}
              />
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled
                data-testid={`button-generate-video-${shot.id}`}
              >
                <Video className="mr-2 h-3 w-3" />
                Generate Video
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled
                data-testid={`button-regenerate-video-${shot.id}`}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Re-generate
              </Button>
            </div>
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
  characters,
  voiceActorId,
  soundEffectsEnabled,
  onVoiceActorChange,
  onSoundEffectsToggle,
  onGenerateShot,
  onRegenerateShot,
  onUpdateShot,
  onUpdateShotVersion,
  onUpdateScene,
  onReorderShots,
  onUploadShotReference,
  onDeleteShotReference,
  onSelectVersion,
  onDeleteVersion,
  onAddScene,
  onAddShot,
  onDeleteScene,
  onDeleteShot,
  onNext,
}: StoryboardEditorProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editChange, setEditChange] = useState("");
  const [activeCategory, setActiveCategory] = useState<"prompt" | "clothes" | "remove" | "expression" | "figure" | "camera" | "effects" | "variations" | "advanced" | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [localShots, setLocalShots] = useState(shots);
  const { toast } = useToast();
  const scrollContainerRefs = useRef<{ [sceneId: string]: HTMLDivElement | null }>({});
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);

  const scrollShots = (direction: 'left' | 'right') => {
    if (!hoveredSceneId) return;
    const container = scrollContainerRefs.current[hoveredSceneId];
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Sync localShots with incoming shots prop to reflect updates
  useEffect(() => {
    setLocalShots(shots);
  }, [shots]);

  // Sync selectedShot when shots change (e.g., version selection updates currentVersionId)
  useEffect(() => {
    if (selectedShot) {
      const allShotsFlat = Object.values(shots).flat();
      const updatedShot = allShotsFlat.find(s => s.id === selectedShot.id);
      if (updatedShot && updatedShot.currentVersionId !== selectedShot.currentVersionId) {
        setSelectedShot(updatedShot);
      }
    }
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

  const handleUpdateVideoPrompt = (shotId: string, prompt: string) => {
    const shot = allShots.find(s => s.id === shotId);
    if (shot?.currentVersionId && onUpdateShotVersion) {
      onUpdateShotVersion(shotId, shot.currentVersionId, { videoPrompt: prompt });
    }
  };

  const handleUpdateVideoDuration = (shotId: string, duration: number) => {
    const shot = allShots.find(s => s.id === shotId);
    if (shot?.currentVersionId && onUpdateShotVersion) {
      onUpdateShotVersion(shotId, shot.currentVersionId, { videoDuration: duration });
    }
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
    <div className="space-y-6 relative">
      {/* Fixed Slider Navigation Buttons */}
      {hoveredSceneId && localShots[hoveredSceneId]?.length > 2 && (
        <>
          <button
            onClick={() => scrollShots('left')}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-background/95 backdrop-blur-sm shadow-xl border border-border hover-elevate active-elevate-2 flex items-center justify-center transition-all"
            data-testid="button-scroll-left-global"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scrollShots('right')}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-background/95 backdrop-blur-sm shadow-xl border border-border hover-elevate active-elevate-2 flex items-center justify-center transition-all"
            data-testid="button-scroll-right-global"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Storyboard</h3>
          <p className="text-sm text-muted-foreground">
            {generatedCount} of {totalCount} shots generated • Drag to reorder
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Voice Actor</Label>
            <Select
              value={voiceActorId || ""}
              onValueChange={onVoiceActorChange}
            >
              <SelectTrigger className="w-48 h-9" data-testid="select-voice-actor">
                <SelectValue placeholder="Select voice actor" />
              </SelectTrigger>
              <SelectContent>
                {VOICE_LIBRARY.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex items-center gap-2">
                      <span>{voice.name}</span>
                      <audio 
                        id={`preview-${voice.id}`} 
                        src={voice.previewUrl}
                        className="hidden"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const audio = document.getElementById(`preview-${voice.id}`) as HTMLAudioElement;
                          if (audio) {
                            audio.play();
                          }
                        }}
                        className="p-1 rounded hover:bg-accent"
                        data-testid={`button-preview-voice-${voice.id}`}
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Sound Effects</Label>
            <Switch
              checked={soundEffectsEnabled}
              onCheckedChange={onSoundEffectsToggle}
              data-testid="toggle-sound-effects"
            />
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
      </div>

      <div className="space-y-8">
        {scenes.map((scene, sceneIndex) => {
          const sceneShots = localShots[scene.id] || [];
          
          return (
            <>
            <div key={scene.id} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-80 shrink-0 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        # {sceneIndex + 1}
                      </Badge>
                      <h4 className="font-semibold text-sm">{scene.title}</h4>
                    </div>
                    {onDeleteScene && scenes.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete scene "${scene.title}"? This will also delete all ${sceneShots.length} shot(s) in this scene.`)) {
                            onDeleteScene(scene.id);
                          }
                        }}
                        data-testid={`button-delete-scene-${scene.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {scene.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Image Model</Label>
                      <Select
                        value={scene.imageModel || IMAGE_MODELS[0]}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { imageModel: value })}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-scene-image-model-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IMAGE_MODELS.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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

                <div 
                  className="flex-1 relative"
                  onMouseEnter={() => setHoveredSceneId(scene.id)}
                  onMouseLeave={() => setHoveredSceneId(null)}
                >
                  <div 
                    ref={(el) => scrollContainerRefs.current[scene.id] = el}
                    className="overflow-x-auto"
                  >
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
                            <>
                              <SortableShotCard
                                key={shot.id}
                                shot={shot}
                                shotIndex={shotIndex}
                                sceneModel={scene.videoModel || VIDEO_MODELS[0]}
                                sceneImageModel={scene.imageModel || IMAGE_MODELS[0]}
                                version={version}
                                referenceImage={referenceImage}
                                isGenerating={isGenerating}
                                soundEffectsEnabled={soundEffectsEnabled}
                                onSelectShot={handleSelectShot}
                                onRegenerateShot={onRegenerateShot}
                                onUpdatePrompt={handleUpdatePrompt}
                                onUpdateShot={onUpdateShot}
                                onUploadReference={handleUploadReference}
                                onDeleteReference={handleDeleteReference}
                                onUpdateVideoPrompt={handleUpdateVideoPrompt}
                                onUpdateVideoDuration={handleUpdateVideoDuration}
                                onDeleteShot={onDeleteShot}
                                shotsCount={sceneShots.length}
                              />
                              {onAddShot && (
                                <div className="relative group shrink-0 w-3 flex items-center justify-center">
                                  <button
                                    onClick={() => onAddShot(scene.id, shotIndex)}
                                    className="absolute opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 border-dashed border-primary/50 hover-elevate active-elevate-2 transition-all"
                                    data-testid={`button-add-shot-after-${shotIndex}`}
                                  >
                                    <Plus className="h-4 w-4 text-primary" />
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                  </div>
                </div>
              </div>
            </div>

            {onAddScene && (
              <div className="relative flex items-center justify-center py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-muted-foreground/25"></div>
                </div>
                <button
                  onClick={() => onAddScene(sceneIndex)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover-elevate active-elevate-2 transition-colors"
                  data-testid={`button-add-scene-after-${sceneIndex}`}
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            )}
            </>
          );
        })}
      </div>

      {selectedShot && (
        <Dialog open={!!selectedShot} onOpenChange={() => setSelectedShot(null)}>
          <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
            <div className="relative w-full h-full flex bg-background">
              {/* Left Sidebar - Version History */}
              <div className="w-56 border-r bg-muted/30 flex flex-col p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-1">Shot {selectedShot.shotNumber}</h3>
                  <p className="text-xs text-muted-foreground">Version History</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {shotVersions[selectedShot.id] && shotVersions[selectedShot.id]
                    .sort((a, b) => a.versionNumber - b.versionNumber)
                    .map((version) => {
                      const isActive = version.id === selectedShot.currentVersionId;
                      return (
                        <div
                          key={version.id}
                          className={`relative group ${
                            isActive ? "ring-2 ring-primary rounded-md" : "hover-elevate cursor-pointer"
                          }`}
                          onClick={() => {
                            if (onSelectVersion && !isActive) {
                              onSelectVersion(selectedShot.id, version.id);
                            }
                          }}
                          data-testid={`version-thumbnail-${version.id}`}
                        >
                          <div className="aspect-video bg-muted rounded-md overflow-hidden">
                            {version.imageUrl ? (
                              <img
                                src={version.imageUrl}
                                alt={`v${version.versionNumber}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="absolute top-1.5 left-1.5">
                            <Badge variant={isActive ? "default" : "secondary"} className="text-xs h-5">
                              {isActive ? "Active" : `v${version.versionNumber}`}
                            </Badge>
                          </div>
                          {!isActive && onDeleteVersion && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteVersion(selectedShot.id, version.id);
                              }}
                              data-testid={`button-delete-version-${version.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="relative flex-1 bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
                {/* Main Image */}
                <div className="absolute inset-0 flex items-center justify-center p-12 pb-32">
                  {getShotVersion(selectedShot)?.imageUrl ? (
                    <img
                      src={getShotVersion(selectedShot)!.imageUrl!}
                      alt="Shot"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <ImageIcon className="h-32 w-32" />
                      <p className="text-xl">No image generated yet</p>
                    </div>
                  )}
                </div>

                {/* Context Panel - Appears above toolbar based on active category */}
                {activeCategory && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
                    <div className="bg-background/95 backdrop-blur-md rounded-lg border shadow-2xl p-4">
                      {activeCategory === "prompt" && (
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">What would you like to change?</Label>
                          <Input
                            value={editChange}
                            onChange={(e) => setEditChange(e.target.value)}
                            placeholder="e.g., Add lightning effect"
                            className="bg-background/50"
                            data-testid="input-edit-change"
                          />
                        </div>
                      )}

                      {(activeCategory === "clothes" || activeCategory === "expression" || activeCategory === "figure") && (
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Select Character</Label>
                          <Select
                            value={selectedCharacterId}
                            onValueChange={setSelectedCharacterId}
                            disabled={characters.length === 0}
                          >
                            <SelectTrigger className="bg-background/50">
                              <SelectValue placeholder={characters.length === 0 ? "No characters available" : "Select a character"} />
                            </SelectTrigger>
                            <SelectContent>
                              {characters.map((char) => (
                                <SelectItem key={char.id} value={char.id}>
                                  {char.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {selectedCharacterId && (
                            <>
                              {activeCategory === "clothes" && (
                                <div className="space-y-2">
                                  <Label className="text-sm text-muted-foreground">Change clothes to:</Label>
                                  <Input
                                    placeholder="Enter clothing description"
                                    className="bg-background/50"
                                    data-testid="input-clothes-change"
                                  />
                                </div>
                              )}
                              
                              {activeCategory === "expression" && (
                                <div className="space-y-2">
                                  <Label className="text-sm text-muted-foreground">Change expression to:</Label>
                                  <Select>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Select expression" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="happy">Happy</SelectItem>
                                      <SelectItem value="sad">Sad</SelectItem>
                                      <SelectItem value="angry">Angry</SelectItem>
                                      <SelectItem value="surprised">Surprised</SelectItem>
                                      <SelectItem value="neutral">Neutral</SelectItem>
                                      <SelectItem value="laughing">Laughing</SelectItem>
                                      <SelectItem value="crying">Crying</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              {activeCategory === "figure" && (
                                <div className="space-y-2">
                                  <Label className="text-sm text-muted-foreground">Change view to:</Label>
                                  <Select>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Select view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="front">Front view</SelectItem>
                                      <SelectItem value="back">Back view</SelectItem>
                                      <SelectItem value="side">Side view</SelectItem>
                                      <SelectItem value="top">Top view</SelectItem>
                                      <SelectItem value="low">Low angle view</SelectItem>
                                      <SelectItem value="closeup">Close-up</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {activeCategory === "remove" && (
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Remove from image:</Label>
                          <Input
                            placeholder="Enter item to remove"
                            className="bg-background/50"
                            data-testid="input-remove-item"
                          />
                        </div>
                      )}

                      {activeCategory === "camera" && (
                      <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">Camera Movement</Label>
                        <Select defaultValue={selectedShot.cameraMovement || undefined}>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select movement" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMERA_MOVEMENTS.map((movement) => (
                              <SelectItem key={movement} value={movement}>
                                {movement}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                      {activeCategory === "effects" && (
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Add effects:</Label>
                          <Select>
                            <SelectTrigger className="bg-background/50">
                              <SelectValue placeholder="Select effect" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lightning">Lightning</SelectItem>
                              <SelectItem value="fire">Fire</SelectItem>
                              <SelectItem value="smoke">Smoke</SelectItem>
                              <SelectItem value="fog">Fog</SelectItem>
                              <SelectItem value="spotlight">Spotlight</SelectItem>
                              <SelectItem value="rays">Light rays</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {activeCategory === "advanced" && (
                      <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground">Full Image Prompt</Label>
                        <Textarea
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="Describe the entire image..."
                          className="min-h-24 resize-none bg-background/50"
                          data-testid="input-edit-prompt"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center bg-card/80 backdrop-blur-md border-t">
                {/* Category Toolbar - Centered */}
                <div className="flex items-center gap-1 bg-muted/60 backdrop-blur-md rounded-full px-2 py-1.5 border shadow-lg">
                  <Button
                    size="icon"
                    variant={activeCategory === "prompt" ? "default" : "ghost"}
                    onClick={() => setActiveCategory("prompt")}
                    className="rounded-full h-12 w-12"
                    data-testid="button-category-prompt"
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-0.5 px-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("clothes")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "clothes" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-clothes"
                    >
                      <Shirt className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Clothes</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("remove")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "remove" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-remove"
                    >
                      <Eraser className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Remove</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("expression")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "expression" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-expression"
                    >
                      <Smile className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Expression</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("figure")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "figure" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-figure"
                    >
                      <User className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Figure</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("camera")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "camera" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-camera"
                    >
                      <Camera className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Camera</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("effects")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "effects" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-effects"
                    >
                      <Zap className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Effects</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveCategory("advanced")}
                      className={`flex-col h-14 px-3 rounded-lg ${
                        activeCategory === "advanced" ? "bg-primary/20" : "hover-elevate"
                      }`}
                      data-testid="button-category-advanced"
                    >
                      <Settings2 className="h-5 w-5 mb-0.5" />
                      <span className="text-xs">Advanced</span>
                    </Button>
                  </div>
                </div>

                {/* Re-gen Button - Absolute positioned */}
                <div className="absolute right-6">
                  <Button
                    onClick={handleGenerateFromDialog}
                    className="bg-gradient-to-r from-[hsl(269,100%,62%)] to-[hsl(286,77%,58%)] hover:from-[hsl(269,100%,57%)] hover:to-[hsl(286,77%,53%)] text-white font-semibold px-6 rounded-full shadow-lg"
                    data-testid="button-generate-from-dialog"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Re-gen
                  </Button>
                </div>
              </div>
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
