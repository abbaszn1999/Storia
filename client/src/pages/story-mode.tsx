import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { StoryScene, Story } from "@shared/schema";
import type { StoryTemplate } from "@/constants/story-templates";
import { STORY_TEMPLATES } from "@/constants/story-templates";

const steps = [
  { id: "script", label: "Script" },
  { id: "scenes", label: "Scenes" },
  { id: "images", label: "Images" },
  { id: "effects", label: "Effects" },
  { id: "voiceover", label: "Voiceover" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Export" },
];

export default function StoryMode() {
  const params = useParams();
  const templateId = params.template as string;
  
  const template = STORY_TEMPLATES.find(t => t.id === templateId);
  
  const [storyTitle] = useState("Untitled Story");
  const [activeStep, setActiveStep] = useState("script");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [storyId] = useState(`story-${Date.now()}`);
  const [workspaceId] = useState("workspace-1");
  const [script, setScript] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [voiceoverUrl, setVoiceoverUrl] = useState("");

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
            {/* Left: Navigation & Branding */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild data-testid="button-back">
                <Link href="/stories">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <div>
                <h1 className="text-sm font-semibold">{storyTitle}</h1>
                <p className="text-xs text-muted-foreground">{template.name}</p>
              </div>
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
          {/* TODO: Render step components based on activeStep */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Step: {activeStep} - Template: {template.name}
            </p>
            <Button className="mt-4" onClick={handleNext}>
              Next Step
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
