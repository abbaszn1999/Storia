import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Film, 
  Sparkles,
  Settings2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import type { ReferenceImage } from "@shared/schema";

import cinematicImg from "@assets/stock_images/cinematic_dramatic_m_11f2a438.jpg";
import vintageImg from "@assets/stock_images/vintage_retro_film_a_271325f2.jpg";
import storybookImg from "@assets/stock_images/children_storybook_i_356b584c.jpg";
import cartoonImg from "@assets/stock_images/3d_cartoon_character_6aa7ac2f.jpg";
import pixarImg from "@assets/stock_images/pixar_style_3d_anima_42d5c374.jpg";
import disneyImg from "@assets/stock_images/disney_animation_sty_ee54ba97.jpg";
import ghibliImg from "@assets/stock_images/studio_ghibli_anime__896fd7f6.jpg";
import clayImg from "@assets/stock_images/claymation_clay_anim_99f7e6b5.jpg";
import comicImg from "@assets/stock_images/comic_book_illustrat_6b536ca2.jpg";
import animeImg from "@assets/stock_images/japanese_anime_manga_1161035c.jpg";

interface VisualWorldProps {
  videoId: string;
  referenceImages: ReferenceImage[];
  artStyle?: string;
  imageModel?: string;
  animationMode?: "animate" | "smooth-image";
  imageInstructions?: string;
  videoInstructions?: string;
  onReferenceImagesChange: (images: ReferenceImage[]) => void;
  onWorldSettingsChange?: (settings: { 
    artStyle: string; 
    imageModel: string;
    animationMode: "animate" | "smooth-image";
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onNext: () => void;
}

const VIDEO_STYLES = [
  { id: "none", name: "None", imageUrl: null },
  { id: "cinematic", name: "Cinematic", imageUrl: cinematicImg },
  { id: "vintage", name: "Vintage", imageUrl: vintageImg },
  { id: "storybook", name: "Storybook", imageUrl: storybookImg },
  { id: "3d-cartoon", name: "3D Cartoon", imageUrl: cartoonImg },
  { id: "pixar", name: "Pixar", imageUrl: pixarImg },
  { id: "disney", name: "Disney", imageUrl: disneyImg },
  { id: "ghibli", name: "Ghibli", imageUrl: ghibliImg },
  { id: "clay", name: "Clay", imageUrl: clayImg },
  { id: "comic", name: "Comic", imageUrl: comicImg },
  { id: "anime", name: "Anime", imageUrl: animeImg },
];

const IMAGE_MODELS = [
  { value: "flux", label: "Flux" },
  { value: "midjourney", label: "Midjourney" },
  { value: "dalle3", label: "DALL-E 3" },
  { value: "imagen", label: "Imagen 4" },
];

export function VisualWorld({ 
  videoId,
  referenceImages,
  artStyle = "none",
  imageModel = "flux",
  animationMode = "smooth-image",
  imageInstructions = "",
  videoInstructions = "",
  onReferenceImagesChange,
  onWorldSettingsChange,
  onNext,
}: VisualWorldProps) {
  const [selectedArtStyle, setSelectedArtStyle] = useState(artStyle);
  const [selectedImageModel, setSelectedImageModel] = useState(imageModel);
  const [selectedAnimationMode, setSelectedAnimationMode] = useState<"animate" | "smooth-image">(animationMode);
  const [selectedImageInstructions, setSelectedImageInstructions] = useState(imageInstructions);
  const [selectedVideoInstructions, setSelectedVideoInstructions] = useState(videoInstructions);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const { toast } = useToast();

  const styleRefs = referenceImages.filter(r => r.type === "style");

  const updateSettings = (updates: Partial<{
    artStyle: string;
    imageModel: string;
    animationMode: "animate" | "smooth-image";
    imageInstructions: string;
    videoInstructions: string;
  }>) => {
    if (onWorldSettingsChange) {
      onWorldSettingsChange({
        artStyle: updates.artStyle ?? selectedArtStyle,
        imageModel: updates.imageModel ?? selectedImageModel,
        animationMode: updates.animationMode ?? selectedAnimationMode,
        imageInstructions: updates.imageInstructions ?? selectedImageInstructions,
        videoInstructions: updates.videoInstructions ?? selectedVideoInstructions,
      });
    }
  };

  const handleArtStyleChange = (styleId: string) => {
    setSelectedArtStyle(styleId);
    updateSettings({ artStyle: styleId });
  };

  const handleImageModelChange = (model: string) => {
    setSelectedImageModel(model);
    updateSettings({ imageModel: model });
  };

  const handleAnimationModeChange = (mode: "animate" | "smooth-image") => {
    setSelectedAnimationMode(mode);
    updateSettings({ animationMode: mode });
  };

  const handleImageInstructionsChange = (instructions: string) => {
    setSelectedImageInstructions(instructions);
    updateSettings({ imageInstructions: instructions });
  };

  const handleVideoInstructionsChange = (instructions: string) => {
    setSelectedVideoInstructions(instructions);
    updateSettings({ videoInstructions: instructions });
  };

  const handleUploadReference = (file: File) => {
    if (styleRefs.length >= 1) {
      toast({
        title: "Maximum Reached",
        description: "You can only upload 1 visual reference image.",
        variant: "destructive",
      });
      return;
    }

    const refImage: ReferenceImage = {
      id: `ref-${Date.now()}`,
      videoId,
      shotId: null,
      characterId: null,
      type: "style",
      imageUrl: URL.createObjectURL(file),
      description: null,
      createdAt: new Date(),
    };

    onReferenceImagesChange([...referenceImages, refImage]);
    toast({
      title: "Reference Uploaded",
      description: "Visual reference image added.",
    });
  };

  const handleRemoveStyleReference = (refId: string) => {
    const updatedRefs = referenceImages.filter(r => r.id !== refId);
    onReferenceImagesChange(updatedRefs);
    toast({
      title: "Reference Removed",
      description: "Visual reference image deleted.",
    });
  };

  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Visual World</h2>
        <p className="text-muted-foreground">
          Define the visual style and animation settings for your ambient video
        </p>
      </div>

      {/* Animation Mode Selection */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Animation Mode (Default for all shots)</Label>
        <p className="text-xs text-muted-foreground">
          Choose how your shots will be animated. You can override this per-shot in the Composition tab.
        </p>
        <RadioGroup
          value={selectedAnimationMode}
          onValueChange={(value) => handleAnimationModeChange(value as "animate" | "smooth-image")}
          className="grid grid-cols-2 gap-4"
        >
          <label htmlFor="smooth-image" className="cursor-pointer">
            <Card 
              className={`transition-all hover-elevate ${
                selectedAnimationMode === "smooth-image" ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="smooth-image" id="smooth-image" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        Smooth Image Effect
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Subtle Ken Burns-style motion on static images. Pan, zoom, and drift effects create gentle movement. Best for relaxation and meditation videos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </label>

          <label htmlFor="animate" className="cursor-pointer">
            <Card 
              className={`transition-all hover-elevate ${
                selectedAnimationMode === "animate" ? "ring-2 ring-primary" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value="animate" id="animate" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Film className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        Full Animation
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI-generated video with natural motion. Elements move realistically - rain falls, leaves sway, water flows. More dynamic but uses video generation credits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </label>
        </RadioGroup>
      </div>

      {/* Art Style Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Art Style</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a visual style for your ambient video
            </p>
          </div>
          <Select value={selectedImageModel} onValueChange={handleImageModelChange}>
            <SelectTrigger className="w-[160px]" data-testid="select-image-model">
              <SelectValue placeholder="Image Model" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {VIDEO_STYLES.map((style) => (
            <Card
              key={style.id}
              className={`cursor-pointer overflow-hidden transition-all hover-elevate ${
                selectedArtStyle === style.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleArtStyleChange(style.id)}
              data-testid={`card-style-${style.id}`}
            >
              <div className="aspect-[4/3] relative">
                {style.imageUrl ? (
                  <img
                    src={style.imageUrl}
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">None</span>
                  </div>
                )}
              </div>
              <div className="p-2 text-center">
                <span className="text-xs font-medium">{style.name}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Visual Reference */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Visual Reference (Optional)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Upload a reference image to guide the overall visual aesthetic
          </p>
        </div>

        {styleRefs.length > 0 ? (
          <div className="flex gap-4">
            {styleRefs.map((ref) => (
              <div key={ref.id} className="relative group">
                <img
                  src={ref.imageUrl}
                  alt="Visual reference"
                  className="w-40 h-28 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveStyleReference(ref.id)}
                  data-testid="button-remove-reference"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadReference(file);
              }}
              data-testid="input-upload-reference"
            />
            <Card className="border-dashed hover-elevate cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload reference image
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 10MB
                </span>
              </CardContent>
            </Card>
          </label>
        )}
      </div>

      {/* AI Generation Instructions (Collapsible) */}
      <Collapsible
        open={isAiSettingsOpen}
        onOpenChange={setIsAiSettingsOpen}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            data-testid="button-toggle-ai-settings"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span>AI Generation Instructions</span>
            </div>
            {isAiSettingsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Image Generation Instructions</Label>
            <Textarea
              placeholder="Add specific instructions for image generation... (e.g., 'Use soft lighting, muted colors, high detail on foreground elements')"
              value={selectedImageInstructions}
              onChange={(e) => handleImageInstructionsChange(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="textarea-image-instructions"
            />
          </div>

          {selectedAnimationMode === "animate" && (
            <div className="space-y-2">
              <Label className="text-sm">Video Generation Instructions</Label>
              <Textarea
                placeholder="Add specific instructions for video animation... (e.g., 'Slow, gentle movement. Rain should fall at a relaxing pace. Avoid sudden transitions.')"
                value={selectedVideoInstructions}
                onChange={(e) => handleVideoInstructionsChange(e.target.value)}
                className="min-h-[80px] resize-none"
                data-testid="textarea-video-instructions"
              />
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              These instructions will be combined with your atmosphere description to guide AI generation. Be specific about visual elements, mood, and motion preferences.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} data-testid="button-next">
          Continue to Flow Design
        </Button>
      </div>
    </div>
  );
}
