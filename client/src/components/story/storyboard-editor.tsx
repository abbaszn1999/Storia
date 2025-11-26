import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImageIcon,
  RefreshCw,
  Play,
  Video,
  Image,
  Sparkles,
  Clock,
  Mic,
  ChevronRight,
  Loader2,
  GripVertical,
  Edit3,
  Wand2,
} from "lucide-react";

const IMAGE_MODELS = [
  { value: "flux", label: "Flux", description: "Fast & versatile" },
  { value: "midjourney", label: "Midjourney", description: "Artistic style" },
  { value: "dalle3", label: "DALL-E 3", description: "Accurate prompts" },
  { value: "stable-diffusion", label: "Stable Diffusion", description: "Open source" },
];

const TRANSITIONS = [
  { value: "fade", label: "Fade", icon: "opacity" },
  { value: "ken-burns", label: "Ken Burns", icon: "zoom" },
  { value: "slide-left", label: "Slide Left", icon: "arrow-left" },
  { value: "slide-right", label: "Slide Right", icon: "arrow-right" },
  { value: "zoom-in", label: "Zoom In", icon: "zoom-in" },
  { value: "zoom-out", label: "Zoom Out", icon: "zoom-out" },
];

export interface StoryScene {
  id: string;
  sceneNumber: number;
  narration: string;
  visualPrompt: string;
  imageUrl?: string;
  videoUrl?: string;
  isAnimated: boolean;
  transition: string;
  duration: number;
  voiceoverEnabled: boolean;
}

interface StoryboardEditorProps {
  onNext: () => void;
  onBack: () => void;
  scenes: StoryScene[];
  setScenes: (scenes: StoryScene[]) => void;
  aspectRatio: string;
  voiceoverEnabled: boolean;
  setVoiceoverEnabled: (enabled: boolean) => void;
}

export function StoryboardEditor({
  onNext,
  onBack,
  scenes,
  setScenes,
  aspectRatio,
  voiceoverEnabled,
  setVoiceoverEnabled,
}: StoryboardEditorProps) {
  const [selectedScene, setSelectedScene] = useState<number>(0);
  const [imageModel, setImageModel] = useState("flux");
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const currentScene = scenes[selectedScene];

  const updateScene = (index: number, updates: Partial<StoryScene>) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], ...updates };
    setScenes(updated);
  };

  const handleGenerateImage = async (index: number) => {
    setIsGenerating(index);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const mockImages = [
      "https://images.unsplash.com/photo-1518770660439-4636190af475",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      "https://images.unsplash.com/photo-1605379399642-870262d3d051",
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
    ];
    
    updateScene(index, {
      imageUrl: mockImages[index % mockImages.length] + `?w=800&q=80&random=${Date.now()}`,
    });
    setIsGenerating(null);
  };

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    for (let i = 0; i < scenes.length; i++) {
      await handleGenerateImage(i);
    }
    setIsGeneratingAll(false);
  };

  const handleToggleAnimation = (index: number) => {
    updateScene(index, { isAnimated: !scenes[index].isAnimated });
  };

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Storyboard</h1>
          <p className="text-sm text-muted-foreground">
            Edit visuals, prompts, and animation settings for each scene
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {totalDuration}s total
          </Badge>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
            <Mic className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Voiceover</span>
            <Switch
              checked={voiceoverEnabled}
              onCheckedChange={setVoiceoverEnabled}
              data-testid="switch-voiceover"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-3 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Scenes</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAll}
                  disabled={isGeneratingAll}
                  data-testid="button-generate-all"
                >
                  {isGeneratingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Generate All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-2">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-2">
                  {scenes.map((scene, index) => (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedScene(index)}
                      className={`group relative p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedScene === index
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:border-border hover:bg-muted/50"
                      }`}
                      data-testid={`scene-card-${index}`}
                    >
                      <div className="flex gap-2">
                        <div className="relative w-16 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                          {scene.imageUrl ? (
                            <img
                              src={scene.imageUrl}
                              alt={`Scene ${scene.sceneNumber}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          {scene.isAnimated && (
                            <div className="absolute bottom-0.5 right-0.5">
                              <Badge className="h-4 px-1 text-[10px]">
                                <Video className="h-2 w-2" />
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold">Scene {scene.sceneNumber}</span>
                            <Badge variant="outline" className="h-4 px-1 text-[10px]">
                              {scene.duration}s
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {scene.narration || "No narration"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Preview</CardTitle>
                <Select value={imageModel} onValueChange={setImageModel}>
                  <SelectTrigger className="w-40 h-8" data-testid="select-image-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {currentScene && (
                <div className="flex-1 flex flex-col">
                  <div
                    className={`relative flex-1 rounded-lg overflow-hidden bg-muted ${
                      aspectRatio === "9:16"
                        ? "aspect-[9/16] max-h-[400px] mx-auto"
                        : aspectRatio === "16:9"
                        ? "aspect-video"
                        : aspectRatio === "4:5"
                        ? "aspect-[4/5] max-h-[400px] mx-auto"
                        : "aspect-square max-h-[400px] mx-auto"
                    }`}
                  >
                    {currentScene.imageUrl ? (
                      <img
                        src={currentScene.imageUrl}
                        alt={`Scene ${currentScene.sceneNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No image generated</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        Scene {currentScene.sceneNumber}
                      </Badge>
                      {currentScene.isAnimated && (
                        <Badge className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Animated
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateImage(selectedScene)}
                        disabled={isGenerating === selectedScene}
                        data-testid="button-regenerate"
                      >
                        {isGenerating === selectedScene ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            {currentScene.imageUrl ? "Regenerate" : "Generate"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Scene Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {currentScene && (
                <ScrollArea className="h-full">
                  <div className="space-y-5 pr-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Visual Prompt</Label>
                      <Textarea
                        value={currentScene.visualPrompt}
                        onChange={(e) => updateScene(selectedScene, { visualPrompt: e.target.value })}
                        placeholder="Describe the visual for this scene..."
                        className="min-h-20 text-sm"
                        data-testid="textarea-visual-prompt"
                      />
                    </div>

                    {voiceoverEnabled && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium flex items-center gap-2">
                          <Mic className="h-3 w-3" />
                          Narration Script
                        </Label>
                        <Textarea
                          value={currentScene.narration}
                          onChange={(e) => updateScene(selectedScene, { narration: e.target.value })}
                          placeholder="Enter the narration for this scene..."
                          className="min-h-16 text-sm"
                          data-testid="textarea-narration"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Media Type</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateScene(selectedScene, { isAnimated: false })}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            !currentScene.isAnimated
                              ? "border-primary bg-primary/5"
                              : "border-border hover-elevate"
                          }`}
                          data-testid="button-static-image"
                        >
                          <Image className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">Static Image</div>
                          <div className="text-[10px] text-muted-foreground">With transitions</div>
                        </button>
                        <button
                          onClick={() => updateScene(selectedScene, { isAnimated: true })}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            currentScene.isAnimated
                              ? "border-primary bg-primary/5"
                              : "border-border hover-elevate"
                          }`}
                          data-testid="button-animated-video"
                        >
                          <Video className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs font-medium">Animated</div>
                          <div className="text-[10px] text-muted-foreground">AI video clip</div>
                        </button>
                      </div>
                    </div>

                    {!currentScene.isAnimated && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Transition</Label>
                        <Select
                          value={currentScene.transition}
                          onValueChange={(value) => updateScene(selectedScene, { transition: value })}
                        >
                          <SelectTrigger data-testid="select-transition">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSITIONS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Duration</Label>
                        <span className="text-sm font-semibold">{currentScene.duration}s</span>
                      </div>
                      <Slider
                        value={[currentScene.duration]}
                        onValueChange={([value]) => updateScene(selectedScene, { duration: value })}
                        min={3}
                        max={20}
                        step={1}
                        data-testid="slider-scene-duration"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>3s</span>
                        <span>20s</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
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
