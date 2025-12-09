import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Clock,
  Monitor,
  Loader2,
  FileText,
  Wand2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16", description: "Vertical (TikTok, Reels)" },
  { value: "16:9", label: "16:9", description: "Horizontal (YouTube)" },
  { value: "1:1", label: "1:1", description: "Square (Instagram)" },
  { value: "4:5", label: "4:5", description: "Portrait (Instagram Feed)" },
];

const DURATION_PRESETS = [
  { value: 15, label: "15s", description: "Quick hook" },
  { value: 30, label: "30s", description: "Short story" },
  { value: 45, label: "45s", description: "Standard" },
  { value: 60, label: "60s", description: "Full story" },
];

interface ConceptScriptProps {
  onNext: () => void;
  onBack: () => void;
  topic: string;
  setTopic: (topic: string) => void;
  generatedScript: string;
  setGeneratedScript: (script: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  duration: number;
  setDuration: (duration: number) => void;
  templateName: string;
  templateStructure?: string[];
}

export function ConceptScript({
  onNext,
  onBack,
  topic,
  setTopic,
  generatedScript,
  setGeneratedScript,
  aspectRatio,
  setAspectRatio,
  duration,
  setDuration,
  templateName,
  templateStructure,
}: ConceptScriptProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/problem-solution/idea", {
        ideaText: topic,
        durationSeconds: duration,
        aspectRatio,
      });
      const data = await res.json();

      const structure = templateStructure || ["Hook", "Problem", "Solution", "Call-to-Action"];
      const sceneCount = structure.length;
      const sceneDuration = Math.max(5, Math.floor(duration / sceneCount));

      const angles: string[] = data?.angles || [];
      const hook: string = data?.hook || topic;
      const idea: string = data?.idea || topic;
      const cta: string = data?.cta || "Try it now.";

      let script = "";
      script += `Scene 1: Hook\n${hook}\nDuration: ${sceneDuration}s\n\n`;
      angles.forEach((angle, i) => {
        script += `Scene ${i + 2}: ${structure[i + 1] || "Detail"}\n${angle}\nDuration: ${sceneDuration}s\n\n`;
      });
      script += `CTA: ${cta}\nIdea: ${idea}\n`;

      setGeneratedScript(script);
    } catch (error) {
      console.error("Generate script failed, falling back:", error);
      const structure = templateStructure || ["Hook", "Problem", "Solution", "Call-to-Action"];
      const sceneCount = structure.length;
      const sceneDuration = Math.floor(duration / sceneCount);

      let mockScript = "";
      structure.forEach((scene, index) => {
        mockScript += `Scene ${index + 1}: ${scene}\n`;
        mockScript += `[Visual: ${getVisualPrompt(scene, topic, index)}]\n`;
        mockScript += `Narrator: "${getSceneNarration(scene, topic, index)}"\n`;
        mockScript += `Duration: ${sceneDuration}s\n\n`;
      });
      setGeneratedScript(mockScript);
    } finally {
      setIsGenerating(false);
    }
  };

  const getVisualPrompt = (scene: string, topic: string, index: number): string => {
    const prompts: Record<string, string[]> = {
      "Problem-Solution": [
        `Eye-catching hook shot introducing ${topic}, dramatic lighting`,
        `Visual representation of the problem or challenge with ${topic}`,
        `Clean, professional shot showing the solution in action`,
        `Compelling call-to-action scene with brand elements`,
      ],
      "Tease & Reveal": [
        `Mysterious, attention-grabbing teaser shot for ${topic}`,
        `Building curiosity with partial reveals and shadows`,
        `Tension-building visuals leading to the reveal`,
        `Grand reveal moment showcasing ${topic} in full glory`,
      ],
      "Before & After": [
        `Clear "before" state showing the initial condition`,
        `Transition scene capturing the transformation process`,
        `Stunning "after" state with dramatic improvement`,
        `Results showcase with metrics or testimonials`,
      ],
      "Myth-Busting": [
        `Visual representation of the common myth about ${topic}`,
        `Evidence and facts debunking the myth`,
        `Truth revealed with authoritative visuals`,
        `Key takeaway with memorable imagery`,
      ],
    };
    
    const templatePrompts = prompts[templateName] || prompts["Problem-Solution"];
    return templatePrompts[index] || `Scene ${index + 1} visual for ${topic}`;
  };

  const getSceneNarration = (scene: string, topic: string, index: number): string => {
    const narrations: Record<string, string[]> = {
      "Problem-Solution": [
        `Struggling with ${topic}? You're not alone.`,
        `The real problem is deeper than you think.`,
        `Here's the solution that actually works.`,
        `Take action now and see the difference.`,
      ],
      "Tease & Reveal": [
        `Something incredible is coming...`,
        `Can you guess what this is?`,
        `The moment you've been waiting for...`,
        `Introducing: the game-changer.`,
      ],
      "Before & After": [
        `This is where it all started.`,
        `Watch the transformation begin.`,
        `And now, the incredible result.`,
        `The difference is undeniable.`,
      ],
      "Myth-Busting": [
        `You've probably heard this myth before.`,
        `Here's why it's completely wrong.`,
        `The truth will surprise you.`,
        `Now you know the real facts.`,
      ],
    };
    
    const templateNarrations = narrations[templateName] || narrations["Problem-Solution"];
    return templateNarrations[index] || `Scene ${index + 1} for ${topic}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Concept & Script</h1>
        <p className="text-lg text-muted-foreground">
          Define your video settings and generate an AI-powered script.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Video Topic
                </Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`Describe what your ${templateName} video should be about...`}
                  className="min-h-28 text-base"
                  data-testid="input-topic"
                />
              </div>

              <Button
                onClick={handleGenerateScript}
                disabled={!topic || isGenerating}
                className="w-full"
                size="lg"
                data-testid="button-generate-script"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Script with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedScript && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Generated Script
                  </Label>
                  <Badge variant="secondary">{templateName}</Badge>
                </div>
                <ScrollArea className="h-72 rounded-lg border bg-muted/30 p-4">
                  <Textarea
                    value={generatedScript}
                    onChange={(e) => setGeneratedScript(e.target.value)}
                    className="min-h-64 border-0 bg-transparent resize-none focus-visible:ring-0 text-sm"
                    data-testid="textarea-script"
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Aspect Ratio
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        aspectRatio === ratio.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`button-ratio-${ratio.value.replace(":", "-")}`}
                    >
                      <div className="font-semibold text-sm">{ratio.label}</div>
                      <div className="text-xs text-muted-foreground">{ratio.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Duration
                </Label>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{duration}s</span>
                    <Badge variant="outline">
                      {DURATION_PRESETS.find(p => p.value === duration)?.description || "Custom"}
                    </Badge>
                  </div>
                  <Slider
                    value={[duration]}
                    onValueChange={([value]) => setDuration(value)}
                    min={15}
                    max={60}
                    step={5}
                    className="w-full"
                    data-testid="slider-duration"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>15s</span>
                    <span>30s</span>
                    <span>45s</span>
                    <span>60s</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {templateStructure && (
            <Card>
              <CardContent className="pt-6">
                <Label className="text-base font-medium mb-3 block">Story Structure</Label>
                <div className="space-y-2">
                  {templateStructure.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!generatedScript}
          data-testid="button-next-storyboard"
        >
          Next: Storyboard
        </Button>
      </div>
    </div>
  );
}
