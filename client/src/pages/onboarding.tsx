import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, ArrowRight, ArrowLeft, Sparkles, Video, Users, Briefcase, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const workspaceSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required").max(50, "Name must be 50 characters or less"),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface OnboardingData {
  useCase: string;
  contentType: string;
  experienceLevel: string;
}

const useCaseOptions = [
  {
    id: "personal",
    icon: Users,
    title: "Personal Projects",
    description: "Create videos for fun, hobbies, or personal brand",
  },
  {
    id: "business",
    icon: Briefcase,
    title: "Business / Marketing",
    description: "Create content for my company or clients",
  },
  {
    id: "creator",
    icon: Video,
    title: "Content Creator",
    description: "Build an audience on social media platforms",
  },
];

const contentTypeOptions = [
  { id: "short_form", label: "Short-form videos (TikTok, Reels, Shorts)" },
  { id: "long_form", label: "Long-form videos (YouTube, documentaries)" },
  { id: "stories", label: "Stories and narratives" },
  { id: "mixed", label: "A mix of everything" },
];

const experienceLevelOptions = [
  { id: "beginner", label: "New to video creation" },
  { id: "intermediate", label: "Some experience with video editing" },
  { id: "advanced", label: "Professional video creator" },
];

type Step = "welcome" | "use-case" | "content-type" | "experience" | "workspace";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("welcome");
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    useCase: "",
    contentType: "",
    experienceLevel: "",
  });

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      workspaceName: "My Workspace",
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (data: { workspaceName: string; onboardingData: OnboardingData }) => {
      const response = await apiRequest("POST", "/api/onboarding/complete", data);
      const result = await response.json();
      if (!response.ok) {
        throw result;
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({
        title: "Welcome to Storia!",
        description: "Your workspace is ready. Let's create something amazing.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to complete setup",
        description: error.message || "Please try again",
      });
    },
  });

  const handleNext = () => {
    const steps: Step[] = ["welcome", "use-case", "content-type", "experience", "workspace"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ["welcome", "use-case", "content-type", "experience", "workspace"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = (data: WorkspaceFormData) => {
    completeMutation.mutate({
      workspaceName: data.workspaceName,
      onboardingData,
    });
  };

  const canProceed = () => {
    switch (step) {
      case "welcome":
        return true;
      case "use-case":
        return !!onboardingData.useCase;
      case "content-type":
        return !!onboardingData.contentType;
      case "experience":
        return !!onboardingData.experienceLevel;
      case "workspace":
        return true;
      default:
        return false;
    }
  };

  const getStepNumber = () => {
    const steps: Step[] = ["welcome", "use-case", "content-type", "experience", "workspace"];
    return steps.indexOf(step);
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Storia</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i <= getStepNumber() ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {getStepNumber() + 1} of {totalSteps}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === "welcome" && (
                <Card>
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to Storia</CardTitle>
                    <CardDescription className="text-base">
                      Let's personalize your experience. We'll ask a few quick questions to help you get started.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handleNext}
                      data-testid="button-get-started"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === "use-case" && (
                <Card>
                  <CardHeader>
                    <CardTitle>What brings you to Storia?</CardTitle>
                    <CardDescription>
                      This helps us tailor your experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {useCaseOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setOnboardingData({ ...onboardingData, useCase: option.id })}
                        className={cn(
                          "w-full p-4 rounded-lg border text-left transition-all hover-elevate",
                          onboardingData.useCase === option.id
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                        data-testid={`button-usecase-${option.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            onboardingData.useCase === option.id ? "bg-primary/10 text-primary" : "bg-muted"
                          )}>
                            <option.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{option.title}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                          {onboardingData.useCase === option.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={handleBack} data-testid="button-back">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={handleNext} 
                        disabled={!canProceed()}
                        data-testid="button-next"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === "content-type" && (
                <Card>
                  <CardHeader>
                    <CardTitle>What type of content will you create?</CardTitle>
                    <CardDescription>
                      Select your primary content focus
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={onboardingData.contentType}
                      onValueChange={(value) => setOnboardingData({ ...onboardingData, contentType: value })}
                      className="space-y-3"
                    >
                      {contentTypeOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-content-${option.id}`} />
                          <Label htmlFor={option.id} className="cursor-pointer flex-1">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="flex gap-3 pt-6">
                      <Button variant="outline" onClick={handleBack} data-testid="button-back">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={handleNext} 
                        disabled={!canProceed()}
                        data-testid="button-next"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === "experience" && (
                <Card>
                  <CardHeader>
                    <CardTitle>What's your experience level?</CardTitle>
                    <CardDescription>
                      We'll customize tips and features based on your expertise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={onboardingData.experienceLevel}
                      onValueChange={(value) => setOnboardingData({ ...onboardingData, experienceLevel: value })}
                      className="space-y-3"
                    >
                      {experienceLevelOptions.map((option) => (
                        <div key={option.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-experience-${option.id}`} />
                          <Label htmlFor={option.id} className="cursor-pointer flex-1">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="flex gap-3 pt-6">
                      <Button variant="outline" onClick={handleBack} data-testid="button-back">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={handleNext} 
                        disabled={!canProceed()}
                        data-testid="button-next"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === "workspace" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create your first workspace</CardTitle>
                    <CardDescription>
                      Workspaces help you organize your projects. You can create more later.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleComplete)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="workspaceName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Workspace Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="My Workspace" 
                                  {...field} 
                                  data-testid="input-workspace-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleBack}
                            data-testid="button-back"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={completeMutation.isPending}
                            data-testid="button-complete"
                          >
                            {completeMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Setting up...
                              </>
                            ) : (
                              <>
                                Complete Setup
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
