import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Upload, X, Sparkles, Film, Palette, Play, Wand2 } from "lucide-react";

const ART_STYLES = [
  { id: "cinematic", label: "Cinematic", description: "Film-quality realism" },
  { id: "anime", label: "Anime", description: "Japanese animation style" },
  { id: "illustrated", label: "Illustrated", description: "Digital art look" },
  { id: "realistic", label: "Realistic", description: "Photo-realistic" },
  { id: "abstract", label: "Abstract", description: "Non-representational" },
  { id: "painterly", label: "Painterly", description: "Oil painting texture" },
  { id: "watercolor", label: "Watercolor", description: "Soft, flowing edges" },
  { id: "minimalist", label: "Minimalist", description: "Clean and simple" },
];

const COLOR_PALETTES = [
  { id: "warm", label: "Warm", colors: ["#FF6B35", "#F7931E", "#FFD700", "#FF4500"] },
  { id: "cool", label: "Cool", colors: ["#00CED1", "#4169E1", "#7B68EE", "#6A5ACD"] },
  { id: "monochrome", label: "Monochrome", colors: ["#2D2D2D", "#5A5A5A", "#8A8A8A", "#BABABA"] },
  { id: "neon", label: "Neon", colors: ["#FF00FF", "#00FFFF", "#FF1493", "#00FF00"] },
  { id: "pastel", label: "Pastel", colors: ["#FFB6C1", "#FFDAB9", "#E6E6FA", "#B0E0E6"] },
  { id: "earth", label: "Earth Tones", colors: ["#8B4513", "#A0522D", "#D2691E", "#228B22"] },
  { id: "sunset", label: "Sunset", colors: ["#FF4500", "#FF6347", "#FF7F50", "#FFD700"] },
  { id: "ocean", label: "Ocean", colors: ["#006994", "#40E0D0", "#7FFFD4", "#00CED1"] },
];

const LIGHTING_MOODS = [
  { id: "golden-hour", label: "Golden Hour" },
  { id: "blue-hour", label: "Blue Hour" },
  { id: "overcast", label: "Overcast" },
  { id: "dramatic", label: "Dramatic" },
  { id: "soft", label: "Soft & Diffused" },
  { id: "neon-glow", label: "Neon Glow" },
  { id: "candlelight", label: "Candlelight" },
  { id: "moonlight", label: "Moonlight" },
];

const TEXTURES = [
  { id: "clean", label: "Clean" },
  { id: "film-grain", label: "Film Grain" },
  { id: "vintage", label: "Vintage" },
  { id: "dreamy-blur", label: "Dreamy Blur" },
  { id: "vhs", label: "VHS Retro" },
  { id: "noise", label: "Subtle Noise" },
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

interface VisualWorldTabProps {
  artStyle: string;
  colorPalette: string;
  lightingMood: string;
  texture: string;
  visualElements: string[];
  visualRhythm: string;
  referenceImages: string[];
  imageCustomInstructions?: string;
  onArtStyleChange: (style: string) => void;
  onColorPaletteChange: (palette: string) => void;
  onLightingMoodChange: (mood: string) => void;
  onTextureChange: (texture: string) => void;
  onVisualElementsChange: (elements: string[]) => void;
  onVisualRhythmChange: (rhythm: string) => void;
  onReferenceImagesChange: (images: string[]) => void;
  onImageCustomInstructionsChange?: (instructions: string) => void;
  onNext: () => void;
}

export function VisualWorldTab({
  artStyle,
  colorPalette,
  lightingMood,
  texture,
  visualElements,
  visualRhythm,
  referenceImages,
  imageCustomInstructions = "",
  onArtStyleChange,
  onColorPaletteChange,
  onLightingMoodChange,
  onTextureChange,
  onVisualElementsChange,
  onVisualRhythmChange,
  onReferenceImagesChange,
  onImageCustomInstructionsChange,
  onNext,
}: VisualWorldTabProps) {
  const toggleVisualElement = (element: string) => {
    if (visualElements.includes(element)) {
      onVisualElementsChange(visualElements.filter(e => e !== element));
    } else if (visualElements.length < 5) {
      onVisualElementsChange([...visualElements, element]);
    }
  };

  const handleImageUpload = () => {
    const mockUrl = `https://picsum.photos/seed/${Date.now()}/400/300`;
    if (referenceImages.length < 4) {
      onReferenceImagesChange([...referenceImages, mockUrl]);
    }
  };

  const removeImage = (index: number) => {
    onReferenceImagesChange(referenceImages.filter((_, i) => i !== index));
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
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Art Style Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
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
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
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
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">or use reference images</span>
                </div>
              </div>

              {/* Reference Images Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">Style Reference Images</Label>
                  <Badge variant="secondary" className="text-xs">{referenceImages.length}/4</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload images to guide the visual style (the AI will match the aesthetic)
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={img} alt={`Reference ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-ref-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {referenceImages.length < 4 && (
                    <button
                      onClick={handleImageUpload}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover-elevate"
                      data-testid="button-upload-reference"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
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
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Key Visual Elements</Label>
                <Badge variant="secondary">{visualElements.length}/5</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Select up to 5 elements to feature
              </p>
              <div className="flex flex-wrap gap-2">
                {VISUAL_ELEMENTS.map((element) => (
                  <Badge
                    key={element}
                    variant={visualElements.includes(element) ? "default" : "outline"}
                    className="cursor-pointer hover-elevate"
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
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
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
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
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
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Custom Image Instructions</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add specific instructions to guide the AI image generation (optional)
              </p>
              <Textarea
                value={imageCustomInstructions}
                onChange={(e) => onImageCustomInstructionsChange?.(e.target.value)}
                placeholder="e.g., Use soft focus on backgrounds, include lens flares, maintain consistent color grading across all shots, avoid harsh shadows..."
                className="min-h-[120px] resize-none"
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
          disabled={!artStyle || !colorPalette}
          size="lg"
          data-testid="button-continue-visual-world"
        >
          Continue to Flow Design
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
