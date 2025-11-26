import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  X, 
  Upload, 
  Video, 
  UtensilsCrossed, 
  Hand, 
  TreePine, 
  Palette, 
  Package,
  Sparkles,
  Volume2,
  Repeat,
  Headphones,
  Music,
  Wand2,
  Check
} from "lucide-react";
import {
  ASMR_CATEGORIES,
  ASMR_MATERIALS,
  AMBIENT_BACKGROUNDS,
  VIDEO_MODELS,
  ASPECT_RATIOS,
  DURATION_OPTIONS,
  type ASMRCategory,
} from "@/constants/asmr-presets";

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'UtensilsCrossed': return UtensilsCrossed;
    case 'Hand': return Hand;
    case 'TreePine': return TreePine;
    case 'Palette': return Palette;
    case 'Package': return Package;
    default: return Sparkles;
  }
};

export default function ASMRGenerator() {
  const [selectedCategory, setSelectedCategory] = useState<ASMRCategory | null>(null);
  const [visualPrompt, setVisualPrompt] = useState("");
  const [soundPrompt, setSoundPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [duration, setDuration] = useState("15");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [videoModel, setVideoModel] = useState("veo3");
  const [isLoopable, setIsLoopable] = useState(false);
  const [soundIntensity, setSoundIntensity] = useState([50]);
  const [isBinaural, setIsBinaural] = useState(false);
  const [ambientBackground, setAmbientBackground] = useState("none");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedModelInfo = VIDEO_MODELS.find(m => m.value === videoModel);
  const showSoundControls = !selectedModelInfo?.generatesAudio;

  useEffect(() => {
    if (selectedCategory) {
      setVisualPrompt(selectedCategory.suggestedVisualPrompt);
      if (showSoundControls) {
        setSoundPrompt(selectedCategory.suggestedSoundPrompt);
      }
    }
  }, [selectedCategory, showSoundControls]);

  const handleCategorySelect = (category: ASMRCategory) => {
    setSelectedCategory(category);
    setSelectedMaterial("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsGenerating(false);
  };

  const getSoundIntensityLabel = () => {
    const value = soundIntensity[0];
    if (value < 33) return "Subtle";
    if (value < 66) return "Moderate";
    return "Pronounced";
  };

  const filteredMaterials = selectedCategory 
    ? ASMR_MATERIALS.filter(m => selectedCategory.materials.includes(m.id))
    : ASMR_MATERIALS;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">ASMR / Sensory Video</h1>
                <p className="text-xs text-muted-foreground">Create satisfying videos with immersive sounds</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
              data-testid="button-close"
            >
              <Link href="/stories">
                <X className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Choose ASMR Style</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ASMR_CATEGORIES.map((category) => {
                const Icon = getCategoryIcon(category.icon);
                const isSelected = selectedCategory?.id === category.id;
                
                return (
                  <Card
                    key={category.id}
                    className={`relative cursor-pointer transition-all hover-elevate overflow-hidden ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleCategorySelect(category)}
                    data-testid={`card-category-${category.id}`}
                  >
                    <div className={`h-20 bg-gradient-to-br ${category.iconColor} flex items-center justify-center`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Visual Settings</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Video Model</Label>
                      <Select value={videoModel} onValueChange={setVideoModel}>
                        <SelectTrigger data-testid="select-video-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div className="flex flex-col">
                                <span>{model.label}</span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedModelInfo?.generatesAudio && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          Generates audio automatically
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Material/Texture</Label>
                      <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                        <SelectTrigger data-testid="select-material">
                          <SelectValue placeholder="Select material..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredMaterials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              <div className="flex flex-col">
                                <span>{material.name}</span>
                                <span className="text-xs text-muted-foreground">{material.soundHint}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Visual Prompt</Label>
                      {selectedCategory && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs gap-1"
                          onClick={() => setVisualPrompt(selectedCategory.suggestedVisualPrompt)}
                          data-testid="button-use-suggestion"
                        >
                          <Wand2 className="h-3 w-3" />
                          Use Suggestion
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder={selectedCategory?.suggestedVisualPrompt || "Describe the visual scene you want to create..."}
                      value={visualPrompt}
                      onChange={(e) => setVisualPrompt(e.target.value)}
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-visual-prompt"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reference Image (Optional)</Label>
                    {referenceImage ? (
                      <div className="relative border rounded-lg p-3 bg-muted/30">
                        <img
                          src={referenceImage}
                          alt="Reference"
                          className="w-full h-32 object-contain rounded"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => setReferenceImage(null)}
                          data-testid="button-remove-image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover-elevate"
                        data-testid="label-upload-area"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop or <span className="text-primary font-medium">browse</span>
                        </p>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          data-testid="input-image-upload"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </Card>

              {showSoundControls && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Sound Settings</h3>
                    <Badge variant="outline" className="ml-auto text-xs">Required for this model</Badge>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sound Effect Prompt</Label>
                        {selectedCategory && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs gap-1"
                            onClick={() => setSoundPrompt(selectedCategory.suggestedSoundPrompt)}
                            data-testid="button-use-sound-suggestion"
                          >
                            <Wand2 className="h-3 w-3" />
                            Use Suggestion
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={selectedCategory?.suggestedSoundPrompt || "Describe the sounds you want..."}
                        value={soundPrompt}
                        onChange={(e) => setSoundPrompt(e.target.value)}
                        className="min-h-[80px] resize-none"
                        data-testid="textarea-sound-prompt"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Sound Intensity</Label>
                          <span className="text-sm text-muted-foreground">{getSoundIntensityLabel()}</span>
                        </div>
                        <Slider
                          value={soundIntensity}
                          onValueChange={setSoundIntensity}
                          max={100}
                          step={1}
                          className="w-full"
                          data-testid="slider-sound-intensity"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtle</span>
                          <span>Pronounced</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Ambient Background</Label>
                        <Select value={ambientBackground} onValueChange={setAmbientBackground}>
                          <SelectTrigger data-testid="select-ambient">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AMBIENT_BACKGROUNDS.map((ambient) => (
                              <SelectItem key={ambient.id} value={ambient.id}>
                                <div className="flex flex-col">
                                  <span>{ambient.name}</span>
                                  <span className="text-xs text-muted-foreground">{ambient.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Headphones className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label className="cursor-pointer">Binaural Audio</Label>
                          <p className="text-xs text-muted-foreground">3D spatial audio for headphone listeners</p>
                        </div>
                      </div>
                      <Switch
                        checked={isBinaural}
                        onCheckedChange={setIsBinaural}
                        data-testid="switch-binaural"
                      />
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Video Format</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger data-testid="select-aspect-ratio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value}>
                            <div className="flex flex-col">
                              <span>{ratio.label}</span>
                              <span className="text-xs text-muted-foreground">{ratio.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <div className="flex items-center justify-between h-10 px-3 rounded-md border bg-background">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Seamless Loop</span>
                      </div>
                      <Switch
                        checked={isLoopable}
                        onCheckedChange={setIsLoopable}
                        data-testid="switch-loop"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4 sticky top-4">
                <h3 className="font-semibold mb-4">Preview</h3>
                <div 
                  className={`mx-auto bg-muted/30 border-2 border-dashed rounded-lg flex items-center justify-center ${
                    aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[400px]' :
                    aspectRatio === '16:9' ? 'aspect-video' :
                    aspectRatio === '4:5' ? 'aspect-[4/5] max-h-[350px]' :
                    'aspect-square max-h-[300px]'
                  }`}
                >
                  <div className="text-center space-y-2 p-4">
                    <Video className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Your video will appear here</p>
                  </div>
                </div>

                {selectedCategory && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded bg-gradient-to-br ${selectedCategory.iconColor} flex items-center justify-center`}>
                        {(() => {
                          const Icon = getCategoryIcon(selectedCategory.icon);
                          return <Icon className="h-3 w-3 text-white" />;
                        })()}
                      </div>
                      <span className="font-medium text-sm">{selectedCategory.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedCategory.exampleSounds.slice(0, 3).map((sound, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {sound}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <Button
                    onClick={handleGenerateVideo}
                    disabled={!visualPrompt || isGenerating}
                    className="w-full"
                    size="lg"
                    data-testid="button-generate-video"
                  >
                    {isGenerating ? (
                      <>
                        <span className="animate-spin mr-2">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate ASMR Video
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild
                    data-testid="button-back-to-templates"
                  >
                    <Link href="/stories">Back to Templates</Link>
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-medium text-foreground">{selectedModelInfo?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium text-foreground">{aspectRatio} / {duration}s</span>
                  </div>
                  {isLoopable && (
                    <div className="flex justify-between">
                      <span>Loop:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Enabled</span>
                    </div>
                  )}
                  {showSoundControls && isBinaural && (
                    <div className="flex justify-between">
                      <span>Audio:</span>
                      <span className="font-medium text-foreground">Binaural 3D</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
