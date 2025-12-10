// useStoryStudio - Main state management hook
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from "react";
import { StepId, STEPS, StoryStudioState, StoryScene, StoryTemplate } from "../types";
import { apiRequest } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

const STORAGE_KEY = "storia-studio-state";

const createInitialState = (template: StoryTemplate | null): StoryStudioState => ({
  template,
  currentStep: 'concept',
  completedSteps: [],
  direction: 1,
  
  // Step 1
  topic: '',
  generatedScript: '',
  aspectRatio: '9:16',
  duration: 30,
  imageMode: 'none',
  voiceoverEnabled: true,
  
  // Step 2
  scenes: [],
  
  // Step 3
  selectedVoice: 'alloy',
  backgroundMusic: 'none',
  voiceVolume: 80,
  musicVolume: 30,
  
  // Step 4
  exportFormat: 'mp4',
  exportQuality: '1080p',
  
  // UI
  isGenerating: false,
  generationProgress: 0,
  error: null,
});

export function useStoryStudio(template: StoryTemplate | null) {
  const [state, setState] = useState<StoryStudioState>(() => {
    // Try to restore from localStorage
    if (template) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${template.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...createInitialState(template), ...parsed, template };
        } catch {
          // Ignore parse errors
        }
      }
    }
    return createInitialState(template);
  });

  // Persist to localStorage
  useEffect(() => {
    if (template) {
      localStorage.setItem(`${STORAGE_KEY}-${template.id}`, JSON.stringify(state));
    }
  }, [state, template]);

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

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === state.currentStep);
    if (currentIndex < STEPS.length - 1) {
      const nextStepId = STEPS[currentIndex + 1].id;
      setState(prev => ({
        ...prev,
        currentStep: nextStepId,
        direction: 1,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
      }));
    }
  }, [state.currentStep]);

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

  const setImageMode = useCallback((imageMode: 'none' | 'transition' | 'image' | 'image-to-video') => {
    setState(prev => ({ ...prev, imageMode }));
  }, []);

  const setVoiceoverEnabled = useCallback((voiceoverEnabled: boolean) => {
    setState(prev => ({ ...prev, voiceoverEnabled }));
  }, []);

  // Idea agent: generate story text and write to topic field
  const generateIdeaStory = useCallback(async () => {
    if (!state.topic.trim()) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const res = await apiRequest("POST", "/api/problem-solution/idea", {
        ideaText: state.topic,
        durationSeconds: state.duration,
        aspectRatio: state.aspectRatio,
      });
      const data = await res.json();

      // Simply use the story text directly
      const story = data?.story || state.topic;

      // Write result to topic field (same field)
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
  }, [state.topic, state.duration, state.aspectRatio]);

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
      const res = await apiRequest("POST", "/api/problem-solution/scenes", {
        storyText: state.topic,
        duration: state.duration,
        aspectRatio: state.aspectRatio,
        voiceoverEnabled: state.voiceoverEnabled,
        imageMode: state.imageMode,
      });
      
      const data = await res.json();
      
      // Map backend scenes to frontend StoryScene format
      const generatedScenes: StoryScene[] = data.scenes.map((s: any) => ({
        id: `scene-${s.sceneNumber}`,
        sceneNumber: s.sceneNumber,
        narration: s.narration,
        visualPrompt: s.visualDescription,
        isAnimated: true,
        transition: s.sceneNumber === 1 ? 'fade' : 'slide',
        duration: s.duration,
        voiceoverEnabled: state.voiceoverEnabled,
      }));
      
      setState(prev => ({ 
        ...prev, 
        scenes: generatedScenes,
        isGenerating: false 
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

  const generateScenes = useCallback(async () => {
    if (!state.topic.trim()) return;
    
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const res = await apiRequest("POST", "/api/problem-solution/scenes", {
        storyText: state.topic,
        duration: state.duration,
        aspectRatio: state.aspectRatio,
        voiceoverEnabled: state.voiceoverEnabled,
        imageMode: state.imageMode,
      });
      
      const data = await res.json();
      
      // Map backend scenes to frontend StoryScene format
      const generatedScenes: StoryScene[] = data.scenes.map((s: any) => ({
        id: `scene-${s.sceneNumber}`,
        sceneNumber: s.sceneNumber,
        narration: s.narration,
        visualPrompt: s.visualDescription,
        isAnimated: true,
        transition: s.sceneNumber === 1 ? 'fade' : 'slide',
        duration: s.duration,
        voiceoverEnabled: state.voiceoverEnabled,
      }));
      
      setState(prev => ({ 
        ...prev, 
        scenes: generatedScenes,
        isGenerating: false 
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

  // Step 3: Audio
  const setSelectedVoice = useCallback((selectedVoice: string) => {
    setState(prev => ({ ...prev, selectedVoice }));
  }, []);

  const setBackgroundMusic = useCallback((backgroundMusic: string) => {
    setState(prev => ({ ...prev, backgroundMusic }));
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
    setState(prev => ({ ...prev, isGenerating: true, generationProgress: 0, error: null }));
    
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setState(prev => ({ ...prev, generationProgress: i }));
      }
      
      setState(prev => ({ ...prev, isGenerating: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to export video',
        isGenerating: false 
      }));
    }
  }, []);

  // Reset
  const reset = useCallback(() => {
    setState(createInitialState(template));
    if (template) {
      localStorage.removeItem(`${STORAGE_KEY}-${template.id}`);
    }
  }, [template]);

  // Completion check helpers
  const isStep1Complete = state.topic.trim().length > 0;
  const isStepScriptComplete = state.topic.trim().length > 0;
  const isStep2Complete = state.scenes.length > 0;
  const isStep3Complete = state.selectedVoice.length > 0;
  const isStep4Ready = isStep1Complete && isStepScriptComplete && isStep2Complete && isStep3Complete;

  const canProceed = useCallback((step: StepId): boolean => {
    switch (step) {
      case 'concept': return isStep1Complete;
      case 'script': return isStepScriptComplete;
      case 'storyboard': return isStep2Complete;
      case 'audio': return isStep3Complete;
      case 'export': return isStep4Ready;
      default: return false;
    }
  }, [isStep1Complete, isStepScriptComplete, isStep2Complete, isStep3Complete, isStep4Ready]);

  return {
    state,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // Step 1
    setTopic,
    setGeneratedScript,
    setAspectRatio,
    setDuration,
    setImageMode,
    setVoiceoverEnabled,
    generateIdeaStory,
    generateScript,
    
    // Step 2
    setScenes,
    updateScene,
    generateScenes,
    
    // Step 3
    setSelectedVoice,
    setBackgroundMusic,
    setVoiceVolume,
    setMusicVolume,
    
    // Step 4
    setExportFormat,
    setExportQuality,
    exportVideo,
    
    // Utilities
    reset,
    canProceed,
    isStep1Complete,
    isStep2Complete,
    isStep3Complete,
    isStep4Ready,
  };
}

