import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/narrative/script-editor";
import { SceneBreakdown } from "@/components/narrative/scene-breakdown";
import { WorldCast } from "@/components/narrative/world-cast";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import { PreviewExport } from "@/components/narrative/preview-export";
import type { Scene, Shot, ShotVersion, Character, ReferenceImage } from "@shared/schema";

interface NarrativeWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  script: string;
  aspectRatio: string;
  scriptModel: string;
  voiceActorId: string | null;
  soundEffectsEnabled: boolean;
  backgroundMusicEnabled: boolean;
  musicStyle: string;
  musicVolume: number;
  resolution: string;
  subtitlesEnabled: boolean;
  exportTitle: string;
  exportSummary: string;
  hashtags: string[];
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  characters: Character[];
  referenceImages: ReferenceImage[];
  worldSettings: { 
    artStyle: string; 
    imageModel?: string;
    worldDescription?: string;
    locations?: Array<{ id: string; name: string; description: string }>;
  };
  onScriptChange: (script: string) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onScriptModelChange: (model: string) => void;
  onVoiceActorChange: (voiceActorId: string) => void;
  onSoundEffectsToggle: (enabled: boolean) => void;
  onBackgroundMusicToggle: (enabled: boolean) => void;
  onMusicStyleChange: (style: string) => void;
  onMusicVolumeChange: (volume: number) => void;
  onResolutionChange: (resolution: string) => void;
  onSubtitlesToggle: (enabled: boolean) => void;
  onExportTitleChange: (title: string) => void;
  onExportSummaryChange: (summary: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: ShotVersion[] }) => void;
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onWorldSettingsChange: (settings: { 
    artStyle: string; 
    imageModel: string;
    worldDescription: string;
    locations: Array<{ id: string; name: string; description: string }>;
  }) => void;
  onNext: () => void;
  onBack?: () => void;
}

export function NarrativeWorkflow({
  activeStep,
  videoId,
  workspaceId,
  script,
  aspectRatio,
  scriptModel,
  voiceActorId,
  soundEffectsEnabled,
  backgroundMusicEnabled,
  musicStyle,
  musicVolume,
  resolution,
  subtitlesEnabled,
  exportTitle,
  exportSummary,
  hashtags,
  scenes,
  shots,
  shotVersions,
  characters,
  referenceImages,
  worldSettings,
  onScriptChange,
  onAspectRatioChange,
  onScriptModelChange,
  onVoiceActorChange,
  onSoundEffectsToggle,
  onBackgroundMusicToggle,
  onMusicStyleChange,
  onMusicVolumeChange,
  onResolutionChange,
  onSubtitlesToggle,
  onExportTitleChange,
  onExportSummaryChange,
  onHashtagsChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onReferenceImagesChange,
  onWorldSettingsChange,
  onNext,
  onBack,
}: NarrativeWorkflowProps) {
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

  return (
    <div>
      {activeStep === "script" && (
        <ScriptEditor
          initialScript={script}
          aspectRatio={aspectRatio}
          scriptModel={scriptModel}
          onScriptChange={onScriptChange}
          onAspectRatioChange={onAspectRatioChange}
          onScriptModelChange={onScriptModelChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <SceneBreakdown
          videoId={videoId}
          script={script}
          scriptModel={scriptModel}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          onScenesGenerated={(newScenes, newShots, newShotVersions) => {
            onScenesChange(newScenes);
            onShotsChange(newShots);
            if (newShotVersions) {
              onShotVersionsChange(newShotVersions);
            }
          }}
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
          onCharactersChange={onCharactersChange}
          onReferenceImagesChange={onReferenceImagesChange}
          onWorldSettingsChange={onWorldSettingsChange}
          onNext={onNext}
        />
      )}

      {activeStep === "storyboard" && (
        <StoryboardEditor
          videoId={videoId}
          scenes={scenes}
          shots={shots}
          shotVersions={shotVersions}
          referenceImages={referenceImages}
          voiceActorId={voiceActorId}
          soundEffectsEnabled={soundEffectsEnabled}
          onVoiceActorChange={onVoiceActorChange}
          onSoundEffectsToggle={onSoundEffectsToggle}
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
          onNext={onNext}
        />
      )}

      {activeStep === "preview" && (
        <PreviewExport
          videoId={videoId}
          backgroundMusicEnabled={backgroundMusicEnabled}
          musicStyle={musicStyle}
          musicVolume={musicVolume}
          resolution={resolution}
          subtitlesEnabled={subtitlesEnabled}
          title={exportTitle}
          summary={exportSummary}
          hashtags={hashtags}
          onBackgroundMusicToggle={onBackgroundMusicToggle}
          onMusicStyleChange={onMusicStyleChange}
          onMusicVolumeChange={onMusicVolumeChange}
          onResolutionChange={onResolutionChange}
          onSubtitlesToggle={onSubtitlesToggle}
          onTitleChange={onExportTitleChange}
          onSummaryChange={onExportSummaryChange}
          onHashtagsChange={onHashtagsChange}
          onBack={() => onBack?.()}
          onExport={() => {
            console.log("Exporting video with settings:", {
              backgroundMusic: backgroundMusicEnabled ? { style: musicStyle, volume: musicVolume } : null,
              resolution,
              subtitles: subtitlesEnabled,
              title: exportTitle,
              summary: exportSummary,
              hashtags,
            });
          }}
        />
      )}
    </div>
  );
}
