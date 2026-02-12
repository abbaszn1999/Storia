import { useState, useImperativeHandle, forwardRef, useEffect, useRef, useCallback, useMemo } from "react";
import { AtmosphereTab } from "./atmosphere-tab";
import { VisualWorldTab, type TempReferenceImage } from "./visual-world-tab";
import { FlowDesignTab } from "./flow-design-tab";
import { StoryboardEditor } from "./storyboard-editor";
import { SoundscapeTab } from "./soundscape-tab";
import { PreviewTab, type PreviewTabRef } from "./preview-tab";
import { ExportTab } from "./export-tab";
import { getDefaultVideoModel } from "@/constants/video-models";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ContinuityGroup, ReferenceImage } from "@/types/storyboard";

export interface AmbientVisualWorkflowRef {
  saveCurrentStep: () => Promise<boolean>;
  goToNextStep: () => Promise<void>;
  getCurrentVolumes: () => Promise<{ master: number; sfx: number; voiceover: number; music: number } | null>;
  isSaving: boolean;
  canContinue: boolean;  // Whether current step has valid data to continue
  isGeneratingFlowDesign: boolean;  // Whether flow design is currently being generated
}

interface AmbientVisualWorkflowProps {
  activeStep: number;
  onStepChange: (step: number) => void;
  onSaveStateChange?: (isSaving: boolean) => void;
  onValidationChange?: (canContinue: boolean) => void;  // Called when validation state changes
  onGeneratingFlowDesignChange?: (isGenerating: boolean) => void;  // Called when flow design generation state changes
  projectName: string;
  videoId?: string;
  initialAnimationMode?: 'image-transitions' | 'video-animation';
  initialVideoGenerationMode?: 'image-reference' | 'start-end-frame';
  initialStep1Data?: Record<string, unknown>;  // Saved step1 data from database
  initialStep2Data?: Record<string, unknown>;  // Saved step2 data from database
  initialStep3Data?: Record<string, unknown>;  // Saved step3 data from database (scenes, shots, etc.)
  initialStep4Data?: Record<string, unknown>;  // Saved step4 data from database (prompts, versions)
  initialStep5Data?: Record<string, unknown>;  // Saved step5 data from database (voiceover, soundscape)
}

export const AmbientVisualWorkflow = forwardRef<AmbientVisualWorkflowRef, AmbientVisualWorkflowProps>(({
  activeStep,
  onStepChange,
  onSaveStateChange,
  onValidationChange,
  onGeneratingFlowDesignChange,
  projectName,
  videoId,
  initialAnimationMode = 'image-transitions',
  initialVideoGenerationMode,
  initialStep1Data,
  initialStep2Data,
  initialStep3Data,
  initialStep4Data,
  initialStep5Data,
}, ref) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref to PreviewTab for getting volumes
  const previewTabRef = useRef<PreviewTabRef>(null);
  
  // Track the videoId that was used to initialize, to detect when we need to re-initialize
  const [initializedForVideoId, setInitializedForVideoId] = useState<string | null>(null);
  const [step2Initialized, setStep2Initialized] = useState(false);
  const [step3Initialized, setStep3Initialized] = useState(false);
  const [step4Initialized, setStep4Initialized] = useState(false);
  // Flag to trigger auto-generation in Flow Design when coming from Step 2
  const [shouldAutoGenerateFlow, setShouldAutoGenerateFlow] = useState(false);
  // Flag to show loading screen while generating flow design when transitioning from Step 2 to Step 3
  const [isGeneratingFlowDesign, setIsGeneratingFlowDesign] = useState(false);
  // Flag to show loading screen while generating prompts for Phase 4
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  // Flag to show loading state while generating keyframe images (Agent 4.2)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  // Track which individual shots are currently generating (for single shot generation)
  const [generatingShotIds, setGeneratingShotIds] = useState<Set<string>>(new Set());
  // Flag to show loading state while generating videos (Agent 4.3)
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  // Track which individual shots are currently generating videos
  const [generatingVideoShotIds, setGeneratingVideoShotIds] = useState<Set<string>>(new Set());
  
  // Atmosphere State
  const [mood, setMood] = useState("calm");
  const [theme, setTheme] = useState("nature");
  const [timeContext, setTimeContext] = useState("sunset");
  const [season, setSeason] = useState("neutral");
  const [intensity, setIntensity] = useState(50);
  const [duration, setDuration] = useState("1min");
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
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false);
  const [musicStyle, setMusicStyle] = useState<'cinematic' | 'upbeat' | 'calm' | 'corporate' | 'electronic' | 'emotional' | 'inspiring'>('cinematic');
  const [customMusicUrl, setCustomMusicUrl] = useState<string>('');
  const [customMusicDuration, setCustomMusicDuration] = useState<number>(0);
  const [hasCustomMusic, setHasCustomMusic] = useState(false);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [voiceoverStory, setVoiceoverStory] = useState("");
  const [voiceId, setVoiceId] = useState("");
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
  
  // Step 5 Soundscape State
  const [loopSettingsLocked, setLoopSettingsLocked] = useState(false);
  const [step5Initialized, setStep5Initialized] = useState(false);
  const step5DataAppliedRef = useRef<boolean>(false);
  
  // Track generated voiceover/music URLs during the session
  // These override the initial values from step5Data when content is generated
  const [sessionVoiceoverUrl, setSessionVoiceoverUrl] = useState<string | null>(null);
  const [sessionMusicUrl, setSessionMusicUrl] = useState<string | null>(null);
  
  // Debounce timer ref for auto-saving step4 settings
  const step4SettingsSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Debounce timer ref for auto-saving step5 settings
  const step5SettingsSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track latest values for saving (avoids stale closure issues)
  const scenesRef = useRef<Scene[]>(scenes);
  const shotsRef = useRef<{ [sceneId: string]: Shot[] }>(shots);
  const loopSettingsLockedRef = useRef<boolean>(loopSettingsLocked);
  const activeStepRef = useRef<number>(activeStep);  // Track activeStep for closure safety
  
  // Keep refs in sync with state
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { shotsRef.current = shots; }, [shots]);
  useEffect(() => { loopSettingsLockedRef.current = loopSettingsLocked; }, [loopSettingsLocked]);
  useEffect(() => { activeStepRef.current = activeStep; }, [activeStep]);

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
        duration: (data.duration as string) || '1min',
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
    
    // Restore Background Music toggle (music style/url is in step2Data)
    if (data.backgroundMusicEnabled !== undefined) setBackgroundMusicEnabled(data.backgroundMusicEnabled as boolean);
    
    // Restore Voiceover settings
    if (data.voiceoverEnabled !== undefined) setVoiceoverEnabled(data.voiceoverEnabled as boolean);
    if (data.voiceoverStory) setVoiceoverStory(data.voiceoverStory as string);
    if (data.voiceId) setVoiceId(data.voiceId as string);
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
    
    // Restore Background Music settings (stored in step2Data)
    if (data.musicStyle) setMusicStyle(data.musicStyle as 'cinematic' | 'upbeat' | 'calm' | 'corporate' | 'electronic' | 'emotional' | 'inspiring');
    if (data.customMusicUrl) setCustomMusicUrl(data.customMusicUrl as string);
    if (data.customMusicDuration !== undefined) setCustomMusicDuration(data.customMusicDuration as number);
    if (data.hasCustomMusic !== undefined) setHasCustomMusic(data.hasCustomMusic as boolean);
    
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
    const step4Data = initialStep4Data as Record<string, unknown> | undefined;
    
    // Check if step4Data has scenes/shots (source of truth when available)
    const hasStep4Scenes = step4Data?.scenes && Array.isArray(step4Data.scenes) && (step4Data.scenes as Scene[]).length > 0;
    const hasStep4Shots = step4Data?.shots && typeof step4Data.shots === 'object' && Object.keys(step4Data.shots as object).length > 0;
    
    console.log('[AmbientWorkflow] Restoring step3 data:', { 
      hasStep4Scenes, 
      hasStep4Shots,
      step3ScenesCount: data.scenes ? (data.scenes as Scene[]).length : 0,
    });
    
    // Restore scenes - prefer step4Data (has model settings), fallback to step3Data
    // IMPORTANT: Preserve loopCount from step5Data if it exists (step5Data is restored later)
    if (hasStep4Scenes) {
      setScenes(prev => {
        const step4Scenes = (step4Data.scenes as Scene[]).map(scene => ({
          ...scene,
          createdAt: scene.createdAt ? new Date(scene.createdAt) : new Date(),
        }));
        // Preserve loopCount from existing scenes (from step5Data if already restored)
        const sceneMap = new Map(prev.map(s => [s.id, s]));
        const restoredScenes = step4Scenes.map(scene => {
          const existingScene = sceneMap.get(scene.id);
          return {
            ...scene,
            // Preserve loopCount if it exists in current state (from step5Data)
            loopCount: existingScene?.loopCount ?? scene.loopCount,
          };
        });
        console.log('[AmbientWorkflow] Restored scenes from step4Data (with models), preserving loopCount:', 
          restoredScenes.map(s => ({ id: s.id, loopCount: s.loopCount }))
        );
        return restoredScenes;
      });
    } else if (data.scenes && Array.isArray(data.scenes)) {
      setScenes(prev => {
        const step3Scenes = (data.scenes as Scene[]).map(scene => ({
          ...scene,
          createdAt: scene.createdAt ? new Date(scene.createdAt) : new Date(),
        }));
        // Preserve loopCount from existing scenes (from step5Data if already restored)
        const sceneMap = new Map(prev.map(s => [s.id, s]));
        const restoredScenes = step3Scenes.map(scene => {
          const existingScene = sceneMap.get(scene.id);
          return {
            ...scene,
            // Preserve loopCount if it exists in current state (from step5Data)
            loopCount: existingScene?.loopCount ?? scene.loopCount,
          };
        });
        console.log('[AmbientWorkflow] Restored scenes from step3Data (fallback), preserving loopCount:', 
          restoredScenes.map(s => ({ id: s.id, loopCount: s.loopCount }))
        );
        return restoredScenes;
      });
    }
    
    // Restore shots - prefer step4Data (has model settings), fallback to step3Data
    // IMPORTANT: Preserve loopCount from step5Data if it exists (step5Data is restored later)
    // CRITICAL: Use currentVersionId from step3Data (backend updates it there after prompt generation)
    if (hasStep4Shots) {
      // Build a map of currentVersionId from step3Data (source of truth for version IDs)
      const step3ShotsMap = new Map<string, string>();
      if (data.shots && typeof data.shots === 'object') {
        Object.values(data.shots as Record<string, Shot[]>).forEach(sceneShots => {
          sceneShots.forEach(shot => {
            if (shot.currentVersionId) {
              step3ShotsMap.set(shot.id, shot.currentVersionId);
            }
          });
        });
      }
      
      setShots(prev => {
        const restoredShots: { [sceneId: string]: Shot[] } = {};
        Object.entries(step4Data.shots as Record<string, Shot[]>).forEach(([sceneId, sceneShots]) => {
          // CRITICAL: Strip audio fields from step4Data - they don't belong there
          // Only preserve audio from existing state (which comes from step5Data)
          const existingShots = prev[sceneId] || [];
          const shotMap = new Map(existingShots.map(s => [s.id, s]));
          restoredShots[sceneId] = sceneShots.map(shot => {
            const existingShot = shotMap.get(shot.id);
            const { soundEffectUrl, soundEffectDescription, ...shotWithoutAudio } = shot;
            
            // CRITICAL: Use currentVersionId from step3Data if available (backend updates it there)
            const currentVersionId = step3ShotsMap.get(shot.id) || shot.currentVersionId;
            
            return {
              ...shotWithoutAudio,
              currentVersionId, // Use synced version from step3Data
              createdAt: shot.createdAt ? new Date(shot.createdAt) : new Date(),
              updatedAt: shot.updatedAt ? new Date(shot.updatedAt) : new Date(),
              // Preserve loopCount from existing state (from step5Data if already restored)
              loopCount: existingShot?.loopCount ?? shot.loopCount,
              // Only preserve audio from existing state (step5Data), never from step4Data
              soundEffectDescription: existingShot?.soundEffectDescription,
              soundEffectUrl: existingShot?.soundEffectUrl,
            };
          });
        });
        console.log('[AmbientWorkflow] Loaded shots from step4Data (with step3 currentVersionId):', 
          Object.entries(restoredShots).map(([sceneId, shots]) => ({
            sceneId,
            shots: shots.map(s => ({ id: s.id, currentVersionId: s.currentVersionId })),
          }))
        );
        return restoredShots;
      });
    } else if (data.shots && typeof data.shots === 'object') {
      setShots(prev => {
        const restoredShots: { [sceneId: string]: Shot[] } = {};
        Object.entries(data.shots as Record<string, Shot[]>).forEach(([sceneId, sceneShots]) => {
          // CRITICAL: Strip audio fields from step3Data - they don't belong there
          // Only preserve audio from existing state (which comes from step5Data)
          const existingShots = prev[sceneId] || [];
          const shotMap = new Map(existingShots.map(s => [s.id, s]));
          restoredShots[sceneId] = sceneShots.map(shot => {
            const existingShot = shotMap.get(shot.id);
            const { soundEffectUrl, soundEffectDescription, ...shotWithoutAudio } = shot;
            return {
              ...shotWithoutAudio,
              createdAt: shot.createdAt ? new Date(shot.createdAt) : new Date(),
              updatedAt: shot.updatedAt ? new Date(shot.updatedAt) : new Date(),
              // Preserve loopCount from existing state (from step5Data if already restored)
              loopCount: existingShot?.loopCount ?? shot.loopCount,
              // Only preserve audio from existing state (step5Data), never from step3Data
              soundEffectDescription: existingShot?.soundEffectDescription,
              soundEffectUrl: existingShot?.soundEffectUrl,
            };
          });
        });
        console.log('[AmbientWorkflow] Loaded shots from step3Data (stripped audio fields):', 
          Object.entries(restoredShots).map(([sceneId, shots]) => ({
            sceneId,
            shots: shots.map(s => ({ id: s.id, loopCount: s.loopCount })),
          }))
        );
        return restoredShots;
      });
    }
    
    // Restore continuity groups (always from step3Data)
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
      console.log('[AmbientWorkflow] No continuity groups to restore');
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
  }, [initialStep3Data, initialStep4Data, videoId, initializedForVideoId, step3Initialized]);

  // Restore Step 4 (Composition) data - only shotVersions now (scenes/shots handled in step3 restore)
  useEffect(() => {
    console.log('[AmbientWorkflow] Step4 restore check:', {
      hasInitialStep4Data: !!initialStep4Data,
      initialStep4DataKeys: initialStep4Data ? Object.keys(initialStep4Data) : [],
      hasShotVersions: !!(initialStep4Data as any)?.shotVersions,
      shotVersionsCount: (initialStep4Data as any)?.shotVersions ? Object.keys((initialStep4Data as any).shotVersions).length : 0,
      videoId,
      initializedForVideoId,
      step3Initialized,
      step4Initialized,
    });
    
    if (!videoId) {
      console.log('[AmbientWorkflow] No videoId yet - waiting...');
      return;
    }
    
    if (initializedForVideoId !== videoId) {
      console.log('[AmbientWorkflow] Waiting for step1 to initialize before step4');
      return;
    }
    
    // Wait for step3Data to be initialized first (scenes/shots already restored there)
    if (!step3Initialized) {
      console.log('[AmbientWorkflow] Waiting for step3 to initialize before step4');
      return;
    }
    
    if (step4Initialized) {
      console.log('[AmbientWorkflow] Step4 already initialized');
      return;
    }
    
    // Handle case where there's no step4Data yet (new video or prompts not generated)
    if (!initialStep4Data || Object.keys(initialStep4Data).length === 0) {
      console.log('[AmbientWorkflow] No step4 data yet - allowing defaults initialization');
      setStep4Initialized(true);
      return;
    }
    
    const data = initialStep4Data;
    console.log('[AmbientWorkflow] Restoring step4 shotVersions');
    
    // Restore shot versions with prompts (the main purpose of step4Data)
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
      });
    } else {
      console.log('[AmbientWorkflow] No shotVersions found in step4Data');
    }
    
    // NOTE: scenes/shots are already restored in step3 useEffect (preferring step4Data when available)
    // No need to merge here - step4Data.scenes/shots are used directly
    
    setStep4Initialized(true);
    console.log('[AmbientWorkflow] Step4 data restored successfully');
  }, [initialStep4Data, videoId, initializedForVideoId, step3Initialized, step4Initialized]);

  // CRITICAL: Re-run validation after step4 data is restored
  // This ensures the continue button state is correct on page load
  useEffect(() => {
    if (step4Initialized && activeStep === 4) {
      console.log('[AmbientWorkflow] Step4 initialized - triggering validation check');
      const allShots = Object.values(shots).flat();
      
      // In image-transitions mode, we only need images (Shotstack creates videos from them)
      // In other modes, we need actual video files
      const shotsWithoutVideos = allShots.filter(shot => {
        const versions = shotVersions[shot.id];
        const version = versions?.[versions?.length - 1];
        
        // For image-transitions mode, check if image exists
        if (animationMode === 'image-transitions') {
          return !version?.imageUrl;
        }
        
        // For other modes, check if video exists
        const hasVideo = version?.videoUrl && 
                         typeof version.videoUrl === 'string' && 
                         version.videoUrl.trim().length > 0;
        return !hasVideo;
      });
      
      const isValid = allShots.length > 0 && shotsWithoutVideos.length === 0;
      console.log('[AmbientWorkflow] Post-restoration validation:', {
        totalShots: allShots.length,
        missingVideos: shotsWithoutVideos.length,
        animationMode,
        isValid,
      });
      onValidationChange?.(isValid);
    }
  }, [step4Initialized, activeStep, shots, shotVersions, animationMode]);

  // CRITICAL: Re-run validation after step5 data is restored
  // This ensures the continue button state is correct on page load
  useEffect(() => {
    if (step5Initialized && activeStep === 5) {
      console.log('[AmbientWorkflow] Step5 initialized - triggering validation check');
      
      // Get step5Data for voiceover and music
      const step5Data = initialStep5Data as { 
        voiceoverScript?: string; 
        voiceoverAudioUrl?: string;
        generatedMusicUrl?: string;
        generatedMusicDuration?: number;
      } | undefined;
      
      // Get step2Data for custom music
      const step2DataMusic = initialStep2Data as {
        hasCustomMusic?: boolean;
        customMusicUrl?: string;
        musicStyle?: string;
      } | undefined;
      
      const validationResults = {
        loopLocked: true,
        voiceoverGenerated: true,
        musicGenerated: true,
        allSoundEffectsGenerated: true,
      };
      
      // Check loop settings lock
      if (loopMode) {
        validationResults.loopLocked = loopSettingsLocked;
      }
      
      // Check voiceover - use sessionVoiceoverUrl if available (generated during session), 
      // otherwise fall back to initialStep5Data (loaded from database)
      if (voiceoverEnabled) {
        const voiceoverUrl = sessionVoiceoverUrl || step5Data?.voiceoverAudioUrl;
        validationResults.voiceoverGenerated = !!(voiceoverUrl && 
                                                   typeof voiceoverUrl === 'string' && 
                                                   voiceoverUrl.trim().length > 0);
      }
      
      // Check music - use sessionMusicUrl if available (generated during session),
      // otherwise fall back to initialStep5Data (loaded from database)
      if (backgroundMusicEnabled) {
        const hasCustomMusic = !!(step2DataMusic?.hasCustomMusic && 
                               step2DataMusic?.customMusicUrl && 
                               typeof step2DataMusic.customMusicUrl === 'string' && 
                               step2DataMusic.customMusicUrl.trim().length > 0);
        const generatedMusicUrl = sessionMusicUrl || step5Data?.generatedMusicUrl;
        const hasGeneratedMusic = !!(generatedMusicUrl && 
                                  typeof generatedMusicUrl === 'string' && 
                                  generatedMusicUrl.trim().length > 0);
        validationResults.musicGenerated = hasCustomMusic || hasGeneratedMusic;
      }
      
      // Check sound effects
      const allShots = Object.values(shots).flat();
      if (allShots.length > 0) {
        const shotsWithoutSoundEffects = allShots.filter(shot => {
          const hasSoundEffect = shot.soundEffectUrl && 
                                 typeof shot.soundEffectUrl === 'string' && 
                                 shot.soundEffectUrl.trim().length > 0;
          return !hasSoundEffect;
        });
        validationResults.allSoundEffectsGenerated = shotsWithoutSoundEffects.length === 0;
      }
      
      const isValid = validationResults.loopLocked && 
                      validationResults.voiceoverGenerated && 
                      validationResults.musicGenerated && 
                      validationResults.allSoundEffectsGenerated;
      
      console.log('[AmbientWorkflow] Post-restoration validation (Step 5):', {
        ...validationResults,
        isValid,
        sessionVoiceoverUrl: !!sessionVoiceoverUrl,
        sessionMusicUrl: !!sessionMusicUrl,
        initialVoiceoverUrl: !!step5Data?.voiceoverAudioUrl,
        initialMusicUrl: !!step5Data?.generatedMusicUrl,
      });
      onValidationChange?.(isValid);
    }
  }, [step5Initialized, activeStep, loopMode, loopSettingsLocked, voiceoverEnabled, backgroundMusicEnabled, shots, initialStep5Data, initialStep2Data, sessionVoiceoverUrl, sessionMusicUrl]);

  // Restore Step 5 (Soundscape) data - loop counts, lock state
  // This MUST run after step4 is initialized
  useEffect(() => {
    console.log('[AmbientWorkflow] Step5 restoration useEffect triggered:', {
      hasInitialStep5Data: !!initialStep5Data,
      videoId,
      initializedForVideoId,
      step4Initialized,
      step5DataApplied: step5DataAppliedRef.current,
    });
    
    if (!initialStep5Data || !videoId) {
      console.log('[AmbientWorkflow] Step5 restoration skipped: missing initialStep5Data or videoId');
      return;
    }
    if (initializedForVideoId !== videoId) {
      console.log('[AmbientWorkflow] Step5 restoration skipped: videoId mismatch');
      return;
    }
    if (!step4Initialized) {
      console.log('[AmbientWorkflow] Waiting for step4 to initialize before step5');
      return;
    }
    
    // Check if we already have the correct loop counts applied
    // If scenes/shots already have loopCount values that match step5Data, skip restoration
    const data = initialStep5Data as {
      scenesWithLoops?: Scene[];
      shotsWithLoops?: Record<string, Shot[]>;
      loopSettingsLocked?: boolean;
    };
    
    // Skip if already applied AND data matches (to avoid unnecessary re-applications)
    if (step5DataAppliedRef.current) {
      // Check if current state matches step5Data - if so, skip
      const scenesMatch = !data.scenesWithLoops || scenes.every(scene => {
        const step5Scene = data.scenesWithLoops!.find(s => s.id === scene.id);
        return !step5Scene || scene.loopCount === step5Scene.loopCount;
      });
      const shotsMatch = !data.shotsWithLoops || Object.entries(shots).every(([sceneId, sceneShots]) => {
        const step5Shots = data.shotsWithLoops![sceneId];
        if (!step5Shots) return true;
        return sceneShots.every(shot => {
          const step5Shot = step5Shots.find(s => s.id === shot.id);
          return !step5Shot || shot.loopCount === step5Shot.loopCount;
        });
      });
      
      if (scenesMatch && shotsMatch) {
        console.log('[AmbientWorkflow] Step5 restoration skipped: data already matches step5Data');
        return;
      } else {
        console.log('[AmbientWorkflow] Step5 restoration needed: data mismatch detected', {
          scenesMatch,
          shotsMatch,
        });
        // Reset the flag so we can re-apply
        step5DataAppliedRef.current = false;
      }
    }

    console.log('[AmbientWorkflow] Step5 restore check:', {
      hasInitialStep5Data: !!initialStep5Data,
      hasScenesWithLoops: !!data.scenesWithLoops,
      scenesWithLoopsCount: data.scenesWithLoops?.length,
      sceneLoopCounts: data.scenesWithLoops?.map(s => ({ 
        id: s.id, 
        sceneNumber: s.sceneNumber,
        loopCount: s.loopCount,
        loopCountType: typeof s.loopCount,
      })),
      hasShotsWithLoops: !!data.shotsWithLoops,
      shotsWithLoopsScenes: data.shotsWithLoops ? Object.keys(data.shotsWithLoops) : [],
      shotLoopCounts: data.shotsWithLoops ? Object.entries(data.shotsWithLoops).map(([sceneId, shots]) => ({
        sceneId,
        shots: shots.map(s => ({ 
          id: s.id, 
          shotNumber: s.shotNumber,
          loopCount: s.loopCount,
          loopCountType: typeof s.loopCount,
        })),
      })) : [],
      loopSettingsLocked: data.loopSettingsLocked,
      currentScenesCount: scenes.length,
      currentShotsCount: Object.keys(shots).length,
      currentSceneLoopCounts: scenes.map(s => ({ id: s.id, loopCount: s.loopCount })),
      currentShotLoopCounts: Object.entries(shots).map(([sceneId, sceneShots]) => ({
        sceneId,
        shots: sceneShots.map(s => ({ id: s.id, loopCount: s.loopCount })),
      })),
    });

    // Restore loop settings lock state
    if (data.loopSettingsLocked !== undefined) {
      setLoopSettingsLocked(data.loopSettingsLocked);
    }

    // Apply loop counts from step5Data directly to scenes/shots
    // This MUST happen after step4 is initialized to ensure scenes/shots exist
    if (data.scenesWithLoops && data.scenesWithLoops.length > 0) {
      setScenes(prev => {
        // Create a map of ALL scene data from step5Data (not just loopCount)
        const step5SceneMap = new Map(
          data.scenesWithLoops!.map(s => [s.id, s])
        );
        console.log('[AmbientWorkflow] Applying step5Data loop counts to scenes:', {
          step5ScenesCount: data.scenesWithLoops!.length,
          currentScenesCount: prev.length,
          step5SceneIds: Array.from(step5SceneMap.keys()),
          currentSceneIds: prev.map(s => s.id),
        });
        // Apply step5Data loop counts directly, preserving other scene fields
        const updated = prev.map(scene => {
          const step5Scene = step5SceneMap.get(scene.id);
          if (step5Scene && typeof step5Scene.loopCount === 'number') {
            console.log(`[AmbientWorkflow] Applying loopCount ${step5Scene.loopCount} to scene ${scene.sceneNumber} (${scene.id})`);
            return {
              ...scene,
              loopCount: step5Scene.loopCount,
            };
          } else {
            console.warn(`[AmbientWorkflow] Scene ${scene.sceneNumber} (${scene.id}) not found in step5Data or has invalid loopCount`);
          }
          return scene;
        });
        console.log('[AmbientWorkflow] Scene loop counts after restoration:', 
          updated.map(s => ({ 
            id: s.id, 
            sceneNumber: s.sceneNumber,
            loopCount: s.loopCount,
            loopCountType: typeof s.loopCount,
          }))
        );
        return updated;
      });
    } else {
      console.warn('[AmbientWorkflow] No scenesWithLoops in step5Data to restore');
    }

    if (data.shotsWithLoops && Object.keys(data.shotsWithLoops).length > 0) {
      setShots(prev => {
        const newShots = { ...prev };
        console.log('[AmbientWorkflow] Applying step5Data loop counts to shots:', {
          step5ShotsScenes: Object.keys(data.shotsWithLoops!),
          currentShotsScenes: Object.keys(prev),
          step5ShotsCount: Object.values(data.shotsWithLoops!).flat().length,
          currentShotsCount: Object.values(prev).flat().length,
        });
        // Apply step5Data loop counts and soundscape data directly
        for (const sceneId of Object.keys(data.shotsWithLoops!)) {
          const step5Shots = data.shotsWithLoops![sceneId] || [];
          // Create a map of shot data from step5Data
          const step5ShotMap = new Map(
            step5Shots.map(s => [s.id, s])
          );
          if (newShots[sceneId]) {
            newShots[sceneId] = newShots[sceneId].map(shot => {
              const step5Shot = step5ShotMap.get(shot.id);
              if (step5Shot && typeof step5Shot.loopCount === 'number') {
                console.log(`[AmbientWorkflow] Applying loopCount ${step5Shot.loopCount} to shot ${shot.shotNumber} (${shot.id}) in scene ${sceneId}`);
                // Apply step5Data values directly, preserving other shot fields
                return {
                  ...shot,
                  loopCount: step5Shot.loopCount,
                  soundEffectDescription: step5Shot.soundEffectDescription !== undefined 
                    ? step5Shot.soundEffectDescription 
                    : shot.soundEffectDescription,
                  soundEffectUrl: step5Shot.soundEffectUrl !== undefined 
                    ? step5Shot.soundEffectUrl 
                    : shot.soundEffectUrl,
                };
              } else {
                console.warn(`[AmbientWorkflow] Shot ${shot.shotNumber} (${shot.id}) in scene ${sceneId} not found in step5Data or has invalid loopCount`);
              }
              return shot;
            });
            console.log('[AmbientWorkflow] Scene', sceneId, 'shot loop counts after restoration:', 
              newShots[sceneId].map(s => ({ 
                id: s.id, 
                shotNumber: s.shotNumber,
                loopCount: s.loopCount,
                loopCountType: typeof s.loopCount,
              }))
            );
          } else {
            console.warn('[AmbientWorkflow] Scene', sceneId, 'not found in current shots state');
          }
        }
        return newShots;
      });
    } else {
      console.warn('[AmbientWorkflow] No shotsWithLoops in step5Data to restore');
    }

    step5DataAppliedRef.current = true;
    // Don't set step5Initialized here - it should only be set when we're actually on step 5
    // This prevents step5Data from being saved when we're on other steps
    console.log('[AmbientWorkflow] Step5 data restored successfully');
  }, [initialStep5Data, videoId, initializedForVideoId, step4Initialized]);
  
  // NOTE: Removed the useEffect that re-applied step5Data on scenes/shots changes
  // This was causing loop counts to revert immediately when users tried to edit them
  // Loop counts should only be restored when opening step 5 (first useEffect above), not on every state change
  // Users can freely edit loop counts before locking, and they will be saved when lock is pressed

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
          // Background Music toggle (music style/url is in step2Data)
          backgroundMusicEnabled,
          // Voiceover settings
          voiceoverEnabled,
          voiceoverStory,
          voiceId,
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
          // Background Music settings
          musicStyle,
          customMusicUrl,
          customMusicDuration,
          hasCustomMusic,
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
  // Note: Continuity is only required for "start-end-frame" mode where shots need to connect visually
  // "image-transitions" and "image-reference" modes don't require continuity
  const allGroups = Object.values(continuityGroups).flat();
  const totalProposedGroups = allGroups.filter(g => g.status === 'proposed').length;
  const totalApprovedGroups = allGroups.filter(g => g.status === 'approved').length;
  const hasContinuityData = continuityGenerated || allGroups.length > 0;
  const canContinueStep3 = animationMode === 'image-transitions' || videoGenerationMode === 'image-reference'
    ? true  // Image-transitions and image-reference modes don't require continuity
    : (hasContinuityData && continuityLocked && totalProposedGroups === 0 && totalApprovedGroups > 0);
  
  console.log('[AmbientWorkflow] Step 3 validation:', {
    activeStep,
    animationMode,
    videoGenerationMode,
    continuityLocked,
    continuityGenerated,
    totalProposedGroups,
    totalApprovedGroups,
    hasContinuityData,
    canContinueStep3,
  });
  
  // Determine canContinue based on active step
  // Note: Steps 4 and 5 have their own validation logic handled separately
  const canContinue = activeStep === 1 
    ? canContinueStep1 
    : activeStep === 3 
      ? canContinueStep3 
      : true;  // Steps 2 has no validation, steps 4 and 5 are handled separately

  // Notify parent when validation state changes for steps 1, 2, 3
  // Steps 4 and 5 have their own validation useEffect below
  useEffect(() => {
    // Skip steps 4 and 5 - they have dedicated validation logic
    if (activeStep === 4 || activeStep === 5) {
      return;
    }
    
    // Recalculate validation values for logging
    const hasDesc = moodDescription.trim().length > 0;
    const settingsChanged = descriptionSettingsSnapshot !== null && (
      descriptionSettingsSnapshot.mood !== mood ||
      descriptionSettingsSnapshot.theme !== theme ||
      descriptionSettingsSnapshot.timeContext !== timeContext ||
      descriptionSettingsSnapshot.season !== season ||
      descriptionSettingsSnapshot.duration !== duration
    );
    
    // Calculate continuity groups stats for logging
    const allGroups = Object.values(continuityGroups).flat();
    const totalProposed = allGroups.filter(g => g.status === 'proposed').length;
    const totalApproved = allGroups.filter(g => g.status === 'approved').length;
    
    console.log('[AmbientWorkflow] Validation state changed (steps 1-3), notifying parent:', {
      activeStep,
      canContinue,
      hasDescription: hasDesc,
      settingsChangedSinceDescription: settingsChanged,
      moodDescriptionLength: moodDescription.length,
      mood,
      theme,
      timeContext,
      season,
      duration,
      hasSnapshot: descriptionSettingsSnapshot !== null,
      continuityLocked,
      totalProposedGroups: totalProposed,
      totalApprovedGroups: totalApproved,
      videoGenerationMode,
    });
    onValidationChange?.(canContinue);
  }, [
    // Include all state variables that affect canContinue
    canContinue,
    activeStep,
    moodDescription,
    mood,
    theme,
    timeContext,
    season,
    duration,
    descriptionSettingsSnapshot,
    continuityGroups,
    continuityLocked,
    continuityGenerated,
    animationMode,
    videoGenerationMode,
    onValidationChange,
  ]);

  useImperativeHandle(ref, () => ({
    saveCurrentStep: async () => {
      if (activeStep === 1) {
        return saveStep1Data();
      }
      if (activeStep === 2) {
        return saveStep2Data();
      }
      if (activeStep === 3) {
        // For step 3, save data AND generate prompts for ALL animation modes
        const saved = await saveStep3Data();
        if (!saved) return false;
        
        // Generate prompts for ALL animation modes before allowing navigation
        // - image-transitions: generates imagePrompt only
        // - video-animation: generates startFramePrompt, videoPrompt, and optionally endFramePrompt
        setIsGeneratingPrompts(true);
        onSaveStateChange?.(true);
        
        try {
          console.log('[AmbientWorkflow] saveCurrentStep: Generating prompts for all shots, mode:', animationMode);
          
          // Run Agent 4.1 for all shots (works for both image-transitions and video-animation)
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
              
              // CRITICAL: Update shots' currentVersionId to match the actual version IDs
              // This fixes the mismatch where shots have old currentVersionId but versions have new IDs
              setShots(prevShots => {
                const updatedShots: Record<string, Shot[]> = {};
                Object.entries(prevShots).forEach(([sceneId, sceneShots]) => {
                  updatedShots[sceneId] = sceneShots.map((shot: Shot) => {
                    const versions = restoredVersions[shot.id];
                    if (versions && versions.length > 0) {
                      const latestVersionId = versions[versions.length - 1].id;
                      // Only update if currentVersionId doesn't match
                      if (shot.currentVersionId !== latestVersionId) {
                        console.log(`[AmbientWorkflow] Updating currentVersionId for shot ${shot.shotNumber}:`, {
                          old: shot.currentVersionId,
                          new: latestVersionId,
                        });
                        return { ...shot, currentVersionId: latestVersionId };
                      }
                    }
                    return shot;
                  });
                });
                return updatedShots;
              });
              
              // Log detailed version info for debugging
              // For image-transitions: check imagePrompt; for video-animation: check startFramePrompt
              const sampleShotId = Object.keys(restoredVersions)[0];
              const sampleVersion = restoredVersions[sampleShotId]?.[0];
              console.log('[AmbientWorkflow] Loaded shot versions after generation:', {
                shotCount: Object.keys(restoredVersions).length,
                sampleVersions: Object.values(restoredVersions)[0]?.length || 0,
                animationMode,
                samplePromptLength: animationMode === 'image-transitions'
                  ? (Object.values(restoredVersions)[0]?.[0]?.imagePrompt?.length || 0)
                  : (Object.values(restoredVersions)[0]?.[0]?.startFramePrompt?.length || 0),
                sampleShotId,
                sampleVersionId: sampleVersion?.id,
                samplePromptPreview: animationMode === 'image-transitions'
                  ? sampleVersion?.imagePrompt?.substring(0, 50)
                  : sampleVersion?.startFramePrompt?.substring(0, 50),
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
      // For other steps, return true (no save needed yet)
      return true;
    },
    goToNextStep: async () => {
      await goToNextStep();
    },
    getCurrentVolumes: async () => {
      // Get volumes from PreviewTab ref
      if (previewTabRef.current?.getCurrentVolumes) {
        return previewTabRef.current.getCurrentVolumes();
      }
      return null;
    },
      isSaving: isSaving || isGeneratingPrompts,
      canContinue,
      isGeneratingFlowDesign,
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

  // Calculate if all videos are generated (for step 4 validation)
  // For image-transitions mode, check images instead of videos
  const allVideosGenerated = useMemo(() => {
    if (activeStep !== 4) return true; // Not in composition phase, allow continue
    
    const allShots = Object.values(shots).flat();
    if (allShots.length === 0) {
      console.log('[AmbientWorkflow] No shots yet - cannot continue');
      return false; // No shots yet
    }
    
    // For image-transitions mode, check images instead of videos
    if (animationMode === 'image-transitions') {
      const shotsWithImages: string[] = [];
      const shotsWithoutImages: string[] = [];
      
      allShots.forEach(shot => {
        const versions = shotVersions[shot.id];
        const version = versions?.[versions?.length - 1];
        const hasImage = version?.imageUrl && 
                         typeof version.imageUrl === 'string' && 
                         version.imageUrl.trim().length > 0;
        
        if (hasImage) {
          shotsWithImages.push(shot.id);
        } else {
          shotsWithoutImages.push(shot.id);
        }
      });
      
      const allShotsHaveImages = shotsWithoutImages.length === 0;
      
      console.log('[AmbientWorkflow] Step 4 image validation (image-transitions):', {
        totalShots: allShots.length,
        shotsWithImages: shotsWithImages.length,
        shotsWithoutImages: shotsWithoutImages.length,
        missingImageShotIds: shotsWithoutImages,
        canContinue: allShotsHaveImages,
      });
      
      return allShotsHaveImages;
    }
    
    // For video-animation mode, check if all shots have videos
    const shotsWithVideos: string[] = [];
    const shotsWithoutVideos: string[] = [];
    
    allShots.forEach(shot => {
      const versions = shotVersions[shot.id];
      const version = versions?.[versions?.length - 1];
      const hasVideo = version?.videoUrl && 
                       typeof version.videoUrl === 'string' && 
                       version.videoUrl.trim().length > 0;
      
      if (hasVideo) {
        shotsWithVideos.push(shot.id);
      } else {
        shotsWithoutVideos.push(shot.id);
      }
    });
    
    const allShotsHaveVideos = shotsWithoutVideos.length === 0;
    
    console.log('[AmbientWorkflow] Step 4 video validation:', {
      totalShots: allShots.length,
      shotsWithVideos: shotsWithVideos.length,
      shotsWithoutVideos: shotsWithoutVideos.length,
      missingVideoShotIds: shotsWithoutVideos,
      canContinue: allShotsHaveVideos,
    });
    
    return allShotsHaveVideos;
  }, [activeStep, animationMode, shots, shotVersions]);

  // Calculate if step 5 (Soundscape) requirements are met
  const step5RequirementsMet = useMemo(() => {
    if (activeStep !== 5) return true; // Not in soundscape phase, allow continue
    
    // Get step5Data for voiceover and music
    const step5Data = initialStep5Data as { 
      voiceoverScript?: string; 
      voiceoverAudioUrl?: string;
      generatedMusicUrl?: string;
      generatedMusicDuration?: number;
    } | undefined;
    
    // Get step2Data for custom music
    const step2DataMusic = initialStep2Data as {
      hasCustomMusic?: boolean;
      customMusicUrl?: string;
      musicStyle?: string;
    } | undefined;
    
    const validationResults = {
      loopLocked: true, // Default to true if loop mode is disabled
      voiceoverGenerated: true, // Default to true if voiceover is disabled
      musicGenerated: true, // Default to true if music is disabled
      allSoundEffectsGenerated: true, // Default to true if no shots
    };
    
    // 1. Check loop settings lock (if loop mode is enabled)
    if (loopMode) {
      validationResults.loopLocked = loopSettingsLocked;
      if (!loopSettingsLocked) {
        console.log('[AmbientWorkflow] Step 5 validation failed: Loop mode enabled but settings not locked');
      }
    }
    
    // 2. Check voiceover (if voiceover is enabled)
    // Use sessionVoiceoverUrl if available, otherwise fall back to initialStep5Data
    if (voiceoverEnabled) {
      const voiceoverUrl = sessionVoiceoverUrl || step5Data?.voiceoverAudioUrl;
      const hasVoiceover = !!(voiceoverUrl && 
                           typeof voiceoverUrl === 'string' && 
                           voiceoverUrl.trim().length > 0);
      validationResults.voiceoverGenerated = hasVoiceover;
      if (!hasVoiceover) {
        console.log('[AmbientWorkflow] Step 5 validation failed: Voiceover enabled but not generated');
      }
    }
    
    // 3. Check music (if background music is enabled)
    // Use sessionMusicUrl if available, otherwise fall back to initialStep5Data
    if (backgroundMusicEnabled) {
      const hasCustomMusic = !!(step2DataMusic?.hasCustomMusic && 
                             step2DataMusic?.customMusicUrl && 
                             typeof step2DataMusic.customMusicUrl === 'string' && 
                             step2DataMusic.customMusicUrl.trim().length > 0);
      const generatedMusicUrl = sessionMusicUrl || step5Data?.generatedMusicUrl;
      const hasGeneratedMusic = !!(generatedMusicUrl && 
                                typeof generatedMusicUrl === 'string' && 
                                generatedMusicUrl.trim().length > 0);
      validationResults.musicGenerated = hasCustomMusic || hasGeneratedMusic;
      if (!validationResults.musicGenerated) {
        console.log('[AmbientWorkflow] Step 5 validation failed: Background music enabled but not generated/uploaded');
      }
    }
    
    // 4. Check sound effects for all shots (only for video-animation mode)
    // Image-transitions mode doesn't have sound effects
    const isImageTransitions = animationMode === 'image-transitions';
    const allShots = Object.values(shots).flat();
    
    if (!isImageTransitions && allShots.length > 0) {
      const shotsWithoutSoundEffects = allShots.filter(shot => {
        const hasSoundEffect = shot.soundEffectUrl && 
                               typeof shot.soundEffectUrl === 'string' && 
                               shot.soundEffectUrl.trim().length > 0;
        return !hasSoundEffect;
      });
      
      validationResults.allSoundEffectsGenerated = shotsWithoutSoundEffects.length === 0;
      
      if (!validationResults.allSoundEffectsGenerated) {
        console.log('[AmbientWorkflow] Step 5 validation failed: Some shots missing sound effects:', {
          totalShots: allShots.length,
          missingSoundEffects: shotsWithoutSoundEffects.length,
          missingShotIds: shotsWithoutSoundEffects.map(s => s.id),
        });
      }
    } else if (isImageTransitions) {
      // Image-transitions mode: skip sound effects validation
      validationResults.allSoundEffectsGenerated = true;
      console.log('[AmbientWorkflow] Step 5 validation: Skipping sound effects check (image-transitions mode)');
    }
    
    const allMet = validationResults.loopLocked && 
                   validationResults.voiceoverGenerated && 
                   validationResults.musicGenerated && 
                   validationResults.allSoundEffectsGenerated;
    
    console.log('[AmbientWorkflow] Step 5 validation:', {
      animationMode,
      isImageTransitions,
      loopMode,
      loopSettingsLocked,
      voiceoverEnabled,
      backgroundMusicEnabled,
      totalShots: Object.values(shots).flat().length,
      ...validationResults,
      canContinue: allMet,
    });
    
    return allMet;
  }, [activeStep, animationMode, loopMode, loopSettingsLocked, voiceoverEnabled, backgroundMusicEnabled, shots, initialStep5Data, initialStep2Data, sessionVoiceoverUrl, sessionMusicUrl]);

  // Update validation state for steps 4 and 5 (Compose and Soundscape)
  // These steps have dynamic validation based on generated content
  useEffect(() => {
    // Only handle steps 4 and 5 - other steps are handled by the previous useEffect
    if (activeStep !== 4 && activeStep !== 5) {
      return;
    }
    
    console.log('[AmbientWorkflow] Step 4/5 validation useEffect triggered:', {
      activeStep,
      allVideosGenerated,
      step5RequirementsMet,
      hasCallback: !!onValidationChange,
    });
    
    if (activeStep === 4) {
      console.log('[AmbientWorkflow] Setting validation for step 4:', allVideosGenerated);
      onValidationChange?.(allVideosGenerated);
    } else if (activeStep === 5) {
      console.log('[AmbientWorkflow] Setting validation for step 5:', step5RequirementsMet);
      onValidationChange?.(step5RequirementsMet);
    }
  }, [activeStep, allVideosGenerated, step5RequirementsMet, onValidationChange]);

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
        // STEP 2 -> STEP 3 TRANSITION:
        // 1. Save step 2 data
        // 2. Show loading screen (before navigating)
        // 3. Run flow design generation
        // 4. After complete, navigate to step 3
        
        // Only generate if we don't already have scene data
        if (scenes.length === 0) {
            // Show loading screen and navigate to step 3 first
            setIsGeneratingFlowDesign(true);
            onGeneratingFlowDesignChange?.(true);
            onStepChange(activeStep + 1); // Navigate to step 3, which will show loading screen
          
          try {
            console.log('[AmbientWorkflow] Starting flow design generation before step 3');
            
            const response = await fetch('/api/ambient-visual/flow-design/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ videoId }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to generate flow design');
            }
            
            const data = await response.json() as { 
              scenes: Scene[]; 
              shots: { [sceneId: string]: Shot[] };
              shotVersions?: { [shotId: string]: ShotVersion[] };
              continuityGroups?: { [sceneId: string]: ContinuityGroup[] };
              totalDuration?: number;
              cost?: number;
            };
            
            console.log('[AmbientWorkflow] Flow design generated:', {
              sceneCount: data.scenes.length,
              shotCount: Object.values(data.shots).flat().length,
            });
            
            // Update state with generated data
            handleScenesGenerated(data.scenes, data.shots, data.shotVersions);
            
            // Update continuity groups if provided
            if (data.continuityGroups && handleContinuityGroupsChange) {
              handleContinuityGroupsChange(data.continuityGroups);
            }
            
            // NOTE: We don't call step/3/continue here during auto-generation
            // The step/3/continue endpoint should only be called when the user manually
            // clicks continue from step 3 to step 4 (via saveStep3Data)
            // The flow design data is already saved by the generate endpoint
          } catch (error) {
            console.error('[AmbientWorkflow] Flow design generation error:', error);
            toast({
              title: "Generation Failed",
              description: error instanceof Error ? error.message : 'Failed to generate flow design',
              variant: "destructive",
            });
            } finally {
              setIsGeneratingFlowDesign(false);
              onGeneratingFlowDesignChange?.(false);
            }
        } else {
          // Already have scenes, just navigate
          onStepChange(activeStep + 1);
        }
      }
    } else if (activeStep === 3) {
      // STEP 3 -> STEP 4 TRANSITION (per plan):
      // 1. Save step 3 data
      // 2. Show loading screen (before navigating)
      // 3. Run Agent 4.1 to generate all prompts
      // 4. After complete, navigate to step 4
      
      const success = await saveStep3Data();
      if (success) {
        // Generate prompts for ALL animation modes before showing step 4
        // - image-transitions: generates imagePrompt only
        // - video-animation: generates startFramePrompt, videoPrompt, and optionally endFramePrompt
        setIsGeneratingPrompts(true);
        
        try {
          // Run Agent 4.1 for all shots (works for both image-transitions and video-animation)
          console.log('[AmbientWorkflow] Starting prompt generation before step 4, mode:', animationMode);
          
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
              
              // CRITICAL: Update shots' currentVersionId to match the actual version IDs
              // This fixes the mismatch where shots have old currentVersionId but versions have new IDs
              setShots(prevShots => {
                const updatedShots: Record<string, Shot[]> = {};
                Object.entries(prevShots).forEach(([sceneId, sceneShots]) => {
                  updatedShots[sceneId] = sceneShots.map((shot: Shot) => {
                    const versions = restoredVersions[shot.id];
                    if (versions && versions.length > 0) {
                      const latestVersionId = versions[versions.length - 1].id;
                      // Only update if currentVersionId doesn't match
                      if (shot.currentVersionId !== latestVersionId) {
                        console.log(`[AmbientWorkflow] Updating currentVersionId for shot ${shot.shotNumber} (navigation):`, {
                          old: shot.currentVersionId,
                          new: latestVersionId,
                        });
                        return { ...shot, currentVersionId: latestVersionId };
                      }
                    }
                    return shot;
                  });
                });
                return updatedShots;
              });
              
              // Log detailed version info for debugging
              // For image-transitions: check imagePrompt; for video-animation: check startFramePrompt
              const sampleShotId = Object.keys(restoredVersions)[0];
              const sampleVersion = restoredVersions[sampleShotId]?.[0];
              console.log('[AmbientWorkflow] Loaded shot versions before navigation:', {
                shotCount: Object.keys(restoredVersions).length,
                sampleVersions: Object.values(restoredVersions)[0]?.length || 0,
                animationMode,
                samplePromptLength: animationMode === 'image-transitions'
                  ? (Object.values(restoredVersions)[0]?.[0]?.imagePrompt?.length || 0)
                  : (Object.values(restoredVersions)[0]?.[0]?.startFramePrompt?.length || 0),
                sampleShotId,
                sampleVersionId: sampleVersion?.id,
                samplePromptPreview: animationMode === 'image-transitions'
                  ? sampleVersion?.imagePrompt?.substring(0, 50)
                  : sampleVersion?.startFramePrompt?.substring(0, 50),
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
      }
    } else if (activeStep === 4) {
      // STEP 4 -> STEP 5 TRANSITION (Composition -> Soundscape)
      // Update database with currentStep and completedSteps
      if (!videoId || videoId === 'new') {
        toast({
          title: "Error",
          description: "Cannot continue - no video ID available.",
          variant: "destructive",
        });
        return;
      }

      if (!allVideosGenerated) {
        const isImageTransitions = animationMode === 'image-transitions';
        toast({
          title: isImageTransitions ? "Images Required" : "Videos Required",
          description: isImageTransitions 
            ? "Please generate all images before continuing."
            : "Please generate all videos before continuing.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsSaving(true);
        onSaveStateChange?.(true);
        const response = await fetch(`/api/ambient-visual/videos/${videoId}/step/4/continue-to-5`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update step');
        }

        const updated = await response.json();
        const step5Data = updated.step5Data as {
          scenesWithLoops?: Scene[];
          shotsWithLoops?: Record<string, Shot[]>;
          loopSettingsLocked?: boolean;
        } | undefined;
        
        console.log('[AmbientWorkflow] Step 4 completed, moving to step 5:', {
          videoId: updated.id,
          step5Data: step5Data,
          scenesWithLoops: step5Data?.scenesWithLoops?.length,
          shotsWithLoops: step5Data?.shotsWithLoops ? Object.keys(step5Data.shotsWithLoops).length : 0,
          sampleSceneLoop: step5Data?.scenesWithLoops?.[0]?.loopCount,
          sampleShotLoop: step5Data?.shotsWithLoops ? Object.values(step5Data.shotsWithLoops)[0]?.[0]?.loopCount : undefined,
        });

        // CRITICAL: Apply loop counts directly from the API response
        // This ensures we use the freshly initialized data from the backend
        // instead of waiting for refetch and restoration
        if (step5Data?.scenesWithLoops && step5Data.scenesWithLoops.length > 0) {
          console.log('[AmbientWorkflow] Applying loop counts directly from API response (scenes):', 
            step5Data.scenesWithLoops.map(s => ({ id: s.id, loopCount: s.loopCount }))
          );
          setScenes(prev => {
            const step5SceneMap = new Map(step5Data.scenesWithLoops!.map(s => [s.id, s]));
            return prev.map(scene => {
              const step5Scene = step5SceneMap.get(scene.id);
              if (step5Scene && typeof step5Scene.loopCount === 'number') {
                return { ...scene, loopCount: step5Scene.loopCount };
              }
              return scene;
            });
          });
        }

        if (step5Data?.shotsWithLoops && Object.keys(step5Data.shotsWithLoops).length > 0) {
          console.log('[AmbientWorkflow] Applying loop counts directly from API response (shots):', 
            Object.entries(step5Data.shotsWithLoops).map(([sceneId, shots]) => ({
              sceneId,
              shots: shots.map(s => ({ id: s.id, loopCount: s.loopCount })),
            }))
          );
          setShots(prev => {
            const newShots = { ...prev };
            for (const sceneId of Object.keys(step5Data.shotsWithLoops!)) {
              const step5Shots = step5Data.shotsWithLoops![sceneId] || [];
              const step5ShotMap = new Map(step5Shots.map(s => [s.id, s]));
              if (newShots[sceneId]) {
                newShots[sceneId] = newShots[sceneId].map(shot => {
                  const step5Shot = step5ShotMap.get(shot.id);
                  if (step5Shot && typeof step5Shot.loopCount === 'number') {
                    return {
                      ...shot,
                      loopCount: step5Shot.loopCount,
                      soundEffectDescription: step5Shot.soundEffectDescription,
                      soundEffectUrl: step5Shot.soundEffectUrl,
                    };
                  }
                  return shot;
                });
              }
            }
            return newShots;
          });
        }

        if (step5Data?.loopSettingsLocked !== undefined) {
          setLoopSettingsLocked(step5Data.loopSettingsLocked);
        }

        // Reset the applied flag so restoration can run again if needed (e.g., after page refresh)
        // But mark it as applied now since we just applied the data directly
        step5DataAppliedRef.current = true;

        // Update local state - this will trigger onStepChange which updates the page component
        // NOTE: The parent component should refetch video data after this to get updated step5Data
        onStepChange(5);
      } catch (error) {
        console.error('[AmbientWorkflow] Failed to continue from step 4:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to continue. Please try again.",
          variant: "destructive",
        });
        throw error; // Re-throw so the page component knows it failed
      } finally {
        setIsSaving(false);
        onSaveStateChange?.(false);
      }
    } else if (activeStep === 5) {
      // STEP 5 -> STEP 6 TRANSITION (Soundscape -> Preview)
      // Initialize Step6Data with timeline from scenes/shots/audio
      if (!videoId || videoId === 'new') {
        toast({
          title: "Error",
          description: "Cannot continue - no video ID available.",
          variant: "destructive",
        });
        return;
      }

      // Validate step 5 requirements before continuing
      if (!step5RequirementsMet) {
        const step5Data = initialStep5Data as { 
          voiceoverAudioUrl?: string;
          generatedMusicUrl?: string;
        } | undefined;
        const step2DataMusic = initialStep2Data as {
          hasCustomMusic?: boolean;
          customMusicUrl?: string;
        } | undefined;
        
        const allShots = Object.values(shots).flat();
        const missingRequirements: string[] = [];
        
        if (loopMode && !loopSettingsLocked) {
          missingRequirements.push("Lock your loop settings");
        }
        if (voiceoverEnabled && !step5Data?.voiceoverAudioUrl) {
          missingRequirements.push("Generate voiceover");
        }
        if (backgroundMusicEnabled && !step2DataMusic?.customMusicUrl && !step5Data?.generatedMusicUrl) {
          missingRequirements.push("Generate or upload background music");
        }
        const shotsWithoutSoundEffects = allShots.filter(shot => !shot.soundEffectUrl);
        if (shotsWithoutSoundEffects.length > 0) {
          missingRequirements.push(`Add sound effects to ${shotsWithoutSoundEffects.length} shot${shotsWithoutSoundEffects.length > 1 ? 's' : ''}`);
        }
        
        toast({
          title: "Requirements Not Met",
          description: `Please complete the following before continuing: ${missingRequirements.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      try {
        setIsSaving(true);
        onSaveStateChange?.(true);
        
        // First save any pending step5 data
        await saveStep5SettingsImmediate(scenes, shots, loopSettingsLocked);
        
        // Then call the transition endpoint
        const response = await fetch(`/api/ambient-visual/videos/${videoId}/step/5/continue-to-6`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to continue to Preview');
        }

        const updated = await response.json();
        console.log('[AmbientWorkflow] Step 5 completed, moving to step 6:', updated);

        // Navigate to step 6
        onStepChange(6);
      } catch (error) {
        console.error('[AmbientWorkflow] Failed to continue from step 5:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to continue. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsSaving(false);
        onSaveStateChange?.(false);
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
    console.log('[AmbientWorkflow] handleContinuityLocked called');
    setContinuityLocked(true);
  };

  const handleContinuityGroupsChange = (groups: { [sceneId: string]: ContinuityGroup[] }) => {
    console.log('[AmbientWorkflow] handleContinuityGroupsChange called with groups:', {
      sceneCount: Object.keys(groups).length,
      totalGroups: Object.values(groups).flat().length,
      statuses: Object.values(groups).flat().map(g => g.status),
    });
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

  // Generate a single image for a specific frame (start or end)
  const handleGenerateSingleImage = async (shotId: string, frame: 'start' | 'end') => {
    if (!videoId || videoId === 'new') {
      toast({
        title: "Error",
        description: "Please save the video first",
        variant: "destructive",
      });
      return;
    }

    // Prevent double-click - check if already generating
    if (generatingShotIds.has(shotId)) {
      console.log(`[AmbientWorkflow] Shot ${shotId} is already generating, ignoring`);
      return;
    }

    console.log(`[AmbientWorkflow] Generating ${frame} frame for shot:`, shotId);
    
    // Mark as generating
    setGeneratingShotIds(prev => new Set(prev).add(shotId));
    
    try {
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/shots/${shotId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frame }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const result = await response.json();
      console.log(`[AmbientWorkflow] Image generated:`, result);
      
      // Update the shot version with the new image URL
      if (result.shotVersion) {
        setShotVersions(prev => {
          const existingVersions = prev[shotId] || [];
          const versionExists = existingVersions.some(v => v.id === result.shotVersion.id);
          
          const updatedVersions = versionExists
            ? existingVersions.map(v => 
                v.id === result.shotVersion.id ? result.shotVersion : v
              )
            : [...existingVersions, result.shotVersion];
          
          console.log(`[AmbientWorkflow] Updated shotVersions for shot ${shotId}:`, {
            versionId: result.shotVersion.id,
            hasStartFrameUrl: !!result.shotVersion.startFrameUrl,
            hasImageUrl: !!result.shotVersion.imageUrl,
            totalVersions: updatedVersions.length,
          });
          
          return {
            ...prev,
            [shotId]: updatedVersions,
          };
        });
        
        // Also update the shot's currentVersionId if not set
        setShots(prev => {
          const newShots = { ...prev };
          for (const sceneId of Object.keys(newShots)) {
            newShots[sceneId] = newShots[sceneId].map(s =>
              s.id === shotId && !s.currentVersionId
                ? { ...s, currentVersionId: result.shotVersion.id }
                : s
            );
          }
          return newShots;
        });
      }
      
      // If next shot was updated (inherited start frame), update it too
      if (result.nextShotId && result.nextShotVersion) {
        setShotVersions(prev => ({
          ...prev,
          [result.nextShotId]: prev[result.nextShotId]?.map(v => 
            v.id === result.nextShotVersion.id ? result.nextShotVersion : v
          ) || [result.nextShotVersion]
        }));
        console.log(`[AmbientWorkflow] Updated next shot ${result.nextShotId} with inherited start frame`);
      }
      
      toast({
        title: "Image Generated",
        description: `${frame === 'start' ? 'Start' : 'End'} frame generated successfully`,
      });
    } catch (error) {
      console.error(`[AmbientWorkflow] Failed to generate ${frame} frame:`, error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      // Remove from generating set
      setGeneratingShotIds(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  };

  // Regenerate a shot's image - if regenerating start, regenerate both; if end, only end
  const handleRegenerateShot = async (shotId: string, frame?: 'start' | 'end') => {
    if (!videoId || videoId === 'new') {
      // Fallback to mock for new videos
      handleGenerateShot(shotId);
      return;
    }

    // Prevent double-click - check if already generating
    if (generatingShotIds.has(shotId)) {
      console.log(`[AmbientWorkflow] Shot ${shotId} is already regenerating, ignoring`);
      return;
    }

    console.log(`[AmbientWorkflow] Regenerating shot ${shotId}, frame: ${frame || 'both'}`);
    
    // Mark as generating
    setGeneratingShotIds(prev => new Set(prev).add(shotId));
    
    try {
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/shots/${shotId}/regenerate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frame }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate image');
      }
      
      const result = await response.json();
      console.log(`[AmbientWorkflow] Image regenerated:`, result);
      
      // Update the shot version with the new image URLs
      if (result.shotVersion) {
        setShotVersions(prev => ({
          ...prev,
          [shotId]: prev[shotId]?.map(v => 
            v.id === result.shotVersion.id ? result.shotVersion : v
          ) || [result.shotVersion]
        }));
      }
      
      // If next shot was updated (inherited start frame), update it too
      if (result.nextShotId && result.nextShotVersion) {
        setShotVersions(prev => ({
          ...prev,
          [result.nextShotId]: prev[result.nextShotId]?.map(v => 
            v.id === result.nextShotVersion.id ? result.nextShotVersion : v
          ) || [result.nextShotVersion]
        }));
        console.log(`[AmbientWorkflow] Updated next shot ${result.nextShotId} with inherited start frame`);
      }
      
      toast({
        title: "Image Regenerated",
        description: frame === 'end' ? 'End frame regenerated' : 'Start and end frames regenerated',
      });
    } catch (error) {
      console.error(`[AmbientWorkflow] Failed to regenerate:`, error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      // Remove from generating set
      setGeneratingShotIds(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  };

  // Debounced save for step4 settings (scenes/shots with model changes)
  const debouncedSaveStep4Settings = useCallback((
    scenesToSave: Scene[],
    shotsToSave: { [sceneId: string]: Shot[] }
  ) => {
    // Clear existing timer
    if (step4SettingsSaveTimerRef.current) {
      clearTimeout(step4SettingsSaveTimerRef.current);
    }
    
    // Skip if no videoId or new video
    if (!videoId || videoId === 'new') {
      return;
    }
    
    // Debounce for 2 seconds
    step4SettingsSaveTimerRef.current = setTimeout(async () => {
      try {
        // CRITICAL: Strip audio fields before saving to step4Data
        // Audio fields belong ONLY in step5Data, never in step4Data
        const cleanedShots = Object.fromEntries(
          Object.entries(shotsToSave).map(([sceneId, sceneShots]) => [
            sceneId,
            sceneShots.map(({ soundEffectUrl, soundEffectDescription, ...shot }) => shot)
          ])
        );

        console.log('[AmbientWorkflow] Auto-saving step4 settings:', {
          scenesCount: scenesToSave.length,
          shotsCount: Object.keys(cleanedShots).length,
        });
        
        const response = await fetch(`/api/ambient-visual/videos/${videoId}/step4/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            scenes: scenesToSave, 
            shots: cleanedShots 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save settings');
        }
        
        console.log('[AmbientWorkflow] Step4 settings auto-saved successfully');
      } catch (error) {
        console.error('[AmbientWorkflow] Step4 auto-save error:', error);
      }
    }, 2000);
  }, [videoId]);

  // Immediate save function for step5 settings (used on unmount, step change, etc.)
  const saveStep5SettingsImmediate = useCallback(async (
    scenesToSave: Scene[],
    shotsToSave: { [sceneId: string]: Shot[] },
    locked?: boolean
  ) => {
    // Skip if no videoId or new video
    if (!videoId || videoId === 'new') {
      return;
    }
    
      try {
      console.log('[AmbientWorkflow] Immediately saving step5 settings:', {
          scenesCount: scenesToSave.length,
          shotsCount: Object.keys(shotsToSave).length,
          locked,
        });
        
        const response = await fetch(`/api/ambient-visual/videos/${videoId}/step5/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            scenesWithLoops: scenesToSave, 
            shotsWithLoops: shotsToSave,
            loopSettingsLocked: locked,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save Step 5 settings');
        }
        
      console.log('[AmbientWorkflow] Step5 settings saved immediately');
      } catch (error) {
      console.error('[AmbientWorkflow] Step5 immediate save error:', error);
      }
  }, [videoId]);

  // Debounced save for step5 settings (loop counts, lock state, soundscape data)
  const debouncedSaveStep5Settings = useCallback((
    scenesToSave: Scene[],
    shotsToSave: { [sceneId: string]: Shot[] },
    locked?: boolean
  ) => {
    // Clear existing timer
    if (step5SettingsSaveTimerRef.current) {
      clearTimeout(step5SettingsSaveTimerRef.current);
    }
    
    // Skip if no videoId or new video
    if (!videoId || videoId === 'new') {
      return;
    }
    
    // CRITICAL: Only save step5Data if we're actually on step 5
    if (activeStepRef.current !== 5) {
      console.log('[AmbientWorkflow] Skipping step5 debounced save - not on step 5 (current:', activeStepRef.current, ')');
      return;
    }
    
    // Debounce for 2 seconds
    step5SettingsSaveTimerRef.current = setTimeout(async () => {
      await saveStep5SettingsImmediate(scenesToSave, shotsToSave, locked);
    }, 2000);
  }, [videoId, saveStep5SettingsImmediate]);

  // Save step5Data on unmount (cleanup) - MUST be after saveStep5SettingsImmediate is defined
  useEffect(() => {
    return () => {
      // Cleanup: Save pending changes before unmount
      if (step5SettingsSaveTimerRef.current) {
        clearTimeout(step5SettingsSaveTimerRef.current);
      }
      // Immediate save on unmount if we have data AND we're on step 5 - use refs for latest values
      // CRITICAL: Only save step5Data if we're actually on step 5
      if (videoId && videoId !== 'new' && scenesRef.current.length > 0 && activeStepRef.current === 5) {
        // Use a synchronous approach for cleanup - fire and forget
        saveStep5SettingsImmediate(scenesRef.current, shotsRef.current, loopSettingsLockedRef.current).catch(err => {
          console.error('[AmbientWorkflow] Failed to save step5Data on unmount:', err);
        });
      }
    };
  }, [videoId, saveStep5SettingsImmediate]);

  // Save step5Data when changing steps (ensure data is saved before navigation) - MUST be after saveStep5SettingsImmediate is defined
  // Only save step5Data when we're on step 5, not on other steps
  useEffect(() => {
    // Only save step5Data if we're actually on step 5 AND step5Initialized is true
    // step5Initialized is only set to true when we're on step 5 (see case 5 below)
    if (videoId && videoId !== 'new' && scenesRef.current.length > 0 && activeStep === 5 && step5Initialized) {
      // Clear any pending debounced save
      if (step5SettingsSaveTimerRef.current) {
        clearTimeout(step5SettingsSaveTimerRef.current);
      }
      // Save immediately when on step 5 - use refs for latest values
      saveStep5SettingsImmediate(scenesRef.current, shotsRef.current, loopSettingsLockedRef.current).catch(err => {
        console.error('[AmbientWorkflow] Failed to save step5Data on step change:', err);
      });
    }
    
    // Reset step5Initialized when we leave step 5
    if (activeStep !== 5 && step5Initialized) {
      setStep5Initialized(false);
    }
  }, [activeStep, videoId, step5Initialized, saveStep5SettingsImmediate]);

  // Save Step 5 lock state immediately (not debounced)
  const saveStep5LockState = useCallback(async (locked: boolean) => {
    if (!videoId || videoId === 'new') return;
    
    try {
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/step5/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ loopSettingsLocked: locked }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save lock state');
      }
      console.log('[AmbientWorkflow] Step5 lock state saved:', locked);
    } catch (error) {
      console.error('[AmbientWorkflow] Step5 lock save error:', error);
    }
  }, [videoId]);

  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    setShots(prev => {
      const newShots = { ...prev };
      for (const sceneId of Object.keys(newShots)) {
        newShots[sceneId] = newShots[sceneId].map(shot =>
          shot.id === shotId ? { ...shot, ...updates } : shot
        );
      }
      // Trigger debounced save for composition changes (Step 4)
      // This includes all fields editable in the composition phase
      if (
        updates.imageModel !== undefined || 
        updates.videoModel !== undefined ||
        updates.duration !== undefined ||
        updates.shotType !== undefined ||
        updates.cameraMovement !== undefined ||
        updates.transition !== undefined ||
        updates.description !== undefined
      ) {
        debouncedSaveStep4Settings(scenes, newShots);
      }
      // Save soundscape changes (but NOT loopCount - that's saved on lock)
      if (
        updates.soundEffectDescription !== undefined ||
        updates.soundEffectUrl !== undefined
      ) {
        // Update ref immediately so it's available for other saves
        shotsRef.current = newShots;
        // Use latest state from setState callback to avoid closure issues
        setScenes(currentScenes => {
          debouncedSaveStep5Settings(currentScenes, newShots, loopSettingsLockedRef.current);
          return currentScenes;
        });
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
    setScenes(prev => {
      const newScenes = prev.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      );
      // Trigger debounced save for model changes (Step 4)
      if (updates.imageModel !== undefined || updates.videoModel !== undefined) {
        debouncedSaveStep4Settings(newScenes, shots);
      }
      // Loop count changes are NOT autosaved - they're saved when lock button is clicked
      return newScenes;
    });
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

  /**
   * Handle batch image generation for all shots (Agent 4.2)
   * Calls the backend endpoint to generate keyframe images using Runware
   */
  const handleGenerateAllImages = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Video ID is required",
        variant: "destructive",
      });
      return;
    }

    // Identify which shots need image generation before calling backend
    const allShotsList = Object.values(shots).flat();
    const shotsNeedingImages: string[] = [];
    
    for (const shot of allShotsList) {
      const versions = shotVersions[shot.id];
      if (!versions || versions.length === 0) continue;
      
      const latestVersion = versions[versions.length - 1];
      
      // Check what images are needed based on mode
      const isImageTransitionsMode = animationMode === 'image-transitions';
      const isImageReferenceMode = animationMode === 'video-animation' && 
                                   videoGenerationMode === 'image-reference';
      const isStartEndFrameMode = animationMode === 'video-animation' && 
                                 videoGenerationMode === 'start-end-frame';
      
      let needsImage = false;
      if (isImageTransitionsMode) {
        needsImage = !latestVersion.imageUrl;
      } else if (isImageReferenceMode) {
        // Image-reference mode: only needs startFrameUrl
        needsImage = !latestVersion.startFrameUrl;
      } else if (isStartEndFrameMode) {
        // Start-end frame mode: needs both frames
        needsImage = !latestVersion.startFrameUrl || !latestVersion.endFrameUrl;
      }
      
      if (needsImage) {
        shotsNeedingImages.push(shot.id);
      }
    }
    
    // Set generating state for all shots that need images
    if (shotsNeedingImages.length > 0) {
      setGeneratingShotIds(new Set(shotsNeedingImages));
      console.log('[AmbientWorkflow] Marking shots as generating:', shotsNeedingImages);
    }
    
    setIsGeneratingImages(true);

    try {
      console.log('[AmbientWorkflow] Starting batch image generation for video:', videoId, {
        shotsNeedingImages: shotsNeedingImages.length,
        shotIds: shotsNeedingImages,
      });

      const response = await fetch(`/api/ambient-visual/videos/${videoId}/generate-all-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const result = await response.json();

      console.log('[AmbientWorkflow] Batch image generation result:', result);

      // Refresh data from server to get updated shot versions
      if (videoId) {
        const videoResponse = await fetch(`/api/videos/${videoId}`, {
          credentials: 'include',
        });

        if (videoResponse.ok) {
          const video = await videoResponse.json();
          
          // Update local state with new shot versions
          if (video.step4Data?.shotVersions) {
            console.log('[AmbientWorkflow] Updating shotVersions from server');
            setShotVersions(video.step4Data.shotVersions);
          }
        }
      }

      toast({
        title: "Images Generated",
        description: `Successfully generated ${result.imagesGenerated} of ${shotsNeedingImages.length} images. ${result.failedShots > 0 ? `${result.failedShots} failed.` : ''}`,
        variant: result.failedShots > 0 ? "default" : "default",
      });

    } catch (error) {
      console.error('[AmbientWorkflow] Image generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate images",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
      // Clear generating state for all shots
      setGeneratingShotIds(new Set());
    }
  };

  /**
   * Handle batch video generation for all shots (Agent 4.3)
   * Calls the backend endpoint to generate video clips using Runware
   * Skips shots that already have videos generated
   */
  const handleGenerateAllVideos = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Video ID is required",
        variant: "destructive",
      });
      return;
    }

    // First, identify which shots will be processed (have images but no videos)
    const shotsToProcess: string[] = [];
    const allShotsList = Object.values(shots).flat();
    
    for (const shot of allShotsList) {
      const versions = shotVersions[shot.id];
      if (!versions || versions.length === 0) continue;
      
      const latestVersion = versions[versions.length - 1];
      
      // Check if shot has required images but no video based on mode
      let hasRequiredImages: boolean;
      if (animationMode === 'image-transitions') {
        hasRequiredImages = !!latestVersion.imageUrl;
      } else if (videoGenerationMode === 'image-reference') {
        // Image-reference mode: only needs startFrameUrl (no end frame)
        hasRequiredImages = !!latestVersion.startFrameUrl;
      } else if (videoGenerationMode === 'start-end-frame') {
        // Start-end frame mode: needs both frames
        hasRequiredImages = !!(latestVersion.startFrameUrl && latestVersion.endFrameUrl);
      } else {
        // Fallback: check for startFrameUrl
        hasRequiredImages = !!latestVersion.startFrameUrl;
      }
      
      const hasVideo = latestVersion.videoUrl && 
                       typeof latestVersion.videoUrl === 'string' && 
                       latestVersion.videoUrl.trim().length > 0;
      
      if (hasRequiredImages && !hasVideo) {
        shotsToProcess.push(shot.id);
      }
    }
    
    if (shotsToProcess.length === 0) {
      toast({
        title: "No Videos to Generate",
        description: "All shots that have images already have videos generated.",
        variant: "default",
      });
      return;
    }
    
    console.log('[AmbientWorkflow] Shots ready for video generation:', {
      count: shotsToProcess.length,
      shotIds: shotsToProcess,
      mode: videoGenerationMode,
    });

    // Track all shots that will be processed
    setGeneratingVideoShotIds(new Set(shotsToProcess));
    setIsGeneratingVideos(true);

    // Set up polling interval to refresh data during generation
    const pollInterval = setInterval(async () => {
      if (!videoId) return;
      
      try {
        const videoResponse = await fetch(`/api/videos/${videoId}`, {
          credentials: 'include',
        });

        if (videoResponse.ok) {
          const video = await videoResponse.json();
          
          if (video.step4Data?.shotVersions) {
            setShotVersions(video.step4Data.shotVersions);
            
            // Remove shots that now have videos from generating set
            setGeneratingVideoShotIds(prev => {
              const next = new Set(prev);
              for (const shotId of prev) {
                const versions = video.step4Data.shotVersions[shotId];
                if (versions && versions.length > 0) {
                  const latestVersion = versions[versions.length - 1];
                  const hasVideo = latestVersion.videoUrl && 
                                   typeof latestVersion.videoUrl === 'string' && 
                                   latestVersion.videoUrl.trim().length > 0;
                  if (hasVideo) {
                    next.delete(shotId);
                  }
                }
              }
              return next;
            });
          }
        }
      } catch (error) {
        console.error('[AmbientWorkflow] Error polling video data:', error);
      }
    }, 3000); // Poll every 3 seconds

    try {
      console.log('[AmbientWorkflow] Starting batch video generation for video:', videoId);
      console.log('[AmbientWorkflow] Shots to process:', shotsToProcess.length, shotsToProcess);

      const response = await fetch(`/api/ambient-visual/videos/${videoId}/generate-all-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate videos');
      }

      const result = await response.json();

      console.log('[AmbientWorkflow] Batch video generation result:', result);

      // Clear polling interval
      clearInterval(pollInterval);

      // Final refresh data from server to get updated shot versions
      if (videoId) {
        const videoResponse = await fetch(`/api/videos/${videoId}`, {
          credentials: 'include',
        });

        if (videoResponse.ok) {
          const video = await videoResponse.json();
          
          // Update local state with new shot versions
          if (video.step4Data?.shotVersions) {
            console.log('[AmbientWorkflow] Updating shotVersions from server after video generation');
            setShotVersions(video.step4Data.shotVersions);
          }
        }
      }

      toast({
        title: "Videos Generated",
        description: `Successfully generated ${result.videosGenerated || 0} videos. ${result.skippedCount ? `${result.skippedCount} already had videos.` : ''} ${result.failedCount ? `${result.failedCount} failed.` : ''}`,
      });

    } catch (error) {
      console.error('[AmbientWorkflow] Video generation error:', error);
      clearInterval(pollInterval);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate videos",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideos(false);
      setGeneratingVideoShotIds(new Set()); // Clear all generating shots
    }
  };

  /**
   * Handle single shot video generation (Agent 4.3)
   * Used for both "Generate Video" and "Regenerate Video" buttons
   */
  const handleGenerateSingleVideo = async (shotId: string) => {
    if (!videoId || videoId === 'new') {
      toast({
        title: "Error",
        description: "Please save the video first",
        variant: "destructive",
      });
      return;
    }

    // Prevent double-click - check if already generating
    if (generatingVideoShotIds.has(shotId)) {
      console.log(`[AmbientWorkflow] Shot ${shotId} video is already generating, ignoring`);
      return;
    }

    console.log(`[AmbientWorkflow] Generating video for shot:`, shotId);
    
    // Mark as generating
    setGeneratingVideoShotIds(prev => new Set(prev).add(shotId));
    
    try {
      const response = await fetch(`/api/ambient-visual/videos/${videoId}/shots/${shotId}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }
      
      const result = await response.json();
      console.log(`[AmbientWorkflow] Video generated:`, result);
      
      // Update the shot version with the new video URL
      if (result.shotVersion) {
        setShotVersions(prev => ({
          ...prev,
          [shotId]: prev[shotId]?.map(v => 
            v.id === result.shotVersion.id ? result.shotVersion : v
          ) || [result.shotVersion]
        }));
      }
      
      toast({
        title: "Video Generated",
        description: `Video clip generated successfully${result.actualDuration ? ` (${result.actualDuration}s)` : ''}`,
      });
    } catch (error) {
      console.error(`[AmbientWorkflow] Failed to generate video:`, error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      // Remove from generating set
      setGeneratingVideoShotIds(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
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
            backgroundMusicEnabled={backgroundMusicEnabled}
            voiceoverEnabled={voiceoverEnabled}
            voiceoverStory={voiceoverStory}
            voiceId={voiceId}
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
            onBackgroundMusicChange={setBackgroundMusicEnabled}
            onVoiceoverChange={setVoiceoverEnabled}
            onVoiceoverStoryChange={setVoiceoverStory}
            onVoiceIdChange={setVoiceId}
            onLanguageChange={setLanguage}
            onTextOverlayEnabledChange={setTextOverlayEnabled}
            onTextOverlayStyleChange={setTextOverlayStyle}
            onAnimationModeChange={setAnimationMode}
            onDefaultEasingStyleChange={setDefaultEasingStyle}
            onVideoModelChange={setVideoModel}
            onVideoResolutionChange={setVideoResolution}
            onMotionPromptChange={setMotionPrompt}
            onTransitionStyleChange={setTransitionStyle}
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
            videoId={videoId}
            backgroundMusicEnabled={backgroundMusicEnabled}
            musicStyle={musicStyle}
            customMusicUrl={customMusicUrl}
            customMusicDuration={customMusicDuration}
            hasCustomMusic={hasCustomMusic}
            onArtStyleChange={setArtStyle}
            onVisualElementsChange={setVisualElements}
            onVisualRhythmChange={setVisualRhythm}
            onReferenceImagesChange={setReferenceImages}
            onImageCustomInstructionsChange={setImageCustomInstructions}
            onMusicStyleChange={setMusicStyle}
            onCustomMusicChange={(url, duration) => {
              setCustomMusicUrl(url);
              setCustomMusicDuration(duration);
              setHasCustomMusic(true);
            }}
            onClearCustomMusic={() => {
              setCustomMusicUrl('');
              setCustomMusicDuration(0);
              setHasCustomMusic(false);
            }}
          />
        );
      case 3:
        // Show loading screen while generating flow design when transitioning from Step 2 to Step 3
        if (isGeneratingFlowDesign) {
          return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
              <div className="text-center space-y-8">
                <Sparkles className="h-16 w-16 text-cyan-400 mx-auto animate-pulse" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Designing Your Flow
                  </h2>
                  <p className="text-slate-400">
                    AI is analyzing your atmosphere and visual settings to create the perfect visual segments...
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
            videoModel={videoModel}
            autoGenerate={false} // No longer auto-generate here - it's done before navigation from step 2
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
          backgroundMusicEnabled,
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
            step4Initialized={step4Initialized}
            hidePhase3Fields={true}
            onVoiceActorChange={setVoiceActorId}
            onVoiceOverToggle={setVoiceoverEnabled}
            onGenerateShot={handleGenerateShot}
            onRegenerateShot={handleRegenerateShot}
            onGenerateSingleImage={handleGenerateSingleImage}
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
            onGenerateAllImages={handleGenerateAllImages}
            isGeneratingImages={isGeneratingImages}
            generatingShotIds={generatingShotIds}
            onGenerateAllVideos={handleGenerateAllVideos}
            isGeneratingVideos={isGeneratingVideos}
            generatingVideoShotIds={generatingVideoShotIds}
            onGenerateSingleVideo={handleGenerateSingleVideo}
            onNext={goToNextStep}
          />
        );
      case 5:
        // Set step5Initialized to true when we're actually on step 5
        // This ensures step5Data is only saved when we're on step 5
        if (!step5Initialized) {
          setStep5Initialized(true);
        }
        
        // Soundscape - Audio and Loop settings
        // Extract voiceover and music data from step5Data
        const step5Data = initialStep5Data as { 
          voiceoverScript?: string; 
          voiceoverAudioUrl?: string;
          generatedMusicUrl?: string;
          generatedMusicDuration?: number;
        } | undefined;
        // Get music settings from step1 and step2
        const step2DataMusic = initialStep2Data as {
          hasCustomMusic?: boolean;
          customMusicUrl?: string;
          musicStyle?: string;
        } | undefined;
        return (
          <SoundscapeTab
            videoId={videoId || ''}
            animationMode={animationMode}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            loopMode={loopMode}
            loopType={loopType}
            segmentLoopEnabled={segmentLoopEnabled}
            segmentLoopCount={segmentLoopCount}
            shotLoopEnabled={shotLoopEnabled}
            shotLoopCount={shotLoopCount}
            loopSettingsLocked={loopSettingsLocked}
            onLockToggle={async (locked) => {
              setLoopSettingsLocked(locked);
              // Save loop settings to database when locking
              if (locked) {
                try {
                  // Use refs to get the latest state (they're kept in sync via useEffect)
                  await saveStep5SettingsImmediate(scenesRef.current, shotsRef.current, locked);
                  console.log('[AmbientWorkflow] Loop settings saved on lock');
                } catch (error) {
                  console.error('[AmbientWorkflow] Failed to save loop settings on lock:', error);
                  // Revert lock state on error
                  setLoopSettingsLocked(false);
                  throw error;
                }
              } else {
                // Just save lock state if unlocking (though this shouldn't happen)
                await saveStep5LockState(locked);
              }
            }}
            voiceoverEnabled={voiceoverEnabled}
            voiceoverScript={step5Data?.voiceoverScript}
            voiceoverAudioUrl={step5Data?.voiceoverAudioUrl}
            backgroundMusicEnabled={backgroundMusicEnabled}
            hasCustomMusic={step2DataMusic?.hasCustomMusic}
            customMusicUrl={step2DataMusic?.customMusicUrl}
            musicStyle={step2DataMusic?.musicStyle || musicStyle}
            generatedMusicUrl={step5Data?.generatedMusicUrl}
            generatedMusicDuration={step5Data?.generatedMusicDuration}
            onMusicGenerated={(musicUrl, duration) => {
              console.log('[AmbientWorkflow] Music generated, updating session state:', { musicUrl, duration });
              setSessionMusicUrl(musicUrl);
            }}
            onVoiceoverGenerated={(voiceoverUrl) => {
              console.log('[AmbientWorkflow] Voiceover generated, updating session state:', { voiceoverUrl });
              setSessionVoiceoverUrl(voiceoverUrl);
            }}
            onUpdateShot={handleUpdateShot}
            onUpdateScene={handleUpdateScene}
          />
        );
      case 6:
        // Shotstack-based preview with timeline editing
        return (
          <PreviewTab
            ref={previewTabRef}
            videoId={videoId}
          />
        );
      case 7:
        // Calculate total duration from scenes and shots with loops
        const exportDuration = scenes.reduce((total, scene) => {
          const sceneLoopCount = scene.loopCount ?? 1;
          const sceneShots = shots[scene.id] || [];
          let sceneDuration = 0;
          for (let i = 0; i < sceneLoopCount; i++) {
            for (const shot of sceneShots) {
              const shotLoopCount = shot.loopCount ?? 1;
              sceneDuration += shot.duration * shotLoopCount;
            }
          }
          return total + sceneDuration;
        }, 0);
        
        return (
          <ExportTab
            videoId={videoId}
            videoTitle={projectName}
            duration={exportDuration || totalDuration}
            sceneCount={scenes.length}
            aspectRatio={aspectRatio}
            hasVoiceover={voiceoverEnabled}
            hasMusic={backgroundMusicEnabled}
            imageModel={imageModel}
          />
        );
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
});

AmbientVisualWorkflow.displayName = 'AmbientVisualWorkflow';

