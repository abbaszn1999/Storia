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
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical, X, Volume2, Plus, Zap, Smile, User, Camera, Wand2, History, Settings2, ChevronRight, ChevronDown, Shirt, Eraser, Trash2, Play, Pause, Check, Link2 } from "lucide-react";
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
  narrativeMode: "image-reference" | "start-end";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  referenceImages: ReferenceImage[];
  characters: Character[];
  voiceActorId: string | null;
  voiceOverEnabled: boolean;
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
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
  voiceOverEnabled: boolean;
  narrativeMode: "image-reference" | "start-end";
  isConnectedToNext: boolean;
  showEndFrame: boolean;
  isPartOfConnection: boolean;
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
  voiceOverEnabled,
  narrativeMode,
  isConnectedToNext,
  showEndFrame,
  isPartOfConnection,
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
  } = useSortable({ 
    id: shot.id,
    // Note: We don't use disabled flag as it also disables drop target
    // Instead, we conditionally spread listeners to prevent dragging
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { toast } = useToast();
  const [localPrompt, setLocalPrompt] = useState(shot.description || "");
  const [activeFrame, setActiveFrame] = useState<"start" | "end">("start");

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

  // Determine available frames and which image to display
  const hasStartFrame = version?.startFrameUrl || version?.imageUrl;
  const hasEndFrame = version?.endFrameUrl;
  const shouldShowEndTab = narrativeMode === "start-end" && showEndFrame; // Enable End tab for standalone/last shots
  
  // Calculate display image URL with proper fallbacks
  let displayImageUrl: string | null | undefined;
  let actualFrameShown: "start" | "end" | null = null;
  
  if (narrativeMode === "start-end") {
    if (activeFrame === "start") {
      displayImageUrl = version?.startFrameUrl || version?.imageUrl;
      actualFrameShown = "start";
    } else {
      // End frame requested
      if (hasEndFrame) {
        displayImageUrl = version?.endFrameUrl;
        actualFrameShown = "end";
      } else {
        // No end frame yet - show placeholder
        displayImageUrl = null;
        actualFrameShown = "end";
      }
    }
  } else {
    displayImageUrl = version?.imageUrl;
    actualFrameShown = null;
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 overflow-visible"
      data-testid={`card-shot-${shot.id}`}
    >
      <div className="aspect-video bg-muted relative group">
        {/* Start/End Frame Tab Selector (Start-End Mode Only) */}
        {narrativeMode === "start-end" && (
          <div className="absolute top-2 left-2 flex gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 z-10">
            <button
              onClick={() => setActiveFrame("start")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "start"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-start-frame-${shot.id}`}
            >
              Start
            </button>
            <button
              onClick={() => {
                if (!shouldShowEndTab) return; // Only allow for standalone/last shots
                setActiveFrame("end");
              }}
              disabled={!shouldShowEndTab}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "end"
                  ? "bg-primary text-primary-foreground"
                  : shouldShowEndTab
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/50 cursor-not-allowed"
              }`}
              data-testid={`button-end-frame-${shot.id}`}
              title={!shouldShowEndTab ? "Connected shots don't have end frames" : ""}
            >
              End
            </button>
          </div>
        )}
        
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={`Shot ${shotIndex + 1}${actualFrameShown ? ` - ${actualFrameShown} frame` : ""}`}
            className="w-full h-full object-cover"
          />
        ) : isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 gap-2">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            {narrativeMode === "start-end" && activeFrame === "end" && (
              <p className="text-xs text-muted-foreground">End frame not generated</p>
            )}
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <div
            {...(!isPartOfConnection ? attributes : {})}
            {...(!isPartOfConnection ? listeners : {})}
            className={`h-6 w-6 flex items-center justify-center bg-background/80 rounded ${
              isPartOfConnection 
                ? "cursor-not-allowed opacity-50" 
                : "cursor-grab active:cursor-grabbing hover-elevate"
            }`}
            data-testid={`drag-handle-${shot.id}`}
            title={isPartOfConnection ? "Connected shots cannot be reordered" : "Drag to reorder"}
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
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Sound Effects</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs px-2"
                  onClick={() => {
                    const autoPrompt = `Ambient sounds for ${shot.shotType.toLowerCase()} shot${shot.description ? ': ' + shot.description : ''}`;
                    onUpdateShot(shot.id, { soundEffects: autoPrompt });
                    toast({
                      title: "Sound effects generated",
                      description: "Auto-generated sound effects prompt",
                    });
                  }}
                  disabled={!voiceOverEnabled}
                  data-testid={`button-auto-generate-sound-${shot.id}`}
                >
                  <Wand2 className="mr-1 h-3 w-3" />
                  Automatically
                </Button>
              </div>
              <Textarea
                placeholder={voiceOverEnabled ? "Describe sound effects for this shot..." : "Enable Voice Over in header to add sound effects"}
                value={shot.soundEffects || ""}
                onChange={(e) => onUpdateShot(shot.id, { soundEffects: e.target.value })}
                className="min-h-[60px] text-xs resize-none"
                disabled={!voiceOverEnabled}
                data-testid={`textarea-sound-effects-${shot.id}`}
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
  narrativeMode,
  scenes,
  shots,
  shotVersions,
  referenceImages,
  characters,
  voiceActorId,
  voiceOverEnabled,
  continuityLocked,
  continuityGroups,
  onVoiceActorChange,
  onVoiceOverToggle,
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
  const [activeCategory, setActiveCategory] = useState<"prompt" | "clothes" | "remove" | "expression" | "figure" | "camera" | "effects" | "variations" | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [localShots, setLocalShots] = useState(shots);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const { toast } = useToast();

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

  // Helper to get current version of a shot
  const getShotVersion = (shot: Shot): ShotVersion | null => {
    if (!shot.currentVersionId) return null;
    const versions = shotVersions[shot.id] || [];
    return versions.find((v) => v.id === shot.currentVersionId) || null;
  };

  // Helper: Check if a shot is connected to the next shot in Start-End Frame mode
  const isShotConnectedToNext = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex >= sceneShots.length - 1) return false; // Last shot can't connect to next
    
    const currentShot = sceneShots[shotIndex];
    const nextShot = sceneShots[shotIndex + 1];
    
    // Check if current and next shots are in the same continuity group
    for (const group of sceneGroups) {
      const shotIds = group.shotIds || [];
      const currentIdx = shotIds.indexOf(currentShot.id);
      const nextIdx = shotIds.indexOf(nextShot.id);
      
      if (currentIdx !== -1 && nextIdx === currentIdx + 1) {
        return true; // Current shot connects to next shot
      }
    }
    
    return false;
  };

  // Helper: Check if a shot is the last in a continuity group (should show END frame)
  const isShotStandalone = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    const currentShot = sceneShots[shotIndex];
    
    // Check if shot is in any group
    for (const group of sceneGroups) {
      const shotIds = group.shotIds || [];
      if (shotIds.includes(currentShot.id)) {
        // Check if it's the last in the group
        const idx = shotIds.indexOf(currentShot.id);
        return idx === shotIds.length - 1; // Last in group shows END frame
      }
    }
    
    return true; // Not in any group = standalone
  };

  // Helper: Check if a shot is part of any connected sequence (disables dragging)
  const isShotPartOfConnection = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    const currentShot = sceneShots[shotIndex];
    
    // Check if shot is in any continuity group
    for (const group of sceneGroups) {
      const shotIds = group.shotIds || [];
      if (shotIds.includes(currentShot.id)) {
        return true; // Part of a connected sequence
      }
    }
    
    return false;
  };

  // Count shots that have been animated to video
  const animatedCount = allShots.filter((shot) => {
    const version = getShotVersion(shot);
    return version?.videoUrl;
  }).length;

  // Check local storage for "don't remind again" preference
  useEffect(() => {
    const dontRemind = localStorage.getItem('storia-dont-remind-animate') === 'true';
    setDontRemindAgain(dontRemind);
  }, []);

  const handleContinueToAnimatic = () => {
    // Check if all shots have been animated to video
    if (animatedCount < totalCount && !dontRemindAgain) {
      setShowEnhancementDialog(true);
    } else {
      onNext();
    }
  };

  const handleAnimateAll = () => {
    // TODO: Implement animate all logic
    setShowEnhancementDialog(false);
    toast({
      title: "Animating All Shots",
      description: `Starting video generation for ${totalCount - animatedCount} shots...`,
    });
  };

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
      // Keep dialog open so user can approve or select from versions
    }
  };

  const handlePlayVoice = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceId);
      const voice = VOICE_LIBRARY.find(v => v.id === voiceId);
      if (voice?.previewUrl) {
        const audio = new Audio(voice.previewUrl);
        audio.play();
        audio.onended = () => setPlayingVoice(null);
      }
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    onVoiceActorChange(voiceId);
    setVoiceDropdownOpen(false);
  };

  const selectedVoice = VOICE_LIBRARY.find(v => v.id === voiceActorId);
  const selectedVoiceLabel = selectedVoice?.name || "Select voice actor";

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-50 bg-background py-4 border-b">
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
            <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={voiceDropdownOpen}
                  className="w-48 h-9 justify-between"
                  disabled={!voiceOverEnabled}
                  data-testid="button-voice-selector"
                >
                  <span className={voiceActorId ? "font-medium text-sm" : "text-muted-foreground text-sm"}>
                    {selectedVoiceLabel}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <ScrollArea className="max-h-[300px]">
                  <div className="p-1">
                    {VOICE_LIBRARY.map((voice) => (
                      <div
                        key={voice.id}
                        className="flex items-center gap-2 px-2 py-2 hover-elevate rounded-md cursor-pointer"
                        onClick={() => handleSelectVoice(voice.id)}
                        data-testid={`option-voice-${voice.id}`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {voiceActorId === voice.id && (
                            <Check className="h-4 w-4 text-primary" data-testid={`icon-selected-${voice.id}`} />
                          )}
                          <span className={`flex-1 text-sm ${voiceActorId === voice.id ? "font-medium" : ""}`}>
                            {voice.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => handlePlayVoice(voice.id, e)}
                          data-testid={`button-play-${voice.id}`}
                        >
                          {playingVoice === voice.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Voice Over</Label>
            <Switch
              checked={voiceOverEnabled}
              onCheckedChange={onVoiceOverToggle}
              data-testid="toggle-voice-over"
            />
          </div>

          <Button
            onClick={handleContinueToAnimatic}
            disabled={generatedCount < totalCount}
            data-testid="button-continue-to-animatic"
          >
            Continue to Animatic
          </Button>
          </div>
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
                          const isConnectedToNext = isShotConnectedToNext(scene.id, shotIndex);
                          const showEndFrame = isShotStandalone(scene.id, shotIndex);
                          const isPartOfConnection = isShotPartOfConnection(scene.id, shotIndex);

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
                                voiceOverEnabled={voiceOverEnabled}
                                narrativeMode={narrativeMode}
                                isConnectedToNext={isConnectedToNext}
                                showEndFrame={showEndFrame}
                                isPartOfConnection={isPartOfConnection}
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
                              {/* Connection Link Icon and Add Shot Button */}
                              <div className="relative shrink-0 w-8 flex items-center justify-center">
                                {/* Connection Link Icon - Always visible when connected (Start-End Mode Only) */}
                                {narrativeMode === "start-end" && isConnectedToNext ? (
                                  <div 
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-storia text-white shadow-md"
                                    data-testid={`connection-link-${shot.id}`}
                                    title="Connected shots"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                ) : onAddShot ? (
                                  /* Add Shot Button - Only when not connected */
                                  <button
                                    onClick={() => onAddShot(scene.id, shotIndex)}
                                    className="opacity-0 hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 border-dashed border-primary/50 hover-elevate active-elevate-2 transition-opacity"
                                    data-testid={`button-add-shot-after-${shotIndex}`}
                                  >
                                    <Plus className="h-4 w-4 text-primary" />
                                  </button>
                                ) : null}
                              </div>
                            </>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
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
                            placeholder="e.g., Make the sky darker and add dramatic lighting"
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

      {/* Enhancement Dialog */}
      <Dialog open={showEnhancementDialog} onOpenChange={setShowEnhancementDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Want to enhance your video?</DialogTitle>
            <DialogDescription className="text-center space-y-2 pt-2">
              <p className="text-sm">85% of creators choose "Animate All" to enhance their video</p>
              <p className="text-xs text-muted-foreground">({totalCount - animatedCount} storyboard{totalCount - animatedCount !== 1 ? 's' : ''} haven't been animated yet.)</p>
            </DialogDescription>
          </DialogHeader>

          {/* Before/After Comparison */}
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border-2 border-muted">
                <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                  Before animate
                </div>
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-primary-foreground">
                  After animate
                </div>
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Video className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Don't remind again checkbox */}
          <div className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              id="dont-remind"
              checked={dontRemindAgain}
              onChange={(e) => {
                const checked = e.target.checked;
                setDontRemindAgain(checked);
                localStorage.setItem('storia-dont-remind-animate', checked.toString());
              }}
              className="h-4 w-4 rounded border-gray-300"
              data-testid="checkbox-dont-remind"
            />
            <Label htmlFor="dont-remind" className="text-sm text-muted-foreground cursor-pointer">
              Don't remind again
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEnhancementDialog(false);
                onNext();
              }}
              className="flex-1"
              data-testid="button-enhancement-next"
            >
              Next
            </Button>
            <Button
              onClick={handleAnimateAll}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              data-testid="button-enhancement-animate-all"
            >
              Animate all
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
