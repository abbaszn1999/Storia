import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { LogoAnimationSettings } from "@/components/logo-animation-workflow";
import { 
  Download,
  Play,
  Monitor,
  Smartphone,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Clock,
  FileVideo,
  Layers,
  Sparkles,
  Copy
} from "lucide-react";

interface ExportTabProps {
  settings: LogoAnimationSettings;
  onUpdate: (updates: Partial<LogoAnimationSettings>) => void;
  onPrev: () => void;
}

const DURATION_PRESETS = [
  { value: 2, label: "2s", description: "Quick sting" },
  { value: 3, label: "3s", description: "Standard" },
  { value: 5, label: "5s", description: "Full reveal" },
  { value: 10, label: "10s", description: "Extended" }
];

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", icon: RectangleHorizontal, description: "Widescreen" },
  { id: "1:1", label: "1:1", icon: Square, description: "Square" },
  { id: "9:16", label: "9:16", icon: RectangleVertical, description: "Vertical" },
  { id: "4:3", label: "4:3", icon: Monitor, description: "Classic" }
];

const RESOLUTIONS = [
  { id: "720p", label: "720p HD", description: "Smaller file size" },
  { id: "1080p", label: "1080p Full HD", description: "Recommended" },
  { id: "4k", label: "4K Ultra HD", description: "Maximum quality" }
];

const FORMATS = [
  { id: "mp4", label: "MP4", description: "Universal compatibility" },
  { id: "mov", label: "MOV", description: "Apple/Pro editing" },
  { id: "gif", label: "GIF", description: "Animated image" },
  { id: "webm", label: "WebM", description: "Web optimized" }
];

const VARIATION_OPTIONS: { id: keyof LogoAnimationSettings["variations"]; label: string; description: string }[] = [
  { id: "loop", label: "Loop Version", description: "Seamless loop for continuous play" },
  { id: "reverse", label: "Reverse (Outro)", description: "Animation plays in reverse" },
  { id: "watermark", label: "Watermark Size", description: "Small corner version" },
  { id: "stinger", label: "Transition Stinger", description: "For video transitions" }
];

export function ExportTab({ settings, onUpdate, onPrev }: ExportTabProps) {
  const handleVariationToggle = (variationId: keyof LogoAnimationSettings["variations"]) => {
    onUpdate({
      variations: {
        ...settings.variations,
        [variationId]: !settings.variations[variationId]
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Final Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Final Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Player */}
            <div className="lg:col-span-2">
              <div className="aspect-video bg-gradient-to-br from-background to-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,63,255,0.15),transparent_70%)]" />
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-lg font-semibold">Your Logo</p>
                </div>

                <Button 
                  variant="secondary" 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 gap-2"
                  data-testid="button-play-preview"
                >
                  <Play className="h-4 w-4" />
                  Play Animation
                </Button>
              </div>
            </div>

            {/* Export Summary */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-medium text-sm">Animation Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{settings.duration} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Style</span>
                    <span className="capitalize">{settings.animationApproach}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effects</span>
                    <span>
                      {[
                        settings.visualEffects.glow && "Glow",
                        settings.visualEffects.shadow && "Shadow",
                        settings.visualEffects.particles && "Particles"
                      ].filter(Boolean).join(", ") || "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audio</span>
                    <span className="capitalize">{settings.soundType.replace("-", " ")}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full gap-2" size="lg" data-testid="button-generate-animation">
                <Sparkles className="h-4 w-4" />
                Generate Animation
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Estimated time: 30-60 seconds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Duration */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {DURATION_PRESETS.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => onUpdate({ duration: duration.value })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    settings.duration === duration.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-duration-${duration.value}`}
                >
                  <p className="text-lg font-semibold">{duration.label}</p>
                  <p className="text-xs text-muted-foreground">{duration.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aspect Ratio */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Aspect Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => onUpdate({ aspectRatio: ratio.id })}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    settings.aspectRatio === ratio.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-ratio-${ratio.id}`}
                >
                  <ratio.icon className={`h-6 w-6 mx-auto mb-1 ${
                    settings.aspectRatio === ratio.id ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <p className="text-sm font-medium">{ratio.label}</p>
                  <p className="text-[10px] text-muted-foreground">{ratio.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RESOLUTIONS.map((res) => (
                <button
                  key={res.id}
                  onClick={() => onUpdate({ resolution: res.id })}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    settings.resolution === res.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-resolution-${res.id}`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium">{res.label}</p>
                    <p className="text-xs text-muted-foreground">{res.description}</p>
                  </div>
                  {res.id === "1080p" && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Format */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileVideo className="h-4 w-4 text-primary" />
              Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => onUpdate({ format: format.id })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.format === format.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-format-${format.id}`}
                >
                  <p className="text-sm font-medium">.{format.label}</p>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 mt-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Transparent Background</p>
                <p className="text-xs text-muted-foreground">Alpha channel (MOV/WebM only)</p>
              </div>
              <Switch 
                checked={settings.transparentBackground}
                onCheckedChange={(checked) => onUpdate({ transparentBackground: checked })}
                data-testid="switch-transparent" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variations */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Generate Variations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {VARIATION_OPTIONS.map((variation) => (
              <div
                key={variation.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
                data-testid={`toggle-variation-${variation.id}`}
              >
                <Switch 
                  checked={settings.variations[variation.id]}
                  onCheckedChange={() => handleVariationToggle(variation.id)}
                />
                <div>
                  <p className="text-sm font-medium">{variation.label}</p>
                  <p className="text-xs text-muted-foreground">{variation.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <Button variant="outline" onClick={onPrev} data-testid="button-back-audio">
              Back to Audio Design
            </Button>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" data-testid="button-save-draft">
                Save as Draft
              </Button>
              <Button variant="outline" className="gap-2" data-testid="button-copy-settings">
                <Copy className="h-4 w-4" />
                Copy Settings
              </Button>
              <Button size="lg" className="gap-2" data-testid="button-export">
                <Download className="h-4 w-4" />
                Export Animation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
