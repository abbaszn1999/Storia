import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
import { Loader2, Sparkles, RefreshCw, Upload, Video, Image as ImageIcon, Edit, GripVertical, X, Volume2, Plus, Zap, Smile, User, Camera, Wand2, History, Settings2, ChevronRight, ChevronDown, Shirt, Eraser, Trash2, Play, Pause, Check, Link2, LayoutGrid, Clock, ArrowRight, Film, Star, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ReferenceImage } from "@/types/storyboard";
import type { NarrativeShotVersion } from "@/types/narrative-storyboard";
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
import { renderTextWithMentions } from "./mention-renderer";
import { TextareaWithMentions } from "./textarea-with-mentions";
import { apiRequest } from "@/lib/queryClient";
import { animateShot, checkVideoStatus } from "@/lib/api/narrative";

// Default models (fallback if API fails)
const DEFAULT_VIDEO_MODELS = [
  "Kling AI",
  "Runway Gen-4",
  "Luma Dream Machine",
  "Pika 2.0",
  "Veo 2",
  "Minimax",
];

// Comprehensive list of all available image models (matching world-cast.tsx)
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

const DEFAULT_IMAGE_MODELS = IMAGE_MODELS.map(m => m.name);

// VIDEO_MODEL_DURATIONS will be populated from API response
// This is a fallback for when API fails
const VIDEO_MODEL_DURATIONS: { [key: string]: number[] } = {
  "seedance-1.0-pro": [2, 4, 5, 6, 8, 10, 12],
  "seedance-1.5-pro": [4, 5, 6, 8, 10, 12],
  "klingai-2.1-pro": [5, 10],
  "klingai-2.5-turbo-pro": [5, 10],
  "kling-video-2.6-pro": [5, 10],
  "kling-video-o1": [5, 10],
  "veo-3.0": [4, 6, 8],
  "veo-3-fast": [4, 6, 8],
  "veo-3.1": [4, 6, 8],
  "veo-3.1-fast": [4, 6, 8],
  "pixverse-v5.5": [5, 8, 10],
  "hailuo-2.3": [6, 10],
  "sora-2-pro": [4, 8, 12],
  "ltx-2-pro": [6, 8, 10],
  "runway-gen4-turbo": [2, 3, 4, 5, 6, 7, 8, 9, 10],
  "alibaba-wan-2.6": [5, 10, 15],
};

/**
 * Find the nearest supported duration when video model changes
 * @param currentDuration - The current duration value
 * @param supportedDurations - Array of durations supported by the new model
 * @returns The nearest supported duration
 */
function findNearestDuration(currentDuration: number, supportedDurations: number[]): number {
  if (!supportedDurations || supportedDurations.length === 0) {
    return currentDuration; // Fallback to current if no supported durations
  }
  if (supportedDurations.includes(currentDuration)) {
    return currentDuration; // Current duration is supported
  }
  // Find the nearest duration
  return supportedDurations.reduce((nearest, duration) =>
    Math.abs(duration - currentDuration) < Math.abs(nearest - currentDuration) ? duration : nearest
  );
}

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

interface StoryboardEditorProps {
  videoId: string;
  narrativeMode: "image-reference" | "start-end" | "auto";
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: NarrativeShotVersion[] };
  referenceImages: ReferenceImage[];
  characters: Character[];
  locations?: Array<{ id: string; name: string; description?: string }>;
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  isCommerceMode?: boolean;
  isLogoMode?: boolean;
  isGeneratingPrompts?: boolean;
  // Video settings for generation
  imageModel?: string; // Default image model from step1Data
  videoModel?: string; // Default video model from step1Data
  videoResolution?: string;
  aspectRatio?: string;
  onGenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => Promise<void>;
  onRegenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => Promise<void>;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUpdateShotVersion?: (shotId: string, versionId: string, updates: Partial<NarrativeShotVersion>) => void;
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
  onGenerateSceneImages?: (sceneId: string) => Promise<void>;
  onSyncFromServer?: () => Promise<void>;
}

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  sceneModel: string | null;
  sceneImageModel: string | null;
  defaultVideoModel?: string | { id?: string; name?: string; modelId?: string; value?: string } | null;
  version: NarrativeShotVersion | null;
  nextShotVersion: NarrativeShotVersion | null;
  previousShotVersion: NarrativeShotVersion | null;
  referenceImage: ReferenceImage | null;
  isGenerating: boolean;
  isGeneratingStart?: boolean;
  isGeneratingEnd?: boolean;
  narrativeMode: "image-reference" | "start-end" | "auto";
  characters: Character[];
  locations?: Array<{ id: string; name: string; description?: string }>;
  isCommerceMode?: boolean; // For commerce mode, use shot.shotType instead of narrativeMode
  isConnectedToNext: boolean;
  showEndFrame: boolean;
  isPartOfConnection: boolean;
  isStartFrameInherited?: boolean;
  availableImageModels: Array<{ name: string; label: string; description: string }>;
  availableVideoModels: Array<{ name: string; label: string; description: string }>;
  onSelectShot: (shot: Shot, frame?: "start" | "end") => void;
  onExpandImage?: (imageUrl: string) => void;
  onGenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => Promise<void>;
  onRegenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => Promise<void>;
  onUpdatePrompt: (shotId: string, prompt: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUpdateShotVersion?: (shotId: string, versionId: string, updates: Partial<NarrativeShotVersion>) => void;
  onUploadReference: (shotId: string, file: File) => void;
  onDeleteReference: (shotId: string) => void;
  onUpdateVideoPrompt: (shotId: string, prompt: string) => void;
  onUpdateVideoDuration: (shotId: string, duration: number) => void;
  onDeleteShot?: (shotId: string) => void;
  onAnimateShot?: (shotId: string) => void;
  isGeneratingVideo?: boolean;
  shotsCount: number;
  shotVersions?: NarrativeShotVersion[];  // All versions for this shot (for thumbnails)
  onSelectVersion?: (shotId: string, versionId: string) => void;  // Select a version
}

// Helper function to parse prompt text and identify @ tags
interface TextSegment {
  text: string;
  isTag: boolean;
}

function parsePromptWithTags(prompt: string): TextSegment[] {
  if (!prompt) return [];
  
  const segments: TextSegment[] = [];
  // Regex to match @ tags: @ followed by letters, underscores, and numbers
  const tagRegex = /@[A-Za-z_][A-Za-z0-9_]*/g;
  let lastIndex = 0;
  let match;
  
  while ((match = tagRegex.exec(prompt)) !== null) {
    // Add text before the tag
    if (match.index > lastIndex) {
      segments.push({
        text: prompt.substring(lastIndex, match.index),
        isTag: false,
      });
    }
    
    // Add the tag
    segments.push({
      text: match[0],
      isTag: true,
    });
    
    lastIndex = tagRegex.lastIndex;
  }
  
  // Add remaining text after the last tag
  if (lastIndex < prompt.length) {
    segments.push({
      text: prompt.substring(lastIndex),
      isTag: false,
    });
  }
  
  return segments;
}

// Styled prompt display component for commerce mode
interface StyledPromptDisplayProps {
  prompt: string;
  isInherited: boolean;
  isEditable: boolean;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

function StyledPromptDisplay({
  prompt,
  isInherited,
  isEditable,
  placeholder = "Describe the shot...",
  className = "",
  onChange,
  onBlur,
}: StyledPromptDisplayProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const segments = parsePromptWithTags(prompt);

  // For read-only prompts, render as a simple div with styled spans
  if (isInherited || !isEditable) {
    return (
      <div
        className={`min-h-[120px] text-sm resize-none bg-white/[0.02] border-white/[0.06] rounded-md p-3 whitespace-pre-wrap custom-scrollbar overflow-y-auto ${
          isInherited ? "opacity-70 cursor-not-allowed border-cyan-500/30" : ""
        } ${className}`}
      >
        {segments.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          segments.map((segment, index) => {
            if (segment.isTag) {
              return (
                <span key={index} className="font-bold text-blue-500">
                  {segment.text}
                </span>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })
        )}
      </div>
    );
  }

  // For editable prompts, use contentEditable div with styled rendering
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastPrompt, setLastPrompt] = useState(prompt);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isUpdating) return;
    
    const text = e.currentTarget.textContent || "";
    onChange?.(text);
    
    // Debounce re-styling to avoid cursor issues while typing
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (contentEditableRef.current) {
        const currentText = contentEditableRef.current.textContent || "";
        if (currentText !== text) {
          // Text might have changed, use the latest
          const latestText = contentEditableRef.current.textContent || "";
          const newSegments = parsePromptWithTags(latestText);
          const html = newSegments
            .map((segment) => {
              if (segment.isTag) {
                return `<span class="font-bold text-blue-500">${segment.text}</span>`;
              }
              return segment.text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>");
            })
            .join("");
          
          // Save cursor position
          const selection = window.getSelection();
          let cursorOffset = 0;
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(contentEditableRef.current);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorOffset = preCaretRange.toString().length;
          }
          
          contentEditableRef.current.innerHTML = html || "";
          
          // Restore cursor
          if (selection && cursorOffset > 0 && contentEditableRef.current) {
            try {
              const walker = document.createTreeWalker(
                contentEditableRef.current,
                NodeFilter.SHOW_TEXT,
                null
              );
              let currentOffset = 0;
              let targetNode: Node | null = null;
              let targetOffset = 0;

              while (walker.nextNode()) {
                const node = walker.currentNode;
                const nodeLength = node.textContent?.length || 0;
                if (currentOffset + nodeLength >= cursorOffset) {
                  targetNode = node;
                  targetOffset = cursorOffset - currentOffset;
                  break;
                }
                currentOffset += nodeLength;
              }

              if (targetNode) {
                const newRange = document.createRange();
                const safeOffset = Math.min(targetOffset, targetNode.textContent?.length || 0);
                newRange.setStart(targetNode, safeOffset);
                newRange.setEnd(targetNode, safeOffset);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            } catch (err) {
              // Ignore cursor restoration errors
            }
          }
        }
      }
    }, 300); // 300ms debounce
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow all keys for normal editing
    if (e.key === "Escape") {
      contentEditableRef.current?.blur();
    }
  };

  // Re-render styled content when prompt changes externally
  useEffect(() => {
    if (contentEditableRef.current && prompt !== lastPrompt && !isUpdating) {
      setIsUpdating(true);
      
      // Save cursor position
      const selection = window.getSelection();
      let cursorOffset = 0;
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentEditableRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorOffset = preCaretRange.toString().length;
      }

      // Rebuild styled content
      const newSegments = parsePromptWithTags(prompt);
      const html = newSegments
        .map((segment) => {
          if (segment.isTag) {
            return `<span class="font-bold text-blue-500">${segment.text}</span>`;
          }
          // Escape HTML in regular text
          return segment.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
        })
        .join("");

      contentEditableRef.current.innerHTML = html || "";

      // Restore cursor position
      if (selection && cursorOffset > 0 && contentEditableRef.current) {
        try {
          const walker = document.createTreeWalker(
            contentEditableRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          let currentOffset = 0;
          let targetNode: Node | null = null;
          let targetOffset = 0;

          while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.textContent?.length || 0;
            if (currentOffset + nodeLength >= cursorOffset) {
              targetNode = node;
              targetOffset = cursorOffset - currentOffset;
              break;
            }
            currentOffset += nodeLength;
          }

          if (targetNode) {
            const newRange = document.createRange();
            const safeOffset = Math.min(targetOffset, targetNode.textContent?.length || 0);
            newRange.setStart(targetNode, safeOffset);
            newRange.setEnd(targetNode, safeOffset);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } catch (err) {
          // Ignore cursor restoration errors
        }
      }

      setLastPrompt(prompt);
      setIsUpdating(false);
    }
  }, [prompt, lastPrompt, isUpdating]);

  // Initial render
  useEffect(() => {
    if (contentEditableRef.current && !contentEditableRef.current.innerHTML) {
      const newSegments = parsePromptWithTags(prompt);
      const html = newSegments
        .map((segment) => {
          if (segment.isTag) {
            return `<span class="font-bold text-blue-500">${segment.text}</span>`;
          }
          return segment.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>");
        })
        .join("");
      contentEditableRef.current.innerHTML = html || "";
      setLastPrompt(prompt);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Add placeholder styling
  const showPlaceholder = !prompt;

  return (
    <div className="relative">
      <div
        ref={contentEditableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className={`min-h-[120px] text-sm resize-none bg-white/[0.02] border-white/[0.06] rounded-md p-3 focus:border-purple-500/50 focus:outline-none whitespace-pre-wrap custom-scrollbar overflow-y-auto ${className}`}
      />
      {showPlaceholder && (
        <div className="absolute top-3 left-3 text-xs text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}

function SortableShotCard({ 
  shot, 
  shotIndex,
  sceneModel,
  sceneImageModel,
  defaultVideoModel,
  version,
  nextShotVersion,
  previousShotVersion,
  referenceImage,
  isGenerating,
  isGeneratingStart = false,
  isGeneratingEnd = false,
  narrativeMode,
  characters,
  locations = [],
  isCommerceMode = false,
  isConnectedToNext,
  showEndFrame,
  isPartOfConnection,
  isStartFrameInherited = false,
  availableImageModels,
  availableVideoModels,
  onSelectShot,
  onExpandImage,
  onGenerateShot,
  onRegenerateShot,
  onUpdatePrompt,
  onUpdateShot,
  onUpdateShotVersion,
  onUploadReference,
  onDeleteReference,
  onUpdateVideoPrompt,
  onUpdateVideoDuration,
  onDeleteShot,
  onAnimateShot,
  isGeneratingVideo = false,
  shotsCount,
  shotVersions = [],
  onSelectVersion,
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

  // Track active tab (image or video)
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");

  const { toast } = useToast();
  
  const [activeFrame, setActiveFrame] = useState<"start" | "end">("start");
  const [advancedImageOpen, setAdvancedImageOpen] = useState(false);
  const [advancedVideoOpen, setAdvancedVideoOpen] = useState(false);

  // Helper to extract model ID string (handle both string and object formats)
  const getModelId = (model: any): string | null => {
    if (!model) return null;
    if (typeof model === "string") return model;
    if (typeof model === "object") {
      if (model.id) return model.id;
      if (model.name) return model.name;
      if (model.modelId) return model.modelId;
      if (model.value) return model.value;
    }
    return null;
  };

  // Resolve effective video model with priority: shot → scene → default
  const getEffectiveVideoModelId = (): string | null => {
    if (shot.videoModel) {
      return getModelId(shot.videoModel);
    } else if (sceneModel) {
      return getModelId(sceneModel);
    } else if (defaultVideoModel) {
      return getModelId(defaultVideoModel);
    }
    return null;
  };
  const [cameraPopoverOpen, setCameraPopoverOpen] = useState(false);

  // ✨ For commerce mode, use shot.shotType instead of global narrativeMode
  // In commerce mode, each shot can have its own type (image-ref or start-end)
  // ✨ For auto mode, use shot.frameMode if available, otherwise default to image-reference
  const effectiveMode = isCommerceMode 
    ? (shot.shotType === 'start-end' ? 'start-end' : 'image-reference')
    : narrativeMode === "auto"
    ? (shot.frameMode || "image-reference")
    : narrativeMode;

  // Get prompt based on active frame, effective mode, and version
  const getPromptFromVersion = (): string => {
    if (!version) return shot.description || "";
    
    if (effectiveMode === "image-reference") {
      // Condition 1 or 4: Use imagePrompt (or null if inherited)
      return version.imagePrompt || "";
    } else {
      // Condition 2 or 3: Use start_frame or end_frame prompt
      if (activeFrame === "start") {
        // For Condition 3, start frame is inherited (null)
        return version.startFramePrompt || "";
      } else {
        return version.endFramePrompt || "";
      }
    }
  };
  
  const [localPrompt, setLocalPrompt] = useState(getPromptFromVersion());
  const lastSyncedPromptRef = useRef<string>(getPromptFromVersion());
  
  // Local state for video prompt to avoid race conditions
  const [localVideoPrompt, setLocalVideoPrompt] = useState(version?.videoPrompt || "");
  const lastSyncedVideoPromptRef = useRef<string>(version?.videoPrompt || "");

  // Update localPrompt when activeFrame, version, effectiveMode changes
  // But preserve user edits - only sync if localPrompt matches what we last synced
  useEffect(() => {
    const versionPrompt = getPromptFromVersion();
    
    // Only update localPrompt if:
    // 1. The version prompt changed from what we last synced (external update)
    // 2. AND localPrompt matches what we last synced (no unsaved user edits)
    if (versionPrompt !== lastSyncedPromptRef.current) {
      if (localPrompt === lastSyncedPromptRef.current) {
        // No unsaved edits - safe to sync with new version value
        setLocalPrompt(versionPrompt);
        lastSyncedPromptRef.current = versionPrompt;
      }
      // If localPrompt !== lastSyncedPromptRef.current, user has edits - preserve them
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFrame, version, effectiveMode]);
  
  // Update localVideoPrompt when version changes
  useEffect(() => {
    const versionVideoPrompt = version?.videoPrompt || "";
    if (versionVideoPrompt !== lastSyncedVideoPromptRef.current) {
      if (localVideoPrompt === lastSyncedVideoPromptRef.current) {
        setLocalVideoPrompt(versionVideoPrompt);
        lastSyncedVideoPromptRef.current = versionVideoPrompt;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handlePromptBlur = () => {
    // Only update if prompt actually changed
    const currentPrompt = getPromptFromVersion();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyboard-editor.tsx:623',message:'handlePromptBlur called',data:{shotId:shot.id,localPrompt:localPrompt?.substring(0,50),currentPrompt:currentPrompt?.substring(0,50),willUpdate:localPrompt!==currentPrompt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'V'})}).catch(()=>{});
    // #endregion
    if (localPrompt !== currentPrompt) {
      onUpdatePrompt(shot.id, localPrompt);
      // Don't update lastSyncedPromptRef here - wait for version prop to update
      // The useEffect will update it when the version prop reflects the saved value
    }
  };
  
  // Sync the ref when version prop updates to match our saved value
  useEffect(() => {
    const versionPrompt = getPromptFromVersion();
    // If version now matches what we have in localPrompt, update the ref
    if (versionPrompt === localPrompt && versionPrompt !== lastSyncedPromptRef.current) {
      lastSyncedPromptRef.current = versionPrompt;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, localPrompt]);

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
  // For start frame: check if it exists in current version OR if it's inherited from previous shot's end frame
  const hasStartFrame = version?.startFrameUrl || version?.imageUrl || (isStartFrameInherited && (previousShotVersion?.endFrameUrl || previousShotVersion?.imageUrl));
  const hasEndFrame = version?.endFrameUrl;
  const hasNextShotStartFrame = nextShotVersion?.startFrameUrl || nextShotVersion?.imageUrl;
  
  // Check if start frame exists (required prerequisite for generating end frame)
  // hasStartFrame already accounts for inherited frames, so we can use it directly
  const startFrameExists = hasStartFrame;
  
  // Enable End tab for standalone/last shots OR connected shots (which will show next shot's start)
  const shouldShowEndTab = effectiveMode === "start-end" && (showEndFrame || isConnectedToNext);
  
  // Check if current frame is inherited (Condition 3 & 4)
  const isInherited = (() => {
    if (effectiveMode === "image-reference" && version?.imagePrompt === null && isPartOfConnection) {
      return true; // Condition 4: Image is inherited
    }
    if (effectiveMode === "start-end" && activeFrame === "start" && isStartFrameInherited) {
      return true; // Condition 3: Start frame is inherited
    }
    return false;
  })();
  
  // Calculate display image URL with proper fallbacks
  let displayImageUrl: string | null | undefined;
  let actualFrameShown: "start" | "end" | null = null;
  
  if (effectiveMode === "start-end") {
    if (activeFrame === "start") {
      // If start frame is inherited, show previous shot's end frame
      if (isStartFrameInherited && previousShotVersion) {
        displayImageUrl = previousShotVersion.endFrameUrl || previousShotVersion.imageUrl;
      } else {
        displayImageUrl = version?.startFrameUrl || version?.imageUrl;
      }
      actualFrameShown = "start";
      } else {
        // End frame requested
        if (isConnectedToNext && hasNextShotStartFrame) {
          // For connected shots, show the next shot's start frame as this shot's end frame
          displayImageUrl = hasNextShotStartFrame;
          actualFrameShown = "end";
        } else if (hasEndFrame) {
          // Only show end frame if it actually exists
          const endFrameUrl = version?.endFrameUrl;
          
          // Defensive check: ensure end frame URL is different from start frame URL
          if (endFrameUrl && endFrameUrl === version?.startFrameUrl) {
            console.warn('[storyboard-editor] End frame URL matches start frame URL (same image saved to both), showing placeholder', {
              shotId: shot.id,
              startFrameUrl: version?.startFrameUrl,
              endFrameUrl: version?.endFrameUrl,
            });
            displayImageUrl = null;
          } else {
            displayImageUrl = endFrameUrl;
          }
          actualFrameShown = "end";
        } else {
          // No end frame yet - explicitly set to null to show placeholder
          // Do NOT fall back to start frame URL
          displayImageUrl = null;
          actualFrameShown = "end";
        }
      }
  } else {
    displayImageUrl = version?.imageUrl;
    actualFrameShown = null;
  }

  // Determine if the current frame has an image (for button state)
  // Similar to ambient visual mode: show "Generate Image" if no image, "Edit Image" + "Regenerate" if image exists
  // For start frame: if inherited, it's considered as "having an image" (should show Edit/Regenerate, not Generate)
  const currentFrameHasImage = effectiveMode === "start-end"
    ? (activeFrame === "start" 
        ? (hasStartFrame || isStartFrameInherited)  // Start frame exists OR is inherited
        : (hasEndFrame || (isConnectedToNext && hasNextShotStartFrame)))  // End frame exists OR connected to next
    : !!displayImageUrl;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="shrink-0 w-80 overflow-visible bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30 transition-all"
      data-testid={`card-shot-${shot.id}`}
    >
      <div className="aspect-video bg-muted relative group rounded-t-lg overflow-hidden">
        {/* Start/End Frame Tab Selector (Start-End Mode Only - Image tab) */}
        {effectiveMode === "start-end" && activeTab === "image" && (
          <div className="absolute top-2 left-2 flex gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 z-10">
            <button
              onClick={() => setActiveFrame("start")}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors relative ${
                activeFrame === "start"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-start-frame-${shot.id}`}
            >
              Start
              {/* Show connection indicator on Start button if this shot's start frame is inherited from previous */}
              {effectiveMode === "start-end" && isStartFrameInherited && (
                <span className="ml-1 text-[10px]">↻</span>
              )}
            </button>
            <button
              onClick={() => {
                if (!shouldShowEndTab) return;
                setActiveFrame("end");
              }}
              disabled={!shouldShowEndTab}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeFrame === "end"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : shouldShowEndTab
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/50 cursor-not-allowed"
              }`}
              data-testid={`button-end-frame-${shot.id}`}
              title={
                isConnectedToNext 
                  ? "End frame synced with next shot's start frame" 
                  : shouldShowEndTab 
                  ? "View end frame" 
                  : ""
              }
            >
              End
            </button>
          </div>
        )}
        
        {activeTab === "image" ? (
          // Image tab: show image or placeholder
          displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={`Shot ${shotIndex + 1}${actualFrameShown ? ` - ${actualFrameShown} frame` : ""}`}
              className="w-full h-full object-cover"
            />
          ) : (() => {
            // Check if the specific active frame is generating
            const isFrameGenerating = effectiveMode === "start-end" && activeFrame
              ? (activeFrame === "start" ? isGeneratingStart : isGeneratingEnd)
              : isGenerating;
            
            return isFrameGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 gap-2">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              {effectiveMode === "start-end" && activeFrame === "end" && (
                <p className="text-xs text-muted-foreground">End frame not generated</p>
              )}
            </div>
            );
          })()
        ) : (
          // Video tab: show video or placeholder
          version?.videoUrl ? (
            <video
              src={version.videoUrl}
              className="w-full h-full object-cover"
              controls
              muted
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 gap-2">
              <Video className="h-12 w-12 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Video not generated</p>
            </div>
          )
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
          
          {/* Version Thumbnails - Show last 3 regenerated versions (exclude edit versions) */}
          {(() => {
            // Filter out edit versions (those with editedFromVersionId) - only show regenerated versions
            const regeneratedVersions = shotVersions.filter(v => !(v as any).editedFromVersionId);
            
            if (regeneratedVersions.length <= 1) return null;
            
            return (
              <div className="flex items-center gap-0.5 ml-1">
                {regeneratedVersions
                  .slice(-3) // Get last 3 regenerated versions
                  .map((v, idx) => {
                    const thumbUrl = v.imageUrl || v.startFrameUrl || v.endFrameUrl;
                    const isActive = v.id === version?.id;
                    
                    if (!thumbUrl) return null;
                    
                    return (
                      <button
                        key={v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectVersion && !isActive) {
                            onSelectVersion(shot.id, v.id);
                          }
                        }}
                        className={cn(
                          "w-6 h-6 rounded overflow-hidden border-2 transition-all hover:scale-110",
                          isActive 
                            ? "border-purple-500 ring-1 ring-purple-500/50" 
                            : "border-white/20 hover:border-white/50 opacity-70 hover:opacity-100"
                        )}
                        title={`Version ${v.versionNumber || idx + 1}${isActive ? ' (active)' : ''}`}
                      >
                        <img 
                          src={thumbUrl} 
                          alt={`v${v.versionNumber || idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
              </div>
            );
          })()}
          
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
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {displayImageUrl && activeTab === "image" && (
            <>
              {onExpandImage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 bg-background/80 text-muted-foreground hover:text-purple-400"
                  title="View full image"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandImage(displayImageUrl);
                  }}
                  data-testid={`button-expand-image-${shot.id}`}
                >
                  <Maximize className="h-3 w-3" />
                </Button>
              )}
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
            </>
          )}
          {onDeleteShot && (
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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "image" | "video")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3 bg-white/[0.02] border border-white/[0.06]">
            <TabsTrigger value="image" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white" data-testid={`tab-image-${shot.id}`}>
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white" data-testid={`tab-video-${shot.id}`}>
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-3 mt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Prompt</Label>
                {/* Show inheritance indicator for inherited prompts */}
                {isInherited && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <Link2 className="h-3 w-3" />
                    <span>Inherited</span>
                  </div>
                )}
              </div>
              {isCommerceMode ? (
                <StyledPromptDisplay
                  prompt={localPrompt}
                  isInherited={isInherited}
                  isEditable={!isInherited}
                  placeholder={isInherited ? "Inherited from previous shot" : "Describe the shot..."}
                  onChange={(value) => {
                    if (!isInherited) {
                      setLocalPrompt(value);
                    }
                  }}
                  onBlur={handlePromptBlur}
                  className={isInherited ? "opacity-70 cursor-not-allowed border-cyan-500/30" : ""}
                />
              ) : (
                <TextareaWithMentions
                  value={localPrompt}
                  onChange={(newValue) => {
                    if (!isInherited) {
                      setLocalPrompt(newValue);
                    }
                  }}
                  onBlur={handlePromptBlur}
                  onScroll={(e) => {
                    const overlay = e.currentTarget.nextElementSibling as HTMLElement;
                    if (overlay) {
                      overlay.scrollTop = e.currentTarget.scrollTop;
                      overlay.scrollLeft = e.currentTarget.scrollLeft;
                    }
                  }}
                  characters={characters.map(c => ({ id: c.id, name: c.name, description: c.description ?? undefined }))}
                  locations={locations}
                  readOnly={isInherited}
                  placeholder={isInherited ? "Inherited from previous shot" : "Describe the shot... (type @ to mention characters or locations)"}
                  className={`min-h-[120px] text-sm resize-none bg-white/[0.02] border-white/[0.06] focus:border-purple-500/50 custom-scrollbar ${
                    isInherited ? "opacity-70 cursor-not-allowed border-cyan-500/30" : ""
                  }`}
                  showMentionOverlay={!isInherited}
                  data-testid={`input-prompt-${shot.id}`}
                />
              )}
            </div>

            <Collapsible 
              open={advancedImageOpen && !isInherited} 
              onOpenChange={(open) => {
                if (!isInherited) {
                  setAdvancedImageOpen(open);
                }
              }}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-between p-2 h-auto text-xs font-medium ${
                    isInherited ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  data-testid={`button-toggle-advanced-image-${shot.id}`}
                  disabled={isInherited}
                  title={isInherited ? "Advanced settings disabled for inherited frames" : undefined}
                  onClick={(e) => {
                    if (isInherited) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <span className="text-muted-foreground">Advanced Settings</span>
                  {advancedImageOpen && !isInherited ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              {!isInherited && (
                <CollapsibleContent className="space-y-3 mt-2">
                {/* Per-Frame Settings (Start-End Mode) or Shared Settings (Image-Reference Mode) */}
                {effectiveMode === "start-end" && version ? (
                  <>
                    {/* Per-Frame Image Model */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {activeFrame === "start" ? "Start Frame" : "End Frame"} Image Model
                      </Label>
                      <Select
                        value={
                          activeFrame === "start"
                            ? (version.startFrameImageModel || shot.imageModel || "scene-default")
                            : (version.endFrameImageModel || shot.imageModel || "scene-default")
                        }
                        onValueChange={(value) => {
                          if (onUpdateShotVersion) {
                            const updateValue = value === "scene-default" ? null : value;
                            onUpdateShotVersion(shot.id, version.id, {
                              ...(activeFrame === "start"
                                ? { startFrameImageModel: updateValue }
                                : { endFrameImageModel: updateValue }),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-${activeFrame}-image-model-${shot.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/[0.06]">
                          <SelectItem value="scene-default">
                            Scene Default {sceneImageModel ? `(${sceneImageModel})` : ""}
                          </SelectItem>
                          {availableImageModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Per-Frame Reference Image */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {activeFrame === "start" ? "Start Frame" : "End Frame"} Reference Image
                      </Label>
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
                            data-testid={`button-delete-${activeFrame}-reference-${shot.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Input
                            id={`reference-upload-${shot.id}-${activeFrame}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                            data-testid={`input-${activeFrame}-reference-${shot.id}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById(`reference-upload-${shot.id}-${activeFrame}`)?.click()}
                            data-testid={`button-upload-${activeFrame}-reference-${shot.id}`}
                          >
                            <Upload className="mr-2 h-3 w-3" />
                            Upload Reference
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Per-Frame Shot Type */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {activeFrame === "start" ? "Start Frame" : "End Frame"} Shot Type
                      </Label>
                      <Select
                        value={
                          activeFrame === "start"
                            ? (version.startFrameShotType || shot.shotType)
                            : (version.endFrameShotType || shot.shotType)
                        }
                        onValueChange={(value) => {
                          if (onUpdateShotVersion) {
                            onUpdateShotVersion(shot.id, version.id, {
                              ...(activeFrame === "start"
                                ? { startFrameShotType: value }
                                : { endFrameShotType: value }),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-${activeFrame}-shot-type-${shot.id}`}>
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
                  </>
                ) : (
                  <>
                    {/* Shared Settings (Image-Reference Mode) */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Image Model</Label>
                      <Select
                        value={shot.imageModel || "scene-default"}
                        onValueChange={(value) => onUpdateShot(shot.id, { imageModel: value === "scene-default" ? null : value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-image-model-${shot.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/[0.06]">
                          <SelectItem value="scene-default">
                            Scene Default {sceneImageModel ? `(${sceneImageModel})` : ""}
                          </SelectItem>
                          {availableImageModels.map((model) => (
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
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-shot-type-${shot.id}`}>
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
                  </>
                )}

                {/* Per-Frame Advanced Settings (Start-End Mode Only) */}
                {effectiveMode === "start-end" && version && (
                  <>
                    <div className="pt-2 border-t border-white/10">
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                        {activeFrame === "start" ? "Start Frame" : "End Frame"} Advanced Settings
                      </Label>
                      
                      {/* Negative Prompt */}
                      <div className="space-y-1 mb-3">
                        <Label className="text-xs text-muted-foreground">Negative Prompt</Label>
                        <Textarea
                          value={
                            activeFrame === "start"
                              ? (version?.startFrameNegativePrompt || "")
                              : (version?.endFrameNegativePrompt || "")
                          }
                          onChange={(e) => {
                            if (onUpdateShotVersion) {
                              onUpdateShotVersion(shot.id, version?.id || "", {
                                ...(activeFrame === "start"
                                  ? { startFrameNegativePrompt: e.target.value }
                                  : { endFrameNegativePrompt: e.target.value }),
                              });
                            }
                          }}
                          placeholder="Elements to avoid in generation..."
                          className="h-16 text-xs bg-white/[0.02] border-white/[0.06] resize-none"
                          data-testid={`textarea-${activeFrame}-negative-prompt-${shot.id}`}
                        />
                      </div>
                    </div>
                  </>
                )}
                </CollapsibleContent>
              )}
            </Collapsible>

            <div className="flex gap-2">
              {currentFrameHasImage ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5"
                    onClick={() => {
                      // Pass the current activeFrame when opening edit dialog (for start-end mode)
                      if (effectiveMode === "start-end" && activeFrame) {
                        onSelectShot(shot, activeFrame);
                      } else {
                        onSelectShot(shot);
                      }
                    }}
                    disabled={(() => {
                      // Check if the specific active frame is generating
                      if (effectiveMode === "start-end" && activeFrame) {
                        return activeFrame === "start" ? isGeneratingStart : isGeneratingEnd;
                      }
                      return isGenerating;
                    })()}
                    data-testid={`button-edit-image-${shot.id}`}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit Image
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      // Pass current local prompts to save before generating
                      const prompts = { imagePrompt: localPrompt, videoPrompt: localVideoPrompt };
                      
                      // Determine which frame is being regenerated (for start-end mode)
                      const frameType: 'start' | 'end' | undefined = effectiveMode === "start-end" ? activeFrame : undefined;
                      
                      // Always regenerate since image exists
                      (onRegenerateShot as any)(shot.id, prompts, frameType);
                    }}
                    disabled={(() => {
                      // Check if the specific active frame is generating
                      if (effectiveMode === "start-end" && activeFrame) {
                        const isFrameGenerating = activeFrame === "start" ? isGeneratingStart : isGeneratingEnd;
                        // For start frame: disable if it's inherited (should not be regenerated)
                        if (activeFrame === "start" && isStartFrameInherited) {
                          return true; // Disable if start frame is inherited
                        }
                        // For end frame regeneration, also check if start frame exists (required prerequisite)
                        if (activeFrame === "end" && !startFrameExists) {
                          return true; // Disable if start frame doesn't exist
                        }
                        return isFrameGenerating;
                      }
                      return isGenerating;
                    })()}
                    title={
                      effectiveMode === "start-end" && activeFrame === "start" && isStartFrameInherited
                        ? "Start frame is inherited from previous shot"
                        : effectiveMode === "start-end" && activeFrame === "end" && !startFrameExists
                        ? "Start frame must be generated first"
                        : undefined
                    }
                    data-testid={`button-regenerate-${shot.id}`}
                  >
                    {(() => {
                      // Check if the specific active frame is generating
                      const isFrameGenerating = effectiveMode === "start-end" && activeFrame
                        ? (activeFrame === "start" ? isGeneratingStart : isGeneratingEnd)
                        : isGenerating;
                      
                      return isFrameGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Re-generate
                        </>
                      );
                    })()}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    // Pass current local prompts to save before generating
                    const prompts = { imagePrompt: localPrompt, videoPrompt: localVideoPrompt };
                    
                    // Determine which frame is being generated (for start-end mode)
                    const frameType: 'start' | 'end' | undefined = effectiveMode === "start-end" ? activeFrame : undefined;
                    
                    // Generate new image
                    (onGenerateShot as any)(shot.id, prompts, frameType);
                  }}
                  disabled={(() => {
                    // Check if the specific active frame is generating
                    if (effectiveMode === "start-end" && activeFrame) {
                      const isFrameGenerating = activeFrame === "start" ? isGeneratingStart : isGeneratingEnd;
                      // For start frame: disable if it's inherited (should not be generated)
                      if (activeFrame === "start" && isStartFrameInherited) {
                        return true; // Disable if start frame is inherited
                      }
                      // For end frame, also check if start frame exists (required prerequisite)
                      if (activeFrame === "end" && !startFrameExists) {
                        return true; // Disable if start frame doesn't exist
                      }
                      return isFrameGenerating;
                    }
                    return isGenerating;
                  })()}
                  title={
                    effectiveMode === "start-end" && activeFrame === "start" && isStartFrameInherited
                      ? "Start frame is inherited from previous shot"
                      : effectiveMode === "start-end" && activeFrame === "end" && !startFrameExists
                      ? "Start frame must be generated first"
                      : undefined
                  }
                  data-testid={`button-generate-image-${shot.id}`}
                >
                  {(() => {
                    // Check if the specific active frame is generating
                    const isFrameGenerating = effectiveMode === "start-end" && activeFrame
                      ? (activeFrame === "start" ? isGeneratingStart : isGeneratingEnd)
                      : isGenerating;
                    
                    return isFrameGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3" />
                        Generate Image
                      </>
                    );
                  })()}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-0">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Video Prompt</Label>
              <TextareaWithMentions
                value={localVideoPrompt}
                onChange={(newValue) => setLocalVideoPrompt(newValue)}
                characters={characters.map(c => ({ id: c.id, name: c.name, description: c.description ?? undefined }))}
                locations={locations}
                placeholder="Describe the motion and action for this shot... (type @ to mention characters or locations)"
                className="min-h-[120px] text-sm resize-none bg-white/[0.02] border-white/[0.06] focus:border-purple-500/50 custom-scrollbar"
                showMentionOverlay={true}
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
                    onValueChange={(value) => {
                      const newVideoModel = value === "scene-default" ? null : value;
                      onUpdateShot(shot.id, { videoModel: newVideoModel });
                      
                      // Auto-adjust duration when video model changes
                      const currentDuration = version?.videoDuration;
                      if (currentDuration) {
                        // Determine the new effective model ID
                        const newEffectiveModelId = newVideoModel 
                          ? getModelId(newVideoModel)
                          : sceneModel 
                            ? getModelId(sceneModel) 
                            : defaultVideoModel 
                              ? getModelId(defaultVideoModel) 
                              : null;
                        
                        if (newEffectiveModelId && VIDEO_MODEL_DURATIONS[newEffectiveModelId]) {
                          const supportedDurations = VIDEO_MODEL_DURATIONS[newEffectiveModelId];
                          if (!supportedDurations.includes(currentDuration)) {
                            const nearestDuration = findNearestDuration(currentDuration, supportedDurations);
                            onUpdateVideoDuration(shot.id, nearestDuration);
                            toast({
                              title: "Duration Adjusted",
                              description: `Duration changed from ${currentDuration}s to ${nearestDuration}s (supported by ${newEffectiveModelId})`,
                            });
                          }
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-video-model-${shot.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
                      <SelectItem value="scene-default">
                        Scene Default {sceneModel ? `(${sceneModel})` : ""}
                      </SelectItem>
                      {availableVideoModels.map((model) => (
                        <SelectItem key={model.name} value={model.name}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <Select
                    value={version?.videoDuration?.toString() || shot.duration?.toString() || ""}
                    onValueChange={(value) => onUpdateVideoDuration(shot.id, parseInt(value))}
                    disabled={(() => {
                      const effectiveModelId = getEffectiveVideoModelId();
                      // Disable if no model found or no durations available
                      return !effectiveModelId || !VIDEO_MODEL_DURATIONS[effectiveModelId] || VIDEO_MODEL_DURATIONS[effectiveModelId].length === 0;
                    })()}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-video-duration-${shot.id}`}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
                      {(() => {
                        const effectiveModelId = getEffectiveVideoModelId();
                        // Get supported durations for the effective model
                        const supportedDurations = effectiveModelId && VIDEO_MODEL_DURATIONS[effectiveModelId]
                          ? VIDEO_MODEL_DURATIONS[effectiveModelId]
                          : [];

                        return supportedDurations.map((duration) => (
                          <SelectItem key={duration} value={duration.toString()}>
                            {duration}s
                          </SelectItem>
                        ));
                      })()}
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
                onClick={() => onAnimateShot?.(shot.id)}
                disabled={isGeneratingVideo || !version}
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
  scenes,
  shots,
  shotVersions,
  referenceImages,
  characters,
  locations = [],
  continuityLocked,
  continuityGroups,
  isCommerceMode = false,
  isLogoMode = false,
  isGeneratingPrompts = false,
  imageModel: defaultImageModel,
  videoModel: defaultVideoModel,
  videoResolution: defaultVideoResolution,
  aspectRatio: defaultAspectRatio = "16:9",
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
  const [activeFrameInDialog, setActiveFrameInDialog] = useState<"start" | "end">("start");
  const [frameToEdit, setFrameToEdit] = useState<"start" | "end" | null>(null); // Track which frame was active when opening edit dialog
  const [localShots, setLocalShots] = useState(shots);
  const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
  const [dontRemindAgain, setDontRemindAgain] = useState(false);
  const [previewVersions, setPreviewVersions] = useState<Record<string, string>>({});
  const [localVersionCache, setLocalVersionCache] = useState<Record<string, NarrativeShotVersion[]>>({}); // Cache for newly created versions
  const [editReferenceImages, setEditReferenceImages] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [selectedEditingModel, setSelectedEditingModel] = useState<string>("nano-banana");
  const [isEditing, setIsEditing] = useState(false);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [cameraVertical, setCameraVertical] = useState(0);
  const [cameraZoom, setCameraZoom] = useState(0);
  const [cameraWideAngle, setCameraWideAngle] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");
  const [timelinePlayhead, setTimelinePlayhead] = useState(0);
  const editReferenceInputRef = useRef<HTMLInputElement>(null);
  // Track generating state by shot ID and frame type (e.g., "shotId:start" or "shotId:end")
  const [generatingShots, setGeneratingShots] = useState<Set<string>>(new Set());
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  // Video generation state
  const [generatingVideos, setGeneratingVideos] = useState<Set<string>>(new Set());
  const [videoGenerationTasks, setVideoGenerationTasks] = useState<Record<string, string>>({}); // shotId -> taskId
  // Scene-level animation state (tracks which scenes are being batch-animated)
  const [animatingScenes, setAnimatingScenes] = useState<Set<string>>(new Set());
  // Scene-level image generation state (tracks which scenes are running "Generate All Images")
  const [generatingScenesAll, setGeneratingScenesAll] = useState<Set<string>>(new Set());
  // Cancel refs for batch operations (using refs to avoid stale closures in async loops)
  const cancelSceneAnimationRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Refs to prevent stale closures in async callbacks (e.g., video polling)
  const onUpdateShotVersionRef = useRef(onUpdateShotVersion);
  
  // Model lists fetched from API
  const [videoModels, setVideoModels] = useState<Array<{ name: string; label: string; description: string; durations?: number[] }>>([]);
  
  // Fetch available video models on component mount (image models are hardcoded)
  useEffect(() => {
    const fetchVideoModels = async () => {
      try {
        const response = await apiRequest('GET', '/api/narrative/models');
        const data = await response.json();
        if (data.videoModels && Array.isArray(data.videoModels) && data.videoModels.length > 0) {
          setVideoModels(data.videoModels);
          // Update VIDEO_MODEL_DURATIONS with durations from API
          data.videoModels.forEach((model: any) => {
            if (model.durations && Array.isArray(model.durations)) {
              VIDEO_MODEL_DURATIONS[model.name] = model.durations;
            }
          });
        } else {
          setVideoModels(DEFAULT_VIDEO_MODELS.map(name => ({ name, label: name, description: '' })));
        }
      } catch (error) {
        console.error('[storyboard-editor] Failed to fetch video models:', error);
        setVideoModels(DEFAULT_VIDEO_MODELS.map(name => ({ name, label: name, description: '' })));
      }
    };
    
    fetchVideoModels();
  }, []);
  
  // Use hardcoded image models (matching world-cast.tsx approach)
  const availableImageModels = IMAGE_MODELS;
  const availableVideoModels = videoModels.length > 0 ? videoModels : DEFAULT_VIDEO_MODELS.map(name => ({ name, label: name, description: '' }));
  
  // Filter models that support editing
  const editingModels = availableImageModels.filter(model => 
    ['nano-banana', 'nano-banana-2-pro', 'flux-2-pro', 'openai-gpt-image-1', 
     'openai-gpt-image-1.5', 'runway-gen-4-image', 'runway-gen-4-image-turbo', 
     'kling-image-o1'].includes(model.name)
  );

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
      
      // Initialize active frame based on available frames in start-end mode
      if (narrativeMode === "start-end") {
        // If frameToEdit is set (from clicking Edit Image), use that frame
        if (frameToEdit) {
          setActiveFrameInDialog(frameToEdit);
          setFrameToEdit(null); // Reset after using
        } else {
          const version = shotVersions[selectedShot.id]?.find(v => v.id === selectedShot.currentVersionId);
          if (version) {
            // If start frame exists, default to start; otherwise use end if available
            if (version.startFrameUrl) {
              setActiveFrameInDialog("start");
            } else if (version.endFrameUrl) {
              setActiveFrameInDialog("end");
            }
          }
        }
      }
    }
  }, [selectedShot?.id, selectedShot?.currentVersionId, narrativeMode, shotVersions, frameToEdit]);

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

  // Ref to prevent stale closures in async callbacks (e.g., video polling)
  const allShotsRef = useRef(allShots);
  
  // Keep refs in sync with current values
  useEffect(() => {
    allShotsRef.current = allShots;
  }, [allShots]);
  
  useEffect(() => {
    onUpdateShotVersionRef.current = onUpdateShotVersion;
  }, [onUpdateShotVersion]);

  // Helper to get current version of a shot
  const getShotVersion = (shot: Shot): NarrativeShotVersion | null => {
    if (!shot.currentVersionId) return null;
    // Merge prop versions with local cache (same as getPreviewedVersion)
    // This ensures newly created versions (e.g., from Edit Image) are found
    const propVersions = shotVersions[shot.id] || [];
    const cachedVersions = localVersionCache[shot.id] || [];
    const allVersions = [...propVersions, ...cachedVersions.filter(cv => !propVersions.find(pv => pv.id === cv.id))];
    return allVersions.find((v) => v.id === shot.currentVersionId) || null;
  };

  // Helper to get the version being previewed (or active version if no preview)
  const getPreviewedVersion = (shot: Shot): NarrativeShotVersion | null => {
    // Merge prop versions with local cache
    const propVersions = shotVersions[shot.id] || [];
    const cachedVersions = localVersionCache[shot.id] || [];
    // Combine and deduplicate by ID (cache takes precedence for same ID)
    const allVersions = [...propVersions, ...cachedVersions.filter(cv => !propVersions.find(pv => pv.id === cv.id))];
    const previewVersionId = previewVersions[shot.id] || shot.currentVersionId;
    return allVersions.find(v => v.id === previewVersionId) || null;
  };

  // Wrapper handlers that track loading state by frame type
  const handleGenerateShotWithLoading = async (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => {
    // Create frame-specific key for start-end mode, otherwise just use shotId
    const generatingKey = frame && narrativeMode === "start-end" ? `${shotId}:${frame}` : shotId;
    setGeneratingShots(prev => new Set(prev).add(generatingKey));
    try {
      await onGenerateShot(shotId, prompts, frame);
    } finally {
      setGeneratingShots(prev => {
        const next = new Set(prev);
        next.delete(generatingKey);
        return next;
      });
    }
  };

  const handleRegenerateShotWithLoading = async (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => {
    // Create frame-specific key for start-end mode, otherwise just use shotId
    const generatingKey = frame && narrativeMode === "start-end" ? `${shotId}:${frame}` : shotId;
    setGeneratingShots(prev => new Set(prev).add(generatingKey));
    try {
      await onRegenerateShot(shotId, prompts, frame);
    } finally {
      setGeneratingShots(prev => {
        const next = new Set(prev);
        next.delete(generatingKey);
        return next;
      });
    }
  };

  // Helper: Check if a shot is connected to the next shot in Start-End Frame mode
  const isShotConnectedToNext = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked) return false;
    
    // Only consider approved groups - filter out proposed and declined groups
    const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
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
    
    // Only consider approved groups - filter out proposed and declined groups
    const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
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
    
    // Only consider approved groups - filter out proposed and declined groups
    const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
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

  // Helper: Get the next connected shot in a continuity group
  const getNextConnectedShot = (sceneId: string, shotIndex: number): Shot | null => {
    if (narrativeMode !== "start-end" || !continuityLocked) return null;
    
    // Only consider approved groups - filter out proposed and declined groups
    const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    
    if (shotIndex >= sceneShots.length - 1) return null; // Last shot has no next
    
    const currentShot = sceneShots[shotIndex];
    const nextShot = sceneShots[shotIndex + 1];
    
    // Check if current and next shots are in the same continuity group
    for (const group of sceneGroups) {
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
    if (narrativeMode !== "start-end" || !continuityLocked || shotIndex === 0) return null;
    
    // Only consider approved groups - filter out proposed and declined groups
    const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    
    const currentShot = sceneShots[shotIndex];
    const previousShot = sceneShots[shotIndex - 1];
    
    // Check if previous and current shots are in the same continuity group
    for (const group of sceneGroups) {
      const shotIds = group.shotIds || [];
      const previousIdx = shotIds.indexOf(previousShot.id);
      const currentIdx = shotIds.indexOf(currentShot.id);
      
      if (previousIdx !== -1 && currentIdx === previousIdx + 1) {
        return previousShot; // Return the previous connected shot
      }
    }
    
    return null;
  };

  // Helper: Check if a shot's start frame is inherited from previous shot
  const isShotStartFrameInherited = (sceneId: string, shotIndex: number): boolean => {
    if (narrativeMode !== "start-end" || !continuityLocked || shotIndex === 0) return false;
    
    // Only consider approved groups - filter out proposed and declined groups
    const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
    const sceneShots = localShots[sceneId] || [];
    
    const currentShot = sceneShots[shotIndex];
    const previousShot = sceneShots[shotIndex - 1];
    
    // Check if previous and current shots are in the same continuity group
    for (const group of sceneGroups) {
      const shotIds = group.shotIds || [];
      const previousIdx = shotIds.indexOf(previousShot.id);
      const currentIdx = shotIds.indexOf(currentShot.id);
      
      if (previousIdx !== -1 && currentIdx === previousIdx + 1) {
        return true; // Current shot's start frame is inherited from previous shot's end
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

  // Generate all images for a scene sequentially (frame by frame)
  const handleGenerateSceneImages = async (sceneId: string) => {
    // Mark this scene as generating
    setGeneratingScenesAll(prev => new Set(prev).add(sceneId));
    
    try {
    const sceneShots = localShots[sceneId] || [];
    if (sceneShots.length === 0) {
      toast({
        title: "No Shots",
        description: "This scene has no shots to generate.",
        variant: "destructive",
      });
      return;
    }

      // Only consider approved groups - filter out proposed and declined groups
      const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
      
      // Build a map of shot ID to its previous shot in the same group (for dependency tracking)
      const previousShotInGroup: Record<string, string> = {};
      for (const group of sceneGroups) {
        if (group.shotIds && group.shotIds.length > 1) {
          for (let i = 1; i < group.shotIds.length; i++) {
            previousShotInGroup[group.shotIds[i]] = group.shotIds[i - 1];
          }
        }
      }
    
    // Determine which shots need generation and in what order
      // Include dependency info for connected shots
      const shotsToGenerate: Array<{ 
        shot: Shot; 
        frame?: 'start' | 'end';
        dependsOnShotId?: string; // For connected shots, the previous shot whose end frame must exist
      }> = [];
    
    for (const shot of sceneShots) {
      const version = getShotVersion(shot);
      const shotEffectiveMode = narrativeMode === "auto"
        ? (shot.frameMode || "image-reference")
        : narrativeMode;
      
      // Check if shot is in a continuity group
      let isInGroup = false;
      let shotIndexInGroup = -1;
      let groupShotIds: string[] = [];
      
      for (const group of sceneGroups) {
        if (group.shotIds && group.shotIds.includes(shot.id)) {
          isInGroup = true;
          groupShotIds = group.shotIds;
          shotIndexInGroup = groupShotIds.indexOf(shot.id);
          break;
        }
      }
      
      if (shotEffectiveMode === "image-reference") {
        // Single frame mode: generate if no image exists
        if (!version || !version.imageUrl) {
          shotsToGenerate.push({ shot });
        }
      } else {
        // Start-end mode
        if (isInGroup && shotIndexInGroup > 0) {
          // Not first in group: start frame is inherited, only generate end frame
            // This shot depends on the previous shot in the group having its end frame
            const prevShotId = previousShotInGroup[shot.id];
          if (!version || !version.endFrameUrl) {
              shotsToGenerate.push({ shot, frame: 'end', dependsOnShotId: prevShotId });
          }
        } else {
          // First in group or standalone: generate start frame first, then end frame
            const needsStart = !version || !version.startFrameUrl;
            const needsEnd = !version || !version.endFrameUrl;
            
            if (needsStart) {
            shotsToGenerate.push({ shot, frame: 'start' });
          }
            // Also add end frame if it doesn't exist
            // Sequential generation ensures start completes before end
            if (needsEnd) {
            shotsToGenerate.push({ shot, frame: 'end' });
          }
        }
      }
    }
    
    if (shotsToGenerate.length === 0) {
      toast({
        title: "All Images Generated",
        description: "All shots in this scene already have generated images.",
      });
      return;
    }
    
    toast({
      title: "Generating Scene Images",
      description: `Generating ${shotsToGenerate.length} frame(s) sequentially...`,
    });
    
    // Generate sequentially, waiting for each to complete
      // Track completed generations to avoid closure issues with React state
      const completedGenerations = new Set<string>();
      let successCount = 0;
      let failCount = 0;
      
      // Pre-populate completedGenerations with frames that already exist
      // This prevents waiting forever for frames that were generated before this batch
      for (const shot of sceneShots) {
        const existingVersion = getShotVersion(shot);
        if (existingVersion) {
          if (existingVersion.imageUrl) {
            completedGenerations.add(shot.id);
          }
          if (existingVersion.startFrameUrl) {
            completedGenerations.add(`${shot.id}:start`);
          }
          if (existingVersion.endFrameUrl) {
            completedGenerations.add(`${shot.id}:end`);
          }
        }
      }
      
      console.log('[Generate All] Pre-populated completed generations:', Array.from(completedGenerations));
      console.log('[Generate All] Shots to generate:', shotsToGenerate.map(s => ({ shotId: s.shot.id, frame: s.frame, dependsOn: s.dependsOnShotId })));
      
    for (let i = 0; i < shotsToGenerate.length; i++) {
        const { shot, frame, dependsOnShotId } = shotsToGenerate[i];
      const shotEffectiveMode = narrativeMode === "auto"
        ? (shot.frameMode || "image-reference")
        : narrativeMode;
      
        const generatingKey = shotEffectiveMode === "start-end" && frame
          ? `${shot.id}:${frame}`
          : shot.id;
        
        try {
          // For connected shots, verify the previous shot in the group has its end frame
          // This is critical: Shot 2 END cannot be generated until Shot 1 END exists
          // (because Shot 2 START is inherited from Shot 1 END)
          if (dependsOnShotId && frame === 'end') {
            const prevGeneratingKey = `${dependsOnShotId}:end`;
            
            // Check if previous shot's end frame already exists (pre-populated or just generated)
            if (completedGenerations.has(prevGeneratingKey)) {
              console.log(`[Generate All] Dependency satisfied: ${prevGeneratingKey} already exists`);
              // Small delay to ensure database consistency
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              // Wait for previous shot's end frame generation to complete (check our local tracker)
              console.log(`[Generate All] Waiting for dependency: ${prevGeneratingKey}`);
              let waitAttempts = 0;
              const maxWaitAttempts = 240; // 2 minutes max (500ms * 240)
              
              while (!completedGenerations.has(prevGeneratingKey) && waitAttempts < maxWaitAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
                waitAttempts++;
              }
              
              if (waitAttempts >= maxWaitAttempts) {
                console.warn(`Dependency timeout: Shot ${shot.id} waiting for shot ${dependsOnShotId} end frame`);
                toast({
                  title: "Dependency Error",
                  description: `Cannot generate shot #${shot.shotNumber} end frame: previous connected shot's end frame is not ready.`,
                  variant: "destructive",
                });
                failCount++;
                continue; // Skip this shot and move to next
              }
              
              // Extra delay to ensure database is updated before next generation
              // The backend needs the previous shot's end frame URL in the database
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
          
          // Update toast to show progress
          toast({
            title: "Generating Images",
            description: `Generating frame ${i + 1} of ${shotsToGenerate.length}... (Shot #${shot.shotNumber} ${frame || 'image'})`,
          });
          
          // Call the generation function and await it
          // handleGenerateShotWithLoading already awaits onGenerateShot which returns when API is complete
          await handleGenerateShotWithLoading(shot.id, undefined, frame);
          
          // Mark this generation as complete in our local tracker
          completedGenerations.add(generatingKey);
          successCount++;
          
          // Add delay between generations to ensure:
          // 1. Database is updated with the new image URL
          // 2. Backend can find the previous frame when processing continuity groups
          await new Promise(resolve => setTimeout(resolve, 1000));
          
      } catch (error) {
        console.error(`Failed to generate frame for shot ${shot.id}:`, error);
        toast({
          title: "Generation Error",
          description: `Failed to generate frame for shot #${shot.shotNumber}. Continuing with next shot...`,
          variant: "destructive",
        });
          failCount++;
        
          // Still mark as completed (failed) so dependent shots don't wait forever
          completedGenerations.add(generatingKey);
          
          // Continue to next shot
      }
    }
    
    toast({
      title: "Generation Complete",
        description: `Finished: ${successCount} successful, ${failCount} failed out of ${shotsToGenerate.length} frame(s).`,
      });
    } finally {
      // Clear generating state for this scene
      setGeneratingScenesAll(prev => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
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
    // Update the shot version's imagePrompt, not the shot's description
    // The shot description is from breakdown and should remain separate
    const shot = allShots.find(s => s.id === shotId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3122497d-bbea-4a92-b13d-2af25bc0650e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storyboard-editor.tsx:1615',message:'handleUpdatePrompt called',data:{shotId,hasShot:!!shot,currentVersionId:shot?.currentVersionId,currentVersionIdType:typeof shot?.currentVersionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (shot?.currentVersionId && onUpdateShotVersion) {
      onUpdateShotVersion(shotId, shot.currentVersionId, { imagePrompt: prompt });
    }
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

  /**
   * Handle scene video model change with automatic duration adjustment
   * When scene's video model changes, adjust duration for all shots using "scene-default"
   */
  const handleSceneVideoModelChange = (sceneId: string, newVideoModel: string) => {
    // Update the scene's video model
    onUpdateScene?.(sceneId, { videoModel: newVideoModel });
    
    // Get supported durations for the new model
    const supportedDurations = VIDEO_MODEL_DURATIONS[newVideoModel] || [];
    if (supportedDurations.length === 0) {
      return; // No durations to validate against
    }
    
    // Find all shots in this scene that use "scene-default" (videoModel === null)
    const sceneShots = shots[sceneId] || [];
    let adjustedCount = 0;
    
    for (const shot of sceneShots) {
      // Only adjust shots using scene default (no custom video model)
      if (shot.videoModel !== null && shot.videoModel !== undefined) {
        continue; // Shot has custom model, skip
      }
      
      // Get current version for this shot
      const version = shotVersions[shot.id]?.find(v => v.id === shot.currentVersionId)
        || shotVersions[shot.id]?.[shotVersions[shot.id].length - 1];
      
      if (!version?.videoDuration) {
        continue; // No duration set
      }
      
      const currentDuration = version.videoDuration;
      
      // Check if current duration is supported
      if (!supportedDurations.includes(currentDuration)) {
        const nearestDuration = findNearestDuration(currentDuration, supportedDurations);
        
        // Update the version's duration
        if (shot.currentVersionId && onUpdateShotVersion) {
          onUpdateShotVersion(shot.id, shot.currentVersionId, { videoDuration: nearestDuration });
          adjustedCount++;
        }
      }
    }
    
    // Notify user if any durations were adjusted
    if (adjustedCount > 0) {
      toast({
        title: "Durations Adjusted",
        description: `${adjustedCount} shot(s) had their duration adjusted to match the new model's supported durations`,
      });
    }
  };

  // Video generation handler
  const handleAnimateShot = async (shotId: string) => {
    const shot = allShots.find(s => s.id === shotId);
    if (!shot) {
      toast({
        title: "Error",
        description: "Shot not found",
        variant: "destructive",
      });
      return;
    }

    // Get shot version
    const version = getShotVersion(shot);
    if (!version) {
      toast({
        title: "Error",
        description: "Please generate an image for this shot first",
        variant: "destructive",
      });
      return;
    }

    // Find scene for resolution hierarchy and continuity checks
    const scene = scenes.find(s => s.id === shot.sceneId);

    // Determine effective mode
    const effectiveMode = narrativeMode === "auto" 
      ? (shot.frameMode || "image-reference")
      : narrativeMode;

    // Validate required images/frames
    if (effectiveMode === "image-reference") {
      if (!version.imageUrl) {
        toast({
          title: "Error",
          description: "Image is required for video generation",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Start-end mode
      // Check if start frame should be inherited from previous shot
      let shouldInheritStartFrame = false;
      
      if (scene && narrativeMode === "start-end" && continuityLocked) {
        // Only consider approved groups - filter out proposed and declined groups
        const sceneGroups = (continuityGroups[scene.id] || []).filter(g => g.status === "approved");
        const sceneShots = localShots[scene.id] || [];
        const shotIndex = sceneShots.findIndex(s => s.id === shotId);
        
        if (shotIndex > 0) {
          const previousShot = sceneShots[shotIndex - 1];
          
          // Check if previous and current shots are in the same continuity group
          for (const group of sceneGroups) {
            const shotIds = group.shotIds || [];
            const previousIdx = shotIds.indexOf(previousShot.id);
            const currentIdx = shotIds.indexOf(shotId);
            
            if (previousIdx !== -1 && currentIdx === previousIdx + 1) {
              shouldInheritStartFrame = true;
              break;
            }
          }
        }
      }
      
      // Only require startFrameUrl if it's not being inherited
      if (!version.startFrameUrl && !shouldInheritStartFrame) {
        toast({
          title: "Error",
          description: "Start frame is required for video generation",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Resolve video settings with priority: shot → scene → video → default
    // Note: videoResolution is not in shared Shot/Scene types, but is present in narrative mode data
    const resolution = (shot as any).videoResolution 
      || (scene as any)?.videoResolution 
      || defaultVideoResolution 
      || "720p";
    
    // Helper to extract model ID string (handle both string and object formats)
    const getModelId = (model: any): string | null => {
      if (!model) return null;
      if (typeof model === "string") return model;
      if (typeof model === "object") {
        // Try various common properties
        if (model.id) return model.id;
        if (model.name) return model.name;
        if (model.modelId) return model.modelId;
        if (model.value) return model.value;
        // If it's an array, take first element
        if (Array.isArray(model) && model.length > 0) {
          return getModelId(model[0]);
        }
      }
      return null;
    };
    
    // Resolve video model with priority: shot → scene → default → fallback
    let videoModel: string = "seedance-1.0-pro"; // Default fallback
    if (shot.videoModel) {
      const modelId = getModelId(shot.videoModel);
      if (modelId) videoModel = modelId;
    } else if (scene?.videoModel) {
      const modelId = getModelId(scene.videoModel);
      if (modelId) videoModel = modelId;
    } else if (defaultVideoModel) {
      const modelId = getModelId(defaultVideoModel);
      if (modelId) videoModel = modelId;
    }
    
    // Final validation: ensure videoModel is always a string
    if (typeof videoModel !== "string") {
      videoModel = "seedance-1.0-pro"; // Force fallback
    }

    const aspectRatio = defaultAspectRatio || "16:9";

    // Get video prompt
    const videoPrompt = version.videoPrompt || "";

    // Set generating state
    setGeneratingVideos(prev => new Set(prev).add(shotId));

    try {
      const result = await animateShot(videoId, shotId, {
        shotVersionId: version.id,
        videoModel,
        aspectRatio,
        resolution,
        duration: version.videoDuration || shot.duration,
        videoPrompt,
        narrativeMode: narrativeMode || "image-reference",
      });

      if (result.status === "failed") {
        toast({
          title: "Video generation failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
        setGeneratingVideos(prev => {
          const next = new Set(prev);
          next.delete(shotId);
          return next;
        });
        return;
      }

      // If processing, start polling
      if (result.status === "processing" && result.taskId) {
        setVideoGenerationTasks(prev => ({ ...prev, [shotId]: result.taskId }));
        startPolling(shotId, result.taskId);
      } else if (result.status === "completed" && result.videoUrl) {
        // Already completed - update version
        if (onUpdateShotVersion) {
          onUpdateShotVersion(shotId, version.id, {
            videoUrl: result.videoUrl,
            status: "completed",
          });
        }
        toast({
          title: "Video generated",
          description: "Video generation completed successfully",
        });
        setGeneratingVideos(prev => {
          const next = new Set(prev);
          next.delete(shotId);
          return next;
        });
      }
    } catch (error) {
      console.error('[storyboard-editor] Video generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const is400 = errorMessage.includes("400");
      toast({
        title: "Video generation failed",
        description: is400 
          ? "The image for this shot may be missing from the database. Please regenerate the image first, then try again."
          : errorMessage,
        variant: "destructive",
      });
      setGeneratingVideos(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  };

  // Polling function for video generation status
  const startPolling = (shotId: string, taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await checkVideoStatus(videoId, shotId, taskId);
        
        if (status.status === "completed" && status.videoUrl) {
          // Update shot version with video URL
          // Use refs to get LATEST values (avoid stale closure)
          const shot = allShotsRef.current.find(s => s.id === shotId);
          if (shot?.currentVersionId && onUpdateShotVersionRef.current) {
            onUpdateShotVersionRef.current(shotId, shot.currentVersionId, {
              videoUrl: status.videoUrl,
              status: "completed",
            });
          }
          
          toast({
            title: "Video generated",
            description: "Video generation completed successfully",
          });
          
          // Clean up
          clearInterval(pollInterval);
          setGeneratingVideos(prev => {
            const next = new Set(prev);
            next.delete(shotId);
            return next;
          });
          setVideoGenerationTasks(prev => {
            const next = { ...prev };
            delete next[shotId];
            return next;
          });
        } else if (status.status === "failed") {
          toast({
            title: "Video generation failed",
            description: status.error || "Unknown error",
            variant: "destructive",
          });
          
          // Clean up
          clearInterval(pollInterval);
          setGeneratingVideos(prev => {
            const next = new Set(prev);
            next.delete(shotId);
            return next;
          });
          setVideoGenerationTasks(prev => {
            const next = { ...prev };
            delete next[shotId];
            return next;
          });
        }
        // If still processing, continue polling
      } catch (error) {
        console.error('[storyboard-editor] Status check error:', error);
        // Continue polling on error (might be temporary)
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes (safety timeout)
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      setGeneratingVideos(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
      setVideoGenerationTasks(prev => {
        const next = { ...prev };
        delete next[shotId];
        return next;
      });
    }, 300000);

    // Store interval and timeout for cleanup
    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  };

  /**
   * Animate all shots in a scene with parallel execution (concurrency limited)
   * Uses Promise.allSettled to handle individual failures gracefully
   */
  const handleAnimateScene = async (sceneId: string) => {
    const CONCURRENT_LIMIT = 3; // Process 3 shots at a time to avoid rate limits
    
    const sceneShots = localShots[sceneId] || [];
    const scene = scenes.find(s => s.id === sceneId);
    
    if (sceneShots.length === 0) {
      toast({
        title: "No shots to animate",
        description: "This scene has no shots",
        variant: "destructive",
      });
      return;
    }
    
    // Filter shots that have images ready (required for video generation)
    const readyShots = sceneShots.filter(shot => {
      const version = getShotVersion(shot);
      if (!version) return false;
      
      // Check based on narrative mode
      const effectiveMode = narrativeMode === "auto" 
        ? (shot.frameMode || "image-reference")
        : narrativeMode;
      
      if (effectiveMode === "image-reference") {
        return !!version.imageUrl;
      } else {
        // Start-end mode: needs at least start frame (may be inherited)
        // Check if start frame exists or can be inherited
        const sceneShots = localShots[sceneId] || [];
        const shotIndex = sceneShots.findIndex(s => s.id === shot.id);
        
        if (version.startFrameUrl) return true;
        
        // Check if can inherit from previous shot in continuity group
        if (shotIndex > 0 && continuityLocked) {
          const sceneGroups = (continuityGroups[sceneId] || []).filter(g => g.status === "approved");
          const previousShot = sceneShots[shotIndex - 1];
          
          for (const group of sceneGroups) {
            const shotIds = group.shotIds || [];
            const prevIdx = shotIds.indexOf(previousShot.id);
            const currIdx = shotIds.indexOf(shot.id);
            
            if (prevIdx !== -1 && currIdx === prevIdx + 1) {
              // Can inherit from previous shot
              const prevVersion = getShotVersion(previousShot);
              return !!(prevVersion?.endFrameUrl || prevVersion?.imageUrl);
            }
          }
        }
        
        return false;
      }
    });
    
    // Also filter out shots that already have videos (unless user wants to regenerate)
    const shotsToAnimate = readyShots.filter(shot => {
      const version = getShotVersion(shot);
      return !version?.videoUrl; // Only animate shots without video
    });
    
    if (shotsToAnimate.length === 0) {
      if (readyShots.length === 0) {
        toast({
          title: "No shots ready",
          description: "Generate images for shots first before animating",
          variant: "destructive",
        });
      } else {
        toast({
          title: "All shots animated",
          description: "All shots in this scene already have videos",
        });
      }
      return;
    }
    
    // Set scene as animating
    setAnimatingScenes(prev => new Set(prev).add(sceneId));
    
    toast({
      title: "Animating Scene",
      description: `Starting video generation for ${shotsToAnimate.length} shot(s)...`,
    });
    
    const results: { shotId: string; success: boolean; error?: string }[] = [];
    
    try {
      // Process in batches with concurrency limit
      for (let i = 0; i < shotsToAnimate.length; i += CONCURRENT_LIMIT) {
        // Check if this scene's animation was cancelled
        if (cancelSceneAnimationRef.current.has(sceneId)) {
          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;
          toast({
            title: "Animation Cancelled",
            description: `Stopped after ${successCount} successful, ${failCount} failed out of ${shotsToAnimate.length} shot(s).`,
          });
          break;
        }

        const batch = shotsToAnimate.slice(i, i + CONCURRENT_LIMIT);
        
        // Show progress toast for batch
        if (shotsToAnimate.length > CONCURRENT_LIMIT) {
          toast({
            title: "Processing batch",
            description: `Animating shots ${i + 1}-${Math.min(i + CONCURRENT_LIMIT, shotsToAnimate.length)} of ${shotsToAnimate.length}...`,
          });
        }
        
        // Process batch in parallel using Promise.allSettled
        const batchPromises = batch.map(async (shot) => {
          try {
            await handleAnimateShot(shot.id);
            return { shotId: shot.id, success: true };
          } catch (error) {
            return { 
              shotId: shot.id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            // This shouldn't happen since we're catching errors inside the promise
            results.push({ shotId: 'unknown', success: false, error: result.reason?.message });
          }
        });
      }
      
      // Report final results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (failCount === 0) {
        toast({
          title: "Scene Animation Complete",
          description: `Successfully started video generation for ${successCount} shot(s)`,
        });
      } else if (successCount === 0) {
        toast({
          title: "Animation Failed",
          description: `All ${failCount} shot(s) failed to animate`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scene Animation Partial",
          description: `${successCount} succeeded, ${failCount} failed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[storyboard-editor] Scene animation error:', error);
      toast({
        title: "Animation Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      // Remove scene from animating set and clear cancel flag
      cancelSceneAnimationRef.current.delete(sceneId);
      setAnimatingScenes(prev => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  };

  // Cancel handler for scene animation (video generation)
  const handleCancelSceneAnimation = (sceneId: string) => {
    cancelSceneAnimationRef.current.add(sceneId);
    toast({
      title: "Cancelling...",
      description: "Will stop after the current batch finishes.",
    });
  };

  const handleSelectShot = (shot: Shot, frame?: "start" | "end") => {
    setSelectedShot(shot);
    setEditPrompt(shot.description || "");
    // Store the frame that was active when opening the dialog (for start-end mode)
    if (frame) {
      setFrameToEdit(frame);
    }
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

  /**
   * Build editing instruction from category and user input
   */
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
    const version = shotVersions[selectedShot.id]?.find(v => v.id === selectedVersionId);
    
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
      imageUrl = activeFrameInDialog === "start" 
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
          ? `The selected version doesn't have a ${activeFrameInDialog} frame`
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

    if (!editChange.trim()) {
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
        requestBody.activeFrame = activeFrameInDialog;
      }
      
      const response = await apiRequest('POST', `/api/narrative/videos/${videoId}/shots/${selectedShot.id}/edit-image`, requestBody);
      
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
    } catch (error: any) {
      console.error('[storyboard-editor] Image editing error:', error);
      toast({ 
        title: "Edit failed", 
        description: error.message || "Unknown error occurred",
        variant: "destructive" 
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleGenerateFromDialog = () => {
    if (!selectedShot) return;
    
    // Check if we're in editing mode (activeCategory is set)
    if (activeCategory) {
      // Call image editing
      handleEditImage();
    } else {
      // Original behavior: full regeneration
      onUpdateShot(selectedShot.id, { description: editPrompt });
      onGenerateShot(selectedShot.id);
      toast({
        title: "Generating Image",
        description: "Creating image from your prompt...",
      });
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

  // Calculate total shots count for loading message
  const totalShotsCount = Object.values(shots).reduce((sum, sceneShots) => sum + sceneShots.length, 0);

  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay - Show when generating prompts */}
      {isGeneratingPrompts && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 backdrop-blur-sm"
        >
          {/* Breathing Glow Effect */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-40 h-40 rounded-full blur-3xl bg-gradient-to-br from-purple-500 to-cyan-500"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-8">
            {/* Icon with Star and Sparkles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="mb-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Star className="h-10 w-10 text-white" />
                </div>
                {/* Sparkles around the star */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute -bottom-1 -left-1"
                >
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Generating Prompts
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base text-gray-300 mb-1"
            >
              Creating optimized prompts for all {totalShotsCount} shot{totalShotsCount !== 1 ? 's' : ''}...
            </motion.p>

            {/* Info Text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-400 mt-4"
            >
              This may take a moment
            </motion.p>

            {/* Loading Dots */}
            <div className="flex gap-2 mt-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  }}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
      <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Storyboard</h3>
            <p className="text-sm text-muted-foreground">
              {generatedCount} of {totalCount} shots generated • Drag to reorder
            </p>
          </div>
          
          <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg p-1 bg-white/[0.02] border-white/[0.06]">
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 px-3 transition-all duration-200 ${viewMode === "cards" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-white/70 hover:text-white hover:bg-white/[0.04]"}`}
              onClick={() => setViewMode("cards")}
              data-testid="button-view-cards"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Cards
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 px-3 transition-all duration-200 ${viewMode === "timeline" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-white/70 hover:text-white hover:bg-white/[0.04]"}`}
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
            <React.Fragment key={scene.id}>
              <div className="space-y-4 p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-80 shrink-0 space-y-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold")}>
                        {sceneIndex + 1}
                      </div>
                      <h4 className="font-semibold text-sm text-white">{scene.title}</h4>
                    </div>
                    {onDeleteScene && (
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
                      <Label className="text-xs text-muted-foreground">Image Model</Label>
                      <Select
                        value={scene.imageModel || defaultImageModel || availableImageModels[0]?.name || 'nano-banana'}
                        onValueChange={(value) => onUpdateScene?.(scene.id, { imageModel: value })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-scene-image-model-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/[0.06]">
                          {availableImageModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Video Model</Label>
                      <Select
                        value={scene.videoModel || availableVideoModels[0]?.name || 'kling'}
                        onValueChange={(value) => handleSceneVideoModelChange(scene.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-scene-video-model-${scene.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/[0.06]">
                          {availableVideoModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                      onClick={async () => {
                        await handleGenerateSceneImages(scene.id);
                      }}
                      disabled={generatingScenesAll.has(scene.id)}
                      data-testid={`button-generate-scene-images-${scene.id}`}
                    >
                      {generatingScenesAll.has(scene.id) ? (
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
                    
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white ${animatingScenes.has(scene.id) ? 'rounded-r-none' : ''}`}
                        onClick={() => handleAnimateScene(scene.id)}
                        disabled={animatingScenes.has(scene.id) || generatingShots.size > 0}
                        data-testid={`button-animate-scene-${scene.id}`}
                      >
                        {animatingScenes.has(scene.id) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Animating...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Animate Scene's Shots
                          </>
                        )}
                      </Button>
                      {animatingScenes.has(scene.id) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-l-none px-2"
                          onClick={() => handleCancelSceneAnimation(scene.id)}
                          data-testid={`button-cancel-scene-animation-${scene.id}`}
                          title="Cancel video generation"
                        >
                          <X className="h-4 w-4" />
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
                      <div className="flex gap-4 pb-2">
                        {sceneShots.map((shot, shotIndex) => {
                          const version = getShotVersion(shot);
                          const referenceImage = getShotReferenceImage(shot.id);
                          // For start-end mode, check frame-specific generating state
                          // For image-reference mode, use shot-level generating state
                          // For start-end mode, check frame-specific generating state
                          // For image-reference mode, use shot-level generating state
                          const isGeneratingShot = narrativeMode === "start-end"
                            ? (generatingShots.has(`${shot.id}:start`) || generatingShots.has(`${shot.id}:end`))
                            : generatingShots.has(shot.id);
                          const isGeneratingStart = narrativeMode === "start-end" 
                            ? generatingShots.has(`${shot.id}:start`)
                            : false;
                          const isGeneratingEnd = narrativeMode === "start-end"
                            ? generatingShots.has(`${shot.id}:end`)
                            : false;
                          const isConnectedToNext = isShotConnectedToNext(scene.id, shotIndex);
                          const showEndFrame = isShotStandalone(scene.id, shotIndex);
                          const isPartOfConnection = isShotPartOfConnection(scene.id, shotIndex);
                          const isStartFrameInherited = isShotStartFrameInherited(scene.id, shotIndex);
                          
                          // Get next shot's version for connected shots
                          const nextShot = getNextConnectedShot(scene.id, shotIndex);
                          const nextShotVersion = nextShot ? getShotVersion(nextShot) : null;
                          
                          // Get previous shot's version for inherited start frames
                          const previousShot = getPreviousConnectedShot(scene.id, shotIndex);
                          const previousShotVersion = previousShot ? getShotVersion(previousShot) : null;

                          return (
                            <React.Fragment key={shot.id}>
                              <SortableShotCard
                                key={shot.id}
                                shot={shot}
                                shotIndex={shotIndex}
                                sceneModel={scene.videoModel || defaultVideoModel || availableVideoModels[0]?.name || 'kling'}
                                sceneImageModel={scene.imageModel || defaultImageModel || availableImageModels[0]?.name || 'nano-banana'}
                                defaultVideoModel={defaultVideoModel}
                                version={version}
                                nextShotVersion={nextShotVersion}
                                previousShotVersion={previousShotVersion}
                                referenceImage={referenceImage}
                                isGenerating={isGeneratingShot}
                                isGeneratingStart={isGeneratingStart}
                                isGeneratingEnd={isGeneratingEnd}
                                narrativeMode={narrativeMode}
                                characters={characters}
                                locations={locations}
                                isCommerceMode={isCommerceMode}
                                isConnectedToNext={isConnectedToNext}
                                availableImageModels={availableImageModels}
                                availableVideoModels={availableVideoModels}
                                showEndFrame={showEndFrame}
                                isPartOfConnection={isPartOfConnection}
                                isStartFrameInherited={isStartFrameInherited}
                                onSelectShot={handleSelectShot}
                                onExpandImage={(imageUrl) => setExpandedImageUrl(imageUrl)}
                                onGenerateShot={handleGenerateShotWithLoading}
                                onRegenerateShot={handleRegenerateShotWithLoading}
                                onUpdatePrompt={handleUpdatePrompt}
                                onUpdateShot={onUpdateShot}
                                onUpdateShotVersion={onUpdateShotVersion}
                                onUploadReference={handleUploadReference}
                                onDeleteReference={handleDeleteReference}
                                onUpdateVideoPrompt={handleUpdateVideoPrompt}
                                onUpdateVideoDuration={handleUpdateVideoDuration}
                                onDeleteShot={onDeleteShot}
                                onAnimateShot={handleAnimateShot}
                                isGeneratingVideo={generatingVideos.has(shot.id)}
                                shotsCount={sceneShots.length}
                                shotVersions={shotVersions[shot.id] || []}
                                onSelectVersion={onSelectVersion}
                              />
                              {/* Connection Link Icon and Add Shot Button */}
                              <div key={`connection-${shot.id}`} className="relative shrink-0 w-8 flex items-center justify-center">
                                {/* Connection Link Icon - Always visible when connected (Start-End Mode Only) */}
                                {((isCommerceMode && shot.shotType === 'start-end') || (!isCommerceMode && narrativeMode === "start-end")) && isConnectedToNext ? (
                                  <div 
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-storia text-white shadow-md"
                                    data-testid={`connection-link-${shot.id}`}
                                    title="Connected shots"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                ) : shotIndex < sceneShots.length - 1 ? (
                                  /* Transition Control with Add Shot - Between non-connected shots */
                                  <div className="flex flex-col items-center gap-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          className="flex flex-col items-center justify-center w-10 gap-0.5 py-1 rounded-md bg-muted/50 hover:bg-muted border border-dashed border-muted-foreground/30 hover:border-purple-500/50 transition-colors"
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
                                                <Check className="h-3 w-3 text-purple-400" />
                                              )}
                                            </Button>
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    {onAddShot && (
                                      <button
                                        onClick={() => onAddShot(scene.id, shotIndex)}
                                        className="flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-dashed border-muted-foreground/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors"
                                        data-testid={`button-add-shot-between-${shotIndex}`}
                                        title="Insert shot here"
                                      >
                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Add Shot Button - Always visible at end of row */}
                        {onAddShot && (
                          <div className="shrink-0 flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-32 w-24 flex flex-col gap-2 border-dashed border-2 border-muted-foreground/30 hover:border-purple-500/50 hover:bg-purple-500/5"
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
                                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/10 border-purple-500/50" 
                                      : "bg-muted/50 border-muted-foreground/20 hover:border-purple-500/50"
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
                                            shot.speedProfile === 'smooth' && "bg-purple-500/20 border-purple-500/30 text-purple-300",
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
                                    <div className="shrink-0">
                                      <Link2 className="h-3 w-3 text-primary" />
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
          </React.Fragment>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          IMAGE EDITOR DIALOG - Professional Creative Suite Layout
          ═══════════════════════════════════════════════════════════════════════════ */}
      {selectedShot && (
        <Dialog open={!!selectedShot} onOpenChange={() => {
          setSelectedShot(null);
          setPreviewVersions({});
          setEditReferenceImages([]);
          setEditChange("");
          setActiveCategory(null);
          setSelectedCharacterId("");
          setSelectedEditingModel("nano-banana");
          setActiveFrameInDialog("start");
          setFrameToEdit(null);
          setCameraRotation(0);
          setCameraVertical(0);
          setCameraZoom(0);
          setCameraWideAngle(false);
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
                      onClick={() => setActiveFrameInDialog("start")}
                      disabled={!getPreviewedVersion(selectedShot)?.startFrameUrl}
                      className={`h-8 px-4 rounded-md transition-all ${
                        activeFrameInDialog === "start" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      data-testid="button-select-start-frame"
                    >
                      Start Frame
                            </Button>
                  <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveFrameInDialog("end")}
                      disabled={!getPreviewedVersion(selectedShot)?.endFrameUrl}
                      className={`h-8 px-4 rounded-md transition-all ${
                        activeFrameInDialog === "end" 
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg" 
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
                          ? "bg-gradient-to-br from-purple-600/30 to-pink-600/30 text-white"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      data-testid={`button-tool-${tool.id}`}
                    >
                      {activeCategory === tool.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r" />
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
                    // Skip video display and go directly to image
                    let imageUrl = version.imageUrl;
                    if (narrativeMode === "start-end") {
                      imageUrl = activeFrameInDialog === "start" 
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
                            <SelectValue />
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
                              className="w-full h-32 bg-[hsl(240,8%,10%)] border border-[hsl(240,5%,20%)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
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
                              className="w-full h-20 border-2 border-dashed border-[hsl(240,5%,20%)] rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-purple-500/50 hover:text-white transition-colors"
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
                              {(() => {
                                const version = getPreviewedVersion(selectedShot);
                                let frameCharacterIds: string[] | null = null;
                                
                                if (version) {
                                  if (narrativeMode === "start-end") {
                                    if (activeFrameInDialog === "start") {
                                      frameCharacterIds = version.startFrameCharacters || version.characters || null;
                                    } else if (activeFrameInDialog === "end") {
                                      frameCharacterIds = version.endFrameCharacters || version.characters || null;
                                    }
                                  } else {
                                    frameCharacterIds = version.characters || null;
                                  }
                                }
                                
                                const isFiltered = frameCharacterIds && frameCharacterIds.length > 0;
                                const totalChars = characters.length;
                                const filteredCount = isFiltered ? (frameCharacterIds?.length ?? 0) : totalChars;
                                
                                if (isFiltered && filteredCount < totalChars) {
                                  return (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground/70">
                                      ({filteredCount} of {totalChars} in frame)
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </Label>
                            {(() => {
                              // Get the previewed version to check which characters are in this frame
                              const version = getPreviewedVersion(selectedShot);
                              let frameCharacterIds: string[] | null = null;
                              
                              if (version) {
                                if (narrativeMode === "start-end") {
                                  // For start-end mode, use frame-specific character tracking
                                  if (activeFrameInDialog === "start") {
                                    frameCharacterIds = version.startFrameCharacters || version.characters || null;
                                  } else if (activeFrameInDialog === "end") {
                                    frameCharacterIds = version.endFrameCharacters || version.characters || null;
                                  }
                                } else {
                                  // For image-reference mode, use general characters
                                  frameCharacterIds = version.characters || null;
                                }
                              }
                              
                              // Filter characters to only show those in the current frame
                              // If no character data exists in version, show all characters (fallback for older versions)
                              const availableCharacters = frameCharacterIds && frameCharacterIds.length > 0
                                ? characters.filter(char => frameCharacterIds!.includes(char.id))
                                : characters; // Fallback: show all if no tracking data exists
                              
                              // Debug log (can be removed later)
                              if (process.env.NODE_ENV === 'development') {
                                console.log('[Image Editor] Character filtering:', {
                                  versionId: version?.id,
                                  narrativeMode,
                                  activeFrame: activeFrameInDialog,
                                  frameCharacterIds,
                                  totalCharacters: characters.length,
                                  filteredCharacters: availableCharacters.length,
                                });
                              }
                              
                              return availableCharacters.length > 0 ? (
                                <div className="space-y-2">
                                  {availableCharacters.map((char) => (
                                  <button
                                    key={char.id}
                                    onClick={() => setSelectedCharacterId(char.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all overflow-hidden ${
                                      selectedCharacterId === char.id
                                        ? "border-purple-500 bg-purple-500/10"
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
                                      <Check className="h-4 w-4 text-purple-500 shrink-0" />
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
                                    className="w-full h-24 bg-[hsl(240,8%,10%)] border border-[hsl(240,5%,20%)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
                                            ? "border-purple-500 bg-purple-500/10 text-white"
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
                                            ? "border-purple-500 bg-purple-500/10 text-white"
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
                              className="w-full h-24 bg-[hsl(240,8%,10%)] border border-[hsl(240,5%,20%)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
                                className="w-full h-1.5 bg-[hsl(240,8%,15%)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
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
                                className="w-full h-1.5 bg-[hsl(240,8%,15%)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
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
                                className="w-full h-1.5 bg-[hsl(240,8%,15%)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between py-2">
                              <span className="text-xs text-muted-foreground">Wide-Angle Lens</span>
                              <Switch
                                checked={cameraWideAngle}
                                onCheckedChange={setCameraWideAngle}
                                className="data-[state=checked]:bg-purple-600"
                              />
                            </div>
                          </div>
                          
                          <div className="h-px bg-[hsl(240,5%,15%)]" />
                          
                          <div>
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Presets</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {CAMERA_ANGLE_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => {
                                    setCameraRotation(preset.rotation);
                                    setCameraVertical(preset.vertical);
                                    setCameraZoom(preset.zoom);
                                    setCameraWideAngle(preset.wideAngle || false);
                                  }}
                                  className="p-2 rounded-lg border border-[hsl(240,5%,20%)] text-xs text-muted-foreground hover:text-white hover:border-[hsl(240,5%,30%)] transition-colors"
                                >
                                  <span className="mr-1">{preset.icon}</span>
                                  {preset.label}
                                </button>
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
                                      ? "border-purple-500 bg-purple-500/10"
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
                                if (activeFrameInDialog === "start" && !version.startFrameUrl && version.endFrameUrl) {
                                  setActiveFrameInDialog("end");
                                } else if (activeFrameInDialog === "end" && !version.endFrameUrl && version.startFrameUrl) {
                                  setActiveFrameInDialog("start");
                                }
                              }
                            }}
                            className={`relative group shrink-0 w-20 cursor-pointer transition-all ${
                              isPreviewed || (isActive && !previewVersions[selectedShot.id])
                                ? "ring-2 ring-purple-500 rounded-lg scale-105"
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
                              isActive ? "bg-purple-600 text-white" : "bg-[hsl(240,8%,15%)] text-muted-foreground"
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
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Set Active
                    </Button>
                    )}
                    
                    {/* Apply Edit / Regenerate */}
                  <Button
                    onClick={handleGenerateFromDialog}
                      disabled={isEditing || !!(activeCategory && !editChange && activeCategory !== "camera")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-generate-from-dialog"
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

      {/* Full Image Dialog */}
      <Dialog open={!!expandedImageUrl} onOpenChange={(open) => !open && setExpandedImageUrl(null)}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
          {expandedImageUrl && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={expandedImageUrl}
                alt="Full size image"
                className="max-w-full max-h-full object-contain"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 h-10 w-10 bg-background/80 text-muted-foreground hover:text-white"
                onClick={() => setExpandedImageUrl(null)}
                data-testid="button-close-expanded-image"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
