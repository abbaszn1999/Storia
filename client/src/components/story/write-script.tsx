import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WriteScriptProps {
  onNext: () => void;
  onBack: () => void;
  topic: string;
  setTopic: (topic: string) => void;
  generatedScript: string;
  setGeneratedScript: (script: string) => void;
}

export function WriteScript({
  onNext,
  onBack,
  topic,
  setTopic,
  generatedScript,
  setGeneratedScript,
}: WriteScriptProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const mockScript = `Scene 1: A programmer is staring at a screen full of errors. The frustration is visible.
Narrator: "Tired of endless bugs and confusing code?"

Scene 2: The programmer discovers Kalema. Their eyes light up.
Narrator: "Meet Kalema, your AI video creation partner."

Scene 3: Quick cuts of amazing videos being created effortlessly with Kalema.
Narrator: "Create stunning videos from simple text prompts. No experience needed."

Scene 4: The programmer, now relaxed and happy, shares their new video. It's getting lots of likes.
Narrator: "Transform your ideas into engaging content in minutes."`;
    
    setGeneratedScript(mockScript);
    setIsGenerating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Write Your Script</h1>
        <p className="text-lg text-muted-foreground">
          Describe your video topic, and our AI will generate a script for you.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your video topic..."
          className="min-h-32 text-base border-2"
          data-testid="input-topic"
        />

        <Button
          onClick={handleGenerateScript}
          disabled={!topic || isGenerating}
          className="w-full"
          size="lg"
          data-testid="button-generate-script"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          {isGenerating ? "Generating..." : "Generate Script"}
        </Button>
      </div>

      {generatedScript && (
        <div className="border-2 rounded-lg bg-muted/30">
          <ScrollArea className="h-64 p-4">
            <div className="text-sm whitespace-pre-wrap" data-testid="text-generated-script">
              {generatedScript}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!generatedScript}
          data-testid="button-next-scenes"
        >
          Next: Scenes
        </Button>
      </div>
    </div>
  );
}
