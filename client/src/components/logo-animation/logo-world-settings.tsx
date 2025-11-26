import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Palette, 
  Image as ImageIcon,
  Wand2,
  Upload,
  X,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoWorldSettingsProps {
  worldSettings: {
    imageModel: string;
    styleReference: string | null;
    worldDescription: string;
    artStyle: string;
    imageInstructions: string;
    videoInstructions: string;
  };
  onWorldSettingsChange: (settings: {
    imageModel: string;
    styleReference: string | null;
    worldDescription: string;
    artStyle: string;
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onNext: () => void;
}

const IMAGE_MODELS = [
  { value: "Flux", label: "Flux - High quality, creative" },
  { value: "Imagen 4", label: "Imagen 4 - Photorealistic" },
  { value: "DALL-E 3", label: "DALL-E 3 - Versatile, artistic" },
  { value: "Midjourney", label: "Midjourney - Stylized, aesthetic" },
];

const ART_STYLES = [
  { value: "none", label: "None - Let AI decide" },
  { value: "cinematic", label: "Cinematic - Film-like quality" },
  { value: "minimal", label: "Minimal - Clean and simple" },
  { value: "3d-render", label: "3D Render - Dimensional depth" },
  { value: "neon", label: "Neon - Glowing, vibrant" },
  { value: "elegant", label: "Elegant - Sophisticated, premium" },
  { value: "tech", label: "Tech - Modern, digital" },
  { value: "organic", label: "Organic - Natural, flowing" },
  { value: "geometric", label: "Geometric - Sharp, angular" },
  { value: "retro", label: "Retro - Vintage aesthetic" },
];

export function LogoWorldSettings({
  worldSettings,
  onWorldSettingsChange,
  onNext,
}: LogoWorldSettingsProps) {
  const { toast } = useToast();
  const [stylePreview, setStylePreview] = useState<string | null>(null);

  const updateSettings = (updates: Partial<typeof worldSettings>) => {
    onWorldSettingsChange({ ...worldSettings, ...updates });
  };

  const handleStyleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setStylePreview(url);
        updateSettings({ styleReference: url });
        toast({
          title: "Style reference uploaded",
          description: "Your reference image has been added.",
        });
      }
    }
  };

  const removeStyleReference = () => {
    setStylePreview(null);
    updateSettings({ styleReference: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">World Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure the visual style and AI settings for your logo animation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Visual Style */}
        <div className="space-y-6">
          {/* Image Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Image Model
              </CardTitle>
              <CardDescription>
                Choose the AI model for generating animation frames
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={worldSettings.imageModel}
                onValueChange={(value) => updateSettings({ imageModel: value })}
              >
                <SelectTrigger data-testid="select-image-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Art Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Art Style
              </CardTitle>
              <CardDescription>
                Select a visual style for your logo animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={worldSettings.artStyle}
                onValueChange={(value) => updateSettings({ artStyle: value })}
              >
                <SelectTrigger data-testid="select-art-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ART_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Style Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Style Reference (Optional)
              </CardTitle>
              <CardDescription>
                Upload an image to guide the visual style
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stylePreview || worldSettings.styleReference ? (
                <div className="relative inline-block">
                  <img
                    src={stylePreview || worldSettings.styleReference || ""}
                    alt="Style reference"
                    className="max-h-32 rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeStyleReference}
                    data-testid="button-remove-style-reference"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => document.getElementById("style-ref-upload")?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a style reference image
                  </p>
                </div>
              )}
              <input
                id="style-ref-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStyleReferenceUpload}
                data-testid="input-style-reference"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Descriptions & Instructions */}
        <div className="space-y-6">
          {/* World Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                World Description
              </CardTitle>
              <CardDescription>
                Describe the visual world and environment for your animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: A sleek, futuristic space with floating geometric shapes, subtle particle effects, and a deep purple to black gradient background..."
                value={worldSettings.worldDescription}
                onChange={(e) => updateSettings({ worldDescription: e.target.value })}
                className="min-h-[120px] resize-none"
                data-testid="input-world-description"
              />
            </CardContent>
          </Card>

          {/* Custom AI Image Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Custom AI Image Instructions</CardTitle>
              <CardDescription>
                Additional instructions for AI image generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: Focus on high contrast, use metallic textures, ensure the logo is always centered and prominent..."
                value={worldSettings.imageInstructions}
                onChange={(e) => updateSettings({ imageInstructions: e.target.value })}
                className="min-h-[100px] resize-none"
                data-testid="input-image-instructions"
              />
            </CardContent>
          </Card>

          {/* Custom AI Video Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Custom AI Video Instructions</CardTitle>
              <CardDescription>
                Additional instructions for AI video generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: Smooth easing on all animations, maintain 24fps motion, add subtle camera movement..."
                value={worldSettings.videoInstructions}
                onChange={(e) => updateSettings({ videoInstructions: e.target.value })}
                className="min-h-[100px] resize-none"
                data-testid="input-video-instructions"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onNext}
          data-testid="button-continue"
        >
          Continue to Breakdown
        </Button>
      </div>
    </div>
  );
}
