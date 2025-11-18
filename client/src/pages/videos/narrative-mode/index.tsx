import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NarrativeWorkflow } from "@/components/narrative-workflow";
import { NarrativeModeSelector } from "@/components/narrative/narrative-mode-selector";
import type { Scene, Shot, ShotVersion, Character, ReferenceImage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const steps = [
  { id: "script", label: "Script" },
  { id: "world", label: "World & Cast" },
  { id: "breakdown", label: "Breakdown" },
  { id: "storyboard", label: "Storyboard" },
  { id: "animatic", label: "Animatic" },
  { id: "export", label: "Export" },
];

export default function NarrativeMode() {
  const [videoTitle] = useState("Untitled Project");
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [narrativeMode, setNarrativeMode] = useState<"image-reference" | "start-end" | null>(null);
  
  const [videoId, setVideoId] = useState<string | null>(null);
  const [workspaceId] = useState("workspace-1");
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [scriptModel, setScriptModel] = useState("gpt-4o");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(true);
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
  }>({
    artStyle: "none",
    imageModel: "Flux",
    worldDescription: "",
    locations: [],
  });

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const currentStepIndex = steps.findIndex((s) => s.id === activeStep);

  // Create video in backend when narrative mode is selected
  useEffect(() => {
    if (narrativeMode && !videoId) {
      const createVideo = async () => {
        try {
          const response = await apiRequest('POST', '/api/narrative/videos', {
            workspaceId,
            title: videoTitle,
            mode: 'narrative',
            narrativeMode,
          }) as { id: string };
          setVideoId(response.id);
        } catch (error) {
          console.error('Failed to create video:', error);
        }
      };
      createVideo();
    }
  }, [narrativeMode, videoId, workspaceId, videoTitle]);

  const handleNext = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setActiveStep(steps[nextIndex].id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Navigation & Branding */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back">
                <Link href="/videos">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <h1 className="text-sm font-semibold truncate max-w-[200px]">{videoTitle}</h1>
            </div>

            {/* Center: Step Navigation */}
            <div className="flex items-center gap-3">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover-elevate ${
                    activeStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : isStepCompleted(step.id)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`button-step-${step.id}`}
                >
                  {isStepCompleted(step.id) && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span className="whitespace-nowrap">{step.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {!narrativeMode ? (
            <div className="flex items-center justify-center min-h-[600px]">
              <NarrativeModeSelector onSelectMode={(mode) => setNarrativeMode(mode)} />
            </div>
          ) : videoId ? (
            <NarrativeWorkflow 
              activeStep={activeStep}
              videoId={videoId}
              workspaceId={workspaceId}
              narrativeMode={narrativeMode}
              script={script}
              aspectRatio={aspectRatio}
              scriptModel={scriptModel}
              voiceActorId={voiceActorId}
              voiceOverEnabled={voiceOverEnabled}
              scenes={scenes}
              shots={shots}
              shotVersions={shotVersions}
              characters={characters}
              referenceImages={referenceImages}
              continuityLocked={continuityLocked}
              continuityGroups={continuityGroups}
              worldSettings={worldSettings}
              onScriptChange={setScript}
              onAspectRatioChange={setAspectRatio}
              onScriptModelChange={setScriptModel}
              onVoiceActorChange={setVoiceActorId}
              onVoiceOverToggle={setVoiceOverEnabled}
              onScenesChange={setScenes}
              onShotsChange={setShots}
              onShotVersionsChange={setShotVersions}
              onCharactersChange={setCharacters}
              onReferenceImagesChange={setReferenceImages}
              onContinuityLockedChange={setContinuityLocked}
              onContinuityGroupsChange={setContinuityGroups}
              onWorldSettingsChange={setWorldSettings}
              onNext={handleNext}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[600px]">
              <p className="text-muted-foreground">Creating video...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
