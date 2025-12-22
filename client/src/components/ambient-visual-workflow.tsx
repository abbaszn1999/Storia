import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { AtmosphereTab } from "./ambient/atmosphere-tab";
import { VisualWorldTab, type TempReferenceImage } from "./ambient/visual-world-tab";
import { FlowDesignTab } from "./ambient/flow-design-tab";
import { StoryboardEditor } from "./ambient/storyboard-editor";
import { PreviewTab } from "./ambient/preview-tab";
import { ExportTab } from "./ambient/export-tab";
import { getDefaultVideoModel } from "@/constants/video-models";
import { useToast } from "@/hooks/use-toast";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ContinuityGroup, ReferenceImage } from "@/types/storyboard";

export interface AmbientVisualWorkflowRef {
  saveCurrentStep: () => Promise<boolean>;
  isSaving: boolean;
  canContinue: boolean;  // Whether current step has valid data to continue
}

interface AmbientVisualWorkflowProps {
  activeStep: number;
  onStepChange: (step: number) => void;
  onSaveStateChange?: (isSaving: boolean) => void;
  onValidationChange?: (canContinue: boolean) => void;  // Called when validation state changes
  projectName: string;
  videoId?: string;
  initialAnimationMode?: 'image-transitions' | 'video-animation';
  initialVideoGenerationMode?: 'image-reference' | 'start-end-frame';
  initialStep1Data?: Record<string, unknown>;  // Saved step1 data from database
  initialStep2Data?: Record<string, unknown>;  // Saved step2 data from database
}

export const AmbientVisualWorkflow = forwardRef<AmbientVisualWorkflowRef, AmbientVisualWorkflowProps>(({
  activeStep,
  onStepChange,
  onSaveStateChange,
  onValidationChange,
  projectName,
  videoId,
  initialAnimationMode = 'image-transitions',
  initialVideoGenerationMode,
  initialStep1Data,
  initialStep2Data,
}, ref) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  // Track the videoId that was used to initialize, to detect when we need to re-initialize
  const [initializedForVideoId, setInitializedForVideoId] = useState<string | null>(null);
  const [step2Initialized, setStep2Initialized] = useState(false);
  // Flag to trigger auto-generation in Flow Design when coming from Step 2
  const [shouldAutoGenerateFlow, setShouldAutoGenerateFlow] = useState(false);
  
  // Atmosphere State
  const [mood, setMood] = useState("calm");
  const [theme, setTheme] = useState("nature");
  const [timeContext, setTimeContext] = useState("sunset");
  const [season, setSeason] = useState("neutral");
  const [intensity, setIntensity] = useState(50);
  const [duration, setDuration] = useState("5min");
  const [userStory, setUserStory] = useState("");      // User's original story/prompt
  const [moodDescription, setMoodDescription] = useState(""); // AI-generated description
  
  // Track settings when description was created - to detect if settings changed after
  const [descriptionSettingsSnapshot, setDescriptionSettingsSnapshot] = useState<{
    mood: string;
    theme: string;
    timeContext: string;
    season: string;
    duration: string;
  } | null>(null);
  const [imageModel, setImageModel] = useState("nano-banana");
  const [imageResolution, setImageResolution] = useState("auto");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(false);
  const [textOverlayStyle, setTextOverlayStyle] = useState<'modern' | 'cinematic' | 'bold'>('modern');
  const [animationMode, setAnimationMode] = useState<'image-transitions' | 'video-animation'>(initialAnimationMode);
  const [videoGenerationMode, setVideoGenerationMode] = useState<'image-reference' | 'start-end-frame' | undefined>(initialVideoGenerationMode);
  
  // Image Transitions state (global default)
  const [defaultEasingStyle, setDefaultEasingStyle] = useState("smooth");
  // Video Animation state (global settings)
  const defaultVideoModel = getDefaultVideoModel();
  const [videoModel, setVideoModel] = useState(defaultVideoModel.value);
  const [videoResolution, setVideoResolution] = useState(defaultVideoModel.resolutions[0] || "720p");
  const [motionPrompt, setMotionPrompt] = useState("");
  
  // Pacing & Loop Settings (moved from Flow Design to Atmosphere)
  const [pacing, setPacing] = useState(30);
  
  // Segment Settings
  const [segmentEnabled, setSegmentEnabled] = useState(true);
  const [segmentCount, setSegmentCount] = useState<'auto' | number>('auto');
  const [shotsPerSegment, setShotsPerSegment] = useState<'auto' | number>('auto');
  
  // Loop Settings
  const [loopMode, setLoopMode] = useState(true);
  const [loopType, setLoopType] = useState<'seamless' | 'fade' | 'hard-cut'>('seamless');
  const [segmentLoopEnabled, setSegmentLoopEnabled] = useState(false);
  const [segmentLoopCount, setSegmentLoopCount] = useState<'auto' | number>('auto');
  const [shotLoopEnabled, setShotLoopEnabled] = useState(false);
  const [shotLoopCount, setShotLoopCount] = useState<'auto' | number>('auto');
  
  // Visual World State
  const [artStyle, setArtStyle] = useState("cinematic");
  const [visualElements, setVisualElements] = useState<string[]>([]);
  // Reference images with temp IDs (for upload tracking before permanent save)
  const [referenceImages, setReferenceImages] = useState<TempReferenceImage[]>([]);
  const [imageCustomInstructions, setImageCustomInstructions] = useState("");
  
  // Debug: Log artStyle changes
  useEffect(() => {
    console.log('[AmbientWorkflow] artStyle changed to:', artStyle);
  }, [artStyle]);

  // Flow Design State
  const [transitionStyle, setTransitionStyle] = useState("auto");
  const [cameraMotion, setCameraMotion] = useState("auto");
  const [visualRhythm, setVisualRhythm] = useState("breathing");
  
  // Scene/Shot State for Flow Design and Composition
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: ContinuityGroup[] }>({});
  
  // Composition State (StoryboardEditor)
  const [shotReferenceImages, setShotReferenceImages] = useState<ReferenceImage[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);

  // Restore state from saved step1Data when video is reopened
  useEffect(() => {
    // Only restore if we have data and videoId, and haven't initialized for this video yet
    if (!initialStep1Data || !videoId) {
      console.log('[AmbientWorkflow] Waiting for data - initialStep1Data:', !!initialStep1Data, 'videoId:', videoId);
      return;
    }
    
    // Skip if already initialized for this video
    if (initializedForVideoId === videoId) {
      console.log('[AmbientWorkflow] Already initialized for video:', videoId);
      return;
    }
    
    const data = initialStep1Data;
    console.log('[AmbientWorkflow] Restoring state for video:', videoId, 'data:', data);
    
    // Restore Atmosphere settings
    if (data.mood) setMood(data.mood as string);
    if (data.theme) setTheme(data.theme as string);
    if (data.timeContext) setTimeContext(data.timeContext as string);
    if (data.season) setSeason(data.season as string);
    if (data.duration) setDuration(data.duration as string);
    if (data.userStory) setUserStory(data.userStory as string);
    if (data.moodDescription) {
      setMoodDescription(data.moodDescription as string);
      // Restore the settings snapshot to match saved settings
      // (assumes description was created with these settings)
      setDescriptionSettingsSnapshot({
        mood: (data.mood as string) || 'calm',
        theme: (data.theme as string) || 'nature',
        timeContext: (data.timeContext as string) || 'sunset',
        season: (data.season as string) || 'neutral',
        duration: (data.duration as string) || '5min',
      });
    }
    
    // Restore Image settings
    if (data.imageModel) setImageModel(data.imageModel as string);
    if (data.imageResolution) setImageResolution(data.imageResolution as string);
    if (data.aspectRatio) setAspectRatio(data.aspectRatio as string);
    
    // Restore Animation settings
    if (data.animationMode) setAnimationMode(data.animationMode as 'image-transitions' | 'video-animation');
    if (data.videoGenerationMode) setVideoGenerationMode(data.videoGenerationMode as 'image-reference' | 'start-end-frame');
    if (data.defaultEasingStyle) setDefaultEasingStyle(data.defaultEasingStyle as string);
    if (data.videoModel) setVideoModel(data.videoModel as string);
    if (data.videoResolution) setVideoResolution(data.videoResolution as string);
    if (data.motionPrompt) setMotionPrompt(data.motionPrompt as string);
    
    // Restore Pacing & Flow settings
    if (data.pacing !== undefined) setPacing(data.pacing as number);
    if (data.segmentEnabled !== undefined) setSegmentEnabled(data.segmentEnabled as boolean);
    if (data.segmentCount !== undefined) setSegmentCount(data.segmentCount as 'auto' | number);
    if (data.shotsPerSegment !== undefined) setShotsPerSegment(data.shotsPerSegment as 'auto' | number);
    
    // Restore Loop settings
    if (data.loopMode !== undefined) setLoopMode(data.loopMode as boolean);
    if (data.loopType) setLoopType(data.loopType as 'seamless' | 'fade' | 'hard-cut');
    if (data.segmentLoopEnabled !== undefined) setSegmentLoopEnabled(data.segmentLoopEnabled as boolean);
    if (data.segmentLoopCount !== undefined) setSegmentLoopCount(data.segmentLoopCount as 'auto' | number);
    if (data.shotLoopEnabled !== undefined) setShotLoopEnabled(data.shotLoopEnabled as boolean);
    if (data.shotLoopCount !== undefined) setShotLoopCount(data.shotLoopCount as 'auto' | number);
    
    // Restore Voiceover settings
    if (data.voiceoverEnabled !== undefined) setVoiceoverEnabled(data.voiceoverEnabled as boolean);
    if (data.language) setLanguage(data.language as 'ar' | 'en');
    if (data.textOverlayEnabled !== undefined) setTextOverlayEnabled(data.textOverlayEnabled as boolean);
    if (data.textOverlayStyle) setTextOverlayStyle(data.textOverlayStyle as 'modern' | 'cinematic' | 'bold');
    
    // Restore transition/camera settings
    if (data.transitionStyle) setTransitionStyle(data.transitionStyle as string);
    if (data.cameraMotion) setCameraMotion(data.cameraMotion as string);
    
    setInitializedForVideoId(videoId);
    setStep2Initialized(false); // Reset step2 flag when video changes
    console.log('[AmbientWorkflow] State restored successfully for video:', videoId);
  }, [initialStep1Data, videoId, initializedForVideoId]);

  // Restore Step 2 (Visual World) data when video is reopened
  useEffect(() => {
    if (!initialStep2Data || !videoId) {
      console.log('[AmbientWorkflow] Waiting for step2 data - initialStep2Data:', !!initialStep2Data, 'videoId:', videoId);
      return;
    }
    
    if (initializedForVideoId !== videoId) {
      console.log('[AmbientWorkflow] Waiting for step1 to initialize before step2');
      return; // Wait for step1 to initialize first
    }
    
    if (step2Initialized) {
      console.log('[AmbientWorkflow] Step2 already initialized');
      return;
    }
    
    const data = initialStep2Data;
    console.log('[AmbientWorkflow] Restoring step2 data:', data);
    
    // Restore Visual World settings
    if (data.artStyle) {
      console.log('[AmbientWorkflow] Setting artStyle to:', data.artStyle);
      setArtStyle(data.artStyle as string);
    }
    if (data.visualElements) setVisualElements(data.visualElements as string[]);
    if (data.visualRhythm) setVisualRhythm(data.visualRhythm as string);
    
    // Handle referenceImages - these are CDN URLs from database (already saved)
    // Convert them to TempReferenceImage format for display
    // Note: These are already permanent URLs, not temp uploads
    if (data.referenceImages && Array.isArray(data.referenceImages)) {
      const cdnUrls = data.referenceImages as string[];
      const restoredImages: TempReferenceImage[] = cdnUrls.map((url, index) => ({
        tempId: `restored-${index}`,  // Mark as restored, not temp
        previewUrl: url,  // CDN URL works as preview
        originalName: `Reference ${index + 1}`,  // Extract filename if possible
      }));
      setReferenceImages(restoredImages);
      console.log('[AmbientWorkflow] Restored reference images from CDN:', cdnUrls.length);
    }
    
    if (data.imageCustomInstructions) setImageCustomInstructions(data.imageCustomInstructions as string);
    
    setStep2Initialized(true);
    console.log('[AmbientWorkflow] Step2 data restored successfully');
  }, [initialStep2Data, videoId, initializedForVideoId, step2Initialized]);

  // Save Step 1 (Atmosphere) data to database
  const saveStep1Data = async (): Promise<boolean> => {
    if (!videoId || videoId === 'new') {
      toast({
        title: "Error",
        description: "Cannot save - no video ID available.",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);
    onSaveStateChange?.(true);
    
    try {
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/step/1/continue`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // Core atmosphere settings
          mood,
          theme,
          timeContext,
          season,
          duration,
          aspectRatio,
          userStory,       // User's original story/prompt
          moodDescription, // AI-generated description
          // Animation settings
          animationMode,
          videoGenerationMode,
          // Image settings
          imageModel,
          imageResolution,
          // Video animation settings
          videoModel,
          videoResolution,
          motionPrompt,
          // Animation style settings
          defaultEasingStyle,
          transitionStyle,
          cameraMotion,
          // Pacing & Flow
          pacing,
          segmentEnabled,
          segmentCount,
          shotsPerSegment,
          // Loop settings
          loopMode,
          loopType,
          segmentLoopEnabled,
          segmentLoopCount,
          shotLoopEnabled,
          shotLoopCount,
          // Voiceover settings
          voiceoverEnabled,
          language,
          textOverlayEnabled,
          textOverlayStyle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save atmosphere settings');
      }

      return true;
    } catch (error) {
      console.error('[AmbientWorkflow] Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save atmosphere settings",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
      onSaveStateChange?.(false);
    }
  };

  // Save Step 2 (Visual World) data to database
  // This uploads temp reference images to Bunny CDN permanently
  const saveStep2Data = async (): Promise<boolean> => {
    if (!videoId || videoId === 'new') {
      toast({
        title: "Error",
        description: "Cannot save - no video ID available.",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);
    onSaveStateChange?.(true);
    
    try {
      // Separate restored images (already CDN URLs) from new temp uploads
      const restoredImages = referenceImages.filter(img => img.tempId.startsWith('restored-'));
      const newTempImages = referenceImages.filter(img => !img.tempId.startsWith('restored-'));
      
      // Extract existing CDN URLs from restored images
      const existingReferenceUrls = restoredImages.map(img => img.previewUrl);
      // Extract temp IDs from new uploads for Bunny upload
      const referenceTempIds = newTempImages.map(img => img.tempId);
      
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/step/2/continue`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          artStyle,
          visualElements,
          visualRhythm,
          existingReferenceUrls, // Already saved CDN URLs
          referenceTempIds, // New temp IDs - backend will upload to Bunny
          imageCustomInstructions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save visual world settings');
      }

      return true;
    } catch (error) {
      console.error('[AmbientWorkflow] Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save visual world settings",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
      onSaveStateChange?.(false);
    }
  };

  // Handler to update mood description and capture settings snapshot
  const handleMoodDescriptionChange = (newDescription: string) => {
    setMoodDescription(newDescription);
    
    // If setting a non-empty description, capture current settings as snapshot
    if (newDescription.trim().length > 0) {
      setDescriptionSettingsSnapshot({
        mood,
        theme,
        timeContext,
        season,
        duration,
      });
    } else {
      // Clear snapshot when description is cleared
      setDescriptionSettingsSnapshot(null);
    }
  };

  // Check if core settings have changed since description was created
  const settingsChangedSinceDescription = descriptionSettingsSnapshot !== null && (
    descriptionSettingsSnapshot.mood !== mood ||
    descriptionSettingsSnapshot.theme !== theme ||
    descriptionSettingsSnapshot.timeContext !== timeContext ||
    descriptionSettingsSnapshot.season !== season ||
    descriptionSettingsSnapshot.duration !== duration
  );

  // Compute validation for current step
  // Step 1 requires: description exists AND settings haven't changed since description was created
  const hasDescription = moodDescription.trim().length > 0;
  const canContinueStep1 = hasDescription && !settingsChangedSinceDescription;
  const canContinue = activeStep === 1 ? canContinueStep1 : true;  // Add validations for other steps as needed

  // Notify parent when validation state changes
  useEffect(() => {
    onValidationChange?.(canContinue);
  }, [canContinue, onValidationChange]);

  useImperativeHandle(ref, () => ({
    saveCurrentStep: async () => {
      if (activeStep === 1) {
        return saveStep1Data();
      }
      if (activeStep === 2) {
        return saveStep2Data();
      }
      // For other steps, return true (no save needed yet)
      return true;
    },
    isSaving,
    canContinue,
  }));

  const goToNextStep = async () => {
    // Save data before continuing for steps that require it
    if (activeStep === 1) {
      const success = await saveStep1Data();
      if (success) {
        onStepChange(activeStep + 1);
      }
    } else if (activeStep === 2) {
      const success = await saveStep2Data();
      if (success) {
        // Trigger auto-generation when entering Flow Design from Step 2
        // Only if we don't already have scene data
        if (scenes.length === 0) {
          setShouldAutoGenerateFlow(true);
        }
        onStepChange(activeStep + 1);
      }
    } else {
      // For other steps, just advance (TODO: implement save for other steps)
      onStepChange(activeStep + 1);
    }
  };

  // Handler for scene generation in Flow Design
  const handleScenesGenerated = (
    newScenes: Scene[], 
    newShots: { [sceneId: string]: Shot[] }, 
    newShotVersions?: { [shotId: string]: ShotVersion[] }
  ) => {
    setScenes(newScenes);
    setShots(newShots);
    if (newShotVersions) {
      setShotVersions(newShotVersions);
    }
  };

  const handleContinuityLocked = () => {
    setContinuityLocked(true);
  };

  const handleContinuityGroupsChange = (groups: { [sceneId: string]: ContinuityGroup[] }) => {
    setContinuityGroups(groups);
  };

  // StoryboardEditor handlers
  const handleGenerateShot = (shotId: string) => {
    // Mock implementation - would call API in production
    console.log("Generating shot:", shotId);
    const allShots = Object.values(shots).flat();
    const shot = allShots.find(s => s.id === shotId);
    if (shot) {
      const newVersion: ShotVersion = {
        id: `version-${Date.now()}`,
        shotId: shotId,
        versionNumber: (shotVersions[shotId]?.length || 0) + 1,
        imagePrompt: shot.description || "",
        imageUrl: `https://picsum.photos/seed/${Date.now()}/640/360`,
        status: 'completed',
        needsRerender: false,
        createdAt: new Date(),
      };
      setShotVersions(prev => ({
        ...prev,
        [shotId]: [...(prev[shotId] || []), newVersion]
      }));
      // Update shot with currentVersionId
      setShots(prev => {
        const sceneId = shot.sceneId;
        return {
          ...prev,
          [sceneId]: prev[sceneId].map(s => 
            s.id === shotId ? { ...s, currentVersionId: newVersion.id } : s
          )
        };
      });
    }
  };

  const handleRegenerateShot = (shotId: string) => {
    handleGenerateShot(shotId);
  };

  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId].map(shot =>
          shot.id === shotId ? { ...shot, ...updates } : shot
        );
      }
      return newShots;
    });
  };

  const handleUpdateShotVersion = (shotId: string, versionId: string, updates: Partial<ShotVersion>) => {
    setShotVersions(prev => ({
      ...prev,
      [shotId]: (prev[shotId] || []).map(version =>
        version.id === versionId ? { ...version, ...updates } : version
      )
    }));
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    ));
  };

  const handleReorderShots = (sceneId: string, shotIds: string[]) => {
    setShots(prev => {
      const sceneShots = prev[sceneId] || [];
      const reordered = shotIds.map((id, index) => {
        const shot = sceneShots.find(s => s.id === id);
        return shot ? { ...shot, order: index } : null;
      }).filter(Boolean) as Shot[];
      return { ...prev, [sceneId]: reordered };
    });
  };

  const handleUploadShotReference = (shotId: string, file: File) => {
    // Mock implementation - would upload file in production
    const url = URL.createObjectURL(file);
    const newRef: ReferenceImage = {
      id: `ref-${Date.now()}`,
      videoId: null,
      shotId: shotId,
      characterId: null,
      type: "shot-reference",
      imageUrl: url,
      description: file.name,
      createdAt: new Date(),
    };
    setShotReferenceImages(prev => [...prev, newRef]);
  };

  const handleDeleteShotReference = (shotId: string) => {
    setShotReferenceImages(prev => prev.filter(ref => ref.shotId !== shotId));
  };

  const handleSelectVersion = (shotId: string, versionId: string) => {
    // Update shot's currentVersionId
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId].map(shot =>
          shot.id === shotId ? { ...shot, currentVersionId: versionId } : shot
        );
      }
      return newShots;
    });
  };

  const handleDeleteVersion = (shotId: string, versionId: string) => {
    setShotVersions(prev => ({
      ...prev,
      [shotId]: (prev[shotId] || []).filter(v => v.id !== versionId)
    }));
  };

  const handleAddScene = (afterSceneIndex: number) => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      videoId: `ambient-${Date.now()}`,
      sceneNumber: afterSceneIndex + 2,
      title: "New Scene",
      description: "New scene description",
      duration: 10,
      createdAt: new Date(),
    };
    setScenes(prev => {
      const newScenes = [...prev];
      newScenes.splice(afterSceneIndex + 1, 0, newScene);
      // Update order for all scenes
      return newScenes.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    });
    setShots(prev => ({ ...prev, [newScene.id]: [] }));
  };

  const handleAddShot = (sceneId: string, afterShotIndex: number) => {
    const newShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: sceneId,
      shotNumber: afterShotIndex + 2,
      description: "New shot",
      duration: 5,
      shotType: "Medium Shot",
      cameraMovement: "Static",
      currentVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setShots(prev => {
      const sceneShots = [...(prev[sceneId] || [])];
      sceneShots.splice(afterShotIndex + 1, 0, newShot);
      // Update order for all shots in scene
      return {
        ...prev,
        [sceneId]: sceneShots.map((s, i) => ({ ...s, shotNumber: i + 1 }))
      };
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId).map((s, i) => ({ ...s, order: i, sceneNumber: i + 1 })));
    setShots(prev => {
      const newShots = { ...prev };
      delete newShots[sceneId];
      return newShots;
    });
  };

  const handleDeleteShot = (shotId: string) => {
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId]
          .filter(s => s.id !== shotId)
          .map((s, i) => ({ ...s, order: i, shotNumber: i + 1 }));
      }
      return newShots;
    });
    setShotVersions(prev => {
      const newVersions = { ...prev };
      delete newVersions[shotId];
      return newVersions;
    });
  };

  // Calculate total duration from all shots
  const allShots = Object.values(shots).flat();
  const totalDuration = allShots.reduce((acc, s) => acc + (s.duration || 5), 0) || 60;

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return (
          <AtmosphereTab
            videoId={videoId}
            isSaving={isSaving}
            mood={mood}
            theme={theme}
            timeContext={timeContext}
            season={season}
            intensity={intensity}
            duration={duration}
            userStory={userStory}
            moodDescription={moodDescription}
            imageModel={imageModel}
            imageResolution={imageResolution}
            aspectRatio={aspectRatio}
            voiceoverEnabled={voiceoverEnabled}
            language={language}
            textOverlayEnabled={textOverlayEnabled}
            textOverlayStyle={textOverlayStyle}
            animationMode={animationMode}
            videoGenerationMode={videoGenerationMode}
            defaultEasingStyle={defaultEasingStyle}
            videoModel={videoModel}
            videoResolution={videoResolution}
            motionPrompt={motionPrompt}
            transitionStyle={transitionStyle}
            cameraMotion={cameraMotion}
            pacing={pacing}
            segmentEnabled={segmentEnabled}
            segmentCount={segmentCount}
            shotsPerSegment={shotsPerSegment}
            loopMode={loopMode}
            loopType={loopType}
            segmentLoopEnabled={segmentLoopEnabled}
            segmentLoopCount={segmentLoopCount}
            shotLoopEnabled={shotLoopEnabled}
            shotLoopCount={shotLoopCount}
            onMoodChange={setMood}
            onThemeChange={setTheme}
            onTimeContextChange={setTimeContext}
            onSeasonChange={setSeason}
            onIntensityChange={setIntensity}
            onDurationChange={setDuration}
            onUserStoryChange={setUserStory}
            onMoodDescriptionChange={handleMoodDescriptionChange}
            onImageModelChange={setImageModel}
            onImageResolutionChange={setImageResolution}
            onAspectRatioChange={setAspectRatio}
            onVoiceoverChange={setVoiceoverEnabled}
            onLanguageChange={setLanguage}
            onTextOverlayEnabledChange={setTextOverlayEnabled}
            onTextOverlayStyleChange={setTextOverlayStyle}
            onAnimationModeChange={setAnimationMode}
            onDefaultEasingStyleChange={setDefaultEasingStyle}
            onVideoModelChange={setVideoModel}
            onVideoResolutionChange={setVideoResolution}
            onMotionPromptChange={setMotionPrompt}
            onTransitionStyleChange={setTransitionStyle}
            onCameraMotionChange={setCameraMotion}
            onPacingChange={setPacing}
            onSegmentEnabledChange={setSegmentEnabled}
            onSegmentCountChange={setSegmentCount}
            onShotsPerSegmentChange={setShotsPerSegment}
            onLoopModeChange={setLoopMode}
            onLoopTypeChange={setLoopType}
            onSegmentLoopEnabledChange={setSegmentLoopEnabled}
            onSegmentLoopCountChange={setSegmentLoopCount}
            onShotLoopEnabledChange={setShotLoopEnabled}
            onShotLoopCountChange={setShotLoopCount}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <VisualWorldTab
            artStyle={artStyle}
            visualElements={visualElements}
            visualRhythm={visualRhythm}
            referenceImages={referenceImages}
            imageCustomInstructions={imageCustomInstructions}
            onArtStyleChange={setArtStyle}
            onVisualElementsChange={setVisualElements}
            onVisualRhythmChange={setVisualRhythm}
            onReferenceImagesChange={setReferenceImages}
            onImageCustomInstructionsChange={setImageCustomInstructions}
            onNext={goToNextStep}
          />
        );
      case 3:
        return (
          <FlowDesignTab
            videoId={videoId || ''}
            script={moodDescription}
            scriptModel="gemini-flash"
            narrativeMode={videoGenerationMode === 'start-end-frame' ? 'start-end' : 'image-reference'}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            continuityLocked={continuityLocked}
            continuityGroups={continuityGroups}
            animationMode={animationMode}
            autoGenerate={shouldAutoGenerateFlow}
            onScenesGenerated={handleScenesGenerated}
            onContinuityLocked={handleContinuityLocked}
            onContinuityGroupsChange={handleContinuityGroupsChange}
            onGenerationComplete={() => setShouldAutoGenerateFlow(false)}
            onNext={goToNextStep}
          />
        );
      case 4:
        return (
          <StoryboardEditor
            videoId={`ambient-${Date.now()}`}
            narrativeMode={videoGenerationMode === 'start-end-frame' ? 'start-end' : 'image-reference'}
            animationMode={animationMode}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            referenceImages={shotReferenceImages}
            characters={characters}
            voiceActorId={voiceActorId}
            voiceOverEnabled={voiceoverEnabled}
            continuityLocked={continuityLocked}
            continuityGroups={continuityGroups}
            onVoiceActorChange={setVoiceActorId}
            onVoiceOverToggle={setVoiceoverEnabled}
            onGenerateShot={handleGenerateShot}
            onRegenerateShot={handleRegenerateShot}
            onUpdateShot={handleUpdateShot}
            onUpdateShotVersion={handleUpdateShotVersion}
            onUpdateScene={handleUpdateScene}
            onReorderShots={handleReorderShots}
            onUploadShotReference={handleUploadShotReference}
            onDeleteShotReference={handleDeleteShotReference}
            onSelectVersion={handleSelectVersion}
            onDeleteVersion={handleDeleteVersion}
            onAddScene={handleAddScene}
            onAddShot={handleAddShot}
            onDeleteScene={handleDeleteScene}
            onDeleteShot={handleDeleteShot}
            onNext={goToNextStep}
          />
        );
      case 5:
        // Convert shots to segments for preview
        const previewSegments = allShots.map((shot, index) => {
          const version = shot.currentVersionId ? shotVersions[shot.id]?.find(v => v.id === shot.currentVersionId) : null;
          return {
            id: shot.id,
            keyframeUrl: version?.imageUrl || null,
            duration: shot.duration || 5,
            motionDirection: "static" as const,
            layers: { background: true, midground: true, foreground: false },
            effects: { particles: false, lightRays: false, fog: false }
          };
        });
        return (
          <PreviewTab
            segments={previewSegments}
            loopMode={loopMode ? "enabled" : "none"}
            duration={duration}
            onNext={goToNextStep}
          />
        );
      case 6:
        return (
          <ExportTab
            projectName={projectName}
            loopMode={loopMode ? "enabled" : "none"}
            totalDuration={totalDuration}
          />
        );
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
});

AmbientVisualWorkflow.displayName = 'AmbientVisualWorkflow';
