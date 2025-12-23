import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Globe, Clock, Palette, MessageSquare, FileText, Wand2, User, MapPin, LayoutGrid, Camera, Grid3x3, Building2, TreePine, Home, MonitorPlay, Wand, Cpu, Radio, Paintbrush } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CharacterVlogScriptEditorProps {
  initialScript?: string;
  scriptModel?: string;
  narrationStyle?: "third-person" | "first-person";
  theme?: string;
  numberOfScenes?: number | 'auto';
  shotsPerScene?: number | 'auto';
  characterPersonality?: string;
  onScriptChange: (script: string) => void;
  onScriptModelChange?: (model: string) => void;
  onNarrationStyleChange?: (style: "third-person" | "first-person") => void;
  onThemeChange?: (theme: string) => void;
  onNumberOfScenesChange?: (scenes: number | 'auto') => void;
  onShotsPerSceneChange?: (shots: number | 'auto') => void;
  onCharacterPersonalityChange?: (personality: string) => void;
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
  "Documentary", "Action", "Lifestyle", "Travel", "Gaming"
];

const TONES = [
  "Dramatic", "Lighthearted", "Mysterious", "Inspirational",
  "Dark", "Whimsical", "Serious", "Playful", "Epic",
  "Nostalgic", "Uplifting", "Suspenseful", "Energetic", "Chill"
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

const THEMES = [
  { value: "urban", label: "Urban / City", icon: Building2 },
  { value: "nature", label: "Nature / Outdoors", icon: TreePine },
  { value: "home", label: "Home / Interior", icon: Home },
  { value: "studio", label: "Studio / Minimal", icon: MonitorPlay },
  { value: "fantasy", label: "Fantasy / Magical", icon: Wand },
  { value: "tech", label: "Tech / Futuristic", icon: Cpu },
  { value: "retro", label: "Retro / Vintage", icon: Radio },
  { value: "anime", label: "Anime / Animated", icon: Paintbrush },
];

const PERSONALITIES = [
  { value: "energetic", label: "Energetic", description: "Upbeat, enthusiastic, and dynamic" },
  { value: "calm", label: "Calm", description: "Relaxed, soothing, and peaceful" },
  { value: "humorous", label: "Humorous", description: "Funny, witty, and entertaining" },
  { value: "serious", label: "Serious", description: "Professional, focused, and informative" },
  { value: "mysterious", label: "Mysterious", description: "Enigmatic, intriguing, and curious" },
  { value: "inspirational", label: "Inspirational", description: "Motivating, uplifting, and empowering" },
  { value: "friendly", label: "Friendly", description: "Warm, approachable, and relatable" },
  { value: "adventurous", label: "Adventurous", description: "Bold, daring, and exploratory" },
];

export function CharacterVlogScriptEditor({ 
  initialScript = "", 
  scriptModel = "gpt-4o", 
  narrationStyle = "first-person",
  theme = "urban",
  numberOfScenes = 'auto',
  shotsPerScene = 'auto',
  characterPersonality = "energetic",
  onScriptChange, 
  onScriptModelChange, 
  onNarrationStyleChange,
  onThemeChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onCharacterPersonalityChange,
  onNext 
}: CharacterVlogScriptEditorProps) {
  const [storyIdea, setStoryIdea] = useState("");
  const [generatedScript, setGeneratedScript] = useState(initialScript);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(!!initialScript);
  const [duration, setDuration] = useState("60");
  const [selectedModel, setSelectedModel] = useState(scriptModel);
  const [selectedNarrationStyle, setSelectedNarrationStyle] = useState(narrationStyle);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["Lifestyle"]);
  const [selectedTones, setSelectedTones] = useState<string[]>(["Energetic"]);
  const [language, setLanguage] = useState("English");
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedNumberOfScenes, setSelectedNumberOfScenes] = useState<number | 'auto'>(numberOfScenes);
  const [selectedShotsPerScene, setSelectedShotsPerScene] = useState<number | 'auto'>(shotsPerScene);
  const [selectedPersonality, setSelectedPersonality] = useState(characterPersonality);
  const { toast } = useToast();

  const accentClasses = "from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A]"; // Gradient pink to orange from logo

  const expandScriptMutation = useMutation({
    mutationFn: async (userIdea: string) => {
      const res = await apiRequest('POST', '/api/narrative/script/generate', {
        duration: parseInt(duration),
        genres: selectedGenres,
        tones: selectedTones,
        language,
        model: selectedModel,
        userPrompt: userIdea,
        mode: 'expand',
        narrationStyle: selectedNarrationStyle,
        characterPersonality: selectedPersonality,
        theme: selectedTheme,
      });
      return await res.json();
    },
    onSuccess: (data: { script: string }) => {
      setGeneratedScript(data.script);
      setHasGeneratedOnce(true);
      onScriptChange(data.script);
      toast({
        title: "Script Generated",
        description: "Your vlog script has been created.",
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
        title: "Vlog Idea Required",
        description: "Please write a vlog idea first before generating a script.",
        variant: "destructive",
      });
      return;
    }
    expandScriptMutation.mutate(storyIdea);
  };

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    onThemeChange?.(value);
  };

  const handlePersonalityChange = (value: string) => {
    setSelectedPersonality(value);
    onCharacterPersonalityChange?.(value);
  };

  const ideaCharCount = storyIdea.length;
  const scriptCharCount = generatedScript.length;
  const wordCount = generatedScript.trim() ? generatedScript.trim().split(/\s+/).length : 0;

  return (
    <div className="flex w-full gap-0 overflow-hidden">
      {/* LEFT COLUMN: ALL SETTINGS (40% width) */}
      <div
        className={cn(
          "w-[40%] min-w-[400px] max-w-[550px] flex-shrink-0",
          "bg-[#1a1a1a]",
          "border-r border-white/[0.06]",
          "flex flex-col overflow-hidden"
        )}
      >
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-4">
            {/* Character Personality */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative p-1 rounded-md">
                    <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                    <User className="w-4 h-4 text-white relative z-10" />
                  </div>
                  <Label className="text-lg font-semibold text-white">Character Personality</Label>
                </div>
                <p className="text-sm text-white/50">Define your character's vibe and energy</p>
                <div className="grid grid-cols-2 gap-3">
                  {PERSONALITIES.map((personality) => (
                    <button
                      key={personality.value}
                      onClick={() => handlePersonalityChange(personality.value)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all hover-elevate relative overflow-hidden",
                        selectedPersonality === personality.value
                          ? "border-white/20"
                          : "bg-[#0f0f0f] border-white/10 hover:bg-white/10"
                      )}
                      style={selectedPersonality === personality.value ? {
                        background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                      } : undefined}
                    >
                      <div className="font-medium text-sm text-white">{personality.label}</div>
                      <div className="text-xs text-white/50 mt-1">{personality.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Narration Style */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative p-1 rounded-md">
                    <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                    <FileText className="w-4 h-4 text-white relative z-10" />
                  </div>
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
                        "w-full text-left p-3 rounded-lg border transition-all hover-elevate relative overflow-hidden",
                        selectedNarrationStyle === style.id
                          ? "border-white/20"
                          : "bg-[#0f0f0f] border-white/10 hover:bg-white/10"
                      )}
                      style={selectedNarrationStyle === style.id ? {
                        background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                      } : undefined}
                      data-testid={`button-narration-${style.id}`}
                    >
                      <div className="font-medium text-sm text-white">{style.label}</div>
                      <div className="text-xs text-white/50 mt-1">{style.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme / Environment */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-3">
                <Label className="text-base font-semibold text-white">Theme / Environment</Label>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((themeOption) => {
                    const Icon = themeOption.icon;
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value)}
                        className={cn(
                          "p-2.5 rounded-lg border text-center transition-all hover-elevate relative overflow-hidden",
                          selectedTheme === themeOption.value
                            ? "border-white/20"
                            : "bg-[#0f0f0f] border-white/10 hover:bg-white/10"
                        )}
                        style={selectedTheme === themeOption.value ? {
                          background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                        } : undefined}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1 text-white" />
                        <div className="text-[10px] font-medium text-white leading-tight">{themeOption.label}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Duration & Language */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Target Duration */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/70">Target Duration</Label>
                    <Select 
                      value={duration} 
                      onValueChange={setDuration}
                    >
                      <SelectTrigger className="h-10 bg-[#0f0f0f] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-white/10">
                        {DURATIONS.map((dur) => (
                          <SelectItem 
                            key={dur.value} 
                            value={dur.value}
                            className="text-white focus:bg-[#FF4081]/20 focus:text-white"
                          >
                            {dur.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/70">Language</Label>
                    <Select 
                      value={language} 
                      onValueChange={setLanguage}
                    >
                      <SelectTrigger className="h-10 bg-[#0f0f0f] border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-white/10">
                        {LANGUAGES.map((lang) => (
                          <SelectItem 
                            key={lang} 
                            value={lang}
                            className="text-white focus:bg-[#FF4081]/20 focus:text-white"
                          >
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative p-1 rounded-md">
                      <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                      <Palette className="w-4 h-4 text-white relative z-10" />
                    </div>
                    <Label className="text-lg font-semibold text-white">Genres</Label>
                  </div>
                  <Badge variant="outline" className="bg-[#0f0f0f] border-white/10 text-white/70">{selectedGenres.length}/3</Badge>
                </div>
                <p className="text-sm text-white/50">Select up to 3 genres</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover-elevate relative overflow-hidden",
                        selectedGenres.includes(genre)
                          ? "border-white/20 text-white"
                          : "bg-[#0f0f0f] border-white/10 hover:bg-white/10 text-white/70"
                      )}
                      style={selectedGenres.includes(genre) ? {
                        background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                      } : undefined}
                      onClick={() => toggleGenre(genre)}
                      data-testid={`button-genre-${genre.toLowerCase()}`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tones */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative p-1 rounded-md">
                      <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                      <MessageSquare className="w-4 h-4 text-white relative z-10" />
                    </div>
                    <Label className="text-lg font-semibold text-white">Tones</Label>
                  </div>
                  <Badge variant="outline" className="bg-[#0f0f0f] border-white/10 text-white/70">{selectedTones.length}/3</Badge>
                </div>
                <p className="text-sm text-white/50">Select up to 3 tones</p>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover-elevate relative overflow-hidden",
                        selectedTones.includes(tone)
                          ? "border-white/20 text-white"
                          : "bg-[#0f0f0f] border-white/10 hover:bg-white/10 text-white/70"
                      )}
                      style={selectedTones.includes(tone) ? {
                        background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                      } : undefined}
                      onClick={() => toggleTone(tone)}
                      data-testid={`button-tone-${tone.toLowerCase()}`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Structure Settings */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative p-1 rounded-md">
                    <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                    <Grid3x3 className="w-4 h-4 text-white relative z-10" />
                  </div>
                  <Label className="text-lg font-semibold text-white">Structure Settings</Label>
                </div>
                
                <div className="space-y-4">
                  {/* Number of Scenes */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">Number of Scenes</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedNumberOfScenes('auto');
                          onNumberOfScenesChange?.('auto');
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-all relative overflow-hidden",
                          selectedNumberOfScenes === 'auto'
                            ? "border-white/20 text-white"
                            : "bg-[#0f0f0f] border-white/10 text-white/70 hover:bg-white/10"
                        )}
                        style={selectedNumberOfScenes === 'auto' ? {
                          background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                        } : undefined}
                      >
                        Auto
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={selectedNumberOfScenes === 'auto' ? '' : selectedNumberOfScenes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setSelectedNumberOfScenes(val);
                            onNumberOfScenesChange?.(val);
                          }
                        }}
                        placeholder="Enter number"
                        className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF4081]/70 focus:ring-1 focus:ring-[#FF6B4A]/50 placeholder:text-white/30"
                      />
                    </div>
                    <p className="text-xs text-white/40">AI will determine optimal scene count if set to Auto</p>
                  </div>

                  {/* Shots per Scene */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">Shots per Scene</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedShotsPerScene('auto');
                          onShotsPerSceneChange?.('auto');
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border transition-all relative overflow-hidden",
                          selectedShotsPerScene === 'auto'
                            ? "border-white/20 text-white"
                            : "bg-[#0f0f0f] border-white/10 text-white/70 hover:bg-white/10"
                        )}
                        style={selectedShotsPerScene === 'auto' ? {
                          background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                        } : undefined}
                      >
                        Auto
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={selectedShotsPerScene === 'auto' ? '' : selectedShotsPerScene}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            setSelectedShotsPerScene(val);
                            onShotsPerSceneChange?.(val);
                          }
                        }}
                        placeholder="Enter number"
                        className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF4081]/70 focus:ring-1 focus:ring-[#FF6B4A]/50 placeholder:text-white/30"
                      />
                    </div>
                    <p className="text-xs text-white/40">AI will vary shot count per scene if set to Auto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: SCRIPT GENERATION (60% width) */}
      <div className="flex-1 relative flex flex-col overflow-hidden bg-[#1a1a1a]">
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-4">
            {/* Story Idea Section */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative p-1.5 rounded-lg">
                      <div className={cn("absolute inset-0 rounded-lg bg-gradient-to-br opacity-60", accentClasses)} />
                      <Sparkles className="w-4 h-4 text-white relative z-10" />
                    </div>
                    <h3 className="text-base font-semibold text-white">Your Vlog Idea</h3>
                  </div>
                  <span className="text-xs text-white/40">{ideaCharCount} characters</span>
                </div>
                
                <Textarea
                  placeholder="Describe your vlog concept... AI will expand it into a full script."
                  value={storyIdea}
                  onChange={(e) => setStoryIdea(e.target.value)}
                  className={cn(
                    "min-h-[120px] resize-none bg-[#0f0f0f] border-white/10 text-white",
                    "focus:outline-none focus:border-[#FF4081]/70 focus:ring-1 focus:ring-[#FF6B4A]/50 transition-all",
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
              </CardContent>
            </Card>

            {/* Generated Script Section */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2 rounded-lg">
                      <div className={cn("absolute inset-0 rounded-lg bg-gradient-to-br opacity-60", accentClasses)} />
                      <FileText className="w-5 h-5 text-white relative z-10" />
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

                <div className="relative rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden min-h-[300px]">
                  <Textarea
                    value={generatedScript}
                    onChange={(e) => handleGeneratedScriptChange(e.target.value)}
                    placeholder={hasGeneratedOnce ? "Edit your AI-generated script here..." : "Generate a script from your vlog idea first. The AI-generated script will appear here and you can edit it."}
                    disabled={!hasGeneratedOnce}
                    className={cn(
                      "w-full h-full min-h-[300px] bg-transparent border-0 p-5 text-[15px] leading-relaxed",
                      "focus:outline-none focus:ring-0 resize-none",
                      "placeholder:text-white/20 text-white/90",
                      "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    )}
                    data-testid="input-generated-script"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}


