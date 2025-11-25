import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image as ImageIcon,
  Layers,
  Palette,
  Sparkles,
  Monitor,
  Smartphone,
  Play,
  Type,
  Circle,
  Square,
  Hexagon
} from "lucide-react";

interface LogoBrandTabProps {
  onNext: () => void;
}

const BRAND_PERSONALITIES = [
  { id: "modern", label: "Modern / Tech", description: "Clean, innovative, forward-thinking" },
  { id: "classic", label: "Classic / Elegant", description: "Timeless, refined, sophisticated" },
  { id: "playful", label: "Playful / Fun", description: "Energetic, friendly, approachable" },
  { id: "bold", label: "Bold / Powerful", description: "Strong, confident, impactful" },
  { id: "natural", label: "Natural / Organic", description: "Earthy, authentic, sustainable" },
  { id: "minimal", label: "Minimal / Clean", description: "Simple, focused, uncluttered" }
];

const ANIMATION_CONTEXTS = [
  { id: "video-intro", label: "Video Intro", description: "YouTube, corporate videos", icon: Play },
  { id: "video-outro", label: "Video Outro", description: "End screen branding", icon: Monitor },
  { id: "social-sting", label: "Social Sting", description: "Short-form content", icon: Smartphone },
  { id: "app-loading", label: "App Loading", description: "Splash screens, loaders", icon: Circle },
  { id: "presentation", label: "Presentation", description: "Slides, keynotes", icon: Square },
  { id: "watermark", label: "Watermark / Bug", description: "Corner branding", icon: Hexagon }
];

const DETECTED_ELEMENTS = [
  { id: "icon", label: "Icon / Symbol", detected: true },
  { id: "wordmark", label: "Wordmark", detected: true },
  { id: "tagline", label: "Tagline", detected: false }
];

export function LogoBrandTab({ onNext }: LogoBrandTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Logo Upload */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Upload Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-3 cursor-pointer hover-elevate transition-colors bg-muted/30"
                data-testid="upload-logo"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Drop your logo here</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, or vector file</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-browse-logo">
                  Browse Files
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                For best results, use a high-resolution file with transparent background
              </div>
            </CardContent>
          </Card>

          {/* Detected Elements */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Logo Elements
                <Badge variant="secondary" className="text-xs">AI Detected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DETECTED_ELEMENTS.map((element) => (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      element.detected ? "border-primary/50 bg-primary/5" : "border-border bg-muted/30"
                    }`}
                    data-testid={`element-${element.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        element.detected ? "bg-primary/20" : "bg-muted"
                      }`}>
                        {element.id === "icon" && <Hexagon className="h-5 w-5 text-primary" />}
                        {element.id === "wordmark" && <Type className="h-5 w-5 text-primary" />}
                        {element.id === "tagline" && <Type className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{element.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {element.detected ? "Detected" : "Not detected"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={element.detected ? "default" : "outline"} className="text-xs">
                      {element.detected ? "Active" : "Add"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Brand Settings */}
        <div className="space-y-6">
          {/* Brand Personality */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Brand Personality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {BRAND_PERSONALITIES.map((personality) => (
                  <div
                    key={personality.id}
                    className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                    data-testid={`button-personality-${personality.id}`}
                  >
                    <p className="text-sm font-medium">{personality.label}</p>
                    <p className="text-xs text-muted-foreground">{personality.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Brand Colors */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Brand Colors
                <Badge variant="secondary" className="text-xs">Extracted</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Primary</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-primary" />
                    <Input 
                      placeholder="#8B3FFF" 
                      className="flex-1 h-10"
                      data-testid="input-color-primary"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Secondary</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-secondary" />
                    <Input 
                      placeholder="#C944E6" 
                      className="flex-1 h-10"
                      data-testid="input-color-secondary"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Accent</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-accent" />
                    <Input 
                      placeholder="#FF3F8E" 
                      className="flex-1 h-10"
                      data-testid="input-color-accent"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Background</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-background border border-border" />
                    <Input 
                      placeholder="#000000" 
                      className="flex-1 h-10"
                      data-testid="input-color-background"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Animation Context */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Animation Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {ANIMATION_CONTEXTS.map((context) => (
                  <div
                    key={context.id}
                    className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                    data-testid={`button-context-${context.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <context.icon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">{context.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{context.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg" data-testid="button-continue-animation">
          Continue to Animation Style
        </Button>
      </div>
    </div>
  );
}
