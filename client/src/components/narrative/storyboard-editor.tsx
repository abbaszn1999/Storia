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
import { renderTextWithMentions } from "./mention-renderer";
import { TextareaWithMentions } from "./textarea-with-mentions";
import { apiRequest } from "@/lib/queryClient";

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
  voiceActorId: string | null;
  voiceOverEnabled: boolean;
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  isCommerceMode?: boolean;
  isLogoMode?: boolean;
  isGeneratingPrompts?: boolean;
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onGenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => void;
  onRegenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => void;
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
}

interface SortableShotCardProps {
  shot: Shot;
  shotIndex: number;
  sceneModel: string | null;
  sceneImageModel: string | null;
  version: NarrativeShotVersion | null;
  nextShotVersion: NarrativeShotVersion | null;
  previousShotVersion: NarrativeShotVersion | null;
  referenceImage: ReferenceImage | null;
  isGenerating: boolean;
  isGeneratingStart?: boolean;
  isGeneratingEnd?: boolean;
  voiceOverEnabled: boolean;
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
  onSelectShot: (shot: Shot) => void;
  onExpandImage?: (imageUrl: string) => void;
  onGenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => void;
  onRegenerateShot: (shotId: string, prompts?: { imagePrompt?: string; videoPrompt?: string }, frame?: 'start' | 'end') => void;
  onUpdatePrompt: (shotId: string, prompt: string) => void;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  onUpdateShotVersion?: (shotId: string, versionId: string, updates: Partial<NarrativeShotVersion>) => void;
  onUploadReference: (shotId: string, file: File) => void;
  onDeleteReference: (shotId: string) => void;
  onUpdateVideoPrompt: (shotId: string, prompt: string) => void;
  onUpdateVideoDuration: (shotId: string, duration: number) => void;
  onDeleteShot?: (shotId: string) => void;
  shotsCount: number;
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
  version,
  nextShotVersion,
  previousShotVersion,
  referenceImage,
  isGenerating,
  isGeneratingStart = false,
  isGeneratingEnd = false,
  voiceOverEnabled,
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

  // Track active tab (image or video)
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");

  const { toast } = useToast();
  
  const [activeFrame, setActiveFrame] = useState<"start" | "end">("start");
  const [advancedImageOpen, setAdvancedImageOpen] = useState(false);
  const [advancedVideoOpen, setAdvancedVideoOpen] = useState(false);
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
        {/* Start/End Frame Tab Selector (Start-End Mode Only) */}
        {effectiveMode === "start-end" && (
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
          {displayImageUrl && (
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

                      {/* Seed */}
                      <div className="space-y-1 mb-3">
                        <Label className="text-xs text-muted-foreground">Seed (optional)</Label>
                        <Input
                          type="number"
                          value={
                            activeFrame === "start"
                              ? (version?.startFrameSeed ?? "")
                              : (version?.endFrameSeed ?? "")
                          }
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : parseInt(e.target.value);
                            if (onUpdateShotVersion) {
                              onUpdateShotVersion(shot.id, version?.id || "", {
                                ...(activeFrame === "start"
                                  ? { startFrameSeed: value }
                                  : { endFrameSeed: value }),
                              });
                            }
                          }}
                          placeholder="Random seed"
                          className="h-8 text-xs bg-white/[0.02] border-white/[0.06]"
                          data-testid={`input-${activeFrame}-seed-${shot.id}`}
                        />
                      </div>

                      {/* Guidance Scale */}
                      <div className="space-y-1 mb-3">
                        <Label className="text-xs text-muted-foreground">Guidance Scale (optional)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          max="20"
                          value={
                            activeFrame === "start"
                              ? (version?.startFrameGuidanceScale ?? "")
                              : (version?.endFrameGuidanceScale ?? "")
                          }
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : parseFloat(e.target.value);
                            if (onUpdateShotVersion) {
                              onUpdateShotVersion(shot.id, version?.id || "", {
                                ...(activeFrame === "start"
                                  ? { startFrameGuidanceScale: value }
                                  : { endFrameGuidanceScale: value }),
                              });
                            }
                          }}
                          placeholder="7.5"
                          className="h-8 text-xs bg-white/[0.02] border-white/[0.06]"
                          data-testid={`input-${activeFrame}-guidance-${shot.id}`}
                        />
                      </div>

                      {/* Steps */}
                      <div className="space-y-1 mb-3">
                        <Label className="text-xs text-muted-foreground">Steps (optional)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={
                            activeFrame === "start"
                              ? (version?.startFrameSteps ?? "")
                              : (version?.endFrameSteps ?? "")
                          }
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : parseInt(e.target.value);
                            if (onUpdateShotVersion) {
                              onUpdateShotVersion(shot.id, version?.id || "", {
                                ...(activeFrame === "start"
                                  ? { startFrameSteps: value }
                                  : { endFrameSteps: value }),
                              });
                            }
                          }}
                          placeholder="20"
                          className="h-8 text-xs bg-white/[0.02] border-white/[0.06]"
                          data-testid={`input-${activeFrame}-steps-${shot.id}`}
                        />
                      </div>

                      {/* Strength */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Strength (optional)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={
                            activeFrame === "start"
                              ? (version?.startFrameStrength ?? "")
                              : (version?.endFrameStrength ?? "")
                          }
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : parseFloat(e.target.value);
                            if (onUpdateShotVersion) {
                              onUpdateShotVersion(shot.id, version?.id || "", {
                                ...(activeFrame === "start"
                                  ? { startFrameStrength: value }
                                  : { endFrameStrength: value }),
                              });
                            }
                          }}
                          placeholder="0.8"
                          className="h-8 text-xs bg-white/[0.02] border-white/[0.06]"
                          data-testid={`input-${activeFrame}-strength-${shot.id}`}
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
                    onClick={() => onSelectShot(shot)}
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
                    onValueChange={(value) => onUpdateShot(shot.id, { videoModel: value === "scene-default" ? null : value })}
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
                    value={version?.videoDuration?.toString() || ""}
                    onValueChange={(value) => onUpdateVideoDuration(shot.id, parseInt(value))}
                    disabled={!shot.videoModel && !sceneModel}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30" data-testid={`select-video-duration-${shot.id}`}>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/[0.06]">
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
                    className="min-h-[60px] text-xs resize-none bg-white/[0.02] border-white/[0.06] focus:border-purple-500/50"
                    data-testid={`textarea-sound-effects-${shot.id}`}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
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
  narrativeMode,
  scenes,
  shots,
  shotVersions,
  referenceImages,
  characters,
  locations = [],
  voiceActorId,
  voiceOverEnabled,
  continuityLocked,
  continuityGroups,
  isCommerceMode = false,
  isLogoMode = false,
  isGeneratingPrompts = false,
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
  // Track generating state by shot ID and frame type (e.g., "shotId:start" or "shotId:end")
  const [generatingShots, setGeneratingShots] = useState<Set<string>>(new Set());
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
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
  const getShotVersion = (shot: Shot): NarrativeShotVersion | null => {
    if (!shot.currentVersionId) return null;
    const versions = shotVersions[shot.id] || [];
    return versions.find((v) => v.id === shot.currentVersionId) || null;
  };

  // Helper to get the version being previewed (or active version if no preview)
  const getPreviewedVersion = (shot: Shot): NarrativeShotVersion | null => {
    const versions = shotVersions[shot.id] || [];
    const previewId = previewVersions[shot.id];
    if (previewId) {
      const preview = versions.find((v) => v.id === previewId);
      if (preview) return preview;
    }
    return getShotVersion(shot);
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

  // Helper: Get the next connected shot in a continuity group
  const getNextConnectedShot = (sceneId: string, shotIndex: number): Shot | null => {
    if (narrativeMode !== "start-end" || !continuityLocked) return null;
    
    const sceneGroups = continuityGroups[sceneId] || [];
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
    
    const sceneGroups = continuityGroups[sceneId] || [];
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
    
    const sceneGroups = continuityGroups[sceneId] || [];
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
    const sceneShots = localShots[sceneId] || [];
    if (sceneShots.length === 0) {
      toast({
        title: "No Shots",
        description: "This scene has no shots to generate.",
        variant: "destructive",
      });
      return;
    }

    const sceneGroups = continuityGroups[sceneId] || [];
    
    // Determine which shots need generation and in what order
    const shotsToGenerate: Array<{ shot: Shot; frame?: 'start' | 'end' }> = [];
    
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
          if (!version || !version.endFrameUrl) {
            shotsToGenerate.push({ shot, frame: 'end' });
          }
        } else {
          // First in group or standalone: generate start frame first, then end frame
          if (!version || !version.startFrameUrl) {
            shotsToGenerate.push({ shot, frame: 'start' });
          }
          // Add end frame if start exists but end doesn't
          if (version && version.startFrameUrl && !version.endFrameUrl) {
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
    for (let i = 0; i < shotsToGenerate.length; i++) {
      const { shot, frame } = shotsToGenerate[i];
      const shotEffectiveMode = narrativeMode === "auto"
        ? (shot.frameMode || "image-reference")
        : narrativeMode;
      
      try {
        // Wait for previous generation to complete
        if (i > 0) {
          // Wait until previous shot is no longer generating
          const previousShot = shotsToGenerate[i - 1];
          const previousFrame = previousShot.frame;
          const previousShotEffectiveMode = narrativeMode === "auto"
            ? (previousShot.shot.frameMode || "image-reference")
            : narrativeMode;
          const previousGeneratingKey = previousShotEffectiveMode === "start-end" && previousFrame
            ? `${previousShot.shot.id}:${previousFrame}`
            : previousShot.shot.id;
          
          while (generatingShots.has(previousGeneratingKey)) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Additional wait to ensure state is fully updated
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Start generation using the wrapper that manages loading state
        const generatingKey = shotEffectiveMode === "start-end" && frame
          ? `${shot.id}:${frame}`
          : shot.id;
        
        // Call the generation function (it will manage generatingShots state)
        await handleGenerateShotWithLoading(shot.id, undefined, frame);
        
        // Wait for generation to complete by polling the generating state
        // handleGenerateShotWithLoading manages the state, but we wait a bit to ensure it's updated
        let attempts = 0;
        const maxAttempts = 120; // 60 seconds max (500ms * 120)
        
        while (generatingShots.has(generatingKey) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          
          // Also check if the image was actually generated (early exit if successful)
          const currentVersion = getShotVersion(shot);
          
          if (currentVersion) {
            if (shotEffectiveMode === "image-reference") {
              if (currentVersion.imageUrl) {
                break; // Image generated successfully
              }
            } else {
              // Start-end mode
              if (frame === 'start' && currentVersion.startFrameUrl) {
                break; // Start frame generated successfully
              } else if (frame === 'end' && currentVersion.endFrameUrl) {
                break; // End frame generated successfully
              }
            }
          }
        }
        
        if (attempts >= maxAttempts) {
          console.warn(`Generation timeout for shot ${shot.id}, frame ${frame}`);
          toast({
            title: "Generation Timeout",
            description: `Generation for shot #${shot.shotNumber} took too long. Continuing with next shot...`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`Failed to generate frame for shot ${shot.id}:`, error);
        toast({
          title: "Generation Error",
          description: `Failed to generate frame for shot #${shot.shotNumber}. Continuing with next shot...`,
          variant: "destructive",
        });
        
        // Error handling is done by handleGenerateShotWithLoading's finally block
      }
    }
    
    toast({
      title: "Generation Complete",
      description: `Finished generating ${shotsToGenerate.length} frame(s) for scene.`,
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
            {/* Voice Actor and Voice Over - Hidden in Commerce/Logo Mode */}
            {!isCommerceMode && !isLogoMode && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Voice Actor</Label>
                  <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={voiceDropdownOpen}
                        className="w-48 h-9 justify-between bg-white/[0.02] border-white/[0.06] hover:border-purple-500/30"
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
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:via-pink-500 data-[state=checked]:to-purple-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-purple-500/30 data-[state=unchecked]:bg-white/[0.06]"
                    data-testid="toggle-voice-over"
                  />
                </div>
              </>
            )}

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
            <>
              <div key={scene.id} className="space-y-4 p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl">
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
                        value={scene.imageModel || availableImageModels[0]?.name || 'nano-banana'}
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
                        onValueChange={(value) => onUpdateScene?.(scene.id, { videoModel: value })}
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
                      disabled={generatingShots.size > 0}
                      data-testid={`button-generate-scene-images-${scene.id}`}
                    >
                      {generatingShots.size > 0 ? (
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
                    
                    <Button
                      size="sm"
                      className="w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                      onClick={() => {
                        toast({
                          title: "Animate Scene",
                          description: `Video animation for all ${sceneShots.length} shots in "${scene.title}" will be implemented in the next phase with AI video models (Kling/Veo/Runway).`,
                        });
                      }}
                      data-testid={`button-animate-scene-${scene.id}`}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Animate Scene's Shots
                    </Button>

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
                                sceneModel={scene.videoModel || availableVideoModels[0]?.name || 'kling'}
                                sceneImageModel={scene.imageModel || availableImageModels[0]?.name || 'nano-banana'}
                                version={version}
                                nextShotVersion={nextShotVersion}
                                previousShotVersion={previousShotVersion}
                                referenceImage={referenceImage}
                                isGenerating={isGeneratingShot}
                                isGeneratingStart={isGeneratingStart}
                                isGeneratingEnd={isGeneratingEnd}
                                voiceOverEnabled={voiceOverEnabled}
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
                                shotsCount={sceneShots.length}
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
          </>
          );
        })}
      </div>

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
          <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
            <div className="relative w-full h-full flex bg-background">
              {/* Left Sidebar - Version History */}
              <div className="w-56 border-r bg-muted/30 flex flex-col p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-1">Shot {selectedShot.shotNumber}</h3>
                  <p className="text-xs text-muted-foreground">Version History</p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                  {shotVersions[selectedShot.id] && shotVersions[selectedShot.id]
                    .sort((a, b) => a.versionNumber - b.versionNumber)
                    .map((version) => {
                      const isActive = version.id === selectedShot.currentVersionId;
                      const isPreviewed = !compareMode && version.id === previewVersions[selectedShot.id];
                      const isSelectedForCompare = compareVersions.includes(version.id);
                      return (
                        <div
                          key={version.id}
                          className={`relative group ${
                            compareMode && isSelectedForCompare 
                              ? "ring-2 ring-purple-500 rounded-md" 
                              : isPreviewed
                              ? "ring-2 ring-purple-500 rounded-md"
                              : isActive
                              ? "ring-2 ring-purple-500/50 rounded-md"
                              : "hover-elevate cursor-pointer"
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
                            
                            {/* Play button overlay for video versions */}
                            {version.videoUrl && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-background/90 rounded-full p-2">
                                  <Play className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Top left badges */}
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            <Badge variant={isActive ? "default" : "secondary"} className="text-xs h-5">
                              {isActive ? "Active" : `v${version.versionNumber}`}
                            </Badge>
                          </div>
                          
                          {/* Bottom left badges - Video/Image type and duration */}
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                            {version.videoUrl ? (
                              <>
                                <Badge variant="secondary" className="text-xs h-5 bg-background/90">
                                  <Video className="h-3 w-3 mr-1" />
                                  {version.videoDuration ? `${version.videoDuration}s` : 'Video'}
                                </Badge>
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-xs h-5 bg-background/90">
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
              <div className="relative flex-1 bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
                {/* Compare Mode Toggle */}
                <div className="absolute top-6 left-6 z-20">
                  <Button
                    variant={compareMode ? "default" : "outline"}
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
                          className="w-full rounded-lg shadow-2xl"
                          data-testid="video-player"
                        />
                      </div>
                    ) : getPreviewedVersion(selectedShot)?.imageUrl ? (
                      <img
                        src={getPreviewedVersion(selectedShot)!.imageUrl!}
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
                ) : (
                  /* Compare Mode View */
                  <div className="flex-1 flex flex-col p-6 pb-32">
                    {/* Synchronized Playback Controls */}
                    {compareVersions.length === 2 && (
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-background/95 backdrop-blur-md rounded-lg border shadow-lg p-3 flex items-center gap-4">
                          <Label className="text-sm text-muted-foreground">Synchronized Playback:</Label>
                          <Button
                            size="sm"
                            variant="outline"
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
                                  <Badge variant="secondary">
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
                                <Badge variant="secondary">
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
                      className="bg-primary hover:bg-primary/90"
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
