import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SocialCommerceWorkflow } from "@/components/social-commerce-workflow";
import { SocialCommerceStudioLayout, type CommerceStepId } from "@/components/commerce/studio";
import { StepResetWarningDialog } from "@/components/social-commerce/step-reset-warning-dialog";
import { useWorkspace } from "@/contexts/workspace-context";
import type { Character, Video } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";
import { VOICE_LIBRARY } from "@/constants/voice-library";

// Duration options (beat-based chunking: each duration = N beats × 12s)
const DURATION_OPTIONS = [12, 24, 36] as const;

interface ProductDetails {
  title: string;
  price: string;
  description: string;
  cta: string;
}

export default function SocialCommerceMode() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Product Video";
  const queryClient = useQueryClient();
  
  // Fetch existing video data
  const { data: existingVideo, isLoading: isVideoLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${initialVideoId}`],
    enabled: !isNewVideo && !!initialVideoId,
    staleTime: 0,
    refetchOnMount: true,
  });
  
  // State for auto-creation
  const [isCreating, setIsCreating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // NEW: Track transition state
  const creationAttempted = useRef(false);
  const agent51TriggeredRef = useRef(false); // Track if Agent 5.1 has been triggered for current Tab 3 entry
  
  // Video ID state (updated after creation)
  const [videoId, setVideoId] = useState<string>(initialVideoId);
  const [videoTitle, setVideoTitle] = useState<string>(urlTitle);
  
  const [activeStep, setActiveStep] = useState<CommerceStepId>("setup");
  const [completedSteps, setCompletedSteps] = useState<CommerceStepId[]>([]);
  const [direction, setDirection] = useState(1);
  const [canContinue, setCanContinue] = useState(false);
  // Commerce mode always uses start-end for automatic linear shot connections
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end">("start-end");
  
  // Dirty tracking for step change warnings
  const [dirtySteps, setDirtySteps] = useState<Set<CommerceStepId>>(new Set());
  const [stepSnapshots, setStepSnapshots] = useState<Map<CommerceStepId, any>>(new Map());
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<CommerceStepId | null>(null);
  
  // Product-specific state
  const [productPhotos, setProductPhotos] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    title: "",
    price: "",
    description: "",
    cta: "Shop Now",
  });
  const [videoConcept, setVideoConcept] = useState("");
  const [voiceOverConcept, setVoiceOverConcept] = useState("");
  const [voiceOverScript, setVoiceOverScript] = useState("");
  
  // Video settings
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState("12"); // Sora default: 12 seconds
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  
  // Campaign Configuration settings (Tab 1) - Sora Only
  const [videoModel, setVideoModel] = useState("sora-2-pro"); // Default to Sora 2 Pro
  const [videoResolution, setVideoResolution] = useState("720p");
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [motionPrompt, setMotionPrompt] = useState("");
  
  // Audio Settings (Tab 1)
  const [audioVolume, setAudioVolume] = useState<'low' | 'medium' | 'high'>('medium');
  const [speechTempo, setSpeechTempo] = useState<'auto' | 'slow' | 'normal' | 'fast' | 'ultra-fast'>('auto');
  const [voiceoverScript, setVoiceoverScript] = useState<string>('');
  const [customVoiceoverInstructions, setCustomVoiceoverInstructions] = useState("");
  
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(false);
  const [soundEffectsPreset, setSoundEffectsPreset] = useState("ambient");
  const [soundEffectsCustomInstructions, setSoundEffectsCustomInstructions] = useState("");
  const [soundEffectsUsePreset, setSoundEffectsUsePreset] = useState(true);
  
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicPreset, setMusicPreset] = useState("ambient");
  const [musicCustomInstructions, setMusicCustomInstructions] = useState("");
  const [musicMood, setMusicMood] = useState("");
  const [musicUsePreset, setMusicUsePreset] = useState(true);
  
  // Quality Settings (Tab 1)
  const [productionLevel, setProductionLevel] = useState<'raw' | 'casual' | 'balanced' | 'cinematic' | 'ultra'>('balanced');
  
  // Visual Style (Tab 1)
  const [pacingOverride, setPacingOverride] = useState<number | undefined>(undefined);
  const [visualIntensity, setVisualIntensity] = useState<number | undefined>(undefined);
  
  // Product DNA & Brand Identity settings (Tab 2)
  const [productImages, setProductImages] = useState<{
    mode?: 'manual' | 'ai_generated';
    heroProfile: string | null;
    productAngles?: Array<{ id: string; url: string; uploadedAt: number }>;
    elements?: Array<{ id: string; url: string; uploadedAt: number; description?: string }>;
    aiModeImages?: Array<{ id: string; url: string; uploadedAt: number }>;
    compositeImage?: { 
      url: string; 
      generatedAt: number; 
      mode: 'manual' | 'ai_generated'; 
      sourceImages: string[];
      isApplied?: boolean;
      prompt?: string;
    };
    aiContext?: { description?: string; generatedAt?: number };
  }>({
    mode: 'manual',
    heroProfile: null,
    productAngles: [],
    elements: [],
    aiModeImages: [],
  });
  
  // Asset IDs for created assets (product images only - no character/brand assets for Sora)
  const [brandkitAssetId, setBrandkitAssetId] = useState<string | null>(null);
  const [productImageAssetIds, setProductImageAssetIds] = useState<{
    heroProfile: string | null;
    productAngles?: Record<string, string>;
    elements?: Record<string, string>;
    aiModeImages?: Record<string, string>;
    compositeImage?: string;
  }>({
    heroProfile: null,
    productAngles: {},
    elements: {},
  });
  
  // Names for auto-created assets
  const [brandName, setBrandName] = useState('');
  
  const [materialPreset, setMaterialPreset] = useState("");
  const [objectMass, setObjectMass] = useState(50);
  const [surfaceComplexity, setSurfaceComplexity] = useState(50);
  const [refractionEnabled, setRefractionEnabled] = useState(false);
  // Removed: logoUrl, brandPrimaryColor, brandSecondaryColor, logoIntegrity, logoDepth (no logo support for Sora)
  const [heroFeature, setHeroFeature] = useState("");
  const [originMetaphor, setOriginMetaphor] = useState("");
  
  // Cast & Character DNA (Tab 2) - Simplified for Sora
  const [includeHumanElement, setIncludeHumanElement] = useState(false);
  const [characterMode, setCharacterMode] = useState<'hand-model' | 'full-body' | 'silhouette' | null>(null);
  const [characterDescription, setCharacterDescription] = useState("");
  const [characterPersona, setCharacterPersona] = useState<{
    detailed_persona: string;
    cultural_fit: string;
    interaction_protocol: {
      product_engagement: string;
      motion_limitations: string;
    };
  } | null>(null);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  // Removed: characterReferenceUrl, characterAssetId, characterReferenceFile, characterAIProfile, characterName (no image generation for Sora)
  
  // Cinematography defaults (Tab 2)
  const [cameraShotDefault, setCameraShotDefault] = useState<string | null>(null);
  const [lensDefault, setLensDefault] = useState<string | null>(null);
  
  // Environment & Story Beats (Tab 3) - Removed: environmentConcept, cinematicLighting, atmosphericDensity (no longer used)
  // Removed: styleReferenceUrl - Sora only accepts one image input (product hero)
  const [visualPreset, setVisualPreset] = useState("cinematic");
  const [campaignSpark, setCampaignSpark] = useState("");
  
  // Product Image Enhancement Dialog
  const [visualBeats, setVisualBeats] = useState({
    beat1: "",
    beat2: "",
    beat3: "",
  });
  
  // Environment-specific brand colors (initialized from defaults, but local to Tab 3)
  // Removed: environmentBrandPrimaryColor, environmentBrandSecondaryColor (no longer used)
  
  // Campaign Objective (optional, can be deselected)
  const [campaignObjective, setCampaignObjective] = useState("awareness");
  
  // Strategic Context (Tab 1 - moved from Tab 3)
  const [targetAudience, setTargetAudience] = useState("default");
  
  // CTA (Tab 3)
  const [ctaText, setCtaText] = useState("");

  // Scene Manifest (Tab 4)
  const [sceneManifest, setSceneManifest] = useState<{
    scenes: Array<{
      id: string;
      name: string;
      description: string;
      duration: number;
      actType: 'hook' | 'transformation' | 'payoff';
      shots: Array<{
        id: string;
        sceneId: string;
        name: string;
        description: string;
        duration: number;
        cameraPath: 'orbit' | 'pan' | 'zoom' | 'dolly' | 'static';
        lens: 'macro' | 'wide' | '85mm' | 'telephoto';
        referenceTags: string[];
        focusAnchor: string;
        previousShotReferences: Array<{
          shot_id: string;
          reason: string;
          reference_type: string;
        }>;
        isLinkedToPrevious: boolean;
        speedProfile: 'smooth' | 'linear';
        multiplier: number;
        sfxHint: string;
      }>;
    }>;
    continuityLinksEstablished: boolean;
    durationBudget?: {
      target_total: number;
      actual_total: number;
      variance: number;
    };
  }>({
    scenes: [],
    continuityLinksEstablished: false,
  });
  
  // Scene/shot state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});
  // Step 5: Beat Prompts
  const [step3Data, setStep3Data] = useState<{
    beatPrompts?: any;
    voiceoverScripts?: any;
    beatVideos?: {
      [beatId: string]: {
        videoUrl: string;
        lastFrameUrl: string;
        generatedAt: Date;
      };
    };
  }>({});
  // Step 4: Voiceover Audios
  const [step4Data, setStep4Data] = useState<{
    voiceoverAudios?: {
      [beatId: string]: {
        audioUrl: string;
        generatedAt?: Date;
        voiceId?: string;
        duration?: number;
      };
    };
  }>({});
  const [worldSettings, setWorldSettings] = useState<{ 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  }>({
    artStyle: "none",
    imageModel: "Flux",
    worldDescription: "",
    locations: [],
    imageInstructions: "",
    videoInstructions: "",
  });

  // Commerce World Settings
  const [commerceSettings, setCommerceSettings] = useState<{
    visualStyle: string;
    backdrop: string;
    productDisplay: string[];
    talentType: string;
    talents: Array<{ id: string; name: string; type: "hands" | "lifestyle" | "spokesperson"; description: string; imageUrl: string | null }>;
    styleReference: string | null;
    additionalInstructions: string;
    videoModel: string;
    videoInstructions: string;
  }>({
    visualStyle: "minimal",
    backdrop: "white-studio",
    productDisplay: ["hero"],
    talentType: "none",
    talents: [],
    styleReference: null,
    additionalInstructions: "",
    videoModel: "sora-2-pro", // Sora 2 Pro default
    videoInstructions: "",
  });

  // Sync sceneManifest to scenes/shots/continuityGroups for StoryboardEditor
  useEffect(() => {
    if (sceneManifest.scenes.length > 0) {
      // Convert sceneManifest scenes to Scene type
      const convertedScenes: Scene[] = sceneManifest.scenes.map((scene, idx) => ({
        id: scene.id,
        videoId: videoId,
        sceneNumber: idx + 1,
        title: scene.name,
        description: scene.description,
        duration: scene.duration,
        createdAt: new Date(),
      }));
      
      // Helper function to calculate render duration based on speed profile
      const calculateRenderDuration = (
        targetDuration: number, 
        speedProfile: string | undefined
      ): number => {
        const multipliers: Record<string, number> = {
          'linear': 1.0,
          'speed-ramp': 1.2,
          'slow-motion': 2.0,
          'kinetic': 0.8,
          'smooth': 1.1,
        };
        const profileMultiplier = multipliers[speedProfile || 'linear'] || 1.0;
        return Math.round(targetDuration * profileMultiplier * 10) / 10;
      };

      // Convert sceneManifest shots to shots dictionary
      const convertedShots: { [sceneId: string]: Shot[] } = {};
      sceneManifest.scenes.forEach(scene => {
        convertedShots[scene.id] = scene.shots.map((shot, shotIdx) => ({
          id: shot.id,
          sceneId: scene.id,
          shotNumber: shotIdx + 1,
          shotType: 'start-end', // Default value since shotType was removed from workflow
          cameraMovement: shot.cameraPath,
          duration: shot.duration,
          description: shot.description,
          currentVersionId: null,
          speedProfile: shot.speedProfile || 'linear',
          renderDuration: calculateRenderDuration(shot.duration, shot.speedProfile),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      });
      
      // Generate continuityGroups from isLinkedToPrevious for connection status
      const generatedGroups: { [sceneId: string]: any[] } = {};
      sceneManifest.scenes.forEach(scene => {
        const groups: any[] = [];
        let currentGroup: string[] = [];
        
        scene.shots.forEach((shot, idx) => {
          if (idx === 0 || !shot.isLinkedToPrevious) {
            // Start new group if not linked to previous
            if (currentGroup.length > 1) {
              // Save the previous group (only if it has 2+ shots = actual connection)
              groups.push({
                id: `group-${scene.id}-${groups.length}`,
                sceneId: scene.id,
                groupNumber: groups.length + 1,
                shotIds: [...currentGroup],
                description: 'Connected shot sequence',
                transitionType: 'continuity',
                status: 'approved',
                createdAt: new Date(),
              });
            }
            currentGroup = [shot.id];
          } else {
            // Continue current group - shot is linked to previous
            currentGroup.push(shot.id);
          }
        });
        
        // Don't forget to save the last group if it has connections
        if (currentGroup.length > 1) {
          groups.push({
            id: `group-${scene.id}-${groups.length}`,
            sceneId: scene.id,
            groupNumber: groups.length + 1,
            shotIds: [...currentGroup],
            description: 'Connected shot sequence',
            transitionType: 'continuity',
            status: 'approved',
            createdAt: new Date(),
          });
        }
        
        generatedGroups[scene.id] = groups;
      });
      
      setScenes(convertedScenes);
      setShots(convertedShots);
      setContinuityGroups(generatedGroups);
      setContinuityLocked(sceneManifest.continuityLinksEstablished);
    }
  }, [sceneManifest, videoId]);

  // Update validation state based on current step and data
  const updateValidation = () => {
    if (activeStep === "setup") {
      // Tab 1: Campaign Configuration + Strategic Context validation
      const isValid = 
        videoModel && 
        videoModel && 
        aspectRatio && 
        duration && 
        motionPrompt.trim().length > 0 &&
        targetAudience && targetAudience !== "";
      setCanContinue(!!isValid);
    } else if (activeStep === "script") {
      // Tab 2: Creative Spark + Beats validation
      // Check if creative spark is provided (user-written or AI-generated)
      const hasCreativeSpark = campaignSpark.trim().length >= 10;
      // Check if visual beats are generated (from Agent 3.2)
      const step2 = existingVideo?.step2Data as any;
      const step3Legacy = existingVideo?.step3Data as any; // Backward compatibility
      const hasVisualBeats = (step2?.narrative?.visual_beats && step2.narrative.visual_beats.length > 0) ||
                             (step3Legacy?.narrative?.visual_beats && step3Legacy.narrative.visual_beats.length > 0);
      const isValid = hasCreativeSpark && hasVisualBeats;
      setCanContinue(isValid);
    } else if (activeStep === "storyboard") {
      // Tab 3: Generate Prompts - no validation needed (just generate)
      setCanContinue(true);
    } else {
      // Other steps - default to true for now
      setCanContinue(true);
    }
  };

  // Update validation when relevant state changes
  useEffect(() => {
    updateValidation();
  }, [activeStep, videoModel, aspectRatio, duration, motionPrompt, targetAudience, campaignSpark, existingVideo]);
  
  // Listen for beats generated event and refetch video data
  useEffect(() => {
    const handleBeatsGenerated = () => {
      // Refetch video data to update validation
      if (videoId && videoId !== 'new') {
        queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
      }
    };
    
    window.addEventListener('beatsGenerated', handleBeatsGenerated);
    return () => window.removeEventListener('beatsGenerated', handleBeatsGenerated);
  }, [videoId, queryClient]);

  // Auto-run Agent 5.1 when entering Tab 3 without existing prompts
  useEffect(() => {
    // Only run if:
    // 1. We're on Tab 3
    // 2. Video exists (not new)
    // 3. No beatPrompts exist yet (check both local state AND existingVideo)
    // 4. Agent 5.1 hasn't been triggered for this entry
    // 5. Not already creating (to prevent duplicate triggers)
    
    // ✅ FIX: Check beatPrompts from both local state and existingVideo
    const hasBeatPrompts = step3Data?.beatPrompts || 
                          (existingVideo?.step3Data as any)?.beatPrompts ||
                          (existingVideo?.step5Data as any)?.beatPrompts; // Backward compatibility
    
    if (
      activeStep === "storyboard" &&
      videoId !== "new" &&
      !hasBeatPrompts &&
      !agent51TriggeredRef.current &&
      !isCreating
    ) {
      agent51TriggeredRef.current = true;
      
      // Trigger Agent 5.1 generation (don't advance to next step automatically)
      generateBeatPrompts(false).catch((error) => {
        // Error is already handled in generateBeatPrompts
        console.error('[SocialCommerce] Auto-trigger Agent 5.1 failed:', error);
      });
    }
    
    // Only reset trigger ref when leaving Tab 3 IF beatPrompts don't exist
    // If beatPrompts exist, keep the ref as true to prevent re-triggering
    if (activeStep !== "storyboard") {
      const hasBeatPrompts = step3Data?.beatPrompts || 
                            (existingVideo?.step3Data as any)?.beatPrompts ||
                            (existingVideo?.step5Data as any)?.beatPrompts;
      // Only reset if no beatPrompts exist (user might want to regenerate)
      if (!hasBeatPrompts) {
        console.log('[SocialCommerce] Resetting agent51TriggeredRef - no beatPrompts found');
      agent51TriggeredRef.current = false;
      } else {
        console.log('[SocialCommerce] Keeping agent51TriggeredRef = true - beatPrompts exist, preventing re-trigger');
    }
      // If beatPrompts exist, keep agent51TriggeredRef.current = true to prevent re-triggering
    }
  }, [activeStep, videoId, step3Data?.beatPrompts, existingVideo, isCreating]); // ✅ Added existingVideo to dependencies

  // Helper function to determine condition from shot
  // Simplified: only uses isLinkedToPrevious since shotType is removed
  const determineCondition = (shot: any): 1 | 2 | 3 | 4 => {
    const isConnected = shot.isLinkedToPrevious;
    
    // Condition 1: Not connected, single image reference
    // Condition 2: Not connected, start/end frames
    // Condition 3: Connected, start/end frames (inherits start frame)
    // Condition 4: Connected, single image reference (inherits image)
    // Since we removed shotType, we'll default to condition 2 (start/end) for all shots
    if (!isConnected) return 2;
    if (isConnected) return 3;
    return 2; // Default fallback
  };
  
  // Helper function to create ShotVersion from Agent 5.1 prompts
  // Removed: createShotVersionFromPrompts - old shot-based structure no longer used
  // New structure uses beatPrompts, not shotPrompts

  // Auto-select default voice on initial load if voiceOverEnabled
  useEffect(() => {
    if (voiceOverEnabled && !voiceActorId && language) {
      const defaultVoice = VOICE_LIBRARY.find(v => v.language === language);
      if (defaultVoice) {
        console.log(`[SocialCommerce] Auto-selecting default voice for initial language ${language}:`, defaultVoice.id);
        setVoiceActorId(defaultVoice.id);
      }
    }
  }, []); // Run only once on mount

  // Capture snapshot when navigating to a completed step
  useEffect(() => {
    if (completedSteps.includes(activeStep) && !stepSnapshots.has(activeStep)) {
      const snapshot = captureStepSnapshot(activeStep);
      setStepSnapshots(prev => new Map(prev).set(activeStep, snapshot));
      console.log('[SocialCommerce] Captured snapshot for step:', activeStep);
    }
  }, [activeStep, completedSteps]);

  // Restore video data when loading existing video
  useEffect(() => {
    if (existingVideo && !isNewVideo) {
      console.log('[SocialCommerce] Restoring video data:', existingVideo.id);
      setVideoId(existingVideo.id);
      setVideoTitle(existingVideo.title);
      
      // Restore step1Data if available
      const step1 = existingVideo.step1Data as any;
      if (step1) {
        if (step1.productTitle) setProductDetails(prev => ({ ...prev, title: step1.productTitle }));
        if (step1.productDescription) setProductDetails(prev => ({ ...prev, description: step1.productDescription }));
        if (step1.aspectRatio) setAspectRatio(step1.aspectRatio);
        if (step1.duration) setDuration(String(step1.duration));
        if (step1.targetAudience) setTargetAudience(step1.targetAudience);
        if (step1.customMotionInstructions) setMotionPrompt(step1.customMotionInstructions);
        // Audio Settings
        if (step1.audioVolume) setAudioVolume(step1.audioVolume);
        if (step1.speechTempo) setSpeechTempo(step1.speechTempo);
        if (step1.voiceoverScript) setVoiceoverScript(step1.voiceoverScript);
        if (step1.customVoiceoverInstructions) setCustomVoiceoverInstructions(step1.customVoiceoverInstructions);
        if (step1.soundEffectsEnabled !== undefined) setSoundEffectsEnabled(step1.soundEffectsEnabled);
        if (step1.soundEffectsPreset) setSoundEffectsPreset(step1.soundEffectsPreset);
        else if (step1.soundEffectsUsePreset !== false) setSoundEffectsPreset("ambient"); // Default if using preset
        if (step1.soundEffectsCustomInstructions) setSoundEffectsCustomInstructions(step1.soundEffectsCustomInstructions);
        if (step1.soundEffectsUsePreset !== undefined) setSoundEffectsUsePreset(step1.soundEffectsUsePreset);
        if (step1.musicEnabled !== undefined) setMusicEnabled(step1.musicEnabled);
        if (step1.musicPreset) setMusicPreset(step1.musicPreset);
        else if (step1.musicUsePreset !== false) setMusicPreset("ambient"); // Default if using preset
        if (step1.musicCustomInstructions) setMusicCustomInstructions(step1.musicCustomInstructions);
        if (step1.musicMood) setMusicMood(step1.musicMood);
        if (step1.musicUsePreset !== undefined) setMusicUsePreset(step1.musicUsePreset);
        // Quality Settings
        if (step1.productionLevel) setProductionLevel(step1.productionLevel);
        // Visual Style
        if (step1.pacingOverride !== undefined) setPacingOverride(step1.pacingOverride);
        if (step1.visualIntensity !== undefined) setVisualIntensity(step1.visualIntensity);
        if (step1.videoModel) setVideoModel(step1.videoModel);
        if (step1.videoResolution) setVideoResolution(step1.videoResolution);
        if (step1.language) setLanguage(step1.language);
        if (step1.voiceOverEnabled !== undefined) setVoiceOverEnabled(step1.voiceOverEnabled);
        if (step1.voiceActorId !== undefined) setVoiceActorId(step1.voiceActorId);
        // Auto-select default voice if voiceOverEnabled but no voiceActorId is set
        if (step1.voiceOverEnabled !== false && !step1.voiceActorId && step1.language) {
          const defaultVoice = VOICE_LIBRARY.find(v => v.language === step1.language);
          if (defaultVoice) {
            console.log(`[SocialCommerce] Auto-selecting default voice for loaded language ${step1.language}:`, defaultVoice.id);
            setVoiceActorId(defaultVoice.id);
          }
        }
      }
      
      // Restore step1Data product image (product images belong to Tab 1, not Tab 2)
      if (step1?.productImageUrl) {
        setProductImages(prev => ({
          ...prev,
          heroProfile: step1.productImageUrl,
        }));
        console.log('[SocialCommerce] Restored productImageUrl from step1Data');
      }
      
      // Restore step2Data if available (NEW: Nested structure)
      const step2 = existingVideo.step2Data as any;
      if (step2) {
        // ✨ NEW: Restore UI inputs first (visualPreset, campaignSpark, campaignObjective)
        if (step2.uiInputs) {
          if (step2.uiInputs.visualPreset) {
            setVisualPreset(step2.uiInputs.visualPreset);
          } else {
            setVisualPreset("cinematic"); // Default if not set
          }
          if (step2.uiInputs.campaignSpark) {
            setCampaignSpark(step2.uiInputs.campaignSpark);
          }
          if (step2.uiInputs.campaignObjective) {
            setCampaignObjective(step2.uiInputs.campaignObjective);
          } else {
            setCampaignObjective("awareness"); // Default if not set
          }
          console.log('[SocialCommerce] Restored uiInputs from step2Data:', {
            hasVisualPreset: !!step2.uiInputs.visualPreset,
            hasCampaignSpark: !!step2.uiInputs.campaignSpark,
            hasCampaignObjective: !!step2.uiInputs.campaignObjective,
          });
        }
        
        // Also check creativeSpark for campaignSpark (if uiInputs doesn't have it)
        if (!step2.uiInputs?.campaignSpark && step2.creativeSpark?.creative_spark) {
          setCampaignSpark(step2.creativeSpark.creative_spark);
          console.log('[SocialCommerce] Restored campaignSpark from step2Data.creativeSpark');
        }
        
        // Product data (material settings only - images are in step1Data)
        if (step2.product) {
          // Note: Product images are now in step1Data, not step2Data
          // Only restore material settings from step2Data
          if (step2.product.material) {
            if (step2.product.material.preset) setMaterialPreset(step2.product.material.preset);
            if (step2.product.material.objectMass !== undefined) setObjectMass(step2.product.material.objectMass);
            if (step2.product.material.surfaceComplexity !== undefined) setSurfaceComplexity(step2.product.material.surfaceComplexity);
            if (step2.product.material.refractionEnabled !== undefined) setRefractionEnabled(step2.product.material.refractionEnabled);
            if (step2.product.material.heroFeature) setHeroFeature(step2.product.material.heroFeature);
            if (step2.product.material.originMetaphor) setOriginMetaphor(step2.product.material.originMetaphor);
          }
        }
        
        // Character data (simplified for Sora)
        if (step2.character) {
          if (step2.character.description) setCharacterDescription(step2.character.description);
          if (step2.character.mode) {
            setCharacterMode(step2.character.mode);
            setIncludeHumanElement(true);
          }
        }
        
        // Cinematography defaults
        if (step2.cinematography) {
          if (step2.cinematography.cameraShotDefault !== undefined) setCameraShotDefault(step2.cinematography.cameraShotDefault);
          if (step2.cinematography.lensDefault !== undefined) setLensDefault(step2.cinematography.lensDefault);
        }
        
        // Load persona (simplified structure for Sora) - moved outside cinematography block
        if (step2.character) {
          if (step2.character.persona) {
            setCharacterPersona(step2.character.persona);
          }
          // Backward compatibility: convert old aiProfile to persona if needed
          if (!step2.character.persona && step2.character.aiProfile) {
            setCharacterPersona({
              detailed_persona: step2.character.aiProfile.detailed_persona || '',
              cultural_fit: step2.character.aiProfile.cultural_fit || '',
              interaction_protocol: step2.character.aiProfile.interaction_protocol || {
                product_engagement: '',
                motion_limitations: '',
              },
            });
          }
        }
        
        // Removed: Brand data restoration (no logo support for Sora)
        // Removed: Style reference restoration (Sora only accepts one image input - product hero)
        
        // ✨ NEW: Restore generated visual beats from narrative output
        if (step2.narrative?.visual_beats && Array.isArray(step2.narrative.visual_beats)) {
          const restoredBeats: { beat1: string; beat2: string; beat3: string } = {
            beat1: "",
            beat2: "",
            beat3: "",
          };
          
          // Map narrative beats to visualBeats state format
          step2.narrative.visual_beats.forEach((beat: any) => {
            if (beat.beatId === 'beat1' && beat.beatDescription) {
              restoredBeats.beat1 = beat.beatDescription;
            } else if (beat.beatId === 'beat2' && beat.beatDescription) {
              restoredBeats.beat2 = beat.beatDescription;
            } else if (beat.beatId === 'beat3' && beat.beatDescription) {
              restoredBeats.beat3 = beat.beatDescription;
            }
          });
          
          setVisualBeats(restoredBeats);
          console.log('[SocialCommerce] Restored visual beats from step2Data.narrative:', {
            beatCount: step2.narrative.visual_beats.length,
            hasBeat1: !!restoredBeats.beat1,
            hasBeat2: !!restoredBeats.beat2,
            hasBeat3: !!restoredBeats.beat3,
          });
        }
        
        console.log('[SocialCommerce] Restored step2Data (nested structure):', {
          hasUiInputs: !!step2.uiInputs,
          hasCharacter: !!step2.character?.persona,
          hasNarrative: !!step2.narrative,
          hasVisualBeats: !!(step2.narrative?.visual_beats && step2.narrative.visual_beats.length > 0),
          // Note: Product images are now in step1Data, not step2Data
        });
      }
      
      // Restore step2Data from old step3Data if available (backward compatibility)
      const step2FromLegacy = existingVideo.step3Data as any;
      if (step2FromLegacy) {
        // NEW: Prioritize uiInputs if available (most complete)
        if (step2FromLegacy.uiInputs) {
          setVisualPreset(step2FromLegacy.uiInputs.visualPreset || 'cinematic');
          setCampaignSpark(step2FromLegacy.uiInputs.campaignSpark || '');
          setCampaignObjective(step2FromLegacy.uiInputs.campaignObjective || 'awareness');
        } else {
          // Fallback to old structure (backward compatibility)
          // Creative Spark
          if (step2FromLegacy.creativeSpark?.creative_spark) {
            setCampaignSpark(step2FromLegacy.creativeSpark.creative_spark);
          } else if (typeof step2FromLegacy.campaignSpark === 'string') {
            setCampaignSpark(step2FromLegacy.campaignSpark);
          }
          
          // Campaign Objective (optional)
          if (step2FromLegacy.campaignObjective) {
            setCampaignObjective(step2FromLegacy.campaignObjective);
          } else {
            setCampaignObjective("awareness"); // Default if not set
          }
          
          // Visual Preset
          if (step2FromLegacy.uiInputs?.visualPreset) {
            setVisualPreset(step2FromLegacy.uiInputs.visualPreset);
          } else {
            setVisualPreset("cinematic"); // Default if not set
          }
        }
        
        // ✨ NEW: Also restore visual beats from legacy step3Data
        if (step2FromLegacy.narrative?.visual_beats && Array.isArray(step2FromLegacy.narrative.visual_beats)) {
          const restoredBeats: { beat1: string; beat2: string; beat3: string } = {
            beat1: "",
            beat2: "",
            beat3: "",
          };
          
          step2FromLegacy.narrative.visual_beats.forEach((beat: any) => {
            if (beat.beatId === 'beat1' && beat.beatDescription) {
              restoredBeats.beat1 = beat.beatDescription;
            } else if (beat.beatId === 'beat2' && beat.beatDescription) {
              restoredBeats.beat2 = beat.beatDescription;
            } else if (beat.beatId === 'beat3' && beat.beatDescription) {
              restoredBeats.beat3 = beat.beatDescription;
            }
          });
          
          setVisualBeats(restoredBeats);
          console.log('[SocialCommerce] Restored visual beats from legacy step3Data.narrative:', {
            beatCount: step2FromLegacy.narrative.visual_beats.length,
          });
        }
        
        console.log('[SocialCommerce] Restored step2Data from legacy step3Data:', {
          hasUiInputs: !!step2FromLegacy.uiInputs,
          hasCreativeSpark: !!step2FromLegacy.creativeSpark || !!step2FromLegacy.campaignSpark,
          hasNarrative: !!step2FromLegacy.narrative,
          hasVisualBeats: !!(step2FromLegacy.narrative?.visual_beats && step2FromLegacy.narrative.visual_beats.length > 0),
        });
      }
      
      // ✨ NEW: Restore step3Data if available (Agent 5.1 and 5.2 outputs)
      // Check both step3Data (new) and step5Data (backward compatibility)
      const step3Prompts = existingVideo.step3Data as any;
      const step5 = existingVideo.step5Data as any; // Backward compatibility
      const promptsData = step3Prompts || step5;
      if (promptsData) {
        setStep3Data({
          beatPrompts: promptsData.beatPrompts,
          voiceoverScripts: promptsData.voiceoverScripts,
          beatVideos: promptsData.beatVideos || {},
        });
      }
      // Note: shotPrompts removed - new structure uses beatPrompts only

      // ✨ NEW: Restore step4Data if available (Voiceover Audios)
      const step4Audio = existingVideo.step4Data as any;
      if (step4Audio?.voiceoverAudios) {
        setStep4Data({
          voiceoverAudios: step4Audio.voiceoverAudios,
        });
      }
      
      // Restore completedSteps
      if (Array.isArray(existingVideo.completedSteps)) {
        const stepMap: { [key: number]: CommerceStepId } = {
          1: "setup",
          2: "script",
          3: "storyboard",
          4: "voiceover",
          5: "animatic",
          6: "export",
        };
        const restored = existingVideo.completedSteps
          .map(n => stepMap[n as number])
          .filter(Boolean) as CommerceStepId[];
        setCompletedSteps(restored);
      }
      
      // Set current step based on currentStep from DB
      // ✅ FIX: Only restore currentStep if user hasn't manually navigated ahead
      // This prevents reverting to a previous step after Agent completes
      if (existingVideo.currentStep) {
        const stepMap: { [key: number]: CommerceStepId } = {
          1: "setup",
          2: "script",
          3: "storyboard",
          4: "voiceover",
          5: "animatic",
          6: "export",
        };
        const currentStepId = stepMap[existingVideo.currentStep];
        if (currentStepId) {
          // Only set activeStep if it's not already ahead of the saved currentStep
          const stepOrder: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
          const savedIndex = stepOrder.indexOf(currentStepId);
          const currentIndex = stepOrder.indexOf(activeStep);
          
          // Only restore if current activeStep is behind or equal to saved step
          // This prevents reverting when user has navigated ahead
          if (currentIndex <= savedIndex || currentIndex === -1) {
            setActiveStep(currentStepId);
          } else {
            console.log('[SocialCommerce] Skipping currentStep restore - user is ahead:', {
              savedStep: currentStepId,
              currentActiveStep: activeStep,
            });
          }
        }
      }
    }
  }, [existingVideo, isNewVideo]);

  // Auto-create video when landing on new video page
  useEffect(() => {
    const createVideoProject = async () => {
      if (!isNewVideo || !workspaceId || creationAttempted.current) {
        return;
      }
      
      creationAttempted.current = true;
      setIsCreating(true);
      
      try {
        // Create video in database using the title from URL params
        // Duration is not set here - user will select it in Tab 1
        const response = await fetch('/api/social-commerce/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            workspaceId,
            title: urlTitle,
            productTitle: urlTitle,
            aspectRatio: "9:16",
            // duration removed - user will select in Tab 1
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create video');
        }
        
        const video = await response.json();
        
        // Update state with new video ID
        setVideoId(video.id);
        setVideoTitle(video.title);
        setProductDetails(prev => ({ ...prev, title: urlTitle }));
        
        // Update URL with new video ID (without page reload)
        window.history.replaceState(
          {},
          '',
          `/videos/commerce/${video.id}?workspace=${workspaceId}`
        );
        
        console.log('[SocialCommerce] Video created:', video.id);
      } catch (error) {
        console.error('Failed to create video:', error);
        creationAttempted.current = false; // Allow retry
      } finally {
        setIsCreating(false);
      }
    };
    
    createVideoProject();
  }, [isNewVideo, workspaceId, urlTitle]);

  // Auto-save character and material settings to step2Data when they change
  useEffect(() => {
    const saveCharacterAndMaterialSettings = async () => {
      // Only save if we have a valid video ID and we're not loading an existing video
      if (!videoId || videoId === 'new' || isNewVideo || !existingVideo) {
        return;
      }

      // Only save if we have meaningful character or material data
      const hasCharacterData = characterPersona || characterMode || materialPreset;
      if (!hasCharacterData) {
        return;
      }

      try {
        const updates: any = {};

        // Build character updates (nested structure - simplified for Sora)
        const hasCharacterUpdates = characterPersona || characterMode || characterDescription;
        if (hasCharacterUpdates) {
          updates.character = {};
          if (characterPersona) updates.character.persona = characterPersona;
          if (characterMode) updates.character.mode = characterMode;
          if (characterDescription) updates.character.description = characterDescription;
        }

        // Build product.material updates (nested structure)
        const hasMaterialUpdates = materialPreset || surfaceComplexity !== undefined || refractionEnabled !== undefined || heroFeature || originMetaphor;
        if (hasMaterialUpdates) {
          updates.product = { material: {} };
          if (materialPreset) updates.product.material.preset = materialPreset;
          if (surfaceComplexity !== undefined) updates.product.material.surfaceComplexity = surfaceComplexity;
          if (refractionEnabled !== undefined) updates.product.material.refractionEnabled = refractionEnabled;
          if (heroFeature) updates.product.material.heroFeature = heroFeature;
          if (originMetaphor) updates.product.material.originMetaphor = originMetaphor;
        }

        // Only make API call if we have updates
        if (Object.keys(updates).length > 0) {
          await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates),
          });
          console.log('[SocialCommerce] Auto-saved character/material settings (nested structure)');
        }
      } catch (error) {
        console.error('Failed to auto-save settings to step2Data:', error);
      }
    };

    // Debounce to avoid excessive API calls
    const timeoutId = setTimeout(saveCharacterAndMaterialSettings, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    videoId,
    isNewVideo,
    existingVideo,
    characterPersona,
    characterMode,
    characterDescription,
    includeHumanElement,
    materialPreset,
    surfaceComplexity,
    refractionEnabled,
    heroFeature,
    originMetaphor,
  ]);

  // Map old workflow step IDs to new studio step IDs
  const workflowStepMap: { [key in CommerceStepId]: string } = {
    "setup": "setup",  // Tab 1 = Setup + Product Image (ProductSetupTab)
    "script": "environment-story",  // Tab 2 = Creative Spark + Beats (VisualStyleTab - simplified)
    "storyboard": "storyboard",  // Tab 3 = Generate Prompts (BeatStoryboardTab)
    "voiceover": "voiceover",  // Tab 4 = Voiceover (VoiceoverTab)
    "animatic": "animatic",
    "export": "export"
  };

  // Helper: Convert step to number
  const stepToNumber = (step: CommerceStepId): number => {
    const stepMap: { [key in CommerceStepId]: number } = {
      "setup": 1,
      "script": 2,
      "storyboard": 3,
      "voiceover": 4,
      "animatic": 5,
      "export": 6
    };
    return stepMap[step];
  };

  // Helper: Check if target step is ahead of current
  const isStepAhead = (target: CommerceStepId, current: CommerceStepId): boolean => {
    return stepToNumber(target) > stepToNumber(current);
  };

  // Helper: Capture snapshot of current step's data
  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE UPLOAD HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleProductImageUpload = async (
    type: 'hero' | 'angle' | 'element' | 'ai_mode',
    file: File,
    description?: string,
    existingId?: string
  ) => {
    try {
      if (!currentWorkspace?.id || !videoId) {
        console.error('[SocialCommerce] Cannot upload: Workspace or video not ready');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'product');
      formData.append('workspaceId', currentWorkspace.id);
      formData.append('videoId', videoId);

      const response = await fetch('/api/social-commerce/upload-temp', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Store CDN URL and asset ID based on type
      if (type === 'hero') {
        setProductImages(prev => ({ ...prev, heroProfile: data.cdnUrl }));
        setProductImageAssetIds(prev => ({ ...prev, heroProfile: data.assetId }));
        
        // Save to step1Data for backward compatibility
        if (videoId && videoId !== 'new') {
          try {
            const updatedImages = {
              ...productImages,
              heroProfile: data.cdnUrl,
            };
            await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productImageUrl: data.cdnUrl,
                productImages: updatedImages,
              }),
            });
            console.log(`[SocialCommerce] Saved productImageUrl to step1Data`);
          } catch (saveError) {
            console.error('Failed to save to step1Data:', saveError);
          }
        }
      } else if (type === 'angle') {
        if (existingId) {
          // Replace existing image
          setProductImages(prev => ({
            ...prev,
            productAngles: (prev.productAngles || []).map(angle =>
              angle.id === existingId
                ? { ...angle, url: data.cdnUrl, uploadedAt: Date.now() }
                : angle
            ),
          }));
          setProductImageAssetIds(prev => ({
            ...prev,
            productAngles: {
              ...(prev.productAngles || {}),
              [existingId]: data.assetId,
            },
          }));
        } else {
          // Add new image
          const id = `angle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setProductImages(prev => ({
            ...prev,
            productAngles: [
              ...(prev.productAngles || []),
              { id, url: data.cdnUrl, uploadedAt: Date.now() }
            ],
          }));
          setProductImageAssetIds(prev => ({
            ...prev,
            productAngles: {
              ...(prev.productAngles || {}),
              [id]: data.assetId,
            },
          }));
        }
        
        // Save to step1Data after state update
        if (videoId && videoId !== 'new') {
          try {
            // Calculate updated state
            const updatedImages = existingId
              ? {
                  ...productImages,
                  productAngles: (productImages?.productAngles || []).map(angle =>
                    angle.id === existingId
                      ? { ...angle, url: data.cdnUrl, uploadedAt: Date.now() }
                      : angle
                  ),
                }
              : {
                  ...productImages,
                  productAngles: [
                    ...(productImages?.productAngles || []),
                    { id: existingId || `angle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, url: data.cdnUrl, uploadedAt: Date.now() }
                  ],
                };
            
            // Save to backend
            await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productImages: updatedImages,
              }),
            });
            console.log(`[SocialCommerce] Saved productAngles to step1Data`);
          } catch (saveError) {
            console.error('Failed to save to step1Data:', saveError);
          }
        }
      } else if (type === 'element') {
        if (existingId) {
          // Replace existing image
          setProductImages(prev => ({
            ...prev,
            elements: (prev.elements || []).map(element =>
              element.id === existingId
                ? { ...element, url: data.cdnUrl, uploadedAt: Date.now(), description: description || element.description }
                : element
            ),
          }));
          setProductImageAssetIds(prev => ({
            ...prev,
            elements: {
              ...(prev.elements || {}),
              [existingId]: data.assetId,
            },
          }));
        } else {
          // Add new image
          const id = `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          setProductImages(prev => ({
            ...prev,
            elements: [
              ...(prev.elements || []),
              { id, url: data.cdnUrl, uploadedAt: Date.now(), description }
            ],
          }));
          setProductImageAssetIds(prev => ({
            ...prev,
            elements: {
              ...(prev.elements || {}),
              [id]: data.assetId,
            },
          }));
        }
        
        // Save to step1Data after state update
        if (videoId && videoId !== 'new') {
          try {
            // Calculate updated state
            const updatedImages = existingId
              ? {
                  ...productImages,
                  elements: (productImages?.elements || []).map(element =>
                    element.id === existingId
                      ? { ...element, url: data.cdnUrl, uploadedAt: Date.now(), description: description || element.description }
                      : element
                  ),
                }
              : {
                  ...productImages,
                  elements: [
                    ...(productImages?.elements || []),
                    { id: existingId || `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, url: data.cdnUrl, uploadedAt: Date.now(), description }
                  ],
                };
            
            // Save to backend
            await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productImages: updatedImages,
              }),
            });
            console.log(`[SocialCommerce] Saved elements to step1Data`);
          } catch (saveError) {
            console.error('Failed to save to step1Data:', saveError);
          }
        }
      } else if (type === 'ai_mode') {
        // AI mode: Add to aiModeImages array
        const id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setProductImages(prev => ({
          ...prev,
          aiModeImages: [
            ...(prev.aiModeImages || []),
            { id, url: data.cdnUrl, uploadedAt: Date.now() }
          ],
        }));
        setProductImageAssetIds(prev => ({
          ...prev,
          aiModeImages: {
            ...(prev.aiModeImages || {}),
            [id]: data.assetId,
          },
        }));
        
        // Save to step1Data
        if (videoId && videoId !== 'new') {
          try {
            const updatedImages = {
              ...productImages,
              aiModeImages: [
                ...(productImages?.aiModeImages || []),
                { id, url: data.cdnUrl, uploadedAt: Date.now() }
              ],
            };
            await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productImages: updatedImages,
              }),
            });
            console.log(`[SocialCommerce] Saved aiModeImages to step1Data`);
          } catch (saveError) {
            console.error('Failed to save to step1Data:', saveError);
          }
        }
      }

      // Image uploaded successfully
      console.log('[SocialCommerce] Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  // Removed: handleCharacterImageUpload - no character image upload for Sora
  // Removed: handleLogoUpload - no logo upload for Sora

  // Removed: handleStyleReferenceUpload - Sora only accepts one image input (product hero)

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSET DELETION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Removed: handleDeleteCharacter - no character image deletion for Sora
  // Removed: handleDeleteLogo - no logo deletion for Sora

  // Prompt preview dialog state
  const [isPromptPreviewOpen, setIsPromptPreviewOpen] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<string>('');
  const [previewMetadata, setPreviewMetadata] = useState<{
    layoutDescription: string;
    styleGuidance: string;
    sourceImages: string[];
  } | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>('');

  // Generate prompt only (for AI mode)
  const handleGeneratePrompt = async (context?: string): Promise<void> => {
    try {
      if (!videoId || videoId === 'new') {
        const errorMsg = 'Please wait for the video to be created. If this persists, please refresh the page.';
        console.error('[Generate Prompt] Video ID not available:', videoId);
        throw new Error(errorMsg);
      }

      // Collect all image URLs (heroProfile is used as Reference Image in AI mode)
      const sourceImages: string[] = [];
      
      // Add heroProfile as the primary reference image in AI mode
      if (productImages?.heroProfile) {
        sourceImages.push(productImages.heroProfile);
      }
      
      // Also include any additional AI mode images if present
      if (productImages?.aiModeImages) {
        sourceImages.push(...productImages.aiModeImages.map((img: { id: string; url: string; uploadedAt: number }) => img.url));
      }

      if (sourceImages.length === 0) {
        throw new Error('No images to combine. Please upload at least one image.');
      }

      if (sourceImages.length > 6) {
        throw new Error('Maximum 6 images allowed for AI mode.');
      }

      console.log('[Generate Prompt] Starting prompt generation:', {
        videoId,
        imageCount: sourceImages.length,
        hasContext: !!context,
      });

      // Call prompt generation endpoint
      const response = await fetch(`/api/social-commerce/videos/${videoId}/composite/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          images: sourceImages,
          context: context || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate prompt' }));
        console.error('[Generate Prompt] API error:', error);
        throw new Error(error.error || error.details || 'Failed to generate prompt');
      }

      const data = await response.json();
      console.log('[Generate Prompt] Success:', data);

      // Set preview data and open dialog
      setPreviewPrompt(data.prompt);
      setEditedPrompt(data.prompt);
      setPreviewMetadata({
        layoutDescription: data.layoutDescription,
        styleGuidance: data.styleGuidance,
        sourceImages: data.sourceImages || sourceImages,
      });
      setIsPromptPreviewOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate prompt";
      console.error('[Generate Prompt] Error:', error, errorMessage);
      throw error;
    }
  };

  // Generate image with prompt (for AI mode)
  const handleGenerateImage = async (
    prompt: string,
    layoutDescription: string,
    styleGuidance: string,
    sourceImages: string[],
    context?: string
  ): Promise<string> => {
    try {
      if (!videoId || videoId === 'new') {
        const errorMsg = 'Please wait for the video to be created. If this persists, please refresh the page.';
        console.error('[Generate Image] Video ID not available:', videoId);
        throw new Error(errorMsg);
      }

      console.log('[Generate Image] Starting image generation:', {
        videoId,
        imageCount: sourceImages.length,
        promptLength: prompt.length,
      });

      // Call backend API with prompt
      const response = await fetch(`/api/social-commerce/videos/${videoId}/composite/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'ai_generated',
          images: sourceImages,
          context: context || undefined,
          prompt,
          layoutDescription,
          styleGuidance,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate composite' }));
        console.error('[Generate Image] API error:', error);
        throw new Error(error.error || error.details || 'Failed to generate composite');
      }

      const data = await response.json();
      console.log('[Generate Image] Success:', data);

      // Update state
      setProductImages(prev => ({
        ...prev,
        compositeImage: {
          url: data.compositeUrl,
          generatedAt: data.generatedAt || Date.now(),
          mode: 'ai_generated',
          sourceImages: data.sourceImages || sourceImages,
          prompt: prompt,
        },
        aiContext: context ? {
          description: context,
          generatedAt: Date.now(),
        } : prev.aiContext,
      }));

      // Save to step1Data
      try {
        await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productImages: {
              ...productImages,
              compositeImage: {
                url: data.compositeUrl,
                generatedAt: data.generatedAt || Date.now(),
                mode: 'ai_generated',
                sourceImages: data.sourceImages || sourceImages,
                prompt: prompt,
              },
              aiContext: context ? {
                description: context,
                generatedAt: Date.now(),
              } : productImages?.aiContext,
            },
          }),
        });
      } catch (saveError) {
        console.error('Failed to save composite to step1Data:', saveError);
        // Don't throw - composite was generated successfully
      }

      // Close preview dialog
      setIsPromptPreviewOpen(false);

      // Composite generated successfully
      console.log('[SocialCommerce] Composite generated successfully');

      return data.compositeUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate composite image";
      console.error('[Generate Image] Error:', error, errorMessage);
      throw error;
    }
  };

  const handleCompositeGenerate = async (
    mode: 'manual' | 'ai_generated',
    context?: string
  ): Promise<string> => {
    try {
      // Better error message if video not created yet
      if (!videoId || videoId === 'new') {
        const errorMsg = 'Please wait for the video to be created. If this persists, please refresh the page.';
        console.error('[Composite Generate] Video ID not available:', videoId);
        throw new Error(errorMsg);
      }
      
      if (mode === 'manual') {
        // Collect all image URLs
        const sourceImages: string[] = [];
        if (productImages?.heroProfile) sourceImages.push(productImages.heroProfile);
        if (productImages?.productAngles) {
          sourceImages.push(...productImages.productAngles.map(a => a.url));
        }
        if (productImages?.elements) {
          sourceImages.push(...productImages.elements.map(e => e.url));
        }
        
        if (sourceImages.length === 0) {
          throw new Error('No images to combine. Please upload at least the hero image.');
        }
        
        console.log('[Composite Generate] Starting generation:', {
          videoId,
          imageCount: sourceImages.length,
          mode,
        });
        
        // Call backend API
        const response = await fetch(`/api/social-commerce/videos/${videoId}/composite/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mode: 'manual',
            heroImage: productImages.heroProfile,
            productAngles: productImages.productAngles?.map(a => a.url) || [],
            elements: productImages.elements?.map(e => e.url) || [],
          }),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to generate composite' }));
          console.error('[Composite Generate] API error:', error);
          throw new Error(error.error || error.details || 'Failed to generate composite');
        }
        
        const data = await response.json();
        console.log('[Composite Generate] Success:', data);
        
        // Update state
        setProductImages(prev => ({
          ...prev,
          compositeImage: {
            url: data.compositeUrl,
            generatedAt: data.generatedAt || Date.now(),
            mode: 'manual',
            sourceImages: data.sourceImages || sourceImages,
          },
        }));
        
        // Save to step1Data
        try {
          await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productImages: {
                ...productImages,
                compositeImage: {
                  url: data.compositeUrl,
                  generatedAt: data.generatedAt || Date.now(),
                  mode: 'manual',
                  sourceImages: data.sourceImages || sourceImages,
                },
              },
            }),
          });
        } catch (saveError) {
          console.error('Failed to save composite to step1Data:', saveError);
          // Don't throw - composite was generated successfully
        }
        
        // Composite generated successfully
        console.log('[SocialCommerce] Composite generated successfully');
        
        return data.compositeUrl;
      } else {
        // AI mode - use Nano Banana Pro via Runware
        // Collect all image URLs (heroProfile is used as Reference Image in AI mode)
        const sourceImages: string[] = [];
        
        // Add heroProfile as the primary reference image in AI mode
        if (productImages?.heroProfile) {
          sourceImages.push(productImages.heroProfile);
        }
        
        // Also include any additional AI mode images if present
        if (productImages?.aiModeImages) {
          sourceImages.push(...productImages.aiModeImages.map((img: { id: string; url: string; uploadedAt: number }) => img.url));
        }
        
        if (sourceImages.length === 0) {
          throw new Error('No images to combine. Please upload at least one image.');
        }
        
        if (sourceImages.length > 6) {
          throw new Error('Maximum 6 images allowed for AI mode.');
        }
        
        console.log('[Composite Generate] Starting AI generation:', {
          videoId,
          imageCount: sourceImages.length,
          mode,
          hasContext: !!context,
        });
        
        // Call backend API
        const response = await fetch(`/api/social-commerce/videos/${videoId}/composite/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            mode: 'ai_generated',
            images: sourceImages,
            context: context || undefined,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to generate composite' }));
          console.error('[Composite Generate] API error:', error);
          throw new Error(error.error || error.details || 'Failed to generate composite');
        }
        
        const data = await response.json();
        console.log('[Composite Generate] AI Success:', data);
        
        // Update state
        setProductImages(prev => ({
          ...prev,
          compositeImage: {
            url: data.compositeUrl,
            generatedAt: data.generatedAt || Date.now(),
            mode: 'ai_generated',
            sourceImages: data.sourceImages || sourceImages,
            ...(data.prompt && { prompt: data.prompt }),
          },
          aiContext: context ? {
            description: context,
            generatedAt: Date.now(),
          } : prev.aiContext,
        }));
        
        // Save to step1Data
        try {
          await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productImages: {
                ...productImages,
                compositeImage: {
                  url: data.compositeUrl,
                  generatedAt: data.generatedAt || Date.now(),
                  mode: 'ai_generated',
                  sourceImages: data.sourceImages || sourceImages,
                  ...(data.prompt && { prompt: data.prompt }),
                },
                aiContext: context ? {
                  description: context,
                  generatedAt: Date.now(),
                } : productImages?.aiContext,
              },
            }),
          });
        } catch (saveError) {
          console.error('Failed to save composite to step1Data:', saveError);
          // Don't throw - composite was generated successfully
        }
        
        // Composite generated successfully
        console.log('[SocialCommerce] Composite generated successfully');
        
        return data.compositeUrl;
      }
    } catch (error) {
      // Log error
      const errorMessage = error instanceof Error ? error.message : "Failed to generate composite image";
      console.error('[Composite Generate] Error:', error, errorMessage);
      throw error; // Re-throw to let component handle it
    }
  };

  const handleModeChange = (mode: 'manual' | 'ai_generated') => {
    setProductImages(prev => ({ ...prev, mode }));
  };

  const handleModeSwitchWithCleanup = async (newMode: 'manual' | 'ai_generated') => {
    // Check if there's a composite image to delete
    if (productImages?.compositeImage?.url && videoId && videoId !== 'new') {
      try {
        // Delete composite image from CDN
        const compositeUrl = productImages.compositeImage.url;
        const response = await fetch(`/api/social-commerce/composite`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ url: compositeUrl }),
        });

        if (!response.ok) {
          console.warn('[Mode Switch] Failed to delete composite from CDN, continuing anyway');
        } else {
          console.log('[Mode Switch] Composite image deleted from CDN');
        }
      } catch (error) {
        console.error('[Mode Switch] Error deleting composite:', error);
        // Continue with mode switch even if deletion fails
      }
    }

    // Clear composite state
    setProductImages(prev => ({
      ...prev,
      mode: newMode,
      compositeImage: undefined,
      // Clear mode-specific images when switching
      ...(newMode === 'manual' ? { aiModeImages: undefined } : { 
        productAngles: undefined,
        elements: undefined,
      }),
    }));

    // Save to step1Data (clearing composite from database)
    if (videoId && videoId !== 'new') {
      try {
        // Get current step1Data to merge properly
        const videoResponse = await fetch(`/api/social-commerce/videos/${videoId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (videoResponse.ok) {
          const video = await videoResponse.json();
          const currentStep1Data = video.step1Data || {};
          
          // Clear composite image from step1Data (use null for deepMerge to delete)
          const updatedProductImages: any = {
            ...(currentStep1Data.productImages || {}),
            mode: newMode,
            compositeImage: null, // Use null so deepMerge removes it from database
            // Clear mode-specific images when switching
            ...(newMode === 'manual' 
              ? { aiModeImages: null, aiContext: null }
              : { productAngles: null, elements: null }
            ),
          };
          
          await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productImages: updatedProductImages,
            }),
          });
          console.log('[Mode Switch] Mode switch and composite deletion saved to step1Data');
        }
      } catch (error) {
        console.error('[Mode Switch] Failed to save mode switch:', error);
        // Continue even if save fails
      }
    }
  };

  const handleApplyComposite = async () => {
    if (!productImages?.compositeImage) return;
    
    setProductImages(prev => ({
      ...prev,
      compositeImage: {
        ...prev.compositeImage!,
        isApplied: true,
      },
    }));
    
    // Save to step1Data
    if (videoId && videoId !== 'new') {
      try {
        await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productImages: {
              ...productImages,
              compositeImage: {
                ...productImages.compositeImage!,
                isApplied: true,
              },
            },
          }),
        });
        console.log('[SocialCommerce] Applied composite saved to step1Data');
      } catch (error) {
        console.error('Failed to save applied composite:', error);
      }
    }
  };

  const handleRemoveAppliedComposite = () => {
    setProductImages(prev => ({
      ...prev,
      compositeImage: undefined, // Remove composite to return to upload sections
    }));
    
    // Save to step1Data
    if (videoId && videoId !== 'new') {
      try {
        fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productImages: {
              ...productImages,
              compositeImage: undefined,
            },
          }),
        });
        console.log('[SocialCommerce] Removed applied composite from step1Data');
      } catch (error) {
        console.error('Failed to remove applied composite:', error);
      }
    }
  };

  const handleDeleteProductImage = async (
    type: 'hero' | 'angle' | 'element' | 'ai_mode',
    id?: string
  ) => {
    try {
      if (type === 'hero') {
        const assetId = productImageAssetIds.heroProfile;
        if (assetId && videoId && videoId !== 'new') {
          // Delete from backend (will be fully implemented in backend sprint)
          const params = new URLSearchParams();
          params.append('videoId', videoId);
          params.append('imageKey', 'heroProfile');
          params.append('imageType', 'product');
          const url = `/api/social-commerce/assets/upload/${assetId}?${params.toString()}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete from Assets');
          }
        }
        setProductImages(prev => ({ ...prev, heroProfile: null }));
        setProductImageAssetIds(prev => ({ ...prev, heroProfile: null }));
      } else if (type === 'angle' && id) {
        const assetId = productImageAssetIds.productAngles?.[id];
        if (assetId && videoId && videoId !== 'new') {
          // Delete from backend (will be fully implemented in backend sprint)
          const params = new URLSearchParams();
          params.append('videoId', videoId);
          params.append('imageKey', `productAngles.${id}`);
          params.append('imageType', 'product');
          const url = `/api/social-commerce/assets/upload/${assetId}?${params.toString()}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete from Assets');
          }
        }
        setProductImages(prev => ({
          ...prev,
          productAngles: (prev.productAngles || []).filter(a => a.id !== id),
        }));
        setProductImageAssetIds(prev => {
          const updatedAngles = { ...(prev.productAngles || {}) };
          delete updatedAngles[id];
          return {
            ...prev,
            productAngles: Object.keys(updatedAngles).length > 0 ? updatedAngles : undefined,
          };
        });
      } else if (type === 'element' && id) {
        const assetId = productImageAssetIds.elements?.[id];
        if (assetId && videoId && videoId !== 'new') {
          // Delete from backend (will be fully implemented in backend sprint)
          const params = new URLSearchParams();
          params.append('videoId', videoId);
          params.append('imageKey', `elements.${id}`);
          params.append('imageType', 'product');
          const url = `/api/social-commerce/assets/upload/${assetId}?${params.toString()}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete from Assets');
          }
        }
        setProductImages(prev => ({
          ...prev,
          elements: (prev.elements || []).filter(e => e.id !== id),
        }));
        setProductImageAssetIds(prev => {
          const updatedElements = { ...(prev.elements || {}) };
          delete updatedElements[id];
          return {
            ...prev,
            elements: Object.keys(updatedElements).length > 0 ? updatedElements : undefined,
          };
        });
      } else if (type === 'ai_mode' && id) {
        const assetId = productImageAssetIds.aiModeImages?.[id];
        if (assetId && videoId && videoId !== 'new') {
          // Delete from backend
          const params = new URLSearchParams();
          params.append('videoId', videoId);
          params.append('imageKey', `aiModeImages.${id}`);
          params.append('imageType', 'product');
          const url = `/api/social-commerce/assets/upload/${assetId}?${params.toString()}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete from Assets');
          }
        }
        setProductImages(prev => ({
          ...prev,
          aiModeImages: (prev.aiModeImages || []).filter((img: { id: string; url: string; uploadedAt: number }) => img.id !== id),
        }));
        setProductImageAssetIds(prev => {
          const updatedAiModeImages = { ...(prev.aiModeImages || {}) };
          delete updatedAiModeImages[id];
          return {
            ...prev,
            aiModeImages: Object.keys(updatedAiModeImages).length > 0 ? updatedAiModeImages : undefined,
          };
        });
        
        // Save to step1Data
        if (videoId && videoId !== 'new') {
          try {
            const updatedImages = {
              ...productImages,
              aiModeImages: (productImages?.aiModeImages || []).filter((img: { id: string; url: string; uploadedAt: number }) => img.id !== id),
            };
            await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                productImages: updatedImages,
              }),
            });
          } catch (saveError) {
            console.error('Failed to save to step1Data:', saveError);
          }
        }
      }

      console.log('[SocialCommerce] Image deleted successfully');
    } catch (error) {
      console.error('Delete product image error:', error);
      // State remains unchanged - item still visible in UI
    }
  };

  const captureStepSnapshot = (step: CommerceStepId): any => {
    if (step === "setup") {
      return {
        videoModel,
        aspectRatio,
        duration,
        motionPrompt,
        targetAudience,
        // Audio Settings
        audioVolume,
        voiceoverScript,
        customVoiceoverInstructions,
        soundEffectsEnabled,
        soundEffectsPreset,
        soundEffectsCustomInstructions,
        soundEffectsUsePreset,
        musicEnabled,
        musicPreset,
        musicCustomInstructions,
        musicMood,
        musicUsePreset,
        // Quality Settings
        productionLevel,
        // Visual Style
        pacingOverride,
      };
    }
    if (step === "script") {
      return {
        productImages: { ...productImages },
        materialPreset,
        surfaceComplexity,
        refractionEnabled,
        heroFeature,
        originMetaphor,
        includeHumanElement,
        characterMode,
        characterDescription,
        characterPersona, // Use persona instead of characterReferenceUrl, characterName
        // Removed: logoUrl, brandPrimaryColor, brandSecondaryColor, logoIntegrity, logoDepth (no logo support for Sora)
        // Removed: styleReferenceUrl (Sora only accepts one image input - product hero)
      };
    }
    // Removed: environment step (consolidated into script step)
    // Environment settings are now part of script tab
    // Add other steps as they are implemented
    return {};
  };

  // Helper: Mark a step as dirty (modified after completion)
  const markStepDirty = (step: CommerceStepId) => {
    if (completedSteps.includes(step)) {
      setDirtySteps(prev => new Set(prev).add(step));
    }
  };

  const handleStepClick = (step: CommerceStepId) => {
    // Prevent access to voiceover step if disabled
    if (step === "voiceover" && !voiceOverEnabled) {
      console.warn('[SocialCommerce] Voiceover is disabled');
      return;
    }

    // Check if current step is dirty and we're trying to go forward
    if (
      dirtySteps.has(activeStep) && 
      completedSteps.includes(activeStep) &&
      isStepAhead(step, activeStep)
    ) {
      setShowResetWarning(true);
      setPendingNavigation(step);
      return;
    }

    setDirection(step > activeStep ? 1 : -1);
    transitionToStep(step, 200); // Smooth transition when clicking steps
  };

  // Helper function for smooth step transitions
  const transitionToStep = (nextStep: CommerceStepId, delay: number = 300) => {
    console.log('[SocialCommerce] transitionToStep called', {
      nextStep,
      currentActiveStep: activeStep,
      isVoiceover: nextStep === "voiceover",
    });
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveStep(nextStep);
      console.log('[SocialCommerce] activeStep updated to:', nextStep);
      setTimeout(() => setIsTransitioning(false), 100); // Small delay for animation to complete
    }, delay);
  };

  // Extract Agent 5.2 generation logic to reusable function
  const generateVoiceoverScripts = async (shouldAdvance: boolean = false) => {
    if (videoId === "new") {
      console.error('[SocialCommerce] Video not created yet');
      return;
    }

    setIsCreating(true);

    try {
      console.log('[SocialCommerce] Starting voiceover script generation (Agent 5.2)...', {
        videoId,
        url: `/api/social-commerce/videos/${videoId}/step/3/generate-voiceover-scripts`,
      });
      
      let response: Response;
      try {
        response = await fetch(`/api/social-commerce/videos/${videoId}/step/3/generate-voiceover-scripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
      } catch (networkError) {
        console.error('[SocialCommerce] Network error during voiceover generation:', networkError);
        throw new Error(
          networkError instanceof Error 
            ? `Network error: ${networkError.message}` 
            : 'Failed to connect to server. Please check your internet connection.'
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to generate voiceover scripts');
      }

      const data = await response.json();
      console.log('[SocialCommerce] Voiceover scripts generated:', {
        beatCount: data.beatCount,
        hasVoiceoverScripts: !!data.step3Data?.voiceoverScripts,
      });

      // Update local state
      if (data.step3Data) {
        setStep3Data(prev => ({
          ...prev,
          voiceoverScripts: data.step3Data.voiceoverScripts,
        }));
        queryClient.setQueryData([`/api/videos/${videoId}`], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            step3Data: {
              ...old.step3Data,
              voiceoverScripts: data.step3Data.voiceoverScripts,
            },
          };
        });
      }

      console.log('[SocialCommerce] Voiceover scripts generated for', data.beatCount, 'beats');

      // Advance to next step if requested
      if (shouldAdvance) {
        const allSteps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
        const visibleSteps = voiceOverEnabled 
          ? allSteps 
          : allSteps.filter(s => s !== "voiceover");
        
        const currentIndex = visibleSteps.indexOf("storyboard");
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < visibleSteps.length) {
          // Mark step as completed
          if (!completedSteps.includes("storyboard")) {
            setCompletedSteps([...completedSteps, "storyboard"]);
          }
          setDirection(1);
          transitionToStep(visibleSteps[nextIndex], 300);
        }
      }
    } catch (error) {
      console.error('[SocialCommerce] Failed to generate voiceover scripts:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Extract Agent 5.1 generation logic to reusable function
  const generateBeatPrompts = async (shouldAdvance: boolean = false) => {
    if (videoId === "new") {
      console.error('[SocialCommerce] Video not created yet');
      return;
    }

    setIsCreating(true);

    try {
      console.log('[SocialCommerce] Starting prompt generation (Agent 5.1 only)...', {
        videoId,
        url: `/api/social-commerce/videos/${videoId}/step/3/generate-prompts`,
      });
      
      let promptsResponse: Response;
      try {
        promptsResponse = await fetch(`/api/social-commerce/videos/${videoId}/step/3/generate-prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
      } catch (networkError) {
        console.error('[SocialCommerce] Network error during prompt generation:', networkError);
        throw new Error(
          networkError instanceof Error 
            ? `Network error: ${networkError.message}` 
            : 'Failed to connect to server. Please check your internet connection.'
        );
      }

      console.log('[SocialCommerce] Prompt generation response status:', {
        status: promptsResponse.status,
        statusText: promptsResponse.statusText,
        ok: promptsResponse.ok,
      });

      if (!promptsResponse.ok) {
        let errorData: any = {};
        try {
          const errorText = await promptsResponse.text();
          errorData = errorText ? JSON.parse(errorText) : {};
          console.error('[SocialCommerce] Prompt generation error response:', {
            status: promptsResponse.status,
            errorData,
          });
        } catch (parseError) {
          console.error('[SocialCommerce] Failed to parse error response:', parseError);
          errorData = { error: 'Failed to parse error response' };
        }
        
        const errorMessage = errorData.details || errorData.error || `Server error (${promptsResponse.status})`;
        throw new Error(errorMessage);
      }

      let promptsData: any;
      try {
        const responseText = await promptsResponse.text();
        promptsData = responseText ? JSON.parse(responseText) : {};
        console.log('[SocialCommerce] Prompts generated successfully:', {
          beatCount: promptsData.beatCount,
          hasStep3Data: !!promptsData.step3Data,
          currentStep: promptsData.currentStep,
        });
      } catch (parseError) {
        console.error('[SocialCommerce] Failed to parse success response:', parseError);
        throw new Error('Failed to parse server response. Please try again.');
      }

      // Log success
      const beatCount = promptsData.beatCount || 0;
      console.log('[SocialCommerce] Prompts generated for', beatCount, 'beats');

      // Save beatPrompts to state (voiceoverScripts will be in Tab 4)
      if (promptsData.step3Data) {
        setStep3Data(prev => ({
          ...prev,
          beatPrompts: promptsData.step3Data.beatPrompts,
          // voiceoverScripts will be saved in Tab 4 when Agent 5.2 is implemented
          beatVideos: promptsData.step3Data.beatVideos || {},
        }));
        
        // ✅ FIX: Update existingVideo cache to prevent re-triggering Agent 5.1
        queryClient.setQueryData([`/api/videos/${videoId}`], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            step3Data: {
              ...old.step3Data,
              beatPrompts: promptsData.step3Data.beatPrompts,
              beatVideos: promptsData.step3Data.beatVideos || {},
            },
          };
        });
        
        console.log('[SocialCommerce] Updated existingVideo cache with beatPrompts to prevent re-trigger');
      }

      // Note: shotPrompts removed - new structure uses beatPrompts only

      // Advance to next step only if shouldAdvance is true
      if (shouldAdvance) {
        const steps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
        const currentIndex = steps.indexOf(activeStep);
        const nextIndex = currentIndex + 1;
        if (nextIndex < steps.length) {
          setDirection(1);
          transitionToStep(steps[nextIndex], 300);
        }
      }
    } catch (error) {
      console.error('[SocialCommerce] Error in storyboard step:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        videoId,
        activeStep,
      });
      setIsTransitioning(false); // Reset transition state on error
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred";
      
      // Determine which step failed based on error message
      let errorTitle = "Error";
      if (errorMessage.includes('step 4') || errorMessage.includes('storyboard')) {
        errorTitle = "Failed to Save Storyboard";
      } else if (errorMessage.includes('prompt') || errorMessage.includes('Agent 5.1')) {
        errorTitle = "Failed to Generate Prompts";
      } else if (errorMessage.includes('Network') || errorMessage.includes('connect')) {
        errorTitle = "Connection Error";
      }
      
      console.error('[SocialCommerce]', errorTitle, ':', errorMessage);
      
      // Reset trigger ref on error so user can retry
      agent51TriggeredRef.current = false;
      throw error; // Re-throw to allow caller to handle if needed
    } finally {
      setIsCreating(false);
    }
  };

  const handleNext = async () => {
    const allSteps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
    const visibleSteps = voiceOverEnabled 
      ? allSteps 
      : allSteps.filter(s => s !== "voiceover");
    
    const currentIndex = visibleSteps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= visibleSteps.length) {
      return; // Already at last step
    }
    
    // Check if current step is dirty AND was previously completed
    if (dirtySteps.has(activeStep) && completedSteps.includes(activeStep)) {
      setShowResetWarning(true);
      setPendingNavigation(visibleSteps[nextIndex]);
      return; // Don't proceed yet - wait for user confirmation
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 1 (SETUP): Save step1Data (no agents run - simplified flow)
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "setup") {
      // ✨ Skip agent if step already completed and no changes made
      if (completedSteps.includes(activeStep) && !dirtySteps.has(activeStep)) {
        console.log('[SocialCommerce] Step 1 already completed, no changes - navigating directly');
        setDirection(1);
        transitionToStep(visibleSteps[nextIndex], 150); // Faster transition for skip
        return;
      }
      
      if (videoId === "new") {
        console.error('[SocialCommerce] Video not created yet');
        return;
      }
      
      // Validate required fields before proceeding
      const durationNum = parseInt(duration, 10) as 12 | 24 | 36;
      if (!duration || !DURATION_OPTIONS.includes(durationNum)) {
        console.warn('[SocialCommerce] Duration required (12, 24, or 36 seconds)');
        return;
      }
      
      setIsCreating(true); // Show loading state
      
      try {
        // Prepare step1Data (Sora Integration)
        const step1Data = {
          productTitle: productDetails.title || urlTitle,
          productDescription: productDetails.description,
          productCategory: undefined, // TODO: Add category field if needed
          targetAudience,
          region: undefined, // TODO: Add region field if needed
          aspectRatio,
          duration: parseInt(duration, 10),
          customMotionInstructions: motionPrompt,
          // Video Model Settings (Sora Only)
          videoModel,
          videoResolution,
          // Product Image URL (for Agent 5.1 vision analysis)
          productImageUrl: productImages.heroProfile || undefined,
          // Product Images (including composite)
          productImages: productImages ? {
            mode: productImages.mode,
            heroProfile: productImages.heroProfile,
            productAngles: productImages.productAngles,
            elements: productImages.elements,
            aiModeImages: productImages.aiModeImages,
            compositeImage: productImages.compositeImage,
            aiContext: productImages.aiContext,
          } : undefined,
          // Audio Settings
          voiceOverEnabled,
          voiceActorId: voiceOverEnabled ? voiceActorId : null, // Save voice actor ID only if voiceover is enabled
          language: voiceOverEnabled ? language : undefined,
          audioVolume: voiceOverEnabled ? audioVolume : undefined,
          speechTempo: voiceOverEnabled ? speechTempo : undefined,
          voiceoverScript: voiceOverEnabled && voiceoverScript.trim().length > 0 ? voiceoverScript : undefined,
          customVoiceoverInstructions: voiceOverEnabled && language ? customVoiceoverInstructions : undefined,
          soundEffectsEnabled,
          soundEffectsPreset: soundEffectsEnabled && soundEffectsUsePreset ? soundEffectsPreset : undefined,
          soundEffectsCustomInstructions: soundEffectsEnabled && !soundEffectsUsePreset ? soundEffectsCustomInstructions : undefined,
          soundEffectsUsePreset: soundEffectsEnabled ? soundEffectsUsePreset : undefined,
          musicEnabled,
          musicPreset: musicEnabled && musicUsePreset ? musicPreset : undefined,
          musicCustomInstructions: musicEnabled && !musicUsePreset ? musicCustomInstructions : undefined,
          musicMood: musicEnabled ? musicMood : undefined,
          musicUsePreset: musicEnabled ? musicUsePreset : undefined,
          // Quality Settings
          productionLevel,
          // Visual Style
          pacingOverride,
          visualIntensity,
        };
        
        console.log('[SocialCommerce] Saving step 1 (no agents):', step1Data);
        
        // Call backend API to save step1Data (no agents run)
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/1/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(step1Data),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to save step 1');
        }
        
        const updatedVideo = await response.json();
        console.log('[SocialCommerce] Step 1 saved:', {
          currentStep: updatedVideo.currentStep,
        });
        
        console.log('[SocialCommerce] Step 1 completed');
        
        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(visibleSteps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Failed to save step 1:', error);
        setIsTransitioning(false); // Reset transition state on error
      } finally {
        setIsCreating(false);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 2 (SCRIPT): Creative Spark + Beats - Save to step2Data (no agents on Continue)
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "script") {
      // ✨ Skip if step already completed and no changes made
      if (completedSteps.includes(activeStep) && !dirtySteps.has(activeStep)) {
        console.log('[SocialCommerce] Step 2 already completed, no changes - navigating directly');
        setDirection(1);
        transitionToStep(visibleSteps[nextIndex], 150); // Faster transition for skip
        return;
      }
      
      if (videoId === "new") {
        console.error('[SocialCommerce] Video not created yet');
        return;
      }
      
      setIsCreating(true);
      
      try {
        console.log('[SocialCommerce] Saving Tab 2 data (no agents on Continue)...');
        
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/2/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            campaignSpark, // Creative spark (user-written or AI-generated)
            visualPreset, // Visual style preset
            campaignObjective: campaignObjective || 'brand-awareness',
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to save step 2');
        }
        
        const data = await response.json();
        
        console.log('[SocialCommerce] Step 2 saved:', {
          step2Data: data.step2Data,
        });
        
        console.log('[SocialCommerce] Step 2 completed');
        
        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(visibleSteps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Tab 2 error:', error);
        setIsTransitioning(false); // Reset transition state on error
      } finally {
        setIsCreating(false);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 3 (STORYBOARD): Navigate to next step (Voiceover if enabled, else Animatic)
    // ═══════════════════════════════════════════════════════════════════════════
    // Agent 5.1 only runs when entering Tab 3 (auto-trigger) or manually via button
    // When clicking "Next" from Tab 3, just navigate to next step if prompts exist
    if (activeStep === "storyboard") {
      // If beatPrompts don't exist yet, run Agent 5.1 first
      if (!step3Data?.beatPrompts) {
        await generateBeatPrompts(false); // Don't advance yet
        return;
      }

      // Check if next step is voiceover and voiceover is enabled
      const nextStep = visibleSteps[nextIndex];
      
      // If next step is voiceover and voiceover is enabled
      if (nextStep === "voiceover" && voiceOverEnabled) {
        // Check if voiceover scripts already exist
        if (step3Data?.voiceoverScripts) {
          // Scripts already exist, just navigate
          if (!completedSteps.includes(activeStep)) {
            setCompletedSteps([...completedSteps, activeStep]);
          }
          setDirection(1);
          transitionToStep(nextStep, 200);
          return;
        }

        // Scripts don't exist, generate them first
        await generateVoiceoverScripts(true); // Pass true to advance after generation
        return;
      }

      // If next step is not voiceover, or voiceover is disabled, just navigate
      if (!completedSteps.includes(activeStep)) {
        setCompletedSteps([...completedSteps, activeStep]);
      }
      setDirection(1);
      transitionToStep(visibleSteps[nextIndex], 200);
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 4 (VOICEOVER): Save step4Data and proceed to next step
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "voiceover") {
      if (videoId === "new") {
        console.error('[SocialCommerce] Video not created yet');
        return;
      }

      setIsCreating(true);

      try {
        // Save step4Data (voiceover scripts are already in step3Data, but we mark step 4 as completed)
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/4/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            // Voiceover scripts are already saved in step3Data from Agent 5.2
            // This route just marks step 4 as completed
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to save step 4');
        }

        const updatedVideo = await response.json();
        
        console.log('[SocialCommerce] Step 4 saved:', {
          currentStep: updatedVideo.currentStep,
        });
        
        console.log('[SocialCommerce] Step 4 completed');

        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(visibleSteps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Failed to save step 4:', error);
        setIsTransitioning(false);
      } finally {
        setIsCreating(false);
      }
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 5 (ANIMATIC): Save and proceed to Export
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "animatic") {
      if (videoId === "new") {
        console.error('[SocialCommerce] Video not created yet');
        return;
      }

      setIsCreating(true);

      try {
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/5/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to save step 5');
        }

        const updatedVideo = await response.json();
        
        console.log('[SocialCommerce] Step 5 saved:', {
          currentStep: updatedVideo.currentStep,
          completedSteps: updatedVideo.completedSteps,
        });
        
        console.log('[SocialCommerce] Step 5 completed');

        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(visibleSteps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Failed to save step 5:', error);
        setIsTransitioning(false);
      } finally {
        setIsCreating(false);
      }
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 6 (EXPORT): Mark as completed (final step)
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "export") {
      if (videoId === "new") {
        console.error('[SocialCommerce] Video not created yet');
        return;
      }

      setIsCreating(true);

      try {
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/6/complete`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to complete step 6');
        }

        const updatedVideo = await response.json();
        
        console.log('[SocialCommerce] Step 6 completed - Video finished:', {
          currentStep: updatedVideo.currentStep,
          completedSteps: updatedVideo.completedSteps,
          status: updatedVideo.status,
        });
        
        console.log('[SocialCommerce] Video completed! 🎉');

        // Mark step as completed
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        
        // Stay on export page (last step)
      } catch (error) {
        console.error('[SocialCommerce] Failed to complete step 6:', error);
        setIsTransitioning(false);
      } finally {
        setIsCreating(false);
      }
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OTHER STEPS: Just advance (shouldn't reach here)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Mark current step as completed when moving forward
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    
    setDirection(1);
    transitionToStep(visibleSteps[nextIndex], 200); // Faster for simple navigation
  };

  const handleBack = () => {
    const allSteps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
    const visibleSteps = voiceOverEnabled 
      ? allSteps 
      : allSteps.filter(s => s !== "voiceover");
    
    const currentIndex = visibleSteps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      setDirection(-1);
      transitionToStep(visibleSteps[prevIndex], 200); // Smooth back transition
    }
  };

  // Helper: Reset frontend state for cleared steps
  const resetStepState = (stepNumber: number) => {
    console.log('[SocialCommerce] Resetting frontend state for step:', stepNumber);
    
    // Reset Step 2 state (Product DNA, Character, Brand)
    if (stepNumber <= 2) {
      setProductImages({
        heroProfile: null,
      });
      setProductImageAssetIds({
        heroProfile: null,
      });
      // Removed: characterAssetId, characterReferenceUrl, characterReferenceFile, characterName, characterAIProfile (no image generation for Sora)
      setCharacterDescription('');
      setCharacterPersona(null);
      setCharacterMode(null);
      setIncludeHumanElement(false);
      // Removed: brandkitAssetId, logoUrl, brandName, brandPrimaryColor, brandSecondaryColor, logoIntegrity, logoDepth (no logo support for Sora)
      setMaterialPreset("");
      setObjectMass(50);
      setSurfaceComplexity(50);
      setRefractionEnabled(false);
      setHeroFeature("");
      setOriginMetaphor("");
    }
    
    // Reset Step 3 state (Environment & Story)
    if (stepNumber <= 3) {
      setCampaignSpark("");
      setVisualBeats({
        beat1: "",
        beat2: "",
        beat3: "",
      });
      setCtaText("");
      setCampaignObjective("");
      // Removed: environmentConcept, cinematicLighting, atmosphericDensity (no longer used)
      setVisualPreset("");
      // Removed: environmentBrandPrimaryColor, environmentBrandSecondaryColor (no longer used)
    }
    
    // Reset Step 4 state (Scene Timeline)
    if (stepNumber <= 4) {
      setSceneManifest({
        scenes: [],
        continuityLinksEstablished: false,
      });
    }
  };

  // Handle accepting the reset warning and clearing future data
  const handleAcceptReset = async () => {
    if (videoId === "new") {
      setShowResetWarning(false);
      return;
    }

    const steps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
    const currentStepNumber = stepToNumber(activeStep);

    setIsCreating(true);

    try {
      // Build update payload
      const updatePayload: any = {
        currentStep: currentStepNumber,
        completedSteps: completedSteps.filter(s => stepToNumber(s) < currentStepNumber),
      };

      // Clear current step's data AND all future step data
      // This ensures that when user changes a completed step, that step and all future steps are reset
      const stepNumbers = [1, 2, 3, 4, 5]; // Simplified: only 3 tabs now (1, 2, 3)
      stepNumbers.forEach(num => {
        if (num >= currentStepNumber) {
          updatePayload[`step${num}Data`] = null;
        }
      });

      console.log('[SocialCommerce] Resetting from step:', activeStep, 'Clearing:', updatePayload);

      // Update database
      const response = await fetch(`/api/social-commerce/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error('Failed to reset video data');
      }

      // ✨ Reset frontend state for cleared steps
      resetStepState(currentStepNumber);

      // Update local state
      setCompletedSteps(updatePayload.completedSteps);
      setDirtySteps(new Set()); // Clear all dirty flags
      setStepSnapshots(new Map()); // Clear all snapshots
      setShowResetWarning(false);

      console.log('[SocialCommerce] Video reset - future steps cleared');

      // If there's pending navigation, handle it
      if (pendingNavigation) {
        const targetStep = pendingNavigation;
        setPendingNavigation(null);
        
        // If target is the next step, proceed with handleNext logic
        if (steps.indexOf(targetStep) === steps.indexOf(activeStep) + 1) {
          // Re-trigger handleNext without the dirty check
          setTimeout(() => {
            handleNext();
          }, 100);
        } else {
          // Direct navigation to target step
          setDirection(targetStep > activeStep ? 1 : -1);
          transitionToStep(targetStep, 200);
        }
      }
    } catch (error) {
      console.error('[SocialCommerce] Failed to reset video:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Get human-readable step name
  const getStepName = (step: CommerceStepId): string => {
    const names: Record<CommerceStepId, string> = {
      "setup": "Setup & Product",
      "script": "Creative Spark & Beats",
      "storyboard": "Generate Prompts",
      "voiceover": "Voiceover",
      "animatic": "Preview",
      "export": "Export",
    };
    return names[step] || step;
  };

  // Compute next label based on current step and state
  // MUST be before any early returns to maintain hook order
  const computedNextLabel = useMemo(() => {
    if (isCreating || isTransitioning) {
      if (activeStep === "storyboard" && voiceOverEnabled && !step3Data?.voiceoverScripts) {
        return "Generating voiceover scripts...";
      }
      if (activeStep === "storyboard" && !step3Data?.beatPrompts) {
        return "Generating prompts...";
      }
      if (activeStep === "setup") {
        return "Saving...";
      }
      if (activeStep === "script") {
        return "Running Agent 3.2...";
      }
      return "Processing...";
    }
    
    if (activeStep === "storyboard") {
      const allSteps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
      const visibleSteps = voiceOverEnabled 
        ? allSteps 
        : allSteps.filter(s => s !== "voiceover");
      const currentIndex = visibleSteps.indexOf(activeStep);
      const nextIndex = currentIndex + 1;
      const nextStep = visibleSteps[nextIndex];
      
      // If next step is voiceover and scripts don't exist yet
      if (nextStep === "voiceover" && voiceOverEnabled && !step3Data?.voiceoverScripts) {
        return "Generate Voiceover & Continue";
      }
    }
    
    const allSteps: CommerceStepId[] = ["setup", "script", "storyboard", "voiceover", "animatic", "export"];
    const visibleSteps = voiceOverEnabled 
      ? allSteps 
      : allSteps.filter(s => s !== "voiceover");
    const currentIndex = visibleSteps.indexOf(activeStep);
    const isLastStep = currentIndex === visibleSteps.length - 1;
    
    return isLastStep ? "Export Video" : "Continue";
  }, [activeStep, isCreating, isTransitioning, voiceOverEnabled, step3Data]);

  return (
    <SocialCommerceStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      dirtySteps={dirtySteps}
      voiceOverEnabled={voiceOverEnabled}
      direction={direction}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      videoTitle={videoTitle}
      isNextDisabled={!canContinue || isCreating || isTransitioning}
      nextLabel={computedNextLabel}
      isTransitioning={isTransitioning || isCreating}
    >
      <SocialCommerceWorkflow 
              activeStep={workflowStepMap[activeStep]}
              videoId={videoId}
              workspaceId={workspaceId || ''}
              isCreating={isCreating}
              narrativeMode={narrativeMode}
              script={script}
              aspectRatio={aspectRatio}
              duration={duration}
              voiceActorId={voiceActorId}
              voiceOverEnabled={voiceOverEnabled}
              voiceOverConcept={voiceOverConcept}
              voiceOverScript={voiceOverScript}
              videoConcept={videoConcept}
              productPhotos={productPhotos}
              productDetails={productDetails}
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              characters={characters}
              referenceImages={referenceImages}
              continuityLocked={continuityLocked}
              continuityGroups={continuityGroups}
              worldSettings={worldSettings}
              videoModel={videoModel}
              videoResolution={videoResolution}
              language={language}
              motionPrompt={motionPrompt}
              // Audio Settings
              audioVolume={audioVolume}
              speechTempo={speechTempo}
              voiceoverScript={voiceoverScript}
              customVoiceoverInstructions={customVoiceoverInstructions}
              soundEffectsEnabled={soundEffectsEnabled}
              soundEffectsPreset={soundEffectsPreset}
              soundEffectsCustomInstructions={soundEffectsCustomInstructions}
              soundEffectsUsePreset={soundEffectsUsePreset}
              musicEnabled={musicEnabled}
              musicPreset={musicPreset}
              musicCustomInstructions={musicCustomInstructions}
              musicMood={musicMood}
              musicUsePreset={musicUsePreset}
              // Quality Settings
              productionLevel={productionLevel}
              // Visual Style
              pacingOverride={pacingOverride}
              visualIntensity={visualIntensity}
              productImages={productImages}
              materialPreset={materialPreset}
              objectMass={objectMass}
              surfaceComplexity={surfaceComplexity}
              refractionEnabled={refractionEnabled}
              heroFeature={heroFeature}
              originMetaphor={originMetaphor}
              onScriptChange={setScript}
              onAspectRatioChange={(value) => { setAspectRatio(value); markStepDirty('setup'); }}
              onDurationChange={(value) => { setDuration(value); markStepDirty('setup'); }}
              onVoiceActorChange={async (voiceId: string | null) => {
                setVoiceActorId(voiceId);
                markStepDirty('setup');
                // Save voiceActorId to database immediately
                if (videoId !== "new") {
                  try {
                    await fetch(`/api/social-commerce/videos/${videoId}/step/1/data`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ voiceActorId: voiceId }),
                    });
                  } catch (error) {
                    console.error('Failed to save voiceActorId:', error);
                  }
                }
              }}
              onVoiceOverToggle={(enabled) => {
                setVoiceOverEnabled(enabled);
                markStepDirty('setup');
                // If disabling voiceover, clear voiceActorId
                if (!enabled) {
                  setVoiceActorId(null);
                }
              }}
              onVoiceOverConceptChange={setVoiceOverConcept}
              onVoiceOverScriptChange={setVoiceOverScript}
              onVideoConceptChange={setVideoConcept}
              onProductPhotosChange={setProductPhotos}
              onProductDetailsChange={setProductDetails}
              onScenesChange={setScenes}
              onShotsChange={setShots}
              onShotVersionsChange={setShotVersions}
              onCharactersChange={setCharacters}
              onReferenceImagesChange={setReferenceImages}
              onContinuityLockedChange={setContinuityLocked}
              onContinuityGroupsChange={setContinuityGroups}
              onWorldSettingsChange={setWorldSettings}
              commerceSettings={commerceSettings}
              onCommerceSettingsChange={setCommerceSettings}
              onVideoModelChange={(value) => { setVideoModel(value); markStepDirty('setup'); }}
              onVideoResolutionChange={(value) => { setVideoResolution(value); markStepDirty('setup'); }}
              onLanguageChange={(value) => { 
                setLanguage(value); 
                markStepDirty('setup');
                // Auto-select default voice for the selected language
                if (voiceOverEnabled) {
                  const defaultVoice = VOICE_LIBRARY.find(v => v.language === value);
                  if (defaultVoice) {
                    console.log(`[SocialCommerce] Auto-selecting default voice for ${value}:`, defaultVoice.id);
                    setVoiceActorId(defaultVoice.id);
                  }
                }
              }}
              onMotionPromptChange={(value) => { setMotionPrompt(value); markStepDirty('setup'); }}
              // Audio Handlers
              onAudioVolumeChange={(value) => { setAudioVolume(value); markStepDirty('setup'); }}
              onSpeechTempoChange={(value) => { setSpeechTempo(value); markStepDirty('setup'); }}
              onVoiceoverScriptChange={(script) => {
                setVoiceoverScript(script);
                markStepDirty('setup');
              }}
              onCustomVoiceoverInstructionsChange={(value) => { setCustomVoiceoverInstructions(value); markStepDirty('setup'); }}
              onSoundEffectsToggle={(value) => { setSoundEffectsEnabled(value); markStepDirty('setup'); }}
              onSoundEffectsPresetChange={(value) => { setSoundEffectsPreset(value); markStepDirty('setup'); }}
              onSoundEffectsCustomChange={(value) => { setSoundEffectsCustomInstructions(value); markStepDirty('setup'); }}
              onSoundEffectsUsePresetChange={(value) => { setSoundEffectsUsePreset(value); markStepDirty('setup'); }}
              onMusicToggle={(value) => { setMusicEnabled(value); markStepDirty('setup'); }}
              onMusicPresetChange={(value) => { setMusicPreset(value); markStepDirty('setup'); }}
              onMusicCustomChange={(value) => { setMusicCustomInstructions(value); markStepDirty('setup'); }}
              onMusicMoodChange={(value) => { setMusicMood(value); markStepDirty('setup'); }}
              onMusicUsePresetChange={(value) => { setMusicUsePreset(value); markStepDirty('setup'); }}
              // Quality Handlers
              onProductionLevelChange={(value) => { setProductionLevel(value); markStepDirty('setup'); }}
              // Visual Style Handlers
              onPacingOverrideChange={(value) => { setPacingOverride(value); markStepDirty('setup'); }}
              onVisualIntensityChange={(value) => { 
                console.log('[SocialCommerce] Visual Intensity changed:', value);
                setVisualIntensity(value); 
                markStepDirty('setup'); 
              }}
              onProductImagesChange={(value) => { setProductImages(value); markStepDirty('script'); }}
              onProductImageUpload={handleProductImageUpload}
              onProductImageDelete={handleDeleteProductImage}
              onCompositeGenerate={handleCompositeGenerate}
              onGeneratePrompt={handleGeneratePrompt}
              onGenerateImage={handleGenerateImage}
              onModeChange={handleModeChange}
              onModeSwitchWithCleanup={handleModeSwitchWithCleanup}
              onApplyComposite={handleApplyComposite}
              onRemoveAppliedComposite={handleRemoveAppliedComposite}
              isPromptPreviewOpen={isPromptPreviewOpen}
              previewPrompt={previewPrompt}
              previewMetadata={previewMetadata}
              editedPrompt={editedPrompt}
              onPromptPreviewOpenChange={setIsPromptPreviewOpen}
              onEditedPromptChange={setEditedPrompt}
              onMaterialPresetChange={(value) => { setMaterialPreset(value); markStepDirty('script'); }}
              onObjectMassChange={setObjectMass}
              onSurfaceComplexityChange={(value) => { setSurfaceComplexity(value); markStepDirty('script'); }}
              onRefractionEnabledChange={(value) => { setRefractionEnabled(value); markStepDirty('script'); }}
              // Removed: All logo-related props (no logo support for Sora)
              onHeroFeatureChange={(value) => { setHeroFeature(value); markStepDirty('script'); }}
              onOriginMetaphorChange={(value) => { setOriginMetaphor(value); markStepDirty('script'); }}
              visualPreset={visualPreset}
              campaignSpark={campaignSpark}
              targetAudience={targetAudience}
              ctaText={ctaText}
              includeHumanElement={includeHumanElement}
              characterMode={characterMode}
              characterDescription={characterDescription}
              characterPersona={characterPersona}
              isGeneratingCharacter={isGeneratingCharacter}
              onCharacterPersonaChange={setCharacterPersona}
              onIsGeneratingCharacterChange={setIsGeneratingCharacter}
              cameraShotDefault={cameraShotDefault}
              lensDefault={lensDefault}
              onCameraShotDefaultChange={(value) => { setCameraShotDefault(value); markStepDirty('script'); }}
              onLensDefaultChange={(value) => { setLensDefault(value); markStepDirty('script'); }}
              onVisualPresetChange={(value) => { setVisualPreset(value); markStepDirty('script'); }}
              onCampaignSparkChange={(value) => { setCampaignSpark(value); markStepDirty('script'); }}
              visualBeats={visualBeats}
              onVisualBeatsChange={(beats: { beat1: string; beat2: string; beat3: string }) => { setVisualBeats(beats); markStepDirty('script'); }}
              campaignObjective={campaignObjective}
              onCampaignObjectiveChange={(value) => { setCampaignObjective(value); markStepDirty('script'); }}
              onTargetAudienceChange={(value) => { setTargetAudience(value); markStepDirty('setup'); }}
              onCtaTextChange={setCtaText}
              onIncludeHumanElementChange={(value) => { setIncludeHumanElement(value); markStepDirty('script'); }}
              onCharacterModeChange={(value) => { setCharacterMode(value); markStepDirty('script'); }}
              onCharacterDescriptionChange={(value) => { setCharacterDescription(value); markStepDirty('script'); }}
              // Removed: All character image-related props (no image generation for Sora)
              sceneManifest={sceneManifest}
              onSceneManifestChange={setSceneManifest}
              onNext={handleNext}
              step3Data={step3Data}
              step4Data={step4Data}
              onRegenerateVoiceover={async () => {
                await generateVoiceoverScripts(false); // Don't advance, just regenerate
              }}
              onVoiceoverAudioGenerated={async (beatId, audioData) => {
                // Update local state
                setStep4Data(prev => ({
                  ...prev,
                  voiceoverAudios: {
                    ...prev.voiceoverAudios,
                    [beatId]: audioData,
                  },
                }));
              }}
            />

      {/* Step Reset Warning Dialog */}
      <StepResetWarningDialog
        open={showResetWarning}
        onOpenChange={setShowResetWarning}
        onAccept={handleAcceptReset}
        currentStepName={getStepName(activeStep)}
      />

    </SocialCommerceStudioLayout>
  );
}
