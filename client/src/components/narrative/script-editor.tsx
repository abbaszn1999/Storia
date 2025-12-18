import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Film, Globe, Clock, Palette, MessageSquare, FileText, Wand2, RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScriptEditorProps {
  initialScript?: string;
  aspectRatio?: string;
  scriptModel?: string;
  videoMode?: "narrative" | "character-vlog";
  narrationStyle?: "third-person" | "first-person";
  onScriptChange: (script: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onScriptModelChange?: (model: string) => void;
  onNarrationStyleChange?: (style: "third-person" | "first-person") => void;
  onNext: () => void;
}

const NARRATION_STYLES = [
  { id: "third-person", label: "Third Person", description: "The narrator describes the character's actions" },
  { id: "first-person", label: "First Person", description: "The character narrates their own story" },
];

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o", description: "Latest OpenAI model, fast and capable", badge: "Recommended" },
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
  { id: "16:9", label: "16:9", description: "YouTube", icon: RectangleHorizontal },
  { id: "9:16", label: "9:16", description: "TikTok, Reels", icon: RectangleVertical },
  { id: "1:1", label: "1:1", description: "Instagram", icon: Square },
];

export function ScriptEditor({ 
  initialScript = "", 
  aspectRatio = "16:9", 
  scriptModel = "gpt-4o", 
  videoMode = "narrative",
  narrationStyle = "third-person",
  onScriptChange, 
  onAspectRatioChange, 
  onScriptModelChange, 
  onNarrationStyleChange,
  onNext 
}: ScriptEditorProps) {
  const [storyIdea, setStoryIdea] = useState("");
  const [generatedScript, setGeneratedScript] = useState(initialScript);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(!!initialScript);
  const [duration, setDuration] = useState("60");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [selectedModel, setSelectedModel] = useState(scriptModel);
  const [selectedNarrationStyle, setSelectedNarrationStyle] = useState(narrationStyle);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Adventure"]);
  const [selectedTones, setSelectedTones] = useState<string[]>(["Dramatic"]);
  const [language, setLanguage] = useState("English");
  const { toast } = useToast();

  const accentClasses = "from-purple-500 to-pink-500";

  const expandScriptMutation = useMutation({
    mutationFn: async (userIdea: string) => {
      const res = await apiRequest('POST', '/api/narrative/script/generate', {
        duration: parseInt(duration),
        genres: selectedGenres,
        tones: selectedTones,
        language,
        aspectRatio: selectedAspectRatio,
        model: selectedModel,
        userPrompt: userIdea,
        mode: 'expand',
      });
      return await res.json();
    },
    onSuccess: (data: { script: string }) => {
      setGeneratedScript(data.script);
      setHasGeneratedOnce(true);
      onScriptChange(data.script);
      toast({
        title: "Script Generated",
        description: "Your story idea has been expanded into a full script.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratedScriptChange = (value: string) => {
    setGeneratedScript(value);
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
    if (!storyIdea.trim()) {
      toast({
        title: "Story Idea Required",
        description: "Please write a story idea first before generating a script.",
        variant: "destructive",
      });
      return;
    }
    expandScriptMutation.mutate(storyIdea);
  };

  const ideaCharCount = storyIdea.length;
  const scriptCharCount = generatedScript.length;
  const wordCount = generatedScript.trim() ? generatedScript.trim().split(/\s+/).length : 0;

  return (
    <div className="flex w-full gap-0 overflow-hidden">
      {/* LEFT COLUMN: SETTINGS (35% width) */}
      <div
        className={cn(
          "w-[35%] min-w-[350px] max-w-[500px] flex-shrink-0",
          "bg-black/40 backdrop-blur-xl",
          "border-r border-white/[0.06]",
          "flex flex-col overflow-hidden",
          "max-h-[calc(100vh-12rem)]"
        )}
      >
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">
            {/* AI Model Selection */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">AI Model</Label>
                </div>
                <Select 
                  value={selectedModel} 
                  onValueChange={(value) => {
                    setSelectedModel(value);
                    onScriptModelChange?.(value);
                  }}
                >
                  <SelectTrigger className="h-auto min-h-[48px] py-2.5 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select AI model">
                      {(() => {
                        const model = AI_MODELS.find(m => m.value === selectedModel);
                        if (!model) return "Select AI model";
                        return (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium text-white">{model.label}</div>
                              <div className="text-xs text-white/50">{model.description}</div>
                            </div>
                            {model.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border-purple-500/50 text-purple-300 flex-shrink-0">
                                {model.badge}
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] bg-[#0a0a0a] border-white/10">
                    {AI_MODELS.map((model) => (
                      <SelectItem 
                        key={model.value} 
                        value={model.value}
                        className="py-3 focus:bg-purple-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500/30 data-[state=checked]:to-pink-500/30 data-[state=checked]:text-white"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.label}</span>
                            {model.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 border-purple-500/50 text-purple-300">
                                {model.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-white/50">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Aspect Ratio</Label>
                </div>
                <p className="text-sm text-white/50">Choose dimensions for your video</p>
                <div className="grid grid-cols-3 gap-3">
                  {ASPECT_RATIOS.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => {
                          setSelectedAspectRatio(ratio.id);
                          onAspectRatioChange?.(ratio.id);
                        }}
                        className={cn(
                          "p-4 rounded-lg border transition-all hover-elevate text-center",
                          selectedAspectRatio === ratio.id
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`button-aspect-ratio-${ratio.id}`}
                      >
                        <Icon className="h-5 w-5 mx-auto mb-2 text-white" />
                        <div className="font-semibold text-sm text-white">{ratio.label}</div>
                        <div className="text-xs text-white/40">{ratio.description}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Duration */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Target Duration</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur.value}
                      onClick={() => setDuration(dur.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                        duration === dur.value
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20 text-white")
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                      )}
                      data-testid={`button-duration-${dur.value}`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Language</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover-elevate",
                        language === lang
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20 text-white")
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                      )}
                      data-testid={`button-language-${lang.toLowerCase()}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <Label className="text-lg font-semibold text-white">Genres</Label>
                  </div>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{selectedGenres.length}/3</Badge>
                </div>
                <p className="text-sm text-white/50">Select up to 3 genres</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <Badge
                      key={genre}
                      className={cn(
                        "cursor-pointer hover-elevate transition-all",
                        selectedGenres.includes(genre)
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/[0.07]"
                      )}
                      onClick={() => toggleGenre(genre)}
                      data-testid={`badge-genre-${genre.toLowerCase()}`}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tones */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    <Label className="text-lg font-semibold text-white">Tones</Label>
                  </div>
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">{selectedTones.length}/3</Badge>
                </div>
                <p className="text-sm text-white/50">Select up to 3 tones</p>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <Badge
                      key={tone}
                      className={cn(
                        "cursor-pointer hover-elevate transition-all",
                        selectedTones.includes(tone)
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-300"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/[0.07]"
                      )}
                      onClick={() => toggleTone(tone)}
                      data-testid={`badge-tone-${tone.toLowerCase()}`}
                    >
                      {tone}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Narration Style - Only for Character Vlog mode */}
            {videoMode === "character-vlog" && (
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <Label className="text-lg font-semibold text-white">Narration Style</Label>
                  </div>
                  <div className="space-y-2">
                    {NARRATION_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedNarrationStyle(style.id as "third-person" | "first-person");
                          onNarrationStyleChange?.(style.id as "third-person" | "first-person");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all hover-elevate",
                          selectedNarrationStyle === style.id
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                        data-testid={`button-narration-${style.id}`}
                      >
                        <div className="font-medium text-sm text-white">{style.label}</div>
                        <div className="text-xs text-white/50 mt-1">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: SCRIPT CONTENT (65% width) */}
      <div className="flex-1 relative flex flex-col overflow-hidden max-h-[calc(100vh-12rem)]">
        {/* Story Idea Section */}
        <div className="flex-shrink-0 p-6 border-b border-white/[0.04]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", accentClasses)}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">Your Story Idea</h3>
              </div>
              <span className="text-xs text-white/40">{ideaCharCount} characters</span>
            </div>
            
            <Textarea
              placeholder="Write a brief story idea or outline... AI will expand it into a full script."
              value={storyIdea}
              onChange={(e) => setStoryIdea(e.target.value)}
              className={cn(
                "min-h-[120px] resize-none bg-white/5 border-white/10 text-white",
                "focus:outline-none focus:border-purple-500/50 transition-all",
                "placeholder:text-white/30"
              )}
              data-testid="input-story-idea"
            />

            <Button
              onClick={handleExpand}
              disabled={expandScriptMutation.isPending || !storyIdea.trim()}
              className={cn(
                "bg-gradient-to-r w-full",
                accentClasses,
                "text-white hover:opacity-90 h-auto py-2.5 rounded-lg font-medium",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              )}
              data-testid="button-expand-script"
            >
              {expandScriptMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Script...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Full Script</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Generated Script Section */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-white">Generated Script</h3>
                <p className="text-xs text-white/40">
                  {hasGeneratedOnce ? "Edit and refine your script" : "Generate a script first"}
                </p>
              </div>
            </div>
            {hasGeneratedOnce && (
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>{scriptCharCount} chars</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </div>
            )}
          </div>

          <div className="flex-1 relative rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            <Textarea
              value={generatedScript}
              onChange={(e) => handleGeneratedScriptChange(e.target.value)}
              placeholder={hasGeneratedOnce ? "Edit your AI-generated script here..." : "Generate a script from your story idea first. The AI-generated script will appear here and you can edit it."}
              disabled={!hasGeneratedOnce}
              className={cn(
                "w-full h-full bg-transparent border-0 p-5 text-[15px] leading-relaxed",
                "focus:outline-none focus:ring-0 resize-none",
                "placeholder:text-white/20 text-white/90",
                "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              )}
              data-testid="input-generated-script"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
