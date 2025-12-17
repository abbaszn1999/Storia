import { useState } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Link, useParams, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoNarrativeWorkflow } from "@/components/logo-narrative-workflow";
import type { Scene, Shot, ShotVersion, ReferenceImage } from "@/types/storyboard";

const steps = [
  { id: "script", label: "Logo Script" },
  { id: "world", label: "World Settings" },
  { id: "breakdown", label: "Breakdown" },
  { id: "storyboard", label: "Storyboard" },
  { id: "animatic", label: "Animatic" },
  { id: "export", label: "Export" },
];

export default function LogoAnimationMode() {
  const params = useParams<{ videoId?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const [videoTitle] = useState(urlParams.get("title") || "Untitled Logo Animation");
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Logo mode always uses start-end for seamless logo animations
  const narrativeMode = "start-end" as const;
  
  const [videoId] = useState(params.videoId || urlParams.get("id") || `logo-${Date.now()}`);
  const [workspaceId] = useState(urlParams.get("workspace") || "workspace-1");
  
  // Logo-specific state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [videoIdea, setVideoIdea] = useState("");
  const [storyConcept, setStoryConcept] = useState("");
  
  // World settings (simplified - no characters/locations)
  const [worldSettings, setWorldSettings] = useState<{
    imageModel: string;
    styleReference: string | null;
    worldDescription: string;
    artStyle: string;
    imageInstructions: string;
    videoInstructions: string;
  }>({
    imageModel: "Flux",
    styleReference: null,
    worldDescription: "",
    artStyle: "none",
    imageInstructions: "",
    videoInstructions: "",
  });
  
  // Scene/shot state (reused from narrative)
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<{ [sceneId: string]: Shot[] }>({});
  const [shotVersions, setShotVersions] = useState<{ [shotId: string]: ShotVersion[] }>({});
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [continuityLocked, setContinuityLocked] = useState(false);
  const [continuityGroups, setContinuityGroups] = useState<{ [sceneId: string]: any[] }>({});

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

  const handleLogoUpload = (file: File) => {
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreviewUrl(url);
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
              
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-semibold truncate max-w-[200px]">{videoTitle}</h1>
                <Badge variant="secondary" className="text-xs">Logo</Badge>
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
          <LogoNarrativeWorkflow 
            activeStep={activeStep}
            videoId={videoId}
            workspaceId={workspaceId}
            narrativeMode={narrativeMode}
            logoFile={logoFile}
            logoPreviewUrl={logoPreviewUrl}
            aspectRatio={aspectRatio}
            duration={duration}
            videoIdea={videoIdea}
            storyConcept={storyConcept}
            scenes={scenes}
            shots={shots}
            shotVersions={shotVersions}
            referenceImages={referenceImages}
            continuityLocked={continuityLocked}
            continuityGroups={continuityGroups}
            worldSettings={worldSettings}
            onLogoUpload={handleLogoUpload}
            onAspectRatioChange={setAspectRatio}
            onDurationChange={setDuration}
            onVideoIdeaChange={setVideoIdea}
            onStoryConceptChange={setStoryConcept}
            onScenesChange={setScenes}
            onShotsChange={setShots}
            onShotVersionsChange={setShotVersions}
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
