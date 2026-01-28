import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, Image, Film, Wand2, Layers, RefreshCw, 
  Settings2, X, Plus, Upload, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { 
  AnimationMode,
  AmbientArtStyle,
  AmbientReferenceImage,
  AmbientVisualRhythm,
} from "./types";
import { 
  ART_STYLE_OPTIONS,
  VISUAL_RHYTHM_OPTIONS,
  VISUAL_ELEMENT_OPTIONS,
} from "./types";

interface Step3StyleSettingsProps {
  // Animation Mode (passed from parent to show conditional UI)
  animationMode: AnimationMode;
  
  // Visual Style
  artStyle: AmbientArtStyle;
  onArtStyleChange: (value: AmbientArtStyle) => void;
  visualElements: string[];
  onVisualElementsChange: (value: string[]) => void;
  visualRhythm: AmbientVisualRhythm;
  onVisualRhythmChange: (value: AmbientVisualRhythm) => void;
  referenceImages: AmbientReferenceImage[];
  onReferenceImagesChange: (value: AmbientReferenceImage[]) => void;
  imageCustomInstructions: string;
  onImageCustomInstructionsChange: (value: string) => void;
  
  // Video Animation Mode settings
  videoModel: string;
  onVideoModelChange: (value: string) => void;
  videoResolution: string;
  onVideoResolutionChange: (value: string) => void;
  motionPrompt: string;
  onMotionPromptChange: (value: string) => void;
}

const VIDEO_MODELS = [
  { value: 'kling-1.6', label: 'Kling 1.6', description: 'Smooth motion' },
  { value: 'seedance-1.5-pro', label: 'Seedance 1.5 Pro', description: 'High quality' },
  { value: 'runway-gen3', label: 'Runway Gen-3', description: 'High fidelity' },
];

const VIDEO_RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p', description: 'HD' },
  { value: '1080p', label: '1080p', description: 'Full HD' },
];

export function Step3StyleSettings({
  animationMode,
  artStyle,
  onArtStyleChange,
  visualElements,
  onVisualElementsChange,
  visualRhythm,
  onVisualRhythmChange,
  referenceImages,
  onReferenceImagesChange,
  imageCustomInstructions,
  onImageCustomInstructionsChange,
  videoModel,
  onVideoModelChange,
  videoResolution,
  onVideoResolutionChange,
  motionPrompt,
  onMotionPromptChange,
}: Step3StyleSettingsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  const addVisualElement = (element: string) => {
    if (!visualElements.includes(element) && visualElements.length < 5) {
      onVisualElementsChange([...visualElements, element]);
    }
  };

  const removeVisualElement = (element: string) => {
    onVisualElementsChange(visualElements.filter(e => e !== element));
  };

  const handleReferenceUploadClick = () => fileInputRef.current?.click();

  const handleReferenceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file (JPEG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 10MB", variant: "destructive" });
      return;
    }
    if (referenceImages.length >= 4) {
      toast({ title: "Maximum images reached", description: "You can upload up to 4 reference images", variant: "destructive" });
      return;
    }
    setIsUploadingRef(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/ambient-visual/upload-reference', { method: 'POST', credentials: 'include', body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Upload failed');
      }
      const data = await response.json() as { tempId: string; previewUrl: string; originalName: string };
      onReferenceImagesChange([...referenceImages, { tempId: data.tempId, previewUrl: data.previewUrl, originalName: data.originalName }]);
      toast({ title: "Image uploaded", description: "Reference image ready for use" });
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingRef(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = async (index: number) => {
    const img = referenceImages[index];
    onReferenceImagesChange(referenceImages.filter((_, i) => i !== index));
    try {
      await fetch(`/api/ambient-visual/upload-reference/${img.tempId}`, { method: 'DELETE', credentials: 'include' });
    } catch {
      // non-critical
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Page Title */}
      <div className="text-center space-y-3 pb-4">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Palette className="h-8 w-8 text-violet-500" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500">
            Visual World
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Configure visual style and artistic direction
        </p>
      </div>

      {/* Art Style & Visual Rhythm */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Art Style — matches original: "Choose a visual style or upload reference images for custom styling" */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative z-10 p-6 space-y-6">
            <div>
              <Label className="text-lg font-semibold text-white">Art Style</Label>
              <p className="text-sm text-white/50">Choose a visual style or upload reference images for custom styling</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ART_STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  onClick={() => onArtStyleChange(style.value)}
                  className={cn(
                    "py-2.5 px-3 rounded-lg border text-left text-sm font-medium transition-all",
                    artStyle === style.value
                      ? "border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-400"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                >
                  <span className="block">{style.label}</span>
                  <span className={cn("block text-xs font-normal mt-0.5", artStyle === style.value ? "text-violet-300/80" : "text-white/40")}>
                    {style.description}
                  </span>
                </button>
              ))}
            </div>
            {/* Divider — "or use reference images" */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-3 text-xs text-white/50 uppercase tracking-wider">or use reference images</span>
              </div>
            </div>
            {/* Reference image upload — max 4, matches original */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-white/60">Style reference images</Label>
                <span className="text-xs font-medium tabular-nums text-white/50">{referenceImages.length}/4</span>
              </div>
              <p className="text-xs text-white/40">Upload images to guide the visual style (the AI will match the aesthetic)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleReferenceFileSelected}
                className="hidden"
              />
              <div className="grid grid-cols-4 gap-2">
                {referenceImages.map((img, idx) => (
                  <div key={img.tempId} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                    <img src={img.previewUrl} alt={img.originalName || `Reference ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {img.originalName}
                    </div>
                  </div>
                ))}
                {referenceImages.length < 4 && (
                  <button
                    type="button"
                    onClick={handleReferenceUploadClick}
                    disabled={isUploadingRef}
                    className={cn(
                      "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      "border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5"
                    )}
                  >
                    {isUploadingRef ? (
                      <>
                        <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                        <span className="text-xs text-violet-400">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-white/50" />
                        <span className="text-xs text-white/50">Upload</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Rhythm — matches original: "How does the experience unfold over time?" */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative z-10 p-6 space-y-4">
            <Label className="text-lg font-semibold text-white">Visual Rhythm</Label>
            <p className="text-sm text-white/50">How does the experience unfold over time?</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {VISUAL_RHYTHM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onVisualRhythmChange(option.value)}
                  className={cn(
                    "py-2.5 px-3 rounded-lg border text-left text-sm font-medium transition-all",
                    visualRhythm === option.value
                      ? "border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5 text-pink-400"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                >
                  <span className="block">{option.label}</span>
                  <span className={cn("block text-xs font-normal mt-0.5", visualRhythm === option.value ? "text-pink-300/80" : "text-white/40")}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Visual Elements — matches original: "Select up to 5 elements to feature", 4/5 style counter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative z-10 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="text-lg font-semibold text-white">Key Visual Elements</Label>
                <p className="text-sm text-white/50">Select up to 5 elements to feature</p>
              </div>
              <span className="text-sm font-medium tabular-nums text-white/60 shrink-0">{visualElements.length}/5</span>
            </div>
            {/* Selected Elements */}
            <div className="flex flex-wrap gap-2">
              {visualElements.map((element) => (
                <Badge
                  key={element}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20 transition-colors"
                  onClick={() => removeVisualElement(element)}
                >
                  {element}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {visualElements.length === 0 && (
                <span className="text-sm text-muted-foreground">Click suggestions below to add (max 5)</span>
              )}
            </div>
            
            {/* Suggestions — original 18 elements */}
            <div className="flex flex-wrap gap-2">
              {VISUAL_ELEMENT_OPTIONS.filter(s => !visualElements.includes(s)).map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-emerald-500/10 transition-colors"
                  onClick={() => addVisualElement(suggestion)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Video Model & Motion (for video-animation mode only) */}
      <AnimatePresence>
        {animationMode === 'video-animation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="relative z-10 p-6 space-y-4">
                <Label className="text-lg font-semibold text-white">Video Generation</Label>
                <p className="text-sm text-white/50">Model and motion settings for AI video generation</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Video Model</Label>
                    <Select value={videoModel} onValueChange={onVideoModelChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VIDEO_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label} - {model.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Video Resolution</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {VIDEO_RESOLUTION_OPTIONS.map((option) => (
                        <Card
                          key={option.value}
                          className={`cursor-pointer transition-all duration-300 ${
                            videoResolution === option.value
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'hover:border-cyan-500/50'
                          }`}
                          onClick={() => onVideoResolutionChange(option.value)}
                        >
                          <CardContent className="p-2 text-center">
                            <div className={`text-xs font-medium ${videoResolution === option.value ? 'text-cyan-500' : ''}`}>
                              {option.label}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Motion Prompt (Optional)</Label>
                  <Input
                    placeholder="e.g., Slow zoom, gentle pan, subtle camera movement..."
                    value={motionPrompt}
                    onChange={(e) => onMotionPromptChange(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Image Instructions — matches original title, subtitle, and note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative z-10 p-6 space-y-4">
            <Label className="text-lg font-semibold text-white">Custom Image Instructions</Label>
            <p className="text-sm text-white/50">Add specific instructions to guide the AI image generation (optional)</p>
            <Textarea
              placeholder="e.g., Ensure consistent lighting across all shots, use warm color grading..."
              value={imageCustomInstructions}
              onChange={(e) => onImageCustomInstructionsChange(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-white/40">These instructions will be applied to all generated images in this project</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
