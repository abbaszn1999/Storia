import { useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AmbientVisualWorkflow } from "@/components/ambient-visual-workflow";
import { ArrowLeft, Check, Waves } from "lucide-react";

const STEPS = [
  { id: 0, label: "Atmosphere" },
  { id: 1, label: "Visual World" },
  { id: 2, label: "Flow Design" },
  { id: 3, label: "Composition" },
  { id: 4, label: "Preview" },
  { id: 5, label: "Export" },
];

export default function AmbientVisualModePage() {
  const params = useParams<{ videoId?: string }>();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const videoId = params.videoId || urlParams.get("id") || "new";
  const workspaceId = urlParams.get("workspace") || "default";
  const videoTitle = urlParams.get("title") || "Untitled Ambient Visual";
  
  const [activeStep, setActiveStep] = useState(0);
  const [highestCompletedStep, setHighestCompletedStep] = useState(-1);

  const isStepCompleted = (stepId: number) => stepId <= highestCompletedStep;

  const handleStepChange = (step: number) => {
    if (step > highestCompletedStep + 1) return;
    setActiveStep(step);
  };

  const handleNext = () => {
    const nextStep = activeStep + 1;
    if (nextStep <= STEPS.length - 1) {
      setHighestCompletedStep(Math.max(highestCompletedStep, activeStep));
      setActiveStep(nextStep);
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
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Waves className="h-3 w-3" />
                  Ambient Visual
                </Badge>
                <h1 className="text-sm font-semibold truncate max-w-[200px]" data-testid="text-video-title">
                  {videoTitle}
                </h1>
              </div>
            </div>

            {/* Center: Step Navigation */}
            <div className="flex items-center gap-3">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(step.id)}
                  disabled={step.id > highestCompletedStep + 1}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover-elevate ${
                    activeStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : isStepCompleted(step.id)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                  } ${step.id > highestCompletedStep + 1 ? "opacity-50 cursor-not-allowed" : ""}`}
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
        <div className="max-w-[1600px] mx-auto">
          <AmbientVisualWorkflow 
            activeStep={activeStep}
            onStepChange={(step) => {
              setHighestCompletedStep(prev => Math.max(prev, step - 1));
              setActiveStep(step);
            }}
            projectName={videoTitle}
          />
        </div>
      </main>
    </div>
  );
}
