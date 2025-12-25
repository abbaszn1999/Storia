import { useState, useEffect, useRef } from "react";
import { useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SocialCommerceWorkflow } from "@/components/social-commerce-workflow";
import { SocialCommerceStudioLayout, type CommerceStepId } from "@/components/commerce/studio";
import { StepResetWarningDialog } from "@/components/social-commerce/step-reset-warning-dialog";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { Loader2 } from "lucide-react";
import type { Character, Video } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

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
  const { toast } = useToast();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  
  const initialVideoId = params.id || urlParams.get("id") || "new";
  const isNewVideo = initialVideoId === "new";
  
  // Use workspace from context, fallback to URL param for backwards compatibility
  const workspaceId = currentWorkspace?.id || urlParams.get("workspace");
  const urlTitle = urlParams.get("title") || "Untitled Product Video";
  
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
  const [duration, setDuration] = useState("30");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
  
  // Campaign Configuration settings (Tab 1)
  // Defaults match constants: nano-banana (default image model) and seedance-1.0-pro (default video model)
  const [imageModel, setImageModel] = useState("nano-banana");
  const [imageResolution, setImageResolution] = useState("1k");
  const [videoModel, setVideoModel] = useState("seedance-1.0-pro");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [motionPrompt, setMotionPrompt] = useState("");
  const [imageInstructions, setImageInstructions] = useState("");
  
  // Product DNA & Brand Identity settings (Tab 2)
  const [productImages, setProductImages] = useState<{
    heroProfile: string | null;
    macroDetail: string | null;
    materialReference: string | null;
  }>({
    heroProfile: null,
    macroDetail: null,
    materialReference: null,
  });
  
  // Asset IDs for created assets (character, brandkit, product images)
  const [characterAssetId, setCharacterAssetId] = useState<string | null>(null);
  const [brandkitAssetId, setBrandkitAssetId] = useState<string | null>(null);
  const [productImageAssetIds, setProductImageAssetIds] = useState<{
    heroProfile: string | null;
    macroDetail: string | null;
    materialReference: string | null;
  }>({
    heroProfile: null,
    macroDetail: null,
    materialReference: null,
  });
  
  // Names for auto-created assets
  const [characterName, setCharacterName] = useState('');
  const [brandName, setBrandName] = useState('');
  
  const [materialPreset, setMaterialPreset] = useState("");
  const [objectMass, setObjectMass] = useState(50);
  const [surfaceComplexity, setSurfaceComplexity] = useState(50);
  const [refractionEnabled, setRefractionEnabled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#FF006E");
  const [brandSecondaryColor, setBrandSecondaryColor] = useState("#FB5607");
  const [logoIntegrity, setLogoIntegrity] = useState(7);
  const [logoDepth, setLogoDepth] = useState(5);
  const [heroFeature, setHeroFeature] = useState("");
  const [originMetaphor, setOriginMetaphor] = useState("");
  
  // Cast & Character DNA (Tab 2)
  const [includeHumanElement, setIncludeHumanElement] = useState(false);
  const [characterMode, setCharacterMode] = useState<'hand-model' | 'full-body' | 'silhouette' | null>(null);
  const [characterReferenceUrl, setCharacterReferenceUrl] = useState<string | null>(null);
  const [characterReferenceFile, setCharacterReferenceFile] = useState<File | null>(null);
  const [characterDescription, setCharacterDescription] = useState("");
  const [characterAIProfile, setCharacterAIProfile] = useState<{
    identity_id: string;
    detailed_persona: string;
    cultural_fit: string;
    interaction_protocol: {
      product_engagement: string;
      motion_limitations: string;
    };
    identity_locking: {
      strategy: string;
      vfx_anchor_tags: string;
    };
    image_generation_prompt?: string; // Ready-to-use prompt for Agent 2.2b
  } | null>(null);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  
  // Environment & Story Beats (Tab 3)
  const [environmentConcept, setEnvironmentConcept] = useState("");
  const [cinematicLighting, setCinematicLighting] = useState("");
  const [atmosphericDensity, setAtmosphericDensity] = useState(50);
  const [styleReferenceUrl, setStyleReferenceUrl] = useState<string | null>(null);
  const [visualPreset, setVisualPreset] = useState("");
  const [campaignSpark, setCampaignSpark] = useState("");
  const [visualBeats, setVisualBeats] = useState({
    beat1: "",
    beat2: "",
    beat3: "",
  });
  
  // Environment-specific brand colors (initialized from Tab 2, but local to Tab 3)
  const [environmentBrandPrimaryColor, setEnvironmentBrandPrimaryColor] = useState(brandPrimaryColor);
  const [environmentBrandSecondaryColor, setEnvironmentBrandSecondaryColor] = useState(brandSecondaryColor);
  
  // Campaign Objective (optional, can be deselected)
  const [campaignObjective, setCampaignObjective] = useState("");
  
  // Strategic Context (Tab 1 - moved from Tab 3)
  const [targetAudience, setTargetAudience] = useState("");
  
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
        shotType: 'image-ref' | 'start-end';
        cameraPath: 'orbit' | 'pan' | 'zoom' | 'dolly' | 'static';
        lens: 'macro' | 'wide' | '85mm' | 'telephoto';
        referenceTags: string[];
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
    imageModel: string;
    videoModel: string;
    imageInstructions: string;
    videoInstructions: string;
  }>({
    visualStyle: "minimal",
    backdrop: "white-studio",
    productDisplay: ["hero"],
    talentType: "none",
    talents: [],
    styleReference: null,
    additionalInstructions: "",
    imageModel: "nano-banana",
    videoModel: "seedance-1.0-pro",
    imageInstructions: "",
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
        speedProfile: string | undefined, 
        shotType: string
      ): number => {
        const multipliers: Record<string, number> = {
          'linear': 1.0,
          'speed-ramp': 1.2,
          'slow-motion': 2.0,
          'kinetic': 0.8,
          'smooth': 1.1,
        };
        const profileMultiplier = multipliers[speedProfile || 'linear'] || 1.0;
        const typeMultiplier = shotType === 'start-end' ? 1.15 : 1.0;
        return Math.round(targetDuration * profileMultiplier * typeMultiplier * 10) / 10;
      };

      // Convert sceneManifest shots to shots dictionary
      const convertedShots: { [sceneId: string]: Shot[] } = {};
      sceneManifest.scenes.forEach(scene => {
        convertedShots[scene.id] = scene.shots.map((shot, shotIdx) => ({
          id: shot.id,
          sceneId: scene.id,
          shotNumber: shotIdx + 1,
          shotType: shot.shotType || 'image-ref', // Use shotType from sceneManifest (image-ref or start-end)
          cameraMovement: shot.cameraPath,
          duration: shot.duration,
          description: shot.description,
          currentVersionId: null,
          speedProfile: shot.speedProfile || 'linear',
          renderDuration: calculateRenderDuration(shot.duration, shot.speedProfile, shot.shotType),
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
        imageModel && 
        videoModel && 
        aspectRatio && 
        duration && 
        motionPrompt.trim().length > 0 &&
        targetAudience !== "";
      setCanContinue(isValid);
    } else if (activeStep === "script") {
      // Tab 2: Product DNA & Brand Identity + Character DNA validation
      let isValid = 
        productImages.heroProfile !== null && 
        materialPreset !== "";
      // If human element enabled, require character mode
      if (includeHumanElement) {
        isValid = isValid && characterMode !== null;
      }
      setCanContinue(isValid);
    } else if (activeStep === "environment") {
      // Tab 3: Environment & Story Beats validation (simplified - no audience here)
      const isValid = 
        environmentConcept.trim().length >= 20 && 
        campaignSpark.trim().length >= 10;
      setCanContinue(isValid);
    } else if (activeStep === "world") {
      // Tab 4: Scene Manifest validation
      const isValid = sceneManifest.scenes.length === 3 && 
                      sceneManifest.scenes.every(scene => scene.shots.length > 0);
      setCanContinue(isValid);
    } else {
      // Other steps - default to true for now
      setCanContinue(true);
    }
  };

  // Update validation when relevant state changes
  useEffect(() => {
    updateValidation();
  }, [activeStep, imageModel, videoModel, aspectRatio, duration, motionPrompt, targetAudience, productImages, materialPreset, includeHumanElement, characterMode, environmentConcept, campaignSpark, sceneManifest]);

  // Helper function to determine condition from shot
  const determineCondition = (shot: any): 1 | 2 | 3 | 4 => {
    const isImageRef = shot.shotType === 'image-ref';
    const isConnected = shot.isLinkedToPrevious;
    
    if (isImageRef && !isConnected) return 1;
    if (!isImageRef && !isConnected) return 2;
    if (!isImageRef && isConnected) return 3;
    if (isImageRef && isConnected) return 4;
    return 1; // Default fallback
  };
  
  // Helper function to create ShotVersion from Agent 5.1 prompts
  const createShotVersionFromPrompts = (
    shotId: string,
    shotPrompts: any,
    condition: 1 | 2 | 3 | 4
  ): ShotVersion => {
    const baseVersion: ShotVersion = {
      id: `version-${shotId}-1`,
      shotId: shotId,
      versionNumber: 1,
      status: 'pending',
      needsRerender: false,
      createdAt: new Date(),
    };
    
    // Map prompts based on condition
    switch (condition) {
      case 1:
        return {
          ...baseVersion,
          imagePrompt: shotPrompts.prompts?.image?.text || null,
          videoPrompt: shotPrompts.prompts?.video?.text || null,
        };
      case 2:
        return {
          ...baseVersion,
          startFramePrompt: shotPrompts.prompts?.start_frame?.text || null,
          endFramePrompt: shotPrompts.prompts?.end_frame?.text || null,
          videoPrompt: shotPrompts.prompts?.video?.text || null,
        };
      case 3:
        return {
          ...baseVersion,
          startFramePrompt: null, // Inherited - will be set from previous shot
          startFrameInherited: true,
          endFramePrompt: shotPrompts.prompts?.end_frame?.text || null,
          videoPrompt: shotPrompts.prompts?.video?.text || null,
        };
      case 4:
        return {
          ...baseVersion,
          imagePrompt: null, // Inherited
          videoPrompt: shotPrompts.prompts?.video?.text || null,
        };
      default:
        return baseVersion;
    }
  };

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
        if (step1.aspectRatio) setAspectRatio(step1.aspectRatio);
        if (step1.duration) setDuration(String(step1.duration));
        if (step1.targetAudience) setTargetAudience(step1.targetAudience);
        if (step1.customMotionInstructions) setMotionPrompt(step1.customMotionInstructions);
        if (step1.customImageInstructions) setImageInstructions(step1.customImageInstructions);
        // AI Model Settings
        if (step1.imageModel) setImageModel(step1.imageModel);
        if (step1.imageResolution) setImageResolution(step1.imageResolution);
        if (step1.videoModel) setVideoModel(step1.videoModel);
        if (step1.videoResolution) setVideoResolution(step1.videoResolution);
        if (step1.language) setLanguage(step1.language);
        if (step1.voiceOverEnabled !== undefined) setVoiceOverEnabled(step1.voiceOverEnabled);
      }
      
      // Restore step2Data if available (NEW: Nested structure)
      const step2 = existingVideo.step2Data as any;
      if (step2) {
        // Product data
        if (step2.product) {
          // Product images
          if (step2.product.images) {
            setProductImages({
              heroProfile: step2.product.images.heroProfile || null,
              macroDetail: step2.product.images.macroDetail || null,
              materialReference: step2.product.images.materialReference || null,
            });
          }
          
          // Material settings
          if (step2.product.material) {
            if (step2.product.material.preset) setMaterialPreset(step2.product.material.preset);
            if (step2.product.material.objectMass !== undefined) setObjectMass(step2.product.material.objectMass);
            if (step2.product.material.surfaceComplexity !== undefined) setSurfaceComplexity(step2.product.material.surfaceComplexity);
            if (step2.product.material.refractionEnabled !== undefined) setRefractionEnabled(step2.product.material.refractionEnabled);
            if (step2.product.material.heroFeature) setHeroFeature(step2.product.material.heroFeature);
            if (step2.product.material.originMetaphor) setOriginMetaphor(step2.product.material.originMetaphor);
          }
        }
        
        // Character data
        if (step2.character) {
          if (step2.character.referenceUrl) setCharacterReferenceUrl(step2.character.referenceUrl);
          if (step2.character.assetId) setCharacterAssetId(step2.character.assetId);
          if (step2.character.name) setCharacterName(step2.character.name);
          if (step2.character.description) setCharacterDescription(step2.character.description);
          if (step2.character.mode) {
            setCharacterMode(step2.character.mode);
            setIncludeHumanElement(true);
          }
          if (step2.character.aiProfile) setCharacterAIProfile(step2.character.aiProfile);
        }
        
        // Brand data
        if (step2.brand) {
          if (step2.brand.logoUrl) setLogoUrl(step2.brand.logoUrl);
          if (step2.brand.assetId) setBrandkitAssetId(step2.brand.assetId);
          if (step2.brand.name) setBrandName(step2.brand.name);
          if (step2.brand.colors) {
            if (step2.brand.colors.primary) setBrandPrimaryColor(step2.brand.colors.primary);
            if (step2.brand.colors.secondary) setBrandSecondaryColor(step2.brand.colors.secondary);
          }
          if (step2.brand.logo) {
            if (step2.brand.logo.integrity !== undefined) setLogoIntegrity(step2.brand.logo.integrity);
            if (step2.brand.logo.depth !== undefined) setLogoDepth(step2.brand.logo.depth);
          }
        }
        
        // Style reference
        if (step2.style?.referenceUrl) {
          setStyleReferenceUrl(step2.style.referenceUrl);
        }
        
        console.log('[SocialCommerce] Restored step2Data (nested structure):', {
          hasProductImages: !!step2.product?.images,
          hasCharacter: !!step2.character?.assetId,
          hasBrandkit: !!step2.brand?.assetId,
        });
      }
      
      // Restore step3Data if available
      const step3 = existingVideo.step3Data as any;
      if (step3) {
        // NEW: Prioritize uiInputs if available (most complete)
        if (step3.uiInputs) {
          setEnvironmentConcept(step3.uiInputs.environmentConcept || '');
          setAtmosphericDensity(step3.uiInputs.atmosphericDensity ?? 50);
          setCinematicLighting(step3.uiInputs.cinematicLighting || '');
          setVisualPreset(step3.uiInputs.visualPreset || '');
          setStyleReferenceUrl(step3.uiInputs.styleReferenceUrl || null);
          setCampaignSpark(step3.uiInputs.campaignSpark || '');
          setVisualBeats({
            beat1: step3.uiInputs.visualBeats?.beat1 || '',
            beat2: step3.uiInputs.visualBeats?.beat2 || '',
            beat3: step3.uiInputs.visualBeats?.beat3 || '',
          });
          setCampaignObjective(step3.uiInputs.campaignObjective || '');
          if (step3.uiInputs.environmentBrandPrimaryColor) {
            setEnvironmentBrandPrimaryColor(step3.uiInputs.environmentBrandPrimaryColor);
          }
          if (step3.uiInputs.environmentBrandSecondaryColor) {
            setEnvironmentBrandSecondaryColor(step3.uiInputs.environmentBrandSecondaryColor);
          }
        } else {
          // Fallback to old structure (backward compatibility)
          // Creative Spark
          if (step3.creativeSpark?.creative_spark) {
            setCampaignSpark(step3.creativeSpark.creative_spark);
          } else if (typeof step3.campaignSpark === 'string') {
            setCampaignSpark(step3.campaignSpark);
          }
          
          // Campaign Objective (optional)
          if (step3.campaignObjective) {
            setCampaignObjective(step3.campaignObjective);
          }
          
          // Visual Beats
          if (step3.narrative?.script_manifest) {
            const manifest = step3.narrative.script_manifest;
            setVisualBeats({
              beat1: manifest.act_1_hook?.text || '',
              beat2: manifest.act_2_transform?.text || '',
              beat3: manifest.act_3_payoff?.text || '',
            });
            // CTA Text
            if (manifest.act_3_payoff?.cta_text) {
              setCtaText(manifest.act_3_payoff.cta_text);
            }
          } else if (step3.visualBeats) {
            setVisualBeats({
              beat1: step3.visualBeats.beat1 || '',
              beat2: step3.visualBeats.beat2 || '',
              beat3: step3.visualBeats.beat3 || '',
            });
          }
          
          // Environment
          if (step3.environment?.concept) {
            setEnvironmentConcept(step3.environment.concept);
          }
          if (step3.environment?.cinematicLighting) {
            setCinematicLighting(step3.environment.cinematicLighting);
          }
          if (step3.environment?.atmosphericDensity !== undefined) {
            setAtmosphericDensity(step3.environment.atmosphericDensity);
          }
          if (step3.environment?.visualPreset) {
            setVisualPreset(step3.environment.visualPreset);
          }
          
          // Environment brand colors
          if (step3.environment?.brandColors?.primary) {
            setEnvironmentBrandPrimaryColor(step3.environment.brandColors.primary);
          }
          if (step3.environment?.brandColors?.secondary) {
            setEnvironmentBrandSecondaryColor(step3.environment.brandColors.secondary);
          }
        }
        
        console.log('[SocialCommerce] Restored step3Data:', {
          hasUiInputs: !!step3.uiInputs,
          hasCreativeSpark: !!step3.creativeSpark || !!step3.campaignSpark,
          hasNarrative: !!step3.narrative,
          hasEnvironment: !!step3.environment,
        });
      }
      
      // ✨ NEW: Restore step4Data if available
      const step4 = existingVideo.step4Data as any;
      let mappedScenes: any[] | null = null;
      if (step4?.mediaPlanner?.scenes) {
        // Map Agent 4.1 output to sceneManifest format
        mappedScenes = step4.mediaPlanner.scenes.map((scene: any, sceneIdx: number) => {
          // Map timing data by shot_id
          const timingMap = new Map(
            (step4.timing?.temporal_map || []).map((t: any) => [t.shot_id, t])
          );
          
          return {
            id: scene.scene_id,
            name: scene.scene_name,
            description: scene.scene_description,
            duration: scene.shots.reduce((sum: number, shot: any) => {
              const timing = timingMap.get(shot.shot_id);
              return sum + (timing?.rendered_duration || 5.0);
            }, 0),
            actType: sceneIdx === 0 ? 'hook' : sceneIdx === 1 ? 'transformation' : 'payoff',
            shots: scene.shots.map((shot: any) => {
              const timing = timingMap.get(shot.shot_id);
              
              // Build reference tags based on identity_references
              const referenceTags: string[] = [];
              
              // Product reference with variant
              if (shot.identity_references.refer_to_product) {
                const productRef = shot.identity_references.product_image_ref;
                if (productRef === 'macroDetail') {
                  referenceTags.push('@Product_Macro');
                } else if (productRef === 'materialReference') {
                  referenceTags.push('@Texture');
                } else {
                  referenceTags.push('@Product'); // Default to heroProfile
                }
              }
              
              // Character reference
              if (shot.identity_references.refer_to_character) {
                referenceTags.push('@Character');
              }
              
              // Logo reference
              if (shot.identity_references.refer_to_logo) {
                referenceTags.push('@Logo');
              }
              
              // Previous shot references
              if (shot.identity_references.refer_to_previous_outputs?.length > 0) {
                shot.identity_references.refer_to_previous_outputs.forEach((ref: any) => {
                  // Format shot_id: "S1.1" -> "@Shot_1_1", "shot_1_1" -> "@Shot_1_1"
                  const formattedId = ref.shot_id.replace(/^[Ss]/, '').replace(/[^0-9]/g, '_');
                  referenceTags.push(`@Shot_${formattedId}`);
                });
              }
              
              return {
                id: shot.shot_id,
                sceneId: scene.scene_id,
                name: `${shot.shot_id}: ${shot.cinematic_goal}`,
                description: shot.brief_description,
                duration: timing?.rendered_duration || 5.0,
                shotType: shot.generation_mode.shot_type === 'IMAGE_REF' ? 'image-ref' : 'start-end',
                cameraPath: shot.technical_cinematography.camera_movement.toLowerCase().includes('orbit') ? 'orbit' :
                           shot.technical_cinematography.camera_movement.toLowerCase().includes('pan') ? 'pan' :
                           shot.technical_cinematography.camera_movement.toLowerCase().includes('zoom') ? 'zoom' :
                           shot.technical_cinematography.camera_movement.toLowerCase().includes('dolly') ? 'dolly' : 'static',
                lens: shot.technical_cinematography.lens.toLowerCase().includes('macro') ? 'macro' :
                      shot.technical_cinematography.lens.toLowerCase().includes('wide') ? 'wide' :
                      shot.technical_cinematography.lens.toLowerCase().includes('85') ? '85mm' : 'telephoto',
                referenceTags,
                previousShotReferences: shot.identity_references.refer_to_previous_outputs || [],
                isLinkedToPrevious: shot.continuity_logic.is_connected_to_previous,
                speedProfile: timing?.speed_curve === 'EASE_IN' ? 'smooth' :
                             timing?.speed_curve === 'EASE_OUT' ? 'smooth' : 'linear',
                multiplier: timing?.multiplier || 1.0,
                sfxHint: timing?.sfx_hint || '',
              };
            }),
          };
        });
        
        setSceneManifest({
          scenes: mappedScenes,
          continuityLinksEstablished: mappedScenes.some(s => s.shots.some((shot: any) => shot.isLinkedToPrevious)),
          durationBudget: step4.timing?.duration_budget || {
            target_total: 0,
            actual_total: 0,
            variance: 0,
          },
        });
        
        console.log('[SocialCommerce] Restored step4Data:', {
          sceneCount: mappedScenes.length,
          totalShots: mappedScenes.reduce((sum: number, s: any) => sum + s.shots.length, 0),
        });
      }
      
      // ✨ NEW: Restore step5Data if available (Agent 5.1 prompts)
      const step5 = existingVideo.step5Data as any;
      if (step5?.shotPrompts) {
        // Map prompts to ShotVersion objects
        const initialVersions: { [shotId: string]: ShotVersion[] } = {};
        
        // Use mappedScenes if step4Data was just restored, otherwise use sceneManifest
        const scenesToUse = (mappedScenes && mappedScenes.length > 0) ? mappedScenes : sceneManifest.scenes;
        
        // Iterate through all scenes and shots
        if (scenesToUse.length > 0) {
          scenesToUse.forEach((scene: any) => {
            scene.shots.forEach((shot: any) => {
              const shotPrompts = step5.shotPrompts[shot.id];
              if (shotPrompts) {
                // Determine condition from shot type and connection
                const condition = determineCondition(shot);
                
                // Create ShotVersion with prompts based on condition
                const version = createShotVersionFromPrompts(shot.id, shotPrompts, condition);
                initialVersions[shot.id] = [version];
              }
            });
          });
        }
        
        // Merge with existing shotVersions and update shot.currentVersionId
        setShotVersions(prev => {
          const merged = { ...prev };
          const updatedShots: { [sceneId: string]: Shot[] } = {};
          
          Object.entries(initialVersions).forEach(([shotId, versions]) => {
            if (!merged[shotId] || merged[shotId].length === 0) {
              merged[shotId] = versions;
              
              // ✨ CRITICAL: Update shot.currentVersionId so getShotVersion() can find the version
              // Find which scene contains this shot and update it
              Object.entries(shots).forEach(([sceneId, sceneShots]) => {
                const shot = sceneShots.find(s => s.id === shotId);
                if (shot && versions.length > 0) {
                  if (!updatedShots[sceneId]) {
                    updatedShots[sceneId] = [...sceneShots];
                  }
                  const shotIndex = updatedShots[sceneId].findIndex(s => s.id === shotId);
                  if (shotIndex >= 0) {
                    updatedShots[sceneId][shotIndex] = {
                      ...updatedShots[sceneId][shotIndex],
                      currentVersionId: versions[0].id,
                    };
                  }
                }
              });
            }
          });
          
          // Update shots state with currentVersionId set
          if (Object.keys(updatedShots).length > 0) {
            setShots(prev => ({ ...prev, ...updatedShots }));
          }
          
          return merged;
        });
        
        console.log('[SocialCommerce] Restored step5Data:', {
          shotPromptsCount: Object.keys(step5.shotPrompts || {}).length,
          versionsCreated: Object.keys(initialVersions).length,
        });
      }
      
      // Restore completedSteps
      if (Array.isArray(existingVideo.completedSteps)) {
        const stepMap: { [key: number]: CommerceStepId } = {
          1: "setup",
          2: "script",
          3: "environment",
          4: "world",
          5: "storyboard",
        };
        const restored = existingVideo.completedSteps
          .map(n => stepMap[n as number])
          .filter(Boolean) as CommerceStepId[];
        setCompletedSteps(restored);
      }
      
      // Set current step based on currentStep from DB
      if (existingVideo.currentStep) {
        const stepMap: { [key: number]: CommerceStepId } = {
          1: "setup",
          2: "script",
          3: "environment",
          4: "world",
          5: "storyboard",
        };
        const currentStepId = stepMap[existingVideo.currentStep];
        if (currentStepId) setActiveStep(currentStepId);
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
        const response = await fetch('/api/social-commerce/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            workspaceId,
            title: urlTitle,
            productTitle: urlTitle,
            aspectRatio: "9:16",
            duration: 15,
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
        toast({
          title: "Error",
          description: "Failed to create video. Please try again.",
          variant: "destructive",
        });
        creationAttempted.current = false; // Allow retry
      } finally {
        setIsCreating(false);
      }
    };
    
    createVideoProject();
  }, [isNewVideo, workspaceId, urlTitle, toast]);

  // Auto-save character and material settings to step2Data when they change
  useEffect(() => {
    const saveCharacterAndMaterialSettings = async () => {
      // Only save if we have a valid video ID and we're not loading an existing video
      if (!videoId || videoId === 'new' || isNewVideo || !existingVideo) {
        return;
      }

      // Only save if we have meaningful character or material data
      const hasCharacterData = characterAIProfile || characterMode || materialPreset;
      if (!hasCharacterData) {
        return;
      }

      try {
        const updates: any = {};

        // Build character updates (nested structure)
        const hasCharacterUpdates = characterAIProfile || characterMode || characterName || characterDescription;
        if (hasCharacterUpdates) {
          updates.character = {};
          if (characterAIProfile) updates.character.aiProfile = characterAIProfile;
          if (characterMode) updates.character.mode = characterMode;
          if (characterName) updates.character.name = characterName;
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
    characterAIProfile,
    characterMode,
    characterName,
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
    "setup": "script",  // Tab 1 = Campaign Config (ProductSetupTab)
    "script": "product-dna",  // Tab 2 = Product DNA & Brand Identity (HookFormatTab)
    "environment": "environment-story",  // Tab 3 = Environment & Story Beats (VisualStyleTab)
    "world": "world",
    "storyboard": "storyboard",
    "animatic": "animatic",
    "export": "export"
  };

  // Helper: Convert step to number
  const stepToNumber = (step: CommerceStepId): number => {
    const stepMap: { [key in CommerceStepId]: number } = {
      "setup": 1,
      "script": 2,
      "environment": 3,
      "world": 4,
      "storyboard": 5,
      "animatic": 6,
      "export": 7
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
    key: 'heroProfile' | 'macroDetail' | 'materialReference',
    file: File
  ) => {
    try {
      if (!currentWorkspace?.id || !videoId) {
        toast({
          title: "Cannot upload",
          description: "Workspace or video not ready",
          variant: "destructive",
        });
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
      
      // Store CDN URL and asset ID
      setProductImages(prev => ({ ...prev, [key]: data.cdnUrl }));
      setProductImageAssetIds(prev => ({ ...prev, [key]: data.assetId }));

      // ✨ Immediately save to step2Data (so user can see images after page refresh)
      if (videoId && videoId !== 'new') {
        try {
          await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              product: {
                images: {
                  [key]: data.cdnUrl,
                },
              },
            }),
          });
          console.log(`[SocialCommerce] Saved product.images.${key} to step2Data`);
        } catch (saveError) {
          console.error('Failed to save to step2Data:', saveError);
        }
      }

      toast({
        title: "Image uploaded to Bunny CDN",
        description: "Available in Assets → Uploads",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    }
  };

  const handleCharacterImageUpload = async (file: File, nameOverride?: string, descriptionOverride?: string) => {
    try {
      if (!currentWorkspace?.id || !videoId) {
        toast({
          title: "Cannot upload",
          description: "Workspace or video not ready",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'character');
      formData.append('workspaceId', currentWorkspace.id);
      formData.append('videoId', videoId);
      formData.append('characterName', nameOverride || characterName || 'Campaign Character');
      formData.append('characterDescription', descriptionOverride ?? characterDescription ?? '');

      const response = await fetch('/api/social-commerce/upload-temp', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Store CDN URL and asset ID
      setCharacterReferenceUrl(data.cdnUrl);
      setCharacterAssetId(data.assetId);

      // ✨ Immediately save to step2Data (so user can see character after page refresh)
      if (videoId && videoId !== 'new') {
        try {
          await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              character: {
                referenceUrl: data.cdnUrl,
                assetId: data.assetId,
                name: nameOverride || characterName || 'Campaign Character',
                mode: 'upload', // User uploaded a character
              },
            }),
          });
          console.log('[SocialCommerce] Saved character to step2Data');
        } catch (saveError) {
          console.error('Failed to save to step2Data:', saveError);
        }
      }

      toast({
        title: "Character uploaded to Bunny CDN",
        description: "Available in Assets → Characters",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      if (!currentWorkspace?.id || !videoId) {
        toast({
          title: "Cannot upload",
          description: "Workspace or video not ready",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'logo');
      formData.append('workspaceId', currentWorkspace.id);
      formData.append('videoId', videoId);
      formData.append('brandName', brandName || 'Campaign Brand');
      formData.append('brandPrimaryColor', brandPrimaryColor || '#000000');
      formData.append('brandSecondaryColor', brandSecondaryColor || '#FFFFFF');

      const response = await fetch('/api/social-commerce/upload-temp', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Store CDN URL and asset ID
      setLogoUrl(data.cdnUrl);
      setBrandkitAssetId(data.assetId);

      // ✨ Immediately save to step2Data (so user can see logo after page refresh)
      if (videoId && videoId !== 'new') {
        try {
          await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              brand: {
                logoUrl: data.cdnUrl,
                assetId: data.assetId,
                name: brandName || 'Campaign Brand',
                colors: {
                  primary: brandPrimaryColor || '#000000',
                  secondary: brandSecondaryColor || '#FFFFFF',
                },
              },
            }),
          });
          console.log('[SocialCommerce] Saved brand to step2Data');
        } catch (saveError) {
          console.error('Failed to save to step2Data:', saveError);
        }
      }

      toast({
        title: "Logo uploaded to Bunny CDN",
        description: "Available in Assets → Brand Kits",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    }
  };

  const handleStyleReferenceUpload = async (file: File) => {
    try {
      if (!currentWorkspace?.id || !videoId) {
        toast({
          title: "Cannot upload",
          description: "Workspace or video not ready",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'style');
      formData.append('workspaceId', currentWorkspace.id);
      formData.append('videoId', videoId);

      const response = await fetch('/api/social-commerce/upload-temp', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Store CDN URL directly
      setStyleReferenceUrl(data.cdnUrl);

      // ✨ Immediately save to step2Data (so user can see style reference after page refresh)
      if (videoId && videoId !== 'new') {
        try {
          await fetch(`/api/social-commerce/videos/${videoId}/step/2/data`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              style: {
                referenceUrl: data.cdnUrl,
              },
            }),
          });
          console.log('[SocialCommerce] Saved style to step2Data');
        } catch (saveError) {
          console.error('Failed to save to step2Data:', saveError);
        }
      }

      toast({
        title: "Style reference uploaded to Bunny CDN",
        description: "Available in Assets → Uploads",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        variant: "destructive",
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSET DELETION HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleDeleteCharacter = async () => {
    if (!characterAssetId) return;
    
    try {
      // Delete from Assets + Bunny + update video's step2Data (backend handles all)
      const url = videoId && videoId !== 'new' 
        ? `/api/social-commerce/assets/character/${characterAssetId}?videoId=${videoId}`
        : `/api/social-commerce/assets/character/${characterAssetId}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete from Assets');
      }
      
      // Clear frontend state (backend already updated step2Data)
      setCharacterReferenceUrl(null);
      setCharacterAssetId(null);
      setCharacterName('');
      setCharacterAIProfile(null);
      
      // Show success toast
      toast({
        title: "Character deleted",
        description: "Removed from Assets and Bunny CDN",
      });
    } catch (error) {
      console.error('Delete character error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete character",
        variant: "destructive",
      });
      // State remains unchanged - item still visible in UI
    }
  };

  const handleDeleteLogo = async () => {
    if (!brandkitAssetId) return;
    
    try {
      // Delete from Assets + Bunny + update video's step2Data (backend handles all)
      const url = videoId && videoId !== 'new' 
        ? `/api/social-commerce/assets/brandkit/${brandkitAssetId}?videoId=${videoId}`
        : `/api/social-commerce/assets/brandkit/${brandkitAssetId}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete from Assets');
      }
      
      // Clear frontend state (backend already updated step2Data)
      setLogoUrl(null);
      setBrandkitAssetId(null);
      setBrandName('');
      
      // Show success toast
      toast({
        title: "Logo deleted",
        description: "Removed from Assets and Bunny CDN",
      });
    } catch (error) {
      console.error('Delete logo error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete logo",
        variant: "destructive",
      });
      // State remains unchanged - item still visible in UI
    }
  };

  const handleDeleteProductImage = async (key: 'heroProfile' | 'macroDetail' | 'materialReference') => {
    const assetId = productImageAssetIds[key];
    if (!assetId) {
      // If no asset ID, just clear from state (not yet uploaded to DB)
      setProductImages(prev => ({ ...prev, [key]: null }));
      toast({
        title: "Image removed",
        description: "Product image cleared",
      });
      return;
    }
    
    try {
      // Delete from Assets + Bunny + update video's step2Data (backend handles all)
      // Pass imageKey so backend knows exactly which product image to clear
      const params = new URLSearchParams();
      if (videoId && videoId !== 'new') {
        params.append('videoId', videoId);
        params.append('imageKey', key);
        params.append('imageType', 'product');
      }
      const url = `/api/social-commerce/assets/upload/${assetId}${params.toString() ? '?' + params.toString() : ''}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete from Assets');
      }
      
      // Clear frontend state (backend already updated step2Data)
      setProductImages(prev => ({ ...prev, [key]: null }));
      setProductImageAssetIds(prev => ({ ...prev, [key]: null }));
      
      // Show success toast
      toast({
        title: "Image deleted",
        description: "Removed from Assets and Bunny CDN",
      });
    } catch (error) {
      console.error('Delete product image error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete image",
        variant: "destructive",
      });
      // State remains unchanged - item still visible in UI
    }
  };

  const captureStepSnapshot = (step: CommerceStepId): any => {
    if (step === "setup") {
      return {
        imageModel,
        videoModel,
        aspectRatio,
        duration,
        motionPrompt,
        imageInstructions,
        targetAudience,
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
        characterReferenceUrl,
        characterName,
        characterDescription,
        logoUrl,
        brandPrimaryColor,
        brandSecondaryColor,
        logoIntegrity,
        logoDepth,
        styleReferenceUrl,
      };
    }
    if (step === "environment") {
      return {
        environmentConcept,
        cinematicLighting,
        atmosphericDensity,
        visualPreset,
        styleReferenceUrl,
        campaignSpark,
        visualBeats: { ...visualBeats },
        campaignObjective,
        environmentBrandPrimaryColor,
        environmentBrandSecondaryColor,
      };
    }
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
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveStep(nextStep);
      setTimeout(() => setIsTransitioning(false), 100); // Small delay for animation to complete
    }, delay);
  };

  const handleNext = async () => {
    const steps: CommerceStepId[] = ["setup", "script", "environment", "world", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= steps.length) {
      return; // Already at last step
    }
    
    // Check if current step is dirty AND was previously completed
    if (dirtySteps.has(activeStep) && completedSteps.includes(activeStep)) {
      setShowResetWarning(true);
      setPendingNavigation(steps[nextIndex]);
      return; // Don't proceed yet - wait for user confirmation
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 1 (SETUP): Run Agent 1.1 and save step1Data
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "setup") {
      // ✨ Skip agent if step already completed and no changes made
      if (completedSteps.includes(activeStep) && !dirtySteps.has(activeStep)) {
        console.log('[SocialCommerce] Step 1 already completed, no changes - navigating directly');
        setDirection(1);
        transitionToStep(steps[nextIndex], 150); // Faster transition for skip
        return;
      }
      
      if (videoId === "new") {
        toast({
          title: "Error",
          description: "Video not created yet. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      setIsCreating(true); // Show loading state
      
      try {
        // Prepare step1Data
        const step1Data = {
          productTitle: productDetails.title || urlTitle,
          productDescription: productDetails.description,
          productCategory: undefined, // TODO: Add category field if needed
          targetAudience,
          region: undefined, // TODO: Add region field if needed
          aspectRatio,
          duration: parseInt(duration, 10),
          customImageInstructions: imageInstructions,
          customMotionInstructions: motionPrompt,
          // AI Model Settings
          imageModel,
          imageResolution,
          videoModel,
          videoResolution,
          language,
          voiceOverEnabled,
        };
        
        console.log('[SocialCommerce] Saving step 1 and running Agent 1.1:', step1Data);
        
        // Call backend API to run Agent 1.1 and save step1Data
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
        console.log('[SocialCommerce] Step 1 saved, Agent 1.1 completed:', {
          currentStep: updatedVideo.currentStep,
          strategicContext: updatedVideo.step1Data?.strategicContext,
        });
        
        toast({
          title: "Strategic Context Generated",
          description: "Agent 1.1 has optimized your campaign strategy.",
        });
        
        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(steps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Failed to save step 1:', error);
        setIsTransitioning(false); // Reset transition state on error
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save step 1. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 2 (SCRIPT/PRODUCT DNA): Upload images and run Agents 2.1-2.3
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "script") {
      // ✨ Skip agents if step already completed and no changes made
      if (completedSteps.includes(activeStep) && !dirtySteps.has(activeStep)) {
        console.log('[SocialCommerce] Step 2 already completed, no changes - navigating directly');
        setDirection(1);
        transitionToStep(steps[nextIndex], 150); // Faster transition for skip
        return;
      }
      
      if (videoId === "new") {
        toast({
          title: "Error",
          description: "Video not created yet. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate required fields
      if (!productImages.heroProfile) {
        toast({
          title: "Error",
          description: "Hero profile image is required",
          variant: "destructive",
        });
        return;
      }
      
      setIsCreating(true);
      
      try {
        console.log('[SocialCommerce] Running Tab 2 agents...');
        
        // If there's a reference file for AI generation, upload it first
        let finalCharacterReferenceUrl = characterReferenceUrl;
        if (characterReferenceFile && (!characterReferenceUrl || characterReferenceUrl.startsWith('blob:'))) {
          console.log('[SocialCommerce] Uploading character reference image for AI generation...');
          
          const formData = new FormData();
          formData.append('file', characterReferenceFile);
          formData.append('category', 'character');
          formData.append('workspaceId', currentWorkspace!.id);
          formData.append('videoId', videoId);
          formData.append('characterName', 'AI Reference');
          formData.append('characterDescription', characterDescription || 'Reference for AI character generation');
          
          const uploadResponse = await fetch('/api/social-commerce/upload-temp', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            finalCharacterReferenceUrl = uploadData.cdnUrl;
            console.log('[SocialCommerce] Reference uploaded:', finalCharacterReferenceUrl);
          } else {
            console.warn('[SocialCommerce] Reference upload failed, continuing without it');
          }
        }
        
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/2/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            // CDN URLs (already uploaded)
            heroProfileUrl: productImages.heroProfile,
            macroDetailUrl: productImages.macroDetail,
            materialReferenceUrl: productImages.materialReference,
            characterReferenceUrl: finalCharacterReferenceUrl,
            logoUrl,
            styleReferenceUrl,
            
            // Asset IDs (already created)
            characterAssetId,
            brandkitAssetId,
            
            // Asset names (for display)
            characterName: characterName || `Character for ${videoTitle}`,
            brandName: brandName || `Brand for ${videoTitle}`,
            
            // Material settings
            materialPreset,
            objectMass,
            surfaceComplexity,
            refractionEnabled,
            heroFeature,
            originMetaphor,
            
            // Character settings
            includeHumanElement,
            characterMode,
            characterDescription,
            characterAIProfile, // Send AI profile if character was uploaded (minimal profile)
            targetAudience,
            
            // Brand settings
            brandPrimaryColor,
            brandSecondaryColor,
            logoIntegrity,
            logoDepth,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to process Tab 2');
        }
        
        const data = await response.json();
        
        console.log('[SocialCommerce] Tab 2 completed:', {
          costs: data.costs,
          assets: data.assets,
        });
        
        toast({
          title: "Product DNA Generated",
          description: `Agents 2.1-2.3 completed successfully (cost: $${data.costs.total.toFixed(4)})`,
        });
        
        // Log created assets
        if (data.assets.characterId) {
          console.log('Character asset created:', data.assets.characterId);
        }
        if (data.assets.brandkitId) {
          console.log('Brandkit asset created:', data.assets.brandkitId);
        }
        
        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(steps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Tab 2 error:', error);
        setIsTransitioning(false); // Reset transition state on error
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process Tab 2",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 3 (ENVIRONMENT): Run Agents 3.0-3.3 and save step3Data
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "environment") {
      // ✨ Skip agents if step already completed and no changes made
      if (completedSteps.includes(activeStep) && !dirtySteps.has(activeStep)) {
        console.log('[SocialCommerce] Step 3 already completed, no changes - navigating directly');
        setDirection(1);
        transitionToStep(steps[nextIndex], 150); // Faster transition for skip
        return;
      }
      
      if (videoId === "new") {
        toast({
          title: "Error",
          description: "Video not created yet. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate required fields
      if (!environmentConcept || environmentConcept.trim().length < 20) {
        toast({
          title: "Error",
          description: "Environment concept must be at least 20 characters",
          variant: "destructive",
        });
        return;
      }
      
      if (!campaignSpark || campaignSpark.trim().length < 10) {
        toast({
          title: "Error",
          description: "Creative spark must be at least 10 characters",
          variant: "destructive",
        });
        return;
      }
      
      setIsCreating(true);
      
      try {
        console.log('[SocialCommerce] Running Tab 3 agents...');
        
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/3/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            environmentConcept,
            atmosphericDensity,
            cinematicLighting,
            visualPreset,
            styleReferenceUrl,
            campaignSpark, // Use existing if filled, or let backend generate
            campaignObjective: campaignObjective || '', // Optional - empty string if not selected
            visualBeats,
            ctaText, // Manual CTA text edits
            environmentBrandPrimaryColor,
            environmentBrandSecondaryColor,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Failed to process Tab 3');
        }
        
        const data = await response.json();
        
        console.log('[SocialCommerce] Tab 3 and Tab 4 completed:', {
          totalCost: data.totalCost,
          step3Data: data.step3Data,
          step4Data: data.step4Data,
        });
        
        // ✨ NEW: Map step4Data to sceneManifest if available
        if (data.step4Data?.mediaPlanner?.scenes) {
          const mappedScenes = data.step4Data.mediaPlanner.scenes.map((scene: any, sceneIdx: number) => {
            // Map timing data by shot_id
            const timingMap = new Map(
              (data.step4Data.timing?.temporal_map || []).map((t: any) => [t.shot_id, t])
            );
            
            return {
              id: scene.scene_id,
              name: scene.scene_name,
              description: scene.scene_description,
              duration: scene.shots.reduce((sum: number, shot: any) => {
                const timing = timingMap.get(shot.shot_id);
                return sum + (timing?.rendered_duration || 5.0);
              }, 0),
              actType: sceneIdx === 0 ? 'hook' : sceneIdx === 1 ? 'transformation' : 'payoff',
              shots: scene.shots.map((shot: any) => {
                const timing = timingMap.get(shot.shot_id);
                
                // Build reference tags based on identity_references
                const referenceTags: string[] = [];
                
                // Product reference with variant
                if (shot.identity_references.refer_to_product) {
                  const productRef = shot.identity_references.product_image_ref;
                  if (productRef === 'macroDetail') {
                    referenceTags.push('@Product_Macro');
                  } else if (productRef === 'materialReference') {
                    referenceTags.push('@Texture');
                  } else {
                    referenceTags.push('@Product'); // Default to heroProfile
                  }
                }
                
                // Character reference
                if (shot.identity_references.refer_to_character) {
                  referenceTags.push('@Character');
                }
                
                // Logo reference
                if (shot.identity_references.refer_to_logo) {
                  referenceTags.push('@Logo');
                }
                
                // Previous shot references
                if (shot.identity_references.refer_to_previous_outputs?.length > 0) {
                  shot.identity_references.refer_to_previous_outputs.forEach((ref: any) => {
                    // Format shot_id: "S1.1" -> "@Shot_1_1", "shot_1_1" -> "@Shot_1_1"
                    const formattedId = ref.shot_id.replace(/^[Ss]/, '').replace(/[^0-9]/g, '_');
                    referenceTags.push(`@Shot_${formattedId}`);
                  });
                }
                
                return {
                  id: shot.shot_id,
                  sceneId: scene.scene_id,
                  name: `${shot.shot_id}: ${shot.cinematic_goal}`,
                  description: shot.brief_description,
                  duration: timing?.rendered_duration || 5.0,
                  shotType: shot.generation_mode.shot_type === 'IMAGE_REF' ? 'image-ref' : 'start-end',
                  cameraPath: shot.technical_cinematography.camera_movement.toLowerCase().includes('orbit') ? 'orbit' :
                             shot.technical_cinematography.camera_movement.toLowerCase().includes('pan') ? 'pan' :
                             shot.technical_cinematography.camera_movement.toLowerCase().includes('zoom') ? 'zoom' :
                             shot.technical_cinematography.camera_movement.toLowerCase().includes('dolly') ? 'dolly' : 'static',
                  lens: shot.technical_cinematography.lens.toLowerCase().includes('macro') ? 'macro' :
                        shot.technical_cinematography.lens.toLowerCase().includes('wide') ? 'wide' :
                        shot.technical_cinematography.lens.toLowerCase().includes('85') ? '85mm' : 'telephoto',
                  referenceTags,
                  previousShotReferences: shot.identity_references.refer_to_previous_outputs || [],
                  isLinkedToPrevious: shot.continuity_logic.is_connected_to_previous,
                  speedProfile: timing?.speed_curve === 'EASE_IN' ? 'smooth' :
                               timing?.speed_curve === 'EASE_OUT' ? 'smooth' : 'linear',
                  multiplier: timing?.multiplier || 1.0,
                  sfxHint: timing?.sfx_hint || '',
                };
              }),
            };
          });
          
          setSceneManifest({
            scenes: mappedScenes,
            continuityLinksEstablished: mappedScenes.some(s => s.shots.some((shot: any) => shot.isLinkedToPrevious)),
            durationBudget: data.step4Data.timing?.duration_budget || {
              target_total: 0,
              actual_total: 0,
              variance: 0,
            },
          });
          
          console.log('[SocialCommerce] Mapped step4Data to sceneManifest:', {
            sceneCount: mappedScenes.length,
            totalShots: mappedScenes.reduce((sum: number, s: any) => sum + s.shots.length, 0),
          });
        }
        
        toast({
          title: "Environment, Story & Shots Generated",
          description: `Agents 3.0-3.3 and 4.1-4.2 completed successfully (cost: $${(data.totalCost || 0).toFixed(4)})`,
        });
        
        // Mark step as completed and advance
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }
        setDirection(1);
        transitionToStep(steps[nextIndex], 300);
      } catch (error) {
        console.error('[SocialCommerce] Tab 3 error:', error);
        setIsTransitioning(false); // Reset transition state on error
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process Tab 3",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB 4 (STORYBOARD): Save sceneManifest to step4Data
    // ═══════════════════════════════════════════════════════════════════════════
    if (activeStep === "world") {
      if (videoId === "new") {
        toast({
          title: "Error",
          description: "Video not created yet. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      try {
        console.log('[SocialCommerce] Saving step 4 (sceneManifest):', {
          sceneCount: sceneManifest.scenes.length,
          totalShots: sceneManifest.scenes.reduce((sum, s) => sum + s.shots.length, 0),
        });

        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/4/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sceneManifest }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to save step 4');
        }

        const data = await response.json();
        
        console.log('[SocialCommerce] Step 4 saved successfully:', {
          sceneCount: data.step4Data?.mediaPlanner?.scenes?.length || 0,
        });

        toast({
          title: "Storyboard Saved",
          description: "All scenes and shots have been saved successfully",
        });

        // Mark step as completed
        if (!completedSteps.includes(activeStep)) {
          setCompletedSteps([...completedSteps, activeStep]);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // TAB 5: Generate prompts using Agent 5.1
        // ═══════════════════════════════════════════════════════════════════════
        const sceneCount = sceneManifest.scenes.length;
        const shotCount = sceneManifest.scenes.reduce((sum, s) => sum + s.shots.length, 0);
        
        console.log('[SocialCommerce] Starting prompt generation...', {
          videoId,
          sceneCount,
          shotCount,
          url: `/api/social-commerce/videos/${videoId}/step/5/generate-prompts`,
        });
        
        let promptsResponse: Response;
        try {
          promptsResponse = await fetch(`/api/social-commerce/videos/${videoId}/step/5/generate-prompts`, {
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
            shotCount: promptsData.shotCount,
            hasStep5Data: !!promptsData.step5Data,
            currentStep: promptsData.currentStep,
          });
        } catch (parseError) {
          console.error('[SocialCommerce] Failed to parse success response:', parseError);
          throw new Error('Failed to parse server response. Please try again.');
        }

        toast({
          title: "Prompts Generated",
          description: `Successfully generated prompts for ${promptsData.shotCount || 0} shots`,
        });

        // ✨ NEW: Sync prompts to shotVersions when step5Data is returned
        if (promptsData.step5Data?.shotPrompts) {
          // Helper to find shot by ID from sceneManifest
          const findShotById = (shotId: string): any => {
            for (const scene of sceneManifest.scenes) {
              const shot = scene.shots.find(s => s.id === shotId);
              if (shot) return shot;
            }
            return null;
          };
          
          // Update shotVersions with new prompts and set currentVersionId on shots
          setShotVersions(prev => {
            const updatedVersions = { ...prev };
            const updatedShots: { [sceneId: string]: Shot[] } = {};
            
            Object.entries(promptsData.step5Data.shotPrompts).forEach(([shotId, shotPrompts]: [string, any]) => {
              const shot = findShotById(shotId);
              if (shot) {
                const condition = determineCondition(shot);
                const version = createShotVersionFromPrompts(shotId, shotPrompts, condition);
                updatedVersions[shotId] = [version];
                
                // ✨ CRITICAL: Update shot.currentVersionId so getShotVersion() can find the version
                // Find which scene contains this shot and update it
                Object.entries(shots).forEach(([sceneId, sceneShots]) => {
                  const foundShot = sceneShots.find(s => s.id === shotId);
                  if (foundShot) {
                    if (!updatedShots[sceneId]) {
                      updatedShots[sceneId] = [...sceneShots];
                    }
                    const shotIndex = updatedShots[sceneId].findIndex(s => s.id === shotId);
                    if (shotIndex >= 0) {
                      updatedShots[sceneId][shotIndex] = {
                        ...updatedShots[sceneId][shotIndex],
                        currentVersionId: version.id,
                      };
                    }
                  }
                });
              }
            });
            
            // Update shots state with currentVersionId set
            if (Object.keys(updatedShots).length > 0) {
              setShots(prev => ({ ...prev, ...updatedShots }));
            }
            
            return updatedVersions;
          });
          
          console.log('[SocialCommerce] Synced prompts to shotVersions:', {
            shotCount: Object.keys(promptsData.step5Data.shotPrompts).length,
          });
        }

        // Advance to next step
        setDirection(1);
        transitionToStep(steps[nextIndex], 300);
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
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
      
      return;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OTHER STEPS: Just advance
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Mark current step as completed when moving forward
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    
    setDirection(1);
    transitionToStep(steps[nextIndex], 200); // Faster for simple navigation
  };

  const handleBack = () => {
    const steps: CommerceStepId[] = ["setup", "script", "environment", "world", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      setDirection(-1);
      transitionToStep(steps[prevIndex], 200); // Smooth back transition
    }
  };

  // Helper: Reset frontend state for cleared steps
  const resetStepState = (stepNumber: number) => {
    console.log('[SocialCommerce] Resetting frontend state for step:', stepNumber);
    
    // Reset Step 2 state (Product DNA, Character, Brand)
    if (stepNumber <= 2) {
      setProductImages({
        heroProfile: null,
        macroDetail: null,
        materialReference: null,
      });
      setProductImageAssetIds({
        heroProfile: null,
        macroDetail: null,
        materialReference: null,
      });
      setCharacterAssetId(null);
      setCharacterReferenceUrl(null);
      setCharacterReferenceFile(null);
      setCharacterName('');
      setCharacterDescription('');
      setCharacterAIProfile(null);
      setCharacterMode(null);
      setIncludeHumanElement(false);
      setBrandkitAssetId(null);
      setLogoUrl(null);
      setBrandName('');
      setBrandPrimaryColor("#FF006E");
      setBrandSecondaryColor("#FB5607");
      setLogoIntegrity(7);
      setLogoDepth(5);
      setMaterialPreset("");
      setObjectMass(50);
      setSurfaceComplexity(50);
      setRefractionEnabled(false);
      setHeroFeature("");
      setOriginMetaphor("");
      setStyleReferenceUrl(null);
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
      setEnvironmentConcept("");
      setCinematicLighting("");
      setAtmosphericDensity(50);
      setVisualPreset("");
      setEnvironmentBrandPrimaryColor(brandPrimaryColor);
      setEnvironmentBrandSecondaryColor(brandSecondaryColor);
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

    const steps: CommerceStepId[] = ["setup", "script", "environment", "world", "storyboard", "animatic", "export"];
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
      const stepNumbers = [1, 2, 3, 4, 5, 6];
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

      toast({
        title: "Video Reset",
        description: "Future steps have been cleared. You can now continue with your changes.",
      });

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
      toast({
        title: "Error",
        description: "Failed to reset video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Get human-readable step name
  const getStepName = (step: CommerceStepId): string => {
    const names: { [key in CommerceStepId]: string } = {
      "setup": "Strategic Context",
      "script": "Product & Cast DNA",
      "environment": "Environment & Story",
      "world": "Shot Orchestrator",
      "storyboard": "Storyboard",
      "animatic": "Preview",
      "export": "Export",
    };
    return names[step];
  };

  // Show loading while workspace is being loaded or video is being created
  // Only show full-screen loader for initial video creation, not step transitions
  const isInitialVideoCreation = isNewVideo && isCreating;
  if (isWorkspaceLoading || (!isNewVideo && isVideoLoading) || isInitialVideoCreation) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          {isInitialVideoCreation && (
            <p className="text-muted-foreground">Creating your project...</p>
          )}
        </div>
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

  // Show narrative mode selector if not selected (shouldn't happen for commerce, but keeping for safety)
  if (!narrativeMode) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <NarrativeModeSelector onSelectMode={(mode) => setNarrativeMode(mode)} />
      </div>
    );
  }

  // Compute nextLabel based on current state
  const computedNextLabel = isTransitioning 
    ? "Loading..."
    : (isCreating 
      ? (activeStep === "setup" ? "Running Agent 1.1..." :
         activeStep === "script" ? "Running Agents 2.1-2.3..." :
         activeStep === "environment" ? "Running Agents 3.0-3.3 & 4.1-4.2..." :
         activeStep === "storyboard" ? "Saving storyboard..." :
         "Processing...")
      : undefined);

  return (
    <SocialCommerceStudioLayout
      currentStep={activeStep}
      completedSteps={completedSteps}
      dirtySteps={dirtySteps}
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
              workspaceId={workspaceId}
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
              imageModel={imageModel}
              imageResolution={imageResolution}
              videoModel={videoModel}
              videoResolution={videoResolution}
              language={language}
              motionPrompt={motionPrompt}
              productImages={productImages}
              materialPreset={materialPreset}
              objectMass={objectMass}
              surfaceComplexity={surfaceComplexity}
              refractionEnabled={refractionEnabled}
              logoUrl={logoUrl}
              brandPrimaryColor={brandPrimaryColor}
              brandSecondaryColor={brandSecondaryColor}
              logoIntegrity={logoIntegrity}
              logoDepth={logoDepth}
              heroFeature={heroFeature}
              originMetaphor={originMetaphor}
              onScriptChange={setScript}
              onAspectRatioChange={(value) => { setAspectRatio(value); markStepDirty('setup'); }}
              onDurationChange={(value) => { setDuration(value); markStepDirty('setup'); }}
              onVoiceActorChange={setVoiceActorId}
              onVoiceOverToggle={setVoiceOverEnabled}
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
              onImageModelChange={(value) => { setImageModel(value); markStepDirty('setup'); }}
              onImageResolutionChange={(value) => { setImageResolution(value); markStepDirty('setup'); }}
              onVideoModelChange={(value) => { setVideoModel(value); markStepDirty('setup'); }}
              onVideoResolutionChange={(value) => { setVideoResolution(value); markStepDirty('setup'); }}
              onLanguageChange={(value) => { setLanguage(value); markStepDirty('setup'); }}
              onMotionPromptChange={(value) => { setMotionPrompt(value); markStepDirty('setup'); }}
              onImageInstructionsChange={(value) => { setImageInstructions(value); markStepDirty('setup'); }}
              imageInstructions={imageInstructions}
              onProductImagesChange={(value) => { setProductImages(value); markStepDirty('script'); }}
              onProductImageUpload={handleProductImageUpload}
              onProductImageDelete={handleDeleteProductImage}
              onMaterialPresetChange={(value) => { setMaterialPreset(value); markStepDirty('script'); }}
              onObjectMassChange={setObjectMass}
              onSurfaceComplexityChange={(value) => { setSurfaceComplexity(value); markStepDirty('script'); }}
              onRefractionEnabledChange={(value) => { setRefractionEnabled(value); markStepDirty('script'); }}
              onLogoUrlChange={(value) => { setLogoUrl(value); markStepDirty('script'); }}
              onLogoUpload={handleLogoUpload}
              onLogoDelete={handleDeleteLogo}
              onBrandPrimaryColorChange={(value) => { setBrandPrimaryColor(value); markStepDirty('script'); }}
              onBrandSecondaryColorChange={(value) => { setBrandSecondaryColor(value); markStepDirty('script'); }}
              onLogoIntegrityChange={(value) => { setLogoIntegrity(value); markStepDirty('script'); }}
              onLogoDepthChange={(value) => { setLogoDepth(value); markStepDirty('script'); }}
              onHeroFeatureChange={(value) => { setHeroFeature(value); markStepDirty('script'); }}
              onOriginMetaphorChange={(value) => { setOriginMetaphor(value); markStepDirty('script'); }}
              environmentConcept={environmentConcept}
              cinematicLighting={cinematicLighting}
              atmosphericDensity={atmosphericDensity}
              styleReferenceUrl={styleReferenceUrl}
              visualPreset={visualPreset}
              campaignSpark={campaignSpark}
              visualBeats={visualBeats}
              environmentBrandPrimaryColor={environmentBrandPrimaryColor}
              environmentBrandSecondaryColor={environmentBrandSecondaryColor}
              targetAudience={targetAudience}
              ctaText={ctaText}
              includeHumanElement={includeHumanElement}
              characterMode={characterMode}
              characterReferenceUrl={characterReferenceUrl}
              characterAssetId={characterAssetId}
              characterDescription={characterDescription}
              characterAIProfile={characterAIProfile}
              isGeneratingCharacter={isGeneratingCharacter}
              onCharacterAIProfileChange={setCharacterAIProfile}
              onIsGeneratingCharacterChange={setIsGeneratingCharacter}
              onEnvironmentConceptChange={(value) => { setEnvironmentConcept(value); markStepDirty('environment'); }}
              onCinematicLightingChange={(value) => { setCinematicLighting(value); markStepDirty('environment'); }}
              onAtmosphericDensityChange={(value) => { setAtmosphericDensity(value); markStepDirty('environment'); }}
              onStyleReferenceUrlChange={(value) => { setStyleReferenceUrl(value); markStepDirty('environment'); }}
              onVisualPresetChange={(value) => { setVisualPreset(value); markStepDirty('environment'); }}
              onCampaignSparkChange={(value) => { setCampaignSpark(value); markStepDirty('environment'); }}
              onVisualBeatsChange={(value) => { setVisualBeats(value); markStepDirty('environment'); }}
              onEnvironmentBrandPrimaryColorChange={(value) => { setEnvironmentBrandPrimaryColor(value); markStepDirty('environment'); }}
              onEnvironmentBrandSecondaryColorChange={(value) => { setEnvironmentBrandSecondaryColor(value); markStepDirty('environment'); }}
              campaignObjective={campaignObjective}
              onCampaignObjectiveChange={(value) => { setCampaignObjective(value); markStepDirty('environment'); }}
              onTargetAudienceChange={(value) => { setTargetAudience(value); markStepDirty('setup'); }}
              onCtaTextChange={setCtaText}
              onIncludeHumanElementChange={(value) => { setIncludeHumanElement(value); markStepDirty('script'); }}
              onCharacterModeChange={(value) => { setCharacterMode(value); markStepDirty('script'); }}
              onCharacterReferenceUrlChange={(value) => { setCharacterReferenceUrl(value); markStepDirty('script'); }}
              onCharacterImageUpload={handleCharacterImageUpload}
              onCharacterDelete={handleDeleteCharacter}
              onCharacterDescriptionChange={(value) => { setCharacterDescription(value); markStepDirty('script'); }}
              onCharacterNameChange={(value) => { setCharacterName(value); markStepDirty('script'); }}
              onCharacterAssetIdChange={setCharacterAssetId}
              onCharacterReferenceFileChange={setCharacterReferenceFile}
              sceneManifest={sceneManifest}
              onSceneManifestChange={setSceneManifest}
              onNext={handleNext}
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
