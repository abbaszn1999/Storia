import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Layers,
  Music,
  Download,
  Check
} from "lucide-react";
import { Link } from "wouter";
import { LogoAnimationWorkflow } from "@/components/logo-animation-workflow";

const STEPS = [
  { id: 0, label: "Logo & Brand", icon: ImageIcon, description: "Upload and configure" },
  { id: 1, label: "Animation Style", icon: Wand2, description: "Motion approach" },
  { id: 2, label: "Effects", icon: Layers, description: "Visual enhancements" },
  { id: 3, label: "Audio", icon: Music, description: "Sound design" },
  { id: 4, label: "Export", icon: Download, description: "Generate & download" }
];

export default function LogoAnimationModePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setMaxVisitedStep(prev => Math.max(prev, step));
  }, []);

  const handleStepClick = (stepId: number) => {
    if (stepId <= maxVisitedStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/videos">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Logo Animation</h1>
                <Badge variant="secondary" className="text-xs">New Project</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Create animated brand moments</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" data-testid="button-save-project">
              Save Draft
            </Button>
            <Button variant="outline" size="sm" data-testid="button-preview">
              Preview
            </Button>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = step.id < currentStep;
              const isAccessible = step.id <= maxVisitedStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isAccessible}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all w-full
                      ${isActive 
                        ? "bg-primary text-primary-foreground" 
                        : isCompleted
                          ? "bg-primary/20 text-primary"
                          : isAccessible
                            ? "bg-muted hover-elevate cursor-pointer"
                            : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                      }
                    `}
                    data-testid={`step-${step.id}`}
                  >
                    <div className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                      ${isCompleted 
                        ? "bg-primary text-primary-foreground" 
                        : isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-background/50"
                      }
                    `}>
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <step.icon className="h-3 w-3" />
                      )}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-[10px] opacity-70">{step.description}</p>
                    </div>
                    <span className="text-sm font-medium lg:hidden">{step.label}</span>
                  </button>
                  
                  {index < STEPS.length - 1 && (
                    <div className={`
                      h-px w-4 mx-1
                      ${step.id < currentStep ? "bg-primary" : "bg-border"}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <LogoAnimationWorkflow 
        currentStep={currentStep} 
        onStepChange={handleStepChange} 
      />
    </div>
  );
}
