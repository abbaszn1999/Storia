import { SceneBreakdown } from "@/components/narrative/scene-breakdown";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import { AnimaticPreview } from "@/components/narrative/animatic-preview";
import { ExportSettings, type ExportData } from "@/components/narrative/export-settings";
import { LogoScriptEditor } from "@/components/logo-animation/logo-script-editor";
import { LogoWorldSettings } from "@/components/logo-animation/logo-world-settings";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

interface LogoNarrativeWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  narrativeMode: "start-end";
  logoFile: File | null;
  logoPreviewUrl: string | null;
  aspectRatio: string;
  duration: string;
  videoIdea: string;
  storyConcept: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  referenceImages: ReferenceImage[];
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  worldSettings: {
    imageModel: string;
    styleReference: string | null;
    worldDescription: string;
    artStyle: string;
    imageInstructions: string;
    videoInstructions: string;
  };
  onLogoUpload: (file: File) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onDurationChange: (duration: string) => void;
  onVideoIdeaChange: (idea: string) => void;
  onStoryConceptChange: (concept: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: ShotVersion[] }) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onContinuityLockedChange: (locked: boolean) => void;
  onContinuityGroupsChange: (groups: { [sceneId: string]: any[] }) => void;
  onWorldSettingsChange: (settings: {
    imageModel: string;
    styleReference: string | null;
    worldDescription: string;
    artStyle: string;
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onNext: () => void;
}

export function LogoNarrativeWorkflow({
  activeStep,
  videoId,
  workspaceId,
  narrativeMode,
  logoFile,
  logoPreviewUrl,
  aspectRatio,
  duration,
  videoIdea,
  storyConcept,
  scenes,
  shots,
  shotVersions,
  referenceImages,
  continuityLocked,
  continuityGroups,
  worldSettings,
  onLogoUpload,
  onAspectRatioChange,
  onDurationChange,
  onVideoIdeaChange,
  onStoryConceptChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onReferenceImagesChange,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onWorldSettingsChange,
  onNext,
}: LogoNarrativeWorkflowProps) {
  const { toast } = useToast();

  const handleExport = (data: ExportData) => {
    if (data.selectedPlatforms.length > 0) {
      const missingMetadata: string[] = [];
      
      if (data.selectedPlatforms.includes("youtube")) {
        const ytMeta = data.platformMetadata.youtube;
        if (!ytMeta || !ytMeta.title || !ytMeta.description || !ytMeta.tags) {
          missingMetadata.push("YouTube (title, description, and tags required)");
        }
      }
      
      const socialPlatforms = data.selectedPlatforms.filter(p => p !== "youtube");
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
        description: `Your logo animation is being exported in ${data.resolution}. You'll be notified when it's ready.`,
      });
    } else if (data.publishType === "instant") {
      const platformNames = data.selectedPlatforms.join(", ");
      toast({
        title: "Export & Publishing!",
        description: `Your logo animation is being exported and will be published to ${platformNames}.`,
      });
    } else {
      const platformNames = data.selectedPlatforms.join(", ");
      const scheduleDateTime = `${data.scheduleDate} at ${data.scheduleTime}`;
      toast({
        title: "Export & Scheduled!",
        description: `Your logo animation will be exported and published to ${platformNames} on ${scheduleDateTime}.`,
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
      title: `Animation Phase ${afterSceneIndex + 2}`,
      description: "Describe what happens in this animation phase",
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
      description: "Logo animation shot",
      cameraMovement: "Static",
      shotType: "Medium",
      soundEffects: null,
      duration: 2,
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
      description: "New animation shot",
      cameraMovement: "Static",
      shotType: "Medium",
      soundEffects: null,
      duration: 2,
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
  };

  const handleDeleteShot = (shotId: string) => {
    // Find which scene contains this shot
    let targetSceneId: string | null = null;
    for (const [sceneId, sceneShots] of Object.entries(shots)) {
      if (sceneShots.some(shot => shot.id === shotId)) {
        targetSceneId = sceneId;
        break;
      }
    }
    
    if (!targetSceneId) return;
    
    const sceneShots = shots[targetSceneId] || [];
    const updatedShots = sceneShots
      .filter(shot => shot.id !== shotId)
      .map((shot, idx) => ({
        ...shot,
        shotNumber: idx + 1,
      }));
    
    onShotsChange({
      ...shots,
      [targetSceneId]: updatedShots,
    });
  };

  return (
    <div className="space-y-6">
      {activeStep === "script" && (
        <LogoScriptEditor
          logoFile={logoFile}
          logoPreviewUrl={logoPreviewUrl}
          aspectRatio={aspectRatio}
          duration={duration}
          videoIdea={videoIdea}
          storyConcept={storyConcept}
          onLogoUpload={onLogoUpload}
          onAspectRatioChange={onAspectRatioChange}
          onDurationChange={onDurationChange}
          onVideoIdeaChange={onVideoIdeaChange}
          onStoryConceptChange={onStoryConceptChange}
          onNext={onNext}
        />
      )}

      {activeStep === "world" && (
        <LogoWorldSettings
          worldSettings={worldSettings}
          onWorldSettingsChange={onWorldSettingsChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <SceneBreakdown
          videoId={videoId}
          narrativeMode={narrativeMode}
          script={storyConcept}
          scenes={scenes}
          shots={shots}
          isLogoMode={true}
          onScenesChange={onScenesChange}
          onShotsChange={onShotsChange}
          onContinuityLockedChange={onContinuityLockedChange}
          onContinuityGroupsChange={onContinuityGroupsChange}
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
          characters={[]}
          voiceActorId={null}
          voiceOverEnabled={false}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          isLogoMode={true}
          onVoiceActorChange={() => {}}
          onVoiceOverToggle={() => {}}
          onGenerateShot={handleGenerateShot}
          onRegenerateShot={handleRegenerateShot}
          onUpdateShot={handleUpdateShot}
          onUpdateShotVersion={handleUpdateShotVersion}
          onUpdateScene={handleUpdateScene}
          onUploadShotReference={handleUploadShotReference}
          onDeleteShotReference={handleDeleteShotReference}
          onReorderShots={handleReorderShots}
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
          script={storyConcept}
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
