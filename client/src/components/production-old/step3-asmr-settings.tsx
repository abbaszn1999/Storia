import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  X,
  UtensilsCrossed,
  Hand,
  TreePine,
  Palette,
  Package,
  Sparkles,
  Check,
  Video,
  Volume2,
  Repeat,
  Music,
} from "lucide-react";

interface Step3ASMRSettingsProps {
  campaignName: string;
  onCampaignNameChange: (name: string) => void;
  asmrPrompts: string[];
  onAsmrPromptsChange: (prompts: string[]) => void;
  asmrCategory: string;
  onAsmrCategoryChange: (category: string) => void;
  asmrMaterial: string;
  onAsmrMaterialChange: (material: string) => void;
  asmrVideoModel: string;
  onAsmrVideoModelChange: (model: string) => void;
  asmrIsLoopable: boolean;
  onAsmrIsLoopableChange: (loopable: boolean) => void;
  asmrSoundIntensity: number;
  onAsmrSoundIntensityChange: (intensity: number) => void;
}

const ASMR_CATEGORIES = [
  {
    id: "food",
    name: "Food & Cooking",
    icon: UtensilsCrossed,
    iconColor: "from-amber-500 to-orange-600",
    description: "Cooking sounds, sizzling, cutting",
    materials: ["vegetables", "meat", "liquids", "pastry"],
    suggestedVisualPrompt: "Close-up of cooking process with steam rising",
    suggestedSoundPrompt: "Sizzling pan, chopping vegetables, bubbling liquid",
  },
  {
    id: "hands",
    name: "Hand Movements",
    icon: Hand,
    iconColor: "from-pink-500 to-rose-500",
    description: "Tapping, scratching, hand sounds",
    materials: ["keyboard", "nails", "fabric", "paper"],
    suggestedVisualPrompt: "Elegant hands performing gentle movements",
    suggestedSoundPrompt: "Soft tapping, gentle scratching, fabric rustling",
  },
  {
    id: "nature",
    name: "Nature & Ambient",
    icon: TreePine,
    iconColor: "from-green-500 to-emerald-600",
    description: "Rain, forest, water sounds",
    materials: ["rain", "leaves", "water", "wind"],
    suggestedVisualPrompt: "Serene nature scene with gentle movement",
    suggestedSoundPrompt: "Gentle rain, rustling leaves, flowing water",
  },
  {
    id: "art",
    name: "Art & Creativity",
    icon: Palette,
    iconColor: "from-violet-500 to-purple-600",
    description: "Drawing, painting, crafting",
    materials: ["paper", "pencil", "paint", "clay"],
    suggestedVisualPrompt: "Artist hands creating artwork with precision",
    suggestedSoundPrompt: "Pencil on paper, brush strokes, clay molding",
  },
  {
    id: "unboxing",
    name: "Unboxing & Products",
    icon: Package,
    iconColor: "from-blue-500 to-cyan-600",
    description: "Package opening, product reveal",
    materials: ["cardboard", "plastic", "foam", "paper"],
    suggestedVisualPrompt: "Hands carefully unboxing a premium product",
    suggestedSoundPrompt: "Cardboard tearing, plastic crinkling, tape peeling",
  },
];

const ASMR_MATERIALS = [
  { id: "vegetables", name: "Vegetables", soundHint: "Crisp cutting sounds" },
  { id: "meat", name: "Meat", soundHint: "Sizzling, juicy sounds" },
  { id: "liquids", name: "Liquids", soundHint: "Pouring, bubbling" },
  { id: "pastry", name: "Pastry", soundHint: "Flaky, crumbly sounds" },
  { id: "keyboard", name: "Keyboard", soundHint: "Clicking, typing" },
  { id: "nails", name: "Nails", soundHint: "Tapping, scratching" },
  { id: "fabric", name: "Fabric", soundHint: "Rustling, soft sounds" },
  { id: "paper", name: "Paper", soundHint: "Crinkling, folding" },
  { id: "rain", name: "Rain", soundHint: "Gentle patter" },
  { id: "leaves", name: "Leaves", soundHint: "Rustling, crunching" },
  { id: "water", name: "Water", soundHint: "Flowing, dripping" },
  { id: "wind", name: "Wind", soundHint: "Soft whooshing" },
  { id: "pencil", name: "Pencil", soundHint: "Scratching on paper" },
  { id: "paint", name: "Paint", soundHint: "Brush strokes" },
  { id: "clay", name: "Clay", soundHint: "Molding, squishing" },
  { id: "cardboard", name: "Cardboard", soundHint: "Tearing, folding" },
  { id: "plastic", name: "Plastic", soundHint: "Crinkling, unwrapping" },
  { id: "foam", name: "Foam", soundHint: "Squishing, compressing" },
];

const VIDEO_MODELS = [
  { value: "kling", label: "Kling", description: "High quality, 5-10s clips", generatesAudio: false },
  { value: "veo2", label: "Veo 2", description: "Google's video model", generatesAudio: false },
  { value: "veo3", label: "Veo 3", description: "With audio generation", generatesAudio: true },
  { value: "runway", label: "Runway Gen-3", description: "Fast generation", generatesAudio: false },
];

export function Step3ASMRSettings({
  campaignName,
  onCampaignNameChange,
  asmrPrompts,
  onAsmrPromptsChange,
  asmrCategory,
  onAsmrCategoryChange,
  asmrMaterial,
  onAsmrMaterialChange,
  asmrVideoModel,
  onAsmrVideoModelChange,
  asmrIsLoopable,
  onAsmrIsLoopableChange,
  asmrSoundIntensity,
  onAsmrSoundIntensityChange,
}: Step3ASMRSettingsProps) {
  const [newPrompt, setNewPrompt] = useState("");

  const selectedCategory = ASMR_CATEGORIES.find(c => c.id === asmrCategory);
  const selectedModelInfo = VIDEO_MODELS.find(m => m.value === asmrVideoModel);
  const showSoundControls = !selectedModelInfo?.generatesAudio;

  const filteredMaterials = selectedCategory
    ? ASMR_MATERIALS.filter(m => selectedCategory.materials.includes(m.id))
    : ASMR_MATERIALS;

  const addPrompt = () => {
    if (newPrompt.trim()) {
      onAsmrPromptsChange([...asmrPrompts, newPrompt.trim()]);
      setNewPrompt("");
    }
  };

  const removePrompt = (index: number) => {
    onAsmrPromptsChange(asmrPrompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, value: string) => {
    const updated = [...asmrPrompts];
    updated[index] = value;
    onAsmrPromptsChange(updated);
  };

  const useSuggestedPrompt = () => {
    if (selectedCategory) {
      const prompt = `Visual: ${selectedCategory.suggestedVisualPrompt}\nSound: ${selectedCategory.suggestedSoundPrompt}`;
      if (!asmrPrompts.some(p => p.includes(selectedCategory.suggestedVisualPrompt))) {
        onAsmrPromptsChange([...asmrPrompts, prompt]);
      }
    }
  };

  const validPromptsCount = asmrPrompts.filter(p => p.trim()).length;

  const getSoundIntensityLabel = () => {
    if (asmrSoundIntensity < 33) return "Subtle";
    if (asmrSoundIntensity < 66) return "Moderate";
    return "Pronounced";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">ASMR Campaign Setup</h2>
        <p className="text-muted-foreground mt-2">
          Configure your ASMR video campaign settings
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => onCampaignNameChange(e.target.value)}
              placeholder="e.g., Relaxation ASMR Series"
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-campaign-name"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Choose ASMR Style</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {ASMR_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = asmrCategory === category.id;

            return (
              <Card
                key={category.id}
                className={`relative cursor-pointer transition-all overflow-hidden ${
                  isSelected ? "ring-2 ring-primary" : "hover:border-primary/50"
                }`}
                onClick={() => onAsmrCategoryChange(category.id)}
                data-testid={`card-asmr-category-${category.id}`}
              >
                <div className={`h-16 bg-gradient-to-br ${category.iconColor} flex items-center justify-center`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-0.5">{category.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Video Settings</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Video Model</Label>
                <Select value={asmrVideoModel} onValueChange={onAsmrVideoModelChange}>
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
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    Generates audio automatically
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Material/Texture</Label>
                <Select value={asmrMaterial} onValueChange={onAsmrMaterialChange}>
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

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Repeat className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="cursor-pointer">Seamless Loop</Label>
                  <p className="text-xs text-muted-foreground">Create loopable videos</p>
                </div>
              </div>
              <Switch
                checked={asmrIsLoopable}
                onCheckedChange={onAsmrIsLoopableChange}
                data-testid="switch-loopable"
              />
            </div>
          </CardContent>
        </Card>

        {showSoundControls && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Sound Settings</h3>
                <Badge variant="outline" className="ml-auto text-xs">Required</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sound Intensity</Label>
                  <span className="text-sm text-muted-foreground">{getSoundIntensityLabel()}</span>
                </div>
                <Slider
                  value={[asmrSoundIntensity]}
                  onValueChange={([v]) => onAsmrSoundIntensityChange(v)}
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
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Visual Prompts</h3>
            <p className="text-sm text-muted-foreground">
              Each prompt will generate one ASMR video
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <Button variant="outline" size="sm" onClick={useSuggestedPrompt} data-testid="button-use-suggestion">
                <Sparkles className="h-4 w-4 mr-1" />
                Use Suggestion
              </Button>
            )}
            <Badge variant="outline">
              {validPromptsCount} video{validPromptsCount !== 1 ? "s" : ""} planned
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {asmrPrompts.map((prompt, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex items-center justify-center w-8 h-10 rounded-md bg-muted text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => updatePrompt(index, e.target.value)}
                placeholder="Describe the visual scene and sounds..."
                className="flex-1 min-h-[80px] resize-none"
                data-testid={`textarea-prompt-${index}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePrompt(index)}
                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                data-testid={`button-remove-prompt-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <div className="w-8" />
            <Textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Add a new visual prompt..."
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  e.preventDefault();
                  addPrompt();
                }
              }}
              data-testid="textarea-new-prompt"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addPrompt}
              disabled={!newPrompt.trim()}
              className="h-10 w-10"
              data-testid="button-add-prompt"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {validPromptsCount === 0 && (
        <div className="p-6 rounded-lg border border-dashed text-center">
          <Music className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Add at least one prompt to create ASMR videos
          </p>
        </div>
      )}
    </div>
  );
}
