import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { LogoAnimationSettings } from "@/components/logo-animation-workflow";
import { 
  Palette,
  Sun,
  Sparkles,
  Image as ImageIcon,
  Square,
  Circle,
  Layers,
  Zap,
  Upload
} from "lucide-react";

interface EffectsEnvironmentTabProps {
  settings: LogoAnimationSettings;
  onUpdate: (updates: Partial<LogoAnimationSettings>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const BACKGROUND_OPTIONS = [
  { id: "transparent", label: "Transparent", description: "For overlay use", icon: Square },
  { id: "solid", label: "Solid Color", description: "Single background", icon: Circle },
  { id: "gradient", label: "Gradient", description: "Color transition", icon: Palette },
  { id: "textured", label: "Textured", description: "Subtle pattern", icon: Layers },
  { id: "environmental", label: "Environmental", description: "Blurred scene", icon: ImageIcon },
  { id: "custom", label: "Custom Image", description: "Upload background", icon: Upload }
];

const VISUAL_EFFECTS: { id: keyof LogoAnimationSettings["visualEffects"]; label: string; description: string }[] = [
  { id: "glow", label: "Glow / Bloom", description: "Soft light emanation" },
  { id: "shadow", label: "Shadow / Depth", description: "3D drop shadow" },
  { id: "lightRays", label: "Light Rays", description: "Volumetric lighting" },
  { id: "particles", label: "Particles", description: "Floating elements" },
  { id: "reflections", label: "Reflections", description: "Mirror surface" },
  { id: "grain", label: "Film Grain", description: "Cinematic texture" }
];

const COLOR_TREATMENTS = [
  { id: "full-color", label: "Full Color", description: "Original brand colors" },
  { id: "monochrome", label: "Monochrome", description: "Single color scheme" },
  { id: "inverted", label: "Inverted", description: "Reversed colors" },
  { id: "gradient-overlay", label: "Gradient Overlay", description: "Color wash effect" },
  { id: "duotone", label: "Duotone", description: "Two-color effect" },
  { id: "metallic", label: "Metallic", description: "Gold, silver, chrome" }
];

export function EffectsEnvironmentTab({ settings, onUpdate, onNext, onPrev }: EffectsEnvironmentTabProps) {
  const handleEffectToggle = (effectId: keyof LogoAnimationSettings["visualEffects"]) => {
    onUpdate({
      visualEffects: {
        ...settings.visualEffects,
        [effectId]: !settings.visualEffects[effectId]
      }
    });
  };

  const handleIntensityChange = (type: keyof LogoAnimationSettings["effectIntensity"], value: number) => {
    onUpdate({
      effectIntensity: {
        ...settings.effectIntensity,
        [type]: value
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background Options */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => onUpdate({ backgroundType: bg.id })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.backgroundType === bg.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-background-${bg.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <bg.icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">{bg.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{bg.description}</p>
                </button>
              ))}
            </div>

            {/* Background Color Picker */}
            <div className="pt-2 border-t border-border space-y-3">
              <Label className="text-xs">Background Color</Label>
              <div className="flex gap-2">
                {["#000000", "#111111", "#1a1a1a", "#8B3FFF", "#C944E6"].map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ backgroundColor: color })}
                    className={`w-10 h-10 rounded-md border transition-all ${
                      settings.backgroundColor === color ? "border-primary ring-2 ring-primary/50" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    data-testid={`button-bg-color-${color.replace("#", "")}`}
                  />
                ))}
                <Button variant="outline" size="icon" className="w-10 h-10" data-testid="button-custom-bg-color">
                  <Palette className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Effects */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Visual Effects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {VISUAL_EFFECTS.map((effect) => (
                <div
                  key={effect.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`toggle-effect-${effect.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{effect.label}</p>
                    <p className="text-xs text-muted-foreground">{effect.description}</p>
                  </div>
                  <Switch 
                    checked={settings.visualEffects[effect.id]} 
                    onCheckedChange={() => handleEffectToggle(effect.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Color Treatment */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Color Treatment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {COLOR_TREATMENTS.map((treatment) => (
              <button
                key={treatment.id}
                onClick={() => onUpdate({ colorTreatment: treatment.id })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  settings.colorTreatment === treatment.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover-elevate"
                }`}
                data-testid={`button-treatment-${treatment.id}`}
              >
                <div className={`aspect-[3/2] rounded-md mb-3 flex items-center justify-center overflow-hidden ${
                  settings.colorTreatment === treatment.id ? "bg-primary/20" : "bg-muted/50"
                }`}>
                  {treatment.id === "full-color" && (
                    <div className="flex gap-1">
                      <div className="w-4 h-8 bg-primary rounded" />
                      <div className="w-4 h-8 bg-secondary rounded" />
                      <div className="w-4 h-8 bg-accent rounded" />
                    </div>
                  )}
                  {treatment.id === "monochrome" && (
                    <div className="flex gap-1">
                      <div className="w-4 h-8 bg-foreground/80 rounded" />
                      <div className="w-4 h-8 bg-foreground/50 rounded" />
                      <div className="w-4 h-8 bg-foreground/20 rounded" />
                    </div>
                  )}
                  {treatment.id === "inverted" && (
                    <div className="w-full h-full bg-foreground flex items-center justify-center">
                      <div className="w-8 h-8 bg-background rounded" />
                    </div>
                  )}
                  {treatment.id === "gradient-overlay" && (
                    <div className="w-full h-full bg-gradient-to-r from-primary to-secondary" />
                  )}
                  {treatment.id === "duotone" && (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
                  )}
                  {treatment.id === "metallic" && (
                    <div className="w-full h-full bg-gradient-to-br from-primary/60 via-primary/30 to-primary/80" />
                  )}
                </div>
                <p className="text-sm font-medium">{treatment.label}</p>
                <p className="text-xs text-muted-foreground">{treatment.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Effect Intensity Controls */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Effect Intensity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Glow Intensity
                </Label>
                <span className="text-sm text-muted-foreground">{settings.effectIntensity.glow}%</span>
              </div>
              <Slider 
                value={[settings.effectIntensity.glow]} 
                onValueChange={([value]) => handleIntensityChange("glow", value)}
                max={100} 
                data-testid="slider-glow" 
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Shadow Depth
                </Label>
                <span className="text-sm text-muted-foreground">{settings.effectIntensity.shadow}%</span>
              </div>
              <Slider 
                value={[settings.effectIntensity.shadow]} 
                onValueChange={([value]) => handleIntensityChange("shadow", value)}
                max={100} 
                data-testid="slider-shadow" 
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Particle Density
                </Label>
                <span className="text-sm text-muted-foreground">{settings.effectIntensity.particles}%</span>
              </div>
              <Slider 
                value={[settings.effectIntensity.particles]} 
                onValueChange={([value]) => handleIntensityChange("particles", value)}
                max={100} 
                data-testid="slider-particles" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-animation">
          Back to Animation Style
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-audio">
          Continue to Audio Design
        </Button>
      </div>
    </div>
  );
}
