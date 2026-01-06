import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/narrative/script-editor";
import { SceneBreakdown } from "@/components/narrative/scene-breakdown";
import { WorldCast } from "@/components/narrative/world-cast";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import { AnimaticPreview } from "@/components/narrative/animatic-preview";
import { ExportSettings, type ExportData } from "@/components/narrative/export-settings";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

interface NarrativeWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  narrativeMode: "image-reference" | "start-end" | "auto";
  script: string;
  aspectRatio: string;
  scriptModel: string;
  voiceActorId: string | null;
  voiceOverEnabled: boolean;
  // Step 1 settings
  duration: string;
  genres: string[];
  tones: string[];
  language: string;
  userIdea: string;
  numberOfScenes?: number | 'auto';
  shotsPerScene?: number | 'auto';
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
    locations?: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
    imageInstructions?: string;
    videoInstructions?: string;
    cinematicInspiration?: string;
  };
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onScriptModelChange: (model: string) => void;
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onNumberOfScenesChange?: (scenes: number | 'auto') => void;
  onShotsPerSceneChange?: (shots: number | 'auto') => void;
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
    locations: Array<{ id: string; name: string; description: string; details?: string; imageUrl?: string | null }>;
    imageInstructions: string;
    videoInstructions: string;
    cinematicInspiration?: string;
  }) => void;
  onValidationChange?: (canContinue: boolean) => void;  // Validation callback
  onNext: () => void;
}

export function NarrativeWorkflow({
  activeStep,
  videoId,
  workspaceId,
  narrativeMode,
  script,
  aspectRatio,
  scriptModel,
  voiceActorId,
  voiceOverEnabled,
  duration,
  genres,
  tones,
  language,
  userIdea,
  numberOfScenes,
  shotsPerScene,
  scenes,
  shots,
  shotVersions,
  characters,
  referenceImages,
  continuityLocked,
  continuityGroups,
  worldSettings,
  onScriptChange,
  onAspectRatioChange,
  onScriptModelChange,
  onVoiceActorChange,
  onVoiceOverToggle,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onReferenceImagesChange,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onWorldSettingsChange,
  onValidationChange,
  onNext,
}: NarrativeWorkflowProps) {
  const { toast } = useToast();

  const handleExport = (data: ExportData) => {
    // Validation: Check platform metadata for publishing platforms
    if (data.selectedPlatforms.length > 0) {
      const missingMetadata: string[] = [];
      
      // Check if YouTube is selected and has metadata
      if (data.selectedPlatforms.includes("youtube")) {
        const ytMeta = data.platformMetadata.youtube;
        if (!ytMeta || !ytMeta.title || !ytMeta.description || !ytMeta.tags) {
          missingMetadata.push("YouTube (title, description, and tags required)");
        }
      }
      
      // Check if any social platform is selected and has shared caption
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

    // Validation: If platforms are selected AND scheduling, require date/time
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

    // All validation passed - show success message based on action
    if (data.selectedPlatforms.length === 0) {
      // Just export (no publishing)
      toast({
        title: "Export started!",
        description: `Your video is being exported in ${data.resolution}. You'll be notified when it's ready.`,
      });
    } else if (data.publishType === "instant") {
      // Export and publish instantly
      const platformNames = data.selectedPlatforms.join(", ");
      toast({
        title: "Export & Publishing!",
        description: `Your video is being exported and will be published to ${platformNames}.`,
      });
    } else {
      // Export and schedule
      const platformNames = data.selectedPlatforms.join(", ");
      const scheduleDateTime = `${data.scheduleDate} at ${data.scheduleTime}`;
      toast({
        title: "Export & Scheduled!",
        description: `Your video will be exported and published to ${platformNames} on ${scheduleDateTime}.`,
      });
    }

    console.log("Export data:", data);
  };

  const handleGenerateShot = async (shotId: string) => {
    try {
      const response = await apiRequest('POST', '/api/narrative/shots/generate-image', {
        shotId,
        videoId,
      }, {
        'x-workspace-id': workspaceId,
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate image",
          variant: "destructive",
        });
        return;
      }
      
      // Update shotVersions with the new version
      if (data.version) {
        const currentVersions = shotVersions[shotId] || [];
        const updatedVersions = [...currentVersions, data.version];
        onShotVersionsChange({
          ...shotVersions,
          [shotId]: updatedVersions,
        });
        
        // Update shot's currentVersionId
        const allShots = Object.values(shots).flat();
        const shot = allShots.find(s => s.id === shotId);
        if (shot) {
          handleUpdateShot(shotId, { currentVersionId: data.version.id });
        }
      }
      
      toast({
        title: "Image Generated",
        description: "Storyboard image generated successfully",
      });
    } catch (error) {
      console.error('Failed to generate shot image:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateShot = async (shotId: string) => {
    // Get current version ID if exists
    const allShots = Object.values(shots).flat();
    const shot = allShots.find(s => s.id === shotId);
    const currentVersions = shotVersions[shotId] || [];
    const versionId = shot?.currentVersionId || currentVersions[currentVersions.length - 1]?.id;
    
    try {
      const response = await apiRequest('POST', '/api/narrative/shots/generate-image', {
        shotId,
        videoId,
        versionId, // Pass versionId to update existing version
      }, {
        'x-workspace-id': workspaceId,
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Regeneration Failed",
          description: data.error || "Failed to regenerate image",
          variant: "destructive",
        });
        return;
      }
      
      // Update shotVersions with the updated version
      if (data.version) {
        const updatedVersions = currentVersions.map(v => 
          v.id === data.version.id ? data.version : v
        );
        onShotVersionsChange({
          ...shotVersions,
          [shotId]: updatedVersions,
        });
      }
      
      toast({
        title: "Image Regenerated",
        description: "Storyboard image regenerated successfully",
      });
    } catch (error) {
      console.error('Failed to regenerate shot image:', error);
      toast({
        title: "Regeneration Failed",
        description: error instanceof Error ? error.message : "Failed to regenerate image",
        variant: "destructive",
      });
    }
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
    // Create a temporary URL for the uploaded image
    const tempUrl = URL.createObjectURL(file);
    
    // Find existing reference image for this shot
    const existingRef = referenceImages.find(
      (ref) => ref.shotId === shotId && ref.type === "shot_reference"
    );

    if (existingRef) {
      // Update existing reference
      onReferenceImagesChange(
        referenceImages.map((ref) =>
          ref.shotId === shotId && ref.type === "shot_reference"
            ? { ...ref, imageUrl: tempUrl }
            : ref
        )
      );
    } else {
      // Add new reference
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
    // Update the shot's currentVersionId
    handleUpdateShot(shotId, { currentVersionId: versionId });
  };

  const handleDeleteVersion = (shotId: string, versionId: string) => {
    // Remove the version from shotVersions
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

    // Insert the new shot after the specified index
    const newShots = [...sceneShots];
    newShots.splice(afterShotIndex + 1, 0, newShot);

    // Update shot numbers
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
    // Remove the scene
    const updatedScenes = scenes
      .filter(scene => scene.id !== sceneId)
      .map((scene, idx) => ({
        ...scene,
        sceneNumber: idx + 1,
      }));
    
    onScenesChange(updatedScenes);
    
    // Remove all shots for this scene
    const updatedShots = { ...shots };
    delete updatedShots[sceneId];
    onShotsChange(updatedShots);
    
    // Remove all shot versions for shots in this scene
    const sceneShots = shots[sceneId] || [];
    const updatedShotVersions = { ...shotVersions };
    sceneShots.forEach(shot => {
      delete updatedShotVersions[shot.id];
    });
    onShotVersionsChange(updatedShotVersions);
    
    // Remove reference images for shots in this scene
    const shotIds = sceneShots.map(s => s.id);
    onReferenceImagesChange(
      referenceImages.filter(ref => !shotIds.includes(ref.shotId || ''))
    );
  };

  const handleDeleteShot = (shotId: string) => {
    // Find which scene this shot belongs to
    const sceneId = Object.keys(shots).find(sId => 
      shots[sId]?.some(shot => shot.id === shotId)
    );
    
    if (!sceneId) return;
    
    const sceneShots = shots[sceneId] || [];
    
    // Remove the shot and renumber remaining shots
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
    
    // Remove shot versions for this shot
    const updatedShotVersions = { ...shotVersions };
    delete updatedShotVersions[shotId];
    onShotVersionsChange(updatedShotVersions);
    
    // Remove reference images for this shot
    onReferenceImagesChange(
      referenceImages.filter(ref => ref.shotId !== shotId)
    );
  };

  return (
    <div>
      {activeStep === "script" && (
        <ScriptEditor
          videoId={videoId}
          initialScript={script}
          aspectRatio={aspectRatio}
          scriptModel={scriptModel}
          initialDuration={duration}
          initialGenres={genres}
          initialTones={tones}
          initialLanguage={language}
          initialUserIdea={userIdea}
          initialNumberOfScenes={numberOfScenes}
          initialShotsPerScene={shotsPerScene}
          onScriptChange={onScriptChange}
          onAspectRatioChange={onAspectRatioChange}
          onScriptModelChange={onScriptModelChange}
          onNumberOfScenesChange={onNumberOfScenesChange}
          onShotsPerSceneChange={onShotsPerSceneChange}
          onValidationChange={onValidationChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <SceneBreakdown
          videoId={videoId}
          workspaceId={workspaceId}
          script={script}
          scriptModel={scriptModel}
          narrativeMode={narrativeMode}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          continuityLocked={continuityLocked}
          continuityGroups={continuityGroups}
          numberOfScenes={numberOfScenes}
          shotsPerScene={shotsPerScene}
          targetDuration={duration ? parseInt(duration) : undefined}
          genre={genres && genres.length > 0 ? genres[0] : undefined}
          tone={tones && tones.length > 0 ? tones[0] : undefined}
          characters={characters.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || c.appearance || undefined,
          }))}
          locations={worldSettings?.locations?.map(l => ({
            id: l.id,
            name: l.name,
            description: l.description || undefined,
          })) || []}
          onScenesGenerated={(newScenes, newShots, newShotVersions) => {
            onScenesChange(newScenes);
            onShotsChange(newShots);
            if (newShotVersions) {
              onShotVersionsChange(newShotVersions);
            }
          }}
          onContinuityLocked={() => onContinuityLockedChange(true)}
          onContinuityGroupsChange={onContinuityGroupsChange}
          onNext={onNext}
        />
      )}

      {activeStep === "world" && (
        <WorldCast
          videoId={videoId}
          workspaceId={workspaceId}
          characters={characters}
          referenceImages={referenceImages}
          artStyle={worldSettings.artStyle}
          imageModel={worldSettings.imageModel}
          worldDescription={worldSettings.worldDescription}
          locations={worldSettings.locations}
          imageInstructions={worldSettings.imageInstructions}
          videoInstructions={worldSettings.videoInstructions}
          cinematicInspiration={worldSettings.cinematicInspiration}
          script={script}
          onCharactersChange={onCharactersChange}
          onReferenceImagesChange={onReferenceImagesChange}
          onWorldSettingsChange={onWorldSettingsChange}
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
          locations={worldSettings?.locations || []}
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
