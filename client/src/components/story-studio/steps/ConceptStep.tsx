// Concept Step - Redesigned Layout
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { ImageModelSelector } from "../shared/ImageModelSelector";
import { VideoModelSelector } from "../shared/VideoModelSelector";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageModelConfig, getDefaultImageModel } from "@/constants/image-models";
import { getVideoModelConfig, getDefaultVideoModel } from "@/constants/video-models";
import { 
  Ratio,
  Clock,
  Mic,
  Palette,
  Image as ImageIcon,
  Video,
  MonitorPlay,
  Wand2,
  RefreshCw,
  Lightbulb,
  Sparkles,
  Zap,
  AlignLeft,
  Settings2,
  Upload,
  X
} from "lucide-react";
import { StoryStudioState, StoryTemplate } from "../types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";

interface ConceptStepProps {
  template: StoryTemplate;
  // State
  projectName: string;
  projectFolder: string;  // Full folder name with timestamp
  isProjectLocked: boolean;
  topic: string;
  aiPrompt: string;
  aspectRatio: string;
  duration: number;
  voiceoverEnabled: boolean;
  language: 'ar' | 'en';
  textOverlayEnabled: boolean;
  textOverlay: 'minimal' | 'key-points' | 'full';
  textOverlayStyle: 'modern' | 'cinematic' | 'bold';
  pacing: 'slow' | 'medium' | 'fast';
  imageModel: string;
  imageStyle: 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist';
  styleReferenceUrl: string; // Custom style reference image URL (locks visual style)
  characterReferenceUrl: string; // Character/face reference image URL
  imageResolution: string;
  animationMode: 'off' | 'transition' | 'video';
  videoModel: string;
  videoResolution: string;
  
  isGenerating: boolean;
  
  // Handlers
  onProjectNameChange: (name: string) => void;
  onTopicChange: (topic: string) => void;
  onAiPromptChange: (prompt: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onVoiceoverChange: (enabled: boolean) => void;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onPacingChange: (pacing: 'slow' | 'medium' | 'fast') => void;
  onTextOverlayEnabledChange: (enabled: boolean) => void;
  onTextOverlayChange: (overlay: 'minimal' | 'key-points' | 'full') => void;
  onTextOverlayStyleChange: (style: 'modern' | 'cinematic' | 'bold') => void;
  onImageModelChange: (model: string) => void;
  onImageStyleChange: (style: 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist') => void;
  onStyleReferenceUrlChange: (url: string) => void;
  onCharacterReferenceUrlChange: (url: string) => void;
  onImageResolutionChange: (res: string) => void;
  onAnimationModeChange: (mode: 'off' | 'transition' | 'video') => void;
  onVideoModelChange: (model: string) => void;
  onVideoResolutionChange: (res: string) => void;
  
  onGenerateIdea: () => void;
  onGenerateScript: () => void; // Used by "Go to Script" button in parent
  accentColor?: string;
}

const ASPECT_RATIOS = [
  { value: '9:16', label: 'Vertical', desc: 'TikTok, Reels', icon: '📱' },
  { value: '16:9', label: 'Horizontal', desc: 'YouTube', icon: '💻' },
  { value: '1:1', label: 'Square', desc: 'Instagram', icon: '🔲' },
  { value: '4:5', label: 'Portrait', desc: 'Feed Posts', icon: '🖼️' },
];

const DURATIONS = [15, 30, 45, 60];

const TEXT_OVERLAY_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'bold', label: 'Bold' },
];

const PACING_OPTIONS = [
  { value: 'slow', label: 'Slow', emoji: '🐢' },
  { value: 'medium', label: 'Medium', emoji: '⚡' },
  { value: 'fast', label: 'Fast', emoji: '🚀' },
];

const IMAGE_MODELS = [
  { value: 'runware:nano-banana', label: 'Nano Banana' },
  { value: 'runware:photon', label: 'Photon' },
];

const IMAGE_STYLES = [
  { value: 'photorealistic', label: 'Photo', desc: 'Realistic', icon: '📷', gradient: 'from-gray-500 to-gray-700' },
  { value: 'cinematic', label: 'Cinematic', desc: 'Film Look', icon: '🎬', gradient: 'from-amber-600 to-orange-700' },
  { value: '3d-render', label: '3D', desc: 'Rendered', icon: '🎮', gradient: 'from-blue-500 to-cyan-600' },
  { value: 'digital-art', label: 'Digital', desc: 'Artistic', icon: '🎨', gradient: 'from-purple-500 to-pink-600' },
  { value: 'anime', label: 'Anime', desc: 'Japanese', icon: '🌸', gradient: 'from-pink-400 to-rose-500' },
  { value: 'illustration', label: 'Illust.', desc: 'Drawn', icon: '✏️', gradient: 'from-emerald-500 to-teal-600' },
  { value: 'watercolor', label: 'Watercolor', desc: 'Painted', icon: '🎭', gradient: 'from-sky-400 to-indigo-500' },
  { value: 'minimalist', label: 'Minimal', desc: 'Clean', icon: '◻️', gradient: 'from-slate-400 to-slate-600' },
];

export function ConceptStep({
  template,
  projectName,
  projectFolder,
  isProjectLocked,
  topic,
  aiPrompt,
  aspectRatio,
  duration,
  voiceoverEnabled,
  language,
  textOverlayEnabled,
  textOverlay,
  textOverlayStyle,
  pacing,
  imageModel,
  imageStyle,
  styleReferenceUrl,
  characterReferenceUrl,
  imageResolution,
  animationMode,
  videoModel,
  videoResolution,
  isGenerating,
  
  onProjectNameChange,
  onTopicChange,
  onAiPromptChange,
  onAspectRatioChange,
  onDurationChange,
  onVoiceoverChange,
  onLanguageChange,
  onPacingChange,
  onTextOverlayEnabledChange,
  onTextOverlayChange,
  onTextOverlayStyleChange,
  onImageModelChange,
  onImageStyleChange,
  onStyleReferenceUrlChange,
  onCharacterReferenceUrlChange,
  onImageResolutionChange,
  onAnimationModeChange,
  onVideoModelChange,
  onVideoResolutionChange,
  
  onGenerateIdea,
  accentColor = "primary"
}: ConceptStepProps) {

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  // Get current workspace for proper file storage paths
  const { currentWorkspace } = useWorkspace();

  // Get current image model config with fallback to default
  const selectedImageModel = getImageModelConfig(imageModel) || getDefaultImageModel();
  
  // Get current video model config with fallback to default
  const selectedVideoModel = getVideoModelConfig(videoModel) || getDefaultVideoModel();

  // Check if current model supports reference images
  const supportsStyleReference = selectedImageModel?.supportsStyleReference ?? false;
  const supportsCharacterReference = selectedImageModel?.supportsCharacterReference ?? false;
  const maxReferenceImages = selectedImageModel?.maxReferenceImages ?? 0;

  // Style reference upload state
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingStyle, setIsUploadingStyle] = useState(false);
  const [isUploadingCharacter, setIsUploadingCharacter] = useState(false);

  const handleStyleUpload = async (file: File) => {
    // Require project name before uploading
    if (!projectName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project name before uploading files",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingStyle(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', currentWorkspace?.id || 'default');
      formData.append('projectName', projectFolder); // Use projectFolder (with timestamp) for consistent storage

      const response = await fetch('/api/problem-solution/style-reference/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onStyleReferenceUrlChange(data.url);
      
      toast({
        title: "Style uploaded",
        description: "Your reference image will guide the AI style",
      });
    } catch (error) {
      console.error('Style upload error:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload style reference image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingStyle(false);
    }
  };

  const handleRemoveStyleReference = () => {
    onStyleReferenceUrlChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Character reference upload handler
  const handleCharacterUpload = async (file: File) => {
    // Require project name before uploading
    if (!projectName.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project name before uploading files",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingCharacter(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', currentWorkspace?.id || 'default');
      formData.append('projectName', projectFolder);
      formData.append('type', 'character'); // Indicate this is a character reference

      const response = await fetch('/api/problem-solution/style-reference/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('[ConceptStep] Character upload response:', { url: data.url });
      onCharacterReferenceUrlChange(data.url);
      console.log('[ConceptStep] Called onCharacterReferenceUrlChange with:', data.url);
      
      toast({
        title: "Character uploaded",
        description: "This character will appear in your generated images",
      });
    } catch (error) {
      console.error('Character upload error:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload character reference image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCharacter(false);
    }
  };

  const handleRemoveCharacterReference = () => {
    onCharacterReferenceUrlChange('');
    if (characterInputRef.current) {
      characterInputRef.current.value = '';
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* 
        LEFT COLUMN: SETTINGS (40% width like ASMR)
      */}
      <div className={cn(
        "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
        "bg-black/40 backdrop-blur-xl",
        "border-r border-white/[0.06]",
        "flex flex-col overflow-hidden"
      )}>
        {/* Scrollable Content */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">

        {/* Project Name */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-3">
            <AlignLeft className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Project Name</h3>
            <span className={cn(
              "text-[10px] ml-auto",
              isProjectLocked ? "text-amber-400/70" : "text-red-400/70"
            )}>
              {isProjectLocked ? "🔒 Locked" : "* Required"}
            </span>
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="Enter project name..."
            disabled={isProjectLocked}
            className={cn(
              "w-full px-4 py-3 rounded-lg",
              "bg-white/[0.03] border border-white/10",
              "text-white placeholder:text-white/30",
              "focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50",
              "transition-all duration-200",
              isProjectLocked && "opacity-60 cursor-not-allowed bg-white/[0.01]"
            )}
          />
          <p className={cn(
            "mt-2 text-[10px]",
            isProjectLocked ? "text-amber-400/60" : "text-white/40"
          )}>
            {isProjectLocked 
              ? "Project name cannot be changed after starting" 
              : "Required before uploading files or proceeding"
            }
          </p>
        </GlassPanel>
        
        {/* BOX 1: Image Model + Aspect Ratio + Resolution */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Image Settings</h3>
          </div>
          
          <div className="space-y-6">
            {/* Image Model Selector */}
            {selectedImageModel && (
              <ImageModelSelector
                value={imageModel}
                onChange={onImageModelChange}
                selectedModelInfo={selectedImageModel}
              />
            )}

            {/* Image Style - Disabled when custom style reference is uploaded */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Visual Style</label>
                {styleReferenceUrl && (
                  <span className="text-[10px] text-amber-400/80 font-medium">Using custom reference</span>
                )}
              </div>
              <div className={cn(
                "grid grid-cols-4 gap-2",
                styleReferenceUrl && "opacity-40 pointer-events-none"
              )}>
                {IMAGE_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => onImageStyleChange(style.value as any)}
                    disabled={!!styleReferenceUrl}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 overflow-hidden",
                      imageStyle === style.value 
                        ? "border-white/30 bg-white/10"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10",
                      styleReferenceUrl && "cursor-not-allowed"
                    )}
                  >
                    {/* Gradient background on selection */}
                    {imageStyle === style.value && (
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-20",
                        style.gradient
                      )} />
                    )}
                    
                    {/* Icon */}
                    <span className={cn(
                      "text-xl transition-transform duration-200",
                      imageStyle === style.value ? "scale-110" : "group-hover:scale-105"
                    )}>
                      {style.icon}
                    </span>
                    
                    {/* Label */}
                    <span className={cn(
                      "text-[10px] font-medium transition-colors",
                      imageStyle === style.value ? "text-white" : "text-white/60"
                    )}>
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Style Reference Upload - Only show if model supports it */}
            {supportsStyleReference ? (
              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Style Reference (Optional)</label>
                
                {styleReferenceUrl ? (
                // Show uploaded image preview
                <div className="relative group">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20 bg-black/40">
                    <img 
                      src={styleReferenceUrl} 
                      alt="Style reference" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white/80 font-medium">Custom Style Active</p>
                      <p className="text-[10px] text-white/50">AI will match this visual style</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveStyleReference}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove style reference"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                // Upload area
                <div 
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
                    isUploadingStyle 
                      ? "border-white/30 bg-white/10" 
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  )}
                  onClick={() => !isUploadingStyle && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleStyleUpload(file);
                    }}
                    disabled={isUploadingStyle}
                  />
                  
                  {isUploadingStyle ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-white/60 animate-spin" />
                      <span className="text-xs text-white/60">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-white/40" />
                      <div>
                        <p className="text-xs text-white/60 font-medium">Upload reference image</p>
                        <p className="text-[10px] text-white/40 mt-0.5">AI will generate images in this style</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            ) : (
              <div className="text-xs text-white/40 italic p-4 border border-white/5 rounded-xl bg-white/[0.02]">
                ℹ️ This model supports text-to-image only. Reference images are not available.
              </div>
            )}

            {/* Character Reference Upload - Only show if model supports it */}
            {supportsCharacterReference && (
              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Character Reference (Optional)</label>
                
                {characterReferenceUrl ? (
                // Show uploaded character preview
                <div className="relative group">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/20 bg-black/40">
                    <img 
                      src={characterReferenceUrl} 
                      alt="Character reference" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white/80 font-medium">Character Reference Active</p>
                      <p className="text-[10px] text-white/50">This character will appear in images</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCharacterReference}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove character reference"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                // Upload area
                <div 
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
                    isUploadingCharacter 
                      ? "border-white/30 bg-white/10" 
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  )}
                  onClick={() => !isUploadingCharacter && characterInputRef.current?.click()}
                >
                  <input
                    ref={characterInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCharacterUpload(file);
                    }}
                    disabled={isUploadingCharacter}
                  />
                  
                  {isUploadingCharacter ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-white/60 animate-spin" />
                      <span className="text-xs text-white/60">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-white/40" />
                      <div>
                        <p className="text-xs text-white/60 font-medium">Upload character image</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Face or character to include in images</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-3">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.value}
                    onClick={() => onAspectRatioChange(ratio.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                      aspectRatio === ratio.value 
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "rounded border border-white/30 transition-all",
                      ratio.value === '9:16' && "w-3 h-5",
                      ratio.value === '16:9' && "w-5 h-3",
                      ratio.value === '1:1' && "w-4 h-4",
                      ratio.value === '4:5' && "w-3.5 h-4.5",
                      aspectRatio === ratio.value && "border-white bg-white/20"
                    )} />
                    <div className="text-center">
                      <span className="block text-xs font-medium text-white">{ratio.label}</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">{ratio.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution - Always show if model has resolutions */}
            {selectedImageModel && selectedImageModel.resolutions.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Resolution</label>
                <div className={cn(
                  "grid gap-3",
                  selectedImageModel.resolutions.length === 1 ? "grid-cols-1" :
                  selectedImageModel.resolutions.length === 2 ? "grid-cols-2" :
                  selectedImageModel.resolutions.length === 3 ? "grid-cols-3" :
                  "grid-cols-4"
                )}>
                  {selectedImageModel.resolutions.map(res => {
                    const labels: Record<string, string> = {
                      "1k": "1K",
                      "2k": "2K",
                      "4k": "4K",
                      "custom": "Auto",
                    };
                    return (
                      <button
                        key={res}
                        onClick={() => onImageResolutionChange(res)}
                        className={cn(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                          imageResolution === res 
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <span className="text-sm font-medium text-white">{labels[res] || res}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* BOX 2: Duration + Pacing */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Duration & Pacing</h3>
          </div>
          
          <div className="space-y-6">
            {/* Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Duration</label>
                <span className="text-xs font-mono text-white/70 bg-white/10 px-2 py-0.5 rounded">{duration}s</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => onDurationChange(d)}
                    className={cn(
                      "py-2.5 rounded-lg text-sm font-medium border transition-all duration-200",
                      duration === d
                        ? cn("bg-gradient-to-br border-white/20 shadow-lg", accentClasses)
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Pacing */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Pacing</label>
              <div className="grid grid-cols-3 gap-3">
                {PACING_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => onPacingChange(option.value as any)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200",
                      pacing === option.value
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <span className="text-base">{option.emoji}</span>
                    <span className="text-sm font-medium text-white">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* BOX 3: Voiceover */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Voiceover</h3>
          </div>
          
          <div className="space-y-4">
            {/* Voiceover Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Enable Voiceover</label>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => onVoiceoverChange(true)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    voiceoverEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  On
                </button>
                <button
                  onClick={() => onVoiceoverChange(false)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    !voiceoverEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Off
                </button>
              </div>
            </div>
            
            {/* Conditional Settings when Voiceover is ON */}
            {voiceoverEnabled && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                {/* Language */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Language</label>
                  <div className="relative">
                    <select 
                      value={language}
                      onChange={(e) => onLanguageChange(e.target.value as 'ar' | 'en')}
                      className={cn(
                        "w-full appearance-none",
                        "bg-white/[0.03] hover:bg-white/[0.06]",
                        "border border-white/10 hover:border-white/20",
                        "rounded-xl px-4 py-3",
                        "text-sm text-white font-medium",
                        "focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10",
                        "transition-all duration-200 cursor-pointer",
                        "pr-10" // Space for arrow
                      )}
                    >
                      <option value="en" className="bg-zinc-900 text-white">🇺🇸  English (US)</option>
                      <option value="ar" className="bg-zinc-900 text-white">🇸🇦  العربية (Arabic)</option>
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg 
                        className="w-4 h-4 text-white/40" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Text Overlay Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Text Overlay</label>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => onTextOverlayEnabledChange(true)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          textOverlayEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        onClick={() => onTextOverlayEnabledChange(false)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !textOverlayEnabled ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Overlay Style (only when enabled) */}
                {textOverlayEnabled && (
                  <motion.div 
                    key="text-overlay-styles"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {TEXT_OVERLAY_STYLES.map(style => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => onTextOverlayStyleChange(style.value as any)}
                          className={cn(
                            "py-2.5 px-3 rounded-lg text-sm font-medium border transition-all",
                            textOverlayStyle === style.value
                              ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </GlassPanel>

        {/* BOX 4: Animation Mode */}
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Animation Mode</h3>
          </div>
          
          <div className="space-y-4">
            {/* Animation Mode Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Enable Animation</label>
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => onAnimationModeChange('off')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    animationMode === 'off' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Off
                </button>
                <button
                  onClick={() => onAnimationModeChange('transition')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                    animationMode !== 'off' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                  )}
                >
                  On
                </button>
              </div>
            </div>

            {/* Conditional Sub-options */}
            {animationMode !== 'off' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-4"
              >
                {/* Mode Selector: Transition vs Video */}
                <div className="space-y-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Animation Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onAnimationModeChange('transition')}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-sm font-medium border text-center transition-all",
                        animationMode === 'transition'
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      Transition
                    </button>
                    <button
                      onClick={() => onAnimationModeChange('video')}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-sm font-medium border text-center transition-all",
                        animationMode === 'video'
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      Image to Video
                    </button>
                  </div>
                </div>

                {/* Video Settings (Only if Image to Video) */}
                {animationMode === 'video' && (
                  <div className="space-y-4">
                    {/* Video Model Selector */}
                    {selectedVideoModel && (
                      <VideoModelSelector
                        value={videoModel}
                        onChange={onVideoModelChange}
                        selectedModelInfo={selectedVideoModel}
                      />
                    )}

                    {/* Video Resolution */}
                    {selectedVideoModel && selectedVideoModel.resolutions.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Video Resolution</label>
                        <div className={cn(
                          "grid gap-3",
                          selectedVideoModel.resolutions.length === 1 ? "grid-cols-1" :
                          selectedVideoModel.resolutions.length === 2 ? "grid-cols-2" :
                          selectedVideoModel.resolutions.length === 3 ? "grid-cols-3" :
                          "grid-cols-4"
                        )}>
                          {selectedVideoModel.resolutions.map(res => (
                            <button
                              key={res}
                              onClick={() => onVideoResolutionChange(res)}
                              className={cn(
                                "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-200",
                                videoResolution === res 
                                  ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                                  : "bg-white/5 border-white/10 hover:bg-white/10"
                              )}
                            >
                              <span className="text-sm font-medium text-white">{res}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </GlassPanel>
          </div>
        </ScrollArea>
      </div>

      {/* 
        RIGHT COLUMN: WORKSPACE (60% width like ASMR)
      */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full">
        {/* Top Section - AI Generator */}
        <div className="flex-shrink-0 p-6 border-b border-white/[0.04]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg bg-gradient-to-br",
                accentClasses
              )}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-white">AI Idea Generator</h3>
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                disabled={isGenerating}
                placeholder="Ask AI to write a story about..."
                className={cn(
                  "flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white",
                  "focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all",
                  "placeholder:text-white/30"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGenerating && aiPrompt.trim()) {
                    onGenerateIdea();
                  }
                }}
              />
              
              <Button
                onClick={onGenerateIdea}
                disabled={!aiPrompt.trim() || isGenerating}
                className={cn(
                  "bg-gradient-to-br",
                  accentClasses,
                  "text-white hover:opacity-90 px-5 h-auto py-2.5 rounded-lg font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                )}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    <span>Generate</span>
                  </div>
                )}
              </Button>
            </div>
            
            <p className="text-[10px] text-white/40">
              This will generate a detailed story and fill the "Your Idea" box below.
            </p>
          </div>
        </div>

        {/* Main Content - Your Idea */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-br",
              accentClasses
            )}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Your Idea</h3>
              <p className="text-xs text-white/40">Describe your video concept in detail</p>
            </div>
          </div>
          
          <div className="flex-1 relative rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            <Textarea
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="Write your story idea here, or use the AI generator above to create one..."
              className={cn(
                "w-full h-full bg-transparent border-0 p-5 text-[15px] leading-relaxed",
                "focus:outline-none focus:ring-0 resize-none",
                "placeholder:text-white/20 text-white/90",
                "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
