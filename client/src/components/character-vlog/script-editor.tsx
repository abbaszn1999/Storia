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
import { Loader2, Sparkles, Globe, Clock, Palette, MessageSquare, FileText, Wand2, User, MapPin, LayoutGrid, Camera, Grid3x3, Building2, TreePine, Home, MonitorPlay, Wand, Cpu, Radio, Paintbrush, Mic, Film, RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VIDEO_MODELS, getDefaultVideoModel, getVideoModelConfig } from "@/constants/video-models";
import { IMAGE_MODELS, type ImageModelConfig } from "@/constants/image-models";

interface CharacterVlogScriptEditorProps {
  videoId?: string;
  workspaceId?: string;
  initialScript?: string;
  scriptModel?: string;
  narrationStyle?: "third-person" | "first-person";
  theme?: string;
  numberOfScenes?: number | 'auto';
  shotsPerScene?: number | 'auto';
  characterPersonality?: string;
  videoModel?: string;
  imageModel?: string;
  aspectRatio?: string;
  duration?: string;
  genres?: string[];
  tones?: string[];
  language?: string;
  voiceActorId?: string | null;
  voiceOverEnabled?: boolean;
  userPrompt?: string;
  referenceMode?: string;
  onScriptChange: (script: string) => void;
  onScriptModelChange?: (model: string) => void;
  onNarrationStyleChange?: (style: "third-person" | "first-person") => void;
  onThemeChange?: (theme: string) => void;
  onNumberOfScenesChange?: (scenes: number | 'auto') => void;
  onShotsPerSceneChange?: (shots: number | 'auto') => void;
  onCharacterPersonalityChange?: (personality: string) => void;
  onVideoModelChange?: (model: string) => void;
  onImageModelChange?: (model: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onUserPromptChange?: (prompt: string) => void;
  onDurationChange?: (duration: string) => void;
  onGenresChange?: (genres: string[]) => void;
  onTonesChange?: (tones: string[]) => void;
  onLanguageChange?: (language: string) => void;
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

const ALL_ASPECT_RATIOS = [
  { value: "16:9", label: "16:9", description: "Landscape", icon: RectangleHorizontal },
  { value: "9:16", label: "9:16", description: "Portrait", icon: RectangleVertical },
  { value: "1:1", label: "1:1", description: "Square", icon: Square },
  { value: "4:3", label: "4:3", description: "Standard", icon: RectangleHorizontal },
  { value: "3:4", label: "3:4", description: "Portrait", icon: RectangleVertical },
  { value: "21:9", label: "21:9", description: "Ultrawide", icon: RectangleHorizontal },
];

/**
 * Get compatible aspect ratios based on selected image and video models
 * Returns intersection of both models' supported aspect ratios
 */
const getCompatibleAspectRatios = (
  imageModel: string,
  videoModel: string
): string[] => {
  const imageConfig = IMAGE_MODELS.find(m => m.value === imageModel);
  const videoConfig = getVideoModelConfig(videoModel);
  
  // Get intersection of both
  const imageRatios = new Set(imageConfig?.aspectRatios || []);
  const videoRatios = videoConfig?.aspectRatios || [];
  
  return videoRatios.filter(ratio => imageRatios.has(ratio));
};

export function CharacterVlogScriptEditor({ 
  videoId,
  workspaceId,
  initialScript = "", 
  scriptModel = "gpt-4o", 
  narrationStyle = "first-person",
  theme = "urban",
  numberOfScenes = 'auto',
  shotsPerScene = 'auto',
  characterPersonality = "energetic",
  videoModel,
  imageModel = "nano-banana",
  aspectRatio = "9:16",
  duration = "60",
  genres = [],
  tones = [],
  language = "English",
  voiceActorId = null,
  voiceOverEnabled = true,
  userPrompt: initialUserPrompt = "",
  referenceMode,
  onScriptChange, 
  onScriptModelChange, 
  onNarrationStyleChange,
  onThemeChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onCharacterPersonalityChange,
  onVideoModelChange,
  onImageModelChange,
  onAspectRatioChange,
  onUserPromptChange,
  onDurationChange,
  onGenresChange,
  onTonesChange,
  onLanguageChange,
  onNext 
}: CharacterVlogScriptEditorProps) {
  const [storyIdea, setStoryIdea] = useState(initialUserPrompt);
  const [generatedScript, setGeneratedScript] = useState(initialScript);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(!!initialScript);
  const [durationValue, setDuration] = useState(duration);
  const [selectedModel, setSelectedModel] = useState(scriptModel);
  const [selectedNarrationStyle, setSelectedNarrationStyle] = useState(narrationStyle);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genres.length > 0 ? genres : ["Lifestyle"]);
  const [selectedTones, setSelectedTones] = useState<string[]>(tones.length > 0 ? tones : ["Energetic"]);
  const [languageValue, setLanguage] = useState(language);
  const [voiceOverEnabledState, setVoiceOverEnabled] = useState(voiceOverEnabled);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedNumberOfScenes, setSelectedNumberOfScenes] = useState<number | 'auto'>(numberOfScenes);
  const [selectedShotsPerScene, setSelectedShotsPerScene] = useState<number | 'auto'>(shotsPerScene);
  const [selectedPersonality, setSelectedPersonality] = useState(characterPersonality);
  const [selectedVideoModel, setSelectedVideoModel] = useState(videoModel || getDefaultVideoModel().value);
  const [selectedImageModel, setSelectedImageModel] = useState(imageModel);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const { toast } = useToast();

  const accentClasses = "from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A]"; // Gradient pink to orange from logo

  const expandScriptMutation = useMutation({
    mutationFn: async (userIdea: string) => {
      if (!videoId) {
        throw new Error('Video ID is required');
      }
      
      const response = await fetch('/api/character-vlog/script/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          // Reference mode
          referenceMode,
          // Script generation settings
          scriptModel: selectedModel,
          narrationStyle: selectedNarrationStyle,
          theme: selectedTheme,
          numberOfScenes: selectedNumberOfScenes,
          shotsPerScene: selectedShotsPerScene,
          characterPersonality: selectedPersonality,
          videoModel: selectedVideoModel,
          imageModel: selectedImageModel,
          aspectRatio: selectedAspectRatio,
          duration: durationValue,
          genres: selectedGenres,
          tones: selectedTones,
          language,
          voiceActorId,
          voiceOverEnabled: voiceOverEnabledState,
          // User's original prompt
          userPrompt: userIdea,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate script' }));
        throw new Error(error.error || 'Failed to generate script');
      }

      return await response.json();
    },
    onSuccess: (data: { script: string; cost?: number }) => {
      setGeneratedScript(data.script);
      setHasGeneratedOnce(true);
      onScriptChange(data.script);
      toast({
        title: "Script Generated",
        description: data.cost ? `Your vlog script has been created. (Cost: $${data.cost.toFixed(4)})` : "Your vlog script has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const continueMutation = useMutation({
    mutationFn: async () => {
      if (!videoId) {
        throw new Error('Video ID is required');
      }

      const response = await fetch(`/api/character-vlog/videos/${videoId}/step/1/continue`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          // Reference mode
          referenceMode,
          // Script generation settings
          scriptModel: selectedModel,
          narrationStyle: selectedNarrationStyle,
          theme: selectedTheme,
          numberOfScenes: selectedNumberOfScenes,
          shotsPerScene: selectedShotsPerScene,
          characterPersonality: selectedPersonality,
          videoModel: selectedVideoModel,
          imageModel: selectedImageModel,
          aspectRatio: selectedAspectRatio,
          duration: durationValue,
          genres: selectedGenres,
          tones: selectedTones,
          language,
          voiceActorId,
          voiceOverEnabled: voiceOverEnabledState,
          // Script content
          userPrompt: storyIdea,
          script: generatedScript,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to save script' }));
        throw new Error(error.error || 'Failed to save script');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Script Saved",
        description: "Your script has been saved. Moving to the next step.",
      });
      onNext();
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save script. Please try again.",
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
      let updated;
      if (prev.includes(genre)) {
        updated = prev.filter(g => g !== genre);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 genres maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        updated = [...prev, genre];
      }
      onGenresChange?.(updated);
      return updated;
    });
  };

  const toggleTone = (tone: string) => {
    setSelectedTones(prev => {
      let updated;
      if (prev.includes(tone)) {
        updated = prev.filter(t => t !== tone);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 tones maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        updated = [...prev, tone];
      }
      onTonesChange?.(updated);
      return updated;
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
    if (!videoId) {
      toast({
        title: "Video ID Required",
        description: "Video ID is missing. Please refresh the page.",
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

  const handleVideoModelChange = (value: string) => {
    setSelectedVideoModel(value);
    onVideoModelChange?.(value);
    
    // Check if current aspect ratio is compatible with new model
    const compatibleRatios = getCompatibleAspectRatios(selectedImageModel, value);
    if (compatibleRatios.length > 0 && !compatibleRatios.includes(selectedAspectRatio)) {
      // Auto-adjust to first compatible ratio
      setSelectedAspectRatio(compatibleRatios[0]);
      onAspectRatioChange?.(compatibleRatios[0]);
      toast({
        title: "Aspect Ratio Adjusted",
        description: `Changed to ${compatibleRatios[0]} (compatible with selected models)`,
      });
    }
  };

  const handleImageModelChange = (value: string) => {
    setSelectedImageModel(value);
    onImageModelChange?.(value);
    
    // Check if current aspect ratio is compatible with new model
    const compatibleRatios = getCompatibleAspectRatios(value, selectedVideoModel);
    if (compatibleRatios.length > 0 && !compatibleRatios.includes(selectedAspectRatio)) {
      // Auto-adjust to first compatible ratio
      setSelectedAspectRatio(compatibleRatios[0]);
      onAspectRatioChange?.(compatibleRatios[0]);
      toast({
        title: "Aspect Ratio Adjusted",
        description: `Changed to ${compatibleRatios[0]} (compatible with selected models)`,
      });
    }
  };

  const handleAspectRatioChange = (value: string) => {
    setSelectedAspectRatio(value);
    onAspectRatioChange?.(value);
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

            {/* Audio Layer - Voice Over & Language */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative p-1 rounded-md">
                    <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                    <Mic className="w-3.5 h-3.5 text-white relative z-10" />
                  </div>
                  <Label className="text-base font-semibold text-white">Audio Layer</Label>
                  <span className="text-xs text-white/40">Voice narration settings</span>
                </div>

                {/* Voice Over Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-white/90">Voice Over</Label>
                    <div className="inline-flex items-center bg-[#0f0f0f] rounded-lg p-1 border border-white/10">
                      <button
                        onClick={() => setVoiceOverEnabled(true)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          voiceOverEnabledState
                            ? "bg-gradient-to-r from-[#FF4081] to-[#FF6B4A] text-white shadow-lg"
                            : "text-white/50 hover:text-white/70"
                        )}
                      >
                        On
                      </button>
                      <button
                        onClick={() => setVoiceOverEnabled(false)}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !voiceOverEnabledState
                            ? "bg-[#1a1a1a] text-white shadow-lg"
                            : "text-white/50 hover:text-white/70"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {/* Language Dropdown - Only shown when Voice Over is On */}
                  {voiceOverEnabledState && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70">Language</Label>
                      <Select 
                        value={languageValue} 
                        onValueChange={(value) => {
                          setLanguage(value);
                          onLanguageChange?.(value);
                      }}
                      >
                        <SelectTrigger className="h-9 bg-[#0f0f0f] border-white/10 text-white">
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
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Target Duration */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white/70">Target Duration</Label>
                  <Select 
                    value={durationValue} 
                    onValueChange={(value) => {
                      setDuration(value);
                      onDurationChange?.(value);
                    }}
                  >
                    <SelectTrigger className="h-9 bg-[#0f0f0f] border-white/10 text-white">
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
              </CardContent>
            </Card>

            {/* Video Model */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative p-1 rounded-md">
                    <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                    <Film className="w-3.5 h-3.5 text-white relative z-10" />
                  </div>
                  <Label className="text-base font-semibold text-white">Video Model</Label>
                  <span className="text-xs text-white/40">Animation engine</span>
                </div>

                <div className="space-y-2">
                  <Select 
                    value={selectedVideoModel} 
                    onValueChange={handleVideoModelChange}
                  >
                    <SelectTrigger className="h-10 bg-[#0f0f0f] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-white/10 max-h-[400px]">
                      {VIDEO_MODELS.map((model) => {
                        const maxDuration = Math.max(...model.durations);
                        const maxResolution = model.resolutions[model.resolutions.length - 1];
                        return (
                          <SelectItem 
                            key={model.value} 
                            value={model.value}
                            className="text-white focus:bg-[#FF4081]/20 focus:text-white py-3"
                          >
                            <div className="flex items-start justify-between w-full gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white flex items-center gap-2">
                                  {model.label}
                                  {model.badge && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-white/20 text-white/70">
                                      {model.badge}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-white/50 mt-0.5">
                                  {model.provider} • {model.description}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 text-[10px] text-white/40 flex-shrink-0">
                                <span>↑ {maxDuration}s</span>
                                <span>{maxResolution}</span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Model Info */}
                  {selectedVideoModel && (() => {
                    const model = VIDEO_MODELS.find(m => m.value === selectedVideoModel);
                    if (!model) return null;
                    
                    return (
                      <div className="bg-[#0f0f0f] rounded-lg p-3 space-y-1.5 border border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Max Duration</span>
                          <span className="text-white font-medium">{Math.max(...model.durations)}s</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Max Resolution</span>
                          <span className="text-white font-medium">{model.resolutions[model.resolutions.length - 1]}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Audio Support</span>
                          <span className={cn(
                            "font-medium",
                            model.hasAudio ? "text-green-400" : "text-white/40"
                          )}>
                            {model.hasAudio ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Image Model */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative p-1 rounded-md">
                    <div className={cn("absolute inset-0 rounded-md bg-gradient-to-br opacity-60", accentClasses)} />
                    <Camera className="w-3.5 h-3.5 text-white relative z-10" />
                  </div>
                  <Label className="text-base font-semibold text-white">Image Model</Label>
                  <span className="text-xs text-white/40">For generating keyframes</span>
                </div>

                <div className="space-y-2">
                  <Select 
                    value={selectedImageModel} 
                    onValueChange={handleImageModelChange}
                  >
                    <SelectTrigger className="h-10 bg-[#0f0f0f] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-white/10 max-h-[400px]">
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem 
                          key={model.value} 
                          value={model.value}
                          className="text-white focus:bg-[#FF4081]/20 focus:text-white py-3"
                        >
                          <div className="flex items-start justify-between w-full gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white flex items-center gap-2">
                                {model.label}
                                {model.badge && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-white/20 text-white/70">
                                    {model.badge}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-white/50 mt-0.5">
                                {model.provider} • {model.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card className="bg-[#252525] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <Label className="text-base font-semibold text-white">Aspect Ratio</Label>
                <p className="text-sm text-white/50">
                  Showing ratios compatible with both image and video models
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(() => {
                    const compatibleRatios = getCompatibleAspectRatios(selectedImageModel, selectedVideoModel);
                    const ratiosToShow = ALL_ASPECT_RATIOS.filter(ratio => 
                      compatibleRatios.includes(ratio.value)
                    );
                    
                    if (ratiosToShow.length === 0) {
                      return (
                        <div className="col-span-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-400">
                            No compatible aspect ratios found for selected models.
                          </p>
                        </div>
                      );
                    }
                    
                    return ratiosToShow.map((ratio) => {
                      const Icon = ratio.icon;
                      return (
                        <button
                          key={ratio.value}
                          onClick={() => handleAspectRatioChange(ratio.value)}
                          className={cn(
                            "p-3 rounded-lg border transition-all text-center relative overflow-hidden",
                            selectedAspectRatio === ratio.value
                              ? "border-white/20"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                          style={selectedAspectRatio === ratio.value ? {
                            background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                          } : undefined}
                        >
                          <Icon className="h-4 w-4 mx-auto mb-1 text-white" />
                          <div className="font-semibold text-xs text-white">{ratio.label}</div>
                          <div className="text-[9px] text-white/40">{ratio.description}</div>
                        </button>
                      );
                    });
                  })()}
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
                  onChange={(e) => {
                    setStoryIdea(e.target.value);
                    onUserPromptChange?.(e.target.value);
                  }}
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


