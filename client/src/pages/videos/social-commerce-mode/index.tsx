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
  const [imageModel, setImageModel] = useState("imagen-4");
  const [imageResolution, setImageResolution] = useState("2K");
  const [videoModel, setVideoModel] = useState("kling-o1");
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
  
  // Asset IDs for created assets (character, brandkit)
  const [characterAssetId, setCharacterAssetId] = useState<string | null>(null);
  const [brandkitAssetId, setBrandkitAssetId] = useState<string | null>(null);
  
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
        isLinkedToPrevious: boolean;
      }>;
    }>;
    continuityLinksEstablished: boolean;
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
    imageModel: "imagen-4",
    videoModel: "kling",
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
          shotType: shot.name.split(':')[1]?.trim() || 'Product View',
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
      }
      
      // Restore step2Data if available
      const step2 = existingVideo.step2Data as any;
      if (step2) {
        // Product images
        if (step2.productImages) {
          setProductImages({
            heroProfile: step2.productImages.heroProfile || null,
            macroDetail: step2.productImages.macroDetail || null,
            materialReference: step2.productImages.materialReference || null,
          });
        }
        
        // Character data
        if (step2.characterReferenceUrl) setCharacterReferenceUrl(step2.characterReferenceUrl);
        if (step2.characterAssetId) setCharacterAssetId(step2.characterAssetId);
        if (step2.characterName) setCharacterName(step2.characterName);
        if (step2.characterDescription) setCharacterDescription(step2.characterDescription);
        if (step2.characterMode) setCharacterMode(step2.characterMode);
        
        // Brand data
        if (step2.logoUrl) setLogoUrl(step2.logoUrl);
        if (step2.brandkitAssetId) setBrandkitAssetId(step2.brandkitAssetId);
        if (step2.brandName) setBrandName(step2.brandName);
        if (step2.brandPrimaryColor) setBrandPrimaryColor(step2.brandPrimaryColor);
        if (step2.brandSecondaryColor) setBrandSecondaryColor(step2.brandSecondaryColor);
        if (step2.logoIntegrity !== undefined) setLogoIntegrity(step2.logoIntegrity);
        if (step2.logoDepth !== undefined) setLogoDepth(step2.logoDepth);
        
        // Style reference
        if (step2.styleReferenceUrl) setStyleReferenceUrl(step2.styleReferenceUrl);
        
        // Material settings
        if (step2.materialPreset) setMaterialPreset(step2.materialPreset);
        if (step2.surfaceComplexity !== undefined) setSurfaceComplexity(step2.surfaceComplexity);
        if (step2.refractionEnabled !== undefined) setRefractionEnabled(step2.refractionEnabled);
        if (step2.heroFeature) setHeroFeature(step2.heroFeature);
        if (step2.originMetaphor) setOriginMetaphor(step2.originMetaphor);
        
        // Character toggle
        if (step2.characterMode) setIncludeHumanElement(true);
        
        console.log('[SocialCommerce] Restored step2Data:', {
          hasProductImages: !!step2.productImages,
          hasCharacter: !!step2.characterAssetId,
          hasBrandkit: !!step2.brandkitAssetId,
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
      
      // Store CDN URL directly (no temp storage)
      setProductImages(prev => ({ ...prev, [key]: data.cdnUrl }));

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

  const handleCharacterImageUpload = async (file: File) => {
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
      formData.append('characterName', characterName || 'Campaign Character');
      formData.append('characterDescription', characterDescription || '');

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
    setActiveStep(step);
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
        setActiveStep(steps[nextIndex]);
      } catch (error) {
        console.error('[SocialCommerce] Failed to save step 1:', error);
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
        
        const response = await fetch(`/api/social-commerce/videos/${videoId}/step/2/continue`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            // CDN URLs (already uploaded)
            heroProfileUrl: productImages.heroProfile,
            macroDetailUrl: productImages.macroDetail,
            materialReferenceUrl: productImages.materialReference,
            characterReferenceUrl,
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
            surfaceComplexity,
            refractionEnabled,
            heroFeature,
            originMetaphor,
            
            // Character settings
            includeHumanElement,
            characterMode,
            characterDescription,
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
        setActiveStep(steps[nextIndex]);
      } catch (error) {
        console.error('[SocialCommerce] Tab 2 error:', error);
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
    // OTHER STEPS: Just advance (TODO: Implement save logic for other steps)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Mark current step as completed when moving forward
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    
    setDirection(1);
    setActiveStep(steps[nextIndex]);
  };

  const handleBack = () => {
    const steps: CommerceStepId[] = ["setup", "script", "environment", "world", "storyboard", "animatic", "export"];
    const currentIndex = steps.indexOf(activeStep);
    const prevIndex = currentIndex - 1;
    
    if (prevIndex >= 0) {
      setDirection(-1);
      setActiveStep(steps[prevIndex]);
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

      // Clear all future step data
      const stepNumbers = [2, 3, 4, 5, 6];
      stepNumbers.forEach(num => {
        if (num > currentStepNumber) {
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
          setActiveStep(targetStep);
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
  if (isWorkspaceLoading || (!isNewVideo && isVideoLoading) || isCreating) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          {isCreating && (
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
      isNextDisabled={!canContinue || isCreating}
      nextLabel={isCreating && activeStep === "setup" ? "Running Agent 1.1..." : undefined}
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
              onProductImagesChange={setProductImages}
              onProductImageUpload={handleProductImageUpload}
              onMaterialPresetChange={setMaterialPreset}
              onObjectMassChange={setObjectMass}
              onSurfaceComplexityChange={setSurfaceComplexity}
              onRefractionEnabledChange={setRefractionEnabled}
              onLogoUrlChange={setLogoUrl}
              onLogoUpload={handleLogoUpload}
              onBrandPrimaryColorChange={setBrandPrimaryColor}
              onBrandSecondaryColorChange={setBrandSecondaryColor}
              onLogoIntegrityChange={setLogoIntegrity}
              onLogoDepthChange={setLogoDepth}
              onHeroFeatureChange={setHeroFeature}
              onOriginMetaphorChange={setOriginMetaphor}
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
              characterDescription={characterDescription}
              characterAIProfile={characterAIProfile}
              isGeneratingCharacter={isGeneratingCharacter}
              onCharacterAIProfileChange={setCharacterAIProfile}
              onIsGeneratingCharacterChange={setIsGeneratingCharacter}
              onEnvironmentConceptChange={setEnvironmentConcept}
              onCinematicLightingChange={setCinematicLighting}
              onAtmosphericDensityChange={setAtmosphericDensity}
              onStyleReferenceUrlChange={setStyleReferenceUrl}
              onVisualPresetChange={setVisualPreset}
              onCampaignSparkChange={setCampaignSpark}
              onVisualBeatsChange={setVisualBeats}
              onEnvironmentBrandPrimaryColorChange={setEnvironmentBrandPrimaryColor}
              onEnvironmentBrandSecondaryColorChange={setEnvironmentBrandSecondaryColor}
              onTargetAudienceChange={(value) => { setTargetAudience(value); markStepDirty('setup'); }}
              onCtaTextChange={setCtaText}
              onIncludeHumanElementChange={setIncludeHumanElement}
              onCharacterModeChange={setCharacterMode}
              onCharacterReferenceUrlChange={setCharacterReferenceUrl}
              onCharacterImageUpload={handleCharacterImageUpload}
              onCharacterDescriptionChange={setCharacterDescription}
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
