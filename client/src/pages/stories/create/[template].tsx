import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { STORY_TEMPLATES } from "@/constants/story-templates";
import { WriteScript } from "@/components/story/write-script";
import { ReviewScenes } from "@/components/story/review-scenes";
import { EditShots } from "@/components/story/edit-shots";
import { AddAudio } from "@/components/story/add-audio";
import { PreviewFinalize } from "@/components/story/preview-finalize";
import { ExportVideo } from "@/components/story/export-video";

const STEPS = [
  { id: "script", label: "Script" },
  { id: "scenes", label: "Scenes" },
  { id: "shots", label: "Shots" },
  { id: "audio", label: "Audio" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Export" },
];

interface Scene {
  id: string;
  sceneNumber: number;
  narration: string;
  visualDescription: string;
  imageUrl?: string;
}

export default function StoryCreate() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const templateId = params.template as string;
  
  const template = STORY_TEMPLATES.find(t => t.id === templateId);
  
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  // Script step state
  const [topic, setTopic] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  
  // Scenes state
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  // Audio state
  const [voiceover, setVoiceover] = useState("");
  const [backgroundMusic, setBackgroundMusic] = useState("");

  // Track the previous script to detect regeneration
  const [previousScript, setPreviousScript] = useState("");

  // Initialize scenes from generated script
  useEffect(() => {
    if (generatedScript && generatedScript !== previousScript) {
      const scriptScenes = generatedScript.split(/Scene \d+:/).filter(Boolean);
      const parsedScenes: Scene[] = scriptScenes.map((sceneText, index) => {
        const lines = sceneText.trim().split('\n');
        const visualDescription = lines[0].trim();
        const narration = lines.find(l => l.startsWith('Narrator:'))?.replace('Narrator:', '').trim() || '';
        
        return {
          id: `scene-${Date.now()}-${index + 1}`,
          sceneNumber: index + 1,
          narration,
          visualDescription,
          imageUrl: undefined, // Clear images when script regenerates
        };
      });
      setScenes(parsedScenes);
      setPreviousScript(generatedScript);
    }
  }, [generatedScript, previousScript]);

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeStep);

  const markStepComplete = () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }
  };

  const handleNext = () => {
    markStepComplete();
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setActiveStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(STEPS[prevIndex].id);
    }
  };

  const handleExport = () => {
    markStepComplete();
    setLocation("/stories");
  };

  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Template not found</h1>
          <Link href="/stories">
            <Button className="mt-4">Back to Templates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back-to-stories">
                <Link href="/stories">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <div>
                <h1 className="text-sm font-semibold">New Story</h1>
                <p className="text-xs text-muted-foreground">{template.name}</p>
              </div>
            </div>

            {/* Center: Step Navigation */}
            <div className="flex items-center gap-2">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => {
                    // Allow navigation to completed steps or current step
                    if (isStepCompleted(step.id) || step.id === activeStep) {
                      setActiveStep(step.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : isStepCompleted(step.id)
                      ? "bg-muted text-foreground hover-elevate cursor-pointer"
                      : "text-muted-foreground cursor-default"
                  }`}
                  disabled={!isStepCompleted(step.id) && step.id !== activeStep}
                  data-testid={`button-step-${step.id}`}
                >
                  {isStepCompleted(step.id) && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span className="whitespace-nowrap">{step.label}</span>
                </button>
              ))}
            </div>

            {/* Right: Theme Toggle */}
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          {activeStep === "script" && (
            <WriteScript
              onNext={handleNext}
              onBack={() => setLocation("/stories")}
              topic={topic}
              setTopic={setTopic}
              generatedScript={generatedScript}
              setGeneratedScript={setGeneratedScript}
            />
          )}
          
          {activeStep === "scenes" && (
            <ReviewScenes
              onNext={handleNext}
              onBack={handleBack}
              scenes={scenes}
              setScenes={setScenes}
            />
          )}
          
          {activeStep === "shots" && (
            <EditShots
              onNext={handleNext}
              onBack={handleBack}
              scenes={scenes}
              setScenes={setScenes}
            />
          )}
          
          {activeStep === "audio" && (
            <AddAudio
              onNext={handleNext}
              onBack={handleBack}
              voiceover={voiceover}
              setVoiceover={setVoiceover}
              backgroundMusic={backgroundMusic}
              setBackgroundMusic={setBackgroundMusic}
            />
          )}
          
          {activeStep === "preview" && (
            <PreviewFinalize
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {activeStep === "export" && (
            <ExportVideo
              onBack={handleBack}
              onExport={handleExport}
              sceneCount={scenes.length}
              templateName={template.name}
            />
          )}
        </div>
      </main>
    </div>
  );
}
