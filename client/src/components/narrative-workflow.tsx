import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScriptEditor } from "@/components/narrative/script-editor";
import { SceneBreakdown } from "@/components/narrative/scene-breakdown";
import { WorldCast } from "@/components/narrative/world-cast";
import { StoryboardEditor } from "@/components/narrative/storyboard-editor";
import type { Scene, Shot, ShotVersion, Character, ReferenceImage } from "@shared/schema";

const steps = [
  { id: "script", label: "Script", description: "Write or refine your story" },
  { id: "breakdown", label: "Breakdown", description: "Scene and shot analysis" },
  { id: "world", label: "World & Cast", description: "Define characters and setting" },
  { id: "storyboard", label: "Storyboard", description: "Visual frame generation" },
  { id: "animatic", label: "Animatic", description: "Preview timed sequence" },
  { id: "export", label: "Export", description: "Finalize and publish" },
];

export function NarrativeWorkflow() {
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [videoId] = useState(`video-${Date.now()}`);
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [characters, setCharacters] = useState<Character[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [worldSettings, setWorldSettings] = useState<{ artStyle: string; aspectRatio: string }>({
    artStyle: "none",
    aspectRatio: "16:9",
  });

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);

  const handleNext = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setActiveStep(steps[nextIndex].id);
    }
  };

  const handleGenerateShot = (shotId: string) => {
    console.log("Generating shot:", shotId);
  };

  const handleRegenerateShot = (shotId: string) => {
    console.log("Regenerating shot:", shotId);
  };

  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    setShots((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((sceneId) => {
        updated[sceneId] = updated[sceneId].map((shot) =>
          shot.id === shotId ? { ...shot, ...updates } : shot
        );
      });
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                activeStep === step.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : isStepCompleted(step.id)
                  ? "bg-card border-primary"
                  : "bg-card border-border hover-elevate"
              }`}
              onClick={() => setActiveStep(step.id)}
              data-testid={`button-step-${step.id}`}
            >
              {isStepCompleted(step.id) ? (
                <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              ) : (
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs ${
                    activeStep === step.id ? "border-primary-foreground" : "border-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium whitespace-nowrap">{step.label}</div>
              </div>
            </div>
            {index < steps.length - 1 && <div className="h-0.5 w-8 bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps.find((s) => s.id === activeStep)?.label}</CardTitle>
          <CardDescription>{steps.find((s) => s.id === activeStep)?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeStep === "script" && (
            <ScriptEditor
              initialScript={script}
              onScriptChange={setScript}
              onNext={handleNext}
            />
          )}

          {activeStep === "breakdown" && (
            <SceneBreakdown
              videoId={videoId}
              script={script}
              scenes={scenes}
              shots={shots}
              onScenesGenerated={(newScenes, newShots) => {
                setScenes(newScenes);
                setShots(newShots);
              }}
              onNext={handleNext}
            />
          )}

          {activeStep === "world" && (
            <WorldCast
              videoId={videoId}
              characters={characters}
              referenceImages={referenceImages}
              artStyle={worldSettings.artStyle}
              aspectRatio={worldSettings.aspectRatio}
              onCharactersChange={setCharacters}
              onReferenceImagesChange={setReferenceImages}
              onWorldSettingsChange={setWorldSettings}
              onNext={handleNext}
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
              onNext={handleNext}
            />
          )}

          {activeStep === "animatic" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Preview your timed storyboard sequence with transitions.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleNext} data-testid="button-next">
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
        </CardContent>
      </Card>
    </div>
  );
}
