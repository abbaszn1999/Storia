import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, Film, Globe, Clock, Palette, MessageSquare, FileText, Wand2, RectangleHorizontal, RectangleVertical, Square, Grid3x3, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScriptEditorProps {
  videoId?: string;
  initialScript?: string;
  aspectRatio?: string;
  scriptModel?: string;
  videoMode?: "narrative" | "character-vlog";
  narrationStyle?: "third-person" | "first-person";
  // Initial values for restoring from database
  initialDuration?: string;
  initialGenres?: string[];
  initialTones?: string[];
  initialLanguage?: string;
  initialUserIdea?: string;
  initialNumberOfScenes?: number | 'auto';
  initialShotsPerScene?: number | 'auto';
  onScriptChange: (script: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onScriptModelChange?: (model: string) => void;
  onNarrationStyleChange?: (style: "third-person" | "first-person") => void;
  onNumberOfScenesChange?: (scenes: number | 'auto') => void;
  onShotsPerSceneChange?: (shots: number | 'auto') => void;
  onValidationChange?: (canContinue: boolean) => void;  // Called when validation state changes
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
  videoId,
  initialScript = "", 
  aspectRatio = "16:9", 
  scriptModel = "gpt-4o", 
  videoMode = "narrative",
  narrationStyle = "third-person",
  initialDuration = "60",
  initialGenres = ["Adventure"],
  initialTones = ["Dramatic"],
  initialLanguage = "English",
  initialUserIdea = "",
  initialNumberOfScenes = 'auto',
  initialShotsPerScene = 'auto',
  onScriptChange, 
  onAspectRatioChange, 
  onScriptModelChange, 
  onNarrationStyleChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onValidationChange,
  onNext 
}: ScriptEditorProps) {
  const [storyIdea, setStoryIdea] = useState(initialUserIdea);
  const [generatedScript, setGeneratedScript] = useState(initialScript);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(!!initialScript);
  const [duration, setDuration] = useState(initialDuration);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [selectedModel, setSelectedModel] = useState(scriptModel);
  const [selectedNarrationStyle, setSelectedNarrationStyle] = useState(narrationStyle);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [selectedTones, setSelectedTones] = useState<string[]>(initialTones);
  const [language, setLanguage] = useState(initialLanguage);
  const [selectedNumberOfScenes, setSelectedNumberOfScenes] = useState<number | 'auto'>(initialNumberOfScenes);
  const [selectedShotsPerScene, setSelectedShotsPerScene] = useState<number | 'auto'>(initialShotsPerScene);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const { toast } = useToast();

  // Track settings when script was created - to detect if settings changed after
  const [scriptSettingsSnapshot, setScriptSettingsSnapshot] = useState<{
    duration: string;
    genres: string[];
    tones: string[];
    language: string;
  } | null>(null);

  // Update state when props change (for restoring from database)
  useEffect(() => {
    if (initialScript !== generatedScript) {
      setGeneratedScript(initialScript);
      setHasGeneratedOnce(!!initialScript);
      
      // If script exists, restore the settings snapshot (assumes script was created with these settings)
      if (initialScript && initialScript.trim().length > 0) {
        setScriptSettingsSnapshot({
          duration: initialDuration,
          genres: initialGenres,
          tones: initialTones,
          language: initialLanguage,
        });
      }
    }
  }, [initialScript, initialDuration, initialGenres, initialTones, initialLanguage]);

  useEffect(() => {
    if (aspectRatio !== selectedAspectRatio) {
      setSelectedAspectRatio(aspectRatio);
    }
  }, [aspectRatio]);

  useEffect(() => {
    if (scriptModel !== selectedModel) {
      setSelectedModel(scriptModel);
    }
  }, [scriptModel]);

  // Restore settings from database
  useEffect(() => {
    if (initialDuration && initialDuration !== duration) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  useEffect(() => {
    if (initialGenres && initialGenres.length > 0) {
      setSelectedGenres(initialGenres);
    }
  }, [initialGenres]);

  useEffect(() => {
    if (initialTones && initialTones.length > 0) {
      setSelectedTones(initialTones);
    }
  }, [initialTones]);

  useEffect(() => {
    if (initialLanguage && initialLanguage !== language) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    if (initialUserIdea && initialUserIdea !== storyIdea) {
      setStoryIdea(initialUserIdea);
    }
  }, [initialUserIdea]);

  useEffect(() => {
    if (initialNumberOfScenes !== undefined) {
      setSelectedNumberOfScenes(initialNumberOfScenes);
    }
  }, [initialNumberOfScenes]);

  useEffect(() => {
    if (initialShotsPerScene !== undefined) {
      setSelectedShotsPerScene(initialShotsPerScene);
    }
  }, [initialShotsPerScene]);

  const accentClasses = "from-purple-500 to-pink-500";

  // Check if core settings have changed since script was created
  const settingsChangedSinceScript = scriptSettingsSnapshot !== null && (
    scriptSettingsSnapshot.duration !== duration ||
    JSON.stringify(scriptSettingsSnapshot.genres.sort()) !== JSON.stringify(selectedGenres.sort()) ||
    JSON.stringify(scriptSettingsSnapshot.tones.sort()) !== JSON.stringify(selectedTones.sort()) ||
    scriptSettingsSnapshot.language !== language
  );

  // Compute validation: user can continue if script exists AND settings haven't changed
  const hasScript = generatedScript.trim().length > 0;
  const canContinue = hasScript && !settingsChangedSinceScript;

  // Notify parent when validation state changes
  useEffect(() => {
    onValidationChange?.(canContinue);
  }, [canContinue, onValidationChange]);

  // Save step1 data using direct fetch (matching ambient visual mode pattern)
  const saveStep1Data = async (data: Record<string, any>): Promise<boolean> => {
    if (!videoId || videoId === 'new') {
      console.warn('[ScriptEditor] Cannot save - no valid videoId');
      return false;
    }

    console.log('[ScriptEditor] Saving step1 data:', { videoId, data });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[ScriptEditor] Save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save step1 data');
      }

      const result = await response.json();
      console.log('[ScriptEditor] Save successful:', result);
      return true;
    } catch (error) {
      console.error('[ScriptEditor] Save error:', error);
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
      return false;
    }
  };

  const expandScriptMutation = useMutation({
    mutationFn: async (userIdea: string) => {
      // Save ALL settings before generating script (matching ambient visual pattern)
      if (videoId && videoId !== 'new') {
        await saveStep1Data({
          duration: parseInt(duration),
          genres: selectedGenres,
          tones: selectedTones,
          language,
          aspectRatio: selectedAspectRatio,
          scriptModel: selectedModel,
          narrationStyle: videoMode === "character-vlog" ? selectedNarrationStyle : undefined,
          userIdea,
        });
      }

      // Backend expects: duration, genre, language, tone, userPrompt, model
      const res = await apiRequest('POST', '/api/narrative/script/generate', {
        duration: parseInt(duration),
        genre: selectedGenres.join(', '), // Convert array to comma-separated string
        language,
        tone: selectedTones.join(', '), // Convert array to comma-separated string
        userPrompt: userIdea,
        model: selectedModel, // Send selected AI model
      });
      return await res.json();
    },
    onSuccess: async (data: { script: string; estimatedDuration: number; metadata: any }) => {
      setGeneratedScript(data.script);
      setHasGeneratedOnce(true);
      onScriptChange(data.script);
      
      // Log estimated duration for debugging
      console.log('[ScriptEditor] Script generated:', {
        targetDuration: parseInt(duration),
        estimatedDuration: data.estimatedDuration,
        difference: data.estimatedDuration - parseInt(duration),
        metadata: data.metadata,
      });
      
      // Capture settings snapshot when script is generated
      setScriptSettingsSnapshot({
        duration,
        genres: selectedGenres,
        tones: selectedTones,
        language,
      });
      
      // Save generated script to step1Data
      if (videoId && videoId !== 'new') {
        await saveStep1Data({ script: data.script });
      }

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

  const handleGeneratedScriptChange = async (value: string) => {
    setGeneratedScript(value);
    onScriptChange(value);
    
    // When user manually edits the script, capture current settings as snapshot
    // This "refreshes" the validation - they edited it themselves, so settings are now "in sync"
    if (value.trim().length > 0) {
      setScriptSettingsSnapshot({
        duration,
        genres: selectedGenres,
        tones: selectedTones,
        language,
      });
    } else {
      // Clear snapshot when script is cleared
      setScriptSettingsSnapshot(null);
    }
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

  // Save genres, tones, duration, language, and structure settings when they change (debounced)
  useEffect(() => {
    if (!videoId || videoId === 'new') return;
    
    const timeoutId = setTimeout(() => {
      saveStep1Data({
        genres: selectedGenres,
        tones: selectedTones,
        duration: parseInt(duration),
        language,
        numberOfScenes: selectedNumberOfScenes,
        shotsPerScene: selectedShotsPerScene,
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [selectedGenres, selectedTones, duration, language, selectedNumberOfScenes, selectedShotsPerScene, videoId]);

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
                  onValueChange={async (value) => {
                    setSelectedModel(value);
                    onScriptModelChange?.(value);
                    // Save to database
                    if (videoId && videoId !== 'new') {
                      await saveStep1Data({ scriptModel: value });
                    }
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
                        onClick={async () => {
                          setSelectedAspectRatio(ratio.id);
                          onAspectRatioChange?.(ratio.id);
                          // Save to database
                          if (videoId && videoId !== 'new') {
                            await saveStep1Data({ aspectRatio: ratio.id });
                          }
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
                    <button
                      key={genre}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover-elevate",
                        selectedGenres.includes(genre)
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20 text-white")
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                      )}
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
                    <button
                      key={tone}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover-elevate",
                        selectedTones.includes(tone)
                          ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20 text-white")
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                      )}
                      onClick={() => toggleTone(tone)}
                      data-testid={`button-tone-${tone.toLowerCase()}`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings - Collapsible */}
            <Collapsible open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CollapsibleTrigger asChild>
                  <button className="w-full">
                    <CardContent className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-all">
                      <div className="flex items-center gap-2">
                        <Grid3x3 className="w-5 h-5 text-purple-400" />
                        <Label className="text-lg font-semibold text-white cursor-pointer">Advanced Settings</Label>
                      </div>
                      <motion.div
                        animate={{ rotate: advancedSettingsOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      </motion.div>
                    </CardContent>
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="px-6 pb-6 pt-0 space-y-4 border-t border-white/[0.06]">
                    {/* Structure Settings */}
                    <div className="space-y-4 mt-4">
                      <Label className="text-md font-semibold text-white/90">Structure Settings</Label>
                      
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
                              "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                              selectedNumberOfScenes === 'auto'
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 border-white/20 text-white"
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                            )}
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
                            className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-white/30"
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
                              "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                              selectedShotsPerScene === 'auto'
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 border-white/20 text-white"
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                            )}
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
                            className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 placeholder:text-white/30"
                          />
                        </div>
                        <p className="text-xs text-white/40">AI will vary shot count per scene if set to Auto</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

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
