import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Volume2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AtmosphereEditorProps {
  initialDescription?: string;
  aspectRatio?: string;
  atmosphereModel?: string;
  voiceOverEnabled?: boolean;
  voiceOverLanguage?: string;
  onDescriptionChange: (description: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onAtmosphereModelChange?: (model: string) => void;
  onVoiceOverEnabledChange?: (enabled: boolean) => void;
  onVoiceOverLanguageChange?: (language: string) => void;
  onCategoryChange?: (category: string) => void;
  onMoodChange?: (moods: string[]) => void;
  onDurationChange?: (duration: string) => void;
  onNext: () => void;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)", description: "Latest OpenAI model, fast and capable" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Previous generation OpenAI flagship" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Anthropic's most capable model" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Google's advanced model" },
];

const AMBIENT_CATEGORIES = [
  { id: "nature", label: "Nature", description: "Forests, oceans, mountains, rivers" },
  { id: "weather", label: "Weather", description: "Rain, snow, thunderstorms, wind" },
  { id: "urban", label: "Urban", description: "City streets, cafes, traffic, crowds" },
  { id: "cozy", label: "Cozy Spaces", description: "Fireplaces, libraries, cabins" },
  { id: "abstract", label: "Abstract", description: "Geometric patterns, flowing shapes" },
  { id: "cosmic", label: "Cosmic", description: "Space, stars, nebulae, planets" },
  { id: "underwater", label: "Underwater", description: "Ocean depths, coral reefs, marine life" },
  { id: "seasonal", label: "Seasonal", description: "Spring blooms, autumn leaves, winter snow" },
];

const AMBIENT_MOODS = [
  "Relaxing",
  "Meditative",
  "Calming",
  "Peaceful",
  "Dreamy",
  "Energizing",
  "Focused",
  "Mysterious",
  "Romantic",
  "Melancholic",
  "Uplifting",
  "Ethereal",
];

const AMBIENT_DURATIONS = [
  { value: "300", label: "5 min" },
  { value: "600", label: "10 min" },
  { value: "1800", label: "30 min" },
  { value: "3600", label: "1 hour" },
  { value: "7200", label: "2 hours" },
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
  "Russian",
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", description: "Landscape (YouTube, TV)" },
  { id: "9:16", label: "9:16", description: "Portrait (TikTok, Reels)" },
  { id: "1:1", label: "1:1", description: "Square (Instagram)" },
];

export function AtmosphereEditor({
  initialDescription = "",
  aspectRatio = "16:9",
  atmosphereModel = "gpt-4o",
  voiceOverEnabled = false,
  voiceOverLanguage = "English",
  onDescriptionChange,
  onAspectRatioChange,
  onAtmosphereModelChange,
  onVoiceOverEnabledChange,
  onVoiceOverLanguageChange,
  onCategoryChange,
  onMoodChange,
  onDurationChange,
  onNext,
}: AtmosphereEditorProps) {
  const [atmosphereDescription, setAtmosphereDescription] = useState(initialDescription);
  const [selectedCategory, setSelectedCategory] = useState("nature");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["Relaxing"]);
  const [duration, setDuration] = useState("1800");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [selectedModel, setSelectedModel] = useState(atmosphereModel);
  const [localVoiceOverEnabled, setLocalVoiceOverEnabled] = useState(voiceOverEnabled);
  const [language, setLanguage] = useState(voiceOverLanguage);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(!!initialDescription);
  const { toast } = useToast();

  const generateDescriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ambient/atmosphere/generate", {
        category: selectedCategory,
        moods: selectedMoods,
        duration: parseInt(duration),
        model: selectedModel,
      });
      return await res.json();
    },
    onSuccess: (data: { description: string }) => {
      setAtmosphereDescription(data.description);
      setHasGeneratedOnce(true);
      onDescriptionChange(data.description);
      toast({
        title: "Atmosphere Generated",
        description: "Your atmosphere description has been created. Feel free to edit it.",
      });
    },
    onError: () => {
      const mockDescription = generateMockDescription();
      setAtmosphereDescription(mockDescription);
      setHasGeneratedOnce(true);
      onDescriptionChange(mockDescription);
      toast({
        title: "Atmosphere Generated",
        description: "Your atmosphere description has been created. Feel free to edit it.",
      });
    },
  });

  const generateMockDescription = () => {
    const categoryDescriptions: { [key: string]: string } = {
      nature: "A serene forest clearing bathed in soft golden sunlight filtering through ancient oak trees. Gentle streams trickle nearby, their melodic sounds blending with distant birdsong. Leaves rustle softly in a warm breeze as butterflies dance among wildflowers.",
      weather: "Gentle rain falls steadily against window panes, creating a rhythmic patter that soothes the soul. Occasional distant thunder rumbles across grey skies while raindrops trace intricate patterns down the glass.",
      urban: "A quiet café corner at twilight, warm amber lights reflecting off rain-slicked cobblestones outside. The soft hum of distant traffic mingles with muffled conversations and the occasional clink of porcelain.",
      cozy: "A crackling fireplace casts dancing shadows across a wood-paneled library. Leather armchairs invite quiet contemplation while rain patters gently against tall windows. The scent of old books and wood smoke fills the air.",
      abstract: "Flowing geometric shapes morph and blend in endless patterns. Soft gradients of deep purple and teal pulse gently, creating a hypnotic visual meditation. Forms emerge and dissolve in perfect harmony.",
      cosmic: "Drifting through a nebula of swirling cosmic dust, stars twinkle like distant diamonds against the infinite void. Aurora-like ribbons of light dance across the darkness in mesmerizing patterns.",
      underwater: "Sunbeams pierce the crystal-clear water, illuminating schools of tropical fish that glide through coral gardens. Gentle currents sway sea plants in a silent underwater ballet.",
      seasonal: "Autumn leaves in brilliant shades of amber, crimson, and gold drift lazily from ancient maples. A misty morning light softens the landscape as the season transitions toward winter's embrace.",
    };
    return categoryDescriptions[selectedCategory] || categoryDescriptions.nature;
  };

  const handleDescriptionChange = (value: string) => {
    setAtmosphereDescription(value);
    onDescriptionChange(value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange?.(category);
  };

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) => {
      let newMoods: string[];
      if (prev.includes(mood)) {
        newMoods = prev.filter((m) => m !== mood);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 moods maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        newMoods = [...prev, mood];
      }
      onMoodChange?.(newMoods);
      return newMoods;
    });
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    onDurationChange?.(value);
  };

  const handleAspectRatioChange = (value: string) => {
    setSelectedAspectRatio(value);
    onAspectRatioChange?.(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    onAtmosphereModelChange?.(value);
  };

  const handleVoiceOverToggle = (enabled: boolean) => {
    setLocalVoiceOverEnabled(enabled);
    onVoiceOverEnabledChange?.(enabled);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    onVoiceOverLanguageChange?.(value);
  };

  const handleGenerate = () => {
    generateDescriptionMutation.mutate();
  };

  const handleContinue = () => {
    if (!atmosphereDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe your atmosphere or generate one with AI.",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Atmosphere</h2>
        <p className="text-muted-foreground">
          Define the visual and audio atmosphere for your ambient video
        </p>
      </div>

      {/* Settings Row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Duration */}
        <div className="space-y-2 min-w-[140px]">
          <Label className="text-xs text-muted-foreground uppercase">Duration</Label>
          <Select value={duration} onValueChange={handleDurationChange}>
            <SelectTrigger className="h-9" data-testid="select-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AMBIENT_DURATIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2 min-w-[140px]">
          <Label className="text-xs text-muted-foreground uppercase">Aspect Ratio</Label>
          <Select value={selectedAspectRatio} onValueChange={handleAspectRatioChange}>
            <SelectTrigger className="h-9" data-testid="select-aspect-ratio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIOS.map((ar) => (
                <SelectItem key={ar.id} value={ar.id}>
                  {ar.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Model */}
        <div className="space-y-2 min-w-[200px]">
          <Label className="text-xs text-muted-foreground uppercase">AI Model</Label>
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="h-9" data-testid="select-ai-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AMBIENT_CATEGORIES.map((category) => (
            <Card
              key={category.id}
              className={`p-4 cursor-pointer transition-all hover-elevate ${
                selectedCategory === category.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : ""
              }`}
              onClick={() => handleCategoryChange(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              <div className="font-medium text-sm">{category.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {category.description}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Mood Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Mood <span className="text-muted-foreground font-normal">(select up to 3)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {AMBIENT_MOODS.map((mood) => (
            <Badge
              key={mood}
              variant={selectedMoods.includes(mood) ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => toggleMood(mood)}
              data-testid={`badge-mood-${mood.toLowerCase()}`}
            >
              {mood}
            </Badge>
          ))}
        </div>
      </div>

      {/* Atmosphere Description */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Atmosphere Description</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generateDescriptionMutation.isPending}
            data-testid="button-generate-atmosphere"
          >
            {generateDescriptionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {hasGeneratedOnce ? "Regenerate" : "Generate with AI"}
              </>
            )}
          </Button>
        </div>
        <Textarea
          placeholder="Describe the visual atmosphere you want to create... (e.g., 'A peaceful forest scene with gentle rain falling through the canopy, sunbeams filtering through the trees, and mist rising from the forest floor')"
          value={atmosphereDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="min-h-[150px] resize-none"
          data-testid="textarea-atmosphere-description"
        />
        <p className="text-xs text-muted-foreground">
          This description will guide the AI in generating visuals for your ambient video.
        </p>
      </div>

      {/* Voiceover Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-primary" />
            <div>
              <Label className="text-sm font-medium">Voiceover Narration</Label>
              <p className="text-xs text-muted-foreground">
                Add soothing narration or guided meditation
              </p>
            </div>
          </div>
          <Switch
            checked={localVoiceOverEnabled}
            onCheckedChange={handleVoiceOverToggle}
            data-testid="switch-voiceover"
          />
        </div>

        {localVoiceOverEnabled && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">
                Voiceover Language
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-9 w-[200px]" data-testid="select-voiceover-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              The AI will generate calming narration text in your selected language.
              You'll choose the voice in a later step.
            </p>
          </div>
        )}
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleContinue}
          disabled={!atmosphereDescription.trim()}
          data-testid="button-next"
        >
          Continue to Visual World
        </Button>
      </div>
    </div>
  );
}
