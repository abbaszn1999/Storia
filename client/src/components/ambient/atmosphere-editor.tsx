import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, Volume2, VolumeX, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AtmosphereEditorProps {
  initialDescription?: string;
  initialVoiceOverScript?: string;
  aspectRatio?: string;
  atmosphereModel?: string;
  voiceOverEnabled?: boolean;
  voiceOverLanguage?: string;
  onDescriptionChange: (description: string) => void;
  onVoiceOverScriptChange?: (script: string) => void;
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
  { value: "gpt-4o", label: "GPT-4o (Recommended)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

const AMBIENT_CATEGORIES = [
  { id: "nature", label: "Nature", description: "Forests, oceans, mountains" },
  { id: "weather", label: "Weather", description: "Rain, snow, storms" },
  { id: "urban", label: "Urban", description: "City streets, cafes" },
  { id: "cozy", label: "Cozy Spaces", description: "Fireplaces, libraries" },
  { id: "abstract", label: "Abstract", description: "Geometric, flowing" },
  { id: "cosmic", label: "Cosmic", description: "Space, stars, nebulae" },
  { id: "underwater", label: "Underwater", description: "Ocean depths, reefs" },
  { id: "seasonal", label: "Seasonal", description: "Spring, autumn, winter" },
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
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
];

export function AtmosphereEditor({
  initialDescription = "",
  initialVoiceOverScript = "",
  aspectRatio = "16:9",
  atmosphereModel = "gpt-4o",
  voiceOverEnabled = false,
  voiceOverLanguage = "English",
  onDescriptionChange,
  onVoiceOverScriptChange,
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
  const [storyIdea, setStoryIdea] = useState("");
  const [generatedScript, setGeneratedScript] = useState(initialVoiceOverScript);
  const [selectedCategory, setSelectedCategory] = useState("nature");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["Relaxing"]);
  const [duration, setDuration] = useState("1800");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [selectedModel, setSelectedModel] = useState(atmosphereModel);
  const [localVoiceOverEnabled, setLocalVoiceOverEnabled] = useState(voiceOverEnabled);
  const [language, setLanguage] = useState(voiceOverLanguage);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDescriptionChange = (value: string) => {
    setAtmosphereDescription(value);
    onDescriptionChange(value);
  };

  const handleVoiceOverScriptChange = (value: string) => {
    setGeneratedScript(value);
    onVoiceOverScriptChange?.(value);
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

  const handleGenerateAtmosphere = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const categoryDescriptions: { [key: string]: string } = {
        nature: "A serene forest clearing bathed in soft golden sunlight filtering through ancient oak trees. Gentle streams trickle nearby, their melodic sounds blending with distant birdsong. Leaves rustle softly in a warm breeze as butterflies dance among wildflowers.",
        weather: "Gentle rain falls steadily against window panes, creating a rhythmic patter that soothes the soul. Occasional distant thunder rumbles across grey skies while raindrops trace intricate patterns down the glass.",
        urban: "A quiet cafe corner at twilight, warm amber lights reflecting off rain-slicked cobblestones outside. The soft hum of distant traffic mingles with muffled conversations and the occasional clink of porcelain.",
        cozy: "A crackling fireplace casts dancing shadows across a wood-paneled library. Leather armchairs invite quiet contemplation while rain patters gently against tall windows. The scent of old books and wood smoke fills the air.",
        abstract: "Flowing geometric shapes morph and blend in endless patterns. Soft gradients of deep purple and teal pulse gently, creating a hypnotic visual meditation. Forms emerge and dissolve in perfect harmony.",
        cosmic: "Drifting through a nebula of swirling cosmic dust, stars twinkle like distant diamonds against the infinite void. Aurora-like ribbons of light dance across the darkness in mesmerizing patterns.",
        underwater: "Sunbeams pierce the crystal-clear water, illuminating schools of tropical fish that glide through coral gardens. Gentle currents sway sea plants in a silent underwater ballet.",
        seasonal: "Autumn leaves in brilliant shades of amber, crimson, and gold drift lazily from ancient maples. A misty morning light softens the landscape as the season transitions toward winter's embrace.",
      };
      
      const description = categoryDescriptions[selectedCategory] || categoryDescriptions.nature;
      setAtmosphereDescription(description);
      onDescriptionChange(description);
      setIsGenerating(false);
      
      toast({
        title: "Atmosphere Generated",
        description: "Your atmosphere description has been created. Feel free to edit it.",
      });
    }, 1500);
  };

  const handleGenerateScript = () => {
    if (!storyIdea.trim()) {
      toast({
        title: "Story Idea Required",
        description: "Please write a story idea first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const mockScript = `[Opening - Soft ambient music fades in]

${storyIdea}

[The scene unfolds with gentle, soothing imagery]

Take a deep breath in... and slowly release. Let the ${selectedCategory} surround you with its natural tranquility.

As you watch these ${selectedMoods.join(", ").toLowerCase()} visuals, allow your mind to drift into a state of peaceful awareness.

[Pause for 10 seconds - ambient sounds only]

Notice how the ${selectedCategory === "nature" ? "leaves sway gently in the breeze" : selectedCategory === "weather" ? "rain creates a rhythmic pattern" : selectedCategory === "cosmic" ? "stars shimmer in the cosmic void" : "scene transforms before you"}...

Let this moment be yours. A space for calm. A space for peace.

[Gentle music continues as visuals flow]

Remember: this tranquility is always available to you. Whenever you need it, close your eyes and return to this place.

[Fade out with soft ambient tones]`;

      setGeneratedScript(mockScript);
      onVoiceOverScriptChange?.(mockScript);
      setIsGenerating(false);
      
      toast({
        title: "Script Generated",
        description: "Your voiceover script has been created. Feel free to edit it.",
      });
    }, 2000);
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
    
    if (localVoiceOverEnabled && !generatedScript.trim()) {
      toast({
        title: "Script Required",
        description: "Please generate a voiceover script first.",
        variant: "destructive",
      });
      return;
    }
    
    onNext();
  };

  const characterCount = localVoiceOverEnabled ? storyIdea.length : atmosphereDescription.length;
  const scriptCharacterCount = generatedScript.length;

  return (
    <div className="flex gap-6 p-6 h-full">
      {/* Left Panel - Settings */}
      <div className="w-[280px] flex-shrink-0 space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            AI will create a visual atmosphere based on your selections.
            {localVoiceOverEnabled && " Enable voiceover to add soothing narration."}
          </p>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Aspect Ratio</Label>
          <div className="flex gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <Button
                key={ar.id}
                variant={selectedAspectRatio === ar.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleAspectRatioChange(ar.id)}
                className="flex-1"
                data-testid={`button-aspect-${ar.id}`}
              >
                {ar.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Duration</Label>
          <div className="grid grid-cols-2 gap-2">
            {AMBIENT_DURATIONS.slice(0, 4).map((d) => (
              <Button
                key={d.value}
                variant={duration === d.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleDurationChange(d.value)}
                data-testid={`button-duration-${d.value}`}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <Button
            variant={duration === "7200" ? "default" : "outline"}
            size="sm"
            onClick={() => handleDurationChange("7200")}
            className="w-full"
            data-testid="button-duration-7200"
          >
            2 hours
          </Button>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {AMBIENT_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category.id)}
                className="justify-start text-xs h-auto py-2 px-2"
                data-testid={`button-category-${category.id}`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Moods (1/3 Max)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {AMBIENT_MOODS.map((mood) => (
              <Badge
                key={mood}
                variant={selectedMoods.includes(mood) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleMood(mood)}
                data-testid={`badge-mood-${mood.toLowerCase()}`}
              >
                {mood}
              </Badge>
            ))}
          </div>
        </div>

        {/* Voiceover Toggle */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Voiceover</Label>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {localVoiceOverEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {localVoiceOverEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <Switch
                checked={localVoiceOverEnabled}
                onCheckedChange={handleVoiceOverToggle}
                data-testid="switch-voiceover"
              />
            </div>
          </Card>
        </div>

        {/* Language - Only show when voiceover enabled */}
        {localVoiceOverEnabled && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Language</Label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <Badge
                  key={lang}
                  variant={language === lang ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleLanguageChange(lang)}
                  data-testid={`badge-lang-${lang.toLowerCase()}`}
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Atmosphere Description - Always visible */}
        <div className="flex-1 flex flex-col space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Atmosphere Description</Label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{atmosphereDescription.length} characters</span>
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs" data-testid="select-ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-xs">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            placeholder="Describe the visual atmosphere you want to create... (e.g., 'A peaceful forest scene with gentle rain falling through the canopy, sunbeams filtering through the trees, and mist rising from the forest floor')"
            value={atmosphereDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className={`resize-none ${localVoiceOverEnabled ? 'min-h-[120px]' : 'min-h-[300px] flex-1'}`}
            data-testid="textarea-atmosphere-description"
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateAtmosphere}
            disabled={isGenerating}
            className="w-fit"
            data-testid="button-generate-atmosphere"
          >
            {isGenerating && !localVoiceOverEnabled ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Atmosphere
              </>
            )}
          </Button>
        </div>

        {/* Voiceover Section - Only visible when enabled */}
        {localVoiceOverEnabled ? (
          <div className="flex flex-col space-y-4 border-t pt-4">
            {/* Story Idea Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Your Story Idea</Label>
                <span className="text-xs text-muted-foreground">{characterCount} characters</span>
              </div>
              <Textarea
                placeholder="Write a brief story idea or outline for your ambient voiceover... AI will expand it into a soothing narration script."
                value={storyIdea}
                onChange={(e) => setStoryIdea(e.target.value)}
                className="min-h-[100px] resize-none"
                data-testid="textarea-story-idea"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateScript}
                disabled={isGenerating || !storyIdea.trim()}
                data-testid="button-generate-script"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Script
                  </>
                )}
              </Button>
            </div>

            {/* Generated Script Section */}
            <div className="flex-1 flex flex-col space-y-2 min-h-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Generated Script</Label>
                <span className="text-xs text-muted-foreground">{scriptCharacterCount} characters</span>
              </div>
              <Textarea
                placeholder="Generate a script from your story idea first. The AI-generated script will appear here and you can edit it."
                value={generatedScript}
                onChange={(e) => handleVoiceOverScriptChange(e.target.value)}
                className="flex-1 resize-none min-h-[150px]"
                data-testid="textarea-generated-script"
              />
            </div>
          </div>
        ) : (
          /* Locked hint for voiceover section */
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/30 border border-dashed border-border">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Enable voiceover to add soothing narration to your ambient video
            </p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end pt-6 mt-auto">
          <Button
            onClick={handleContinue}
            data-testid="button-next"
          >
            Continue to Visual World
          </Button>
        </div>
      </div>
    </div>
  );
}
