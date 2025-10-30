import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ScriptEditorProps {
  initialScript?: string;
  aspectRatio?: string;
  scriptModel?: string;
  onScriptChange: (script: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onScriptModelChange?: (model: string) => void;
  onNext: () => void;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recommended)", description: "Latest OpenAI model, fast and capable" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Previous generation OpenAI flagship" },
  { value: "gpt-4", label: "GPT-4", description: "Reliable and creative" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Anthropic's most capable model" },
  { value: "claude-3-opus", label: "Claude 3 Opus", description: "Deep reasoning and analysis" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Google's advanced model" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Fast and efficient" },
];

const GENRES = [
  "Adventure", "Fantasy", "Sci-Fi", "Comedy", "Drama", 
  "Horror", "Mystery", "Romance", "Thriller", "Educational",
  "Documentary", "Action"
];

const TONES = [
  "Dramatic", "Lighthearted", "Mysterious", "Inspirational",
  "Dark", "Whimsical", "Serious", "Playful", "Epic",
  "Nostalgic", "Uplifting", "Suspenseful"
];

const DURATIONS = [
  { value: "30", label: "30s" },
  { value: "60", label: "1min" },
  { value: "180", label: "3min" },
  { value: "300", label: "5min" },
  { value: "600", label: "10min" },
  { value: "1200", label: "20min+" },
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian",
  "Portuguese", "Japanese", "Korean", "Chinese", "Arabic"
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "1:1", label: "1:1" },
];

export function ScriptEditor({ initialScript = "", aspectRatio = "16:9", scriptModel = "gpt-4o", onScriptChange, onAspectRatioChange, onScriptModelChange, onNext }: ScriptEditorProps) {
  const [scriptMode, setScriptMode] = useState<"smart" | "basic">("smart");
  const [script, setScript] = useState(initialScript);
  const [duration, setDuration] = useState("60");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [selectedModel, setSelectedModel] = useState(scriptModel);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Adventure"]);
  const [selectedTones, setSelectedTones] = useState<string[]>(["Dramatic"]);
  const [language, setLanguage] = useState("English");
  const { toast } = useToast();

  const expandScriptMutation = useMutation({
    mutationFn: async (userScript: string) => {
      const res = await apiRequest('POST', '/api/narrative/script/generate', {
        duration: parseInt(duration),
        genres: selectedGenres,
        tones: selectedTones,
        language,
        aspectRatio: selectedAspectRatio,
        model: selectedModel,
        userPrompt: userScript,
        mode: 'expand',
      });
      return await res.json();
    },
    onSuccess: (data: { script: string }) => {
      setScript(data.script);
      onScriptChange(data.script);
      toast({
        title: "Script Expanded",
        description: "Your script has been enhanced by AI.",
      });
    },
    onError: () => {
      toast({
        title: "Expansion Failed",
        description: "Failed to expand script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScriptChange = (value: string) => {
    setScript(value);
    onScriptChange(value);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 genres maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        return [...prev, genre];
      }
    });
  };

  const toggleTone = (tone: string) => {
    setSelectedTones(prev => {
      if (prev.includes(tone)) {
        return prev.filter(t => t !== tone);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 tones maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        return [...prev, tone];
      }
    });
  };

  const handleExpand = () => {
    if (!script.trim()) {
      toast({
        title: "Script Required",
        description: "Please write a basic script first before expanding.",
        variant: "destructive",
      });
      return;
    }
    expandScriptMutation.mutate(script);
  };

  const handleContinue = () => {
    if (!script.trim()) {
      toast({
        title: "Script Required",
        description: "Please write your script before continuing.",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  const charCount = script.length;

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)]">
      {/* Left Sidebar: Settings */}
      <div className="w-80 space-y-6 overflow-y-auto pr-4">
        {/* Script Mode */}
        <div className="space-y-3">
          <Tabs value={scriptMode} onValueChange={(v) => setScriptMode(v as "smart" | "basic")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smart" data-testid="tab-smart-script">
                Smart Script
              </TabsTrigger>
              <TabsTrigger value="basic" data-testid="tab-basic-script">
                Basic Script
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Card className="p-3">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                {scriptMode === "smart" 
                  ? "AI will expand and enhance your script with rich details and storytelling." 
                  : "Your script will be used as-is without AI modifications."}
              </p>
            </div>
          </Card>
        </div>

        {/* AI Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">AI Model</Label>
          <Select 
            value={selectedModel} 
            onValueChange={(value) => {
              setSelectedModel(value);
              onScriptModelChange?.(value);
            }}
          >
            <SelectTrigger data-testid="select-ai-model">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value} data-testid={`option-model-${model.value}`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{model.label}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selects the AI model for script generation and scene breakdown
          </p>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Aspect Ratio</Label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => {
                  setSelectedAspectRatio(ratio.id);
                  onAspectRatioChange?.(ratio.id);
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all hover-elevate ${
                  selectedAspectRatio === ratio.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
                data-testid={`button-aspect-ratio-${ratio.id}`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Duration</Label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((dur) => (
              <button
                key={dur.value}
                onClick={() => setDuration(dur.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all hover-elevate ${
                  duration === dur.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
                data-testid={`button-duration-${dur.value}`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Video Language</Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all hover-elevate ${
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
                data-testid={`button-language-${lang.toLowerCase()}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Genres ({selectedGenres.length}/3 Max)</Label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => toggleGenre(genre)}
                data-testid={`badge-genre-${genre.toLowerCase()}`}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tones */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Tones ({selectedTones.length}/3 Max)</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <Badge
                key={tone}
                variant={selectedTones.includes(tone) ? "default" : "outline"}
                className="cursor-pointer hover-elevate"
                onClick={() => toggleTone(tone)}
                data-testid={`badge-tone-${tone.toLowerCase()}`}
              >
                {tone}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Script Editor */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="script" className="text-sm font-semibold">
              {scriptMode === "smart" ? "Your Story Idea" : "Your Script"}
            </Label>
            <span className="text-xs text-muted-foreground">
              {charCount} characters
            </span>
          </div>
          <Textarea
            id="script"
            placeholder={
              scriptMode === "smart"
                ? "Write a brief story idea or outline... AI will expand it into a full script."
                : "Write your complete script here. It will be used as-is for scene breakdown."
            }
            className="flex-1 resize-none font-mono text-sm"
            value={script}
            onChange={(e) => handleScriptChange(e.target.value)}
            data-testid="input-script"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          {scriptMode === "smart" ? (
            <Button
              onClick={handleExpand}
              disabled={expandScriptMutation.isPending || !script.trim()}
              data-testid="button-expand-script"
              className="bg-gradient-storia"
            >
              {expandScriptMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Expanding...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Expand Script
                </>
              )}
            </Button>
          ) : (
            <div />
          )}
          
          <Button 
            onClick={handleContinue} 
            disabled={!script.trim()} 
            data-testid="button-next"
          >
            Continue to Breakdown
          </Button>
        </div>
      </div>
    </div>
  );
}
