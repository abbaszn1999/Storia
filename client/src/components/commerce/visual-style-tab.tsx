import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Palette, 
  Sun,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Zap,
  Square,
  Circle,
  Triangle,
  Upload
} from "lucide-react";

interface VisualStyleTabProps {
  onNext: () => void;
  onPrev: () => void;
}

const VISUAL_AESTHETICS = [
  { 
    id: "clean", 
    label: "Clean & Minimal", 
    description: "White space, simple compositions",
    preview: "bg-gradient-to-br from-gray-50 to-gray-100"
  },
  { 
    id: "vibrant", 
    label: "Vibrant & Bold", 
    description: "High saturation, energetic colors",
    preview: "bg-gradient-to-br from-pink-400 to-orange-400"
  },
  { 
    id: "moody", 
    label: "Moody & Luxe", 
    description: "Dark tones, dramatic lighting",
    preview: "bg-gradient-to-br from-gray-900 to-purple-900"
  },
  { 
    id: "natural", 
    label: "Natural & Organic", 
    description: "Earth tones, warm textures",
    preview: "bg-gradient-to-br from-amber-100 to-green-200"
  },
  { 
    id: "tech", 
    label: "Tech & Futuristic", 
    description: "Neon accents, sleek surfaces",
    preview: "bg-gradient-to-br from-cyan-400 to-blue-600"
  },
  { 
    id: "vintage", 
    label: "Vintage & Retro", 
    description: "Film grain, muted palettes",
    preview: "bg-gradient-to-br from-orange-200 to-rose-300"
  }
];

const BACKGROUND_OPTIONS = [
  { id: "solid", label: "Solid Color", icon: Square },
  { id: "gradient", label: "Gradient", icon: Circle },
  { id: "lifestyle", label: "Lifestyle Setting", icon: ImageIcon },
  { id: "studio", label: "Studio White", icon: Sun },
  { id: "texture", label: "Textured Surface", icon: Triangle },
  { id: "ai-generated", label: "AI Environment", icon: Sparkles }
];

const LIGHTING_MOODS = [
  { id: "bright", label: "Bright & Airy", description: "High-key, fresh feel" },
  { id: "dramatic", label: "Dramatic", description: "Strong shadows, contrast" },
  { id: "golden", label: "Golden Hour", description: "Warm, inviting glow" },
  { id: "neon", label: "Neon", description: "Colorful accent lighting" },
  { id: "studio", label: "Studio", description: "Even, professional lighting" },
  { id: "natural", label: "Natural", description: "Soft window light feel" }
];

const MOTION_GRAPHICS = [
  { id: "price-tag", label: "Price Tags", enabled: true },
  { id: "feature-callouts", label: "Feature Callouts", enabled: true },
  { id: "animated-stickers", label: "Animated Stickers", enabled: false },
  { id: "trending-effects", label: "Trending Effects", enabled: false },
  { id: "sale-badges", label: "Sale Badges", enabled: true },
  { id: "rating-stars", label: "Rating Stars", enabled: false }
];

const COLOR_PRESETS = [
  { id: "brand", colors: ["#8B3FFF", "#C944E6", "#FF3F8E"], label: "Brand Colors" },
  { id: "warm", colors: ["#FF6B6B", "#FFA07A", "#FFD93D"], label: "Warm" },
  { id: "cool", colors: ["#4ECDC4", "#45B7D1", "#96CDFF"], label: "Cool" },
  { id: "neutral", colors: ["#2D3436", "#636E72", "#B2BEC3"], label: "Neutral" },
  { id: "earth", colors: ["#A0522D", "#D2691E", "#F4A460"], label: "Earth" },
  { id: "pastel", colors: ["#FFB5E8", "#B5DEFF", "#B5FFB5"], label: "Pastel" }
];

export function VisualStyleTab({ onNext, onPrev }: VisualStyleTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Visual Aesthetic */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Visual Aesthetic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {VISUAL_AESTHETICS.map((aesthetic) => (
              <div
                key={aesthetic.id}
                className="p-4 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                data-testid={`button-aesthetic-${aesthetic.id}`}
              >
                <div className={`h-20 rounded-md mb-3 ${aesthetic.preview}`} />
                <p className="text-sm font-medium">{aesthetic.label}</p>
                <p className="text-xs text-muted-foreground">{aesthetic.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <div className="grid grid-cols-3 gap-3">
              {BACKGROUND_OPTIONS.map((bg) => (
                <div
                  key={bg.id}
                  className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all text-center"
                  data-testid={`button-background-${bg.id}`}
                >
                  <bg.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">{bg.label}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-border">
              <Label className="text-xs mb-2 block">Custom Background</Label>
              <div 
                className="h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center gap-2 cursor-pointer hover-elevate"
                data-testid="upload-custom-background"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Image</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lighting Mood */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Lighting Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {LIGHTING_MOODS.map((lighting) => (
                <div
                  key={lighting.id}
                  className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                  data-testid={`button-lighting-${lighting.id}`}
                >
                  <p className="text-sm font-medium">{lighting.label}</p>
                  <p className="text-xs text-muted-foreground">{lighting.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Palette */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                  data-testid={`button-colors-${preset.id}`}
                >
                  <div className="flex gap-1 mb-2">
                    {preset.colors.map((color, i) => (
                      <div 
                        key={i}
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium">{preset.label}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <Label className="text-xs mb-2 block">Custom Brand Colors</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="#HEX" 
                  className="flex-1 h-8"
                  data-testid="input-custom-color-1"
                />
                <Input 
                  placeholder="#HEX" 
                  className="flex-1 h-8"
                  data-testid="input-custom-color-2"
                />
                <Input 
                  placeholder="#HEX" 
                  className="flex-1 h-8"
                  data-testid="input-custom-color-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motion Graphics */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Motion Graphics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOTION_GRAPHICS.map((graphic) => (
                <div
                  key={graphic.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`toggle-motion-${graphic.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{graphic.label}</span>
                  </div>
                  <Switch defaultChecked={graphic.enabled} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Style Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Style Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,63,255,0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(201,68,230,0.2),transparent_50%)]" />
            
            {/* Preview Elements */}
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-white/50" />
              </div>
              <Badge className="bg-primary text-primary-foreground">$29.99</Badge>
              <p className="mt-2 text-white/80 text-sm">Your Product Name</p>
            </div>
            
            {/* Motion Graphics Overlay Indicators */}
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="text-[10px]">4.8 ★</Badge>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-red-500 text-white text-[10px]">SALE</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-scene">
          Back to Scene Builder
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-audio">
          Continue to Audio & Captions
        </Button>
      </div>
    </div>
  );
}
