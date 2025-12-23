import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { AtmosphereTab } from "./ambient/atmosphere-tab";
import { VisualWorldTab, type TempReferenceImage } from "./ambient/visual-world-tab";
import { FlowDesignTab } from "./ambient/flow-design-tab";
import { StoryboardEditor } from "./ambient/storyboard-editor";
import { PreviewTab } from "./ambient/preview-tab";
import { ExportTab } from "./ambient/export-tab";
import { getDefaultVideoModel } from "@/constants/video-models";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
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
  initialStep3Data?: Record<string, unknown>;  // Saved step3 data from database (scenes, shots, etc.)
  initialStep4Data?: Record<string, unknown>;  // Saved step4 data from database (prompts, versions)
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
  initialStep3Data,
  initialStep4Data,
}, ref) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  // Track the videoId that was used to initialize, to detect when we need to re-initialize
  const [initializedForVideoId, setInitializedForVideoId] = useState<string | null>(null);
  const [step2Initialized, setStep2Initialized] = useState(false);
  const [step3Initialized, setStep3Initialized] = useState(false);
  const [step4Initialized, setStep4Initialized] = useState(false);
  // Flag to trigger auto-generation in Flow Design when coming from Step 2
  const [shouldAutoGenerateFlow, setShouldAutoGenerateFlow] = useState(false);
  // Flag to show loading screen while generating prompts for Phase 4
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  
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
  const [continuityGenerated, setContinuityGenerated] = useState(false);
  
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
    setStep3Initialized(false); // Reset step3 flag when video changes
    setStep4Initialized(false); // Reset step4 flag when video changes
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

  // Restore Step 3 (Flow Design) data when video is reopened
  useEffect(() => {
    if (!initialStep3Data || !videoId) {
      console.log('[AmbientWorkflow] Waiting for step3 data - initialStep3Data:', !!initialStep3Data, 'videoId:', videoId);
      return;
    }
    
    if (initializedForVideoId !== videoId) {
      console.log('[AmbientWorkflow] Waiting for step1 to initialize before step3');
      return; // Wait for step1 to initialize first
    }
    
    if (step3Initialized) {
      console.log('[AmbientWorkflow] Step3 already initialized');
      return;
    }
    
    const data = initialStep3Data;
    console.log('[AmbientWorkflow] Restoring step3 data:', data);
    
    // Restore scenes
    if (data.scenes && Array.isArray(data.scenes)) {
      const restoredScenes = (data.scenes as Scene[]).map(scene => ({
        ...scene,
        createdAt: scene.createdAt ? new Date(scene.createdAt) : new Date(),
      }));
      setScenes(restoredScenes);
      console.log('[AmbientWorkflow] Restored scenes:', restoredScenes.length);
    }
    
    // Restore shots
    if (data.shots && typeof data.shots === 'object') {
      const restoredShots: { [sceneId: string]: Shot[] } = {};
      Object.entries(data.shots as Record<string, Shot[]>).forEach(([sceneId, sceneShots]) => {
        restoredShots[sceneId] = sceneShots.map(shot => ({
          ...shot,
          createdAt: shot.createdAt ? new Date(shot.createdAt) : new Date(),
          updatedAt: shot.updatedAt ? new Date(shot.updatedAt) : new Date(),
        }));
      });
      setShots(restoredShots);
      console.log('[AmbientWorkflow] Restored shots:', Object.values(restoredShots).flat().length);
    }
    
    // NOTE: shotVersions with imagePrompts are restored from step4Data, not step3Data
    // step3Data.shotVersions may exist but won't have Agent 4.1 generated prompts
    // We ONLY restore shotVersions from step4Data to ensure we get the prompts
    console.log('[AmbientWorkflow] Skipping step3 shotVersions - will use step4Data instead');
    
    // Restore continuity groups
    if (data.continuityGroups && typeof data.continuityGroups === 'object') {
      const restoredGroups: { [sceneId: string]: ContinuityGroup[] } = {};
      Object.entries(data.continuityGroups as Record<string, ContinuityGroup[]>).forEach(([sceneId, groups]) => {
        restoredGroups[sceneId] = groups.map(group => ({
          ...group,
          createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
          editedAt: group.editedAt ? new Date(group.editedAt) : undefined,
          approvedAt: group.approvedAt ? new Date(group.approvedAt) : undefined,
        }));
      });
      setContinuityGroups(restoredGroups);
      console.log('[AmbientWorkflow] Restored continuity groups:', {
        sceneCount: Object.keys(restoredGroups).length,
        totalGroups: Object.values(restoredGroups).flat().length,
        statuses: Object.values(restoredGroups).flat().map(g => g.status),
      });
    } else {
      console.log('[AmbientWorkflow] No continuity groups to restore:', {
        hasData: !!data.continuityGroups,
        type: typeof data.continuityGroups,
      });
    }
    
    // Restore continuity locked state
    if (typeof data.continuityLocked === 'boolean') {
      setContinuityLocked(data.continuityLocked);
      console.log('[AmbientWorkflow] Restored continuity locked:', data.continuityLocked);
    }
    
    // Restore continuity generated state (one-time flag)
    if (typeof data.continuityGenerated === 'boolean') {
      setContinuityGenerated(data.continuityGenerated);
      console.log('[AmbientWorkflow] Restored continuity generated:', data.continuityGenerated);
    }
    
    setStep3Initialized(true);
    console.log('[AmbientWorkflow] Step3 data restored successfully');
  }, [initialStep3Data, videoId, initializedForVideoId, step3Initialized]);

  // Restore Step 4 (Composition) data when video is reopened
  useEffect(() => {
    // Log the actual data structure to debug issues
    console.log('[AmbientWorkflow] Step4 restore check:', {
      hasInitialStep4Data: !!initialStep4Data,
      initialStep4DataKeys: initialStep4Data ? Object.keys(initialStep4Data) : [],
      hasShotVersions: !!(initialStep4Data as any)?.shotVersions,
      shotVersionsCount: (initialStep4Data as any)?.shotVersions ? Object.keys((initialStep4Data as any).shotVersions).length : 0,
      videoId,
      initializedForVideoId,
      step4Initialized,
    });
    
    if (!initialStep4Data || !videoId) {
      console.log('[AmbientWorkflow] No step4 data yet - waiting...', { hasData: !!initialStep4Data, videoId });
      return;
    }
    
    if (initializedForVideoId !== videoId) {
      console.log('[AmbientWorkflow] Waiting for step1 to initialize before step4');
      return;
    }
    
    if (step4Initialized) {
      console.log('[AmbientWorkflow] Step4 already initialized');
      return;
    }
    
    const data = initialStep4Data;
    console.log('[AmbientWorkflow] Restoring step4 data - raw:', JSON.stringify(data).substring(0, 500));
    
    // Restore shot versions with prompts
    if (data.shotVersions && typeof data.shotVersions === 'object') {
      const restoredVersions: { [shotId: string]: ShotVersion[] } = {};
      Object.entries(data.shotVersions as Record<string, ShotVersion[]>).forEach(([shotId, versions]) => {
        restoredVersions[shotId] = versions.map(version => ({
          ...version,
          createdAt: version.createdAt ? new Date(version.createdAt) : new Date(),
        }));
      });
      setShotVersions(restoredVersions);
      console.log('[AmbientWorkflow] Restored shot versions from step4:', {
        count: Object.keys(restoredVersions).length,
        sampleShotId: Object.keys(restoredVersions)[0],
        sampleVersion: restoredVersions[Object.keys(restoredVersions)[0]]?.[0],
        sampleImagePromptLength: restoredVersions[Object.keys(restoredVersions)[0]]?.[0]?.imagePrompt?.length,
      });
    } else {
      console.log('[AmbientWorkflow] No shotVersions found in step4Data');
    }
    
    setStep4Initialized(true);
    console.log('[AmbientWorkflow] Step4 data restored successfully');
  }, [initialStep4Data, videoId, initializedForVideoId, step4Initialized]);

  // Note: Prompt generation for Phase 4 is now handled directly in goToNextStep
  // when transitioning from Step 3 to Step 4. The loading screen shows during
  // Step 3 while prompts are being generated.

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
  
  // Step 3 (Flow Design) validation for start-end mode: requires continuity to be completed
  const allGroups = Object.values(continuityGroups).flat();
  const totalProposedGroups = allGroups.filter(g => g.status === 'proposed').length;
  const totalApprovedGroups = allGroups.filter(g => g.status === 'approved').length;
  const hasContinuityData = continuityGenerated || allGroups.length > 0;
  const canContinueStep3 = videoGenerationMode === 'image-reference' 
    ? true  // Image-reference mode doesn't require continuity
    : (hasContinuityData && continuityLocked && totalProposedGroups === 0 && totalApprovedGroups > 0);
  
  console.log('[AmbientWorkflow] Step 3 validation:', {
    activeStep,
    videoGenerationMode,
    continuityLocked,
    continuityGenerated,
    totalProposedGroups,
    totalApprovedGroups,
    hasContinuityData,
    canContinueStep3,
  });
  
  // Determine canContinue based on active step
  const canContinue = activeStep === 1 
    ? canContinueStep1 
    : activeStep === 3 
      ? canContinueStep3 
      : true;  // Other steps have no validation yet

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
      if (activeStep === 3) {
        // For step 3, save data AND generate prompts if video-animation mode
        const saved = await saveStep3Data();
        if (!saved) return false;
        
        // For video-animation mode, generate prompts BEFORE allowing navigation
        if (animationMode === 'video-animation') {
          setIsGeneratingPrompts(true);
          onSaveStateChange?.(true);
          
          try {
            console.log('[AmbientWorkflow] saveCurrentStep: Generating prompts for all shots');
            
            // Run Agent 4.1 for all shots
            const response = await fetch(`/api/ambient-visual/videos/${videoId}/generate-all-prompts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to generate prompts');
            }
            
            const result = await response.json();
            console.log('[AmbientWorkflow] Prompts generated:', result);

            // Activate Phase 4
            const activateResponse = await fetch(`/api/ambient-visual/videos/${videoId}/step/4/continue`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });

            if (!activateResponse.ok) {
              throw new Error('Failed to activate Phase 4');
            }

            // Fetch updated video data to get shotVersions AND updated shots
            const videoResponse = await fetch(`/api/ambient-visual/videos/${videoId}`, {
              credentials: 'include',
            });
            
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              const step3Data = videoData.step3Data;
              const step4Data = videoData.step4Data;
              
              // Update step3 shots with new currentVersionId values
              if (step3Data?.shots) {
                const updatedShots: Record<string, Shot[]> = {};
                Object.entries(step3Data.shots).forEach(([sceneId, sceneShots]) => {
                  updatedShots[sceneId] = (sceneShots as Shot[]).map((shot: Shot) => ({
                    ...shot,
                  }));
                });
                setShots(updatedShots);
                
                // Log version IDs for debugging
                const sampleShot = Object.values(updatedShots).flat()[0];
                console.log('[AmbientWorkflow] Updated shots with new currentVersionId:', {
                  shotCount: Object.values(updatedShots).flat().length,
                  sampleShotId: sampleShot?.id,
                  sampleCurrentVersionId: sampleShot?.currentVersionId,
                });
              }
              
              if (step4Data?.shotVersions) {
                const restoredVersions: { [shotId: string]: ShotVersion[] } = {};
                Object.entries(step4Data.shotVersions as Record<string, ShotVersion[]>).forEach(([shotId, versions]) => {
                  restoredVersions[shotId] = versions.map((version: ShotVersion) => ({
                    ...version,
                    createdAt: version.createdAt ? new Date(version.createdAt) : new Date(),
                  }));
                });
                setShotVersions(restoredVersions);
                
                // Log detailed version info for debugging
                const sampleShotId = Object.keys(restoredVersions)[0];
                const sampleVersion = restoredVersions[sampleShotId]?.[0];
                console.log('[AmbientWorkflow] Loaded shot versions after generation:', {
                  shotCount: Object.keys(restoredVersions).length,
                  sampleVersions: Object.values(restoredVersions)[0]?.length || 0,
                  samplePromptLength: Object.values(restoredVersions)[0]?.[0]?.imagePrompt?.length || 0,
                  sampleShotId,
                  sampleVersionId: sampleVersion?.id,
                  sampleImagePromptPreview: sampleVersion?.imagePrompt?.substring(0, 50),
                });
                
                // Wait for state to update before returning
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            toast({
              title: "Prompts Generated",
              description: `Generated prompts for ${result.promptsGenerated} shots.${result.totalCost ? ` Cost: $${result.totalCost.toFixed(4)}` : ''}`,
            });

            return true;
          } catch (error) {
            console.error('[AmbientWorkflow] Prompt generation failed:', error);
            toast({
              title: "Generation Failed",
              description: error instanceof Error ? error.message : "Failed to generate prompts.",
              variant: "destructive",
            });
            return false;
          } finally {
            setIsGeneratingPrompts(false);
            onSaveStateChange?.(false);
          }
        }
        
        return true;
      }
      // For other steps, return true (no save needed yet)
      return true;
    },
    isSaving: isSaving || isGeneratingPrompts,
    canContinue,
  }));

  // Save Step 3 (Flow Design) data to database
  const saveStep3Data = async (): Promise<boolean> => {
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
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/step/3/continue`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenes,
          shots,
          shotVersions,
          continuityLocked,
          continuityGroups,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save flow design');
      }

      return true;
    } catch (error) {
      console.error('[AmbientWorkflow] Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save flow design",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
      onSaveStateChange?.(false);
    }
  };

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
    } else if (activeStep === 3) {
      // STEP 3 -> STEP 4 TRANSITION (per plan):
      // 1. Save step 3 data
      // 2. Show loading screen (before navigating)
      // 3. Run Agent 4.1 to generate all prompts
      // 4. After complete, navigate to step 4
      
      const success = await saveStep3Data();
      if (success) {
        // For video-animation mode, generate prompts BEFORE showing step 4
        if (animationMode === 'video-animation') {
          // Show loading screen
          setIsGeneratingPrompts(true);
          
          try {
            // Run Agent 4.1 for all shots
            console.log('[AmbientWorkflow] Starting prompt generation before step 4');
            
            const response = await fetch(`/api/ambient-visual/videos/${videoId}/generate-all-prompts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to generate prompts');
            }
            
            const result = await response.json();
            console.log('[AmbientWorkflow] Prompts generated:', result);

            // Activate Phase 4
            const activateResponse = await fetch(`/api/ambient-visual/videos/${videoId}/step/4/continue`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });

            if (!activateResponse.ok) {
              throw new Error('Failed to activate Phase 4');
            }

            // Fetch updated video data to get shotVersions AND updated shots
            const videoResponse = await fetch(`/api/ambient-visual/videos/${videoId}`, {
              credentials: 'include',
            });
            
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              const step3Data = videoData.step3Data;
              const step4Data = videoData.step4Data;
              
              // Update step3 shots with new currentVersionId values
              if (step3Data?.shots) {
                const updatedShots: Record<string, Shot[]> = {};
                Object.entries(step3Data.shots).forEach(([sceneId, sceneShots]) => {
                  updatedShots[sceneId] = (sceneShots as Shot[]).map((shot: Shot) => ({
                    ...shot,
                  }));
                });
                setShots(updatedShots);
                
                // Log version IDs for debugging
                const sampleShot = Object.values(updatedShots).flat()[0];
                console.log('[AmbientWorkflow] Updated shots with new currentVersionId (navigation):', {
                  shotCount: Object.values(updatedShots).flat().length,
                  sampleShotId: sampleShot?.id,
                  sampleCurrentVersionId: sampleShot?.currentVersionId,
                });
              }
              
              if (step4Data?.shotVersions) {
                const restoredVersions: { [shotId: string]: ShotVersion[] } = {};
                Object.entries(step4Data.shotVersions as Record<string, ShotVersion[]>).forEach(([shotId, versions]) => {
                  restoredVersions[shotId] = versions.map((version: ShotVersion) => ({
                    ...version,
                    createdAt: version.createdAt ? new Date(version.createdAt) : new Date(),
                  }));
                });
                setShotVersions(restoredVersions);
                
                // Log detailed version info for debugging
                const sampleShotId = Object.keys(restoredVersions)[0];
                const sampleVersion = restoredVersions[sampleShotId]?.[0];
                console.log('[AmbientWorkflow] Loaded shot versions before navigation:', {
                  shotCount: Object.keys(restoredVersions).length,
                  sampleVersions: Object.values(restoredVersions)[0]?.length || 0,
                  samplePromptLength: Object.values(restoredVersions)[0]?.[0]?.imagePrompt?.length || 0,
                  sampleShotId,
                  sampleVersionId: sampleVersion?.id,
                  sampleImagePromptPreview: sampleVersion?.imagePrompt?.substring(0, 50),
                });
                
                // Wait for state to update before navigating
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            toast({
              title: "Prompts Generated",
              description: `Generated prompts for ${result.promptsGenerated} shots.${result.totalCost ? ` Cost: $${result.totalCost.toFixed(4)}` : ''}`,
            });

            // NOW navigate to step 4 with data ready
            onStepChange(activeStep + 1);

          } catch (error) {
            console.error('[AmbientWorkflow] Prompt generation failed:', error);
            toast({
              title: "Generation Failed",
              description: error instanceof Error ? error.message : "Failed to generate prompts. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsGeneratingPrompts(false);
          }
        } else {
          // For image-transitions mode, just navigate
          onStepChange(activeStep + 1);
        }
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
        // Show loading screen while generating prompts for Phase 4
        if (isGeneratingPrompts) {
          return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
              <div className="text-center space-y-8">
                <Sparkles className="h-16 w-16 text-cyan-400 mx-auto animate-pulse" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Generating Prompts
                  </h2>
                  <p className="text-slate-400">
                    Creating optimized prompts for all {Object.values(shots).flat().length} shots...
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    This may take a moment
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        }
        
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
            continuityGenerated={continuityGenerated}
            animationMode={animationMode}
            autoGenerate={shouldAutoGenerateFlow}
            onScenesGenerated={handleScenesGenerated}
            onContinuityLocked={handleContinuityLocked}
            onContinuityGroupsChange={handleContinuityGroupsChange}
            onGenerationComplete={() => setShouldAutoGenerateFlow(false)}
          />
        );
      case 4:
        // Prompts should already be generated before entering this step
        console.log('[AmbientWorkflow] Rendering Step 4 with shotVersions:', {
          shotVersionsKeys: Object.keys(shotVersions),
          totalVersions: Object.values(shotVersions).flat().length,
          sampleVersion: Object.values(shotVersions).flat()[0],
          hasImagePrompt: Object.values(shotVersions).flat()[0]?.imagePrompt ? 'yes' : 'no',
        });
        // Construct step1Data to pass for scene initialization
        const step1DataForComposition = {
          animationMode,
          videoGenerationMode,
          imageModel,
          imageResolution,
          aspectRatio,
          duration,
          mood,
          theme,
          timeContext,
          season,
          userStory,
          moodDescription,
          defaultEasingStyle,
          videoModel,
          videoResolution,
          motionPrompt,
          transitionStyle,
          cameraMotion,
          pacing,
          segmentEnabled,
          segmentCount,
          shotsPerSegment,
          loopMode,
          loopType,
          segmentLoopEnabled,
          segmentLoopCount,
          shotLoopEnabled,
          shotLoopCount,
          voiceoverEnabled,
          language,
          textOverlayEnabled,
          textOverlayStyle,
        };
        
        return (
          <StoryboardEditor
            videoId={videoId || `ambient-${Date.now()}`}
            step1Data={step1DataForComposition}
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
