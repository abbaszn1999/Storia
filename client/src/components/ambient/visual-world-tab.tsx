import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Upload, X, Sparkles, Film, Palette, Play, Wand2, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ART_STYLES = [
  { id: "cinematic", label: "Cinematic", description: "Film-quality realism" },
  { id: "anime", label: "Anime", description: "Japanese animation style" },
  { id: "illustrated", label: "Illustrated", description: "Digital art look" },
  { id: "realistic", label: "Realistic", description: "Photo-realistic" },
  { id: "abstract", label: "Abstract", description: "Non-representational" },
  { id: "painterly", label: "Painterly", description: "Oil painting texture" },
  { id: "watercolor", label: "Watercolor", description: "Soft, flowing edges" },
  { id: "minimalist", label: "Minimalist", description: "Clean and simple" },
  { id: "other", label: "Other", description: "Custom style" },
];

const VISUAL_ELEMENTS = [
  "Mountains", "Ocean", "Forest", "City Lights", "Stars", "Rain", 
  "Fireplace", "Clouds", "Waves", "Snow", "Aurora", "Fog",
  "Flowers", "Desert", "Lake", "Waterfall", "Sunset Sky", "Neon Signs"
];

const VISUAL_RHYTHMS = [
  { id: "constant", label: "Constant Calm", description: "Steady, unchanging pace" },
  { id: "breathing", label: "Breathing", description: "Subtle rhythmic pulse" },
  { id: "building", label: "Building", description: "Gradually intensifying" },
  { id: "wave", label: "Wave", description: "Rising and falling" },
];

// Reference image with temp ID for upload tracking
export interface TempReferenceImage {
  tempId: string;
  previewUrl: string;
  originalName: string;
}

interface VisualWorldTabProps {
  artStyle: string;
  visualElements: string[];
  visualRhythm: string;
  referenceImages: TempReferenceImage[];
  imageCustomInstructions?: string;
  onArtStyleChange: (style: string) => void;
  onVisualElementsChange: (elements: string[]) => void;
  onVisualRhythmChange: (rhythm: string) => void;
  onReferenceImagesChange: (images: TempReferenceImage[]) => void;
  onImageCustomInstructionsChange?: (instructions: string) => void;
  onNext: () => void;
}

export function VisualWorldTab({
  artStyle,
  visualElements,
  visualRhythm,
  referenceImages,
  imageCustomInstructions = "",
  onArtStyleChange,
  onVisualElementsChange,
  onVisualRhythmChange,
  onReferenceImagesChange,
  onImageCustomInstructionsChange,
  onNext,
}: VisualWorldTabProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const toggleVisualElement = (element: string) => {
    if (visualElements.includes(element)) {
      onVisualElementsChange(visualElements.filter(e => e !== element));
    } else if (visualElements.length < 5) {
      onVisualElementsChange([...visualElements, element]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    // Check max images
    if (referenceImages.length >= 4) {
      toast({
        title: "Maximum images reached",
        description: "You can upload up to 4 reference images",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ambient-visual/upload-reference', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Add the new reference image to the list
      onReferenceImagesChange([
        ...referenceImages,
        {
          tempId: data.tempId,
          previewUrl: data.previewUrl,
          originalName: data.originalName,
        },
      ]);

      toast({
        title: "Image uploaded",
        description: "Reference image ready for use",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = referenceImages[index];
    
    // Remove from state immediately for responsive UI
    onReferenceImagesChange(referenceImages.filter((_, i) => i !== index));

    // Also delete from server temp storage (fire and forget)
    try {
      await fetch(`/api/ambient-visual/upload-reference/${imageToRemove.tempId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('Failed to delete temp image from server:', error);
      // Not critical - temp images are auto-cleaned anyway
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Design the Visual World</h2>
        <p className="text-muted-foreground">
          Define the artistic style, colors, and visual elements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Art Style & Reference Images (Combined) */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-6 space-y-6">
              {/* Art Style Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-cyan-400" />
                  <Label className="text-lg font-semibold">Art Style</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a visual style or upload reference images for custom styling
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ART_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => onArtStyleChange(style.id)}
                      className={`p-3 rounded-lg border text-left transition-all hover-elevate ${
                        artStyle === style.id
                          ? "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-white"
                          : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                      }`}
                      data-testid={`button-style-${style.id}`}
                    >
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-muted-foreground">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-transparent px-3 text-xs text-white/50 uppercase tracking-wider">or use reference images</span>
                </div>
              </div>

              {/* Reference Images Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-white/60">Style Reference Images</Label>
                  <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/70">{referenceImages.length}/4</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload images to guide the visual style (the AI will match the aesthetic)
                </p>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                  data-testid="input-file-reference"
                />
                
                <div className="grid grid-cols-4 gap-3">
                  {referenceImages.map((img, idx) => (
                    <div key={img.tempId} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img 
                        src={img.previewUrl} 
                        alt={img.originalName || `Reference ${idx + 1}`} 
                        className="h-full w-full object-cover" 
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-ref-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {/* Show filename tooltip */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.originalName}
                      </div>
                    </div>
                  ))}
                  {referenceImages.length < 4 && (
                    <button
                      onClick={handleUploadClick}
                      disabled={isUploading}
                      className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-upload-reference"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                          <span className="text-xs text-cyan-400">Uploading...</span>
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Key Visual Elements */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <Label className="text-lg font-semibold">Key Visual Elements</Label>
                </div>
                <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{visualElements.length}/5</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Select up to 5 elements to feature
              </p>
              <div className="flex flex-wrap gap-2">
                {VISUAL_ELEMENTS.map((element) => (
                  <Badge
                    key={element}
                    variant="outline"
                    className={`cursor-pointer hover-elevate ${
                      visualElements.includes(element) 
                        ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-cyan-300" 
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/[0.07]"
                    }`}
                    onClick={() => toggleVisualElement(element)}
                    data-testid={`badge-element-${element.toLowerCase().replace(' ', '-')}`}
                  >
                    {element}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visual Rhythm */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-cyan-400" />
                <Label className="text-lg font-semibold">Visual Rhythm</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                How does the experience unfold over time?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {VISUAL_RHYTHMS.map((rhythm) => (
                  <button
                    key={rhythm.id}
                    onClick={() => onVisualRhythmChange(rhythm.id)}
                    className={`p-3 rounded-lg border text-left transition-all hover-elevate ${
                      visualRhythm === rhythm.id
                        ? "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-white"
                        : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                    }`}
                    data-testid={`button-rhythm-${rhythm.id}`}
                  >
                    <div className="font-medium text-sm">{rhythm.label}</div>
                    <div className="text-xs text-muted-foreground">{rhythm.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Image Generation Instructions */}
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-cyan-400" />
                <Label className="text-lg font-semibold">Custom Image Instructions</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add specific instructions to guide the AI image generation (optional)
              </p>
              <Textarea
                value={imageCustomInstructions}
                onChange={(e) => onImageCustomInstructionsChange?.(e.target.value)}
                placeholder="e.g., Use soft focus on backgrounds, include lens flares, maintain consistent color grading across all shots, avoid harsh shadows..."
                className="min-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-500/50"
                data-testid="textarea-image-instructions"
              />
              <p className="text-xs text-muted-foreground">
                These instructions will be applied to all generated images in this project
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!artStyle}
          size="lg"
          variant="ghost"
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
          data-testid="button-continue-visual-world"
        >
          Continue to Flow Design
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
