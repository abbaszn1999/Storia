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
import { Loader2, Sparkles, Globe, Clock, Palette, MessageSquare, FileText, Wand2, User, MapPin, LayoutGrid, Camera, Grid3x3, Building2, TreePine, Home, MonitorPlay, Wand, Cpu, Radio, Paintbrush, Mic, Film, RectangleHorizontal, RectangleVertical, Square, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { VIDEO_MODELS, getDefaultVideoModel, getVideoModelConfig, getAvailableVideoModels } from "@/constants/video-models";
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
  backgroundMusicEnabled?: boolean;
  voiceoverLanguage?: 'en' | 'ar';
  textOverlayEnabled?: boolean;
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
  onBackgroundMusicEnabledChange?: (enabled: boolean) => void;
  onVoiceoverLanguageChange?: (language: 'en' | 'ar') => void;
  onTextOverlayEnabledChange?: (enabled: boolean) => void;
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
  backgroundMusicEnabled = false,
  voiceoverLanguage = 'en',
  textOverlayEnabled = false,
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
  onBackgroundMusicEnabledChange,
  onVoiceoverLanguageChange,
  onTextOverlayEnabledChange,
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
  const [backgroundMusicEnabledState, setBackgroundMusicEnabled] = useState(backgroundMusicEnabled);
  const [voiceoverLanguageState, setVoiceoverLanguage] = useState(voiceoverLanguage);
  const [textOverlayEnabledState, setTextOverlayEnabled] = useState(textOverlayEnabled);
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
      {/* LEFT COLUMN: ALL SETTINGS (35% width) */}
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
            {/* Character Personality */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" style={{ color: '#FF4081' }} />
                  <Label className="text-base font-semibold text-white">Personality</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PERSONALITIES.map((personality) => (
                    <button
                      key={personality.value}
                      onClick={() => handlePersonalityChange(personality.value)}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all hover-elevate relative overflow-hidden",
                        selectedPersonality === personality.value
                          ? "border-white/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      style={selectedPersonality === personality.value ? {
                        background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                      } : undefined}
                    >
                      <div className="font-medium text-xs text-white">{personality.label}</div>
                      <div className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{personality.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Narration Style */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4" style={{ color: '#FF4081' }} />
                  <Label className="text-base font-semibold text-white">Narration</Label>
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
                        "w-full text-left p-2.5 rounded-lg border transition-all hover-elevate relative overflow-hidden",
                        selectedNarrationStyle === style.id
                          ? "border-white/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      style={selectedNarrationStyle === style.id ? {
                        background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                      } : undefined}
                      data-testid={`button-narration-${style.id}`}
                    >
                      <div className="font-medium text-xs text-white">{style.label}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{style.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme / Environment */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" style={{ color: '#FF4081' }} />
                  <Label className="text-base font-semibold text-white">Theme</Label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((themeOption) => {
                    const Icon = themeOption.icon;
                    return (
                      <button
                        key={themeOption.value}
                        onClick={() => handleThemeChange(themeOption.value)}
                        className={cn(
                          "p-2 rounded-lg border text-center transition-all hover-elevate relative overflow-hidden",
                          selectedTheme === themeOption.value
                            ? "border-white/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
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
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <Label className="text-sm font-medium text-white/90">Duration</Label>
                  </div>
                  <Select 
                    value={durationValue} 
                    onValueChange={(value) => {
                      setDuration(value);
                      onDurationChange?.(value);
                    }}
                  >
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <Label className="text-sm font-medium text-white/90">Language</Label>
                  </div>
                  <Select 
                    value={languageValue} 
                    onValueChange={(value) => {
                      setLanguage(value);
                      onLanguageChange?.(value);
                    }}
                  >
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10">
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
              </CardContent>
            </Card>

            {/* Sound Settings */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                {/* Background Music */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4" style={{ color: '#FF4081' }} />
                      <Label className="text-sm font-medium text-white/90">Background Music</Label>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundMusicEnabled(true);
                          onBackgroundMusicEnabledChange?.(true);
                        }}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          backgroundMusicEnabledState ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBackgroundMusicEnabled(false);
                          onBackgroundMusicEnabledChange?.(false);
                        }}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !backgroundMusicEnabledState ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>
                  {backgroundMusicEnabledState && (
                    <p className="text-xs text-white/40">
                      Background music will be generated in the Soundscape phase based on your mood and atmosphere settings.
                    </p>
                  )}
                </div>

                {/* Voiceover Settings */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4" style={{ color: '#FF4081' }} />
                      <Label className="text-sm font-medium text-white/90">Enable Voiceover</Label>
                    </div>
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceOverEnabled(true);
                        }}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          voiceOverEnabledState ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceOverEnabled(false);
                        }}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                          !voiceOverEnabledState ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                      >
                        Off
                      </button>
                    </div>
                  </div>

                  {voiceOverEnabledState && (
                    <div className="space-y-3">
                      {/* Voiceover Language */}
                      <div className="space-y-2">
                        <Label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Language</Label>
                        <Select 
                          value={voiceoverLanguageState}
                          onValueChange={(value: 'en' | 'ar') => {
                            setVoiceoverLanguage(value);
                            onVoiceoverLanguageChange?.(value);
                          }}
                        >
                          <SelectTrigger className="h-9 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0a] border-white/10">
                            <SelectItem 
                              value="en"
                              className="text-white focus:bg-[#FF4081]/20 focus:text-white"
                            >
                              English (US)
                            </SelectItem>
                            <SelectItem 
                              value="ar"
                              className="text-white focus:bg-[#FF4081]/20 focus:text-white"
                            >
                              Arabic (العربية)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Text Overlay */}
                      <div className="flex items-center justify-between pt-2">
                        <Label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Text Overlay</Label>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setTextOverlayEnabled(true);
                              onTextOverlayEnabledChange?.(true);
                            }}
                            className={cn(
                              "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                              textOverlayEnabledState ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                            )}
                          >
                            On
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTextOverlayEnabled(false);
                              onTextOverlayEnabledChange?.(false);
                            }}
                            className={cn(
                              "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                              !textOverlayEnabledState ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                            )}
                          >
                            Off
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video & Image Models */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                {/* Generation Method & Compatibility Info */}
                {referenceMode && (
                  <div className="space-y-2 pb-4 border-b border-white/10">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50">Generation Method:</span>
                        <span className="text-sm font-medium text-white">
                          {referenceMode === '1F' ? 'Image Reference Mode' : 
                           referenceMode === '2F' ? 'Start/End Frame Mode' : 
                           'AI Auto Mode (Start/End)'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show compatibility info for different modes */}
                    {(() => {
                      // Map reference mode to video generation mode for compatibility check
                      const videoGenMode = referenceMode === '1F' ? 'image-reference' : 'start-end-frame';
                      const availableModels = getAvailableVideoModels(videoGenMode);
                      const totalModels = VIDEO_MODELS.length;
                      
                      // Different messages based on mode
                      if (referenceMode === '1F') {
                        return (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <div className="text-blue-400 mt-0.5">ℹ️</div>
                            <div className="flex-1 text-xs text-blue-200/90">
                              <span className="font-semibold">{availableModels.length} of {totalModels} models compatible</span> with Image Reference mode.
                              Models need single image support for video generation.
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="text-amber-400 mt-0.5">ℹ️</div>
                            <div className="flex-1 text-xs text-amber-200/90">
                              <span className="font-semibold">{availableModels.length} of {totalModels} models compatible</span> with Start/End Frame mode.
                              Models need both start and end frame support.
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <Label className="text-sm font-medium text-white/90">Video Model</Label>
                  </div>
                  <Select 
                    value={selectedVideoModel} 
                    onValueChange={handleVideoModelChange}
                  >
                    <SelectTrigger className="h-auto min-h-[40px] py-2 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10 max-h-[400px]">
                      {VIDEO_MODELS.map((model) => (
                        <SelectItem 
                          key={model.value} 
                          value={model.value}
                          className="text-white focus:bg-[#FF4081]/20 focus:text-white py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs">{model.label}</span>
                            {model.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/20 text-white/70">
                                {model.badge}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <Label className="text-sm font-medium text-white/90">Image Model</Label>
                  </div>
                  <Select 
                    value={selectedImageModel} 
                    onValueChange={handleImageModelChange}
                  >
                    <SelectTrigger className="h-auto min-h-[40px] py-2 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10 max-h-[400px]">
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem 
                          key={model.value} 
                          value={model.value}
                          className="text-white focus:bg-[#FF4081]/20 focus:text-white py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs">{model.label}</span>
                            {model.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/20 text-white/70">
                                {model.badge}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RectangleHorizontal className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <Label className="text-sm font-medium text-white/90">Aspect Ratio</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const compatibleRatios = getCompatibleAspectRatios(selectedImageModel, selectedVideoModel);
                      const ratiosToShow = ALL_ASPECT_RATIOS.filter(ratio => 
                        compatibleRatios.includes(ratio.value)
                      );
                      
                      return ratiosToShow.map((ratio) => {
                        const Icon = ratio.icon;
                        return (
                          <button
                            key={ratio.value}
                            onClick={() => handleAspectRatioChange(ratio.value)}
                            className={cn(
                              "p-2 rounded-lg border transition-all text-center relative overflow-hidden",
                              selectedAspectRatio === ratio.value
                                ? "border-white/20"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                            style={selectedAspectRatio === ratio.value ? {
                              background: `linear-gradient(to bottom right, rgba(255, 64, 129, 0.6), rgba(255, 92, 141, 0.6), rgba(255, 107, 74, 0.6))`
                            } : undefined}
                          >
                            <Icon className="h-3.5 w-3.5 mx-auto mb-0.5 text-white" />
                            <div className="font-semibold text-[10px] text-white">{ratio.label}</div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genres & Tones */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" style={{ color: '#FF4081' }} />
                      <Label className="text-sm font-medium text-white/90">Genres</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-white/10 border-white/20 text-white/70">{selectedGenres.length}/3</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES.map((genre) => (
                      <button
                        key={genre}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all hover-elevate relative overflow-hidden",
                          selectedGenres.includes(genre)
                            ? "border-white/20 text-white"
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
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
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" style={{ color: '#FF4081' }} />
                      <Label className="text-sm font-medium text-white/90">Tones</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-white/10 border-white/20 text-white/70">{selectedTones.length}/3</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((tone) => (
                      <button
                        key={tone}
                        className={cn(
                          "px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all hover-elevate relative overflow-hidden",
                          selectedTones.includes(tone)
                            ? "border-white/20 text-white"
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
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
                </div>
              </CardContent>
            </Card>

            {/* Structure Settings */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Grid3x3 className="w-4 h-4" style={{ color: '#FF4081' }} />
                  <Label className="text-base font-semibold text-white">Structure</Label>
                </div>
                
                <div className="space-y-3">
                  {/* Number of Scenes */}
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Scenes</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedNumberOfScenes('auto');
                          onNumberOfScenesChange?.('auto');
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium border transition-all relative overflow-hidden",
                          selectedNumberOfScenes === 'auto'
                            ? "border-white/20 text-white"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
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
                        placeholder="Number"
                        className="flex-1 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4081]/70 focus:ring-1 focus:ring-[#FF6B4A]/50 placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {/* Shots per Scene */}
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">Shots/Scene</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedShotsPerScene('auto');
                          onShotsPerSceneChange?.('auto');
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium border transition-all relative overflow-hidden",
                          selectedShotsPerScene === 'auto'
                            ? "border-white/20 text-white"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
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
                        placeholder="Number"
                        className="flex-1 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF4081]/70 focus:ring-1 focus:ring-[#FF6B4A]/50 placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: SCRIPT GENERATION (65% width) */}
      <div className="flex-1 relative flex flex-col overflow-hidden bg-black/40 backdrop-blur-xl">
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-4 pb-12">
            {/* Story Idea Section */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <h3 className="text-sm font-semibold text-white">Vlog Idea</h3>
                  </div>
                  <span className="text-[10px] text-white/40">{ideaCharCount} chars</span>
                </div>
                
                <Textarea
                  placeholder="Describe your vlog concept... AI will expand it into a full script."
                  value={storyIdea}
                  onChange={(e) => {
                    setStoryIdea(e.target.value);
                    onUserPromptChange?.(e.target.value);
                  }}
                  className={cn(
                    "min-h-[100px] resize-none bg-white/5 border-white/10 text-white text-sm",
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
                    "text-white hover:opacity-90 h-9 rounded-lg font-medium text-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  )}
                  data-testid="button-expand-script"
                >
                  {expandScriptMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Script</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Script Section */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: '#FF4081' }} />
                    <h3 className="font-semibold text-sm text-white">Generated Script</h3>
                  </div>
                  {hasGeneratedOnce && (
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      <span>{scriptCharCount} chars</span>
                      <span>•</span>
                      <span>{wordCount} words</span>
                    </div>
                  )}
                </div>

                <div className="relative rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden min-h-[400px]">
                  <Textarea
                    value={generatedScript}
                    onChange={(e) => handleGeneratedScriptChange(e.target.value)}
                    placeholder={hasGeneratedOnce ? "Edit your AI-generated script here..." : "Generate a script from your vlog idea first. The AI-generated script will appear here and you can edit it."}
                    disabled={!hasGeneratedOnce}
                    className={cn(
                      "w-full h-full min-h-[400px] bg-transparent border-0 p-4 text-sm leading-relaxed",
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


