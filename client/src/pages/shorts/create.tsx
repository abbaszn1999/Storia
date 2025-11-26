import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  ArrowRight, 
  Wand2, 
  Scissors, 
  Clock, 
  Play, 
  Check, 
  Loader2,
  Youtube,
  Instagram,
  Calendar,
  Share2,
  Sparkles,
  Video
} from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";

interface HookMoment {
  id: string;
  timestamp: string;
  startSeconds: number;
  endSeconds: number;
  hookType: "emotional" | "action" | "reveal" | "humor" | "dramatic";
  description: string;
  suggestedCaption: string;
  confidence: number;
  selected: boolean;
}

const HOOK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  emotional: { label: "Emotional", color: "bg-pink-500/10 text-pink-500" },
  action: { label: "Action", color: "bg-orange-500/10 text-orange-500" },
  reveal: { label: "Reveal", color: "bg-purple-500/10 text-purple-500" },
  humor: { label: "Humor", color: "bg-yellow-500/10 text-yellow-500" },
  dramatic: { label: "Dramatic", color: "bg-red-500/10 text-red-500" },
};

const PLATFORMS = [
  { id: "youtube", name: "YouTube Shorts", icon: Youtube },
  { id: "tiktok", name: "TikTok", icon: SiTiktok },
  { id: "instagram", name: "Instagram Reels", icon: Instagram },
  { id: "facebook", name: "Facebook Reels", icon: SiFacebook },
];

const STEPS = [
  { id: "analysis", label: "Analysis", icon: Wand2 },
  { id: "selection", label: "Hook Selection", icon: Scissors },
  { id: "publish", label: "Publishing", icon: Share2 },
];

export default function CreateShorts() {
  const [, params] = useRoute("/shorts/create/:videoId");
  const [, navigate] = useLocation();
  const videoId = params?.videoId;

  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [hooks, setHooks] = useState<HookMoment[]>([]);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishType, setPublishType] = useState<"instant" | "schedule">("instant");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (currentStep === 0) {
      startAnalysis();
    }
  }, []);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    clearInterval(progressInterval);
    setAnalysisProgress(100);

    const mockHooks: HookMoment[] = [
      {
        id: "hook-1",
        timestamp: "0:12 - 0:24",
        startSeconds: 12,
        endSeconds: 24,
        hookType: "dramatic",
        description: "Intense opening scene with dramatic reveal of the main character",
        suggestedCaption: "You won't believe what happens next... 🎬",
        confidence: 94,
        selected: true,
      },
      {
        id: "hook-2",
        timestamp: "0:45 - 0:58",
        startSeconds: 45,
        endSeconds: 58,
        hookType: "emotional",
        description: "Emotional turning point with powerful character moment",
        suggestedCaption: "This scene hits different 💔 #storytelling",
        confidence: 89,
        selected: true,
      },
      {
        id: "hook-3",
        timestamp: "1:22 - 1:35",
        startSeconds: 82,
        endSeconds: 95,
        hookType: "action",
        description: "High-energy action sequence with stunning visuals",
        suggestedCaption: "When the action kicks in 🔥 #epic",
        confidence: 87,
        selected: false,
      },
      {
        id: "hook-4",
        timestamp: "2:05 - 2:18",
        startSeconds: 125,
        endSeconds: 138,
        hookType: "reveal",
        description: "Plot twist reveal that changes everything",
        suggestedCaption: "Plot twist! Did you see that coming? 😱",
        confidence: 92,
        selected: true,
      },
      {
        id: "hook-5",
        timestamp: "3:10 - 3:25",
        startSeconds: 190,
        endSeconds: 205,
        hookType: "humor",
        description: "Comedic moment that provides light relief",
        suggestedCaption: "I can't stop laughing at this 😂",
        confidence: 78,
        selected: false,
      },
    ];

    setHooks(mockHooks);
    setIsAnalyzing(false);
    setCurrentStep(1);
  };

  const toggleHook = (hookId: string) => {
    setHooks((prev) =>
      prev.map((hook) =>
        hook.id === hookId ? { ...hook, selected: !hook.selected } : hook
      )
    );
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const selectedHooks = hooks.filter((h) => h.selected);
  const canProceed = selectedHooks.length > 0;
  const canGenerate = selectedHooks.length > 0 && selectedPlatforms.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setIsGenerating(false);
    navigate("/videos");
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${
                  isCompleted ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderAnalysisStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Analyzing Your Video
        </CardTitle>
        <CardDescription>
          AI is scanning your video to find the best moments for short-form clips
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {analysisProgress < 30
                ? "Scanning video frames..."
                : analysisProgress < 60
                ? "Identifying hook moments..."
                : analysisProgress < 90
                ? "Generating captions..."
                : "Finalizing analysis..."}
            </span>
            <span className="font-medium">{Math.round(analysisProgress)}%</span>
          </div>
          <Progress value={analysisProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">AI Hook Detection</p>
              <p className="text-xs text-muted-foreground">Finding viral moments</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Scissors className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Smart Clipping</p>
              <p className="text-xs text-muted-foreground">15-60 second segments</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSelectionStep = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Select Hook Moments
          </CardTitle>
          <CardDescription>
            AI found {hooks.length} potential hooks. Select the ones you want to create shorts from.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hooks.map((hook) => (
            <div
              key={hook.id}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                hook.selected
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/30 hover:bg-muted/50"
              }`}
              onClick={() => toggleHook(hook.id)}
              data-testid={`hook-card-${hook.id}`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={hook.selected}
                  onCheckedChange={() => toggleHook(hook.id)}
                  className="mt-1"
                  data-testid={`checkbox-hook-${hook.id}`}
                />
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {hook.timestamp}
                      </Badge>
                      <Badge className={HOOK_TYPE_LABELS[hook.hookType].color}>
                        {HOOK_TYPE_LABELS[hook.hookType].label}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      {hook.confidence}% confidence
                    </Badge>
                  </div>
                  
                  <p className="text-sm">{hook.description}</p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Suggested caption:</span>
                    <span className="text-xs italic">{hook.suggestedCaption}</span>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="shrink-0">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate("/videos")}
          data-testid="button-cancel"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedHooks.length} clips selected
          </span>
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={!canProceed}
            data-testid="button-next-publish"
          >
            Configure Publishing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPublishStep = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Clips to Generate
          </CardTitle>
          <CardDescription>
            {selectedHooks.length} short clips will be created from your video
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedHooks.map((hook) => (
              <Badge key={hook.id} variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                {hook.timestamp}
                <span className="mx-1">-</span>
                <span className={HOOK_TYPE_LABELS[hook.hookType].color.replace("bg-", "").replace("/10", "").split(" ")[0]}>
                  {HOOK_TYPE_LABELS[hook.hookType].label}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Publishing Platforms
          </CardTitle>
          <CardDescription>
            Select where to publish your generated shorts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted bg-muted/30 hover:bg-muted/50"
                  }`}
                  data-testid={`button-platform-${platform.id}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{platform.name}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 ml-auto text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Publishing Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={publishType}
            onValueChange={(v) => setPublishType(v as "instant" | "schedule")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="instant" id="instant" data-testid="radio-instant" />
              <Label htmlFor="instant" className="cursor-pointer">
                <div>
                  <p className="font-medium">Publish Immediately</p>
                  <p className="text-sm text-muted-foreground">
                    Clips will be published as soon as they're generated
                  </p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="schedule" id="schedule" data-testid="radio-schedule" />
              <Label htmlFor="schedule" className="cursor-pointer">
                <div>
                  <p className="font-medium">Schedule for Later</p>
                  <p className="text-sm text-muted-foreground">
                    Choose when to publish each clip
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {publishType === "schedule" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="schedule-date" className="text-sm">Start Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  data-testid="input-schedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time" className="text-sm">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  data-testid="input-schedule-time"
                />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">
                  Clips will be published automatically at the specified times, spaced throughout the day
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          data-testid="button-back-selection"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Selection
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          size="lg"
          data-testid="button-generate-shorts"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Clips...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4 mr-2" />
              Generate {selectedHooks.length} Shorts
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/videos")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create Shorts</h1>
              <p className="text-xs text-muted-foreground">
                Generate short-form clips from your video
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        {!isAnalyzing && renderStepIndicator()}
        
        {currentStep === 0 && renderAnalysisStep()}
        {currentStep === 1 && renderSelectionStep()}
        {currentStep === 2 && renderPublishStep()}
      </main>
    </div>
  );
}
