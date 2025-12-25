// useStoryStudio - Main state management hook
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from "react";
import { StepId, STEPS, StoryStudioState, StoryScene, StoryTemplate, MusicStyle } from "../types";
import { apiRequest } from "@/lib/queryClient";
import { getImageModelConfig } from "@/constants/image-models";
import { getVideoModelConfig } from "@/constants/video-models";
import { useWorkspace } from "@/contexts/workspace-context";

const STORAGE_KEY = "storia-studio-state";

/**
 * Generate a unique timestamp for project folder naming
 * Format: YYYYMMDD_HHMMSS (e.g., 20241222_084530)
 */
function generateProjectTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Generate the full project folder name using a fixed timestamp
 * Format: {projectName}_{timestamp}
 */
function generateProjectFolder(projectName: string, timestamp: string): string {
  const safeName = (projectName || 'MyProject').trim().replace(/[^a-zA-Z0-9\u0600-\u06FF_\- ]/g, '').replace(/\s+/g, '_') || 'MyProject';
  return `${safeName}_${timestamp}`;
}

const createInitialState = (template: StoryTemplate | null): StoryStudioState => {
  // Generate timestamp ONCE for this project session
  const projectTimestamp = generateProjectTimestamp();
  const projectFolder = generateProjectFolder('MyProject', projectTimestamp);
  
  return {
    template,
    
    // Project identification
    projectName: '',
    projectTimestamp,
    projectFolder,
    isProjectLocked: false,
    
    currentStep: 'concept',
    completedSteps: [],
    direction: 1,
    
    // Step 1
    topic: '',
  generatedScript: '',
  aspectRatio: '9:16',
  duration: 30,
  imageMode: 'none', // Legacy
  voiceoverEnabled: true,
  pacing: 'medium',
  textOverlayEnabled: true, // New: Simple ON/OFF toggle
  textOverlay: 'key-points', // Auto-set to key-points
  
  // New State Fields
  aiPrompt: '',
  language: 'en',
  textOverlayStyle: 'modern',
  imageModel: 'nano-banana', // Default image model
  imageStyle: 'photorealistic', // Default image style
  styleReferenceUrl: '', // Custom style reference image URL (locks visual style)
  characterReferenceUrl: '', // Character/face reference image URL
  imageResolution: '1k', // Default image resolution
  animationMode: 'off',
  videoModel: 'seedance-1.0-pro', // Default video model
  videoResolution: '720p', // Default video resolution
  
  // Step 2
  scenes: [],
  
  // Step 3
  selectedVoice: '21m00Tcm4TlvDq8ikWAM', // Rachel (English) - default
  musicStyle: 'none' as MusicStyle, // AI music style
  backgroundMusic: 'none', // Legacy
  customMusicUrl: '', // Custom uploaded music URL
  customMusicDuration: 0, // Duration of custom music in seconds
  voiceVolume: 80,
  musicVolume: 30,
  
  // Step 4 - Fixed export settings (always best quality MP4)
  exportFormat: 'mp4',      // Fixed: Always MP4
  exportQuality: '1080p',   // Fixed: Always 1080p Full HD
  
  // UI
  isGenerating: false,
  isEnhancingStoryboard: false,  // Storyboard enhancement agent running
  isGeneratingImages: false,     // Image generation running
  generationProgress: 0,
  error: null,
  hasGeneratedScenes: false,     // Track if scenes have been auto-generated once
  hasEnhancedStoryboard: false,  // Track if storyboard has been auto-enhanced once
  hasGeneratedVoiceover: false,  // Track if voiceover has been auto-generated once
  hasExportedVideo: false,       // Track if video has been auto-exported once
  };
};

export function useStoryStudio(template: StoryTemplate | null) {
  // Get current workspace for proper file storage paths
  const { currentWorkspace } = useWorkspace();
  
  const [isTransitioningToExport, setIsTransitioningToExport] = useState(false);
  const [voiceoverProgress, setVoiceoverProgress] = useState(0);
  
  // Ref to always have the latest state values (avoids stale closures)
  const stateRef = useRef<StoryStudioState | null>(null);
  
  const [state, setState] = useState<StoryStudioState>(() => {
    // Check if this is a new project (from template selection)
    const searchParams = new URLSearchParams(window.location.search);
    const isNewProject = searchParams.get('new') === 'true';
    
    // If new project, clear localStorage for this template
    if (isNewProject && template) {
      localStorage.removeItem(`${STORAGE_KEY}-${template.id}`);
      // Clear the URL parameter to avoid clearing on refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    let initialState: StoryStudioState;
    
    // Try to restore from localStorage (only if not a new project)
    if (template && !isNewProject) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${template.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          
          // Sync imageMode with animationMode for backward compatibility
          if (parsed.animationMode) {
            let imageMode: 'none' | 'transition' | 'image-to-video' = 'none';
            if (parsed.animationMode === 'transition') {
              imageMode = 'transition';
            } else if (parsed.animationMode === 'video') {
              imageMode = 'image-to-video';
            }
            parsed.imageMode = imageMode;
          }
          
          initialState = { ...createInitialState(template), ...parsed, template };
          stateRef.current = initialState; // Initialize ref immediately
          return initialState;
        } catch {
          // Ignore parse errors
        }
      }
    }
    initialState = createInitialState(template);
    stateRef.current = initialState; // Initialize ref immediately
    return initialState;
  });

  // Keep stateRef in sync with state (always latest values)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist to localStorage
  useEffect(() => {
    if (template) {
      localStorage.setItem(`${STORAGE_KEY}-${template.id}`, JSON.stringify(state));
    }
  }, [state, template]);

  // Generate Images: for Storyboard step
  const generateImages = useCallback(async () => {
    // Use stateRef to get the LATEST state values (avoids stale closure issues)
    const currentState = stateRef.current || state;
    
    if (currentState.scenes.length === 0) return;

    // Check if scenes have imagePrompts
    const hasPrompts = currentState.scenes.some(s => s.imagePrompt);
    if (!hasPrompts) {
      console.warn('[image-generation] No image prompts found, skipping...');
      return;
    }

    console.log('[image-generation] Starting automatic image generation...', {
      styleReferenceUrl: currentState.styleReferenceUrl ? 'provided' : 'none',
      characterReferenceUrl: currentState.characterReferenceUrl ? 'provided' : 'none',
      styleReferenceUrlFull: currentState.styleReferenceUrl,
      characterReferenceUrlFull: currentState.characterReferenceUrl,
    });
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const requestBody = {
        storyId: currentState.template?.id || 'temp-story',
        scenes: currentState.scenes.map(s => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          imagePrompt: s.imagePrompt || s.description,
          duration: s.duration,
        })),
        aspectRatio: currentState.aspectRatio,
        imageStyle: currentState.imageStyle,
        styleReferenceUrl: currentState.styleReferenceUrl || undefined, // Custom style reference
        characterReferenceUrl: currentState.characterReferenceUrl || undefined, // Character reference
        imageModel: currentState.imageModel,
        imageResolution: currentState.imageResolution,
        projectName: currentState.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
      };
      console.log('[image-generation] Request body:', {
        ...requestBody,
        scenes: `${requestBody.scenes.length} scenes`,
      });
      const res = await apiRequest("POST", "/api/problem-solution/images", requestBody);

      const data = await res.json();

      console.log('[image-generation] Images generated successfully:', {
        total: data.scenes.length,
        successful: data.scenes.filter((s: any) => s.status === 'generated').length,
      });

      // Update scenes with imageUrls
      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(scene => {
          const generated = data.scenes.find(
            (g: any) => g.sceneNumber === scene.sceneNumber
          );
          return generated && generated.status === 'generated'
            ? { ...scene, imageUrl: generated.imageUrl }
            : scene;
        }),
        isGenerating: false,
      }));

      // Show errors if any
      if (data.errors && data.errors.length > 0) {
        console.warn('[image-generation] Some scenes failed:', data.errors);
      }
    } catch (error) {
      console.error("[image-generation] Failed to generate images:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate images',
        isGenerating: false,
      }));
    }
  }, [state.scenes, state.aspectRatio, state.imageStyle, state.styleReferenceUrl, state.characterReferenceUrl, state.imageModel, state.imageResolution, state.projectFolder, currentWorkspace?.id, template]);

  // Generate Videos: converts images to videos using I2V
  const generateVideos = useCallback(async () => {
    if (state.scenes.length === 0) return;

    // Check if scenes have imageUrls
    const hasImages = state.scenes.every(s => s.imageUrl);
    if (!hasImages) {
      console.warn('[video-generation] Not all scenes have images');
      return;
    }

    console.log('[video-generation] Starting video generation...');
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const res = await apiRequest("POST", "/api/problem-solution/videos", {
        storyId: state.template?.id || 'temp-story',
        scenes: state.scenes.map(s => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          imageUrl: s.imageUrl!,
          videoPrompt: s.videoPrompt,
          narration: s.narration,
          voiceMood: s.voiceMood,
          duration: s.duration,
        })),
        videoModel: state.videoModel,
        videoResolution: state.videoResolution,
        aspectRatio: state.aspectRatio,
        imageStyle: state.imageStyle,
        projectName: state.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
      });

      const data = await res.json();

      console.log('[video-generation] Videos generated successfully:', {
        total: data.scenes.length,
        successful: data.scenes.filter((s: any) => s.status === 'generated').length,
      });

      // Update scenes with videoUrls
      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(scene => {
          const generated = data.scenes.find(
            (g: any) => g.sceneNumber === scene.sceneNumber
          );
          return generated && generated.status === 'generated'
            ? { ...scene, videoUrl: generated.videoUrl }
            : scene;
        }),
        isGenerating: false,
      }));

      if (data.errors && data.errors.length > 0) {
        console.warn('[video-generation] Some scenes failed:', data.errors);
      }
    } catch (error) {
      console.error("[video-generation] Failed to generate videos:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate videos',
        isGenerating: false,
      }));
    }
  }, [state.scenes, state.videoModel, state.videoResolution, state.aspectRatio, state.topic, template]);

  // Regenerate Scene Video: regenerates video for a single scene
  const regenerateSceneVideo = useCallback(async (scene: StoryScene) => {
    if (!scene.imageUrl) {
      console.warn('[video-regenerate] Scene has no image');
      return;
    }

    console.log(`[video-regenerate] Regenerating video for scene ${scene.sceneNumber}...`);
    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const res = await apiRequest("POST", "/api/problem-solution/videos/regenerate", {
        sceneNumber: scene.sceneNumber,
        sceneId: scene.id,
        imageUrl: scene.imageUrl,
        videoPrompt: scene.videoPrompt,
        narration: scene.narration,
        voiceMood: scene.voiceMood,
        duration: scene.duration,
        videoModel: state.videoModel,
        videoResolution: state.videoResolution,
        aspectRatio: state.aspectRatio,
        imageStyle: state.imageStyle,
        projectName: state.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
        storyId: template?.id || 'temp-story',
      });

      const data = await res.json();

      if (data.videoUrl) {
        console.log(`[video-regenerate] Scene ${scene.sceneNumber} video regenerated successfully`);
        setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(s =>
            s.id === scene.id ? { ...s, videoUrl: data.videoUrl } : s
          ),
          isGenerating: false,
        }));
      } else {
        throw new Error(data.error || 'Failed to regenerate video');
      }
    } catch (error) {
      console.error("[video-regenerate] Failed:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to regenerate video',
        isGenerating: false,
      }));
    }
  }, [state.videoModel, state.videoResolution, state.aspectRatio, state.topic, template]);

  // Generate Storyboard Enhancement: auto-triggered when entering storyboard step
  const generateStoryboardEnhancement = useCallback(async () => {
    if (state.scenes.length === 0) return;

    console.log('[storyboard] Starting storyboard enhancement...');
    // Phase 1: Enhancement agent running
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      isEnhancingStoryboard: true,  // Agent creating prompts
      isGeneratingImages: false,
      error: null 
    }));

    try {
      // Determine animation type based on animationMode
      let animationType: 'transition' | 'image-to-video' | undefined;
      const isAnimationOn = state.animationMode !== 'off';
      
      if (isAnimationOn) {
        if (state.animationMode === 'transition') {
          animationType = 'transition';
        } else if (state.animationMode === 'video') {
          animationType = 'image-to-video';
        }
      }

      const res = await apiRequest("POST", "/api/problem-solution/storyboard", {
        scenes: state.scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          duration: s.duration,
          description: s.description, // Visual description for image generation
          narration: s.narration, // Voiceover text (if enabled)
        })),
        aspectRatio: state.aspectRatio,
        imageStyle: state.imageStyle,
        voiceoverEnabled: state.voiceoverEnabled,
        language: state.voiceoverEnabled ? state.language : undefined,
        textOverlay: state.voiceoverEnabled ? state.textOverlay : undefined,
        animationMode: isAnimationOn,
        animationType: animationType,
      });

      const data = await res.json();

      console.log('[storyboard] Enhancement complete, updating scenes...');
      console.log('[storyboard] Voiceover enabled:', state.voiceoverEnabled);
      console.log('[storyboard] Enhanced data:', data);

      // Merge enhanced data with existing scenes
      const enhancedScenes = state.scenes.map(scene => {
        const enhanced = data.scenes.find((e: any) => e.sceneNumber === scene.sceneNumber);
        if (enhanced) {
          const updates: any = {
            ...scene,
            imagePrompt: enhanced.imagePrompt,
            videoPrompt: enhanced.videoPrompt,
            imageAnimation: enhanced.animationName,
            imageEffect: enhanced.effectName, // Visual effect from AI
            voiceMood: enhanced.voiceMood, // Emotional mood for voice (ElevenLabs v3)
          };
          
          // Update narration ONLY if voiceover is enabled
          if (state.voiceoverEnabled) {
            // Use voiceText from agent, or empty string if not provided
            updates.narration = enhanced.voiceText || '';
            console.log(`[storyboard] Scene ${scene.sceneNumber} voiceText:`, enhanced.voiceText);
          } else {
            // Keep original narration if voiceover is disabled
            updates.narration = scene.narration;
          }
          
          return updates;
        }
        return scene;
      });

      // Phase 2: Enhancement done, prompts are now visible
      setState(prev => ({
        ...prev,
        scenes: enhancedScenes,
        isEnhancingStoryboard: false,  // Enhancement complete - prompts visible
        hasEnhancedStoryboard: true,   // Mark as enhanced - won't auto-enhance again
      }));

      // ✅ AUTO-TRIGGER: Generate images immediately after enhancement
      console.log('[storyboard] Enhancement complete, auto-triggering image generation...');
      
      // Check if scenes have imagePrompts
      const hasPrompts = enhancedScenes.some(s => s.imagePrompt);
      if (!hasPrompts) {
        console.warn('[storyboard] No image prompts found after enhancement, skipping image generation...');
        setState(prev => ({ ...prev, isGenerating: false }));
        return;
      }

      // Phase 3: Image generation (only media box shows loading)
      console.log('[storyboard] Starting automatic image generation...');
      setState(prev => ({ 
        ...prev, 
        isGeneratingImages: true,  // Image generation starting
        error: null 
      }));

      try {
        const res = await apiRequest("POST", "/api/problem-solution/images", {
          storyId: state.template?.id || 'temp-story',
          scenes: enhancedScenes.map(s => ({
            id: s.id,
            sceneNumber: s.sceneNumber,
            imagePrompt: s.imagePrompt || s.description,
            duration: s.duration,
          })),
          aspectRatio: state.aspectRatio,
          imageStyle: state.imageStyle,
          styleReferenceUrl: state.styleReferenceUrl || undefined, // Custom style reference
          characterReferenceUrl: state.characterReferenceUrl || undefined, // Character reference
          imageModel: state.imageModel,
          imageResolution: state.imageResolution,
          projectName: state.projectFolder,
          workspaceId: currentWorkspace?.id || 'default',
        });

        const imageData = await res.json();

        console.log('[storyboard] Images generated successfully:', {
          total: imageData.scenes.length,
          successful: imageData.scenes.filter((s: any) => s.status === 'generated').length,
        });

        // Update scenes with imageUrls
        setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(scene => {
            const generated = imageData.scenes.find(
              (g: any) => g.sceneNumber === scene.sceneNumber
            );
            return generated && generated.status === 'generated'
              ? { ...scene, imageUrl: generated.imageUrl }
              : scene;
          }),
          isGenerating: false,
          isGeneratingImages: false,  // Image generation complete
        }));
      } catch (error) {
        console.error("[storyboard] Failed to generate images:", error);
        setState(prev => ({
          ...prev,
          error: 'Failed to generate images',
          isGenerating: false,
          isGeneratingImages: false,
        }));
      }

    } catch (error) {
      console.error("[storyboard] Failed to enhance storyboard:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to enhance storyboard',
        isGenerating: false,
        isEnhancingStoryboard: false,
        isGeneratingImages: false,
      }));
    }
  }, [state.scenes, state.aspectRatio, state.voiceoverEnabled, state.imageMode, generateImages]);

  // Navigation
  const goToStep = useCallback((step: StepId) => {
    const currentIndex = STEPS.findIndex(s => s.id === state.currentStep);
    const targetIndex = STEPS.findIndex(s => s.id === step);
    setState(prev => ({
      ...prev,
      currentStep: step,
      direction: targetIndex > currentIndex ? 1 : -1,
    }));
  }, [state.currentStep]);

  const nextStep = useCallback(async () => {
    const currentIndex = STEPS.findIndex(s => s.id === state.currentStep);
    if (currentIndex < STEPS.length - 1) {
      const nextStepId = STEPS[currentIndex + 1].id;
      
      // Lock project name when leaving concept step
      const shouldLockProject = state.currentStep === 'concept' && !state.isProjectLocked;
      
      // Regenerate projectFolder with final projectName if not locked yet (using same timestamp)
      const finalProjectFolder = shouldLockProject 
        ? generateProjectFolder(state.projectName || 'MyProject', state.projectTimestamp)
        : state.projectFolder;
      
      // Navigate first
      setState(prev => ({
        ...prev,
        currentStep: nextStepId,
        direction: 1,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
        // Lock the project and set the final projectFolder
        isProjectLocked: shouldLockProject ? true : prev.isProjectLocked,
        projectFolder: finalProjectFolder,
      }));

      // Auto-trigger scene generation when entering script step ONLY ONCE (first time ever)
      if (state.currentStep === 'concept' && nextStepId === 'script' && !state.hasGeneratedScenes) {
        console.log('[nextStep] Auto-triggering scene generation (first time)...');
        
        if (!state.topic.trim()) return;
        
        setState(prev => ({ ...prev, isGenerating: true, error: null }));
        
        try {
          const res = await apiRequest("POST", "/api/problem-solution/scenes", {
            storyText: state.topic,
            duration: state.duration,
            pacing: state.pacing,
            videoModel: state.videoModel, // Pass video model for duration constraints
          });
          
          const data = await res.json();
          
          // Map backend scenes to frontend StoryScene format
          const generatedScenes: StoryScene[] = data.scenes.map((s: any) => ({
            id: `scene-${s.sceneNumber}`,
            sceneNumber: s.sceneNumber,
            duration: s.duration,
            description: s.description || '', // Visual description for image generation
            narration: s.narration || '',     // Voiceover text (if enabled)
          }));
          
          setState(prev => ({ 
            ...prev, 
            scenes: generatedScenes,
            isGenerating: false,
            hasGeneratedScenes: true  // Mark as generated - won't auto-generate again
          }));
        } catch (error) {
          console.error("[nextStep] Failed to generate scenes:", error);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to generate scenes',
            isGenerating: false 
          }));
        }
      }

      // Auto-trigger storyboard enhancement ONLY ONCE (first time ever)
      if (state.currentStep === 'script' && nextStepId === 'storyboard' && !state.hasEnhancedStoryboard) {
        console.log('[nextStep] Auto-triggering storyboard enhancement (first time)...');
        await generateStoryboardEnhancement();
      }
    }
  }, [state.currentStep, state.topic, state.duration, state.pacing, state.hasGeneratedScenes, state.hasEnhancedStoryboard, generateStoryboardEnhancement]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === state.currentStep);
    if (currentIndex > 0) {
      setState(prev => ({
        ...prev,
        currentStep: STEPS[currentIndex - 1].id,
        direction: -1,
      }));
    }
  }, [state.currentStep]);

  // Project Name - regenerate projectFolder when name changes using fixed timestamp
  const setProjectName = useCallback((projectName: string) => {
    setState(prev => {
      // If project is locked, don't allow changes
      if (prev.isProjectLocked) return prev;
      
      return {
        ...prev,
        projectName,
        // Regenerate folder with current name but SAME timestamp
        projectFolder: generateProjectFolder(projectName || 'MyProject', prev.projectTimestamp),
      };
    });
  }, []);

  // Step 1: Concept
  const setTopic = useCallback((topic: string) => {
    setState(prev => ({ ...prev, topic }));
  }, []);

  const setGeneratedScript = useCallback((generatedScript: string) => {
    setState(prev => ({ ...prev, generatedScript }));
  }, []);

  const setAspectRatio = useCallback((aspectRatio: string) => {
    setState(prev => ({ ...prev, aspectRatio }));
  }, []);

  const setDuration = useCallback((duration: number) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  const setImageMode = useCallback((imageMode: 'none' | 'transition' | 'image-to-video') => {
    setState(prev => ({ ...prev, imageMode }));
  }, []);

  const setVoiceoverEnabled = useCallback((voiceoverEnabled: boolean) => {
    setState(prev => ({ ...prev, voiceoverEnabled }));
  }, []);

  const setPacing = useCallback((pacing: 'slow' | 'medium' | 'fast') => {
    setState(prev => ({ ...prev, pacing }));
  }, []);

  const setTextOverlay = useCallback((textOverlay: 'minimal' | 'key-points' | 'full') => {
    setState(prev => ({ ...prev, textOverlay }));
  }, []);

  const setAiPrompt = useCallback((aiPrompt: string) => {
    setState(prev => ({ ...prev, aiPrompt }));
  }, []);

  const setLanguage = useCallback((language: 'ar' | 'en') => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const setTextOverlayEnabled = useCallback((textOverlayEnabled: boolean) => {
    setState(prev => ({ ...prev, textOverlayEnabled }));
  }, []);

  const setTextOverlayStyle = useCallback((textOverlayStyle: 'modern' | 'cinematic' | 'bold') => {
    setState(prev => ({ ...prev, textOverlayStyle }));
  }, []);

  const setImageModel = useCallback((imageModel: string) => {
    setState(prev => {
      const modelConfig = getImageModelConfig(imageModel);
      
      // If current resolution is not supported by new model, reset to first available
      const newResolution = modelConfig?.resolutions.includes(prev.imageResolution)
        ? prev.imageResolution
        : modelConfig?.resolutions[0] || '1k';
      
      return { 
        ...prev, 
        imageModel,
        imageResolution: newResolution
      };
    });
  }, []);

  const setImageStyle = useCallback((imageStyle: 'photorealistic' | 'cinematic' | '3d-render' | 'digital-art' | 'anime' | 'illustration' | 'watercolor' | 'minimalist') => {
    setState(prev => ({ ...prev, imageStyle }));
  }, []);

  const setStyleReferenceUrl = useCallback((styleReferenceUrl: string) => {
    setState(prev => {
      const newState = { ...prev, styleReferenceUrl };
      stateRef.current = newState; // Update ref immediately for sync access
      return newState;
    });
  }, []);

  const setCharacterReferenceUrl = useCallback((characterReferenceUrl: string) => {
    console.log('[useStoryStudio] setCharacterReferenceUrl called with:', characterReferenceUrl);
    setState(prev => {
      console.log('[useStoryStudio] Previous characterReferenceUrl:', prev.characterReferenceUrl);
      console.log('[useStoryStudio] New characterReferenceUrl:', characterReferenceUrl);
      const newState = { ...prev, characterReferenceUrl };
      stateRef.current = newState; // Update ref immediately for sync access
      return newState;
    });
  }, []);

  const setImageResolution = useCallback((imageResolution: string) => {
    setState(prev => ({ ...prev, imageResolution }));
  }, []);

  const setAnimationMode = useCallback((animationMode: 'off' | 'transition' | 'video') => {
    setState(prev => {
      // Map animationMode to imageMode for backward compatibility
      let imageMode: 'none' | 'transition' | 'image-to-video' = 'none';
      
      if (animationMode === 'transition') {
        imageMode = 'transition';
      } else if (animationMode === 'video') {
        imageMode = 'image-to-video';
      }
      
      console.log('[setAnimationMode] Updating:', { animationMode, imageMode });
      
      // Auto-adjust scene durations when switching to video mode
      let adjustedScenes = prev.scenes;
      if (animationMode === 'video' && prev.scenes.length > 0) {
        const modelConfig = getVideoModelConfig(prev.videoModel);
        if (modelConfig) {
          const supportedDurations = modelConfig.durations;
          adjustedScenes = prev.scenes.map(scene => {
            if (!supportedDurations.includes(scene.duration)) {
              // Find closest supported duration
              const closestDuration = supportedDurations.reduce((closest, current) => {
                return Math.abs(current - scene.duration) < Math.abs(closest - scene.duration)
                  ? current
                  : closest;
              });
              console.log(`[setAnimationMode] Adjusting scene ${scene.sceneNumber}: ${scene.duration}s → ${closestDuration}s`);
              return { ...scene, duration: closestDuration };
            }
            return scene;
          });
        }
      }
      
      return { 
        ...prev, 
        animationMode,
        imageMode,
        scenes: adjustedScenes
      };
    });
  }, []);

  const setVideoModel = useCallback((videoModel: string) => {
    setState(prev => {
      const modelConfig = getVideoModelConfig(videoModel);
      
      // If current resolution is not supported by new model, reset to first available
      const newResolution = modelConfig?.resolutions.includes(prev.videoResolution)
        ? prev.videoResolution
        : modelConfig?.resolutions[0] || '720p';
      
      // Auto-adjust scene durations if in video mode and scenes exist
      let adjustedScenes = prev.scenes;
      if (prev.animationMode === 'video' && modelConfig && prev.scenes.length > 0) {
        const supportedDurations = modelConfig.durations;
        adjustedScenes = prev.scenes.map(scene => {
          // Check if current duration is supported
          if (!supportedDurations.includes(scene.duration)) {
            // Find closest supported duration
            const closestDuration = supportedDurations.reduce((closest, current) => {
              return Math.abs(current - scene.duration) < Math.abs(closest - scene.duration)
                ? current
                : closest;
            });
            return { ...scene, duration: closestDuration };
          }
          return scene;
        });
      }
      
      return { 
        ...prev, 
        videoModel,
        videoResolution: newResolution,
        scenes: adjustedScenes
      };
    });
  }, []);

  const setVideoResolution = useCallback((videoResolution: string) => {
    setState(prev => ({ ...prev, videoResolution }));
  }, []);

  // Idea agent: generate story text using aiPrompt and write to topic field
  const generateIdeaStory = useCallback(async () => {
    // If aiPrompt is empty, do nothing
    if (!state.aiPrompt.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      // We send aiPrompt as the main input
      const res = await apiRequest("POST", "/api/problem-solution/idea", {
        ideaText: state.aiPrompt,
        durationSeconds: state.duration,
      });
      const data = await res.json();

      // Simply use the story text directly
      const story = data?.story || "";

      // Write result to topic field (overwriting or appending? Plan said "Fills", assuming overwrite for now)
      setState(prev => ({
        ...prev,
        topic: story,
        isGenerating: false,
      }));
    } catch (error) {
      console.error("Failed to generate story:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate story',
        isGenerating: false,
      }));
    }
  }, [state.aiPrompt, state.duration]);

  // Generate Script button: navigates to Script step and generates scenes
  const generateScript = useCallback(async () => {
    if (!state.topic.trim()) return;
    
    // First, navigate to Script step
    setState(prev => ({
      ...prev,
      currentStep: 'script',
      direction: 1,
      completedSteps: prev.completedSteps.includes('concept')
        ? prev.completedSteps
        : [...prev.completedSteps, 'concept'],
      isGenerating: true,
      error: null,
    }));

    // Then, automatically generate scenes
    try {
      console.log('[generateScript] Sending request to generate scenes...');
      const res = await apiRequest("POST", "/api/problem-solution/scenes", {
        storyText: state.topic,
        duration: state.duration,
        pacing: state.pacing,
        videoModel: state.videoModel, // Pass video model for duration constraints
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('[generateScript] Scenes generated:', data);
      
      if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
        throw new Error('No scenes returned from API');
      }
      
      // Map backend scenes to frontend StoryScene format
      const generatedScenes: StoryScene[] = data.scenes.map((s: any) => ({
        id: `scene-${s.sceneNumber}`,
        sceneNumber: s.sceneNumber,
        duration: s.duration,
        description: s.description || '', // Visual description for image generation
        narration: s.narration || '',     // Voiceover text (if enabled)
      }));
      
      console.log('[generateScript] Mapped scenes:', generatedScenes);
      
      setState(prev => ({ 
        ...prev, 
        scenes: generatedScenes,
        isGenerating: false,
        error: null,
        hasGeneratedScenes: true  // Mark as generated - won't auto-generate again
      }));
    } catch (error) {
      console.error("[generateScript] Failed to generate scenes:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate scenes';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isGenerating: false 
      }));
    }
  }, [state.topic, state.duration, state.aspectRatio, state.voiceoverEnabled, state.imageMode]);

  // Step 2: Storyboard
  const setScenes = useCallback((scenes: StoryScene[]) => {
    setState(prev => ({ ...prev, scenes }));
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<StoryScene>) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => 
        scene.id === id ? { ...scene, ...updates } : scene
      ),
    }));
  }, []);

  const addScene = useCallback(() => {
    setState(prev => {
      const newSceneNumber = prev.scenes.length + 1;
      
      // Get default duration based on video model (for image-to-video mode)
      let defaultDuration = 5;
      if (prev.animationMode === 'video') {
        const modelConfig = getVideoModelConfig(prev.videoModel);
        if (modelConfig && modelConfig.durations.length > 0) {
          // Use the median duration from supported durations
          const sortedDurations = [...modelConfig.durations].sort((a, b) => a - b);
          const midIndex = Math.floor(sortedDurations.length / 2);
          defaultDuration = sortedDurations[midIndex];
        }
      }
      
      const newScene: StoryScene = {
        id: `scene-${newSceneNumber}-${Date.now()}`,
        sceneNumber: newSceneNumber,
        duration: defaultDuration,
        description: '', // Visual description for image generation
        narration: '',   // Voiceover text (if enabled)
      };
      return {
        ...prev,
        scenes: [...prev.scenes, newScene]
      };
    });
  }, []);

  const deleteScene = useCallback((id: string) => {
    setState(prev => {
      const filteredScenes = prev.scenes.filter(scene => scene.id !== id);
      // Renumber scenes after deletion
      const renumberedScenes = filteredScenes.map((scene, index) => ({
        ...scene,
        sceneNumber: index + 1
      }));
      return {
        ...prev,
        scenes: renumberedScenes
      };
    });
  }, []);

  const generateScenes = useCallback(async () => {
    if (!state.topic.trim()) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const res = await apiRequest("POST", "/api/problem-solution/scenes", {
        storyText: state.topic,
        duration: state.duration,
        pacing: state.pacing,
        videoModel: state.videoModel, // Pass video model for duration constraints
      });
      
      const data = await res.json();
      
      // Map backend scenes to frontend StoryScene format
      const generatedScenes: StoryScene[] = data.scenes.map((s: any) => ({
        id: `scene-${s.sceneNumber}`,
        sceneNumber: s.sceneNumber,
        duration: s.duration,
        description: s.description || '', // Visual description for image generation
        narration: s.narration || '',     // Voiceover text (if enabled)
      }));
      
      setState(prev => ({ 
        ...prev, 
        scenes: generatedScenes,
        isGenerating: false,
        hasGeneratedScenes: true  // Mark as generated
      }));
    } catch (error) {
      console.error("Failed to generate scenes:", error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate scenes',
        isGenerating: false 
      }));
    }
  }, [state.topic, state.duration, state.aspectRatio, state.voiceoverEnabled, state.imageMode]);

  // Regenerate single scene image
  const regenerateSceneImage = useCallback(async (sceneId: string) => {
    // Use stateRef to get the LATEST state values (avoids stale closure issues)
    const currentState = stateRef.current || state;
    
    const scene = currentState.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      console.log('[regenerate] Regenerating image for scene', scene.sceneNumber);
      
      const res = await apiRequest("POST", "/api/problem-solution/images/regenerate", {
        sceneNumber: scene.sceneNumber,
        sceneId: scene.id,
        imagePrompt: scene.imagePrompt || scene.narration,
        aspectRatio: currentState.aspectRatio,
        imageStyle: currentState.imageStyle,
        styleReferenceUrl: currentState.styleReferenceUrl || undefined, // Custom style reference
        characterReferenceUrl: currentState.characterReferenceUrl || undefined, // Character reference
        imageModel: currentState.imageModel,
        imageResolution: currentState.imageResolution,
        projectName: currentState.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
        storyId: template?.id || 'temp-story',
      });

      const data = await res.json();

      if (data.success && data.imageUrl) {
        console.log('[regenerate] Image regenerated successfully:', data.imageUrl);
        
        // Add cache-busting timestamp to force image reload
        const cacheBustedUrl = `${data.imageUrl}?t=${Date.now()}`;
        
        console.log('[regenerate] Updating scene', sceneId, 'with new URL:', cacheBustedUrl);
        
        // Update only this scene's imageUrl
        setState(prev => {
          const updatedScenes = prev.scenes.map(s => 
            s.id === sceneId 
              ? { ...s, imageUrl: cacheBustedUrl }
              : s
          );
          
          console.log('[regenerate] Updated scenes:', updatedScenes.map(s => ({ 
            id: s.id, 
            sceneNumber: s.sceneNumber, 
            imageUrl: s.imageUrl?.substring(0, 80) + '...' 
          })));
          
          return {
            ...prev,
            scenes: updatedScenes,
            isGenerating: false,
          };
        });
      } else {
        throw new Error(data.error || 'Failed to regenerate');
      }
    } catch (error) {
      console.error("[regenerate] Failed to regenerate scene image:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to regenerate image',
        isGenerating: false,
      }));
    }
  }, [state.scenes, state.aspectRatio, state.imageStyle, state.styleReferenceUrl, state.characterReferenceUrl, state.imageModel, state.imageResolution, state.projectFolder, currentWorkspace?.id, template]);

  // Generate Voiceover: for Audio step
  const generateVoiceover = useCallback(async () => {
    if (state.scenes.length === 0) return;
    if (!state.voiceoverEnabled) return;
    if (!state.selectedVoice) return;

    console.log('[voiceover] Starting voiceover generation...');
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const res = await apiRequest("POST", "/api/problem-solution/voiceover", {
        storyId: template?.id || 'temp-story',
        scenes: state.scenes.map(s => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          narration: s.narration,
          voiceInstructions: s.voiceInstructions,
          voiceMood: s.voiceMood, // ElevenLabs v3 audio tags
          duration: s.duration,
        })),
        voiceId: state.selectedVoice,
        projectName: state.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
      });

      const data = await res.json();

      console.log('[voiceover] Voiceover generated successfully:', {
        total: data.scenes.length,
        successful: data.scenes.filter((s: any) => s.status === 'generated').length,
      });

      // Update scenes with audioUrls, durations, AND word timestamps for synchronized subtitles
      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(scene => {
          const generated = data.scenes.find(
            (g: any) => g.sceneNumber === scene.sceneNumber
          );
          if (generated && generated.status === 'generated') {
            const hasTimestamps = generated.wordTimestamps && generated.wordTimestamps.length > 0;
            console.log(`[voiceover] Scene ${scene.sceneNumber}: Duration ${scene.duration}s → ${generated.duration}s, Words: ${hasTimestamps ? generated.wordTimestamps.length : 'none'}`);
            return { 
              ...scene, 
              audioUrl: generated.audioUrl,
              duration: generated.duration,       // Use actual audio duration!
              wordTimestamps: generated.wordTimestamps,  // NEW: Word-level sync for subtitles!
            };
          }
          return scene;
        }),
        isGenerating: false,
        hasGeneratedVoiceover: true,  // Mark voiceover as generated (once-only flag)
      }));

      // Show errors if any
      if (data.errors && data.errors.length > 0) {
        console.warn('[voiceover] Some scenes failed:', data.errors);
      }
    } catch (error) {
      console.error("[voiceover] Failed to generate voiceover:", error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate voiceover',
        isGenerating: false,
      }));
    }
  }, [state.scenes, state.voiceoverEnabled, state.selectedVoice, state.topic, template]);

  // Step 3: Audio
  const setSelectedVoice = useCallback((selectedVoice: string) => {
    setState(prev => ({ ...prev, selectedVoice }));
  }, []);

  const setMusicStyle = useCallback((musicStyle: MusicStyle) => {
    setState(prev => ({ ...prev, musicStyle }));
  }, []);

  const setBackgroundMusic = useCallback((backgroundMusic: string) => {
    setState(prev => ({ ...prev, backgroundMusic }));
  }, []);

  // Custom music upload handlers
  const setCustomMusic = useCallback((customMusicUrl: string, customMusicDuration: number) => {
    setState(prev => ({ ...prev, customMusicUrl, customMusicDuration }));
  }, []);

  const clearCustomMusic = useCallback(() => {
    setState(prev => ({ ...prev, customMusicUrl: '', customMusicDuration: 0 }));
  }, []);

  const setVoiceVolume = useCallback((voiceVolume: number) => {
    setState(prev => ({ ...prev, voiceVolume }));
  }, []);

  const setMusicVolume = useCallback((musicVolume: number) => {
    setState(prev => ({ ...prev, musicVolume }));
  }, []);

  // Step 4: Export
  const setExportFormat = useCallback((exportFormat: string) => {
    setState(prev => ({ ...prev, exportFormat }));
  }, []);

  const setExportQuality = useCallback((exportQuality: string) => {
    setState(prev => ({ ...prev, exportQuality }));
  }, []);

  const exportVideo = useCallback(async () => {
    if (state.scenes.length === 0) {
      console.warn('[export] No scenes to export');
      return null;
    }

    console.log('[export] ═══════════════════════════════════════════════');
    console.log('[export] Starting video export...');
    console.log('[export] Animation mode:', state.animationMode);
    console.log('[export] Voiceover enabled:', state.voiceoverEnabled);
    console.log('[export] Background music:', state.backgroundMusic);
    console.log('[export] Custom music:', state.customMusicUrl ? 'uploaded' : 'none');
    console.log('[export] Text overlay:', state.textOverlay);
    console.log('[export] ═══════════════════════════════════════════════');
    
    setState(prev => ({ ...prev, isGenerating: true, generationProgress: 0, error: null }));
    
    try {
      // Map frontend animationMode to backend format
      let backendAnimationMode: 'off' | 'transition' | 'video' = 'off';
      
      if (state.animationMode === 'off') {
        backendAnimationMode = 'off';
      } else if (state.animationMode === 'transition') {
        backendAnimationMode = 'transition';
      } else if (state.animationMode === 'video') {
        backendAnimationMode = 'video';
      }
      
      // Legacy support
      if (state.imageMode === 'none') {
        backendAnimationMode = 'off';
      } else if (state.imageMode === 'transition') {
        backendAnimationMode = 'transition';
      } else if (state.imageMode === 'image-to-video') {
        backendAnimationMode = 'video';
      }

      console.log('[export] Backend animation mode:', backendAnimationMode);

      // Check if we have word-level timestamps for synchronized subtitles
      const hasWordTimestamps = state.scenes.some(s => s.wordTimestamps && s.wordTimestamps.length > 0);
      console.log('[export] Word-level sync:', hasWordTimestamps ? '✓ Enabled (precise subtitles)' : '✗ Fallback mode');

      const res = await apiRequest("POST", "/api/problem-solution/export", {
        storyId: template?.id || 'temp-story',
        scenes: state.scenes.map(s => ({
          sceneNumber: s.sceneNumber,
          imageUrl: s.imageUrl,
          videoUrl: s.videoUrl,
          audioUrl: s.audioUrl,
          narration: s.narration,
          duration: s.duration,
          imageAnimation: s.imageAnimation, // Pass CSS animation type for transition mode
          imageEffect: s.imageEffect, // Pass visual effect for transition mode
          wordTimestamps: s.wordTimestamps, // NEW: Word-level sync for karaoke subtitles!
        })),
        animationMode: backendAnimationMode,
        musicStyle: state.musicStyle, // AI music style
        customMusicUrl: state.customMusicUrl || undefined, // User-uploaded custom music (takes priority)
        storyTopic: state.topic, // For context-aware music generation
        backgroundMusic: state.backgroundMusic !== 'none' ? state.backgroundMusic : null, // Legacy
        voiceVolume: state.voiceVolume,
        musicVolume: state.musicVolume,
        aspectRatio: state.aspectRatio,
        exportFormat: state.exportFormat,
        exportQuality: state.exportQuality,
        textOverlay: state.voiceoverEnabled && state.textOverlayEnabled, // Text overlay ONLY when both voiceover and textOverlay are enabled
        textOverlayStyle: state.textOverlayStyle, // Style: 'modern' | 'cinematic' | 'bold'
        language: state.language, // Language for font selection: 'en' | 'ar'
        projectName: state.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
      });

      const data = await res.json();

      if (!data.videoUrl) {
        throw new Error('No video URL returned from export');
      }
      
      console.log('[export] Video exported successfully:', {
        videoUrl: data.videoUrl,
        videoBaseUrl: data.videoBaseUrl,
        voiceoverUrl: data.voiceoverUrl,
        musicUrl: data.musicUrl,
        duration: data.duration,
        size: data.size ? `${(data.size / 1024 / 1024).toFixed(2)}MB` : 'Unknown',
      });

      // Save result for volume control remix
      const exportResult = {
        videoUrl: data.videoUrl,
        videoBaseUrl: data.videoBaseUrl,
        voiceoverUrl: data.voiceoverUrl,
        musicUrl: data.musicUrl,
      };
      
      // Save story to database and get storyId
      let storyId: string | undefined;
      try {
        console.log('[export] Saving story to database...');
        const saveRes = await apiRequest("POST", "/api/problem-solution/story/save", {
          workspaceId: currentWorkspace?.id || 'default',
          projectName: state.projectName || 'Untitled',
          projectFolder: state.projectFolder,
          storyMode: 'problem-solution',
          videoUrl: data.videoUrl,
          thumbnailUrl: undefined, // Can add thumbnail generation later
          duration: data.duration,
          aspectRatio: state.aspectRatio,
        });
        const saveData = await saveRes.json();
        storyId = saveData.story?.id;
        console.log('[export] Story saved to database, storyId:', storyId);
      } catch (saveError) {
        console.warn('[export] Failed to save story to database:', saveError);
        // Don't fail the export if DB save fails
      }
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        lastExportResult: exportResult,
        storyId: storyId, // Save storyId in state
        hasExportedVideo: true,  // Mark video as exported (once-only flag)
      }));

      // Return full result for volume control
      return {
        ...exportResult,
        duration: data.duration,
        size: data.size,
      };
    } catch (error) {
      console.error("[export] Failed to export video:", error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to export video',
        isGenerating: false,
        generationProgress: 0,
      }));
      return null;
    }
  }, [state.scenes, state.animationMode, state.backgroundMusic, state.voiceVolume, state.musicVolume, state.aspectRatio, state.exportFormat, state.exportQuality, state.topic, template]);

  // Remix video with new volume levels
  const remixVideo = useCallback(async (
    videoBaseUrl: string,
    voiceoverUrl: string,
    musicUrl: string,
    voiceVolume: number,
    musicVolume: number
  ): Promise<string | null> => {
    console.log('[remix] Starting remix with volumes:', { voiceVolume, musicVolume });
    
    try {
      const res = await apiRequest("POST", "/api/problem-solution/remix", {
        videoBaseUrl,
        voiceoverUrl,
        musicUrl,
        voiceVolume,
        musicVolume,
        projectName: state.projectFolder,
        workspaceId: currentWorkspace?.id || 'default',
      });

      const data = await res.json();

      if (!data.videoUrl) {
        throw new Error('No video URL returned from remix');
      }

      console.log('[remix] Video remixed successfully:', {
        videoUrl: data.videoUrl,
        duration: data.duration,
      });

      return data.videoUrl;
    } catch (error) {
      console.error("[remix] Failed to remix video:", error);
      return null;
    }
  }, [state.topic, template]);

  // Reset
  const reset = useCallback(() => {
    setState(createInitialState(template));
    if (template) {
      localStorage.removeItem(`${STORAGE_KEY}-${template.id}`);
    }
  }, [template]);

  // Completion check helpers
  const hasProjectName = state.projectName.trim().length > 0;
  
  // Check if selected image model requires reference images
  const selectedImageModel = getImageModelConfig(state.imageModel);
  const requiresReferenceImages = selectedImageModel?.requiresReferenceImages ?? false;
  const hasReferenceImage = !!(state.styleReferenceUrl || state.characterReferenceUrl);
  const referenceImagesValid = !requiresReferenceImages || hasReferenceImage;
  
  const isStep1Complete = state.topic.trim().length > 0 && hasProjectName && referenceImagesValid;
  
  // Script step is complete only if scenes exist AND total duration matches target
  const totalSceneDuration = state.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const isStepScriptComplete = state.scenes.length > 0 && totalSceneDuration === state.duration;
  
  const isStep2Complete = state.scenes.length > 0;
  const isStep3Complete = state.selectedVoice.length > 0;
  const isStep4Ready = isStep1Complete && isStepScriptComplete && isStep2Complete && isStep3Complete;

  const canProceed = useCallback((step: StepId): boolean => {
    switch (step) {
      case 'concept': 
        // منع التقدم أثناء توليد الفكرة بالـ AI
        return isStep1Complete && !state.isGenerating;
      case 'script': 
        // منع التقدم أثناء توليد المشاهد
        return isStepScriptComplete && !state.isGenerating;
      case 'storyboard': 
        // منع التقدم أثناء:
        // - تحسين الـ storyboard (Creating Storyboard)
        // - توليد الصور (Generating Images)
        // - توليد الفيديوهات (Animate All)
        return isStep2Complete && !state.isEnhancingStoryboard && !state.isGeneratingImages && !state.isGenerating;
      case 'audio': 
        // في Audio step، نحتاج فقط اختيار الصوت
        // الـ voiceover سيتم توليده تلقائياً في Export step
        return isStep3Complete;
      case 'export': 
        // لا حاجة لشرط إضافي - الـ voiceover يتم توليده تلقائياً
        return isStep4Ready;
      default: return false;
    }
  }, [isStep1Complete, isStepScriptComplete, isStep2Complete, isStep3Complete, isStep4Ready, state.isGenerating, state.isEnhancingStoryboard, state.isGeneratingImages]);

  return {
    state,
    
    // Transition states
    isTransitioningToExport,
    voiceoverProgress,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // Project
    setProjectName,
    
    // Step 1
    setTopic,
    setGeneratedScript,
    setAspectRatio,
    setDuration,
    setImageMode,
    setVoiceoverEnabled,
    setPacing,
    setTextOverlay,
    setAiPrompt,
    setLanguage,
    setTextOverlayEnabled,
    setTextOverlayStyle,
    setImageModel,
    setImageStyle,
    setStyleReferenceUrl,
    setCharacterReferenceUrl,
    setImageResolution,
    setAnimationMode,
    setVideoModel,
    setVideoResolution,
    generateIdeaStory,
    generateScript,
    
    // Step 2
    setScenes,
    updateScene,
    addScene,
    deleteScene,
    generateScenes,
    generateStoryboardEnhancement,
    generateImages,
    regenerateSceneImage,
    generateVideos,
    regenerateSceneVideo,
    generateVoiceover,
    
    // Step 3
    setSelectedVoice,
    setMusicStyle,
    setBackgroundMusic,
    setCustomMusic,
    clearCustomMusic,
    setVoiceVolume,
    setMusicVolume,
    
    // Step 4
    setExportFormat,
    setExportQuality,
    exportVideo,
    remixVideo,
    
    // Utilities
    reset,
    canProceed,
    isStep1Complete,
    isStep2Complete,
    isStep3Complete,
    isStep4Ready,
  };
}

