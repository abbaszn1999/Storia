import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Download,
  Share2,
  Link,
  Copy,
  Play,
  Sparkles,
  Monitor,
  Smartphone,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Layers,
  Zap
} from "lucide-react";
import { SiTiktok, SiInstagram, SiYoutube, SiFacebook, SiPinterest } from "react-icons/si";

interface ExportPublishTabProps {
  onPrev: () => void;
}

const PLATFORM_PRESETS = [
  { 
    id: "tiktok", 
    label: "TikTok Shop", 
    icon: SiTiktok,
    specs: "9:16, 15-60s",
    features: ["Product Tags", "Shop Link"],
    color: "bg-black text-white"
  },
  { 
    id: "instagram", 
    label: "Instagram Reels", 
    icon: SiInstagram,
    specs: "9:16, 15-90s",
    features: ["Shopping Tags", "Collab"],
    color: "bg-gradient-to-br from-purple-600 to-pink-500 text-white"
  },
  { 
    id: "youtube", 
    label: "YouTube Shorts", 
    icon: SiYoutube,
    specs: "9:16, up to 60s",
    features: ["End Screens", "Cards"],
    color: "bg-red-600 text-white"
  },
  { 
    id: "facebook", 
    label: "Facebook Reels", 
    icon: SiFacebook,
    specs: "9:16, 15-90s",
    features: ["Shop Links"],
    color: "bg-blue-600 text-white"
  },
  { 
    id: "pinterest", 
    label: "Pinterest", 
    icon: SiPinterest,
    specs: "2:3 or 9:16",
    features: ["Product Pins"],
    color: "bg-red-700 text-white"
  }
];

const ASPECT_RATIOS = [
  { id: "9:16", label: "9:16", icon: RectangleVertical, description: "Vertical (Reels/TikTok)" },
  { id: "1:1", label: "1:1", icon: Square, description: "Square (Feed)" },
  { id: "16:9", label: "16:9", icon: RectangleHorizontal, description: "Horizontal (YouTube)" },
  { id: "4:5", label: "4:5", icon: RectangleVertical, description: "Portrait (Instagram)" }
];

const RESOLUTIONS = [
  { id: "720p", label: "720p HD", description: "Faster export, smaller file" },
  { id: "1080p", label: "1080p Full HD", description: "Recommended for most platforms" },
  { id: "4k", label: "4K Ultra HD", description: "Maximum quality" }
];

const BATCH_OPTIONS = [
  { id: "hook-variants", label: "Hook Variants", description: "3 different opening hooks" },
  { id: "duration-variants", label: "Duration Variants", description: "15s, 30s, 60s versions" },
  { id: "cta-variants", label: "CTA Variants", description: "Different call-to-actions" },
  { id: "platform-optimized", label: "Platform Optimized", description: "Auto-adjust for each platform" }
];

export function ExportPublishTab({ onPrev }: ExportPublishTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Video Preview */}
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
              <div className="aspect-[9/16] max-h-[500px] mx-auto bg-gradient-to-br from-gray-900 to-purple-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,63,255,0.3),transparent_50%)]" />
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white/80 text-sm">Click to preview your video</p>
                </div>

                {/* Platform Overlays */}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="text-xs">0:30</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur rounded-lg p-3">
                    <p className="text-white text-sm font-medium">Your Product Name</p>
                    <p className="text-white/70 text-xs">Shop now - Link in bio</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Stats */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-medium text-sm">Video Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>30 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scenes</span>
                    <span>4 scenes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aspect Ratio</span>
                    <span>9:16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span>1080p</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audio</span>
                    <span>Voiceover + Music</span>
                  </div>
                </div>
              </div>

              <Button className="w-full gap-2" size="lg" data-testid="button-generate-video">
                <Sparkles className="h-4 w-4" />
                Generate Video
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Estimated generation time: 2-3 minutes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Presets */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Platform Presets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PLATFORM_PRESETS.map((platform) => (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover-elevate cursor-pointer"
                  data-testid={`button-platform-${platform.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}>
                      <platform.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{platform.label}</p>
                      <p className="text-xs text-muted-foreground">{platform.specs}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {platform.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-[10px]">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <div className="space-y-6">
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
                  <div
                    key={ratio.id}
                    className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all text-center"
                    data-testid={`button-ratio-${ratio.id}`}
                  >
                    <ratio.icon className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <p className="text-sm font-medium">{ratio.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover-elevate"
                    data-testid={`button-resolution-${res.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{res.label}</p>
                      <p className="text-xs text-muted-foreground">{res.description}</p>
                    </div>
                    {res.id === "1080p" && (
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Link & Batch Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Link */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Link className="h-4 w-4 text-primary" />
              Product Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Landing Page URL</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://yourstore.com/product" 
                  className="flex-1"
                  data-testid="input-product-url"
                />
                <Button variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">UTM Tracking</p>
                <p className="text-xs text-muted-foreground">Add campaign parameters</p>
              </div>
              <Switch data-testid="switch-utm-tracking" />
            </div>
          </CardContent>
        </Card>

        {/* Batch Export */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Batch Export
              <Badge variant="secondary" className="text-xs">A/B Testing</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {BATCH_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`toggle-batch-${option.id}`}
                >
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onPrev} data-testid="button-back-audio">
                Back to Audio & Captions
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2" data-testid="button-save-draft">
                Save as Draft
              </Button>
              <Button variant="outline" className="gap-2" data-testid="button-download">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button size="lg" className="gap-2" data-testid="button-export-publish">
                <Zap className="h-4 w-4" />
                Export & Publish
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
