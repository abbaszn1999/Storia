// ASMR Generator - Custom Hook for State Management

import { useState, useEffect, useCallback } from "react";
import {
  VIDEO_MODELS,
  ASMR_CATEGORIES,
  ASMR_MATERIALS,
  getDefaultVideoModel,
  type ASMRCategory,
  type VideoModelConfig,
} from "@/constants/asmr-presets";
import {
  enhancePrompt as apiEnhancePrompt,
  enhanceSoundPrompt as apiEnhanceSoundPrompt,
  generateVideo as apiGenerateVideo,
  generateImage as apiGenerateImage,
  pollVideoStatus,
  type ASMRGenerateResponse,
  type LoopMultiplier,
} from "@/lib/api/asmr";

export interface ASMRGeneratorState {
  // Project
  title: string;
  
  // Category
  selectedCategory: ASMRCategory | null;
  
  // Model & Settings
  videoModel: string;
  selectedModelInfo: VideoModelConfig;
  duration: number;
  aspectRatio: string;
  resolution: string;
  
  // Prompts
  visualPrompt: string;
  soundPrompt: string;
  
  // Media
  referenceImage: string | null;
  selectedMaterial: string;
  
  // Audio Settings
  loopMultiplier: LoopMultiplier;
  soundIntensity: number;
  isBinaural: boolean;
  ambientBackground: string;
  
  // UI State
  isGenerating: boolean;
  isEnhancing: boolean;
  isEnhancingSound: boolean;
  isGeneratingImage: boolean;
  generationStatus: string;
  generationProgress: number;
  generatedVideoUrl: string | null;
  /** Separate audio URL (from ElevenLabs) - null if model has native audio */
  generatedAudioUrl: string | null;
  /** Audio source: "model" (native), "elevenlabs" (separate), or "merged" (combined with video) */
  audioSource: "model" | "elevenlabs" | "merged" | null;
  /** Story ID from database after successful generation */
  storyId: string | null;
  error: string | null;
}

export interface ASMRGeneratorActions {
  setTitle: (title: string) => void;
  setCategory: (category: ASMRCategory | null) => void;
  setVideoModel: (modelId: string) => void;
  setDuration: (duration: number) => void;
  setAspectRatio: (ratio: string) => void;
  setResolution: (resolution: string) => void;
  setVisualPrompt: (prompt: string) => void;
  setSoundPrompt: (prompt: string) => void;
  setReferenceImage: (image: string | null) => void;
  setSelectedMaterial: (materialId: string) => void;
  setLoopMultiplier: (multiplier: LoopMultiplier) => void;
  setSoundIntensity: (intensity: number) => void;
  setIsBinaural: (binaural: boolean) => void;
  setAmbientBackground: (bg: string) => void;
  enhancePrompt: () => Promise<void>;
  enhanceSoundPrompt: () => Promise<void>;
  generateImage: () => Promise<void>;
  generateVideo: () => Promise<void>;
  useCategorySuggestion: () => void;
  reset: () => void;
}

export function useASMRGenerator(): [ASMRGeneratorState, ASMRGeneratorActions] {
  const defaultModel = getDefaultVideoModel();
  
  // Project
  const [title, setTitle] = useState("");
  
  // Category
  const [selectedCategory, setSelectedCategory] = useState<ASMRCategory | null>(null);
  
  // Model & Settings
  const [videoModel, setVideoModel] = useState(defaultModel.value);
  const [duration, setDuration] = useState(defaultModel.durations[0]);
  const [aspectRatio, setAspectRatio] = useState(defaultModel.aspectRatios[0]);
  const [resolution, setResolution] = useState(defaultModel.resolutions[0]);
  
  // Prompts
  const [visualPrompt, setVisualPrompt] = useState("");
  const [soundPrompt, setSoundPrompt] = useState("");
  
  // Media
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  
  // Audio Settings
  const [loopMultiplier, setLoopMultiplier] = useState<LoopMultiplier>(1);
  const [soundIntensity, setSoundIntensity] = useState(50);
  const [isBinaural, setIsBinaural] = useState(false);
  const [ambientBackground, setAmbientBackground] = useState("none");
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhancingSound, setIsEnhancingSound] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<"model" | "elevenlabs" | "merged" | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current model info
  const selectedModelInfo = VIDEO_MODELS.find(m => m.value === videoModel) || defaultModel;
  const showSoundControls = !selectedModelInfo.generatesAudio;

  // Update settings when model changes
  useEffect(() => {
    if (selectedModelInfo) {
      if (!selectedModelInfo.durations.includes(duration)) {
        setDuration(selectedModelInfo.durations[0]);
      }
      if (!selectedModelInfo.aspectRatios.includes(aspectRatio)) {
        setAspectRatio(selectedModelInfo.aspectRatios[0]);
      }
      if (!selectedModelInfo.resolutions.includes(resolution)) {
        setResolution(selectedModelInfo.resolutions[0]);
      }
    }
  }, [videoModel, selectedModelInfo]);

  // Auto-fill prompts when category changes
  useEffect(() => {
    if (selectedCategory) {
      setVisualPrompt(selectedCategory.suggestedVisualPrompt);
      if (showSoundControls) {
        setSoundPrompt(selectedCategory.suggestedSoundPrompt);
      }
      setSelectedMaterial("");
    }
  }, [selectedCategory, showSoundControls]);

  // Actions
  const handleSetCategory = useCallback((category: ASMRCategory | null) => {
    setSelectedCategory(category);
    setError(null);
    setGeneratedVideoUrl(null);
  }, []);

  const handleSetVideoModel = useCallback((modelId: string) => {
    setVideoModel(modelId);
  }, []);

  const useCategorySuggestion = useCallback(() => {
    if (selectedCategory) {
      setVisualPrompt(selectedCategory.suggestedVisualPrompt);
      if (showSoundControls) {
        setSoundPrompt(selectedCategory.suggestedSoundPrompt);
      }
    }
  }, [selectedCategory, showSoundControls]);

  const enhancePrompt = useCallback(async () => {
    // Can enhance even with empty prompt - AI will suggest an idea
    setIsEnhancing(true);
    setError(null);
    
    try {
      const result = await apiEnhancePrompt({
        prompt: visualPrompt || "", // Can be empty - Agent 1 will generate creative idea
        categoryId: selectedCategory?.id,
        materials: selectedMaterial ? [selectedMaterial] : [],
      });
      
      setVisualPrompt(result.enhancedPrompt);
      if (result.suggestedSoundPrompt && showSoundControls) {
        setSoundPrompt(result.suggestedSoundPrompt);
      }
    } catch (err) {
      console.error("Enhancement failed:", err);
      // Fallback to category suggestion
      if (selectedCategory) {
        setVisualPrompt(selectedCategory.suggestedVisualPrompt);
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [visualPrompt, selectedCategory, selectedMaterial, showSoundControls]);

  const enhanceSoundPrompt = useCallback(async () => {
    // Generate sound prompt based on Visual Prompt context (independent of categories)
    setIsEnhancingSound(true);
    setError(null);
    
    try {
      const result = await apiEnhanceSoundPrompt({
        prompt: soundPrompt || "", // Current sound prompt (can be empty)
        visualPrompt: visualPrompt || "", // Visual context for sound generation
      });
      
      setSoundPrompt(result.enhancedPrompt);
    } catch (err) {
      console.error("Sound enhancement failed:", err);
      setError("Failed to enhance sound prompt");
    } finally {
      setIsEnhancingSound(false);
    }
  }, [soundPrompt, visualPrompt]);

  const generateImage = useCallback(async () => {
    if (!visualPrompt.trim()) {
      setError("Please enter a visual prompt first");
      return;
    }
    
    setIsGeneratingImage(true);
    setError(null);
    
    try {
      const result = await apiGenerateImage({
        prompt: visualPrompt,
        aspectRatio,
      });
      
      setReferenceImage(result.imageUrl);
    } catch (err) {
      console.error("Image generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  }, [visualPrompt, aspectRatio]);

  const generateVideo = useCallback(async (workspaceId: string) => {
    if (!title.trim()) {
      setError("Please enter a project name");
      return;
    }
    if (!visualPrompt.trim()) {
      setError("Please enter a visual prompt");
      return;
    }
    if (!workspaceId) {
      setError("No workspace selected");
      return;
    }
    
    setIsGenerating(true);
    setGenerationStatus("Generating video...");
    setGenerationProgress(10);
    setError(null);
    setGeneratedVideoUrl(null);
    setGeneratedAudioUrl(null);
    setAudioSource(null);
    setStoryId(null);
    
    try {
      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 5, 85));
      }, 3000);

      const response = await apiGenerateVideo({
        title: title.trim(),
        workspaceId,
        categoryId: selectedCategory?.id,
        visualPrompt,
        soundPrompt: showSoundControls ? soundPrompt : undefined,
        audioIntensity: showSoundControls ? soundIntensity : undefined,
        materials: selectedMaterial ? [selectedMaterial] : [],
        modelId: videoModel,
        aspectRatio,
        resolution,
        duration,
        firstFrameImage: referenceImage || undefined,
        loopMultiplier: loopMultiplier > 1 ? loopMultiplier : undefined,
      });

      clearInterval(progressInterval);

      if (response.status === "failed") {
        throw new Error(response.error || "Generation failed");
      }

      // Check if video is already completed (Runware waits internally)
      if (response.status === "completed" && response.videoUrl) {
        setGenerationProgress(100);
        setGenerationStatus("Complete!");
        setGeneratedVideoUrl(response.videoUrl);
        
        // Set audio URL if generated separately (ElevenLabs)
        if (response.audioUrl) {
          setGeneratedAudioUrl(response.audioUrl);
        }
        if (response.audioSource) {
          setAudioSource(response.audioSource);
        }
        if (response.storyId) {
          setStoryId(response.storyId);
        }
        
        // Save to localStorage for export page
        const videoData = {
          videoUrl: response.videoUrl,
          audioUrl: response.audioUrl,
          audioSource: response.audioSource,
          storyId: response.storyId,
          title,
          duration,
          aspectRatio,
          resolution,
          storyType: "asmr",
          category: selectedCategory?.name || "ASMR",
          visualPrompt,
          soundPrompt: showSoundControls ? soundPrompt : undefined,
          material: selectedMaterial,
          loopMultiplier,
          isBinaural: showSoundControls ? isBinaural : false,
          ambientBackground: showSoundControls ? ambientBackground : "none",
          videoModel,
          modelLabel: selectedModelInfo?.label,
          cost: response.cost,
        };
        localStorage.setItem("storia_story_export_data", JSON.stringify(videoData));
      } else if (response.status === "processing" && response.taskId) {
        // If still processing, poll for completion
        setGenerationStatus("Processing video...");
        
        const finalResult = await pollVideoStatus(response.taskId, {
          intervalMs: 3000,
          onProgress: (status) => {
            if (status.status === "processing") {
              setGenerationProgress((prev) => Math.min(prev + 5, 95));
            }
          },
        });

        if (finalResult.status === "completed" && finalResult.videoUrl) {
          setGenerationProgress(100);
          setGenerationStatus("Complete!");
          setGeneratedVideoUrl(finalResult.videoUrl);
          
          // Set audio URL if generated separately (ElevenLabs)
          if (finalResult.audioUrl) {
            setGeneratedAudioUrl(finalResult.audioUrl);
          }
          if (finalResult.audioSource) {
            setAudioSource(finalResult.audioSource);
          }
          if (finalResult.storyId) {
            setStoryId(finalResult.storyId);
          }
          
          const videoData = {
            videoUrl: finalResult.videoUrl,
            audioUrl: finalResult.audioUrl,
            audioSource: finalResult.audioSource,
            storyId: finalResult.storyId,
            title,
            duration,
            aspectRatio,
            resolution,
            storyType: "asmr",
            category: selectedCategory?.name || "ASMR",
            visualPrompt,
            soundPrompt: showSoundControls ? soundPrompt : undefined,
            material: selectedMaterial,
            loopMultiplier,
            isBinaural: showSoundControls ? isBinaural : false,
            ambientBackground: showSoundControls ? ambientBackground : "none",
            videoModel,
            modelLabel: selectedModelInfo?.label,
            cost: finalResult.cost,
          };
          localStorage.setItem("storia_story_export_data", JSON.stringify(videoData));
        } else {
          throw new Error(finalResult.error || "Generation failed");
        }
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
      setGenerationStatus("");
    } finally {
      setIsGenerating(false);
    }
  }, [
    title, visualPrompt, soundPrompt, soundIntensity, selectedCategory, selectedMaterial,
    videoModel, aspectRatio, resolution, duration, referenceImage,
    showSoundControls, loopMultiplier, isBinaural, ambientBackground, selectedModelInfo
  ]);

  const reset = useCallback(() => {
    setTitle("");
    setSelectedCategory(null);
    setVisualPrompt("");
    setSoundPrompt("");
    setReferenceImage(null);
    setSelectedMaterial("");
    setGeneratedVideoUrl(null);
    setGeneratedAudioUrl(null);
    setAudioSource(null);
    setStoryId(null);
    setError(null);
    setGenerationStatus("");
    setGenerationProgress(0);
  }, []);

  const state: ASMRGeneratorState = {
    title,
    selectedCategory,
    videoModel,
    selectedModelInfo,
    duration,
    aspectRatio,
    resolution,
    visualPrompt,
    soundPrompt,
    referenceImage,
    selectedMaterial,
    loopMultiplier,
    soundIntensity,
    isBinaural,
    ambientBackground,
    isGenerating,
    isEnhancing,
    isEnhancingSound,
    isGeneratingImage,
    generationStatus,
    generationProgress,
    generatedVideoUrl,
    generatedAudioUrl,
    audioSource,
    storyId,
    error,
  };

  const actions: ASMRGeneratorActions = {
    setTitle,
    setCategory: handleSetCategory,
    setVideoModel: handleSetVideoModel,
    setDuration,
    setAspectRatio,
    setResolution,
    setVisualPrompt,
    setSoundPrompt,
    setReferenceImage,
    setSelectedMaterial,
    setLoopMultiplier,
    setSoundIntensity,
    setIsBinaural,
    setAmbientBackground,
    enhancePrompt,
    enhanceSoundPrompt,
    generateImage,
    generateVideo,
    useCategorySuggestion,
    reset,
  };

  return [state, actions];
}

