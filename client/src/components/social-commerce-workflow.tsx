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
        isLinkedToPrevious: boolean;
      }>;
    }>;
    continuityLinksEstablished: boolean;
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

  const handleAddScene = (afterSceneIndex: number) => {
    const newSceneId = `scene-${Date.now()}`;
    const newScene: Scene = {
      id: newSceneId,
      videoId: videoId,
      sceneNumber: afterSceneIndex + 2,
      title: `New Scene ${afterSceneIndex + 2}`,
      description: "Describe what happens in this scene",
      lighting: null,
      weather: null,
      imageModel: null,
      videoModel: null,
      duration: null,
      createdAt: new Date(),
    };

    const newScenes = [...scenes];
    newScenes.splice(afterSceneIndex + 1, 0, newScene);
    
    const updatedScenes = newScenes.map((scene, idx) => ({
      ...scene,
      sceneNumber: idx + 1,
    }));

    onScenesChange(updatedScenes);

    const initialShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: newSceneId,
      shotNumber: 1,
      description: "Shot description",
      cameraMovement: "Static",
      shotType: "Medium",
      soundEffects: null,
      duration: 3,
      transition: "cut",
      imageModel: null,
      videoModel: null,
      currentVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onShotsChange({
      ...shots,
      [newSceneId]: [initialShot],
    });
  };

  const handleAddShot = (sceneId: string, afterShotIndex: number) => {
    const sceneShots = shots[sceneId] || [];
    const newShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: sceneId,
      shotNumber: afterShotIndex + 2,
      description: "New shot description",
      cameraMovement: "Static",
      shotType: "Medium",
      soundEffects: null,
      duration: 3,
      transition: "cut",
      imageModel: null,
      videoModel: null,
      currentVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newShots = [...sceneShots];
    newShots.splice(afterShotIndex + 1, 0, newShot);

    const updatedShots = newShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1,
    }));

    onShotsChange({
      ...shots,
      [sceneId]: updatedShots,
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
