import { useState } from "react";
import { ArrowLeft, Check, Waves } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AmbientWorkflow } from "@/components/ambient-workflow";
import type { Character } from "@shared/schema";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

const steps = [
  { id: "script", label: "Atmosphere" },
  { id: "world", label: "Visual World" },
  { id: "breakdown", label: "Flow Design" },
  { id: "storyboard", label: "Composition" },
  { id: "animatic", label: "Preview" },
  { id: "export", label: "Export" },
];

export default function AmbientMode() {
  const [videoTitle] = useState("Untitled Ambient Video");
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [videoId] = useState(`ambient-${Date.now()}`);
  const [workspaceId] = useState("workspace-1");
  
  const [atmosphereDescription, setAtmosphereDescription] = useState("");
  const [voiceOverScript, setVoiceOverScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [atmosphereModel, setAtmosphereModel] = useState("gpt-4o");
  const [voiceActorId, setVoiceActorId] = useState<string | null>(null);
  const [voiceOverEnabled, setVoiceOverEnabled] = useState(false);
  const [voiceOverLanguage, setVoiceOverLanguage] = useState("English");
  const [category, setCategory] = useState("nature");
  const [moods, setMoods] = useState<string[]>(["Relaxing"]);
  const [duration, setDuration] = useState("1800");
  
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
    animationMode?: "animate" | "smooth-image";
    imageInstructions?: string;
    videoInstructions?: string;
  }>({
    artStyle: "none",
    imageModel: "flux",
    animationMode: "smooth-image",
    imageInstructions: "",
    videoInstructions: "",
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

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="ambient-mode-page">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Navigation & Branding */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="ambient-button-back">
                <Link href="/videos">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Waves className="h-3 w-3" />
                  Ambient Visual
                </Badge>
                <h1 className="text-sm font-semibold truncate max-w-[200px]" data-testid="ambient-video-title">
                  {videoTitle}
                </h1>
              </div>
            </div>

            {/* Center: Step Navigation */}
            <div className="flex items-center gap-3">
              {steps.map((step) => (
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
                  data-testid={`ambient-button-step-${step.id}`}
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
        <div className="max-w-[1600px] mx-auto">
          <AmbientWorkflow 
            activeStep={activeStep}
            videoId={videoId}
            workspaceId={workspaceId}
            narrativeMode="image-reference"
            atmosphereDescription={atmosphereDescription}
            voiceOverScript={voiceOverScript}
            aspectRatio={aspectRatio}
            atmosphereModel={atmosphereModel}
            voiceActorId={voiceActorId}
            voiceOverEnabled={voiceOverEnabled}
            voiceOverLanguage={voiceOverLanguage}
            category={category}
            moods={moods}
            duration={duration}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            characters={characters}
            referenceImages={referenceImages}
            continuityLocked={continuityLocked}
            continuityGroups={continuityGroups}
            worldSettings={worldSettings}
            onAtmosphereDescriptionChange={setAtmosphereDescription}
            onVoiceOverScriptChange={setVoiceOverScript}
            onAspectRatioChange={setAspectRatio}
            onAtmosphereModelChange={setAtmosphereModel}
            onVoiceActorChange={setVoiceActorId}
            onVoiceOverEnabledChange={setVoiceOverEnabled}
            onVoiceOverLanguageChange={setVoiceOverLanguage}
            onCategoryChange={setCategory}
            onMoodsChange={setMoods}
            onDurationChange={setDuration}
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
        </div>
      </main>
    </div>
  );
}
