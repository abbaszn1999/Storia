import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductScriptEditor } from "@/components/social-commerce/product-script-editor";
import { ProductWorldCast } from "@/components/social-commerce/product-world-cast";
import { ProductBreakdown } from "@/components/social-commerce/product-breakdown";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import { AnimaticPreview } from "@/components/narrative/animatic-preview";
import { ExportSettings, type ExportData } from "@/components/narrative/export-settings";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, Character, ReferenceImage } from "@shared/schema";

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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        <ProductScriptEditor
          productPhotos={productPhotos}
          productDetails={productDetails}
          aspectRatio={aspectRatio}
          duration={duration}
          voiceOverEnabled={voiceOverEnabled}
          voiceActorId={voiceActorId}
          voiceOverConcept={voiceOverConcept}
          voiceOverScript={voiceOverScript}
          videoConcept={videoConcept}
          generatedScript={script}
          onProductPhotosChange={onProductPhotosChange}
          onProductDetailsChange={onProductDetailsChange}
          onAspectRatioChange={onAspectRatioChange}
          onDurationChange={onDurationChange}
          onVoiceOverToggle={onVoiceOverToggle}
          onVoiceActorChange={onVoiceActorChange}
          onVoiceOverConceptChange={onVoiceOverConceptChange}
          onVoiceOverScriptChange={onVoiceOverScriptChange}
          onVideoConceptChange={onVideoConceptChange}
          onScriptChange={onScriptChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <ProductBreakdown
          videoId={videoId}
          script={script}
          voiceOverScript={voiceOverScript}
          videoConcept={videoConcept}
          productDisplay={commerceSettings.productDisplay}
          productName={productDetails.title}
          segments={productSegments}
          shots={productShots}
          onSegmentsChange={handleSegmentsChange}
          onShotsChange={handleProductShotsChange}
          onNext={onNext}
        />
      )}

      {activeStep === "world" && (
        <ProductWorldCast
          videoId={videoId}
          workspaceId={workspaceId}
          productPhotos={productPhotos}
          visualStyle={commerceSettings.visualStyle}
          backdrop={commerceSettings.backdrop}
          productDisplay={commerceSettings.productDisplay}
          talentType={commerceSettings.talentType}
          talents={commerceSettings.talents}
          styleReference={commerceSettings.styleReference}
          imageModel={commerceSettings.imageModel}
          imageInstructions={commerceSettings.imageInstructions}
          videoInstructions={commerceSettings.videoInstructions}
          onVisualStyleChange={(style) => onCommerceSettingsChange({ ...commerceSettings, visualStyle: style })}
          onBackdropChange={(backdrop) => onCommerceSettingsChange({ ...commerceSettings, backdrop })}
          onProductDisplayChange={(displays) => onCommerceSettingsChange({ ...commerceSettings, productDisplay: displays })}
          onTalentTypeChange={(type) => onCommerceSettingsChange({ ...commerceSettings, talentType: type })}
          onTalentsChange={(talents) => onCommerceSettingsChange({ ...commerceSettings, talents })}
          onStyleReferenceChange={(ref) => onCommerceSettingsChange({ ...commerceSettings, styleReference: ref })}
          onImageModelChange={(model) => onCommerceSettingsChange({ ...commerceSettings, imageModel: model })}
          onImageInstructionsChange={(instructions) => onCommerceSettingsChange({ ...commerceSettings, imageInstructions: instructions })}
          onVideoInstructionsChange={(instructions) => onCommerceSettingsChange({ ...commerceSettings, videoInstructions: instructions })}
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
