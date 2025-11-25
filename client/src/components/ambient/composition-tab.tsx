import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft as ArrowLeftIcon, 
  ArrowRight as ArrowRightIcon,
  Loader2,
  Image,
  Clock,
  Wand2
} from "lucide-react";

interface Segment {
  id: string;
  keyframeUrl: string | null;
  duration: number;
  motionDirection: "up" | "down" | "left" | "right" | "static";
  layers: {
    background: boolean;
    midground: boolean;
    foreground: boolean;
  };
  effects: {
    particles: boolean;
    lightRays: boolean;
    fog: boolean;
  };
}

interface CompositionTabProps {
  segments: Segment[];
  onSegmentsChange: (segments: Segment[]) => void;
  onNext: () => void;
  segmentCount: number;
}

const MOTION_DIRECTIONS = [
  { id: "static", label: "Static", icon: null },
  { id: "up", label: "Up", icon: ArrowUp },
  { id: "down", label: "Down", icon: ArrowDown },
  { id: "left", label: "Left", icon: ArrowLeftIcon },
  { id: "right", label: "Right", icon: ArrowRightIcon },
];

export function CompositionTab({
  segments,
  onSegmentsChange,
  onNext,
  segmentCount,
}: CompositionTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSegment, setGeneratingSegment] = useState<string | null>(null);

  const initializeSegments = () => {
    const newSegments: Segment[] = Array.from({ length: segmentCount }, (_, i) => ({
      id: `segment-${i + 1}`,
      keyframeUrl: null,
      duration: Math.floor(60 / segmentCount),
      motionDirection: "static" as const,
      layers: {
        background: true,
        midground: true,
        foreground: false,
      },
      effects: {
        particles: false,
        lightRays: false,
        fog: false,
      },
    }));
    onSegmentsChange(newSegments);
  };

  const generateKeyframe = (segmentId: string) => {
    setGeneratingSegment(segmentId);
    setTimeout(() => {
      const updated = segments.map(s => 
        s.id === segmentId 
          ? { ...s, keyframeUrl: `https://picsum.photos/seed/${Date.now()}-${segmentId}/640/360` }
          : s
      );
      onSegmentsChange(updated);
      setGeneratingSegment(null);
    }, 2000);
  };

  const generateAllKeyframes = () => {
    setIsGenerating(true);
    const updated = segments.map((s, i) => ({
      ...s,
      keyframeUrl: `https://picsum.photos/seed/${Date.now()}-${i}/640/360`,
    }));
    setTimeout(() => {
      onSegmentsChange(updated);
      setIsGenerating(false);
    }, 3000);
  };

  const updateSegment = (segmentId: string, updates: Partial<Segment>) => {
    onSegmentsChange(segments.map(s => 
      s.id === segmentId ? { ...s, ...updates } : s
    ));
  };

  const updateSegmentDuration = (segmentId: string, duration: number) => {
    updateSegment(segmentId, { duration });
  };

  const updateSegmentMotion = (segmentId: string, direction: Segment["motionDirection"]) => {
    updateSegment(segmentId, { motionDirection: direction });
  };

  const toggleLayer = (segmentId: string, layer: keyof Segment["layers"]) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment) {
      updateSegment(segmentId, {
        layers: { ...segment.layers, [layer]: !segment.layers[layer] }
      });
    }
  };

  const toggleEffect = (segmentId: string, effect: keyof Segment["effects"]) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment) {
      updateSegment(segmentId, {
        effects: { ...segment.effects, [effect]: !segment.effects[effect] }
      });
    }
  };

  if (segments.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Compose the Visuals</h2>
          <p className="text-muted-foreground">
            Design each segment of your ambient experience
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Initialize Segments</h3>
            <p className="text-sm text-muted-foreground">
              Create {segmentCount} segment{segmentCount > 1 ? "s" : ""} based on your flow design settings
            </p>
            <Button onClick={initializeSegments} size="lg" data-testid="button-initialize-segments">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Segments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Compose the Visuals</h2>
        <p className="text-muted-foreground">
          Design each segment of your ambient experience
        </p>
      </div>

      {/* Generate All Button */}
      <div className="flex justify-center">
        <Button
          onClick={generateAllKeyframes}
          disabled={isGenerating}
          variant="outline"
          size="lg"
          data-testid="button-generate-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating All Keyframes...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate All Keyframes
            </>
          )}
        </Button>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {segments.map((segment, index) => (
          <Card key={segment.id} className="overflow-hidden" data-testid={`card-segment-${index + 1}`}>
            {/* Keyframe Preview */}
            <div className="aspect-video bg-muted relative">
              {segment.keyframeUrl ? (
                <img 
                  src={segment.keyframeUrl} 
                  alt={`Segment ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
              
              {/* Segment Number Badge */}
              <Badge className="absolute top-2 left-2" variant="secondary">
                Segment {index + 1}
              </Badge>

              {/* Generate Button */}
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-2 right-2"
                onClick={() => generateKeyframe(segment.id)}
                disabled={generatingSegment === segment.id}
                data-testid={`button-generate-keyframe-${index + 1}`}
              >
                {generatingSegment === segment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {segment.keyframeUrl ? "Regenerate" : "Generate"}
                  </>
                )}
              </Button>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duration
                  </Label>
                  <span className="text-sm text-muted-foreground">{segment.duration}s</span>
                </div>
                <Slider
                  value={[segment.duration]}
                  onValueChange={([val]) => updateSegmentDuration(segment.id, val)}
                  min={5}
                  max={60}
                  step={5}
                  data-testid={`slider-duration-${index + 1}`}
                />
              </div>

              {/* Motion Direction */}
              <div className="space-y-2">
                <Label className="text-sm">Motion Direction</Label>
                <div className="flex gap-1">
                  {MOTION_DIRECTIONS.map((dir) => {
                    const Icon = dir.icon;
                    return (
                      <button
                        key={dir.id}
                        onClick={() => updateSegmentMotion(segment.id, dir.id as Segment["motionDirection"])}
                        className={`flex-1 p-2 rounded border text-xs transition-all hover-elevate ${
                          segment.motionDirection === dir.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30"
                        }`}
                        data-testid={`button-motion-${dir.id}-${index + 1}`}
                      >
                        {Icon ? <Icon className="h-3 w-3 mx-auto" /> : dir.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layers */}
              <div className="space-y-2">
                <Label className="text-sm">Layers</Label>
                <div className="flex gap-2">
                  {(["background", "midground", "foreground"] as const).map((layer) => (
                    <button
                      key={layer}
                      onClick={() => toggleLayer(segment.id, layer)}
                      className={`flex-1 px-2 py-1.5 rounded border text-xs capitalize transition-all hover-elevate ${
                        segment.layers[layer]
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                      data-testid={`button-layer-${layer}-${index + 1}`}
                    >
                      {layer.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Effects */}
              <div className="space-y-2">
                <Label className="text-sm">Effects</Label>
                <div className="flex gap-2">
                  {(["particles", "lightRays", "fog"] as const).map((effect) => (
                    <button
                      key={effect}
                      onClick={() => toggleEffect(segment.id, effect)}
                      className={`flex-1 px-2 py-1.5 rounded border text-xs transition-all hover-elevate ${
                        segment.effects[effect]
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                      data-testid={`button-effect-${effect}-${index + 1}`}
                    >
                      {effect === "lightRays" ? "Rays" : effect.charAt(0).toUpperCase() + effect.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          size="lg"
          disabled={segments.some(s => !s.keyframeUrl)}
          data-testid="button-continue-composition"
        >
          Continue to Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
