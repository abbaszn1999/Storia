import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, RefreshCw } from "lucide-react";

const IMAGE_MODELS = [
  "Flux",
  "Midjourney",
  "Nano Banana",
  "GPT Image",
  "DALL-E 3",
  "Stable Diffusion",
];

interface Scene {
  id: string;
  sceneNumber: number;
  narration: string;
  visualDescription: string;
  imageUrl?: string;
}

interface EditShotsProps {
  onNext: () => void;
  onBack: () => void;
  scenes: Scene[];
  setScenes: (scenes: Scene[]) => void;
}

export function EditShots({
  onNext,
  onBack,
  scenes,
  setScenes,
}: EditShotsProps) {
  const [imageModel, setImageModel] = useState("Flux");

  const handleRegenerateImage = async (index: number) => {
    // Simulate image generation
    const mockImages = [
      "https://images.unsplash.com/photo-1518770660439-4636190af475",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      "https://images.unsplash.com/photo-1605379399642-870262d3d051",
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
    ];
    
    const updated = [...scenes];
    updated[index] = {
      ...updated[index],
      imageUrl: mockImages[index % mockImages.length] + `?w=800&q=80&random=${Date.now()}`,
    };
    setScenes(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Edit Your Shots</h1>
        <p className="text-lg text-muted-foreground">
          Refine the AI-generated visuals for each scene or generate new ones.
        </p>
      </div>

      {/* Image Model Selection */}
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor="image-model" className="text-sm font-medium">
          Image Model:
        </Label>
        <Select value={imageModel} onValueChange={setImageModel}>
          <SelectTrigger id="image-model" className="w-48" data-testid="select-image-model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_MODELS.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="group relative bg-card border rounded-lg overflow-hidden hover-elevate"
            data-testid={`shot-${index + 1}`}
          >
            <div className="aspect-video bg-muted relative">
              {scene.imageUrl ? (
                <img
                  src={scene.imageUrl}
                  alt={`Scene ${scene.sceneNumber}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              <div className="absolute top-2 left-2">
                <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded">
                  Scene {scene.sceneNumber}
                </div>
              </div>

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRegenerateImage(index)}
                  data-testid={`button-regenerate-${index}`}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button onClick={onNext} data-testid="button-next-audio">
          Next: Audio
        </Button>
      </div>
    </div>
  );
}
