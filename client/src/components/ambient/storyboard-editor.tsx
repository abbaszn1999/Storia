import { useState, useEffect, useRef, useMemo } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical, X, Volume2, Plus, Zap, Smile, User, Camera, Wand2, History, Settings2, ChevronRight, ChevronDown, Shirt, Eraser, Trash2, Play, Pause, Check, Link2, LayoutGrid, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage, Step1Data } from "@/types/storyboard";
import { VOICE_LIBRARY } from "@/constants/voice-library";
import { VIDEO_MODELS as VIDEO_MODEL_CONFIGS, getVideoModelConfig, getAvailableVideoModels, isModelCompatible } from "@/constants/video-models";
import { IMAGE_MODELS as IMAGE_MODEL_CONFIGS, getImageModelConfig } from "@/constants/image-models";
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

// Use actual video model values from config
const VIDEO_MODELS = VIDEO_MODEL_CONFIGS.map(m => m.value);

// Get display label for a video model value
const getVideoModelLabel = (value: string): string => {
  const config = getVideoModelConfig(value);
  return config?.label || value;
};

// Get durations for a video model
const getVideoModelDurations = (value: string): number[] => {
  const config = getVideoModelConfig(value);
  return config?.durations || [5, 10];
};

// Use actual image model values from config
const IMAGE_MODELS = IMAGE_MODEL_CONFIGS.map(m => m.value);

// Get display label for an image model value
const getImageModelLabel = (value: string): string => {
  const config = getImageModelConfig(value);
  return config?.label || value;
};

const ANIMATION_MODE_OPTIONS = [
  { value: "smooth-image", label: "Smooth Image (Ken Burns)" },
  { value: "animate", label: "Full Animation (AI Video)" },
];

const MOTION_INTENSITY_OPTIONS = [
  { value: "subtle", label: "Subtle" },
  { value: "moderate", label: "Moderate" },
  { value: "dynamic", label: "Dynamic" },
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

// Camera movements match backend values from flow-shot-composer-prompts.ts
const CAMERA_MOVEMENTS_BY_MODE: Record<'video-animation' | 'image-transitions', string[]> = {
  'video-animation': [
    'static',
    'slow-pan-left',
    'slow-pan-right',
    'tilt-up',
    'tilt-down',
    'gentle-drift',
    'orbit',
    'push-in',
    'pull-out',
    'floating',
  ],
  'image-transitions': [
    'static',
    'slow-zoom-in',
    'slow-zoom-out',
    'pan-left',
    'pan-right',
    'ken-burns-up',
    'ken-burns-down',
    'diagonal-drift',
  ],
};

// Get camera movements for a specific animation mode
const getCameraMovements = (animationMode: 'video-animation' | 'image-transitions'): string[] => {
  return CAMERA_MOVEMENTS_BY_MODE[animationMode] || CAMERA_MOVEMENTS_BY_MODE['video-animation'];
};

// Get display label for camera movement
const getCameraMotionLabel = (value: string): string => {
  const labels: Record<string, string> = {
    'static': 'Static',
    'slow-pan-left': 'Slow Pan Left',
    'slow-pan-right': 'Slow Pan Right',
    'tilt-up': 'Tilt Up',
    'tilt-down': 'Tilt Down',
    'gentle-drift': 'Gentle Drift',
    'orbit': 'Orbit',
    'push-in': 'Push In',
    'pull-out': 'Pull Out',
    'floating': 'Floating',
    'slow-zoom-in': 'Slow Zoom In',
    'slow-zoom-out': 'Slow Zoom Out',
    'pan-left': 'Pan Left',
    'pan-right': 'Pan Right',
    'ken-burns-up': 'Ken Burns Up',
    'ken-burns-down': 'Ken Burns Down',
    'diagonal-drift': 'Diagonal Drift',
  };
  return labels[value] || value;
};

const CAMERA_ANGLE_PRESETS = [
  { id: "rotate-left-45", label: "Rotate 45° Left", icon: "↺", rotation: -45, vertical: 0, zoom: 0 },
  { id: "rotate-right-45", label: "Rotate 45° Right", icon: "↻", rotation: 45, vertical: 0, zoom: 0 },
  { id: "birds-eye", label: "Bird's Eye View", icon: "⬇", rotation: 0, vertical: 1, zoom: 0 },
  { id: "worms-eye", label: "Worm's Eye View", icon: "⬆", rotation: 0, vertical: -1, zoom: 0 },
  { id: "close-up", label: "Close-up", icon: "🔍", rotation: 0, vertical: 0, zoom: 5 },
  { id: "wide-angle", label: "Wide Angle", icon: "📐", rotation: 0, vertical: 0, zoom: -3, wideAngle: true },
];

const TRANSITION_TYPES = [
  { id: "cut", label: "Cut", description: "Instant transition" },
  { id: "fade", label: "Fade", description: "Fade to/from black" },
  { id: "dissolve", label: "Dissolve", description: "Cross-dissolve blend" },
  { id: "wipe", label: "Wipe", description: "Wipe transition" },
  { id: "slide", label: "Slide", description: "Slide transition" },
];

interface StoryboardEditorProps {
  videoId: string;
  step1Data?: Step1Data;
  narrativeMode: "image-reference" | "start-end";
  animationMode: "image-transitions" | "video-animation";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  referenceImages: ReferenceImage[];
  characters: Character[];
  voiceActorId: string | null;
  voiceOverEnabled: boolean;
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  step4Initialized?: boolean;  // Whether step4Data has been restored - prevents premature initialization
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onGenerateShot: (shotId: string) => void;
  onRegenerateShot: (shotId: string, frame?: 'start' | 'end') => void;
  onGenerateSingleImage?: (shotId: string, frame: 'start' | 'end') => void;  // Generate single frame
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
  onGenerateAllImages?: () => Promise<void>;  // Batch image generation for all shots
  isGeneratingImages?: boolean;  // True when batch image generation is in progress
  generatingShotIds?: Set<string>;  // Shot IDs currently being generated
  onNext: () => void;
}

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  sceneModel: string | null;
  sceneImageModel: string | null;
  sceneCameraMotion: string | null;
  version: ShotVersion | null;
  nextShotVersion: ShotVersion | null;
  previousShotVersion: ShotVersion | null;  // Previous shot's version for continuity checks
  referenceImage: ReferenceImage | null;
  isGenerating: boolean;
  voiceOverEnabled: boolean;
  narrativeMode: "image-reference" | "start-end";
  animationMode: "smooth-image" | "animate";
  isConnectedToNext: boolean;
  showEndFrame: boolean;
  isPartOfConnection: boolean;
  isFirstInGroup: boolean;  // True if this shot is the first in its continuity group
  previousShotNumber: number | null;  // For showing "Inherited from Shot X"
  filteredVideoModels: string[];  // Video models filtered by narrative mode
  onSelectShot: (shot: Shot) => void;
  onRegenerateShot: (shotId: string, frame?: 'start' | 'end') => void;
  onGenerateSingleImage: (shotId: string, frame: 'start' | 'end') => void;
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
  sceneCameraMotion,
  version,
  nextShotVersion,
  previousShotVersion,
  referenceImage,
  isGenerating,
  voiceOverEnabled,
  narrativeMode,
  animationMode,
  isConnectedToNext,
  showEndFrame,
  isPartOfConnection,
  isFirstInGroup,
  previousShotNumber,
  filteredVideoModels,
  onSelectShot,
  onRegenerateShot,
  onGenerateSingleImage,
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
  const [activeFrame, setActiveFrame] = useState<"start" | "end">("start");
  const [advancedImageOpen, setAdvancedImageOpen] = useState(false);
  const [advancedVideoOpen, setAdvancedVideoOpen] = useState(false);
  const [cameraPopoverOpen, setCameraPopoverOpen] = useState(false);

  // Get the appropriate prompt based on active frame and animation mode
  // - Image Transitions mode: uses imagePrompt only
  // - Video Animation mode (both sub-modes): uses startFramePrompt/endFramePrompt
  const isVideoAnimationMode = animationMode === "animate";  // "animate" = video-animation, "smooth-image" = image-transitions
  
  const getActivePrompt = (): string => {
    if (isVideoAnimationMode) {
      // Video Animation mode: use frame-specific prompts
      if (activeFrame === "start") {
        return version?.startFramePrompt || "";
      } else {
        return version?.endFramePrompt || "";
      }
    } else {
      // Image Transitions mode: use the single imagePrompt
      return version?.imagePrompt || "";
    }
  };

  // Local prompt state switches based on active frame
  const [localPrompt, setLocalPrompt] = useState(getActivePrompt());

  // Update localPrompt when version changes OR when activeFrame changes
  useEffect(() => {
    const newPrompt = getActivePrompt();
    console.log('[SortableShotCard] Prompt update:', {
      shotId: shot.id,
      versionId: version?.id,
      animationMode,
      isVideoAnimationMode,
      activeFrame,
      hasStartFramePrompt: !!version?.startFramePrompt,
      hasEndFramePrompt: !!version?.endFramePrompt,
      hasImagePrompt: !!version?.imagePrompt,
      promptLength: newPrompt.length,
    });
    setLocalPrompt(newPrompt);
  }, [version?.id, version?.imagePrompt, version?.startFramePrompt, version?.endFramePrompt, shot.id, activeFrame, animationMode, isVideoAnimationMode]);

  const handlePromptBlur = () => {
    const currentPrompt = getActivePrompt();
    if (localPrompt !== currentPrompt) {
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
  const hasNextShotStartFrame = nextShotVersion?.startFrameUrl || nextShotVersion?.imageUrl;
  const hasPreviousShotEndFrame = previousShotVersion?.endFrameUrl;
  
  // Calculate display image URL with proper fallbacks
  let displayImageUrl: string | null | undefined;
  let actualFrameShown: "start" | "end" | null = null;
  
  if (isVideoAnimationMode) {
    // Video Animation mode: show start/end frames
    if (activeFrame === "start") {
      displayImageUrl = version?.startFrameUrl || version?.imageUrl;
      actualFrameShown = "start";
    } else {
      // End frame requested
      if (isConnectedToNext && hasNextShotStartFrame) {
        // For connected shots, show the next shot's start frame as this shot's end frame
        displayImageUrl = hasNextShotStartFrame;
        actualFrameShown = "end";
      } else if (hasEndFrame) {
        displayImageUrl = version?.endFrameUrl;
        actualFrameShown = "end";
      } else {
        // No end frame yet - show placeholder
        displayImageUrl = null;
        actualFrameShown = "end";
      }
    }
  } else {
    // Image Transitions mode: show single image
    displayImageUrl = version?.imageUrl;
    actualFrameShown = null;
  }
  
  // Determine if the current frame has an image (for button state)
  const currentFrameHasImage = isVideoAnimationMode
    ? (activeFrame === "start" ? hasStartFrame : hasEndFrame)
    : hasStartFrame;
  
  // Determine if generate button should be disabled
  // For connected shots (not first in group): Start frame is inherited, can't generate
  // For connected shots: End frame needs previous shot's end frame to exist first
  // For normal shots: End frame needs start frame to exist first
  const isStartFrameInherited = isPartOfConnection && !isFirstInGroup;
  
  const isGenerateDisabled = (() => {
    if (isVideoAnimationMode) {
      if (activeFrame === "start") {
        // Start frame selected
        if (isStartFrameInherited) {
          // Connected shot (not first): start frame is inherited, can't generate
          return true;
        }
        return false; // Normal shot or first in group: can generate start
      } else {
        // End frame selected
        if (isStartFrameInherited) {
          // Connected shot: need previous shot's end frame first
          return !hasPreviousShotEndFrame;
        }
        // Normal shot: need start frame first
        return !hasStartFrame;
      }
    }
    // Image transitions mode: no disable logic needed
    return false;
  })();
  
  // Tooltip for disabled state
  const disabledTooltip = (() => {
    if (!isGenerateDisabled) return undefined;
    if (activeFrame === "start" && isStartFrameInherited) {
      return "Start frame is inherited from previous shot";
    }
    if (activeFrame === "end") {
      if (isStartFrameInherited && !hasPreviousShotEndFrame) {
        return "Previous connected shot must be generated first";
      }
      if (!hasStartFrame) {
        return "Generate start frame first";
      }
    }
    return undefined;
  })();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 overflow-visible bg-white/[0.02] border-white/[0.06]"
      data-testid={`card-shot-${shot.id}`}
    >
      <div className="aspect-video bg-black/30 relative group rounded-t-lg overflow-hidden">
        {/* Start/End Frame Tab Selector (Video Animation Mode Only) */}
        {isVideoAnimationMode && (
          <div className="absolute top-2 left-2 flex gap-1 bg-black/80 backdrop-blur-sm rounded-md p-1 z-10 border border-white/10">
            <button
              onClick={() => setActiveFrame("start")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "start"
                  ? "bg-gradient-to-r from-cyan-500/40 to-teal-500/40 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              data-testid={`button-start-frame-${shot.id}`}
            >
              Start
            </button>
            <button
              onClick={() => setActiveFrame("end")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "end"
                  ? "bg-gradient-to-r from-cyan-500/40 to-teal-500/40 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              data-testid={`button-end-frame-${shot.id}`}
              title={isConnectedToNext ? "Shows next shot's start frame" : "View end frame"}
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
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 gap-2">
            <ImageIcon className="h-12 w-12 text-white/30" />
            {isVideoAnimationMode && activeFrame === "end" && (
              <p className="text-xs text-white/50">End frame not generated</p>
            )}
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 flex items-center gap-2">
          <div
            {...(!isPartOfConnection ? attributes : {})}
            {...(!isPartOfConnection ? listeners : {})}
            className={`h-6 w-6 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded border border-white/10 ${
              isPartOfConnection 
                ? "cursor-not-allowed opacity-50" 
                : "cursor-grab active:cursor-grabbing hover:bg-black/80"
            }`}
            data-testid={`drag-handle-${shot.id}`}
            title={isPartOfConnection ? "Connected shots cannot be reordered" : "Drag to reorder"}
          >
            <GripVertical className="h-4 w-4 text-white/70" />
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50">
            # {shotIndex + 1}
          </Badge>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {displayImageUrl && (
            <Popover open={cameraPopoverOpen} onOpenChange={setCameraPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 bg-background/80 text-muted-foreground hover:text-cyan-400"
                  title="Quick camera angle"
                  data-testid={`button-camera-angle-${shot.id}`}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 pb-1">Camera Angle</p>
                  {CAMERA_ANGLE_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8 px-2"
                      onClick={() => {
                        toast({
                          title: "Applying Camera Angle",
                          description: `Transforming image: ${preset.label}`,
                        });
                        setCameraPopoverOpen(false);
                      }}
                      data-testid={`button-camera-preset-${preset.id}-${shot.id}`}
                    >
                      <span className="mr-2 text-sm">{preset.icon}</span>
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {onDeleteShot && shotsCount > 1 && (
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
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <Tabs defaultValue="image" className="w-full">
          {/* Image tab always shown, Video tab shown in animate mode */}
          <TabsList className={`grid w-full mb-3 bg-white/5 border border-white/10 ${
            animationMode === "animate" ? "grid-cols-2" : "grid-cols-1"
          }`}>
            <TabsTrigger value="image" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-teal-500/30 data-[state=active]:text-white" data-testid={`tab-image-${shot.id}`}>
              Image
            </TabsTrigger>
            {animationMode === "animate" && (
              <TabsTrigger value="video" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/30 data-[state=active]:to-teal-500/30 data-[state=active]:text-white" data-testid={`tab-video-${shot.id}`}>
                Video
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="image" className="space-y-3 mt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Prompt</Label>
                {/* Show inheritance indicator for connected shots (only in Video Animation mode with start frame) */}
                {isVideoAnimationMode && activeFrame === "start" && version?.startFrameInherited && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <Link2 className="h-3 w-3" />
                    <span>Inherited from Shot {previousShotNumber || "?"}</span>
                  </div>
                )}
              </div>
              <Textarea
                value={localPrompt}
                onChange={(e) => {
                  // Don't allow changes if inherited
                  if (isVideoAnimationMode && activeFrame === "start" && version?.startFrameInherited) {
                    return;
                  }
                  setLocalPrompt(e.target.value);
                }}
                onBlur={handlePromptBlur}
                placeholder="Describe the visual atmosphere (e.g., sunlight filtering through misty trees, calm water reflecting clouds...)"
                readOnly={isVideoAnimationMode && activeFrame === "start" && version?.startFrameInherited}
                className={`min-h-20 text-xs resize-none bg-white/5 border-white/10 ${
                  isVideoAnimationMode && activeFrame === "start" && version?.startFrameInherited
                    ? "opacity-70 cursor-not-allowed border-cyan-500/30"
                    : ""
                }`}
                data-testid={`input-prompt-${shot.id}`}
              />
            </div>

            <Collapsible open={advancedImageOpen} onOpenChange={setAdvancedImageOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 h-auto text-xs font-medium hover:bg-white/5"
                  data-testid={`button-toggle-advanced-image-${shot.id}`}
                >
                  <span className="text-white/60">Advanced Settings</span>
                  {advancedImageOpen ? (
                    <ChevronDown className="h-3 w-3 text-white/60" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-white/60" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Image Model</Label>
                  <Select
                    value={shot.imageModel || "scene-default"}
                    onValueChange={(value) => onUpdateShot(shot.id, { imageModel: value === "scene-default" ? null : value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-image-model-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      <SelectItem value="scene-default" className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                        Scene Default {sceneImageModel ? `(${getImageModelLabel(sceneImageModel)})` : ""}
                      </SelectItem>
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem key={model} value={model} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                          {getImageModelLabel(model)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Reference Image</Label>
                  {referenceImage ? (
                    <div className="relative">
                      <div className="aspect-video rounded-md overflow-hidden border border-white/10">
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
                        className="w-full border-white/10 hover:bg-white/5"
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
                  <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Shot Type</Label>
                  <Select
                    value={shot.shotType}
                    onValueChange={(value) => onUpdateShot(shot.id, { shotType: value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-shot-type-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {SHOT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
              {currentFrameHasImage ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5"
                    onClick={() => onSelectShot(shot)}
                    disabled={isGenerating}
                    data-testid={`button-edit-image-${shot.id}`}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit Image
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white disabled:opacity-50"
                    onClick={() => onRegenerateShot(shot.id, isVideoAnimationMode ? activeFrame : undefined)}
                    disabled={isGenerating}
                    data-testid={`button-regenerate-${shot.id}`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Re-generate
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onGenerateSingleImage(shot.id, isVideoAnimationMode ? activeFrame : 'start')}
                  disabled={isGenerating || isGenerateDisabled || (isStartFrameInherited && activeFrame === 'start')}
                  title={disabledTooltip}
                  data-testid={`button-generate-image-${shot.id}`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : isStartFrameInherited && activeFrame === 'start' ? (
                    <>
                      <Link2 className="mr-2 h-3 w-3" />
                      Inherited from Shot {previousShotNumber}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3 w-3" />
                      Generate Image
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Video Prompt</Label>
              <Textarea
                placeholder="Describe the motion and action for this shot..."
                value={version?.videoPrompt || ""}
                onChange={(e) => onUpdateVideoPrompt(shot.id, e.target.value)}
                className="min-h-[60px] text-xs resize-none bg-white/5 border-white/10"
                data-testid={`textarea-video-prompt-${shot.id}`}
              />
            </div>

            <Collapsible open={advancedVideoOpen} onOpenChange={setAdvancedVideoOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 h-auto text-xs font-medium hover:bg-white/5"
                  data-testid={`button-toggle-advanced-video-${shot.id}`}
                >
                  <span className="text-white/60">Advanced Settings</span>
                  {advancedVideoOpen ? (
                    <ChevronDown className="h-3 w-3 text-white/60" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-white/60" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Video Model</Label>
                  <Select
                    value={shot.videoModel || "scene-default"}
                    onValueChange={(value) => onUpdateShot(shot.id, { videoModel: value === "scene-default" ? null : value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-video-model-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      <SelectItem value="scene-default" className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                        Scene Default {sceneModel ? `(${getVideoModelLabel(sceneModel)})` : ""}
                      </SelectItem>
                      {filteredVideoModels.map((model) => (
                        <SelectItem key={model} value={model} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                          {getVideoModelLabel(model)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {narrativeMode === 'start-end' && (
                    <p className="text-[10px] text-white/40">
                      Only models with start+end frame support shown
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Duration</Label>
                  <Select
                    value={shot.duration?.toString() || ""}
                    onValueChange={(value) => onUpdateShot(shot.id, { duration: parseInt(value) })}
                    disabled={!shot.videoModel && !sceneModel}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-video-duration-${shot.id}`}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      {(shot.videoModel 
                        ? getVideoModelDurations(shot.videoModel)
                        : sceneModel 
                        ? getVideoModelDurations(sceneModel)
                        : [5, 10]
                      ).map((duration) => (
                        <SelectItem key={duration} value={duration.toString()} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                          {duration}s
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Camera Movement - can override scene default */}
                <div className="space-y-1">
                  <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Camera Movement</Label>
                  <Select
                    value={shot.cameraMovement || "scene-default"}
                    onValueChange={(value) => {
                      const availableMovements = getCameraMovements(animationMode === "animate" ? "video-animation" : "image-transitions");
                      onUpdateShot(shot.id, { cameraMovement: value === "scene-default" ? sceneCameraMotion || availableMovements[0] : value });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-camera-movement-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
                      <SelectItem value="scene-default" className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                        Scene Default {sceneCameraMotion ? `(${getCameraMotionLabel(sceneCameraMotion)})` : ""}
                      </SelectItem>
                      {getCameraMovements(animationMode === "animate" ? "video-animation" : "image-transitions").map((movement) => (
                        <SelectItem key={movement} value={movement} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                          {getCameraMotionLabel(movement)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Sound Effects</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2 hover:bg-white/5"
                      onClick={() => {
                        const autoPrompt = `Ambient sounds for ${shot.shotType.toLowerCase()} shot${shot.description ? ': ' + shot.description : ''}`;
                        onUpdateShot(shot.id, { soundEffects: autoPrompt });
                        toast({
                          title: "Sound effects generated",
                          description: "Auto-generated sound effects prompt",
                        });
                      }}
                      data-testid={`button-auto-generate-sound-${shot.id}`}
                    >
                      <Wand2 className="mr-1 h-3 w-3" />
                      Automatically
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Describe sound effects for this shot..."
                    value={shot.soundEffects || ""}
                    onChange={(e) => onUpdateShot(shot.id, { soundEffects: e.target.value })}
                    className="min-h-[60px] text-xs resize-none bg-white/5 border-white/10"
                    data-testid={`textarea-sound-effects-${shot.id}`}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                onClick={() => {
                  const hasVideo = version?.videoUrl;
                  toast({
                    title: hasVideo ? "Video Regeneration" : "Video Generation",
                    description: hasVideo 
                      ? "Video regeneration will be available after implementing the AI video generation pipeline."
                      : "Video generation will be implemented in the next phase with AI model integration (Kling/Veo/Runway).",
                  });
                }}
                data-testid={`button-generate-video-${shot.id}`}
              >
                {version?.videoUrl ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-3 w-3" />
                    Generate Video
                  </>
                )}
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
  step1Data,
  narrativeMode,
  animationMode,
  scenes,
  shots,
  shotVersions,
  referenceImages,
  characters,
  voiceActorId,
  voiceOverEnabled,
  continuityLocked,
  continuityGroups,
  step4Initialized = false,  // Wait for step4Data restore before initializing scenes
  onVoiceActorChange,
  onVoiceOverToggle,
  onGenerateShot,
  onRegenerateShot,
  onGenerateSingleImage,
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
  onGenerateAllImages,
  isGeneratingImages,
  generatingShotIds,
  onNext,
}: StoryboardEditorProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editChange, setEditChange] = useState("");
  const [activeCategory, setActiveCategory] = useState<"prompt" | "clothes" | "remove" | "expression" | "figure" | "camera" | "effects" | "variations" | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [localShots, setLocalShots] = useState(shots);
    const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [syncedPlaying, setSyncedPlaying] = useState(false);
  const [previewVersions, setPreviewVersions] = useState<Record<string, string>>({});
  const [editReferenceImages, setEditReferenceImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [cameraVertical, setCameraVertical] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(0);
  const [cameraWideAngle, setCameraWideAngle] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");
  const [timelinePlayhead, setTimelinePlayhead] = useState(0);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const editReferenceInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);

  // Calculate filtered video models based on narrative mode (Start/End Frame compatibility)
  const filteredVideoModels = useMemo(() => {
    const mode = narrativeMode === 'start-end' ? 'start-end-frame' : 'image-reference';
    return getAvailableVideoModels(mode).map(m => m.value);
  }, [narrativeMode]);

  // Track scroll position for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      // Find the scrolling container (main element with overflow-y-auto)
      const scrollContainer = document.querySelector('main.overflow-y-auto');
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 10);
      }
    };
    
    const scrollContainer = document.querySelector('main.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

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

  // Initialize preview to active version when shot changes
  useEffect(() => {
    if (selectedShot && selectedShot.currentVersionId) {
      setPreviewVersions(prev => ({
        ...prev,
        [selectedShot.id]: selectedShot.currentVersionId as string
      }));
    }
  }, [selectedShot?.id, selectedShot?.currentVersionId]);

  // Track which scenes have been initialized with step1Data defaults
  const [initializedSceneIds, setInitializedSceneIds] = useState<Set<string>>(new Set());

  // Initialize scene settings from step1Data when scenes first appear
  // IMPORTANT: Wait for step4Initialized to avoid overwriting restored model settings
  useEffect(() => {
    console.log('[StoryboardEditor] Init check:', { 
      hasStep1Data: !!step1Data, 
      scenesCount: scenes.length,
      hasOnUpdateScene: !!onUpdateScene,
      step1DataVideoModel: step1Data?.videoModel,
      step1DataImageModel: step1Data?.imageModel,
      step1DataCameraMotion: step1Data?.cameraMotion,
      step4Initialized,
    });
    
    // Wait for step4 data to be restored first - prevents overwriting saved model settings
    if (!step4Initialized) {
      console.log('[StoryboardEditor] Waiting for step4 to initialize before scene defaults');
      return;
    }
    
    if (!step1Data || scenes.length === 0 || !onUpdateScene) {
      console.log('[StoryboardEditor] Skipping initialization - missing data');
      return;
    }

    // Find scenes that haven't been initialized yet (check if ANY field is missing)
    const uninitializedScenes = scenes.filter(
      scene => !initializedSceneIds.has(scene.id) && 
               (!scene.videoModel || !scene.imageModel || !scene.cameraMotion)
    );

    console.log('[StoryboardEditor] Scene states:', scenes.map(s => ({
      id: s.id,
      title: s.title,
      videoModel: s.videoModel,
      imageModel: s.imageModel,
      cameraMotion: s.cameraMotion,
      isInitialized: initializedSceneIds.has(s.id),
    })));

    if (uninitializedScenes.length === 0) {
      console.log('[StoryboardEditor] All scenes already initialized');
      return;
    }

    console.log('[StoryboardEditor] Initializing scene defaults from step1Data:', {
      scenesToInit: uninitializedScenes.length,
      videoModel: step1Data.videoModel,
      imageModel: step1Data.imageModel,
      cameraMotion: step1Data.cameraMotion,
    });

    // Initialize each uninitalized scene - only fill in missing fields
    uninitializedScenes.forEach(scene => {
      const updates: Partial<Scene> = {};
      
      if (!scene.videoModel) {
        let modelToSet = step1Data.videoModel || filteredVideoModels[0];
        
        // Validate compatibility with current narrative mode
        if (modelToSet && !filteredVideoModels.includes(modelToSet)) {
          console.warn(
            `[StoryboardEditor] Model ${modelToSet} incompatible with ${narrativeMode}, ` +
            `switching to ${filteredVideoModels[0]}`
          );
          modelToSet = filteredVideoModels[0];
          
          toast({
            title: "Video Model Adjusted",
            description: `Switched to ${getVideoModelLabel(modelToSet)} (compatible with ${
              narrativeMode === 'start-end' ? 'Start/End Frame' : 'Image Reference'
            } mode)`,
          });
        }
        
        updates.videoModel = modelToSet;
      }
      if (!scene.imageModel) {
        updates.imageModel = step1Data.imageModel || IMAGE_MODELS[0];
      }
      if (!scene.cameraMotion) {
        const defaultCameraMotion = step1Data.cameraMotion || getCameraMovements(animationMode)[0];
        updates.cameraMotion = defaultCameraMotion;
      }
      
      if (Object.keys(updates).length > 0) {
        console.log('[StoryboardEditor] Updating scene', scene.id, 'with:', updates);
        onUpdateScene(scene.id, updates);
      }
    });

    // Track which scenes we've initialized
    setInitializedSceneIds(prev => {
      const newSet = new Set(prev);
      uninitializedScenes.forEach(scene => newSet.add(scene.id));
      return newSet;
    });
  }, [scenes, step1Data, onUpdateScene, initializedSceneIds, filteredVideoModels, narrativeMode, toast, step4Initialized]);

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
    const versions = shotVersions[shot.id] || [];
    
    console.log('[getShotVersion]', {
      shotId: shot.id,
      currentVersionId: shot.currentVersionId,
      versionsCount: versions.length,
      hasImagePrompt: versions[0]?.imagePrompt ? 'yes' : 'no',
    });
    
    // If shot has a currentVersionId, use that specific version
    if (shot.currentVersionId) {
      const found = versions.find((v) => v.id === shot.currentVersionId);
      console.log('[getShotVersion] Found by currentVersionId:', found?.id, 'imagePrompt length:', found?.imagePrompt?.length);
      return found || null;
    }
    
    // Otherwise, return the latest version (last in array) if any exist
    // This handles cases where Agent 4.1 generated prompts but currentVersionId wasn't set
    if (versions.length > 0) {
      const latest = versions[versions.length - 1];
      console.log('[getShotVersion] Returning latest version:', latest?.id, 'imagePrompt length:', latest?.imagePrompt?.length);
      return latest;
    }
    
    console.log('[getShotVersion] No version found');
    return null;
  };

  // Helper to get the version being previewed (or active version if no preview)
  const getPreviewedVersion = (shot: Shot): ShotVersion | null => {
    const versions = shotVersions[shot.id] || [];
    const previewId = previewVersions[shot.id];
    if (previewId) {
      const preview = versions.find((v) => v.id === previewId);
      if (preview) return preview;
    }
    return getShotVersion(shot);
  };

  // Helper: Check if a shot is connected to the next shot in Start-End Frame mode
  const isShotConnectedToNext = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    // Only consider approved groups
    const approvedGroups = sceneGroups.filter(group => group.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex >= sceneShots.length - 1) return false; // Last shot can't connect to next
    
    const currentShot = sceneShots[shotIndex];
    const nextShot = sceneShots[shotIndex + 1];
    
    // Check if current and next shots are in the same approved continuity group
    for (const group of approvedGroups) {
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
    // Only consider approved groups
    const approvedGroups = sceneGroups.filter(group => group.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    const currentShot = sceneShots[shotIndex];
    
    // Check if shot is in any approved group
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      if (shotIds.includes(currentShot.id)) {
        // Check if it's the last in the group
        const idx = shotIds.indexOf(currentShot.id);
        return idx === shotIds.length - 1; // Last in group shows END frame
      }
    }
    
    return true; // Not in any approved group = standalone
  };

  // Helper: Check if a shot is part of any connected sequence (disables dragging)
  const isShotPartOfConnection = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    // Only consider approved groups
    const approvedGroups = sceneGroups.filter(group => group.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    const currentShot = sceneShots[shotIndex];
    
    // Check if shot is in any approved continuity group
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      if (shotIds.includes(currentShot.id)) {
        return true; // Part of a connected sequence
      }
    }
    
    return false;
  };

  // Helper: Get the next connected shot in a continuity group
  const getNextConnectedShot = (sceneId: string, shotIndex: number): Shot | null => {
    if (narrativeMode !== "start-end" || !continuityLocked) return null;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    // Only consider approved groups
    const approvedGroups = sceneGroups.filter(group => group.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex >= sceneShots.length - 1) return null; // Last shot has no next
    
    const currentShot = sceneShots[shotIndex];
    const nextShot = sceneShots[shotIndex + 1];
    
    // Check if current and next shots are in the same approved continuity group
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      const currentIdx = shotIds.indexOf(currentShot.id);
      const nextIdx = shotIds.indexOf(nextShot.id);
      
      if (currentIdx !== -1 && nextIdx === currentIdx + 1) {
        return nextShot; // Return the next connected shot
      }
    }
    
    return null;
  };

  // Helper: Check if a shot is the FIRST in its continuity group (for inheritance display)
  const isShotFirstInGroup = (sceneId: string, shotId: string): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    // Only consider approved groups
    const approvedGroups = sceneGroups.filter(group => group.status === "approved");
    
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      if (shotIds[0] === shotId) {
        return true; // This shot is the first in the group
      }
    }
    
    return false;
  };

  // Helper: Get the previous shot in continuity group (for showing "Inherited from Shot X")
  const getPreviousShotInGroup = (sceneId: string, shotId: string): Shot | null => {
    if (narrativeMode !== "start-end" || !continuityLocked) return null;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    // Only consider approved groups
    const approvedGroups = sceneGroups.filter(group => group.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      const idx = shotIds.indexOf(shotId);
      
      if (idx > 0) {
        // Found in approved group and not first - get previous shot
        const previousShotId = shotIds[idx - 1];
        return sceneShots.find(s => s.id === previousShotId) || null;
      }
    }
    
    return null;
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

  const handleGenerateAll = async () => {
    // Use batch image generation if available
    if (onGenerateAllImages) {
      toast({
        title: "Generating All Images",
        description: `Generating keyframe images for ${totalCount} shots... This may take a few minutes.`,
      });
      await onGenerateAllImages();
    } else {
      // Fallback to individual generation
      allShots.forEach((shot) => {
        if (!shot.currentVersionId) {
          onGenerateShot(shot.id);
        }
      });
      toast({
        title: "Generating Composition",
        description: `Generating images for ${totalCount - generatedCount} shots...`,
      });
    }
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

  const handleEditReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload image files only",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setEditReferenceImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), url, name: file.name }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (editReferenceInputRef.current) {
      editReferenceInputRef.current.value = '';
    }
  };

  const handleRemoveEditReference = (id: string) => {
    setEditReferenceImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Synchronized playback handlers for compare mode
  const handleSyncedPlayPause = () => {
    if (syncedPlaying) {
      video1Ref.current?.pause();
      video2Ref.current?.pause();
      setSyncedPlaying(false);
    } else {
      video1Ref.current?.play();
      video2Ref.current?.play();
      setSyncedPlaying(true);
    }
  };

  const handleSyncedSeek = (time: number) => {
    if (video1Ref.current) video1Ref.current.currentTime = time;
    if (video2Ref.current) video2Ref.current.currentTime = time;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Compose Your Visual</h2>
        <p className="text-muted-foreground">
          Generate and refine images for each shot in your ambient visual
        </p>
      </div>

      {/* Sticky Controls Bar */}
      <Card className={`sticky top-0 z-50 border-white/[0.06] transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/40 backdrop-blur-xl backdrop-saturate-150' 
          : 'bg-white/[0.02]'
      }`}>
        <CardContent className="py-4 px-6">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                <ImageIcon className="h-5 w-5 text-cyan-400" />
              </div>
          <div>
            <h3 className="text-lg font-semibold">Composition</h3>
            <p className="text-sm text-muted-foreground">
              {generatedCount} of {totalCount} shots generated • Drag to reorder
            </p>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
              {/* Generate All Images Button */}
              {(generatedCount < totalCount || !allShots.every(s => {
                const v = shotVersions[s.id]?.[shotVersions[s.id]?.length - 1];
                return animationMode === 'image-transitions' ? v?.imageUrl : (v?.startFrameUrl && v?.endFrameUrl);
              })) && (
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                  onClick={handleGenerateAll}
                  disabled={isGeneratingImages}
                  data-testid="button-generate-all"
                >
                  {isGeneratingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Images
                    </>
                  )}
                </Button>
              )}
              
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg p-1 bg-white/5 border border-white/10">
            <Button
              size="sm"
                  variant="ghost"
                  className={`h-7 px-3 ${viewMode === "cards" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
              onClick={() => setViewMode("cards")}
              data-testid="button-view-cards"
            >
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
              Cards
            </Button>
            <Button
              size="sm"
                  variant="ghost"
                  className={`h-7 px-3 ${viewMode === "timeline" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
              onClick={() => setViewMode("timeline")}
              data-testid="button-view-timeline"
            >
                  <Clock className="h-4 w-4 mr-1.5" />
              Timeline
            </Button>
          </div>
          </div>
        </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {scenes.map((scene, sceneIndex) => {
          const sceneShots = localShots[scene.id] || [];
          
          return (
            <>
              <Card key={scene.id} className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-72 shrink-0 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/50 text-xs px-2">
                        # {sceneIndex + 1}
                      </Badge>
                      <h4 className="font-semibold text-sm">{scene.title}</h4>
                    </div>
                    {onDeleteScene && scenes.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm(`Delete segment "${scene.title}"? This will also delete all ${sceneShots.length} shot(s) in this segment.`)) {
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
                      <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Image Model</Label>
                      <Select
                        value={scene.imageModel || IMAGE_MODELS[0]}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { imageModel: value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-scene-image-model-${scene.id}`}>
                          <SelectValue placeholder="Select image model">
                            {scene.imageModel ? getImageModelLabel(scene.imageModel) : getImageModelLabel(IMAGE_MODELS[0])}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10 max-h-[300px]">
                          {IMAGE_MODEL_CONFIGS.map((model) => (
                            <SelectItem key={model.value} value={model.value} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                              <div className="flex items-center gap-2">
                                <span>{model.label}</span>
                                {model.badge && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-cyan-500/50 text-cyan-400">
                                    {model.badge}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Video Model - shown in video-animation mode */}
                    {animationMode === "video-animation" && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Video Model</Label>
                          {narrativeMode === 'start-end' && (
                            <span className="text-[10px] text-amber-400">
                              {filteredVideoModels.length} of 16 compatible
                            </span>
                          )}
                        </div>
                      <Select
                          value={scene.videoModel || filteredVideoModels[0]}
                          onValueChange={(value) => onUpdateScene?.(scene.id, { videoModel: value })}
                      >
                          <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-scene-video-model-${scene.id}`}>
                            <SelectValue placeholder="Select video model">
                              {scene.videoModel ? getVideoModelLabel(scene.videoModel) : getVideoModelLabel(filteredVideoModels[0])}
                            </SelectValue>
                        </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0a] border-white/10">
                            {filteredVideoModels.map((model) => (
                              <SelectItem key={model} value={model} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                                {getVideoModelLabel(model)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    )}

                    {/* Camera Motion - scene default for all shots */}
                      <div className="space-y-1">
                      <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Camera Motion</Label>
                        <Select
                        value={scene.cameraMotion || getCameraMovements(animationMode)[0]}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { cameraMotion: value })}
                        >
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-scene-camera-motion-${scene.id}`}>
                          <SelectValue placeholder="Select camera motion">
                            {scene.cameraMotion ? getCameraMotionLabel(scene.cameraMotion) : getCameraMotionLabel(getCameraMovements(animationMode)[0])}
                          </SelectValue>
                          </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {getCameraMovements(animationMode).map((motion) => (
                            <SelectItem key={motion} value={motion} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                              {getCameraMotionLabel(motion)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Motion Intensity</Label>
                      <Select
                        defaultValue="subtle"
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-motion-intensity-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {MOTION_INTENSITY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="focus:bg-cyan-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500/30 data-[state=checked]:to-teal-500/30">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/50 text-cyan-300 hover:from-cyan-500/30 hover:to-teal-500/30 hover:text-cyan-200"
                      onClick={() => {
                        toast({
                          title: "Animate Segment",
                          description: `Video animation for all ${sceneShots.length} shots in "${scene.title}" will be generated with AI video models.`,
                        });
                      }}
                      data-testid={`button-animate-scene-${scene.id}`}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Animate Segment's Shots
                    </Button>

                    <div className="text-xs text-muted-foreground pt-2">
                      <div>{sceneShots.length} shots</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {viewMode === "cards" ? (
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
                          const isGenerating = generatingShotIds?.has(shot.id) ?? false;
                          const isConnectedToNext = isShotConnectedToNext(scene.id, shotIndex);
                          const showEndFrame = isShotStandalone(scene.id, shotIndex);
                          const isPartOfConnection = isShotPartOfConnection(scene.id, shotIndex);
                          
                          // Get next shot's version for connected shots
                          const nextShot = getNextConnectedShot(scene.id, shotIndex);
                          const nextShotVersion = nextShot ? getShotVersion(nextShot) : null;
                          
                          // Get previous shot and its version for inherited start frame display
                          const previousShot = getPreviousShotInGroup(scene.id, shot.id);
                          const previousShotNumber = previousShot ? previousShot.shotNumber : null;
                          const previousShotVersion = previousShot ? getShotVersion(previousShot) : null;
                          
                          // Check if this shot is the first in its continuity group
                          const isFirstInGroup = isShotFirstInGroup(scene.id, shot.id);

                          return (
                            <>
                              <SortableShotCard
                                key={shot.id}
                                shot={shot}
                                shotIndex={shotIndex}
                                sceneModel={scene.videoModel || filteredVideoModels[0]}
                                sceneImageModel={scene.imageModel || IMAGE_MODELS[0]}
                                sceneCameraMotion={scene.cameraMotion || getCameraMovements(animationMode)[0]}
                                version={version}
                                nextShotVersion={nextShotVersion}
                                previousShotVersion={previousShotVersion}
                                referenceImage={referenceImage}
                                isGenerating={isGenerating}
                                voiceOverEnabled={voiceOverEnabled}
                                narrativeMode={narrativeMode}
                                animationMode={animationMode === "video-animation" ? "animate" : "smooth-image"}
                                isConnectedToNext={isConnectedToNext}
                                showEndFrame={showEndFrame}
                                isPartOfConnection={isPartOfConnection}
                                isFirstInGroup={isFirstInGroup}
                                previousShotNumber={previousShotNumber}
                                filteredVideoModels={filteredVideoModels}
                                onSelectShot={handleSelectShot}
                                onRegenerateShot={onRegenerateShot}
                                onGenerateSingleImage={onGenerateSingleImage || ((shotId, frame) => onGenerateShot(shotId))}
                                onUpdatePrompt={handleUpdatePrompt}
                                onUpdateShot={onUpdateShot}
                                onUploadReference={handleUploadReference}
                                onDeleteReference={handleDeleteReference}
                                onUpdateVideoPrompt={handleUpdateVideoPrompt}
                                onUpdateVideoDuration={handleUpdateVideoDuration}
                                onDeleteShot={onDeleteShot}
                                shotsCount={sceneShots.length}
                              />
                              {/* Connection Control and Add Shot Button */}
                              <div className="relative shrink-0 w-12 flex items-center justify-center">
                                {/* Connection indicator for connected shots (Video Animation + Start-End mode only) */}
                                {narrativeMode === "start-end" && isConnectedToNext ? (
                                  <div 
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md"
                                    data-testid={`connection-link-${shot.id}`}
                                    title="Connected shots - continuous video transition"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                ) : shotIndex < sceneShots.length - 1 ? (
                                  /* Transition Control with Add Shot - Between non-connected shots */
                                  <div className="flex flex-col items-center gap-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          className="flex flex-col items-center justify-center w-10 gap-0.5 py-1 rounded-md bg-white/5 hover:bg-white/[0.07] border border-dashed border-white/10 hover:border-cyan-500/50 transition-colors"
                                          data-testid={`button-transition-${shot.id}`}
                                          title="Set transition"
                                        >
                                          <ArrowRight className="h-3 w-3 text-white/60" />
                                          <span className="text-[9px] text-white/60 font-medium">
                                            {shot.transition || "Cut"}
                                          </span>
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-44 p-2 bg-[#0a0a0a] border-white/10" align="center">
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium text-white/50 px-2 pb-1 uppercase tracking-wider">Transition</p>
                                          {TRANSITION_TYPES.map((trans) => (
                                            <Button
                                              key={trans.id}
                                              variant="ghost"
                                              size="sm"
                                              className={`w-full justify-start text-xs h-8 px-2 hover:bg-white/5 ${shot.transition === trans.id ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : ""}`}
                                              onClick={() => {
                                                onUpdateShot(shot.id, { transition: trans.id });
                                                toast({
                                                  title: "Transition Updated",
                                                  description: `Set to "${trans.label}" - ${trans.description}`,
                                                });
                                              }}
                                              data-testid={`button-transition-${trans.id}-${shot.id}`}
                                            >
                                              <span className="flex-1 text-left">{trans.label}</span>
                                              {shot.transition === trans.id && (
                                                <Check className="h-3 w-3 text-cyan-400" />
                                              )}
                                            </Button>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    {onAddShot && (
                                      <button
                                        onClick={() => onAddShot(scene.id, shotIndex)}
                                        className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
                                        data-testid={`button-add-shot-between-${shotIndex}`}
                                        title="Insert shot here"
                                      >
                                        <Plus className="h-3 w-3 text-white/60" />
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </>
                          );
                        })}
                        
                        {/* Add Shot Button - Always visible at end of row */}
                        {onAddShot && (
                          <div className="shrink-0 flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-32 w-24 flex flex-col gap-2 border-dashed border-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 bg-white/[0.02]"
                              onClick={() => onAddShot(scene.id, Math.max(0, sceneShots.length - 1))}
                              data-testid={`button-add-shot-${scene.id}`}
                            >
                              <Plus className="h-5 w-5 text-white/60" />
                              <span className="text-xs text-white/60">Add Shot</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                  ) : (
                    /* Timeline View */
                    <div className="space-y-3">
                      {/* Timeline Header with Time Markers */}
                      <div className="flex items-center h-6 text-xs text-muted-foreground border-b border-muted">
                        <div className="w-16 shrink-0 text-center font-medium">Shot</div>
                        <div className="flex-1 flex">
                          {(() => {
                            const totalDuration = sceneShots.reduce((sum, s) => sum + (s.duration || 5), 0);
                            const markers = [];
                            for (let i = 0; i <= totalDuration; i += 5) {
                              const position = (i / totalDuration) * 100;
                              markers.push(
                                <span key={i} className="absolute text-[10px]" style={{ left: `${position}%` }}>
                                  {i}s
                                </span>
                              );
                            }
                            return <div className="relative flex-1">{markers}</div>;
                          })()}
                        </div>
                      </div>

                      {/* Timeline Tracks */}
                      <div className="space-y-2">
                        {sceneShots.map((shot, shotIndex) => {
                          const version = getShotVersion(shot);
                          const duration = shot.duration || 5;
                          const totalDuration = sceneShots.reduce((sum, s) => sum + (s.duration || 5), 0);
                          const widthPercent = (duration / totalDuration) * 100;
                          const startOffset = sceneShots.slice(0, shotIndex).reduce((sum, s) => sum + (s.duration || 5), 0);
                          const leftPercent = (startOffset / totalDuration) * 100;
                          const isConnectedToNext = isShotConnectedToNext(scene.id, shotIndex);
                          const isPartOfConnection = isShotPartOfConnection(scene.id, shotIndex);

                          return (
                            <div key={shot.id} className="flex items-center h-16 gap-2">
                              {/* Shot Number */}
                              <div className="w-16 shrink-0 flex items-center justify-center">
                                <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/70">
                                  #{shotIndex + 1}
                                </Badge>
                              </div>

                              {/* Timeline Track */}
                              <div className="flex-1 relative h-full">
                                <div
                                  className={`absolute h-full rounded-md border-2 flex items-center gap-2 px-2 cursor-pointer transition-colors ${
                                    isPartOfConnection 
                                      ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border-cyan-500/50" 
                                      : "bg-muted/50 border-muted-foreground/20 hover:border-cyan-500/50"
                                  }`}
                                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                                  onClick={() => handleSelectShot(shot)}
                                  data-testid={`timeline-shot-${shot.id}`}
                                >
                                  {/* Thumbnail */}
                                  <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-card">
                                    {version?.imageUrl || version?.startFrameUrl ? (
                                      <img
                                        src={version.startFrameUrl || version.imageUrl || ""}
                                        alt={`Shot ${shotIndex + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Shot Info */}
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="text-xs font-medium truncate">
                                      {shot.description?.slice(0, 30) || "No description"}
                                      {shot.description && shot.description.length > 30 ? "..." : ""}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {duration}s • {shot.shotType || "Medium Shot"}
                                    </p>
                                  </div>

                                  {/* Connection Indicator */}
                                  {isConnectedToNext && (
                                    <div className="shrink-0">
                                      <Link2 className="h-3 w-3 text-cyan-400" />
                                    </div>
                                  )}

                                  {/* Transition Badge (for non-connected shots) */}
                                  {!isConnectedToNext && shotIndex < sceneShots.length - 1 && (
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-background border shadow-sm text-[8px] font-medium text-muted-foreground hover:text-cyan-400 hover:border-cyan-500 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                            data-testid={`timeline-transition-${shot.id}`}
                                          >
                                            {(shot.transition || "cut").charAt(0).toUpperCase()}
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-36 p-1.5" align="center">
                                          {TRANSITION_TYPES.map((trans) => (
                                            <Button
                                              key={trans.id}
                                              variant={shot.transition === trans.id ? "secondary" : "ghost"}
                                              size="sm"
                                              className="w-full justify-start text-xs h-7 px-2"
                                              onClick={() => {
                                                onUpdateShot(shot.id, { transition: trans.id });
                                              }}
                                            >
                                              {trans.label}
                                            </Button>
                                          ))}
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Playhead / Scrubber */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="w-16 shrink-0" />
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono w-12">
                            {timelinePlayhead.toFixed(1)}s
                          </span>
                          <input
                            type="range"
                            min="0"
                            max={sceneShots.reduce((sum, s) => sum + (s.duration || 5), 0)}
                            step="0.1"
                            value={timelinePlayhead}
                            onChange={(e) => setTimelinePlayhead(Number(e.target.value))}
                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            data-testid={`timeline-scrubber-${scene.id}`}
                          />
                          <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                            {sceneShots.reduce((sum, s) => sum + (s.duration || 5), 0)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                </CardContent>
              </Card>
            
            {onAddScene && (
              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-white/10"></div>
                </div>
                <button
                  onClick={() => onAddScene(sceneIndex)}
                  className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border-2 border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
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

      {/* Summary Footer */}
      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 text-cyan-400" />
                <span className="text-muted-foreground">Generated:</span>
                <span className="font-semibold text-foreground">{generatedCount} / {totalCount}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-sm">
                <LayoutGrid className="h-4 w-4 text-cyan-400" />
                <span className="text-muted-foreground">Segments:</span>
                <span className="font-semibold text-foreground">{scenes.length}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-muted-foreground">Total Shots:</span>
                <span className="font-semibold text-foreground">{totalCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                onClick={handleContinueToAnimatic}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                data-testid="button-continue"
              >
                Continue
                <span className="ml-2">→</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedShot && (
        <Dialog open={!!selectedShot} onOpenChange={() => {
          setSelectedShot(null);
          setPreviewVersions({}); // Reset all preview state when closing
          setCompareMode(false);
          setCompareVersions([]);
          setSyncedPlaying(false);
          setEditReferenceImages([]); // Clear reference images when closing
          setEditChange(""); // Clear edit change text
          setCameraRotation(0); // Reset camera controls
          setCameraVertical(0);
          setCameraZoom(0);
          setCameraWideAngle(false);
        }}>
          <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 bg-[#0a0a0a] border-white/10">
            <div className="relative w-full h-full flex">
              {/* Left Sidebar - Version History */}
              <div className="w-56 border-r border-white/[0.06] bg-white/[0.02] flex flex-col p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-1">Shot {selectedShot.shotNumber}</h3>
                  <p className="text-xs text-white/50">Version History</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {shotVersions[selectedShot.id] && shotVersions[selectedShot.id]
                    .sort((a, b) => a.versionNumber - b.versionNumber)
                    .map((version) => {
                      const isActive = version.id === selectedShot.currentVersionId;
                      const isPreviewed = !compareMode && version.id === previewVersions[selectedShot.id];
                      const isSelectedForCompare = compareVersions.includes(version.id);
                      return (
                        <div
                          key={version.id}
                          className={`relative group rounded-md ${
                            compareMode && isSelectedForCompare 
                              ? "ring-2 ring-primary" 
                              : isPreviewed
                              ? "ring-2 ring-cyan-500"
                              : isActive
                              ? "ring-2 ring-primary/50"
                              : "hover:ring-2 hover:ring-white/20 cursor-pointer"
                          }`}
                          onClick={() => {
                            if (compareMode) {
                              // Toggle selection for comparison
                              if (isSelectedForCompare) {
                                setCompareVersions(compareVersions.filter(id => id !== version.id));
                              } else if (compareVersions.length < 2) {
                                setCompareVersions([...compareVersions, version.id]);
                              } else {
                                toast({
                                  title: "Maximum reached",
                                  description: "You can only compare 2 versions at a time",
                                });
                              }
                            } else {
                              // Normal mode: set as preview version for this shot
                              setPreviewVersions(prev => ({
                                ...prev,
                                [selectedShot.id]: version.id
                              }));
                            }
                          }}
                          data-testid={`version-thumbnail-${version.id}`}
                        >
                          <div className="aspect-video bg-black/30 rounded-md overflow-hidden">
                            {version.imageUrl ? (
                              <img
                                src={version.imageUrl}
                                alt={`v${version.versionNumber}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="h-6 w-6 text-white/30" />
                              </div>
                            )}
                            
                            {/* Play button overlay for video versions */}
                            {version.videoUrl && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/80 backdrop-blur-sm rounded-full p-2">
                                  <Play className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Top left badges */}
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            <Badge variant="outline" className={`text-xs h-5 ${isActive ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-black/60 text-white/70 border-white/10"}`}>
                              {isActive ? "Active" : `v${version.versionNumber}`}
                            </Badge>
                          </div>
                          
                          {/* Bottom left badges - Video/Image type and duration */}
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                            {version.videoUrl ? (
                              <>
                                <Badge variant="outline" className="text-xs h-5 bg-black/60 text-white/70 border-white/10">
                                  <Video className="h-3 w-3 mr-1" />
                                  {version.videoDuration ? `${version.videoDuration}s` : 'Video'}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs h-5 bg-black/60 text-white/70 border-white/10">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Image
                              </Badge>
                            )}
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
              <div className="relative flex-1 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex flex-col">
                {/* Compare Mode Toggle */}
                <div className="absolute top-6 left-6 z-20">
                  <Button
                    variant={compareMode ? "default" : "outline"}
                    className={compareMode ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30" : "border-white/10 hover:bg-white/5"}
                    onClick={() => {
                      setCompareMode(!compareMode);
                      setCompareVersions([]);
                    }}
                    data-testid="button-toggle-compare-mode"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {compareMode ? "Exit Compare" : "Compare Versions"}
                  </Button>
                </div>
                
                {/* Main Image or Video */}
                {!compareMode ? (
                  <div className="flex-1 flex items-center justify-center p-12 pb-32">
                    {getPreviewedVersion(selectedShot)?.videoUrl ? (
                      <div className="w-full max-w-4xl">
                        <video
                          key={getPreviewedVersion(selectedShot)!.videoUrl}
                          src={getPreviewedVersion(selectedShot)!.videoUrl!}
                          controls
                          className="w-full rounded-lg shadow-2xl border border-white/10"
                          data-testid="video-player"
                        />
                      </div>
                    ) : getPreviewedVersion(selectedShot)?.imageUrl ? (
                      <img
                        src={getPreviewedVersion(selectedShot)!.imageUrl!}
                        alt="Shot"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 text-white/30">
                        <ImageIcon className="h-32 w-32" />
                        <p className="text-xl">No image generated yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Compare Mode View */
                  <div className="flex-1 flex flex-col p-6 pb-32">
                    {/* Synchronized Playback Controls */}
                    {compareVersions.length === 2 && (
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/10 shadow-lg p-3 flex items-center gap-4">
                          <Label className="text-sm text-white/60">Synchronized Playback:</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 hover:bg-white/5"
                            onClick={handleSyncedPlayPause}
                            data-testid="button-synced-play-pause"
                          >
                            {syncedPlaying ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Both
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Play Both
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${compareVersions.length === 2 ? 'grid grid-cols-2 gap-4' : 'flex items-center justify-center'}`}>
                      {compareVersions.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          <div>
                            <p className="text-lg mb-2">Select versions to compare</p>
                            <p className="text-sm">Click on version thumbnails in the sidebar to select them</p>
                          </div>
                        </div>
                      ) : compareVersions.length === 1 ? (
                        /* Single Version Preview */
                        (() => {
                          const version = shotVersions[selectedShot!.id]?.find(v => v.id === compareVersions[0]);
                          if (!version) return null;
                          
                          return (
                            <div className="flex flex-col gap-4 max-w-4xl w-full">
                              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">
                                    Version {version.versionNumber}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Select another version to compare side-by-side
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCompareVersions([])}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex-1 flex items-center justify-center bg-background/50 rounded-lg overflow-hidden">
                                {version.videoUrl ? (
                                  <video
                                    src={version.videoUrl}
                                    controls
                                    className="w-full rounded-lg shadow-2xl"
                                    data-testid="compare-video-single"
                                  />
                                ) : version.imageUrl ? (
                                  <img
                                    src={version.imageUrl}
                                    alt={`v${version.versionNumber}`}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-16 w-16" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        compareVersions.slice(0, 2).map((versionId, idx) => {
                          const version = shotVersions[selectedShot!.id]?.find(v => v.id === versionId);
                          if (!version) return null;
                          const videoRef = idx === 0 ? video1Ref : video2Ref;
                          
                          return (
                            <div key={versionId} className="flex flex-col gap-2">
                              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">
                                  Version {version.versionNumber}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setCompareVersions(compareVersions.filter(id => id !== versionId));
                                    setSyncedPlaying(false);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex-1 flex items-center justify-center bg-background/50 rounded-lg overflow-hidden">
                                {version.videoUrl ? (
                                  <video
                                    ref={videoRef}
                                    src={version.videoUrl}
                                    controls
                                    className="w-full h-full object-contain"
                                    data-testid={`compare-video-${idx}`}
                                    onPlay={() => {
                                      if (syncedPlaying) setSyncedPlaying(true);
                                    }}
                                    onPause={() => {
                                      if (syncedPlaying) setSyncedPlaying(false);
                                    }}
                                  />
                                ) : version.imageUrl ? (
                                  <img
                                    src={version.imageUrl}
                                    alt={`v${version.versionNumber}`}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-16 w-16" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Bar - Above edit toolbar, shows when viewing non-active version */}
                {!compareMode && previewVersions[selectedShot.id] && previewVersions[selectedShot.id] !== selectedShot.currentVersionId && (
                  <div className="absolute top-6 right-6 z-20">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const previewedVersion = getPreviewedVersion(selectedShot);
                        if (previewedVersion && onSelectVersion) {
                          onSelectVersion(selectedShot.id, previewedVersion.id);
                          // Reset preview for this shot after activating
                          setPreviewVersions(prev => {
                            const { [selectedShot.id]: _, ...rest } = prev;
                            return rest;
                          });
                          toast({
                            title: "Version Activated",
                            description: `Version ${previewedVersion.versionNumber} is now active`,
                          });
                        }
                      }}
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                      data-testid="button-set-active-version"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Set as Active
                    </Button>
                  </div>
                )}

                {/* Context Panel - Appears above toolbar based on active category */}
                {activeCategory && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
                    <div className="bg-background/95 backdrop-blur-md rounded-lg border shadow-2xl p-4">
                      {activeCategory === "prompt" && (
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">What would you like to change?</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={editChange}
                              onChange={(e) => setEditChange(e.target.value)}
                              placeholder="e.g., Make the sky darker and add dramatic lighting"
                              className="bg-background/50 flex-1"
                              data-testid="input-edit-change"
                            />
                            <input
                              ref={editReferenceInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleEditReferenceUpload}
                              data-testid="input-edit-reference-upload"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => editReferenceInputRef.current?.click()}
                              className="shrink-0 bg-background/50 hover-elevate"
                              title="Add reference image"
                              data-testid="button-add-edit-reference"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          {editReferenceImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {editReferenceImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="relative group w-14 h-14 rounded-md overflow-hidden border bg-muted"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => handleRemoveEditReference(img.id)}
                                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove reference"
                                    data-testid={`button-remove-edit-reference-${img.id}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
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
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Camera Angle Control</Label>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => {
                                setCameraRotation(0);
                                setCameraVertical(0);
                                setCameraZoom(0);
                                setCameraWideAngle(false);
                              }}
                              data-testid="button-reset-camera"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Rotation (Left ↔ Right)</Label>
                                <span className="text-xs font-mono text-muted-foreground">{cameraRotation}°</span>
                              </div>
                              <input
                                type="range"
                                min="-90"
                                max="90"
                                value={cameraRotation}
                                onChange={(e) => setCameraRotation(Number(e.target.value))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                data-testid="slider-camera-rotation"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Vertical (Bird ↔ Worm)</Label>
                                <span className="text-xs font-mono text-muted-foreground">{cameraVertical > 0 ? `↑${cameraVertical}` : cameraVertical < 0 ? `↓${Math.abs(cameraVertical)}` : "0"}</span>
                              </div>
                              <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.1"
                                value={cameraVertical}
                                onChange={(e) => setCameraVertical(Number(e.target.value))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                data-testid="slider-camera-vertical"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Zoom (Wide ↔ Close-up)</Label>
                                <span className="text-xs font-mono text-muted-foreground">{cameraZoom > 0 ? `+${cameraZoom}` : cameraZoom}</span>
                              </div>
                              <input
                                type="range"
                                min="-5"
                                max="10"
                                value={cameraZoom}
                                onChange={(e) => setCameraZoom(Number(e.target.value))}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                data-testid="slider-camera-zoom"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between py-2">
                              <Label className="text-xs text-muted-foreground">Wide-Angle Lens</Label>
                              <Switch
                                checked={cameraWideAngle}
                                onCheckedChange={setCameraWideAngle}
                                data-testid="switch-camera-wide-angle"
                              />
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {CAMERA_ANGLE_PRESETS.map((preset) => (
                                <Button
                                  key={preset.id}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 px-2"
                                  onClick={() => {
                                    setCameraRotation(preset.rotation);
                                    setCameraVertical(preset.vertical);
                                    setCameraZoom(preset.zoom);
                                    setCameraWideAngle(preset.wideAngle || false);
                                  }}
                                  data-testid={`button-camera-quick-preset-${preset.id}`}
                                >
                                  <span className="mr-1">{preset.icon}</span>
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                          </div>
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
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center bg-black/80 backdrop-blur-md border-t border-white/10">
                {/* Category Toolbar - Centered */}
                <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/10 shadow-lg">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setActiveCategory("prompt")}
                    className={`rounded-full h-12 w-12 ${activeCategory === "prompt" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"}`}
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
                        activeCategory === "clothes" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"
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
                        activeCategory === "remove" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"
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
                        activeCategory === "expression" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"
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
                        activeCategory === "figure" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"
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
                        activeCategory === "camera" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"
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
                        activeCategory === "effects" ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30 text-white" : "hover:bg-white/5"
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
                    variant="ghost"
                    onClick={handleGenerateFromDialog}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold px-6 rounded-full shadow-lg"
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
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Want to enhance your video?</DialogTitle>
            <DialogDescription className="text-center space-y-2 pt-2">
              <p className="text-sm text-white/70">85% of creators choose "Animate All" to enhance their video</p>
              <p className="text-xs text-white/50">({totalCount - animatedCount} storyboard{totalCount - animatedCount !== 1 ? 's' : ''} haven't been animated yet.)</p>
            </DialogDescription>
          </DialogHeader>

          {/* Before/After Comparison */}
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border-2 border-white/10">
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                  Before animate
                </div>
                <div className="aspect-video bg-black/30 flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-white/30" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border-2 border-cyan-500/50">
                <div className="absolute top-2 left-2 bg-gradient-to-r from-cyan-500/80 to-teal-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
                  After animate
                </div>
                <div className="aspect-video bg-gradient-to-br from-cyan-500/10 to-teal-500/10 flex items-center justify-center">
                  <Video className="h-16 w-16 text-cyan-400" />
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
              className="h-4 w-4 rounded border-white/20 bg-white/5"
              data-testid="checkbox-dont-remind"
            />
            <Label htmlFor="dont-remind" className="text-sm text-white/60 cursor-pointer">
              Don't remind again
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEnhancementDialog(false);
                onNext();
              }}
              className="flex-1 border-white/10 hover:bg-white/5"
              data-testid="button-enhancement-next"
            >
              Next
            </Button>
            <Button
              variant="ghost"
              onClick={handleAnimateAll}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold"
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
