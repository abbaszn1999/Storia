import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Play, RefreshCw } from "lucide-react";

const VARIATION_TYPES = [
  { id: "evolving", label: "Same Scene Evolving", description: "Time passing, light changing" },
  { id: "angles", label: "Different Angles", description: "Same subject, new perspectives" },
  { id: "elements", label: "Different Elements", description: "Varied subjects, same mood" },
  { id: "zoom", label: "Zoom Journey", description: "Progressive zoom in or out" },
];

const VISUAL_RHYTHMS = [
  { id: "constant", label: "Constant Calm", description: "Steady, unchanging pace" },
  { id: "breathing", label: "Breathing", description: "Subtle rhythmic pulse" },
  { id: "building", label: "Building", description: "Gradually intensifying" },
  { id: "wave", label: "Wave", description: "Rising and falling" },
];

interface FlowDesignTabProps {
  animationMode: 'image-transitions' | 'video-animation';
  variationType: string;
  visualRhythm: string;
  onVariationTypeChange: (type: string) => void;
  onVisualRhythmChange: (rhythm: string) => void;
  onNext: () => void;
}

export function FlowDesignTab({
  animationMode,
  variationType,
  visualRhythm,
  onVariationTypeChange,
  onVisualRhythmChange,
  onNext,
}: FlowDesignTabProps) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Design the Flow</h2>
        <p className="text-muted-foreground">
          Define how your visual experience unfolds over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Variation Type */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Variation Type</Label>
              <p className="text-sm text-muted-foreground">
                How should segments differ from each other?
              </p>
              <div className="space-y-2">
                {VARIATION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => onVariationTypeChange(type.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all hover-elevate ${
                      variationType === type.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-variation-${type.id}`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visual Rhythm */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Visual Rhythm</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {VISUAL_RHYTHMS.map((rhythm) => (
                  <button
                    key={rhythm.id}
                    onClick={() => onVisualRhythmChange(rhythm.id)}
                    className={`p-3 rounded-lg border text-left transition-all hover-elevate ${
                      visualRhythm === rhythm.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-rhythm-${rhythm.id}`}
                  >
                    <div className="font-medium text-sm">{rhythm.label}</div>
                    <div className="text-xs text-muted-foreground">{rhythm.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          size="lg"
          data-testid="button-continue-flow"
        >
          Continue to Composition
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
