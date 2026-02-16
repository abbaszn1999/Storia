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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical, X, Volume2, Plus, Zap, Smile, User, Camera, Wand2, History, Settings2, ChevronRight, ChevronDown, Shirt, Eraser, Trash2, Play, Pause, Check, Link2, LayoutGrid, Clock, ArrowRight, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Character, Location } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";
import { MentionTextarea } from "./mention-textarea";
import { VOICE_LIBRARY } from "@/constants/voice-library";
import { VIDEO_MODELS as VIDEO_MODEL_CONFIGS, getVideoModelConfig, getAvailableVideoModels, isModelCompatible } from "@/constants/video-models";
import { IMAGE_MODELS as IMAGE_MODEL_CONFIGS, getImageModelConfig, getDefaultImageModel } from "@/constants/image-models";
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

// Comprehensive list of all available image models (matching narrative mode)
const IMAGE_MODELS = [
  { name: "flux-2-dev", label: "FLUX.2 Dev", description: "Open weights release with full architectural control" },
  { name: "flux-2-pro", label: "FLUX.2 Pro", description: "Production-ready with robust reference-image editing" },
  { name: "flux-2-flex", label: "FLUX.2 Flex", description: "Strongest text rendering accuracy in FLUX family" },
  { name: "flux-2-max", label: "FLUX.2 Max", description: "Pinnacle of FLUX.2 family with professional-grade visual intelligence" },
  { name: "openai-gpt-image-1", label: "GPT Image 1", description: "GPT-4o architecture for high-fidelity images" },
  { name: "openai-gpt-image-1.5", label: "GPT Image 1.5", description: "Newest flagship powering ChatGPT Images" },
  { name: "runway-gen-4-image", label: "Runway Gen-4 Image", description: "High-fidelity with advanced stylistic control" },
  { name: "runway-gen-4-image-turbo", label: "Runway Gen-4 Image Turbo", description: "Faster variant for rapid iterations" },
  { name: "kling-image-o1", label: "Kling IMAGE O1", description: "High-control for consistent character handling" },
  { name: "ideogram-3.0", label: "Ideogram 3.0", description: "Design-level generation with sharper text rendering" },
  { name: "nano-banana", label: "Nano Banana (Gemini Flash 2.5)", description: "Rapid, interactive workflows with multi-image fusion" },
  { name: "nano-banana-2-pro", label: "Nano Banana 2 Pro (Gemini 3 Pro)", description: "Professional-grade with advanced text rendering" },
  { name: "seedream-4.0", label: "Seedream 4.0", description: "Ultra-fast 2K/4K rendering with sequential image capabilities" },
  { name: "seedream-4.5", label: "Seedream 4.5", description: "Production-focused with fixed face distortion" },
  { name: "google-imagen-3.0", label: "Google Imagen 3.0", description: "High-quality images with advanced prompt understanding" },
  { name: "google-imagen-4.0-ultra", label: "Google Imagen 4.0 Ultra", description: "Most advanced Google image model" },
  { name: "midjourney-v7", label: "Midjourney V7", description: "Cinematic style with artistic and photorealistic capabilities" },
  { name: "riverflow-2-max", label: "Riverflow 2 Max", description: "Maximum detail with high-quality output" },
];

// Get display label for an image model value
const getImageModelLabel = (value: string): string => {
  const model = IMAGE_MODELS.find(m => m.name === value);
  return model?.label || value;
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

// Helper function to get aspect ratio class
function getAspectRatioClass(aspectRatio?: string): string {
  if (!aspectRatio) return "aspect-video"; // Default to 16:9
  
  switch (aspectRatio) {
    case "16:9":
      return "aspect-video";
    case "9:16":
      return "aspect-[9/16]";
    case "1:1":
      return "aspect-square";
    case "4:3":
      return "aspect-[4/3]";
    case "3:4":
      return "aspect-[3/4]";
    case "21:9":
      return "aspect-[21/9]";
    default:
      return "aspect-video";
  }
}

interface StoryboardEditorProps {
  videoId: string;
  narrativeMode: "image-reference" | "start-end";
  referenceMode: "1F" | "2F" | "AI";
  aspectRatio?: string;  // e.g., "16:9", "9:16", "1:1", etc.
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  shotInheritanceMap?: { [shotId: string]: boolean };
  referenceImages: ReferenceImage[];
  characters: Character[];
  locations: Location[];
  voiceActorId?: string | null;  // Optional - voice selection moved to Step 5
  voiceOverEnabled: boolean;
  backgroundMusicEnabled: boolean;
  voiceoverLanguage: 'en' | 'ar';
  textOverlayEnabled: boolean;
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  isCommerceMode?: boolean;
  isLogoMode?: boolean;
  isCharacterVlogMode?: boolean;
  step1ImageModel?: string;  // Image model from Step 1 (fallback for scene dropdowns)
  step1VideoModel?: string;  // Video model from Step 1 (fallback for scene dropdowns)
  onVoiceActorChange?: (voiceActorId: string) => void;  // Optional - voice selection moved to Step 5
  onVoiceOverToggle: (enabled: boolean) => void;
  onBackgroundMusicEnabledChange: (enabled: boolean) => void;
  onVoiceoverLanguageChange: (language: 'en' | 'ar') => void;
  onTextOverlayEnabledChange: (enabled: boolean) => void;
  onGenerateShot: (shotId: string) => void;
  onGenerateSingleImage?: (shotId: string) => Promise<void>;  // Generate image for single shot
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
  onGenerateSceneImages?: (sceneId: string) => Promise<void>;  // Batch image generation for scene shots
  isGeneratingImages?: boolean;  // True when batch image generation is in progress
  generatingShotIds?: Set<string>;  // Shot IDs currently being generated
  onGenerateSceneVideos?: (sceneId: string) => Promise<void>;  // Batch video generation for scene shots
  isGeneratingVideos?: boolean;  // True when batch video generation is in progress
  generatingVideoShotIds?: Set<string>;  // Shot IDs currently generating videos
  onGenerateSingleVideo?: (shotId: string) => void;  // Generate/regenerate video for single shot
  onNext: () => void;
}

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  sceneModel: string | null;
  sceneImageModel: string | null;
  version: ShotVersion | null;
  nextShotVersion: ShotVersion | null;
  previousShotVersion: ShotVersion | null;
  isConnectedToPrevious: boolean;
  shotInheritedPrompt: boolean;
  referenceImage: ReferenceImage | null;
  isGenerating: boolean;
  voiceOverEnabled: boolean;
  narrativeMode: "image-reference" | "start-end";
  aspectRatio?: string;
  isConnectedToNext: boolean;
  showEndFrame: boolean;
  isPartOfConnection: boolean;
  characters: Character[];
  locations: Location[];
  videoId: string;
  onSelectShot: (shot: Shot) => void;
  onRegenerateShot: (shotId: string) => void;
  onUpdatePrompt: (shotId: string, prompt: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUploadReference: (shotId: string, file: File) => void;
  onDeleteReference: (shotId: string) => void;
  onUpdateVideoPrompt: (shotId: string, prompt: string) => void;
  onUpdateVideoDuration: (shotId: string, duration: number) => void;
  onUpdateShotVersion?: (shotId: string, versionId: string, updates: Partial<ShotVersion>) => void;
  onDeleteShot?: (shotId: string) => void;
  shotsCount: number;
  onGenerateSingleVideo?: (shotId: string) => void;
  isGeneratingVideo?: boolean;
}

function SortableShotCard({ 
  shot, 
  shotIndex,
  sceneModel,
  sceneImageModel,
  version,
  nextShotVersion,
  previousShotVersion,
  isConnectedToPrevious,
  shotInheritedPrompt,
  referenceImage,
  isGenerating,
  voiceOverEnabled,
  narrativeMode,
  aspectRatio,
  isConnectedToNext,
  showEndFrame,
  isPartOfConnection,
  characters,
  locations,
  videoId,
  onSelectShot,
  onRegenerateShot,
  onUpdatePrompt,
  onUpdateShot,
  onUploadReference,
  onDeleteReference,
  onUpdateVideoPrompt,
  onUpdateVideoDuration,
  onUpdateShotVersion,
  onDeleteShot,
  shotsCount,
  onGenerateSingleVideo,
  isGeneratingVideo = false,
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
  
  // State declarations BEFORE functions that use them
  const [activeFrame, setActiveFrame] = useState<"start" | "end">("start");
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [advancedImageOpen, setAdvancedImageOpen] = useState(false);
  const [advancedVideoOpen, setAdvancedVideoOpen] = useState(false);
  const [cameraPopoverOpen, setCameraPopoverOpen] = useState(false);
  const [generatingFrame, setGeneratingFrame] = useState<"start" | "end" | "image" | null>(null);
  
  // Determine which prompt to display based on narrative mode and active frame
  const getDisplayPrompt = () => {
    if (!version) {
      return shot.description || "";
    }
    
    if (narrativeMode === "image-reference") {
      // 1F mode: use imagePrompt (or inherited imagePrompt if shotInheritedPrompt is true)
      return version.imagePrompt || shot.description || "";
    } else {
      // 2F mode: use startFramePrompt or endFramePrompt based on activeFrame
      if (activeFrame === "start") {
        // If this shot has inherited prompt, the startFramePrompt is already set to the inherited value by the server
        // No need to look up previousShotVersion - just use version.startFramePrompt
        return version.startFramePrompt || shot.description || "";
      } else {
        return version.endFramePrompt || shot.description || "";
      }
    }
  };

  // Check if the current prompt is inherited (read-only)
  // Use the saved value from step4Data (shotInheritedPrompt) which was calculated during prompt generation
  // This ensures inheritance status persists when navigating between tabs
  const isPromptInherited = 
    narrativeMode === "start-end" && 
    activeFrame === "start" && 
    shotInheritedPrompt;  // Use saved inheritance flag from step4Data
  
  const [localPrompt, setLocalPrompt] = useState(getDisplayPrompt());

  // Log when inherited status changes for debugging
  useEffect(() => {
    console.log('[SortableShotCard] Inherited status:', {
      shotId: shot.id,
      isInherited: isPromptInherited,
      shotInheritedPrompt,
      isConnectedToPrevious,
      hasEndFramePrompt: !!previousShotVersion?.endFramePrompt,
      hasPreviousShotVersion: !!previousShotVersion,
      narrativeMode,
      activeFrame,
    });
  }, [isConnectedToPrevious, previousShotVersion, previousShotVersion?.endFramePrompt, narrativeMode, activeFrame, shot.id, isPromptInherited, shotInheritedPrompt]);

  // Update localPrompt when version, activeFrame, narrativeMode, or inheritance changes
  // Also watch for changes in previousShotVersion's endFramePrompt to update inherited prompts
  useEffect(() => {
    const newPrompt = getDisplayPrompt();
    setLocalPrompt(newPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, activeFrame, narrativeMode, isConnectedToPrevious, previousShotVersion?.endFramePrompt, previousShotVersion?.endFrameUrl]);

  // Auto-sync: Watch previousShotVersion?.endFrameUrl and update current shot's start frame display
  // ONLY if the start frame was actually inherited (not independently generated)
  useEffect(() => {
    if (isConnectedToPrevious && previousShotVersion?.endFrameUrl && narrativeMode === "start-end" && activeFrame === "start") {
      // Check if this shot's start frame was actually inherited (marked in inheritance map)
      // If the shot has its own generated start frame, DON'T overwrite it
      const wasInherited = shotInheritedPrompt; // This indicates the start frame is meant to be inherited
      
      if (wasInherited && onUpdateShotVersion && version) {
        // Only sync if the frame was inherited AND current start frame is missing or matches previous end frame
        // This prevents overwriting independently generated start frames
        const shouldSync = !version.startFrameUrl || version.startFrameUrl === previousShotVersion.endFrameUrl;
        
        if (shouldSync) {
          console.log('[storyboard-editor] Auto-syncing inherited start frame from previous shot:', {
            shotId: shot.id,
            previousEndFrame: previousShotVersion.endFrameUrl,
            currentStartFrame: version.startFrameUrl,
          });
          
          onUpdateShotVersion(shot.id, version.id, {
            startFrameUrl: previousShotVersion.endFrameUrl,
          });
        } else {
          console.log('[storyboard-editor] Skipping auto-sync - shot has its own generated start frame:', {
            shotId: shot.id,
            currentStartFrame: version.startFrameUrl,
            previousEndFrame: previousShotVersion.endFrameUrl,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousShotVersion?.endFrameUrl, isConnectedToPrevious, narrativeMode, activeFrame, shotInheritedPrompt]);

  // Generate image for a specific frame
  const handleGenerateImage = async (frame: "start" | "end" | "image") => {
    // Safety check: Don't generate inherited start frame
    if (frame === "start" && isPromptInherited) {
      toast({
        title: "Cannot Generate",
        description: "Start frame is inherited from previous shot and cannot be generated independently.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingFrame(frame);

    console.log('[storyboard-editor] Starting image generation:', {
      shotId: shot.id,
      frame,
      versionId: version?.id,
      hasVersion: !!version,
      currentVersion: version ? {
        id: version.id,
        hasImageUrl: !!version.imageUrl,
        hasStartFrameUrl: !!version.startFrameUrl,
        hasEndFrameUrl: !!version.endFrameUrl,
      } : null,
    });

    try {
      const response = await fetch(`/api/character-vlog/shots/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          shotId: shot.id,
          videoId,
          versionId: version?.id,
          frame,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[storyboard-editor] Image generation failed:', errorData);
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();

      console.log('[storyboard-editor] Image generation response:', {
        hasImageUrl: !!data.imageUrl,
        hasStartFrameUrl: !!data.startFrameUrl,
        hasEndFrameUrl: !!data.endFrameUrl,
        shotVersionId: data.shotVersionId,
        isSharedFrame: data.isSharedFrame,
        nextShotId: data.nextShotId,
      });

      // Update shot version with generated image
      if (!onUpdateShotVersion) {
        console.error('[storyboard-editor] onUpdateShotVersion is not available');
        throw new Error('onUpdateShotVersion callback is required');
      }

      if (version) {
        // Update existing version - only update fields that were actually generated (not null)
        const updates: Partial<ShotVersion> = {};
        if (data.imageUrl !== undefined && data.imageUrl !== null) updates.imageUrl = data.imageUrl;
        if (data.startFrameUrl !== undefined && data.startFrameUrl !== null) updates.startFrameUrl = data.startFrameUrl;
        if (data.endFrameUrl !== undefined && data.endFrameUrl !== null) updates.endFrameUrl = data.endFrameUrl;
        
        console.log('[storyboard-editor] Updating existing version:', {
          shotId: shot.id,
          versionId: version.id,
          updates,
          currentVersion: {
            hasImageUrl: !!version.imageUrl,
            hasStartFrameUrl: !!version.startFrameUrl,
            hasEndFrameUrl: !!version.endFrameUrl,
          },
        });
        
        onUpdateShotVersion(shot.id, version.id, updates);
      } else if (data.version) {
        // Server returned a complete version object - use it
        console.log('[storyboard-editor] Using server version:', {
          shotId: shot.id,
          versionId: data.version.id,
          serverVersion: {
            hasImageUrl: !!data.version.imageUrl,
            hasStartFrameUrl: !!data.version.startFrameUrl,
            hasEndFrameUrl: !!data.version.endFrameUrl,
            hasPrompts: !!(data.version.imagePrompt || data.version.startFramePrompt || data.version.endFramePrompt),
          },
        });
        
        // Use the complete version from server (includes prompts)
        const newVersion: ShotVersion = {
          ...data.version,
          createdAt: data.version.createdAt ? new Date(data.version.createdAt) : new Date(),
        };
        
        onUpdateShotVersion(shot.id, data.version.id, newVersion);
      } else if (data.shotVersionId) {
        // Fallback: only version ID returned (shouldn't happen with new code)
        console.warn('[storyboard-editor] Only version ID returned, creating minimal version');
        const newVersion: Partial<ShotVersion> = {
          id: data.shotVersionId,
          imageUrl: data.imageUrl || null,
          startFrameUrl: data.startFrameUrl || null,
          endFrameUrl: data.endFrameUrl || null,
        };
        
        onUpdateShotVersion(shot.id, data.shotVersionId, newVersion);
      } else {
        console.error('[storyboard-editor] No version ID returned from API');
        throw new Error('No version ID returned from image generation');
      }

      toast({
        title: "Image Generated",
        description: `${frame === "image" ? "Image" : frame === "start" ? "Start frame" : "End frame"} generated successfully.`,
      });
    } catch (error) {
      console.error("[storyboard-editor] Image generation error:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setGeneratingFrame(null);
    }
  };

  // Video generation for single shot - uses parent's handler for proper state management
  // The parent (workflow.tsx) handles server refresh after generation to avoid race conditions
  const handleGenerateVideo = () => {
    if (!shot || !version) {
      toast({
        title: "Cannot Generate Video",
        description: "Shot or version data is missing",
        variant: "destructive",
      });
      return;
    }

    console.log('[storyboard-editor] Delegating video generation to parent:', {
      shotId: shot.id,
      versionId: version.id,
      hasVideoUrl: !!version.videoUrl,
    });

    // Use parent's video generation handler which does proper server refresh
    if (onGenerateSingleVideo) {
      onGenerateSingleVideo(shot.id);
    } else {
      console.error('[storyboard-editor] onGenerateSingleVideo is not available');
      toast({
        title: "Cannot Generate Video",
        description: "Video generation handler is not available",
        variant: "destructive",
      });
    }
  };

  const handlePromptBlur = () => {
    // Don't save if prompt is inherited (read-only)
    if (isPromptInherited) {
      return;
    }

    if (!version) {
      // No version yet, update shot description
      if (localPrompt !== shot.description) {
        onUpdatePrompt(shot.id, localPrompt);
      }
      return;
    }
    
    // Update the appropriate prompt field in the version
    if (narrativeMode === "image-reference") {
      // 1F mode: update imagePrompt
      if (localPrompt !== (version.imagePrompt || "")) {
        onUpdateShotVersion?.(shot.id, version.id, { imagePrompt: localPrompt });
      }
    } else {
      // 2F mode: update startFramePrompt or endFramePrompt
      if (activeFrame === "start") {
        if (localPrompt !== (version.startFramePrompt || "")) {
          onUpdateShotVersion?.(shot.id, version.id, { startFramePrompt: localPrompt });
        }
      } else {
        if (localPrompt !== (version.endFramePrompt || "")) {
          onUpdateShotVersion?.(shot.id, version.id, { endFramePrompt: localPrompt });
        }
      }
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
  
  // Enable End tab for standalone/last shots OR connected shots (which will show next shot's start)
  const shouldShowEndTab = narrativeMode === "start-end" && (showEndFrame || isConnectedToNext);
  
  // Calculate display image URL with proper fallbacks
  let displayImageUrl: string | null | undefined;
  let actualFrameShown: "start" | "end" | null = null;
  
  if (narrativeMode === "start-end") {
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
    displayImageUrl = version?.imageUrl;
    actualFrameShown = null;
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "shrink-0 w-80 overflow-visible bg-white/[0.02] transition-all",
        isPartOfConnection 
          ? "border-2 border-[#FF4081]/40 hover:border-[#FF4081]/60 shadow-lg shadow-[#FF4081]/20" 
          : "border-white/[0.06] hover:border-[#FF4081]/30"
      )}
      data-testid={`card-shot-${shot.id}`}
    >
      <div className="aspect-video bg-muted relative group rounded-t-lg overflow-hidden">
        {/* Start/End Frame Tab Selector (Start-End Mode Only - shown only on Image tab) */}
        {narrativeMode === "start-end" && activeTab === "image" && (
          <div className="absolute top-2 left-2 flex gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 z-10">
            <button
              onClick={() => setActiveFrame("start")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "start"
                  ? "bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-start-frame-${shot.id}`}
            >
              Start
            </button>
            <button
              onClick={() => {
                if (!shouldShowEndTab) return;
                setActiveFrame("end");
              }}
              disabled={!shouldShowEndTab}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "end"
                  ? "bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] text-white"
                  : shouldShowEndTab
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/50 cursor-not-allowed"
              }`}
              data-testid={`button-end-frame-${shot.id}`}
              title={
                isConnectedToNext 
                  ? "End frame synced with next shot's start frame - Locked" 
                  : shouldShowEndTab 
                  ? "View end frame" 
                  : ""
              }
            >
              End {isConnectedToNext && <Link2 className="ml-1 w-3 h-3 inline" />}
            </button>
          </div>
        )}
        
        {/* Video Preview (when Video tab is active) */}
        {activeTab === "video" ? (
          version?.videoUrl ? (
            <video
              src={version.videoUrl}
              className="w-full h-full object-contain"
              controls
              loop
              muted
              playsInline
              data-testid={`video-preview-${shot.id}`}
            />
          ) : isGeneratingVideo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/40 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#FF4081]" />
              <p className="text-sm text-muted-foreground">Generating video...</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/20 gap-2">
              <Video className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No video generated yet</p>
            </div>
          )
        ) : (
          /* Image Preview (when Image tab is active) */
          displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={`Shot ${shotIndex + 1}${actualFrameShown ? ` - ${actualFrameShown} frame` : ""}`}
              className="w-full h-full object-contain"
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
          )
        )}
        
        {/* Hide overlays when video tab is active */}
        {activeTab === "image" && (
          <>
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
              {/* Connection Lock Badge */}
              {isPartOfConnection && (
                <Badge 
                  className="bg-background/80 text-[10px] px-1.5 py-0 h-5 border-0"
                  style={{
                    background: 'linear-gradient(to right, rgba(255, 64, 129, 0.9), rgba(255, 107, 74, 0.9))',
                    color: 'white'
                  }}
                  title="Part of connected sequence - Cannot be reordered"
                >
                  <Link2 className="w-3 h-3" />
                </Badge>
              )}
              {/* Speed Profile Badge (Commerce Mode) */}
              {shot.speedProfile && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "bg-background/80 text-[10px] px-1.5 py-0 h-5 border-0",
                    shot.speedProfile === 'speed-ramp' && "text-amber-300",
                    shot.speedProfile === 'slow-motion' && "text-blue-300",
                    shot.speedProfile === 'kinetic' && "text-red-300",
                    shot.speedProfile === 'smooth' && "text-purple-300",
                    shot.speedProfile === 'linear' && "text-gray-300"
                  )}
                >
                  <Zap className="w-3 h-3 mr-0.5" />
                  {shot.speedProfile === 'speed-ramp' ? 'Ramp' : 
                   shot.speedProfile === 'slow-motion' ? 'Slow' :
                   shot.speedProfile === 'kinetic' ? 'Kinetic' :
                   shot.speedProfile === 'smooth' ? 'Smooth' : 'Linear'}
                </Badge>
              )}
              {/* Dual Timer Display (Commerce Mode) */}
              {shot.renderDuration && shot.renderDuration !== shot.duration && (
                <div className="flex items-center gap-1.5 bg-background/80 rounded px-2 py-0.5 text-[10px]">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{shot.duration}s</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-orange-400">{shot.renderDuration}s</span>
                </div>
              )}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {displayImageUrl && (
                <Popover open={cameraPopoverOpen} onOpenChange={setCameraPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 bg-background/80 text-muted-foreground hover:text-purple-400"
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
          </>
        )}
      </div>

      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "image" | "video")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3 bg-white/[0.02] border border-white/[0.06]">
            <TabsTrigger value="image" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF4081] data-[state=active]:to-[#FF6B4A] data-[state=active]:text-white" data-testid={`tab-image-${shot.id}`}>
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF4081] data-[state=active]:to-[#FF6B4A] data-[state=active]:text-white" data-testid={`tab-video-${shot.id}`}>
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {narrativeMode === "image-reference" 
                  ? "Image Prompt" 
                  : activeFrame === "start" 
                    ? "Start Frame Prompt" 
                    : "End Frame Prompt"}
                {isPromptInherited && (
                  <span className="ml-2 text-xs text-cyan-400 font-normal">
                    (Inherited from previous shot's end frame)
                  </span>
                )}
              </Label>
              <MentionTextarea
                value={localPrompt}
                onChange={(value) => {
                  // Don't allow changes if inherited
                  if (!isPromptInherited) {
                    setLocalPrompt(value);
                  }
                }}
                onBlur={handlePromptBlur}
                readOnly={isPromptInherited}
                placeholder={
                  isPromptInherited
                    ? "Inherited from previous shot's end frame - cannot be changed"
                    : narrativeMode === "image-reference"
                      ? "Describe the image for this shot... (type @ to mention characters or locations)"
                      : activeFrame === "start"
                        ? "Describe the start frame... (type @ to mention characters or locations)"
                        : "Describe the end frame... (type @ to mention characters or locations)"
                }
                className={cn(
                  "min-h-20 text-xs resize-none bg-white/[0.02] border-white/[0.06] focus:border-[#FF4081]/50",
                  isPromptInherited && "opacity-70 cursor-not-allowed border-cyan-500/30"
                )}
                characters={characters.map(c => ({ id: c.id, name: c.name, description: c.description || c.appearance || undefined }))}
                locations={locations.map(l => ({ id: l.id, name: l.name, description: l.description || l.details || undefined }))}
                data-testid={`input-prompt-${shot.id}`}
              />
            </div>

            {/* Single Generate/Regenerate Button */}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleGenerateImage(narrativeMode === "image-reference" ? "image" : activeFrame)}
              disabled={
                generatingFrame !== null || 
                isGenerating || 
                (narrativeMode === "start-end" && activeFrame === "start" && isPromptInherited)
              }
              data-testid={`button-generate-${narrativeMode === "image-reference" ? "image" : activeFrame}-${shot.id}`}
              title={
                isPromptInherited && narrativeMode === "start-end" && activeFrame === "start"
                  ? "Start frame is inherited from previous shot's end frame - auto-synced"
                  : undefined
              }
            >
              {generatingFrame !== null ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (narrativeMode === "image-reference" 
                  ? version?.imageUrl 
                  : (activeFrame === "start" ? version?.startFrameUrl : version?.endFrameUrl)
                ) ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Regenerate
                </>
              ) : (narrativeMode === "start-end" && activeFrame === "start" && isPromptInherited) ? (
                <>
                  <Link2 className="mr-2 h-3 w-3" />
                  Inherited
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-3 w-3" />
                  Generate
                </>
              )}
            </Button>

            <Collapsible open={advancedImageOpen} onOpenChange={setAdvancedImageOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 h-auto text-xs font-medium"
                  data-testid={`button-toggle-advanced-image-${shot.id}`}
                >
                  <span className="text-muted-foreground">Advanced Settings</span>
                  {advancedImageOpen ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Image Model</Label>
                  <Select
                    value={shot.imageModel || "scene-default"}
                    onValueChange={(value) => onUpdateShot(shot.id, { imageModel: value === "scene-default" ? null : value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30" data-testid={`select-image-model-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
                      <SelectItem value="scene-default">
                        Scene Default {sceneImageModel ? `(${sceneImageModel})` : ""}
                      </SelectItem>
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.label}
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
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30" data-testid={`select-shot-type-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
                      {SHOT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onSelectShot(shot)}
              data-testid={`button-edit-image-${shot.id}`}
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit Image
            </Button>
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Video Prompt</Label>
              <MentionTextarea
                placeholder="Describe the motion and action for this shot... (type @ to mention characters or locations)"
                value={version?.videoPrompt || ""}
                onChange={(value) => onUpdateVideoPrompt(shot.id, value)}
                className="min-h-[60px] text-xs resize-none bg-white/[0.02] border-white/[0.06] focus:border-[#FF4081]/50"
                characters={characters.map(c => ({ id: c.id, name: c.name, description: c.description || c.appearance || undefined }))}
                locations={locations.map(l => ({ id: l.id, name: l.name, description: l.description || l.details || undefined }))}
                data-testid={`textarea-video-prompt-${shot.id}`}
              />
            </div>

            <Collapsible open={advancedVideoOpen} onOpenChange={setAdvancedVideoOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-2 h-auto text-xs font-medium"
                  data-testid={`button-toggle-advanced-video-${shot.id}`}
                >
                  <span className="text-muted-foreground">Advanced Settings</span>
                  {advancedVideoOpen ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Video Model</Label>
                  <Select
                    value={shot.videoModel || "scene-default"}
                    onValueChange={(value) => onUpdateShot(shot.id, { videoModel: value === "scene-default" ? null : value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30" data-testid={`select-video-model-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
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
                    value={version?.videoDuration?.toString() || shot.duration?.toString() || "5"}
                    onValueChange={(value) => onUpdateVideoDuration(shot.id, parseInt(value))}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30" data-testid={`select-video-duration-${shot.id}`}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
                      {(shot.videoModel 
                        ? getVideoModelDurations(shot.videoModel)
                        : sceneModel
                        ? getVideoModelDurations(sceneModel)
                        : [5, 10]
                      ).map((duration) => (
                        <SelectItem key={duration} value={duration.toString()}>
                          {duration}s
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || (!version?.imageUrl && !version?.startFrameUrl)}
                data-testid={`button-generate-video-${shot.id}`}
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : version?.videoUrl ? (
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
  narrativeMode,
  aspectRatio,
  scenes,
  shots,
  shotVersions,
  shotInheritanceMap = {},
  referenceImages,
  characters,
  locations,
  voiceActorId,
  voiceOverEnabled,
  backgroundMusicEnabled,
  voiceoverLanguage,
  textOverlayEnabled,
  continuityLocked,
  continuityGroups,
  isCommerceMode = false,
  isLogoMode = false,
  isCharacterVlogMode = false,
  step1ImageModel,
  step1VideoModel,
  onVoiceActorChange,
  onVoiceOverToggle,
  onBackgroundMusicEnabledChange,
  onVoiceoverLanguageChange,
  onTextOverlayEnabledChange,
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
  onGenerateSceneImages,
  isGeneratingImages = false,
  generatingShotIds = new Set(),
  onGenerateSceneVideos,
  isGeneratingVideos = false,
  generatingVideoShotIds = new Set(),
  onGenerateSingleVideo,
  onGenerateSingleImage,
  onNext,
}: StoryboardEditorProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [activeEditFrame, setActiveEditFrame] = useState<"start" | "end">("start");
  const [editPrompt, setEditPrompt] = useState("");
  const [editChange, setEditChange] = useState("");
  const [activeCategory, setActiveCategory] = useState<"prompt" | "clothes" | "remove" | "expression" | "figure" | "camera" | "effects" | "variations" | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [selectedEditingModel, setSelectedEditingModel] = useState<string>("nano-banana");
  const [isEditing, setIsEditing] = useState(false);
  const [localVersionCache, setLocalVersionCache] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [localShots, setLocalShots] = useState(shots);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
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

  // Filter available image models for editing (only select models support editing)
  const editingModels = IMAGE_MODELS.filter(model => 
    ['nano-banana', 'nano-banana-2-pro', 'flux-2-pro', 'openai-gpt-image-1', 
     'openai-gpt-image-1.5', 'runway-gen-4-image', 'runway-gen-4-image-turbo', 
     'kling-image-o1'].includes(model.name)
  );

  // Sync localShots with incoming shots prop to reflect updates
  useEffect(() => {
    setLocalShots(shots);
    console.log('[storyboard-editor] Shots prop updated:', {
      scenesCount: Object.keys(shots).length,
      totalShots: Object.values(shots).flat().length,
      shotsWithVersions: Object.values(shots).flat().filter(s => s.currentVersionId).length,
    });
  }, [shots]);

  // Sync continuityGroups changes - force re-render when continuity groups change
  useEffect(() => {
    console.log('[storyboard-editor] ContinuityGroups prop updated:', {
      scenesWithGroups: Object.keys(continuityGroups).length,
      totalGroups: Object.values(continuityGroups).flat().length,
      approvedGroups: Object.values(continuityGroups).flat().filter((g: any) => (g.status || 'approved') === 'approved').length,
    });
    // Force component to recalculate continuity connections by creating a new object reference
    // This ensures child components re-render with updated continuity state
    setLocalShots(prev => {
      const newShots: typeof prev = {};
      Object.keys(prev).forEach(sceneId => {
        newShots[sceneId] = [...prev[sceneId]]; // Create new array reference
      });
      return newShots;
    });
  }, [continuityGroups]);

  // Debug: Track shotVersions changes
  useEffect(() => {
    const totalVersions = Object.values(shotVersions).flat().length;
    const allShots = Object.values(shots).flat();
    const shotsWithVersions = allShots.filter(s => {
      const hasVersion = shotVersions[s.id] && shotVersions[s.id].length > 0;
      const hasCurrentVersionId = !!s.currentVersionId;
      const versionMatches = hasCurrentVersionId && shotVersions[s.id]?.some(v => v.id === s.currentVersionId);
      return hasVersion && hasCurrentVersionId && versionMatches;
    }).length;
    
    const shotsWithoutVersions = allShots.filter(s => {
      const hasVersion = shotVersions[s.id] && shotVersions[s.id].length > 0;
      const hasCurrentVersionId = !!s.currentVersionId;
      return hasVersion && !hasCurrentVersionId;
    });
    
    const shotsWithMismatchedVersions = allShots.filter(s => {
      const hasCurrentVersionId = !!s.currentVersionId;
      if (!hasCurrentVersionId) return false;
      const versionExists = shotVersions[s.id]?.some(v => v.id === s.currentVersionId);
      return !versionExists;
    });
    
    console.log('[storyboard-editor] ShotVersions prop updated:', {
      shotVersionsKeys: Object.keys(shotVersions).length,
      totalVersions,
      totalShots: allShots.length,
      shotsWithVersions,
      shotsWithoutVersions: shotsWithoutVersions.length,
      shotsWithMismatchedVersions: shotsWithMismatchedVersions.length,
      sampleShotVersion: Object.values(shotVersions)[0]?.[0],
      sampleShot: allShots[0],
      issues: {
        shotsWithoutVersions: shotsWithoutVersions.map(s => ({
          id: s.id,
          currentVersionId: s.currentVersionId,
          availableVersions: shotVersions[s.id]?.map(v => v.id) || [],
        })),
        shotsWithMismatchedVersions: shotsWithMismatchedVersions.map(s => ({
          id: s.id,
          currentVersionId: s.currentVersionId,
          availableVersions: shotVersions[s.id]?.map(v => v.id) || [],
        })),
      },
    });
  }, [shotVersions, shots]);

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
  // ROBUST: Falls back to latest version when currentVersionId doesn't match
  // This handles the case where client/server version IDs are different
  const getShotVersion = (shot: Shot): ShotVersion | null => {
    const versions = shotVersions[shot.id] || [];
    
    // If no versions exist at all, return null
    if (versions.length === 0) {
      return null;
    }
    
    // If shot has a currentVersionId, try to find it
    if (shot.currentVersionId) {
      const version = versions.find((v) => v.id === shot.currentVersionId);
      if (version) {
        return version;
      }
      // Version ID not found - this happens when client/server IDs differ
      // Fall back to latest version instead of returning null
      console.log(`[storyboard-editor] Shot ${shot.id} version ID mismatch (expected: ${shot.currentVersionId}), using latest version`);
    }
    
    // Fallback: return the LATEST version (last in array)
    // This ensures images always display even when IDs don't match
    return versions[versions.length - 1];
  };

  // Helper to get the version being previewed (or active version if no preview)
  const getPreviewedVersion = (shot: Shot): ShotVersion | null => {
    const versions = shotVersions[shot.id] || [];
    const cachedVersions = localVersionCache[shot.id] || [];
    const allVersions = [...versions, ...cachedVersions.filter(cv => !versions.find(pv => pv.id === cv.id))];
    const previewId = previewVersions[shot.id];
    if (previewId) {
      const preview = allVersions.find((v) => v.id === previewId);
      if (preview) return preview;
    }
    return getShotVersion(shot);
  };

  // Helper: Build editing instruction based on category
  const buildEditingInstruction = (
    category: string | null,
    editChange: string,
    selectedCharacterId: string,
    characters: Character[]
  ): string => {
    const char = selectedCharacterId ? characters.find(c => c.id === selectedCharacterId) : null;
    
    switch (category) {
      case "prompt":
        return editChange;
      case "clothes":
        return char 
          ? `Change ${char.name}'s clothes to: ${editChange}`
          : `Change the character's clothes to: ${editChange}`;
      case "remove":
        return `Remove ${editChange} from the image`;
      case "expression":
        return char
          ? `Change ${char.name}'s expression to: ${editChange}`
          : `Change the character's expression to: ${editChange}`;
      case "figure":
        return char
          ? `Change ${char.name}'s view to: ${editChange}`
          : `Change the character's view to: ${editChange}`;
      case "effects":
        return `Add ${editChange} effect to the image`;
      case "camera":
        // Camera category doesn't need text change, it uses rotation/zoom values
        return `Adjust camera: rotation ${cameraRotation}°, vertical ${cameraVertical}, zoom ${cameraZoom}${cameraWideAngle ? ', wide-angle lens' : ''}`;
      default:
        return editChange;
    }
  };

  /**
   * Handle image editing API call
   */
  const handleEditImage = async () => {
    if (!selectedShot) return;
    
    // Get selected version (from previewVersions or default to active)
    const selectedVersionId = previewVersions[selectedShot.id] || selectedShot.currentVersionId;
    const versions = shotVersions[selectedShot.id] || [];
    const cachedVersions = localVersionCache[selectedShot.id] || [];
    const allVersions = [...versions, ...cachedVersions.filter(cv => !versions.find(pv => pv.id === cv.id))];
    const version = allVersions.find(v => v.id === selectedVersionId);
    
    if (!version) {
      toast({
        title: "No version found", 
        variant: "destructive",
        description: "Please select a version to edit"
      });
      return;
    }

    // Get the image URL based on mode and active frame
    let imageUrl: string | null | undefined;
    if (narrativeMode === "start-end") {
      // For start-end mode, use the frame that's currently active in the dialog
      imageUrl = activeEditFrame === "start" 
        ? version.startFrameUrl 
        : version.endFrameUrl;
    } else {
      // For image-reference mode, use imageUrl
      imageUrl = version.imageUrl;
    }
    
    if (!imageUrl) {
      toast({ 
        title: "No image to edit", 
        variant: "destructive",
        description: narrativeMode === "start-end" 
          ? `The selected version doesn't have a ${activeEditFrame} frame`
          : "The selected version doesn't have an image"
      });
      return;
    }
    
    if (!selectedEditingModel) {
      toast({ 
        title: "Please select an editing model", 
        variant: "destructive" 
      });
      return;
    }

    if (!activeCategory) {
      toast({ 
        title: "Please select an editing category", 
        variant: "destructive" 
      });
      return;
    }

    // Camera category doesn't require editChange text
    if (activeCategory !== "camera" && !editChange.trim()) {
      toast({ 
        title: "Please provide editing instructions", 
        variant: "destructive" 
      });
      return;
    }
    
    const instruction = buildEditingInstruction(
      activeCategory,
      editChange,
      selectedCharacterId,
      characters
    );
    
    setIsEditing(true);
    try {
      const requestBody: any = {
        versionId: version.id,
        editCategory: activeCategory,
        editingInstruction: instruction,
        referenceImages: editReferenceImages.map(img => img.url),
        characterId: selectedCharacterId || undefined,
        imageModel: selectedEditingModel,
      };
      
      // For start-end mode, pass which frame is being edited
      if (narrativeMode === "start-end") {
        requestBody.activeFrame = activeEditFrame;
      }
      
      const response = await apiRequest('POST', `/api/character-vlog/videos/${videoId}/shots/${selectedShot.id}/edit-image`, requestBody);
      
      const data = await response.json();
      
      if (data.error) {
        toast({ 
          title: "Edit failed", 
          description: data.error,
          variant: "destructive" 
        });
        return;
      }
      
      // Update preview to show the new version with edited image
      if (data.newVersionId && data.version) {
        // Add the new version to local cache so it displays immediately
        setLocalVersionCache(prev => {
          const shotCache = prev[selectedShot.id] || [];
          // Remove any existing version with the same ID (shouldn't happen, but just in case)
          const filteredCache = shotCache.filter(v => v.id !== data.newVersionId);
          return {
            ...prev,
            [selectedShot.id]: [...filteredCache, data.version]
          };
        });
        
        // Set the new version as the preview
        setPreviewVersions(prev => ({
          ...prev,
          [selectedShot.id]: data.newVersionId
        }));
      }
      
      toast({ 
        title: "Image edited successfully",
        description: `New version ${data.version?.versionNumber || ''} created`
      });
      
      // Clear edit inputs
      setEditChange("");
      setEditReferenceImages([]);
      setActiveCategory(null);
      setSelectedCharacterId("");
    } catch (error: any) {
      console.error('[character-vlog:storyboard-editor] Image editing error:', error);
      toast({ 
        title: "Edit failed", 
        description: error.message || "Unknown error occurred",
        variant: "destructive" 
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Helper: Check if a shot is connected to the next shot in Start-End Frame mode
  const isShotConnectedToNext = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end") return false;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex >= sceneShots.length - 1) return false; // Last shot can't connect to next
    
    const currentShot = sceneShots[shotIndex];
    const nextShot = sceneShots[shotIndex + 1];
    
    // Filter to only approved continuity groups
    const approvedGroups = sceneGroups.filter((g: any) => (g.status || 'approved') === 'approved');
    
    // Debug logging for shot 1
    if (shotIndex === 0) {
      console.log('[StoryboardEditor] Checking shot 1 connection:', {
        sceneId,
        shotIndex,
        currentShotId: currentShot.id,
        nextShotId: nextShot.id,
        totalGroups: sceneGroups.length,
        approvedGroups: approvedGroups.length,
        groupDetails: approvedGroups.map((g: any) => ({
          id: g.id,
          status: g.status,
          shotIds: g.shotIds,
        })),
      });
    }
    
    // Check if current and next shots are in the same approved continuity group
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      const currentIdx = shotIds.indexOf(currentShot.id);
      const nextIdx = shotIds.indexOf(nextShot.id);
      
      if (currentIdx !== -1 && nextIdx === currentIdx + 1) {
        console.log('[StoryboardEditor] Found connection:', {
          shotIndex,
          currentShotId: currentShot.id,
          nextShotId: nextShot.id,
          groupId: group.id,
          currentIdx,
          nextIdx,
        });
        return true; // Current shot connects to next shot
      }
    }
    
    return false;
  };

  // Helper: Check if a shot should show END frame tab
  // In start-end mode, ALL shots should have an end frame (either generated or synced from next shot's start)
  const isShotStandalone = (sceneId: string, shotIndex: number): boolean => {
    // In start-end mode, all shots should have an end frame
    // - Standalone shots: generate their own end frame
    // - Connected shots: end frame synced with next shot's start
    if (narrativeMode !== "start-end") return false;
    
    // Always return true in start-end mode - all shots need an end frame
    return true;
  };

  // Helper: Check if a shot is part of any connected sequence (disables dragging)
  const isShotPartOfConnection = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end") return false;

    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    const currentShot = sceneShots[shotIndex];

    // Filter to only approved continuity groups
    const approvedGroups = sceneGroups.filter((g: any) => (g.status || 'approved') === 'approved');

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
    if (narrativeMode !== "start-end") return null;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex >= sceneShots.length - 1) return null; // Last shot has no next
    
    const currentShot = sceneShots[shotIndex];
    const nextShot = sceneShots[shotIndex + 1];
    
    // Filter to only approved continuity groups
    const approvedGroups = sceneGroups.filter((g: any) => (g.status || 'approved') === 'approved');
    
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

  // Helper: Get the previous connected shot in a continuity group
  const getPreviousConnectedShot = (sceneId: string, shotIndex: number): Shot | null => {
    if (narrativeMode !== "start-end") return null;
    
    const sceneGroups = continuityGroups[sceneId] || [];
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex === 0) return null; // First shot has no previous
    
    const currentShot = sceneShots[shotIndex];
    const previousShot = sceneShots[shotIndex - 1];
    
    // Filter to only approved continuity groups
    const approvedGroups = sceneGroups.filter((g: any) => (g.status || 'approved') === 'approved');
    
    // Check if current and previous shots are in the same approved continuity group
    for (const group of approvedGroups) {
      const shotIds = group.shotIds || [];
      const currentIdx = shotIds.indexOf(currentShot.id);
      const previousIdx = shotIds.indexOf(previousShot.id);
      
      if (currentIdx !== -1 && previousIdx === currentIdx - 1) {
        return previousShot; // Return the previous connected shot
      }
    }
    
    return null;
  };

  // Helper: Check if a shot is connected to the previous shot
  const isShotConnectedToPrevious = (sceneId: string, shotIndex: number): boolean => {
    return getPreviousConnectedShot(sceneId, shotIndex) !== null;
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
    if (!shot) return;
    
    // Get version ID from currentVersionId or latest version in the array
    const versions = shotVersions[shotId] || [];
    const versionId = shot.currentVersionId || (versions.length > 0 ? versions[versions.length - 1].id : null);
    
    if (versionId && onUpdateShotVersion) {
      onUpdateShotVersion(shotId, versionId, { videoPrompt: prompt });
    }
  };

  const handleUpdateVideoDuration = (shotId: string, duration: number) => {
    const shot = allShots.find(s => s.id === shotId);
    if (!shot) return;
    
    // Get version ID from currentVersionId or latest version in the array
    const versions = shotVersions[shotId] || [];
    const versionId = shot.currentVersionId || (versions.length > 0 ? versions[versions.length - 1].id : null);
    
    if (versionId && onUpdateShotVersion) {
      onUpdateShotVersion(shotId, versionId, { videoDuration: duration });
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

  // Batch video generation for scene
  const [generatingSceneVideos, setGeneratingSceneVideos] = useState<string | null>(null);
  
  const handleAnimateScene = async (sceneId: string, sceneName: string, shotCount: number) => {
    console.log('[storyboard-editor] Starting batch scene video generation:', {
      sceneId,
      sceneName,
      shotCount,
    });

    setGeneratingSceneVideos(sceneId);

    try {
      const response = await fetch(`/api/character-vlog/videos/${videoId}/scenes/${sceneId}/generate-videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[storyboard-editor] Batch video generation failed:', errorData);
        throw new Error(errorData.error || "Failed to generate videos");
      }

      const data = await response.json();

      console.log('[storyboard-editor] Batch video generation response:', {
        total: data.summary?.total,
        success: data.summary?.success,
        failed: data.summary?.failed,
      });

      // Update shot versions with generated videos
      if (data.results && onUpdateShotVersion) {
        for (const result of data.results) {
          if (result.success && result.videoUrl) {
            // Find the shot to get its version ID
            const sceneShots = shots[sceneId] || [];
            const shot = sceneShots.find(s => s.id === result.shotId);
            if (shot?.currentVersionId) {
              const updatedVersion: Partial<ShotVersion> = {
                videoUrl: result.videoUrl,
                thumbnailUrl: result.thumbnailUrl,
                actualDuration: result.actualDuration,
              };
              onUpdateShotVersion(result.shotId, shot.currentVersionId, updatedVersion);
            }
          }
        }
      }

      const successCount = data.summary?.success || 0;
      const failedCount = data.summary?.failed || 0;

      toast({
        title: "Scene Animation Complete",
        description: `Generated ${successCount} video${successCount !== 1 ? 's' : ''}${failedCount > 0 ? `, ${failedCount} failed` : ''}.`,
        variant: failedCount > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("[storyboard-editor] Batch video generation error:", error);
      toast({
        title: "Scene Animation Failed",
        description: error instanceof Error ? error.message : "Failed to generate videos",
        variant: "destructive",
      });
    } finally {
      setGeneratingSceneVideos(null);
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
    onVoiceActorChange?.(voiceId);
    setVoiceDropdownOpen(false);
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

  const selectedVoice = VOICE_LIBRARY.find(v => v.id === voiceActorId);
  const selectedVoiceLabel = selectedVoice?.name || "Select voice actor";

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Storyboard</h3>
            <p className="text-sm text-muted-foreground">
              {generatedCount} of {totalCount} shots generated • Drag to reorder
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Voice Actor and Voice Over - Hidden in Commerce/Logo/Character Vlog Mode */}
            {!isCommerceMode && !isLogoMode && !isCharacterVlogMode && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Voice Actor</Label>
                  <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={voiceDropdownOpen}
                        className="w-48 h-9 justify-between bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30"
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
                      <ScrollArea className="max-h-[300px] custom-scrollbar">
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
                                  <Check className="h-4 w-4 text-purple-400" data-testid={`icon-selected-${voice.id}`} />
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
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF4081] data-[state=checked]:via-[#FF5C8D] data-[state=checked]:to-[#FF6B4A] data-[state=checked]:shadow-lg data-[state=checked]:shadow-[#FF4081]/30 data-[state=unchecked]:bg-white/[0.06]"
                    data-testid="toggle-voice-over"
                  />
                </div>
              </>
            )}

          <div className="flex items-center border rounded-lg p-1 bg-white/[0.02] border-white/[0.06]">
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 px-3 transition-all duration-200 ${viewMode === "cards" ? "bg-gradient-to-r from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A] text-white shadow-lg shadow-[#FF4081]/20" : "text-white/70 hover:text-white hover:bg-white/[0.04]"}`}
              onClick={() => setViewMode("cards")}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Cards
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 px-3 transition-all duration-200 ${viewMode === "timeline" ? "bg-gradient-to-r from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A] text-white shadow-lg shadow-[#FF4081]/20" : "text-white/70 hover:text-white hover:bg-white/[0.04]"}`}
              onClick={() => setViewMode("timeline")}
              data-testid="button-view-timeline"
            >
              <Clock className="h-4 w-4 mr-1.5" />
              Timeline
            </Button>
          </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {scenes.map((scene, sceneIndex) => {
          const sceneShots = localShots[scene.id] || [];
          
          return (
            <>
              <div key={scene.id} className="space-y-4 p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-80 shrink-0 space-y-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF4081] to-[#FF6B4A] flex items-center justify-center text-white text-sm font-bold")}>
                        {sceneIndex + 1}
                      </div>
                      <h4 className="font-semibold text-sm text-white">{scene.title}</h4>
                    </div>
                    {onDeleteScene && scenes.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white/50 hover:text-red-400 hover:bg-red-500/10"
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
                  <p className="text-sm text-white/50 line-clamp-2">
                    {scene.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Image Model</Label>
                      <Select
                        value={scene.imageModel || step1ImageModel || getDefaultImageModel().value}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { imageModel: value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-scene-image-model-${scene.id}`}>
                          <SelectValue>
                            {scene.imageModel ? getImageModelLabel(scene.imageModel) : (step1ImageModel ? getImageModelLabel(step1ImageModel) : getDefaultImageModel().label)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {IMAGE_MODEL_CONFIGS.filter(model => 
                            !aspectRatio || model.aspectRatios.includes(aspectRatio)
                          ).map((model) => (
                            <SelectItem key={model.value} value={model.value} className="focus:bg-[#FF4081]/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF4081]/30 data-[state=checked]:to-[#FF6B4A]/30">
                              <div className="flex items-center gap-2">
                                <span>{model.label}</span>
                                {model.badge && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-[#FF4081]/50 text-[#FF4081]">
                                    {model.badge}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-white/50 uppercase tracking-wider font-medium">Video Model</Label>
                      <Select
                        value={scene.videoModel || step1VideoModel || VIDEO_MODELS[0]}
                        onValueChange={(value) => {
                          // Update scene video model
                          onUpdateScene?.(scene.id, { videoModel: value });
                          
                          // Update shot durations to be compatible with new model
                          const newModelDurations = getVideoModelDurations(value);
                          sceneShots.forEach((shot) => {
                            // Only update shots that don't have their own video model override
                            if (!shot.videoModel) {
                              const currentDuration = shot.duration || 5;
                              if (!newModelDurations.includes(currentDuration)) {
                                // Find nearest supported duration
                                const nearest = newModelDurations.reduce((prev, curr) => 
                                  Math.abs(curr - currentDuration) < Math.abs(prev - currentDuration) ? curr : prev
                                );
                                onUpdateShot(shot.id, { duration: nearest });
                              }
                            }
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10" data-testid={`select-scene-video-model-${scene.id}`}>
                          <SelectValue>
                            {scene.videoModel ? getVideoModelLabel(scene.videoModel) : getVideoModelLabel(VIDEO_MODELS[0])}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {VIDEO_MODEL_CONFIGS.filter(model => 
                            !aspectRatio || model.aspectRatios.includes(aspectRatio)
                          ).map((model) => (
                            <SelectItem key={model.value} value={model.value} className="focus:bg-[#FF4081]/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#FF4081]/30 data-[state=checked]:to-[#FF6B4A]/30">
                              <div className="flex items-center gap-2">
                                <span>{model.label}</span>
                                {model.badge && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-[#FF4081]/50 text-[#FF4081]">
                                    {model.badge}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lighting and Weather - Hidden in Commerce/Logo/Character Vlog Mode */}
                    {!isCommerceMode && !isLogoMode && !isCharacterVlogMode && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Lighting</Label>
                          <Select
                            value={scene.lighting || LIGHTING_OPTIONS[0]}
                            onValueChange={(value) => onUpdateScene?.(scene.id, { lighting: value })}
                          >
                            <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30" data-testid={`select-scene-lighting-${scene.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border-white/[0.06]">
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
                            <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-[#FF4081]/30" data-testid={`select-scene-weather-${scene.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black/90 border-white/[0.06]">
                              {WEATHER_OPTIONS.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* Generation Buttons */}
                    <div className="space-y-2 mt-3">
                      {/* Generate Images Button - Scene Specific */}
                      {onGenerateSceneImages && (
                        <Button
                          size="sm"
                          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                          onClick={() => onGenerateSceneImages(scene.id)}
                          disabled={sceneShots.length === 0 || isGeneratingImages}
                          data-testid={`button-generate-scene-images-${scene.id}`}
                        >
                          {isGeneratingImages && sceneShots.some(s => generatingShotIds.has(s.id)) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating Images...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Generate Scene's Images
                            </>
                          )}
                        </Button>
                      )}

                      {/* Generate Videos Button - Scene Specific */}
                      {onGenerateSceneVideos && (
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] hover:opacity-90 text-white"
                          onClick={() => onGenerateSceneVideos(scene.id)}
                          disabled={sceneShots.length === 0 || isGeneratingVideos}
                          data-testid={`button-generate-scene-videos-${scene.id}`}
                        >
                          {isGeneratingVideos && sceneShots.some(s => generatingVideoShotIds.has(s.id)) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating Videos...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Generate Scene's Videos
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground pt-2">
                      <div>{sceneShots.length} shots</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
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
                      <div className="flex gap-4 pb-2 items-start">
                        {sceneShots.map((shot, shotIndex) => {
                          const version = getShotVersion(shot);
                          const referenceImage = getShotReferenceImage(shot.id);
                          const isGenerating = false;
                          const isConnectedToNext = isShotConnectedToNext(scene.id, shotIndex);
                          const isConnectedToPrevious = isShotConnectedToPrevious(scene.id, shotIndex);
                          const showEndFrame = isShotStandalone(scene.id, shotIndex);
                          const isPartOfConnection = isShotPartOfConnection(scene.id, shotIndex);
                          
                          // Get next shot's version for connected shots
                          const nextShot = getNextConnectedShot(scene.id, shotIndex);
                          const nextShotVersion = nextShot ? getShotVersion(nextShot) : null;
                          
                          // Get previous shot's version for connected shots (to inherit end frame prompt)
                          const previousShot = getPreviousConnectedShot(scene.id, shotIndex);
                          const previousShotVersion = previousShot ? getShotVersion(previousShot) : null;
                          
                          // Calculate per-shot narrative mode based on shot data
                          // Priority: shot.frameMode > version prompts > global narrativeMode
                          let shotNarrativeMode: "image-reference" | "start-end" = narrativeMode;
                          
                          if (shot.frameMode) {
                            // Use explicit frameMode if set
                            shotNarrativeMode = shot.frameMode;
                          } else if (version) {
                            // Infer from version data: if has imagePrompt or imageUrl, it's image-reference
                            // If has startFramePrompt/endFramePrompt or startFrameUrl/endFrameUrl, it's start-end
                            const hasImageData = !!(version.imagePrompt || version.imageUrl);
                            const hasStartEndData = !!(version.startFramePrompt || version.endFramePrompt || version.startFrameUrl || version.endFrameUrl);
                            
                            console.log(`[storyboard-editor] Shot ${shot.id} narrative mode detection:`, {
                              shotId: shot.id,
                              hasFrameMode: !!shot.frameMode,
                              hasImageData,
                              hasStartEndData,
                              version: {
                                imagePrompt: !!version.imagePrompt,
                                imageUrl: !!version.imageUrl,
                                startFramePrompt: !!version.startFramePrompt,
                                endFramePrompt: !!version.endFramePrompt,
                                startFrameUrl: !!version.startFrameUrl,
                                endFrameUrl: !!version.endFrameUrl,
                              },
                              globalNarrativeMode: narrativeMode,
                              calculatedMode: hasImageData && !hasStartEndData ? "image-reference" : hasStartEndData ? "start-end" : narrativeMode,
                            });
                            
                            if (hasImageData && !hasStartEndData) {
                              shotNarrativeMode = "image-reference";
                            } else if (hasStartEndData) {
                              shotNarrativeMode = "start-end";
                            }
                          }

                          return (
                            <>
                              <SortableShotCard
                                key={`${shot.id}-${isConnectedToPrevious}-${previousShotVersion?.id || 'none'}`}
                                shot={shot}
                                shotIndex={shotIndex}
                                sceneModel={scene.videoModel || step1VideoModel || VIDEO_MODELS[0]}
                                sceneImageModel={scene.imageModel || step1ImageModel || getDefaultImageModel().value}
                                version={version}
                                nextShotVersion={nextShotVersion}
                                previousShotVersion={previousShotVersion}
                                isConnectedToPrevious={isConnectedToPrevious}
                                shotInheritedPrompt={shotInheritanceMap[shot.id] || false}
                                referenceImage={referenceImage}
                                isGenerating={isGenerating}
                                voiceOverEnabled={voiceOverEnabled}
                                narrativeMode={shotNarrativeMode}
                                aspectRatio={aspectRatio}
                                isConnectedToNext={isConnectedToNext}
                                showEndFrame={showEndFrame}
                                isPartOfConnection={isPartOfConnection}
                                characters={characters}
                                locations={locations}
                                videoId={videoId}
                                onSelectShot={handleSelectShot}
                                onRegenerateShot={onRegenerateShot}
                                onUpdatePrompt={handleUpdatePrompt}
                                onUpdateShot={onUpdateShot}
                                onUploadReference={handleUploadReference}
                                onDeleteReference={handleDeleteReference}
                                onUpdateVideoPrompt={handleUpdateVideoPrompt}
                                onUpdateVideoDuration={handleUpdateVideoDuration}
                                onUpdateShotVersion={onUpdateShotVersion}
                                onDeleteShot={onDeleteShot}
                                shotsCount={sceneShots.length}
                                onGenerateSingleVideo={onGenerateSingleVideo}
                                isGeneratingVideo={generatingVideoShotIds?.has(shot.id) || false}
                              />
                              {/* Connection Link Icon and Add Shot Button */}
                              <div className="relative shrink-0 w-8 flex items-center justify-center">
                                {/* Connection Link Icon - Always visible when connected (Start-End Mode Only) */}
                                {shotNarrativeMode === "start-end" && isConnectedToNext ? (
                                  <div 
                                    className="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg border-2 border-[#FF4081]"
                                    style={{
                                      background: 'linear-gradient(to right, #FF4081, #FF6B4A)',
                                      boxShadow: '0 4px 12px rgba(255, 64, 129, 0.4)'
                                    }}
                                    data-testid={`connection-link-${shot.id}`}
                                    title="Connected shots - Cannot be changed"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                ) : shotIndex < sceneShots.length - 1 ? (
                                  /* Transition Control with Add Shot - Between non-connected shots */
                                  <div className="flex flex-col items-center gap-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          className="flex flex-col items-center justify-center w-10 gap-0.5 py-1 rounded-md bg-muted/50 hover:bg-muted border border-dashed border-muted-foreground/30 hover:border-[#FF4081]/50 transition-colors"
                                          data-testid={`button-transition-${shot.id}`}
                                          title="Set transition"
                                        >
                                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-[9px] text-muted-foreground font-medium">
                                            {shot.transition || "Cut"}
                                          </span>
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-44 p-2" align="center">
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium text-muted-foreground px-2 pb-1">Transition</p>
                                          {TRANSITION_TYPES.map((trans) => (
                                            <Button
                                              key={trans.id}
                                              variant={shot.transition === trans.id ? "secondary" : "ghost"}
                                              size="sm"
                                              className="w-full justify-start text-xs h-8 px-2"
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
                                                <Check className="h-3 w-3 text-[#FF4081]" />
                                              )}
                                            </Button>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    {onAddShot && (
                                      <button
                                        onClick={() => onAddShot(scene.id, shotIndex)}
                                        className="flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-dashed border-muted-foreground/30 hover:border-[#FF4081]/50 hover:bg-[#FF4081]/5 transition-colors"
                                        data-testid={`button-add-shot-between-${shotIndex}`}
                                        title="Insert shot here"
                                      >
                                        <Plus className="h-3 w-3 text-muted-foreground" />
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
                              className="h-32 w-24 flex flex-col gap-2 border-dashed border-2 border-muted-foreground/30 hover:border-[#FF4081]/50 hover:bg-[#FF4081]/5"
                              onClick={() => onAddShot(scene.id, Math.max(0, sceneShots.length - 1))}
                              data-testid={`button-add-shot-${scene.id}`}
                            >
                              <Plus className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Add Shot</span>
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
                                <Badge variant="secondary" className="text-xs">
                                  #{shotIndex + 1}
                                </Badge>
                              </div>

                              {/* Timeline Track */}
                              <div className="flex-1 relative h-full">
                                <div
                                  className={`absolute h-full rounded-md border-2 flex items-center gap-2 px-2 cursor-pointer transition-colors ${
                                    isPartOfConnection 
                                      ? "bg-gradient-to-r from-[#FF4081]/20 to-[#FF6B4A]/10 border-[#FF4081]/50" 
                                      : "bg-muted/50 border-muted-foreground/20 hover:border-[#FF4081]/50"
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
                                    <div className="flex items-center gap-2">
                                      <p className="text-[10px] text-muted-foreground">
                                        {duration}s • {shot.shotType || "Medium Shot"}
                                      </p>
                                      {/* Speed Profile Badge (Commerce Mode) */}
                                      {shot.speedProfile && (
                                        <Badge 
                                          variant="outline" 
                                          className={cn(
                                            "text-[8px] px-1 py-0 h-4",
                                            shot.speedProfile === 'speed-ramp' && "bg-amber-500/20 border-amber-500/30 text-amber-300",
                                            shot.speedProfile === 'slow-motion' && "bg-blue-500/20 border-blue-500/30 text-blue-300",
                                            shot.speedProfile === 'kinetic' && "bg-red-500/20 border-red-500/30 text-red-300",
                                            shot.speedProfile === 'smooth' && "bg-[#FF4081]/20 border-[#FF4081]/30 text-[#FF5C8D]",
                                            shot.speedProfile === 'linear' && "bg-gray-500/20 border-gray-500/30 text-gray-300"
                                          )}
                                        >
                                          <Zap className="w-2 h-2 mr-0.5" />
                                          {shot.speedProfile === 'speed-ramp' ? 'Ramp' : 
                                           shot.speedProfile === 'slow-motion' ? 'Slow' :
                                           shot.speedProfile === 'kinetic' ? 'Kinetic' :
                                           shot.speedProfile === 'smooth' ? 'Smooth' : 'Linear'}
                                        </Badge>
                                      )}
                                      {/* Render Duration (Commerce Mode) */}
                                      {shot.renderDuration && shot.renderDuration !== shot.duration && (
                                        <span className="text-[9px] text-orange-400/70">
                                          ({shot.renderDuration}s)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Connection Indicator */}
                                  {isConnectedToNext && (
                                    <div 
                                      className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
                                      style={{
                                        background: 'linear-gradient(to right, #FF4081, #FF6B4A)'
                                      }}
                                      title="Connected shots - Cannot be changed"
                                    >
                                      <Link2 className="h-3 w-3 text-white" />
                                    </div>
                                  )}

                                  {/* Transition Badge (for non-connected shots) */}
                                  {!isConnectedToNext && shotIndex < sceneShots.length - 1 && (
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-background border shadow-sm text-[8px] font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors"
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
        <Dialog open={!!selectedShot} onOpenChange={(open) => {
          if (!open) {
            setSelectedShot(null);
            setActiveEditFrame("start");
            setPreviewVersions({});
            setCompareMode(false);
            setCompareVersions([]);
            setSyncedPlaying(false);
            setEditReferenceImages([]);
            setEditChange("");
            setActiveCategory(null);
            setSelectedCharacterId("");
            setIsEditing(false);
            setCameraRotation(0);
            setCameraVertical(0);
            setCameraZoom(0);
            setCameraWideAngle(false);
          }
        }}>
          <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 gap-0 bg-[hsl(240,10%,4%)] border-[hsl(240,5%,15%)]">
            <div className="flex flex-col h-full">
              
              {/* ═══════════════════════════════════════════════════════════════════
                  HEADER - Title, Frame Selector, Close
                  ═══════════════════════════════════════════════════════════════════ */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(240,5%,15%)] bg-[hsl(240,8%,6%)]">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Shot {selectedShot.shotNumber}</h2>
                    <p className="text-xs text-muted-foreground">Image Editor</p>
                  </div>
                </div>
                
                {/* Frame Selector (Start-End Mode) */}
                {narrativeMode === "start-end" && getPreviewedVersion(selectedShot) && (
                  <div className="flex items-center gap-1 bg-[hsl(240,8%,10%)] rounded-lg p-1 border border-[hsl(240,5%,20%)]">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveEditFrame("start")}
                      disabled={!getPreviewedVersion(selectedShot)?.startFrameUrl}
                      className={`h-8 px-4 rounded-md transition-all ${
                        activeEditFrame === "start" 
                          ? "bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] text-white shadow-lg" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      data-testid="button-select-start-frame"
                    >
                      Start Frame
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveEditFrame("end")}
                      disabled={!getPreviewedVersion(selectedShot)?.endFrameUrl}
                      className={`h-8 px-4 rounded-md transition-all ${
                        activeEditFrame === "end" 
                          ? "bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] text-white shadow-lg" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      data-testid="button-select-end-frame"
                    >
                      End Frame
                    </Button>
                  </div>
                )}
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════
                  MAIN CONTENT - Three Column Layout
                  ═══════════════════════════════════════════════════════════════════ */}
              <div className="flex flex-1 overflow-hidden">
                
                {/* ─────────────────────────────────────────────────────────────────
                    LEFT SIDEBAR - Tool Selection
                    ───────────────────────────────────────────────────────────────── */}
                <div className="w-16 bg-[hsl(240,8%,6%)] border-r border-[hsl(240,5%,15%)] flex flex-col items-center py-4 gap-1">
                  {[
                    { id: "prompt", icon: Edit, label: "Edit" },
                    { id: "clothes", icon: Shirt, label: "Clothes" },
                    { id: "expression", icon: Smile, label: "Face" },
                    { id: "figure", icon: User, label: "Pose" },
                    { id: "camera", icon: Camera, label: "Camera" },
                    { id: "effects", icon: Zap, label: "Effects" },
                    { id: "remove", icon: Eraser, label: "Remove" },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveCategory(activeCategory === tool.id ? null : tool.id as any)}
                      className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all group ${
                        activeCategory === tool.id
                          ? "bg-gradient-to-br from-[#FF4081]/30 to-[#FF6B4A]/30 text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      data-testid={`button-tool-${tool.id}`}
                    >
                      {activeCategory === tool.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-[#FF4081] to-[#FF6B4A] rounded-r" />
                      )}
                      <tool.icon className="h-5 w-5" />
                      <span className="text-[10px] mt-0.5 opacity-70">{tool.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* ─────────────────────────────────────────────────────────────────
                    CENTER - Image Canvas
                    ───────────────────────────────────────────────────────────────── */}
                <div className="flex-1 relative bg-[hsl(240,10%,4%)] flex items-center justify-center p-8 overflow-hidden">
                  {/* Subtle grid pattern background */}
                  <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                  }} />
                  
                  {(() => {
                    const version = getPreviewedVersion(selectedShot);
                    if (!version) {
                      return (
                        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                          <div className="w-32 h-32 rounded-2xl bg-[hsl(240,8%,8%)] flex items-center justify-center">
                            <ImageIcon className="h-16 w-16 opacity-50" />
                          </div>
                          <p className="text-lg font-medium">No image generated</p>
                          <p className="text-sm opacity-60">Generate an image first to start editing</p>
                        </div>
                      );
                    }
                    
                    // In edit image section, always show image (not video) even if video exists
                    let imageUrl = version.imageUrl;
                    if (narrativeMode === "start-end") {
                      imageUrl = activeEditFrame === "start" 
                        ? version.startFrameUrl 
                        : version.endFrameUrl;
                    }
                    imageUrl = imageUrl || version.imageUrl || version.startFrameUrl || version.endFrameUrl;
                    
                    if (imageUrl) {
                      return (
                        <div className="relative group">
                          <img
                            src={imageUrl}
                            alt="Shot"
                            className="max-w-full max-h-[calc(90vh-280px)] object-contain rounded-xl shadow-2xl"
                          />
                          {/* Zoom indicator on hover */}
                          <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
                        </div>
                      );
                    }
                    
                    return (
                      <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <ImageIcon className="h-24 w-24 opacity-50" />
                        <p className="text-lg">No image available</p>
                      </div>
                    );
                  })()}
                </div>
                
                {/* ─────────────────────────────────────────────────────────────────
                    RIGHT SIDEBAR - Context Panel (appears when tool selected)
                    ───────────────────────────────────────────────────────────────── */}
                <div className={`bg-[hsl(240,8%,6%)] border-l border-[hsl(240,5%,15%)] transition-all duration-300 overflow-hidden ${
                  activeCategory ? "w-72" : "w-0"
                }`}>
                  {activeCategory && (
                    <div className="w-72 p-4 h-full overflow-y-auto custom-scrollbar">
                      {/* Model Selector - Always visible when editing */}
                      <div className="mb-6">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">AI Model</Label>
                        <Select value={selectedEditingModel} onValueChange={setSelectedEditingModel}>
                          <SelectTrigger className="bg-[hsl(240,8%,10%)] border-[hsl(240,5%,20%)] h-9">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent className="bg-[hsl(240,8%,8%)] border-[hsl(240,5%,20%)]">
                            {editingModels.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="h-px bg-[hsl(240,5%,15%)] mb-6" />
                      
                      {/* Tool-specific controls */}
                      {activeCategory === "prompt" && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Edit Instructions</Label>
                            <textarea
                              value={editChange}
                              onChange={(e) => setEditChange(e.target.value)}
                              placeholder="Describe your changes...&#10;e.g., Make the sky darker and add dramatic lighting"
                              className="w-full h-32 bg-[hsl(240,8%,10%)] border border-[hsl(240,5%,20%)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4081]/50 placeholder:text-muted-foreground/50"
                              data-testid="input-edit-change"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Reference Images</Label>
                            <input
                              ref={editReferenceInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleEditReferenceUpload}
                            />
                            <button
                              onClick={() => editReferenceInputRef.current?.click()}
                              className="w-full h-20 border-2 border-dashed border-[hsl(240,5%,20%)] rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-[#FF4081]/50 hover:text-white transition-colors"
                            >
                              <Plus className="h-5 w-5" />
                              <span className="text-xs">Add Reference</span>
                            </button>
                            
                            {editReferenceImages.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {editReferenceImages.map((img) => (
                                  <div key={img.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[hsl(240,5%,20%)]">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => handleRemoveEditReference(img.id)}
                                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(activeCategory === "clothes" || activeCategory === "expression" || activeCategory === "figure") && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                              Character
                            </Label>
                            {(() => {
                              const version = getPreviewedVersion(selectedShot);
                              let frameCharacterIds: string[] | null = null;
                              
                              if (version) {
                                if (narrativeMode === "start-end") {
                                  if (activeEditFrame === "start") {
                                    frameCharacterIds = version.startFrameCharacters || version.characters || null;
                                  } else if (activeEditFrame === "end") {
                                    frameCharacterIds = version.endFrameCharacters || version.characters || null;
                                  }
                                } else {
                                  frameCharacterIds = version.characters || null;
                                }
                              }
                              
                              const availableCharacters = frameCharacterIds && frameCharacterIds.length > 0
                                ? characters.filter(char => frameCharacterIds!.includes(char.id))
                                : characters;
                              
                              return availableCharacters.length > 0 ? (
                                <div className="space-y-2">
                                  {availableCharacters.map((char) => (
                                    <button
                                      key={char.id}
                                      onClick={() => setSelectedCharacterId(char.id)}
                                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all overflow-hidden ${
                                        selectedCharacterId === char.id
                                          ? "border-[#FF4081] bg-[#FF4081]/10"
                                          : "border-[hsl(240,5%,20%)] hover:border-[hsl(240,5%,30%)]"
                                      }`}
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-[hsl(240,8%,10%)] flex items-center justify-center overflow-hidden shrink-0">
                                        {char.imageUrl ? (
                                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="h-5 w-5 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-medium truncate">{char.name}</p>
                                        {char.appearance && (
                                          <p className="text-xs text-muted-foreground truncate max-w-full">{char.appearance}</p>
                                        )}
                                      </div>
                                      {selectedCharacterId === char.id && (
                                        <Check className="h-4 w-4 text-[#FF4081] shrink-0" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No characters available</p>
                              );
                            })()}
                          </div>
                          
                          {selectedCharacterId && (
                            <>
                              <div className="h-px bg-[hsl(240,5%,15%)]" />
                              
                              {activeCategory === "clothes" && (
                                <div>
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">New Outfit</Label>
                                  <textarea
                                    value={editChange}
                                    onChange={(e) => setEditChange(e.target.value)}
                                    placeholder="Describe the new clothing...&#10;e.g., Blue denim jacket with white t-shirt"
                                    className="w-full h-24 bg-[hsl(240,8%,10%)] border border-[hsl(240,5%,20%)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4081]/50"
                                    data-testid="input-clothes-change"
                                  />
                                </div>
                              )}
                              
                              {activeCategory === "expression" && (
                                <div>
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Expression</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {["happy", "sad", "angry", "surprised", "neutral", "laughing"].map((expr) => (
                                      <button
                                        key={expr}
                                        onClick={() => setEditChange(expr)}
                                        className={`p-2 rounded-lg border text-sm capitalize transition-all ${
                                          editChange === expr
                                            ? "border-[#FF4081] bg-[#FF4081]/10 text-white"
                                            : "border-[hsl(240,5%,20%)] text-muted-foreground hover:text-white hover:border-[hsl(240,5%,30%)]"
                                        }`}
                                      >
                                        {expr}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {activeCategory === "figure" && (
                                <div>
                                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Pose / View</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {["front view", "back view", "side view", "close-up", "full body", "portrait"].map((view) => (
                                      <button
                                        key={view}
                                        onClick={() => setEditChange(view)}
                                        className={`p-2 rounded-lg border text-sm capitalize transition-all ${
                                          editChange === view
                                            ? "border-[#FF4081] bg-[#FF4081]/10 text-white"
                                            : "border-[hsl(240,5%,20%)] text-muted-foreground hover:text-white hover:border-[hsl(240,5%,30%)]"
                                        }`}
                                      >
                                        {view}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {activeCategory === "remove" && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Remove Object</Label>
                            <textarea
                              value={editChange}
                              onChange={(e) => setEditChange(e.target.value)}
                              placeholder="Describe what to remove...&#10;e.g., the tree in the background"
                              className="w-full h-24 bg-[hsl(240,8%,10%)] border border-[hsl(240,5%,20%)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4081]/50"
                              data-testid="input-remove-item"
                            />
                          </div>
                        </div>
                      )}

                      {activeCategory === "camera" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Camera Controls</Label>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-muted-foreground hover:text-white"
                              onClick={() => {
                                setCameraRotation(0);
                                setCameraVertical(0);
                                setCameraZoom(0);
                                setCameraWideAngle(false);
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Rotation</span>
                                <span className="text-xs font-mono text-muted-foreground">{cameraRotation}°</span>
                              </div>
                              <input
                                type="range"
                                min="-90"
                                max="90"
                                value={cameraRotation}
                                onChange={(e) => setCameraRotation(Number(e.target.value))}
                                className="w-full h-1.5 bg-[hsl(240,8%,15%)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF4081]"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Vertical</span>
                                <span className="text-xs font-mono text-muted-foreground">{cameraVertical > 0 ? `+${cameraVertical}` : cameraVertical}</span>
                              </div>
                              <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.1"
                                value={cameraVertical}
                                onChange={(e) => setCameraVertical(Number(e.target.value))}
                                className="w-full h-1.5 bg-[hsl(240,8%,15%)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF4081]"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Zoom</span>
                                <span className="text-xs font-mono text-muted-foreground">{cameraZoom > 0 ? `+${cameraZoom}` : cameraZoom}</span>
                              </div>
                              <input
                                type="range"
                                min="-5"
                                max="10"
                                value={cameraZoom}
                                onChange={(e) => setCameraZoom(Number(e.target.value))}
                                className="w-full h-1.5 bg-[hsl(240,8%,15%)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF4081]"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between py-2">
                              <span className="text-xs text-muted-foreground">Wide-Angle Lens</span>
                              <Switch
                                checked={cameraWideAngle}
                                onCheckedChange={setCameraWideAngle}
                                className="data-[state=checked]:bg-[#FF4081]"
                              />
                            </div>
                          </div>
                          
                          <div className="h-px bg-[hsl(240,5%,15%)]" />
                          
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Quick Presets</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {CAMERA_ANGLE_PRESETS.map((preset) => (
                                <Button
                                  key={preset.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCameraRotation(preset.rotation);
                                    setCameraVertical(preset.vertical);
                                    setCameraZoom(preset.zoom);
                                    setCameraWideAngle(preset.wideAngle || false);
                                  }}
                                  className="h-7 px-2 text-xs border-[hsl(240,5%,20%)] hover:border-[#FF4081]/50"
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
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Visual Effect</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "lightning", icon: "⚡", label: "Lightning" },
                                { id: "fire", icon: "🔥", label: "Fire" },
                                { id: "smoke", icon: "💨", label: "Smoke" },
                                { id: "fog", icon: "🌫️", label: "Fog" },
                                { id: "spotlight", icon: "💡", label: "Spotlight" },
                                { id: "rays", icon: "☀️", label: "Light Rays" },
                              ].map((effect) => (
                                <button
                                  key={effect.id}
                                  onClick={() => setEditChange(effect.id)}
                                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                    editChange === effect.id
                                      ? "border-[#FF4081] bg-[#FF4081]/10"
                                      : "border-[hsl(240,5%,20%)] hover:border-[hsl(240,5%,30%)]"
                                  }`}
                                >
                                  <span className="text-xl">{effect.icon}</span>
                                  <span className="text-xs text-muted-foreground">{effect.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════════
                  FOOTER - Version Strip + Actions
                  ═══════════════════════════════════════════════════════════════════ */}
              <div className="border-t border-[hsl(240,5%,15%)] bg-[hsl(240,8%,6%)] px-6 py-4">
                <div className="flex items-center gap-6">
                  
                  {/* Version Filmstrip */}
                  <div className="flex-1 flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1">
                    <span className="text-xs text-muted-foreground shrink-0">Versions</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const propVersions = shotVersions[selectedShot.id] || [];
                        const cachedVersions = localVersionCache[selectedShot.id] || [];
                        const allVersions = [...propVersions, ...cachedVersions.filter(cv => !propVersions.find(pv => pv.id === cv.id))];
                        return allVersions.sort((a, b) => a.versionNumber - b.versionNumber);
                      })().map((version) => {
                        const isActive = version.id === selectedShot.currentVersionId;
                        const isPreviewed = version.id === previewVersions[selectedShot.id];
                        const thumbnailUrl = version.imageUrl || version.startFrameUrl || version.endFrameUrl;
                        
                        return (
                          <div
                            key={version.id}
                            onClick={() => {
                              setPreviewVersions(prev => ({ ...prev, [selectedShot.id]: version.id }));
                              if (narrativeMode === "start-end") {
                                if (activeEditFrame === "start" && !version.startFrameUrl && version.endFrameUrl) {
                                  setActiveEditFrame("end");
                                } else if (activeEditFrame === "end" && !version.endFrameUrl && version.startFrameUrl) {
                                  setActiveEditFrame("start");
                                }
                              }
                            }}
                            className={`relative group shrink-0 w-20 cursor-pointer transition-all ${
                              isPreviewed || (isActive && !previewVersions[selectedShot.id])
                                ? "ring-2 ring-[#FF4081] rounded-lg scale-105"
                                : "hover:scale-105 opacity-70 hover:opacity-100"
                            }`}
                            data-testid={`version-thumbnail-${version.id}`}
                          >
                            <div className="aspect-video bg-[hsl(240,8%,10%)] rounded-lg overflow-hidden">
                              {thumbnailUrl ? (
                                <img src={thumbnailUrl} alt={`v${version.versionNumber}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Version Number Badge */}
                            <div className={`absolute -top-1 -left-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              isActive ? "bg-[#FF4081] text-white" : "bg-[hsl(240,8%,15%)] text-muted-foreground"
                            }`}>
                              v{version.versionNumber}
                            </div>
                            
                            {/* Delete Button */}
                            {!isActive && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDeleteVersion && window.confirm(`Delete version ${version.versionNumber}?`)) {
                                    onDeleteVersion(selectedShot.id, version.id);
                                  }
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Set as Active */}
                    {previewVersions[selectedShot.id] && previewVersions[selectedShot.id] !== selectedShot.currentVersionId && (
                      <Button
                        onClick={() => {
                          const previewedVersion = getPreviewedVersion(selectedShot);
                          if (previewedVersion && onSelectVersion) {
                            onSelectVersion(selectedShot.id, previewedVersion.id);
                            setPreviewVersions(prev => {
                              const { [selectedShot.id]: _, ...rest } = prev;
                              return rest;
                            });
                            toast({ title: "Version Activated", description: `v${previewedVersion.versionNumber} is now active` });
                          }
                        }}
                        variant="outline"
                        className="border-[#FF4081]/50 text-[#FF4081] hover:bg-[#FF4081]/10"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Set Active
                      </Button>
                    )}
                    
                    {/* Apply Edit / Regenerate */}
                    <Button
                      onClick={handleEditImage}
                      disabled={isEditing || !!(activeCategory && !editChange && activeCategory !== "camera")}
                      className="bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] hover:from-[#FF3070] to-[#FF5A3A] text-white font-semibold px-6 shadow-lg shadow-[#FF4081]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-apply-edit"
                    >
                      {isEditing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {activeCategory ? "Apply Edit" : "Regenerate"}
                        </>
                      )}
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
