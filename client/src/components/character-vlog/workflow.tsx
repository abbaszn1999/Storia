import { Button } from "@/components/ui/button";
import { CharacterVlogScriptEditor } from "@/components/character-vlog/script-editor";
import { CharacterVlogSceneBreakdown } from "@/components/character-vlog/scene-breakdown";
import { ElementsTab } from "@/components/character-vlog/elements-tab";
import { StoryboardEditor } from "@/components/character-vlog/storyboard-editor";
import { AnimaticPreview } from "@/components/character-vlog/animatic-preview";
import { ExportSettings, type ExportData } from "@/components/character-vlog/export-settings";
import { useToast } from "@/hooks/use-toast";
import type { Character, Location } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

interface CharacterVlogWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  narrativeMode: "image-reference" | "start-end";
  script: string;
  aspectRatio: string;
  scriptModel: string;
  narrationStyle: "third-person" | "first-person";
  voiceActorId: string | null;
  voiceOverEnabled: boolean;
  theme: string;
  numberOfScenes: number | 'auto';
  shotsPerScene: number | 'auto';
  characterPersonality: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  characters: Character[];
  locations: Location[];
  referenceImages: ReferenceImage[];
  continuityLocked: boolean;
  continuityGroups: { [sceneId: string]: any[] };
  mainCharacter: Character | null;
  worldSettings: { 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
    imageInstructions?: string;
    videoInstructions?: string;
  };
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onScriptModelChange: (model: string) => void;
  onNarrationStyleChange: (style: "third-person" | "first-person") => void;
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onThemeChange: (theme: string) => void;
  onNumberOfScenesChange: (scenes: number | 'auto') => void;
  onShotsPerSceneChange: (shots: number | 'auto') => void;
  onCharacterPersonalityChange: (personality: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: ShotVersion[] }) => void;
  onCharactersChange: (characters: Character[]) => void;
  onLocationsChange: (locations: Location[]) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onContinuityLockedChange: (locked: boolean) => void;
  onContinuityGroupsChange: (groups: { [sceneId: string]: any[] }) => void;
  onMainCharacterChange: (character: Character | null) => void;
  onWorldSettingsChange: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
    locations: Array<{ id: string; name: string; description: string }>;
    imageInstructions: string;
    videoInstructions: string;
  }) => void;
  onNext: () => void;
}

export function CharacterVlogWorkflow({
  activeStep,
  videoId,
  workspaceId,
  narrativeMode,
  script,
  aspectRatio,
  scriptModel,
  narrationStyle,
  voiceActorId,
  voiceOverEnabled,
  theme,
  numberOfScenes,
  shotsPerScene,
  characterPersonality,
  scenes,
  shots,
  shotVersions,
  characters,
  locations,
  referenceImages,
  continuityLocked,
  continuityGroups,
  mainCharacter,
  worldSettings,
  onScriptChange,
  onAspectRatioChange,
  onScriptModelChange,
  onNarrationStyleChange,
  onVoiceActorChange,
  onVoiceOverToggle,
  onThemeChange,
  onNumberOfScenesChange,
  onShotsPerSceneChange,
  onCharacterPersonalityChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onLocationsChange,
  onReferenceImagesChange,
  onContinuityLockedChange,
  onContinuityGroupsChange,
  onMainCharacterChange,
  onWorldSettingsChange,
  onNext,
}: CharacterVlogWorkflowProps) {
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
        description: `Your character vlog is being exported in ${data.resolution}. You'll be notified when it's ready.`,
      });
    } else if (data.publishType === "instant") {
      const platformNames = data.selectedPlatforms.join(", ");
      toast({
        title: "Export & Publishing!",
        description: `Your character vlog is being exported and will be published to ${platformNames}.`,
      });
    } else {
      const platformNames = data.selectedPlatforms.join(", ");
      const scheduleDateTime = `${data.scheduleDate} at ${data.scheduleTime}`;
      toast({
        title: "Export & Scheduled!",
        description: `Your character vlog will be exported and published to ${platformNames} on ${scheduleDateTime}.`,
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
        <CharacterVlogScriptEditor
          initialScript={script}
          scriptModel={scriptModel}
          narrationStyle={narrationStyle}
          theme={theme}
          numberOfScenes={numberOfScenes}
          shotsPerScene={shotsPerScene}
          characterPersonality={characterPersonality}
          onScriptChange={onScriptChange}
          onScriptModelChange={onScriptModelChange}
          onNarrationStyleChange={onNarrationStyleChange}
          onThemeChange={onThemeChange}
          onNumberOfScenesChange={onNumberOfScenesChange}
          onShotsPerSceneChange={onShotsPerSceneChange}
          onCharacterPersonalityChange={onCharacterPersonalityChange}
          onNext={onNext}
        />
      )}

      {activeStep === "scenes" && (
        <CharacterVlogSceneBreakdown
          videoId={videoId}
          narrativeMode={narrativeMode}
          script={script}
          characterName={mainCharacter?.name || "Character"}
          theme={theme}
          scenes={scenes.map(s => ({
            id: s.id,
            name: s.title || `Scene ${s.sceneNumber}`,
            description: s.description || "",
            duration: s.duration || 5,
            actType: (s.title?.toLowerCase().includes("hook") ? "hook" : 
                     s.title?.toLowerCase().includes("intro") ? "intro" :
                     s.title?.toLowerCase().includes("outro") ? "outro" : "main") as "hook" | "intro" | "main" | "outro",
            shots: [],
          }))}
          shots={Object.fromEntries(
            Object.entries(shots).map(([sceneId, sceneShots]) => [
              sceneId,
              sceneShots.map(shot => ({
                id: shot.id,
                sceneId: shot.sceneId,
                name: `Shot ${shot.shotNumber}`,
                description: shot.description || "",
                shotType: shot.shotType === "Medium" ? "start-end" : "start-end" as "image-ref" | "start-end",
                cameraShot: shot.shotType || "Medium",
                isLinkedToPrevious: false,
                referenceTags: [],
              }))
            ])
          )}
          onScenesChange={(newScenes) => {
            onScenesChange(newScenes.map((scene, idx) => ({
              id: scene.id,
              videoId: videoId,
              sceneNumber: idx + 1,
              title: scene.name,
              description: scene.description,
              lighting: null,
              weather: null,
              imageModel: null,
              videoModel: null,
              duration: scene.duration,
              createdAt: new Date(),
            })));
          }}
          onShotsChange={(newShots) => {
            onShotsChange(Object.fromEntries(
              Object.entries(newShots).map(([sceneId, sceneShots]) => [
                sceneId,
                sceneShots.map((shot, idx) => ({
                  id: shot.id,
                  sceneId: shot.sceneId,
                  shotNumber: idx + 1,
                  description: shot.description,
                  cameraMovement: "Static",
                  shotType: shot.cameraShot || "Medium",
                  soundEffects: null,
                  duration: 3,
                  transition: "cut",
                  imageModel: null,
                  videoModel: null,
                  currentVersionId: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }))
              ])
            ));
          }}
          onContinuityGroupsChange={onContinuityGroupsChange}
          onContinuityLockedChange={onContinuityLockedChange}
          onNext={onNext}
        />
      )}

      {activeStep === "elements" && (
        <ElementsTab
          videoId={videoId}
          workspaceId={workspaceId}
          characters={characters}
          locations={locations}
          referenceImages={referenceImages}
          artStyle={worldSettings.artStyle}
          imageModel={worldSettings.imageModel}
          worldDescription={worldSettings.worldDescription}
          aspectRatio={aspectRatio}
          onCharactersChange={onCharactersChange}
          onLocationsChange={onLocationsChange}
          onReferenceImagesChange={onReferenceImagesChange}
          onAspectRatioChange={onAspectRatioChange}
          onWorldSettingsChange={(settings) => onWorldSettingsChange({
            ...settings,
            locations: worldSettings.locations || [],
            imageInstructions: worldSettings.imageInstructions || "",
            videoInstructions: worldSettings.videoInstructions || "",
          })}
          onNext={onNext}
          mainCharacter={mainCharacter}
          onMainCharacterChange={onMainCharacterChange}
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
          isCharacterVlogMode={true}
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

