import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Repeat, Play, Gauge, Layers, Move, RefreshCw } from "lucide-react";

const SEGMENT_OPTIONS = [
  { value: 1, label: "1 - Continuous", description: "Single unbroken scene" },
  { value: 3, label: "3 - Minimal", description: "Gentle variation" },
  { value: 5, label: "5 - Balanced", description: "Moderate variety" },
  { value: 7, label: "7 - Dynamic", description: "More scene changes" },
  { value: 10, label: "10 - Rich", description: "Maximum variety" },
];

const TRANSITION_STYLES = [
  { id: "crossfade", label: "Smooth Crossfade", description: "Gentle blend between scenes" },
  { id: "dissolve", label: "Slow Dissolve", description: "Gradual fade transition" },
  { id: "drift", label: "Drift", description: "Floating motion blend" },
  { id: "match-cut", label: "Match Cut", description: "Seamless visual continuity" },
  { id: "morph", label: "Morph", description: "Shape transformation" },
  { id: "wipe", label: "Soft Wipe", description: "Directional reveal" },
];

const VARIATION_TYPES = [
  { id: "evolving", label: "Same Scene Evolving", description: "Time passing, light changing" },
  { id: "angles", label: "Different Angles", description: "Same subject, new perspectives" },
  { id: "elements", label: "Different Elements", description: "Varied subjects, same mood" },
  { id: "zoom", label: "Zoom Journey", description: "Progressive zoom in or out" },
];

const CAMERA_MOTIONS = [
  { id: "static", label: "Static" },
  { id: "slow-pan", label: "Slow Pan" },
  { id: "gentle-drift", label: "Gentle Drift" },
  { id: "orbit", label: "Orbit" },
  { id: "push-in", label: "Push In" },
  { id: "pull-out", label: "Pull Out" },
  { id: "parallax", label: "Parallax" },
  { id: "float", label: "Floating" },
];

const LOOP_MODES = [
  { id: "seamless", label: "Seamless Loop", description: "Perfect endless replay" },
  { id: "one-way", label: "One-way", description: "Plays once, no loop" },
  { id: "boomerang", label: "Boomerang", description: "Plays forward then reverse" },
  { id: "fade-loop", label: "Fade Loop", description: "Fades out, fades back in" },
];

const VISUAL_RHYTHMS = [
  { id: "constant", label: "Constant Calm", description: "Steady, unchanging pace" },
  { id: "breathing", label: "Breathing", description: "Subtle rhythmic pulse" },
  { id: "building", label: "Building", description: "Gradually intensifying" },
  { id: "wave", label: "Wave", description: "Rising and falling" },
];

interface FlowDesignTabProps {
  pacing: number;
  segmentCount: number;
  transitionStyle: string;
  variationType: string;
  cameraMotion: string;
  loopMode: string;
  visualRhythm: string;
  enableParallax: boolean;
  onPacingChange: (pacing: number) => void;
  onSegmentCountChange: (count: number) => void;
  onTransitionStyleChange: (style: string) => void;
  onVariationTypeChange: (type: string) => void;
  onCameraMotionChange: (motion: string) => void;
  onLoopModeChange: (mode: string) => void;
  onVisualRhythmChange: (rhythm: string) => void;
  onEnableParallaxChange: (enabled: boolean) => void;
  onNext: () => void;
}

export function FlowDesignTab({
  pacing,
  segmentCount,
  transitionStyle,
  variationType,
  cameraMotion,
  loopMode,
  visualRhythm,
  enableParallax,
  onPacingChange,
  onSegmentCountChange,
  onTransitionStyleChange,
  onVariationTypeChange,
  onCameraMotionChange,
  onLoopModeChange,
  onVisualRhythmChange,
  onEnableParallaxChange,
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
          {/* Pacing */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Pacing</Label>
                <Badge variant="secondary" className="ml-auto">{pacing}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                How fast should the visual changes occur?
              </p>
              <div className="pt-2">
                <Slider
                  value={[pacing]}
                  onValueChange={([val]) => onPacingChange(val)}
                  min={0}
                  max={100}
                  step={10}
                  data-testid="slider-pacing"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Slow & Meditative</span>
                  <span>Dynamic & Rhythmic</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segment Count */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Segment Count</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                How many distinct visual moments?
              </p>
              <div className="space-y-2">
                {SEGMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSegmentCountChange(opt.value)}
                    className={`w-full p-3 rounded-lg border text-left transition-all hover-elevate ${
                      segmentCount === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-segments-${opt.value}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transition Style */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Transition Style</Label>
              <div className="grid grid-cols-2 gap-3">
                {TRANSITION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => onTransitionStyleChange(style.id)}
                    className={`p-3 rounded-lg border text-left transition-all hover-elevate ${
                      transitionStyle === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-transition-${style.id}`}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-muted-foreground">{style.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
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

          {/* Camera Motion */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Move className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Camera Motion</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {CAMERA_MOTIONS.map((motion) => (
                  <button
                    key={motion.id}
                    onClick={() => onCameraMotionChange(motion.id)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all hover-elevate ${
                      cameraMotion === motion.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-camera-${motion.id}`}
                  >
                    {motion.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label className="text-sm">Enable Parallax Effect</Label>
                  <p className="text-xs text-muted-foreground">Add depth with layered movement</p>
                </div>
                <Switch
                  checked={enableParallax}
                  onCheckedChange={onEnableParallaxChange}
                  data-testid="switch-parallax"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loop Mode */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Loop Mode</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {LOOP_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onLoopModeChange(mode.id)}
                    className={`p-3 rounded-lg border text-left transition-all hover-elevate ${
                      loopMode === mode.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-loop-${mode.id}`}
                  >
                    <div className="font-medium text-sm">{mode.label}</div>
                    <div className="text-xs text-muted-foreground">{mode.description}</div>
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
