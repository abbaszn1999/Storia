import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductSetupTab } from "@/components/commerce/product-setup-tab";
import { HookFormatTab } from "@/components/commerce/hook-format-tab";
import { VisualStyleTab } from "@/components/commerce/visual-style-tab";
import { SceneContinuityTab } from "@/components/commerce/scene-continuity-tab";
import { ProductScriptEditor } from "@/components/social-commerce/product-script-editor";
import { ProductWorldCast } from "@/components/social-commerce/product-world-cast";
import { ProductBreakdown } from "@/components/social-commerce/product-breakdown";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import { AnimaticPreview } from "@/components/narrative/animatic-preview";
import { ExportSettings, type ExportData } from "@/components/narrative/export-settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

interface ProductSegment {
  id: string;
  type: "hook" | "intro" | "features" | "demo" | "cta";
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface ProductShot {
  id: string;
  segmentId: string;
  shotNumber: number;
  shotType: string;
  description: string;
  voiceoverText: string;
  duration: number;
}

interface ProductDetails {
  title: string;
  price: string;
  description: string;
  cta: string;
}

interface SocialCommerceWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  narrativeMode: "image-reference" | "start-end";
  script: string;
  aspectRatio: string;
  duration: string;
  voiceActorId: string | null;
  voiceOverEnabled: boolean;
  voiceOverConcept: string;
  voiceOverScript: string;
  videoConcept: string;
  productPhotos: string[];
  productDetails: ProductDetails;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  characters: Character[];
  referenceImages: ReferenceImage[];
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  worldSettings: { 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  };
  commerceSettings: {
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
  };
  // Campaign Configuration (Tab 1) props
  imageModel: string;
  imageResolution: string;
  videoModel: string;
  videoResolution: string;
  language: 'ar' | 'en';
  motionPrompt: string;
  imageInstructions: string;
  // Product DNA & Brand Identity (Tab 2) props
  productImages: {
    heroProfile: string | null;
    macroDetail: string | null;
    materialReference: string | null;
  };
  materialPreset: string;
  objectMass: number;
  surfaceComplexity: number;
  refractionEnabled: boolean;
  logoUrl: string | null;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  logoIntegrity: number;
  logoDepth: number;
  heroFeature: string;
  originMetaphor: string;
  // Environment & Story Beats (Tab 3) props
  environmentConcept: string;
  cinematicLighting: string;
  atmosphericDensity: number;
  styleReferenceUrl: string | null;
  visualPreset: string;
  campaignSpark: string;
  visualBeats: {
    beat1: string;
    beat2: string;
    beat3: string;
  };
  // Environment-specific brand colors
  environmentBrandPrimaryColor: string;
  environmentBrandSecondaryColor: string;
  // Campaign Intelligence (Tab 1 & 3)
  targetAudience: string;
  campaignObjective: string;
  ctaText: string;
  // Character DNA (Tab 2)
  includeHumanElement: boolean;
  characterMode: 'hand-model' | 'full-body' | 'silhouette' | null;
  characterReferenceUrl: string | null;
  characterAssetId: string | null;
  characterDescription: string;
  characterAIProfile: {
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
  } | null;
  isGeneratingCharacter: boolean;
  // Scene Manifest (Tab 4) props
  sceneManifest: {
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
        focusAnchor: string | null;
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
  };
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onDurationChange: (duration: string) => void;
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onVoiceOverConceptChange: (concept: string) => void;
  onVoiceOverScriptChange: (script: string) => void;
  onVideoConceptChange: (concept: string) => void;
  onProductPhotosChange: (photos: string[]) => void;
  onProductDetailsChange: (details: ProductDetails) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: ShotVersion[] }) => void;
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onContinuityLockedChange: (locked: boolean) => void;
  onContinuityGroupsChange: (groups: { [sceneId: string]: any[] }) => void;
  onWorldSettingsChange: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
    locations: Array<{ id: string; name: string; description: string }>;
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onCommerceSettingsChange: (settings: {
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
  }) => void;
  onImageModelChange: (model: string) => void;
  onImageResolutionChange: (resolution: string) => void;
  onVideoModelChange: (model: string) => void;
  onVideoResolutionChange: (resolution: string) => void;
  onLanguageChange: (lang: 'ar' | 'en') => void;
  onMotionPromptChange: (prompt: string) => void;
  onImageInstructionsChange: (instructions: string) => void;
  // Tab 2 handlers
  onProductImagesChange: (images: {
    heroView: string | null;
    reverseView: string | null;
    topView: string | null;
    baseView: string | null;
    sideProfiles: string | null;
    macroTexture: string | null;
  }) => void;
  onProductImageUpload?: (key: 'heroProfile' | 'macroDetail' | 'materialReference', file: File) => Promise<void>;
  onProductImageDelete?: (key: 'heroProfile' | 'macroDetail' | 'materialReference') => Promise<void>;
  onMaterialPresetChange: (preset: string) => void;
  onObjectMassChange: (mass: number) => void;
  onSurfaceComplexityChange: (complexity: number) => void;
  onRefractionEnabledChange: (enabled: boolean) => void;
  onLogoUrlChange: (url: string | null) => void;
  onLogoUpload?: (file: File) => Promise<void>;
  onLogoDelete?: () => Promise<void>;
  onBrandPrimaryColorChange: (color: string) => void;
  onBrandSecondaryColorChange: (color: string) => void;
  onLogoIntegrityChange: (integrity: number) => void;
  onLogoDepthChange: (depth: number) => void;
  onHeroFeatureChange: (feature: string) => void;
  onOriginMetaphorChange: (metaphor: string) => void;
  // Tab 3 handlers
  onEnvironmentConceptChange: (concept: string) => void;
  onCinematicLightingChange: (lighting: string) => void;
  onAtmosphericDensityChange: (density: number) => void;
  onStyleReferenceUrlChange: (url: string | null) => void;
  onVisualPresetChange: (preset: string) => void;
  onCampaignSparkChange: (spark: string) => void;
  onVisualBeatsChange: (beats: { beat1: string; beat2: string; beat3: string }) => void;
  onEnvironmentBrandPrimaryColorChange: (color: string) => void;
  onEnvironmentBrandSecondaryColorChange: (color: string) => void;
  // Campaign Intelligence handlers
  onTargetAudienceChange: (audience: string) => void;
  onCampaignObjectiveChange: (objective: string) => void;
  onCtaTextChange: (cta: string) => void;
  // Character DNA handlers
  onIncludeHumanElementChange: (include: boolean) => void;
  onCharacterModeChange: (mode: 'hand-model' | 'full-body' | 'silhouette' | null) => void;
  onCharacterReferenceUrlChange: (url: string | null) => void;
  onCharacterImageUpload?: (file: File, name?: string, description?: string) => Promise<void>;
  onCharacterDelete?: () => Promise<void>;
  onCharacterDescriptionChange: (description: string) => void;
  onCharacterNameChange?: (name: string) => void;
  onCharacterAssetIdChange?: (assetId: string | null) => void;
  onCharacterReferenceFileChange?: (file: File | null) => void;
  onCharacterAIProfileChange: (profile: {
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
  } | null) => void;
  onIsGeneratingCharacterChange: (generating: boolean) => void;
  // Shot Orchestrator handler
  onSceneManifestChange: (manifest: any) => void;
  onNext: () => void;
}

export function SocialCommerceWorkflow({
  activeStep,
  videoId,
  workspaceId,
  narrativeMode,
  script,
  aspectRatio,
  duration,
  voiceActorId,
  voiceOverEnabled,
  voiceOverConcept,
  voiceOverScript,
  videoConcept,
  productPhotos,
  productDetails,
  scenes,
  shots,
  shotVersions,
  characters,
  referenceImages,
  continuityLocked,
  continuityGroups,
  worldSettings,
  commerceSettings,
  imageModel,
  imageResolution,
  videoModel,
  videoResolution,
  language,
  motionPrompt,
  imageInstructions,
  productImages,
  materialPreset,
  objectMass,
  surfaceComplexity,
  refractionEnabled,
  logoUrl,
  brandPrimaryColor,
  brandSecondaryColor,
  logoIntegrity,
  logoDepth,
  heroFeature,
  originMetaphor,
  environmentConcept,
  cinematicLighting,
  atmosphericDensity,
  styleReferenceUrl,
  visualPreset,
  campaignSpark,
  visualBeats,
  environmentBrandPrimaryColor,
  environmentBrandSecondaryColor,
  targetAudience,
  campaignObjective,
  ctaText,
  includeHumanElement,
  characterMode,
  characterReferenceUrl,
  characterAssetId,
  characterDescription,
  characterAIProfile,
  isGeneratingCharacter,
  sceneManifest,
  onScriptChange,
  onAspectRatioChange,
  onDurationChange,
  onVoiceActorChange,
  onVoiceOverToggle,
  onVoiceOverConceptChange,
  onVoiceOverScriptChange,
  onVideoConceptChange,
  onProductPhotosChange,
  onProductDetailsChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onReferenceImagesChange,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onWorldSettingsChange,
  onCommerceSettingsChange,
  onImageModelChange,
  onImageResolutionChange,
  onVideoModelChange,
  onVideoResolutionChange,
  onLanguageChange,
  onMotionPromptChange,
  onImageInstructionsChange,
  onProductImagesChange,
  onProductImageUpload,
  onProductImageDelete,
  onMaterialPresetChange,
  onObjectMassChange,
  onSurfaceComplexityChange,
  onRefractionEnabledChange,
  onLogoUrlChange,
  onLogoUpload,
  onLogoDelete,
  onBrandPrimaryColorChange,
  onBrandSecondaryColorChange,
  onLogoIntegrityChange,
  onLogoDepthChange,
  onHeroFeatureChange,
  onOriginMetaphorChange,
  onEnvironmentConceptChange,
  onCinematicLightingChange,
  onAtmosphericDensityChange,
  onStyleReferenceUrlChange,
  onVisualPresetChange,
  onCampaignSparkChange,
  onVisualBeatsChange,
  onEnvironmentBrandPrimaryColorChange,
  onEnvironmentBrandSecondaryColorChange,
  onTargetAudienceChange,
  onCampaignObjectiveChange,
  onCtaTextChange,
  onIncludeHumanElementChange,
  onCharacterModeChange,
  onCharacterReferenceUrlChange,
  onCharacterImageUpload,
  onCharacterDelete,
  onCharacterDescriptionChange,
  onCharacterNameChange,
  onCharacterAssetIdChange,
  onCharacterReferenceFileChange,
  onCharacterAIProfileChange,
  onIsGeneratingCharacterChange,
  onSceneManifestChange,
  onNext,
}: SocialCommerceWorkflowProps) {
  const { toast } = useToast();
  
  const [voiceoverTextMap, setVoiceoverTextMap] = useState<{ [shotId: string]: string }>({});
  
  // Dialog state for manual scene/shot addition
  const [addSceneDialogOpen, setAddSceneDialogOpen] = useState(false);
  const [addShotDialogOpen, setAddShotDialogOpen] = useState(false);
  const [pendingSceneIndex, setPendingSceneIndex] = useState<number | null>(null);
  const [pendingSceneId, setPendingSceneId] = useState<string | null>(null);
  const [pendingShotIndex, setPendingShotIndex] = useState<number | null>(null);
  
  // Scene form state
  const [sceneFormData, setSceneFormData] = useState({
    scene_name: '',
    scene_description: '',
    actType: 'hook' as 'hook' | 'transformation' | 'payoff',
  });
  
  // Shot form state
  const [shotFormData, setShotFormData] = useState({
    cinematic_goal: '',
    brief_description: '',
    motion_intensity: 5,
    camera_movement: 'Static',
    lens: '85mm',
    framing: 'MED' as 'ECU' | 'CU' | 'MCU' | 'MED' | 'WIDE',
    shot_type: 'IMAGE_REF' as 'IMAGE_REF' | 'START_END',
    refer_to_product: true,
    product_image_ref: 'heroProfile' as 'heroProfile' | 'macroDetail' | 'materialReference',
    refer_to_character: false,
    refer_to_logo: false,
    depth_of_field: 'Medium',
    is_connected_to_previous: false,
    is_connected_to_next: false,
    handover_type: 'JUMP_CUT' as 'SEAMLESS_FLOW' | 'MATCH_CUT' | 'JUMP_CUT',
    composition_safe_zones: '',
    lighting_event: '',
  });
  
  const inferSegmentType = useCallback((title: string): ProductSegment["type"] => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("hook") || lowerTitle.includes("attention")) return "hook";
    if (lowerTitle.includes("intro")) return "intro";
    if (lowerTitle.includes("feature")) return "features";
    if (lowerTitle.includes("demo")) return "demo";
    if (lowerTitle.includes("cta") || lowerTitle.includes("action") || lowerTitle.includes("call")) return "cta";
    return "features";
  }, []);

  const productSegments: ProductSegment[] = useMemo(() => 
    scenes.map(scene => ({
      id: scene.id,
      type: inferSegmentType(scene.title),
      title: scene.title,
      description: scene.description || "",
      duration: scene.duration || 5,
      order: scene.sceneNumber,
    })),
    [scenes, inferSegmentType]
  );

  const productShots: { [segmentId: string]: ProductShot[] } = useMemo(() => 
    Object.fromEntries(
      Object.entries(shots).map(([sceneId, sceneShots]) => [
        sceneId,
        sceneShots.map(shot => ({
          id: shot.id,
          segmentId: shot.sceneId,
          shotNumber: shot.shotNumber,
          shotType: shot.shotType || "hero",
          description: shot.description || "",
          voiceoverText: voiceoverTextMap[shot.id] || "",
          duration: shot.duration || 3,
        }))
      ])
    ),
    [shots, voiceoverTextMap]
  );

  const handleSegmentsChange = (newSegments: ProductSegment[]) => {
    const existingScenesMap = new Map(scenes.map(s => [s.id, s]));
    
    const mappedScenes: Scene[] = newSegments.map(seg => {
      const existing = existingScenesMap.get(seg.id);
      
      if (existing) {
        return {
          ...existing,
          sceneNumber: seg.order,
          title: seg.title,
          description: seg.description,
          duration: seg.duration,
          updatedAt: new Date(),
        };
      }
      
      return {
        id: seg.id,
        videoId: videoId,
        sceneNumber: seg.order,
        title: seg.title,
        description: seg.description,
        duration: seg.duration,
        videoModel: null,
        imageModel: null,
        lighting: null,
        weather: null,
        createdAt: new Date(),
      } as Scene;
    });
    onScenesChange(mappedScenes);
  };

  const handleProductShotsChange = (newShots: { [segmentId: string]: ProductShot[] }) => {
    const existingShotsMap = new Map(
      Object.values(shots).flat().map(s => [s.id, s])
    );
    
    setVoiceoverTextMap(prev => {
      const updated = { ...prev };
      Object.values(newShots).flat().forEach(shot => {
        if (shot.voiceoverText) {
          updated[shot.id] = shot.voiceoverText;
        } else if (shot.id in updated) {
          delete updated[shot.id];
        }
      });
      return updated;
    });
    
    const mappedShots: { [sceneId: string]: Shot[] } = {};
    
    Object.entries(newShots).forEach(([segmentId, segShots]) => {
      mappedShots[segmentId] = segShots.map(shot => {
        const existing = existingShotsMap.get(shot.id);
        
        if (existing) {
          return {
            ...existing,
            sceneId: shot.segmentId,
            shotNumber: shot.shotNumber,
            shotType: shot.shotType,
            description: shot.description,
            duration: shot.duration,
            updatedAt: new Date(),
          };
        }
        
        return {
          id: shot.id,
          sceneId: shot.segmentId,
          shotNumber: shot.shotNumber,
          shotType: shot.shotType,
          description: shot.description,
          duration: shot.duration,
          cameraMovement: "static",
          transition: "cut",
          videoModel: null,
          imageModel: null,
          soundEffects: null,
          currentVersionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Shot;
      });
    });
    
    onShotsChange(mappedShots);
  };

  const handleExport = (data: ExportData) => {
    if (data.selectedPlatforms.length > 0) {
      const missingMetadata: string[] = [];
      
      if (data.selectedPlatforms.includes("youtube")) {
        const ytMeta = data.platformMetadata.youtube;
        if (!ytMeta || !ytMeta.title || !ytMeta.description || !ytMeta.tags) {
          missingMetadata.push("YouTube (title, description, and tags required)");
        }
      }
      
      const socialPlatforms = data.selectedPlatforms.filter((p: string) => p !== "youtube");
      if (socialPlatforms.length > 0) {
        const socialMeta = data.platformMetadata.social;
        if (!socialMeta || !socialMeta.caption) {
          missingMetadata.push("Social Media (caption required)");
        }
      }
      
      if (missingMetadata.length > 0) {
        toast({
          title: "Missing platform metadata",
          description: `Please fill in the metadata for: ${missingMetadata.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (data.selectedPlatforms.length > 0 && data.publishType === "schedule") {
      if (!data.scheduleDate || !data.scheduleTime) {
        toast({
          title: "Missing schedule information",
          description: "Please select both date and time for scheduled publishing.",
          variant: "destructive",
        });
        return;
      }
    }

    if (data.selectedPlatforms.length === 0) {
      toast({
        title: "Export started!",
        description: `Your video is being exported in ${data.resolution}. You'll be notified when it's ready.`,
      });
    } else if (data.publishType === "instant") {
      const platformNames = data.selectedPlatforms.join(", ");
      toast({
        title: "Export & Publishing!",
        description: `Your video is being exported and will be published to ${platformNames}.`,
      });
    } else {
      const platformNames = data.selectedPlatforms.join(", ");
      const scheduleDateTime = `${data.scheduleDate} at ${data.scheduleTime}`;
      toast({
        title: "Export & Scheduled!",
        description: `Your video will be exported and published to ${platformNames} on ${scheduleDateTime}.`,
      });
    }

    console.log("Export data:", data);
  };

  const handleGenerateShot = (shotId: string) => {
    console.log("Generating shot:", shotId);
  };

  const handleRegenerateShot = (shotId: string) => {
    console.log("Regenerating shot:", shotId);
  };

  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    onShotsChange(
      Object.fromEntries(
        Object.entries(shots).map(([sceneId, sceneShots]) => [
          sceneId,
          sceneShots.map((shot) =>
            shot.id === shotId ? { ...shot, ...updates } : shot
          ),
        ])
      )
    );
  };

  const handleUpdateShotVersion = (shotId: string, versionId: string, updates: Partial<ShotVersion>) => {
    onShotVersionsChange(
      Object.fromEntries(
        Object.entries(shotVersions).map(([sid, versions]) => [
          sid,
          versions.map((version) =>
            version.id === versionId && sid === shotId
              ? { ...version, ...updates }
              : version
          ),
        ])
      )
    );
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    onScenesChange(
      scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
    );
  };

  const handleUploadShotReference = (shotId: string, file: File) => {
    const tempUrl = URL.createObjectURL(file);
    
    const existingRef = referenceImages.find(
      (ref) => ref.shotId === shotId && ref.type === "shot_reference"
    );

    if (existingRef) {
      onReferenceImagesChange(
        referenceImages.map((ref) =>
          ref.shotId === shotId && ref.type === "shot_reference"
            ? { ...ref, imageUrl: tempUrl }
            : ref
        )
      );
    } else {
      const newRef: ReferenceImage = {
        id: `ref-${Date.now()}`,
        videoId: videoId,
        shotId: shotId,
        characterId: null,
        type: "shot_reference",
        imageUrl: tempUrl,
        description: null,
        createdAt: new Date(),
      };
      onReferenceImagesChange([...referenceImages, newRef]);
    }
  };

  const handleDeleteShotReference = (shotId: string) => {
    onReferenceImagesChange(
      referenceImages.filter(
        (ref) => !(ref.shotId === shotId && ref.type === "shot_reference")
      )
    );
  };

  const handleReorderShots = (sceneId: string, shotIds: string[]) => {
    const sceneShots = shots[sceneId] || [];
    const reorderedShots = shotIds.map(id => sceneShots.find(s => s.id === id)).filter(Boolean) as Shot[];
    
    onShotsChange({
      ...shots,
      [sceneId]: reorderedShots,
    });
  };

  const handleSelectVersion = (shotId: string, versionId: string) => {
    handleUpdateShot(shotId, { currentVersionId: versionId });
  };

  const handleDeleteVersion = (shotId: string, versionId: string) => {
    const versions = shotVersions[shotId] || [];
    const filteredVersions = versions.filter(v => v.id !== versionId);
    
    onShotVersionsChange({
      ...shotVersions,
      [shotId]: filteredVersions,
    });
  };

  // Helper: Convert manual scene to SceneDefinition format
  const convertManualSceneToDefinition = (sceneData: typeof sceneFormData, sceneId: string, sceneIndex: number) => {
    return {
      scene_id: sceneId,
      scene_name: sceneData.scene_name,
      scene_description: sceneData.scene_description,
      shots: [] as any[], // Will be populated when shots are added
    };
  };

  // Helper: Convert manual shot to ShotDefinition format
  const convertManualShotToDefinition = (shotData: typeof shotFormData, shotId: string, sceneId: string, shotIndex: number) => {
    return {
      shot_id: shotId,
      cinematic_goal: shotData.cinematic_goal,
      brief_description: shotData.brief_description,
      technical_cinematography: {
        camera_movement: shotData.camera_movement,
        lens: shotData.lens,
        depth_of_field: shotData.depth_of_field,
        framing: shotData.framing,
        motion_intensity: shotData.motion_intensity,
      },
      generation_mode: {
        shot_type: shotData.shot_type,
        reason: `Manual shot added by user`,
      },
      identity_references: {
        refer_to_product: shotData.refer_to_product,
        product_image_ref: shotData.refer_to_product ? shotData.product_image_ref : undefined,
        refer_to_character: shotData.refer_to_character,
        refer_to_logo: shotData.refer_to_logo,
        refer_to_previous_outputs: [],
      },
      continuity_logic: {
        is_connected_to_previous: shotData.is_connected_to_previous,
        is_connected_to_next: shotData.is_connected_to_next,
        handover_type: shotData.handover_type,
      },
      composition_safe_zones: shotData.composition_safe_zones || 'Center safe zone',
      lighting_event: shotData.lighting_event || 'Natural lighting',
    };
  };

  // Helper: Merge manual scene into sceneManifest
  const mergeSceneIntoManifest = (sceneDef: any, sceneIndex: number, actType: 'hook' | 'transformation' | 'payoff') => {
    const updatedManifest = { ...sceneManifest };
    const newScene = {
      id: sceneDef.scene_id,
      name: sceneDef.scene_name,
      description: sceneDef.scene_description,
      duration: 0, // Will be calculated from shots
      actType,
      shots: [], // Shots will be added separately
    };
    
    updatedManifest.scenes.splice(sceneIndex, 0, newScene);
    onSceneManifestChange(updatedManifest);
  };

  const handleAddScene = (afterSceneIndex: number) => {
    // Reset form
    setSceneFormData({
      scene_name: '',
      scene_description: '',
      actType: afterSceneIndex === 0 ? 'hook' : afterSceneIndex === 1 ? 'transformation' : 'payoff',
    });
    setPendingSceneIndex(afterSceneIndex);
    setAddSceneDialogOpen(true);
  };

  const handleConfirmAddScene = () => {
    if (!sceneFormData.scene_name.trim() || !sceneFormData.scene_description.trim()) {
      toast({
        title: "Validation Error",
        description: "Scene name and description are required",
        variant: "destructive",
      });
      return;
    }

    if (pendingSceneIndex === null) return;

    const newSceneId = `SC${Date.now()}`;
    const sceneDef = convertManualSceneToDefinition(sceneFormData, newSceneId, pendingSceneIndex);
    
    // Add to sceneManifest
    mergeSceneIntoManifest(sceneDef, pendingSceneIndex + 1, sceneFormData.actType);

    // Also add to scenes/shots for StoryboardEditor
    const newScene: Scene = {
      id: newSceneId,
      videoId: videoId,
      sceneNumber: pendingSceneIndex + 2,
      title: sceneFormData.scene_name,
      description: sceneFormData.scene_description,
      lighting: null,
      weather: null,
      imageModel: null,
      videoModel: null,
      duration: null,
      createdAt: new Date(),
    };

    const newScenes = [...scenes];
    newScenes.splice(pendingSceneIndex + 1, 0, newScene);
    
    const updatedScenes = newScenes.map((scene, idx) => ({
      ...scene,
      sceneNumber: idx + 1,
    }));

    onScenesChange(updatedScenes);

    setAddSceneDialogOpen(false);
    setPendingSceneIndex(null);
    
    toast({
      title: "Scene Added",
      description: `Scene "${sceneFormData.scene_name}" has been added`,
    });
  };

  const handleAddShot = (sceneId: string, afterShotIndex: number) => {
    // Reset form with defaults
    setShotFormData({
      cinematic_goal: '',
      brief_description: '',
      motion_intensity: 5,
      camera_movement: 'Static',
      lens: '85mm',
      framing: 'MED',
      shot_type: 'IMAGE_REF',
      refer_to_product: true,
      product_image_ref: 'heroProfile',
      refer_to_character: false,
      refer_to_logo: false,
      depth_of_field: 'Medium',
      is_connected_to_previous: false,
      is_connected_to_next: false,
      handover_type: 'JUMP_CUT',
      composition_safe_zones: '',
      lighting_event: '',
    });
    setPendingSceneId(sceneId);
    setPendingShotIndex(afterShotIndex);
    setAddShotDialogOpen(true);
  };

  const handleConfirmAddShot = () => {
    if (!shotFormData.cinematic_goal.trim() || !shotFormData.brief_description.trim()) {
      toast({
        title: "Validation Error",
        description: "Cinematic goal and description are required",
        variant: "destructive",
      });
      return;
    }

    if (pendingSceneId === null || pendingShotIndex === null) return;

    // Find scene in sceneManifest
    const sceneIndex = sceneManifest.scenes.findIndex(s => s.id === pendingSceneId);
    if (sceneIndex === -1) {
      toast({
        title: "Error",
        description: "Scene not found",
        variant: "destructive",
      });
      return;
    }

    // Generate unique shot ID (format: S{sceneNum}.{shotNum})
    // Scene number is 1-indexed based on position in scenes array
    const sceneNum = sceneIndex + 1;
    // Shot number is the position after insertion (pendingShotIndex + 2, since we insert after pendingShotIndex)
    const shotNum = pendingShotIndex + 2;
    const shotId = `S${sceneNum}.${shotNum}`;
    const shotDef = convertManualShotToDefinition(shotFormData, shotId, pendingSceneId, pendingShotIndex);

    // Update sceneManifest
    const updatedManifest = { ...sceneManifest };
    const scene = updatedManifest.scenes[sceneIndex];
    
    // Add shot to scene definition
    const shotInManifest = {
      id: shotId,
      sceneId: pendingSceneId,
      name: `${shotId}: ${shotFormData.cinematic_goal}`,
      description: shotFormData.brief_description,
      duration: 5.0, // Default, will be updated by timing
      shotType: shotFormData.shot_type === 'IMAGE_REF' ? 'image-ref' : 'start-end',
      cameraPath: shotFormData.camera_movement.toLowerCase().includes('orbit') ? 'orbit' :
                 shotFormData.camera_movement.toLowerCase().includes('pan') ? 'pan' :
                 shotFormData.camera_movement.toLowerCase().includes('zoom') ? 'zoom' :
                 shotFormData.camera_movement.toLowerCase().includes('dolly') ? 'dolly' : 'static',
      lens: shotFormData.lens.toLowerCase().includes('macro') ? 'macro' :
            shotFormData.lens.toLowerCase().includes('wide') ? 'wide' :
            shotFormData.lens.toLowerCase().includes('85') ? '85mm' : 'telephoto',
      referenceTags: [
        ...(shotFormData.refer_to_product ? [
          shotFormData.product_image_ref === 'macroDetail' ? '@Product_Macro' :
          shotFormData.product_image_ref === 'materialReference' ? '@Texture' : '@Product'
        ] : []),
        ...(shotFormData.refer_to_character ? ['@Character'] : []),
        ...(shotFormData.refer_to_logo ? ['@Logo'] : []),
      ],
      previousShotReferences: [],
      isLinkedToPrevious: shotFormData.is_connected_to_previous,
      speedProfile: 'linear' as const,
      multiplier: 1.0,
      sfxHint: '',
    };

    scene.shots.splice(pendingShotIndex + 1, 0, shotInManifest);
    scene.duration = scene.shots.reduce((sum, s) => sum + s.duration, 0);
    
    onSceneManifestChange(updatedManifest);

    // Also add to shots for StoryboardEditor
    const sceneShots = shots[pendingSceneId] || [];
    const newShot: Shot = {
      id: shotId,
      sceneId: pendingSceneId,
      shotNumber: pendingShotIndex + 2,
      description: shotFormData.brief_description,
      cameraMovement: shotFormData.camera_movement,
      shotType: shotFormData.framing,
      soundEffects: null,
      duration: 5.0,
      transition: "cut",
      imageModel: null,
      videoModel: null,
      currentVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newShots = [...sceneShots];
    newShots.splice(pendingShotIndex + 1, 0, newShot);

    const updatedShots = newShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1,
    }));

    onShotsChange({
      ...shots,
      [pendingSceneId]: updatedShots,
    });

    setAddShotDialogOpen(false);
    setPendingSceneId(null);
    setPendingShotIndex(null);
    
    toast({
      title: "Shot Added",
      description: `Shot "${shotFormData.cinematic_goal}" has been added`,
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    const updatedScenes = scenes
      .filter(scene => scene.id !== sceneId)
      .map((scene, idx) => ({
        ...scene,
        sceneNumber: idx + 1,
      }));
    
    onScenesChange(updatedScenes);
    
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onShotsChange(updatedShots);
    
    const sceneShots = shots[sceneId] || [];
    const updatedShotVersions = { ...shotVersions };
    sceneShots.forEach(shot => {
      delete updatedShotVersions[shot.id];
    });
    onShotVersionsChange(updatedShotVersions);
    
    const shotIds = sceneShots.map(s => s.id);
    onReferenceImagesChange(
      referenceImages.filter(ref => !shotIds.includes(ref.shotId || ''))
    );
  };

  const handleDeleteShot = (shotId: string) => {
    const sceneId = Object.keys(shots).find(sId => 
      shots[sId]?.some(shot => shot.id === shotId)
    );
    
    if (!sceneId) return;
    
    const sceneShots = shots[sceneId] || [];
    
    const updatedShots = sceneShots
      .filter(shot => shot.id !== shotId)
      .map((shot, idx) => ({
        ...shot,
        shotNumber: idx + 1,
      }));
    
    onShotsChange({
      ...shots,
      [sceneId]: updatedShots,
    });
    
    const updatedShotVersions = { ...shotVersions };
    delete updatedShotVersions[shotId];
    onShotVersionsChange(updatedShotVersions);
    
    onReferenceImagesChange(
      referenceImages.filter(ref => ref.shotId !== shotId)
    );
  };

  return (
    <div>
      {/* Add Scene Dialog */}
      <Dialog open={addSceneDialogOpen} onOpenChange={setAddSceneDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Scene</DialogTitle>
            <DialogDescription>
              Create a new scene with all required information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scene_name">Scene Name *</Label>
              <Input
                id="scene_name"
                value={sceneFormData.scene_name}
                onChange={(e) => setSceneFormData({ ...sceneFormData, scene_name: e.target.value })}
                placeholder="e.g., The Ignition"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scene_description">Scene Description *</Label>
              <Textarea
                id="scene_description"
                value={sceneFormData.scene_description}
                onChange={(e) => setSceneFormData({ ...sceneFormData, scene_description: e.target.value })}
                placeholder="Describe what happens in this scene..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actType">Act Type *</Label>
              <Select
                value={sceneFormData.actType}
                onValueChange={(value: 'hook' | 'transformation' | 'payoff') => 
                  setSceneFormData({ ...sceneFormData, actType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hook">Hook (Act 1)</SelectItem>
                  <SelectItem value="transformation">Transformation (Act 2)</SelectItem>
                  <SelectItem value="payoff">Payoff (Act 3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSceneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddScene}>
              Add Scene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shot Dialog */}
      <Dialog open={addShotDialogOpen} onOpenChange={setAddShotDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Shot</DialogTitle>
            <DialogDescription>
              Create a new shot with all required cinematography details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cinematic_goal">Cinematic Goal *</Label>
                <Input
                  id="cinematic_goal"
                  value={shotFormData.cinematic_goal}
                  onChange={(e) => setShotFormData({ ...shotFormData, cinematic_goal: e.target.value })}
                  placeholder="e.g., Capture attention with mysterious reveal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motion_intensity">Motion Intensity *</Label>
                <Input
                  id="motion_intensity"
                  type="number"
                  min="1"
                  max="10"
                  value={shotFormData.motion_intensity}
                  onChange={(e) => setShotFormData({ ...shotFormData, motion_intensity: parseInt(e.target.value) || 5 })}
                />
                <p className="text-xs text-muted-foreground">1 (slow) to 10 (fast)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief_description">Shot Description *</Label>
              <Textarea
                id="brief_description"
                value={shotFormData.brief_description}
                onChange={(e) => setShotFormData({ ...shotFormData, brief_description: e.target.value })}
                placeholder="Describe the shot in detail..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="camera_movement">Camera Movement *</Label>
                <Select
                  value={shotFormData.camera_movement}
                  onValueChange={(value) => setShotFormData({ ...shotFormData, camera_movement: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Static">Static</SelectItem>
                    <SelectItem value="Dolly-in">Dolly-in</SelectItem>
                    <SelectItem value="Dolly-out">Dolly-out</SelectItem>
                    <SelectItem value="Orbital">Orbital</SelectItem>
                    <SelectItem value="Pan">Pan</SelectItem>
                    <SelectItem value="Tilt">Tilt</SelectItem>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lens">Lens *</Label>
                <Select
                  value={shotFormData.lens}
                  onValueChange={(value) => setShotFormData({ ...shotFormData, lens: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macro">Macro</SelectItem>
                    <SelectItem value="85mm">85mm</SelectItem>
                    <SelectItem value="50mm">50mm</SelectItem>
                    <SelectItem value="Wide">Wide</SelectItem>
                    <SelectItem value="Telephoto">Telephoto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="framing">Framing *</Label>
                <Select
                  value={shotFormData.framing}
                  onValueChange={(value: 'ECU' | 'CU' | 'MCU' | 'MED' | 'WIDE') => 
                    setShotFormData({ ...shotFormData, framing: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECU">ECU (Extreme Close-Up)</SelectItem>
                    <SelectItem value="CU">CU (Close-Up)</SelectItem>
                    <SelectItem value="MCU">MCU (Medium Close-Up)</SelectItem>
                    <SelectItem value="MED">MED (Medium)</SelectItem>
                    <SelectItem value="WIDE">WIDE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shot_type">Shot Type *</Label>
                <Select
                  value={shotFormData.shot_type}
                  onValueChange={(value: 'IMAGE_REF' | 'START_END') => 
                    setShotFormData({ ...shotFormData, shot_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE_REF">Single Image (IMAGE_REF)</SelectItem>
                    <SelectItem value="START_END">Start/End Frame (START_END)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Identity References</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shotFormData.refer_to_product}
                    onCheckedChange={(checked) => setShotFormData({ ...shotFormData, refer_to_product: checked })}
                  />
                  <Label>Include Product</Label>
                </div>
                {shotFormData.refer_to_product && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="product_image_ref">Product Image Reference</Label>
                    <Select
                      value={shotFormData.product_image_ref}
                      onValueChange={(value: 'heroProfile' | 'macroDetail' | 'materialReference') => 
                        setShotFormData({ ...shotFormData, product_image_ref: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heroProfile">Hero Profile</SelectItem>
                        <SelectItem value="macroDetail">Macro Detail</SelectItem>
                        <SelectItem value="materialReference">Material Reference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shotFormData.refer_to_character}
                    onCheckedChange={(checked) => setShotFormData({ ...shotFormData, refer_to_character: checked })}
                  />
                  <Label>Include Character</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shotFormData.refer_to_logo}
                    onCheckedChange={(checked) => setShotFormData({ ...shotFormData, refer_to_logo: checked })}
                  />
                  <Label>Include Logo</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depth_of_field">Depth of Field</Label>
                <Select
                  value={shotFormData.depth_of_field}
                  onValueChange={(value) => setShotFormData({ ...shotFormData, depth_of_field: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ultra-shallow">Ultra-shallow</SelectItem>
                    <SelectItem value="Shallow">Shallow</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Deep">Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="handover_type">Handover Type</Label>
                <Select
                  value={shotFormData.handover_type}
                  onValueChange={(value: 'SEAMLESS_FLOW' | 'MATCH_CUT' | 'JUMP_CUT') => 
                    setShotFormData({ ...shotFormData, handover_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEAMLESS_FLOW">Seamless Flow</SelectItem>
                    <SelectItem value="MATCH_CUT">Match Cut</SelectItem>
                    <SelectItem value="JUMP_CUT">Jump Cut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Continuity</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shotFormData.is_connected_to_previous}
                    onCheckedChange={(checked) => setShotFormData({ ...shotFormData, is_connected_to_previous: checked })}
                  />
                  <Label>Connected to Previous</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={shotFormData.is_connected_to_next}
                    onCheckedChange={(checked) => setShotFormData({ ...shotFormData, is_connected_to_next: checked })}
                  />
                  <Label>Connected to Next</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="composition_safe_zones">Composition Safe Zones</Label>
                <Input
                  id="composition_safe_zones"
                  value={shotFormData.composition_safe_zones}
                  onChange={(e) => setShotFormData({ ...shotFormData, composition_safe_zones: e.target.value })}
                  placeholder="e.g., Center safe zone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lighting_event">Lighting Event</Label>
                <Input
                  id="lighting_event"
                  value={shotFormData.lighting_event}
                  onChange={(e) => setShotFormData({ ...shotFormData, lighting_event: e.target.value })}
                  placeholder="e.g., Natural lighting"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddShotDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddShot}>
              Add Shot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {activeStep === "script" && (
        <ProductSetupTab
          imageModel={imageModel}
          imageResolution={imageResolution}
          videoModel={videoModel}
          videoResolution={videoResolution}
          aspectRatio={aspectRatio}
          duration={parseInt(duration) || 30}
          voiceOverEnabled={voiceOverEnabled}
          language={language}
          motionPrompt={motionPrompt}
          targetAudience={targetAudience}
          onImageModelChange={onImageModelChange}
          onImageResolutionChange={onImageResolutionChange}
          onVideoModelChange={onVideoModelChange}
          onVideoResolutionChange={onVideoResolutionChange}
          onAspectRatioChange={onAspectRatioChange}
          onDurationChange={(dur) => onDurationChange(dur.toString())}
          onVoiceOverToggle={onVoiceOverToggle}
          onLanguageChange={onLanguageChange}
          onMotionPromptChange={onMotionPromptChange}
          onImageInstructionsChange={onImageInstructionsChange}
          imageInstructions={imageInstructions}
          onTargetAudienceChange={onTargetAudienceChange}
          onNext={onNext}
        />
      )}

      {activeStep === "product-dna" && (
        <HookFormatTab
          workspaceId={workspaceId}
          videoId={videoId}
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
          includeHumanElement={includeHumanElement}
          characterMode={characterMode}
          characterReferenceUrl={characterReferenceUrl}
          characterAssetId={characterAssetId}
          characterDescription={characterDescription}
          characterAIProfile={characterAIProfile}
          isGeneratingCharacter={isGeneratingCharacter}
          targetAudience={targetAudience}
          onProductImagesChange={onProductImagesChange}
          onProductImageUpload={onProductImageUpload}
          onProductImageDelete={onProductImageDelete}
          onMaterialPresetChange={onMaterialPresetChange}
          onObjectMassChange={onObjectMassChange}
          onSurfaceComplexityChange={onSurfaceComplexityChange}
          onRefractionEnabledChange={onRefractionEnabledChange}
          onLogoUrlChange={onLogoUrlChange}
          onLogoUpload={onLogoUpload}
          onLogoDelete={onLogoDelete}
          onBrandPrimaryColorChange={onBrandPrimaryColorChange}
          onBrandSecondaryColorChange={onBrandSecondaryColorChange}
          onLogoIntegrityChange={onLogoIntegrityChange}
          onLogoDepthChange={onLogoDepthChange}
          onHeroFeatureChange={onHeroFeatureChange}
          onOriginMetaphorChange={onOriginMetaphorChange}
          onIncludeHumanElementChange={onIncludeHumanElementChange}
          onCharacterModeChange={onCharacterModeChange}
          onCharacterReferenceUrlChange={onCharacterReferenceUrlChange}
          onCharacterImageUpload={onCharacterImageUpload}
          onCharacterDelete={onCharacterDelete}
          onCharacterDescriptionChange={onCharacterDescriptionChange}
          onCharacterNameChange={onCharacterNameChange}
          onCharacterAssetIdChange={onCharacterAssetIdChange}
          onCharacterReferenceFileChange={onCharacterReferenceFileChange}
          onCharacterAIProfileChange={onCharacterAIProfileChange}
          onIsGeneratingCharacterChange={onIsGeneratingCharacterChange}
          onNext={onNext}
        />
      )}

      {activeStep === "environment-story" && (
        <VisualStyleTab
          workspaceId={workspaceId}
          videoId={videoId}
          environmentConcept={environmentConcept}
          cinematicLighting={cinematicLighting}
          atmosphericDensity={atmosphericDensity}
          styleReferenceUrl={styleReferenceUrl}
          visualPreset={visualPreset}
          campaignSpark={campaignSpark}
          visualBeats={visualBeats}
          brandPrimaryColor={brandPrimaryColor}
          brandSecondaryColor={brandSecondaryColor}
          environmentBrandPrimaryColor={environmentBrandPrimaryColor}
          environmentBrandSecondaryColor={environmentBrandSecondaryColor}
          campaignObjective={campaignObjective}
          ctaText={ctaText}
          onEnvironmentConceptChange={onEnvironmentConceptChange}
          onCinematicLightingChange={onCinematicLightingChange}
          onAtmosphericDensityChange={onAtmosphericDensityChange}
          onStyleReferenceUrlChange={onStyleReferenceUrlChange}
          onVisualPresetChange={onVisualPresetChange}
          onCampaignSparkChange={onCampaignSparkChange}
          onVisualBeatsChange={onVisualBeatsChange}
          onEnvironmentBrandPrimaryColorChange={onEnvironmentBrandPrimaryColorChange}
          onEnvironmentBrandSecondaryColorChange={onEnvironmentBrandSecondaryColorChange}
          onCampaignObjectiveChange={onCampaignObjectiveChange}
          onCtaTextChange={onCtaTextChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <ProductBreakdown
          videoId={videoId}
          narrativeMode={narrativeMode}
          script={script}
          voiceOverScript={voiceOverScript}
          videoConcept={videoConcept}
          productDisplay={commerceSettings.productDisplay}
          productName={productDetails.title}
          segments={productSegments}
          shots={productShots}
          onSegmentsChange={handleSegmentsChange}
          onShotsChange={handleProductShotsChange}
          onContinuityGroupsChange={onContinuityGroupsChange}
          onContinuityLockedChange={onContinuityLockedChange}
          onNext={onNext}
        />
      )}

      {activeStep === "world" && (
        <SceneContinuityTab
          workspaceId={workspaceId}
          visualBeats={visualBeats}
          sceneManifest={sceneManifest}
          onSceneManifestChange={onSceneManifestChange}
          heroFeature={heroFeature}
          logoUrl={logoUrl}
          styleReferenceUrl={styleReferenceUrl}
          onNext={onNext}
        />
      )}

      {activeStep === "storyboard" && (
        <StoryboardEditor
          videoId={videoId}
          narrativeMode={narrativeMode}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          referenceImages={referenceImages}
          characters={characters}
          voiceActorId={voiceActorId}
          voiceOverEnabled={voiceOverEnabled}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          isCommerceMode={true}
          onVoiceActorChange={onVoiceActorChange}
          onVoiceOverToggle={onVoiceOverToggle}
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
          onNext={onNext}
        />
      )}

      {activeStep === "animatic" && (
        <AnimaticPreview 
          script={script}
          scenes={scenes}
          shots={shots}
          onNext={onNext} 
        />
      )}

      {activeStep === "export" && (
        <ExportSettings onExport={handleExport} />
      )}
    </div>
  );
}
