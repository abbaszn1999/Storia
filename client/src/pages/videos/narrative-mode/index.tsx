import { useState, useEffect, useRef } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NarrativeWorkflow } from "@/components/narrative-workflow";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import { NarrativeStudioLayout } from "@/components/narrative/studio";
import { useWorkspace } from "@/contexts/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { NarrativeStepId } from "@/components/narrative/studio";
import type { Character, Video } from "@shared/schema";
import type { Scene, Shot, ReferenceImage } from "@/types/storyboard";
import type { NarrativeShotVersion } from "@/types/narrative-storyboard";

export default function NarrativeMode() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Project";
  
  // Fetch existing video data
  const { data: existingVideo, isLoading: isVideoLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${initialVideoId}`],
    enabled: !isNewVideo,
    staleTime: 0,  // Always refetch
    refetchOnMount: true,
  });
  
  // Debug: Log when video data changes
  useEffect(() => {
    const video = existingVideo as any;
    console.log('[NarrativePage] existingVideo changed:', existingVideo?.id, 'narrativeMode:', video?.narrativeMode);
  }, [existingVideo]);
  
  const [videoId, setVideoId] = useState<string>(initialVideoId);
  const [videoTitle, setVideoTitle] = useState<string>(urlTitle);
  const [showModeSelector, setShowModeSelector] = useState(isNewVideo);
  const [creatingMode, setCreatingMode] = useState<"image-reference" | "start-end" | "auto" | null>(null);
  
  // Track if initial restoration has been done to prevent re-running on every refetch
  const hasRestoredRef = useRef(false);
  
  const [activeStep, setActiveStep] = useState<NarrativeStepId>("script");
  const [completedSteps, setCompletedSteps] = useState<NarrativeStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(false);  // Validation state from workflow
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end" | "auto" | null>(null);
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  // Step 1 settings
  const [duration, setDuration] = useState("60");
  const [genres, setGenres] = useState<string[]>(["Adventure"]);
  const [tones, setTones] = useState<string[]>(["Dramatic"]);
  const [language, setLanguage] = useState("English");
  const [userIdea, setUserIdea] = useState("");
  const [numberOfScenes, setNumberOfScenes] = useState<number | 'auto'>('auto');
  const [shotsPerScene, setShotsPerScene] = useState<number | 'auto'>('auto');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: NarrativeShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  // Image and video models (stored in step1Data, not worldSettings)
  const [imageModel, setImageModel] = useState<string | undefined>(undefined);
  const [videoModel, setVideoModel] = useState<string | undefined>(undefined);
  
  const [worldSettings, setWorldSettings] = useState<{ 
    artStyle: string; 
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
    imageInstructions?: string;
    videoInstructions?: string;
    cinematicInspiration?: string;
  }>({
    artStyle: "none",
    worldDescription: "",
    locations: [],
    imageInstructions: "",
    videoInstructions: "",
    cinematicInspiration: "",
  });

  // Restore state from existing video - ONLY run once on initial load
  useEffect(() => {
    if (existingVideo) {
      // Skip navigation restoration if already restored (prevents refetch from navigating away)
      const isInitialRestore = !hasRestoredRef.current;
      
      const video = existingVideo as any;
      console.log('[NarrativePage] Restoring from existingVideo:', {
        id: existingVideo.id,
        title: existingVideo.title,
        narrativeMode: video?.narrativeMode,
        currentStep: existingVideo.currentStep,
        step1Data: existingVideo.step1Data,
        isInitialRestore,
      });
      
      // Always update title and data (safe to update on refetch)
      setVideoTitle(existingVideo.title);
      
      // Restore step1 data (narrativeMode is stored inside step1Data)
      if (existingVideo.step1Data && typeof existingVideo.step1Data === 'object') {
        const step1 = existingVideo.step1Data as { 
          narrativeMode?: string;
          script?: string; 
          aspectRatio?: string;
          scriptModel?: string;
          voiceActorId?: string;
          voiceOverEnabled?: boolean;
          duration?: number;
          genres?: string[];
          tones?: string[];
          language?: string;
          userIdea?: string;
          imageModel?: string;
          videoModel?: string;
        };
        
        // Restore narrative mode from step1Data (primary location) or top-level (fallback)
        const video = existingVideo as any;
        if (step1.narrativeMode) {
          setNarrativeMode(step1.narrativeMode as "image-reference" | "start-end" | "auto");
        } else if (video?.narrativeMode) {
          setNarrativeMode(video.narrativeMode as "image-reference" | "start-end" | "auto");
        }
        
        // Restore all step1 fields
        if (step1.script) setScript(step1.script);
        if (step1.aspectRatio) setAspectRatio(step1.aspectRatio);
        if (step1.scriptModel) setScriptModel(step1.scriptModel);
        if (step1.voiceActorId) setVoiceActorId(step1.voiceActorId);
        if (step1.voiceOverEnabled !== undefined) setVoiceOverEnabled(step1.voiceOverEnabled);
        
        // Restore settings
        if (step1.duration !== undefined) setDuration(String(step1.duration));
        if (step1.genres !== undefined) setGenres(step1.genres);
        if (step1.tones !== undefined) setTones(step1.tones);
        if (step1.language) setLanguage(step1.language);
        if (step1.userIdea) setUserIdea(step1.userIdea);
        
        // Restore imageModel and videoModel from step1Data
        if (step1.imageModel) setImageModel(step1.imageModel);
        if (step1.videoModel) setVideoModel(step1.videoModel);
        
        // imageModel is now stored in step1Data, not worldSettings
        // No need to remove it from worldSettings as it's not part of the type
        
        console.log('[NarrativePage] Restored step1 data:', {
          hasScript: !!step1.script,
          scriptModel: step1.scriptModel,
          aspectRatio: step1.aspectRatio,
          duration: step1.duration,
          genres: step1.genres,
          tones: step1.tones,
          language: step1.language,
          userIdea: step1.userIdea,
        });
      } else {
        // Fallback: try top-level narrativeMode if no step1Data
        const video = existingVideo as any;
        if (video?.narrativeMode) {
          setNarrativeMode(video.narrativeMode as "image-reference" | "start-end" | "auto");
        }
      }
      
      // Step ID mapping (numeric to string)
      const stepMap: { [key: number]: NarrativeStepId } = {
        1: "script",
        2: "world", 
        3: "breakdown",
        4: "storyboard",
        5: "animatic",
        6: "export"
      };
      const allSteps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
      
      // Restore completed steps (convert numeric to string if needed)
      let restoredCompletedSteps: NarrativeStepId[] = [];
      if (existingVideo.completedSteps && Array.isArray(existingVideo.completedSteps)) {
        restoredCompletedSteps = existingVideo.completedSteps.map(s => 
          typeof s === 'number' ? stepMap[s] : s
        ).filter(Boolean) as NarrativeStepId[];
        setCompletedSteps(restoredCompletedSteps);
      }
      
      // Find the first uncompleted step and navigate there
      // This ensures the user continues from where they left off
      // CRITICAL: Only navigate on INITIAL restore, not on refetches after saves
      if (isInitialRestore) {
        const firstUncompletedStep = allSteps.find(step => !restoredCompletedSteps.includes(step));
        
        if (firstUncompletedStep) {
          console.log('[NarrativePage] Navigating to first uncompleted step:', firstUncompletedStep);
          setActiveStep(firstUncompletedStep);
        } else if (existingVideo.currentStep !== null && existingVideo.currentStep !== undefined) {
          // All steps completed - restore to the saved current step
          const step = typeof existingVideo.currentStep === 'number' 
            ? stepMap[existingVideo.currentStep] 
            : existingVideo.currentStep as NarrativeStepId;
          if (step) {
            console.log('[NarrativePage] All steps completed, restoring to:', step);
            setActiveStep(step);
          }
        }
        
        // Mark initial restoration as complete
        hasRestoredRef.current = true;
      }
      
      // Restore step2 data (world settings, characters, locations)
      if (existingVideo.step2Data && typeof existingVideo.step2Data === 'object') {
        const step2 = existingVideo.step2Data as {
          artStyle?: string;
          imageModel?: string;
          worldDescription?: string;
          locations?: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
          imageInstructions?: string;
          videoInstructions?: string;
          cinematicInspiration?: string;
          styleReference?: string[];
          characters?: Character[];
        };
        
        // Restore world settings (imageModel is stored in step1Data, not worldSettings)
        setWorldSettings({
          artStyle: step2.artStyle || "none",
          worldDescription: step2.worldDescription || "",
          locations: step2.locations || [],
          imageInstructions: step2.imageInstructions || "",
          videoInstructions: step2.videoInstructions || "",
          cinematicInspiration: step2.cinematicInspiration || "",
        });

        // Restore characters from step2Data (preferred over step4Data)
        if (step2.characters && Array.isArray(step2.characters)) {
          setCharacters(step2.characters);
        }

        // Restore style reference images from step2Data.styleReference
        if (step2.styleReference && Array.isArray(step2.styleReference) && step2.styleReference.length > 0) {
          const styleRefImages: ReferenceImage[] = step2.styleReference.map((url, index) => ({
            id: `style-ref-${index}-${Date.now()}`,
            videoId: existingVideo.id,
            shotId: null,
            characterId: null,
            type: "style",
            imageUrl: url,
            description: null,
            createdAt: new Date(),
          }));
          
          // Merge with existing reference images (don't overwrite character references)
          setReferenceImages(prev => {
            const nonStyleRefs = prev.filter(r => r.type !== "style");
            return [...nonStyleRefs, ...styleRefImages];
          });
        }
      }
      
      // Restore step3 data (scenes, shots, continuity)
      if (existingVideo.step3Data && typeof existingVideo.step3Data === 'object') {
        const step3 = existingVideo.step3Data as { 
          scenes?: Scene[]; 
          shots?: { [sceneId: string]: Shot[] };
          continuityLocked?: boolean;
          continuityGroups?: { [sceneId: string]: any[] };
        };
        if (step3.scenes) setScenes(step3.scenes);
        if (step3.shots) setShots(step3.shots);
        if (step3.continuityLocked !== undefined) setContinuityLocked(step3.continuityLocked);
        if (step3.continuityGroups) setContinuityGroups(step3.continuityGroups);
      }
      
      // Restore step4 data (shot versions, reference images, prompts - only if not already restored from step2)
      if (existingVideo.step4Data && typeof existingVideo.step4Data === 'object') {
        const step4 = existingVideo.step4Data as { 
          shotVersions?: { [shotId: string]: NarrativeShotVersion[] };
          characters?: Character[];
          referenceImages?: ReferenceImage[];
          prompts?: Record<string, any>;  // Prompts generated by Agent 4.1
        };
        
        // Restore shot versions first
        let restoredShotVersions = step4.shotVersions ? { ...step4.shotVersions } : {};
        
        // Get current shots from step3Data for prompt population
        const step3 = existingVideo.step3Data && typeof existingVideo.step3Data === 'object'
          ? (existingVideo.step3Data as any)
          : null;
        const currentShots = step3?.shots || {};
        const updatedShots = { ...currentShots };
        let shotsUpdated = false;
        
        // If prompts exist, populate them into shot versions
        if (step4.prompts && typeof step4.prompts === 'object') {
          const prompts = step4.prompts as Record<string, {
            imagePrompt?: string;
            startFramePrompt?: string;
            endFramePrompt?: string;
            videoPrompt?: string;
            negativePrompt?: string;
          }>;
          
          // Iterate through all shots and create/update versions with prompts
          Object.entries(currentShots).forEach(([sceneId, sceneShots]: [string, any]) => {
            if (Array.isArray(sceneShots)) {
              sceneShots.forEach((shot: Shot) => {
                const promptData = prompts[shot.id];
                if (promptData) {
                  // Initialize shotVersions for this shot if it doesn't exist
                  if (!restoredShotVersions[shot.id]) {
                    restoredShotVersions[shot.id] = [];
                  }
                  
                  // Check if there's already a version for this shot
                  // First, try to find version by shot.currentVersionId if it exists
                  let version = shot.currentVersionId
                    ? restoredShotVersions[shot.id].find((v: NarrativeShotVersion) => v.id === shot.currentVersionId)
                    : null;
                  
                  // If no version found by currentVersionId, use the latest existing version
                  if (!version && restoredShotVersions[shot.id].length > 0) {
                    // Use the latest version (highest versionNumber or most recent)
                    version = restoredShotVersions[shot.id].reduce((latest, v) => {
                      if (!latest) return v;
                      return (v.versionNumber > latest.versionNumber || 
                              (v.versionNumber === latest.versionNumber && 
                               new Date(v.createdAt).getTime() > new Date(latest.createdAt).getTime()))
                        ? v : latest;
                    });
                  }
                  
                  if (!version) {
                    // Only create a new version if no versions exist at all
                    const newVersionId = `version-${shot.id}-${Date.now()}`;
                    version = {
                      id: newVersionId,
                      shotId: shot.id,
                      versionNumber: 1,
                      imagePrompt: promptData.imagePrompt || null,
                      startFramePrompt: promptData.startFramePrompt || null,
                      endFramePrompt: promptData.endFramePrompt || null,
                      videoPrompt: promptData.videoPrompt || null,
                      negativePrompt: promptData.negativePrompt || null,
                      status: 'pending',
                      needsRerender: false,
                      createdAt: new Date(),
                    };
                    restoredShotVersions[shot.id].push(version);
                    
                    // Update shot to point to this version
                    if (!updatedShots[sceneId]) {
                      updatedShots[sceneId] = [...(currentShots[sceneId] || [])];
                    }
                    const shotIndex = updatedShots[sceneId].findIndex((s: Shot) => s.id === shot.id);
                    if (shotIndex >= 0) {
                      updatedShots[sceneId][shotIndex] = {
                        ...updatedShots[sceneId][shotIndex],
                        currentVersionId: newVersionId,
                      };
                      shotsUpdated = true;
                    }
                  } else {
                    // Ensure shot.currentVersionId points to the existing version
                    if (!shot.currentVersionId || shot.currentVersionId !== version.id) {
                      if (!updatedShots[sceneId]) {
                        updatedShots[sceneId] = [...(currentShots[sceneId] || [])];
                      }
                      const shotIndex = updatedShots[sceneId].findIndex((s: Shot) => s.id === shot.id);
                      if (shotIndex >= 0) {
                        updatedShots[sceneId][shotIndex] = {
                          ...updatedShots[sceneId][shotIndex],
                          currentVersionId: version.id,
                        };
                        shotsUpdated = true;
                      }
                    }
                    // Update existing version with prompts (only if fields are empty)
                    // CRITICAL: Don't overwrite user-edited prompts that are already saved in shotVersions
                    // Only populate from step4.prompts if the version doesn't have that field set
                    const updatedVersion = { ...version };
                    // Only update if the field is truly empty (null, undefined, or empty string)
                    // This preserves user edits that were saved to the database
                    if (!updatedVersion.imagePrompt && promptData.imagePrompt) {
                      updatedVersion.imagePrompt = promptData.imagePrompt;
                    }
                    if (!updatedVersion.startFramePrompt && promptData.startFramePrompt) {
                      updatedVersion.startFramePrompt = promptData.startFramePrompt;
                    }
                    if (!updatedVersion.endFramePrompt && promptData.endFramePrompt) {
                      updatedVersion.endFramePrompt = promptData.endFramePrompt;
                    }
                    if (!updatedVersion.videoPrompt && promptData.videoPrompt) {
                      updatedVersion.videoPrompt = promptData.videoPrompt;
                    }
                    if (!updatedVersion.negativePrompt && promptData.negativePrompt) {
                      updatedVersion.negativePrompt = promptData.negativePrompt;
                    }
                    
                    // Only update if something actually changed (to avoid unnecessary state updates)
                    const hasChanges = 
                      (updatedVersion.imagePrompt !== version.imagePrompt) ||
                      (updatedVersion.startFramePrompt !== version.startFramePrompt) ||
                      (updatedVersion.endFramePrompt !== version.endFramePrompt) ||
                      (updatedVersion.videoPrompt !== version.videoPrompt) ||
                      (updatedVersion.negativePrompt !== version.negativePrompt);
                    
                    if (hasChanges) {
                      // Update the version in the array
                      const versionIndex = restoredShotVersions[shot.id].findIndex((v: NarrativeShotVersion) => v.id === version!.id);
                      if (versionIndex >= 0) {
                        restoredShotVersions[shot.id][versionIndex] = updatedVersion;
                      }
                    }
                  }
                }
              });
            }
          });
        }
        
        // Set the updated shot versions
        setShotVersions(restoredShotVersions);
        
        // Update shots if versions were created
        if (shotsUpdated) {
          setShots(updatedShots);
        }
        
        // Only restore characters from step4Data if not already restored from step2Data
        // Check if step2Data had characters to avoid overwriting
        const step2HadCharacters = existingVideo.step2Data && 
          typeof existingVideo.step2Data === 'object' && 
          (existingVideo.step2Data as any).characters && 
          Array.isArray((existingVideo.step2Data as any).characters);
        
        if (step4.characters && Array.isArray(step4.characters) && !step2HadCharacters) {
          setCharacters(step4.characters);
        }
        
        // Only restore reference images from step4Data if not already restored from step2Data
        // Check if step2Data had styleReference to avoid overwriting
        const step2HadStyleRefs = existingVideo.step2Data && 
          typeof existingVideo.step2Data === 'object' && 
          (existingVideo.step2Data as any).styleReference && 
          Array.isArray((existingVideo.step2Data as any).styleReference);
        
        if (step4.referenceImages && Array.isArray(step4.referenceImages) && !step2HadStyleRefs) {
          setReferenceImages(step4.referenceImages);
        }
      }
    }
  }, [existingVideo]);

  // Save step progress to database
  const saveStepProgress = async (newCurrentStep: NarrativeStepId, newCompletedSteps: NarrativeStepId[]) => {
    if (!videoId || videoId === 'new') {
      console.warn('[NarrativePage] Cannot save step progress - no valid videoId');
      return;
    }

    // Convert step IDs to numbers for storage (1, 2, 3, 4, 5, 6)
    const stepToNumberMap: { [key in NarrativeStepId]: number } = {
      "script": 1,
      "world": 2,
      "breakdown": 3,
      "storyboard": 4,
      "animatic": 5,
      "export": 6
    };

    const currentStepNumber = stepToNumberMap[newCurrentStep];
    const completedStepsNumbers = newCompletedSteps.map(step => stepToNumberMap[step]);

    console.log('[NarrativePage] Saving step progress:', { 
      videoId, 
      currentStep: currentStepNumber, 
      completedSteps: completedStepsNumbers 
    });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentStep: currentStepNumber,
          completedSteps: completedStepsNumbers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[NarrativePage] Step progress save failed:', errorData);
      } else {
        console.log('[NarrativePage] Step progress saved successfully');
      }
    } catch (error) {
      console.error('[NarrativePage] Step progress save error:', error);
    }
  };

  // Save Step 1 data to database
  const saveStep1Data = async (step1Data: {
    script: string;
    duration?: number;
    genres?: string[];
    tones?: string[];
    language?: string;
    aspectRatio?: string;
    scriptModel?: string;
    imageModel?: string;
    videoModel?: string;
    userIdea?: string;
    numberOfScenes?: number | 'auto';
    shotsPerScene?: number | 'auto';
    narrationStyle?: "third-person" | "first-person";
  }) => {
    if (!videoId || videoId === 'new') {
      console.warn('[NarrativePage] Cannot save step1 data - no valid videoId');
      return;
    }

    console.log('[NarrativePage] Saving step1 data:', {
      videoId,
      hasScript: !!step1Data.script && step1Data.script.length > 0,
      duration: step1Data.duration,
      genresCount: step1Data.genres?.length || 0,
      tonesCount: step1Data.tones?.length || 0,
    });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(step1Data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[NarrativePage] Step1 data save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save step1 data');
      }

      const result = await response.json();
      console.log('[NarrativePage] Step1 data saved successfully');
      return result;
    } catch (error) {
      console.error('[NarrativePage] Step1 data save error:', error);
      throw error;
    }
  };

  // Save Step 2 data to database
  const saveStep2Data = async (step2Data: {
    imageModel: string;
    artStyle: string;
    styleReference?: string[];
    cinematicInspiration?: string;
    worldDescription: string;
    imageInstructions: string;
    videoInstructions: string;
    characters: Character[];
    locations: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
  }) => {
    if (!videoId || videoId === 'new') {
      console.warn('[NarrativePage] Cannot save step2 data - no valid videoId');
      return;
    }

    console.log('[NarrativePage] Saving step2 data:', {
      videoId,
      imageModel: step2Data.imageModel,
      artStyle: step2Data.artStyle,
      hasStyleReference: !!step2Data.styleReference && step2Data.styleReference.length > 0,
      charactersCount: step2Data.characters.length,
      locationsCount: step2Data.locations.length,
    });

    try {
      const response = await fetch(`/api/narrative/videos/${videoId}/step2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(step2Data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[NarrativePage] Step2 data save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save step2 data');
      }

      const result = await response.json();
      console.log('[NarrativePage] Step2 data saved successfully');
      return result;
    } catch (error) {
      console.error('[NarrativePage] Step2 data save error:', error);
      throw error;
    }
  };

  const handleStepClick = (step: NarrativeStepId) => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const newIndex = steps.indexOf(step);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveStep(step);
    
    // Save current step to database (without marking as completed)
    saveStepProgress(step, completedSteps);
  };

  const handleNext = async () => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < steps.length) {
      // If we're on the "script" step, save Step1Data before proceeding
      if (activeStep === "script") {
        try {
          // Build complete Step1Data object
          const step1Data = {
            script: script,
            duration: parseInt(duration),
            genres: genres,
            tones: tones,
            language: language,
            aspectRatio: aspectRatio,
            scriptModel: scriptModel,
            imageModel: imageModel,
            videoModel: videoModel,
            userIdea: userIdea,
            numberOfScenes: numberOfScenes,
            shotsPerScene: shotsPerScene,
            // narrativeMode is stored separately in video metadata, not in step1Data
          };

          // Save Step1Data before proceeding
          await saveStep1Data(step1Data);
        } catch (error) {
          toast({
            title: "Save Failed",
            description: error instanceof Error ? error.message : "Failed to save script settings. Please try again.",
            variant: "destructive",
          });
          // Don't proceed to next step if save failed
          return;
        }
      }

      // If we're on the "world" step, save Step2Data before proceeding
      if (activeStep === "world") {
        try {
          // Collect style reference URLs (filter by type === "style")
          const styleRefs = referenceImages.filter(r => r.type === "style");
          const styleReference = styleRefs.map(r => r.imageUrl);

          // Build complete Step2Data object
          // Note: imageModel is stored in step1Data, not step2Data
          const step2Data = {
            imageModel: imageModel || "flux-2-dev", // Use imageModel from step1Data state
            artStyle: worldSettings.artStyle || "none",
            styleReference: styleReference.length > 0 ? styleReference : undefined,
            cinematicInspiration: worldSettings.cinematicInspiration || undefined,
            worldDescription: worldSettings.worldDescription || "",
            imageInstructions: worldSettings.imageInstructions || "",
            videoInstructions: worldSettings.videoInstructions || "",
            characters: characters,
            locations: worldSettings.locations || [],
          };

          // Save Step2Data before proceeding
          await saveStep2Data(step2Data);
        } catch (error) {
          toast({
            title: "Save Failed",
            description: error instanceof Error ? error.message : "Failed to save world settings. Please try again.",
            variant: "destructive",
          });
          // Don't proceed to next step if save failed
          return;
        }
      }

      // If we're on the "breakdown" step, navigate immediately and generate prompts in background
      // ONLY if step4Data.prompts is empty/blank (similar to breakdown generation)
      if (activeStep === "breakdown") {
        // Check if prompts already exist in step4Data
        let existingPrompts: Record<string, any> | null = null;
        try {
          const existingVideoResponse = await fetch(`/api/videos/${videoId}`, {
            credentials: 'include',
          });
          if (existingVideoResponse.ok) {
            const existingVideo = await existingVideoResponse.json();
            existingPrompts = existingVideo?.step4Data?.prompts;
          }
        } catch (error) {
          console.warn('[NarrativePage] Could not check existing prompts:', error);
        }
        
        const hasPrompts = existingPrompts && typeof existingPrompts === 'object' && Object.keys(existingPrompts).length > 0;
        
        // Only generate if prompts don't exist
        if (!hasPrompts) {
          // Prevent multiple simultaneous calls
          if (isGeneratingPrompts) {
            return;
          }
          
          // Collect all shots from all scenes (get full Shot objects)
          const allShots: Shot[] = [];
          Object.entries(shots).forEach(([sceneId, sceneShots]) => {
            sceneShots.forEach((shot: Shot) => {
              allShots.push(shot);
            });
          });

          if (allShots.length === 0) {
            toast({
              title: "No Shots",
              description: "Please create at least one shot before continuing.",
              variant: "destructive",
            });
            return;
          }

          // Group shots by sceneId (using full Shot objects)
          const shotsByScene = new Map<string, Shot[]>();
          allShots.forEach(shot => {
            if (!shotsByScene.has(shot.sceneId)) {
              shotsByScene.set(shot.sceneId, []);
            }
            shotsByScene.get(shot.sceneId)!.push(shot);
          });

          // Start prompt generation in background (don't await)
          setIsGeneratingPrompts(true);
          
          // Generate prompts asynchronously (fire and forget)
          (async () => {
            try {

            // Generate prompts for all scenes in parallel (batch mode - one API call per scene)
            const prompts: Record<string, any> = {};
            const newShotVersions: { [shotId: string]: NarrativeShotVersion[] } = { ...shotVersions };
            
            // Create API calls for each scene
            const scenePromises = Array.from(shotsByScene.entries()).map(async ([sceneId, sceneShots]) => {
              try {
                const response = await fetch('/api/narrative/prompts/generate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-workspace-id': workspaceId || '',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    sceneId: sceneId,
                    videoId: videoId,
                    model: scriptModel,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                  console.error(`[NarrativePage] Prompt generation failed for scene ${sceneId}:`, errorData);
                  return { sceneId, success: false, error: errorData, prompts: [] };
                }

                // Response is now an array of prompts (one per shot in scene)
                const promptArray = await response.json();
                return { sceneId, success: true, prompts: promptArray };
              } catch (error) {
                console.error(`[NarrativePage] Prompt generation error for scene ${sceneId}:`, error);
                return { sceneId, success: false, error, prompts: [] };
              }
            });

            // Wait for all scene requests to complete
            const sceneResults = await Promise.all(scenePromises);
            
            // Process results and update state
            const updatedShots = { ...shots };
            let successCount = 0;
            let errorCount = 0;

            // Create a map of shotId to shot for quick lookup
            const shotMap = new Map<string, Shot>();
            allShots.forEach(shot => shotMap.set(shot.id, shot));

            for (const sceneResult of sceneResults) {
              if (sceneResult.success && Array.isArray(sceneResult.prompts)) {
                // Process each prompt in the array
                for (const promptData of sceneResult.prompts) {
                  // Find the shot by shotNumber and sceneId
                  const sceneShots = shotsByScene.get(sceneResult.sceneId) || [];
                  const shot: Shot | undefined = sceneShots.find(s => s.shotNumber === promptData.shotNumber);
                  
                  if (!shot) {
                    console.warn(`[NarrativePage] Could not find shot for prompt with shotNumber ${promptData.shotNumber} in scene ${sceneResult.sceneId}`);
                    errorCount++;
                    continue;
                  }

                  const shotId = shot.id;
                  prompts[shotId] = promptData;
                  
                  // Create or update shot version with prompts
                  if (!newShotVersions[shotId]) {
                    newShotVersions[shotId] = [];
                  }
                  
                  // Check if shot already has a version
                  const existingShot = shotMap.get(shotId);
                  let version = existingShot?.currentVersionId
                    ? newShotVersions[shotId].find((v: NarrativeShotVersion) => v.id === existingShot.currentVersionId)
                    : null;
                  
                  if (!version) {
                    // Create new version with prompts
                    const newVersionId = `version-${shotId}-${Date.now()}`;
                    version = {
                      id: newVersionId,
                      shotId: shotId,
                      versionNumber: 1,
                      imagePrompt: promptData.imagePrompt || null,
                      startFramePrompt: promptData.startFramePrompt || null,
                      endFramePrompt: promptData.endFramePrompt || null,
                      videoPrompt: promptData.videoPrompt || null,
                      negativePrompt: promptData.negativePrompt || null,
                      status: 'pending',
                      needsRerender: false,
                      createdAt: new Date(),
                    };
                    newShotVersions[shotId].push(version);
                    
                    // Update shot to point to this version
                    const shotSceneId: string = shot.sceneId;
                    if (updatedShots[shotSceneId]) {
                      const shotIndex = updatedShots[shotSceneId].findIndex((s: Shot) => s.id === shotId);
                      if (shotIndex >= 0) {
                        updatedShots[shotSceneId][shotIndex] = {
                          ...updatedShots[shotSceneId][shotIndex],
                          currentVersionId: newVersionId,
                        };
                      }
                    }
                  } else {
                    // Update existing version with prompts (only if fields are empty)
                    const updatedVersion = { ...version };
                    if (!updatedVersion.imagePrompt && promptData.imagePrompt) {
                      updatedVersion.imagePrompt = promptData.imagePrompt;
                    }
                    if (!updatedVersion.startFramePrompt && promptData.startFramePrompt) {
                      updatedVersion.startFramePrompt = promptData.startFramePrompt;
                    }
                    if (!updatedVersion.endFramePrompt && promptData.endFramePrompt) {
                      updatedVersion.endFramePrompt = promptData.endFramePrompt;
                    }
                    if (!updatedVersion.videoPrompt && promptData.videoPrompt) {
                      updatedVersion.videoPrompt = promptData.videoPrompt;
                    }
                    if (!updatedVersion.negativePrompt && promptData.negativePrompt) {
                      updatedVersion.negativePrompt = promptData.negativePrompt;
                    }
                    
                    const versionIndex = newShotVersions[shotId].findIndex((v: NarrativeShotVersion) => v.id === version!.id);
                    if (versionIndex >= 0) {
                      newShotVersions[shotId][versionIndex] = updatedVersion;
                    }
                  }
                  
                  successCount++;
                }
              } else {
                // Count all shots in failed scene as errors
                const sceneShots = shotsByScene.get(sceneResult.sceneId) || [];
                errorCount += sceneShots.length;
              }
            }

            // Update state once (outside the loop)
            setShotVersions(newShotVersions);
            if (Object.keys(updatedShots).length > 0) {
              setShots(updatedShots);
            }

            if (errorCount > 0) {
              toast({
                title: "Partial Success",
                description: `Generated prompts for ${successCount} shot${successCount !== 1 ? 's' : ''}, ${errorCount} failed.`,
                variant: errorCount === allShots.length ? "destructive" : "default",
              });
              
              // If all failed, stop loading
              if (errorCount === allShots.length) {
                setIsGeneratingPrompts(false);
                return;
              }
            } else {
              toast({
                title: "Success",
                description: `Generated prompts for all ${successCount} shot${successCount !== 1 ? 's' : ''}.`,
              });
            }

            // Store prompts and shot versions in step4Data
            const step4Data = {
              prompts,
              shotVersions: newShotVersions,
              generatedAt: new Date().toISOString(),
            };

            // Save step4Data to database
            const saveResponse = await fetch(`/api/narrative/videos/${videoId}/step4`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'x-workspace-id': workspaceId || '',
              },
              credentials: 'include',
              body: JSON.stringify(step4Data),
            });

            if (!saveResponse.ok) {
              const errorData = await saveResponse.json().catch(() => ({ error: 'Unknown error' }));
              console.error('[NarrativePage] Step4 data save failed:', errorData);
              throw new Error(errorData.error || 'Failed to save prompts');
            }

            console.log('[NarrativePage] Prompts generated and saved successfully');
            } catch (error) {
              toast({
                title: "Prompt Generation Failed",
                description: error instanceof Error ? error.message : "Failed to generate prompts. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsGeneratingPrompts(false);
            }
          })();
          
          // Navigate immediately without waiting for prompts
          // The storyboard will show a loading overlay while prompts are being generated
        }
        // If prompts already exist, skip generation and proceed directly
      }

      // Mark current step as completed
      const newCompletedSteps = completedSteps.includes(activeStep) 
        ? completedSteps 
        : [...completedSteps, activeStep];
      
      const nextStep = steps[nextIndex];
      
      // Update local state
      setCompletedSteps(newCompletedSteps);
      setDirection(1);
      setActiveStep(nextStep);
      
      // Save to database
      await saveStepProgress(nextStep, newCompletedSteps);
    }
  };

  const handleBack = () => {
    const steps: NarrativeStepId[] = ["script", "world", "breakdown", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex];
      setDirection(-1);
      setActiveStep(prevStep);
      
      // Save current step to database (don't modify completed steps when going back)
      saveStepProgress(prevStep, completedSteps);
    }
  };

  const handleModeSelect = async (mode: "image-reference" | "start-end" | "auto") => {
    if (!workspaceId) {
      toast({
        title: "Error",
        description: "No workspace selected. Please select a workspace first.",
        variant: "destructive",
      });
      return;
    }
    
    setCreatingMode(mode);
    
    try {
      // Create video in database
      const response = await fetch('/api/narrative/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workspaceId,
          title: videoTitle,
          mode: 'narrative',
          narrativeMode: mode,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create video');
      }
      
      const video = await response.json();
      
      // Update state with new video ID
      setVideoId(video.id);
      setNarrativeMode(mode);
      
      // Update URL with new video ID (without page reload)
      window.history.replaceState(
        {},
        '',
        `/videos/narrative/${video.id}?workspace=${workspaceId}`
      );
      
      setShowModeSelector(false);
    } catch (error) {
      console.error('Failed to create video:', error);
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingMode(null);
    }
  };

  // Show loading while workspace or video is being loaded
  if (isWorkspaceLoading || (!isNewVideo && isVideoLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error if no workspace
  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-red-500">No workspace selected</p>
          <p className="text-muted-foreground mt-2">Please select a workspace first.</p>
        </div>
      </div>
    );
  }

  // Show mode selector only for new videos that haven't selected a mode yet
  if (showModeSelector) {
    return (
      <NarrativeModeSelector 
        onSelectMode={handleModeSelect}
        onBack={() => window.history.back()}
        creatingMode={creatingMode}
      />
    );
  }

  // For existing videos, wait until narrativeMode is restored from the database
  // This handles the timing gap between video loading and useEffect running
  if (!narrativeMode) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <NarrativeStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={!canContinue || isGeneratingPrompts}
      nextLabel={isGeneratingPrompts ? "Generating..." : undefined}
    >
      <NarrativeWorkflow 
        activeStep={activeStep}
        videoId={videoId}
        workspaceId={workspaceId}
        narrativeMode={narrativeMode}
        script={script}
        isGeneratingPrompts={isGeneratingPrompts}
        aspectRatio={aspectRatio}
        scriptModel={scriptModel}
        voiceActorId={voiceActorId}
        voiceOverEnabled={voiceOverEnabled}
        duration={duration}
        genres={genres}
        tones={tones}
        language={language}
        userIdea={userIdea}
        numberOfScenes={numberOfScenes}
        shotsPerScene={shotsPerScene}
        imageModel={imageModel}
        videoModel={videoModel}
        scenes={scenes}
        shots={shots}
        shotVersions={shotVersions}
        characters={characters}
        referenceImages={referenceImages}
        continuityLocked={continuityLocked}
        continuityGroups={continuityGroups}
        worldSettings={worldSettings}
        onScriptChange={setScript}
        onAspectRatioChange={setAspectRatio}
        onScriptModelChange={setScriptModel}
        onVoiceActorChange={setVoiceActorId}
        onVoiceOverToggle={setVoiceOverEnabled}
        onNumberOfScenesChange={setNumberOfScenes}
        onShotsPerSceneChange={setShotsPerScene}
        onGenresChange={setGenres}
        onTonesChange={setTones}
        onDurationChange={setDuration}
        onLanguageChange={setLanguage}
        onUserIdeaChange={setUserIdea}
        onScenesChange={setScenes}
        onShotsChange={setShots}
        onShotVersionsChange={setShotVersions}
        onCharactersChange={setCharacters}
        onReferenceImagesChange={setReferenceImages}
        onContinuityLockedChange={setContinuityLocked}
        onContinuityGroupsChange={setContinuityGroups}
        onWorldSettingsChange={setWorldSettings}
        onValidationChange={setCanContinue}
        onNext={handleNext}
      />
    </NarrativeStudioLayout>
  );
}
