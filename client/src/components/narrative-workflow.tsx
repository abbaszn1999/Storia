import { useState } from "react";
import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [script, setScript] = useState("");

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

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
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  activeStep === step.id ? "border-primary-foreground" : "border-muted-foreground"
                }`}>
                  {index + 1}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium whitespace-nowrap">{step.label}</div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="h-0.5 w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps.find(s => s.id === activeStep)?.label}</CardTitle>
          <CardDescription>{steps.find(s => s.id === activeStep)?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {activeStep === "script" && (
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your script here... or let AI help you write it."
                className="min-h-64"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                data-testid="input-script"
              />
              <div className="flex justify-between items-center">
                <Button variant="outline" data-testid="button-ai-assist">AI Assist</Button>
                <Button onClick={handleNext} disabled={!script} data-testid="button-next">
                  Continue to Breakdown
                </Button>
              </div>
            </div>
          )}

          {activeStep === "breakdown" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI will automatically break down your script into scenes and shots.
              </p>
              <div className="space-y-2">
                <Badge>Scene 1: 3 shots</Badge>
                <Badge>Scene 2: 2 shots</Badge>
                <Badge>Scene 3: 4 shots</Badge>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNext} data-testid="button-next">
                  Continue to World & Cast
                </Button>
              </div>
            </div>
          )}

          {activeStep === "world" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define your characters, setting, lighting, and mood.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleNext} data-testid="button-next">
                  Continue to Storyboard
                </Button>
              </div>
            </div>
          )}

          {activeStep === "storyboard" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate visual frames for each shot in your storyboard.
              </p>
              <div className="flex justify-end">
                <Button onClick={handleNext} data-testid="button-next">
                  Continue to Animatic
                </Button>
              </div>
            </div>
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
