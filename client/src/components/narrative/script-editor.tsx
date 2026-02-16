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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Film, Clock, Palette, MessageSquare, FileText, Wand2, RectangleHorizontal, RectangleVertical, Square, Grid3x3, ChevronDown, ImageIcon, Video, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { IMAGE_MODELS, getImageModelConfig } from "@/constants/image-models";
import { VIDEO_MODELS, getVideoModelConfig, getDefaultVideoModel, getAvailableVideoModels, isModelCompatible, VIDEO_RESOLUTION_LABELS } from "@/constants/video-models";

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
  initialImageModel?: string;
  initialVideoModel?: string;
  onScriptChange: (script: string) => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onScriptModelChange?: (model: string) => void;
  onNarrationStyleChange?: (style: "third-person" | "first-person") => void;
  onNumberOfScenesChange?: (scenes: number | 'auto') => void;
  onShotsPerSceneChange?: (shots: number | 'auto') => void;
  onImageModelChange?: (model: string) => void;
  onVideoModelChange?: (model: string) => void;
  onGenresChange?: (genres: string[]) => void;
  onTonesChange?: (tones: string[]) => void;
  onDurationChange?: (duration: string) => void;
  onLanguageChange?: (language: string) => void;
  onUserIdeaChange?: (userIdea: string) => void;
  onValidationChange?: (canContinue: boolean) => void;  // Called when validation state changes
  onNext: () => void;
}

const NARRATION_STYLES = [
  { id: "third-person", label: "Third Person", description: "The narrator describes the character's actions" },
  { id: "first-person", label: "First Person", description: "The character narrates their own story" },
];

// AI_MODELS will be fetched from the API - see useQuery below

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

// All possible aspect ratios with metadata for UI display (matching ambient visual mode)
const ALL_ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", description: "YouTube, Landscape", icon: RectangleHorizontal },
  { id: "9:16", label: "9:16", description: "TikTok, Reels", icon: RectangleVertical },
  { id: "1:1", label: "1:1", description: "Instagram Square", icon: Square },
  { id: "4:3", label: "4:3", description: "Classic TV", icon: RectangleHorizontal },
  { id: "3:4", label: "3:4", description: "Portrait Classic", icon: RectangleVertical },
  { id: "21:9", label: "21:9", description: "Ultra-Wide Cinema", icon: RectangleHorizontal },
  { id: "9:21", label: "9:21", description: "Ultra-Tall", icon: RectangleVertical },
];

// Compatibility function for aspect ratios (matching ambient visual mode pattern)
// Narrative mode always uses video-animation (generates videos from images)
const getCompatibleAspectRatios = (
  imageModel: string,
  videoModel: string
): string[] => {
  const imageConfig = IMAGE_MODELS.find(m => m.value === imageModel);
  const videoConfig = getVideoModelConfig(videoModel);
  
  // Video Animation mode: intersection of both
  const imageRatios = new Set(imageConfig?.aspectRatios || []);
  const videoRatios = videoConfig?.aspectRatios || [];
  
  // Return intersection - only ratios supported by BOTH models
  // If no intersection, return empty array (UI will show error message)
  return videoRatios.filter(r => imageRatios.has(r));
};

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
  initialImageModel,
  initialVideoModel,
  onScriptChange, 
  onAspectRatioChange, 
  onScriptModelChange, 
  onNarrationStyleChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onImageModelChange,
  onVideoModelChange,
  onGenresChange,
  onTonesChange,
  onDurationChange,
  onLanguageChange,
  onUserIdeaChange,
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
  const [imageModel, setImageModel] = useState(initialImageModel || "nano-banana");
  const [videoModel, setVideoModel] = useState(initialVideoModel || getDefaultVideoModel().value);
  const { toast } = useToast();

  // Fetch available text models from API
  const { data: textModelsData, isLoading: isLoadingTextModels } = useQuery<{ models: Array<{ value: string; label: string; description: string; provider: string; default?: boolean }> }>({
    queryKey: ['/api/narrative/models/text'],
    queryFn: async () => {
      const response = await fetch('/api/narrative/models/text');
      if (!response.ok) {
        throw new Error('Failed to fetch text models');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get available text models, fallback to default list if API fails
  const availableTextModels = textModelsData?.models || [];
  const defaultTextModel = availableTextModels.find(m => m.default)?.value || availableTextModels[0]?.value || "gpt-4o";

  // Get available video models (filtered for narrative mode compatibility)
  const availableVideoModels = getAvailableVideoModels('image-reference'); // Narrative mode uses image-reference

  // Track settings when script was created - to detect if settings changed after
  const [scriptSettingsSnapshot, setScriptSettingsSnapshot] = useState<{
    duration: string;
    genres: string[];
    tones: string[];
    language: string;
    userIdea: string;
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
          userIdea: initialUserIdea,
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

  // Update selected model if it's not in available models and we have models loaded
  useEffect(() => {
    if (availableTextModels.length > 0 && !availableTextModels.find(m => m.value === selectedModel)) {
      // Current model not available, switch to default
      const newModel = defaultTextModel;
      setSelectedModel(newModel);
      onScriptModelChange?.(newModel);
    }
  }, [availableTextModels, selectedModel, defaultTextModel, onScriptModelChange]);

  // Restore settings from database - always update when props change
  useEffect(() => {
    if (initialDuration !== undefined) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  useEffect(() => {
    if (initialGenres !== undefined) {
      setSelectedGenres(initialGenres);
    }
  }, [initialGenres]);

  useEffect(() => {
    if (initialTones !== undefined) {
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

  useEffect(() => {
    if (initialImageModel && initialImageModel !== imageModel) {
      setImageModel(initialImageModel);
    }
  }, [initialImageModel]);

  useEffect(() => {
    if (initialVideoModel && initialVideoModel !== videoModel) {
      setVideoModel(initialVideoModel);
    }
  }, [initialVideoModel]);

  const accentClasses = "from-purple-500 to-pink-500";

  // Check if core settings have changed since script was created
  const settingsChangedSinceScript = scriptSettingsSnapshot !== null && (
    scriptSettingsSnapshot.duration !== duration ||
    JSON.stringify(scriptSettingsSnapshot.genres.sort()) !== JSON.stringify(selectedGenres.sort()) ||
    JSON.stringify(scriptSettingsSnapshot.tones.sort()) !== JSON.stringify(selectedTones.sort()) ||
    scriptSettingsSnapshot.language !== language ||
    scriptSettingsSnapshot.userIdea !== storyIdea
  );

  // Check if critical settings (genre, tone, duration, userIdea) have changed
  const criticalSettingsChanged = scriptSettingsSnapshot !== null && hasGeneratedOnce && (
    scriptSettingsSnapshot.duration !== duration ||
    JSON.stringify(scriptSettingsSnapshot.genres.sort()) !== JSON.stringify(selectedGenres.sort()) ||
    JSON.stringify(scriptSettingsSnapshot.tones.sort()) !== JSON.stringify(selectedTones.sort()) ||
    scriptSettingsSnapshot.userIdea !== storyIdea
  );

  // Compute validation: user can continue if script exists AND settings haven't changed AND genre is selected
  const hasScript = generatedScript.trim().length > 0;
  const hasGenre = selectedGenres.length > 0;
  const canContinue = hasScript && !settingsChangedSinceScript && hasGenre;

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
      // Save ALL settings before generating script
      if (videoId && videoId !== 'new') {
        await saveStep1Data({
          duration: parseInt(duration),
          genres: selectedGenres,
          tones: selectedTones,
          language,
          aspectRatio: selectedAspectRatio,
          scriptModel: selectedModel,
          imageModel,
          videoModel,
          narrationStyle: videoMode === "character-vlog" ? selectedNarrationStyle : undefined,
          userIdea,
          numberOfScenes: selectedNumberOfScenes,
          shotsPerScene: selectedShotsPerScene,
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
        userIdea: storyIdea,
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
        userIdea: storyIdea,
      });
    } else {
      // Clear snapshot when script is cleared
      setScriptSettingsSnapshot(null);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      let newGenres;
      if (prev.includes(genre)) {
        newGenres = prev.filter(g => g !== genre);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 genres maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        newGenres = [...prev, genre];
      }
      onGenresChange?.(newGenres);
      return newGenres;
    });
  };

  const toggleTone = (tone: string) => {
    setSelectedTones(prev => {
      let newTones;
      if (prev.includes(tone)) {
        newTones = prev.filter(t => t !== tone);
      } else if (prev.length >= 3) {
        toast({
          title: "Maximum Reached",
          description: "You can select up to 3 tones maximum.",
          variant: "destructive",
        });
        return prev;
      } else {
        newTones = [...prev, tone];
      }
      onTonesChange?.(newTones);
      return newTones;
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

  // Note: step1Data is now only saved when:
  // 1. User clicks "Generate Script" (before and after generation)
  // 2. User clicks "Continue" to next step (handled in narrative-mode/index.tsx)

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
                {isLoadingTextModels ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                    <span className="ml-2 text-sm text-white/50">Loading models...</span>
                  </div>
                ) : (
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
                          const model = availableTextModels.find(m => m.value === selectedModel);
                          if (!model) return "Select AI model";
                          return (
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-white">{model.label}</div>
                                <div className="text-xs text-white/50">{model.description}</div>
                              </div>
                              {model.default && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border-purple-500/50 text-purple-300 flex-shrink-0">
                                  Default
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] bg-[#0a0a0a] border-white/10">
                      {availableTextModels.length === 0 ? (
                        <div className="p-4 text-sm text-white/50 text-center">
                          No text models available. Please configure API keys.
                        </div>
                      ) : (
                        availableTextModels.map((model) => (
                          <SelectItem 
                            key={model.value} 
                            value={model.value}
                            className="py-3 focus:bg-purple-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500/30 data-[state=checked]:to-pink-500/30 data-[state=checked]:text-white"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{model.label}</span>
                                {model.default && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 border-purple-500/50 text-purple-300">
                                    Default
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20 text-white/70">
                                  {model.provider}
                                </Badge>
                              </div>
                              <span className="text-xs text-white/50">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Image AI Model */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">IMAGE AI MODEL</Label>
                </div>
                <p className="text-sm text-white/50">AI model used to generate storyboard images</p>
                <Select 
                  value={imageModel} 
                  onValueChange={(value) => {
                    setImageModel(value);
                    onImageModelChange?.(value);
                    // Check if current aspect ratio is compatible with new model combination
                    const compatibleRatios = getCompatibleAspectRatios(value, videoModel);
                    if (compatibleRatios.length > 0 && !compatibleRatios.includes(selectedAspectRatio)) {
                      // Auto-adjust to first compatible ratio
                      const newRatio = compatibleRatios[0];
                      setSelectedAspectRatio(newRatio);
                      onAspectRatioChange?.(newRatio);
                    }
                  }}
                >
                  <SelectTrigger className="h-auto min-h-[48px] py-2.5 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select image model">
                      {(() => {
                        const model = IMAGE_MODELS.find(m => m.value === imageModel);
                        if (!model) return "Select image model";
                        return (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium text-white">{model.label}</div>
                              <div className="text-xs text-white/50">{model.provider}</div>
                            </div>
                            {model.default && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border-purple-500/50 text-purple-300 flex-shrink-0">
                                Default
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] bg-[#0a0a0a] border-white/10">
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem 
                        key={model.value} 
                        value={model.value}
                        className="py-3 focus:bg-purple-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500/30 data-[state=checked]:to-pink-500/30 data-[state=checked]:text-white"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.label}</span>
                            {model.default && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 border-purple-500/50 text-purple-300">
                                Default
                              </Badge>
                            )}
                            {model.badge && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20 text-white/70">
                                {model.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-white/50">{model.provider}</span>
                          <span className="text-xs text-white/40">{model.description}</span>
                          <span className="text-[10px] text-white/40 mt-1">
                            {model.aspectRatios.length} ratios • {model.resolutions.join(", ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Video AI Model */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">VIDEO AI MODEL</Label>
                </div>
                <p className="text-sm text-white/50">AI model used to generate videos from images</p>
                <Select 
                  value={videoModel} 
                  onValueChange={(value) => {
                    setVideoModel(value);
                    onVideoModelChange?.(value);
                    // Check if current aspect ratio is compatible with new model combination
                    const compatibleRatios = getCompatibleAspectRatios(imageModel, value);
                    if (compatibleRatios.length > 0 && !compatibleRatios.includes(selectedAspectRatio)) {
                      // Auto-adjust to first compatible ratio
                      const newRatio = compatibleRatios[0];
                      setSelectedAspectRatio(newRatio);
                      onAspectRatioChange?.(newRatio);
                    }
                  }}
                >
                  <SelectTrigger className="h-auto min-h-[48px] py-2.5 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select video model">
                      {(() => {
                        const model = getVideoModelConfig(videoModel);
                        if (!model) return "Select video model";
                        return (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium text-white">{model.label}</div>
                              <div className="text-xs text-white/50">{model.provider}</div>
                            </div>
                            {model.default && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border-purple-500/50 text-purple-300 flex-shrink-0">
                                Default
                              </Badge>
                            )}
                            {model.hasAudio && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 border-purple-500/50 text-purple-300 flex-shrink-0">
                                🎵 Audio
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px] bg-[#0a0a0a] border-white/10">
                    {availableVideoModels.map((model) => (
                      <SelectItem 
                        key={model.value} 
                        value={model.value}
                        className="py-3 focus:bg-purple-500/20 focus:text-white data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500/30 data-[state=checked]:to-pink-500/30 data-[state=checked]:text-white"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{model.label}</span>
                            {model.default && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 border-purple-500/50 text-purple-300">
                                Default
                              </Badge>
                            )}
                            {model.hasAudio && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/20 border-purple-500/50 text-purple-300">
                                🎵 Audio
                              </Badge>
                            )}
                            {model.badge && !model.default && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20 text-white/70">
                                {model.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-white/50 mt-0.5">
                            {model.provider}
                          </span>
                          <span className="text-xs text-white/40 mt-1">
                            {model.description}
                          </span>
                          <span className="text-[10px] text-white/40 mt-1">
                            {model.durations.join(', ')}s • {model.resolutions.join(', ')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Aspect Ratio - After Image and Video Models (filtered by compatibility) */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Aspect Ratio</Label>
                </div>
                <p className="text-sm text-white/50">
                  Showing ratios supported by both image and video models
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(() => {
                    // Get compatible aspect ratios based on selected models
                    const compatibleRatios = getCompatibleAspectRatios(imageModel, videoModel);
                    
                    // Filter ALL_ASPECT_RATIOS to only show compatible ones
                    const ratiosToShow = ALL_ASPECT_RATIOS.filter(ratio => 
                      compatibleRatios.includes(ratio.id)
                    );
                    
                    // If no ratios found (models are incompatible), show error message
                    if (ratiosToShow.length === 0) {
                      const imageModelName = IMAGE_MODELS.find(m => m.value === imageModel)?.label || 'image model';
                      const videoModelName = getVideoModelConfig(videoModel)?.label || 'video model';
                      
                      return (
                        <div className="col-span-3">
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="flex items-start gap-3">
                              <div className="text-red-400 mt-0.5">⚠️</div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-300 mb-1">
                                  Models Not Compatible
                                </p>
                                <p className="text-xs text-red-200/80">
                                  <span className="font-medium">{imageModelName}</span> and <span className="font-medium">{videoModelName}</span> do not share any compatible aspect ratios. 
                                  Please select different models to continue.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return ratiosToShow.map((ratio) => {
                      const Icon = ratio.icon;
                      return (
                        <button
                          key={ratio.id}
                          onClick={() => {
                            setSelectedAspectRatio(ratio.id);
                            onAspectRatioChange?.(ratio.id);
                          }}
                          className={cn(
                            "p-4 rounded-lg border transition-all hover-elevate text-left",
                            selectedAspectRatio === ratio.id
                              ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                          data-testid={`button-aspect-ratio-${ratio.id}`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="h-5 w-5 text-white" />
                            <span className="font-semibold text-white">{ratio.label}</span>
                          </div>
                          <div className="text-xs text-white/40">{ratio.description}</div>
                        </button>
                      );
                    });
                  })()}
                </div>
                {(() => {
                  const compatibleRatios = getCompatibleAspectRatios(imageModel, videoModel);
                  
                  // Only show info message if there are compatible ratios
                  if (compatibleRatios.length > 0) {
                    return (
                      <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                        <span className="text-amber-400">ℹ</span>
                        Only showing ratios supported by both {IMAGE_MODELS.find(m => m.value === imageModel)?.label || 'image model'} and {getVideoModelConfig(videoModel)?.label || 'video model'}
                      </p>
                    );
                  }
                  return null;
                })()}
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
                      onClick={() => {
                        setDuration(dur.value);
                        onDurationChange?.(dur.value);
                      }}
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
                {selectedGenres.length === 0 && (
                  <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Please select at least one genre to continue</AlertDescription>
                  </Alert>
                )}
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
              onChange={(e) => {
                const newValue = e.target.value;
                setStoryIdea(newValue);
                onUserIdeaChange?.(newValue);
              }}
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
          {/* Reminder Alert when critical settings change */}
          {criticalSettingsChanged && (
            <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                <strong className="text-amber-300">Settings Changed:</strong> You've modified the genre, tone, duration, or story idea. 
                Please regenerate the script to reflect these changes.
              </AlertDescription>
            </Alert>
          )}

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
