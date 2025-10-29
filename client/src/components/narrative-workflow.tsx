import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/narrative/script-editor";
import { SceneBreakdown } from "@/components/narrative/scene-breakdown";
import { WorldCast } from "@/components/narrative/world-cast";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import type { Scene, Shot, ShotVersion, Character, ReferenceImage } from "@shared/schema";

interface NarrativeWorkflowProps {
  activeStep: string;
  videoId: string;
  workspaceId: string;
  script: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  shotVersions: { [shotId: string]: ShotVersion[] };
  characters: Character[];
  referenceImages: ReferenceImage[];
  worldSettings: { artStyle: string; aspectRatio: string };
  onScriptChange: (script: string) => void;
  onScenesChange: (scenes: Scene[]) => void;
  onShotsChange: (shots: { [sceneId: string]: Shot[] }) => void;
  onShotVersionsChange: (shotVersions: { [shotId: string]: ShotVersion[] }) => void;
  onCharactersChange: (characters: Character[]) => void;
  onReferenceImagesChange: (referenceImages: ReferenceImage[]) => void;
  onWorldSettingsChange: (settings: { artStyle: string; aspectRatio: string }) => void;
  onNext: () => void;
}

export function NarrativeWorkflow({
  activeStep,
  videoId,
  workspaceId,
  script,
  scenes,
  shots,
  shotVersions,
  characters,
  referenceImages,
  worldSettings,
  onScriptChange,
  onScenesChange,
  onShotsChange,
  onShotVersionsChange,
  onCharactersChange,
  onReferenceImagesChange,
  onWorldSettingsChange,
  onNext,
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

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    onScenesChange(
      scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
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

  return (
    <div>
      {activeStep === "script" && (
        <ScriptEditor
          initialScript={script}
          onScriptChange={onScriptChange}
          onNext={onNext}
        />
      )}

      {activeStep === "breakdown" && (
        <SceneBreakdown
          videoId={videoId}
          script={script}
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
          aspectRatio={worldSettings.aspectRatio}
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
          onGenerateShot={handleGenerateShot}
          onRegenerateShot={handleRegenerateShot}
          onUpdateShot={handleUpdateShot}
          onUpdateScene={handleUpdateScene}
          onReorderShots={handleReorderShots}
          onNext={onNext}
        />
      )}

      {activeStep === "animatic" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Preview your timed storyboard sequence with transitions.
          </p>
          <div className="flex justify-end">
            <Button onClick={onNext} data-testid="button-next">
              Continue to Export
            </Button>
          </div>
        </div>
      )}

      {activeStep === "export" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export and publish your video to YouTube, TikTok, and more.
          </p>
          <div className="flex justify-end">
            <Button className="bg-gradient-storia" data-testid="button-export">
              Export Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
