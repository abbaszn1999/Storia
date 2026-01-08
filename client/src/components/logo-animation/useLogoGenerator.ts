// Logo Animation Generator - Custom Hook for State Management

import { useState, useCallback, useEffect } from "react";
import { VIDEO_MODELS } from "@/constants/video-models";
import {
  generateVideo as apiGenerateVideo,
  generateIdea as apiGenerateIdea,
  type LogoGenerateResponse,
} from "@/lib/api/logo-animation";

// VEO 3.1 Configuration (fixed - cannot be changed)
const VEO_3_1_MODEL = VIDEO_MODELS.find(m => m.value === "veo-3.1") || {
  value: "veo-3.1",
  label: "Google Veo 3.1",
  provider: "Google",
  description: "Cinematic, natural sound, 8s",
  durations: [4, 6, 8],
  aspectRatios: ["16:9", "9:16"],
  resolutions: ["720p", "1080p"],
  hasAudio: true,
  supportsFrameImages: true,
  frameImageSupport: {
    first: true,
    last: true,
  },
  badge: "Audio",
};

export interface LogoGeneratorState {
  // Model & Settings (VEO 3.1 only - fixed)
  duration: number;
  aspectRatio: string;
  resolution: string;
  
  // Prompts
  visualPrompt: string;
  ideaInput: string; // User's simple idea input
  
  // Media
  referenceImage: string | null;
  
  // UI State
  isGenerating: boolean;
  isGeneratingIdea: boolean;
  generationStatus: string;
  generationProgress: number;
  generatedVideoUrl: string | null;
  /** Story ID from database after successful generation */
  storyId: string | null;
  error: string | null;
}

export interface LogoGeneratorActions {
  setDuration: (duration: number) => void;
  setAspectRatio: (ratio: string) => void;
  setResolution: (resolution: string) => void;
  setVisualPrompt: (prompt: string) => void;
  setIdeaInput: (idea: string) => void;
  setReferenceImage: (image: string | null) => void;
  generateIdea: () => Promise<void>;
  generateVideo: (workspaceId: string) => Promise<void>;
  reset: () => void;
}

export function useLogoGenerator(): [LogoGeneratorState, LogoGeneratorActions] {
  // Model & Settings (VEO 3.1 - fixed)
  const [duration, setDuration] = useState(VEO_3_1_MODEL.durations[2] || 8); // Default to 8s
  const [aspectRatio, setAspectRatio] = useState(VEO_3_1_MODEL.aspectRatios[0] || "16:9");
  const [resolution, setResolution] = useState(VEO_3_1_MODEL.resolutions[0] || "720p");
  
  // Prompts
  const [visualPrompt, setVisualPrompt] = useState("");
  const [ideaInput, setIdeaInput] = useState("");
  
  // Media
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Auto-adjust duration to 8s when reference image is uploaded (VEO 3.1 requirement)
  useEffect(() => {
    if (referenceImage && duration !== 8) {
      setDuration(8);
    }
  }, [referenceImage, duration]);
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const generateIdea = useCallback(async () => {
    if (!ideaInput.trim()) {
      setError("Please enter an idea first");
      return;
    }

    if (!referenceImage) {
      setError("Please upload a reference image first");
      return;
    }

    setIsGeneratingIdea(true);
    setError(null);

    try {
      const result = await apiGenerateIdea(ideaInput.trim(), duration, referenceImage);
      setVisualPrompt(result.visualPrompt);
    } catch (err) {
      console.error("Idea generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate idea");
    } finally {
      setIsGeneratingIdea(false);
    }
  }, [ideaInput, duration, referenceImage]);

  const generateVideo = useCallback(async (workspaceId: string) => {
    if (!visualPrompt.trim()) {
      setError("Visual prompt is required");
      return;
    }

    if (!workspaceId) {
      setError("No workspace selected");
      return;
    }

    // Generate project name from idea or visual prompt
    const projectName = ideaInput.trim() || visualPrompt.trim().substring(0, 50) || "Logo Animation";

    setIsGenerating(true);
    setError(null);
    setGenerationStatus("Generating video...");
    setGenerationProgress(20);
    setGeneratedVideoUrl(null);

    try {
      // Call generateVideo - it will wait until completion (synchronous like stories mode)
      const response = await apiGenerateVideo({
        title: projectName,
        workspaceId,
        visualPrompt: visualPrompt.trim(),
        referenceImage: referenceImage || undefined,
        aspectRatio,
        resolution,
        duration,
      });

      // Result comes back directly (no polling needed)
      if (response.status === "completed" && response.videoUrl) {
        setGeneratedVideoUrl(response.videoUrl);
        setStoryId(response.storyId || null);
        setGenerationStatus("Completed");
        setGenerationProgress(100);
      } else {
        throw new Error(response.error || "Video generation failed");
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate video");
      setGenerationStatus("Failed");
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  }, [ideaInput, visualPrompt, referenceImage, aspectRatio, resolution, duration]);

  const reset = useCallback(() => {
    setVisualPrompt("");
    setIdeaInput("");
    setReferenceImage(null);
    setDuration(VEO_3_1_MODEL.durations[2] || 8);
    setAspectRatio(VEO_3_1_MODEL.aspectRatios[0] || "16:9");
    setResolution(VEO_3_1_MODEL.resolutions[0] || "720p");
    setGeneratedVideoUrl(null);
    setStoryId(null);
    setError(null);
    setGenerationStatus("");
    setGenerationProgress(0);
  }, []);

  const state: LogoGeneratorState = {
    duration,
    aspectRatio,
    resolution,
    visualPrompt,
    ideaInput,
    referenceImage,
    isGenerating,
    isGeneratingIdea,
    generationStatus,
    generationProgress,
    generatedVideoUrl,
    storyId,
    error,
  };

  const actions: LogoGeneratorActions = {
    setDuration,
    setAspectRatio,
    setResolution,
    setVisualPrompt,
    setIdeaInput,
    setReferenceImage,
    generateIdea,
    generateVideo,
    reset,
  };

  return [state, actions];
}

// Export VEO 3.1 model info for use in components
export const VEO_3_1_CONFIG = VEO_3_1_MODEL;

