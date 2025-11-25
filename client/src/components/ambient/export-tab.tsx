import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download,
  Share2,
  Youtube,
  Monitor,
  Smartphone,
  Square,
  RectangleHorizontal,
  Volume2,
  VolumeX,
  Music,
  Repeat,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";
import { SiTiktok, SiInstagram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

const ASPECT_RATIOS = [
  { id: "16:9", label: "16:9", description: "Landscape", icon: RectangleHorizontal },
  { id: "9:16", label: "9:16", description: "Portrait", icon: Smartphone },
  { id: "1:1", label: "1:1", description: "Square", icon: Square },
  { id: "21:9", label: "21:9", description: "Ultrawide", icon: Monitor },
];

const RESOLUTIONS = [
  { id: "720p", label: "720p HD", description: "1280x720" },
  { id: "1080p", label: "1080p Full HD", description: "1920x1080" },
  { id: "4k", label: "4K Ultra HD", description: "3840x2160" },
];

const SOUND_MIX_OPTIONS = [
  { id: "ambient-only", label: "Ambient Sound Only", icon: Volume2 },
  { id: "with-music", label: "With Background Music", icon: Music },
  { id: "silent", label: "Silent / Muted", icon: VolumeX },
];

const PLATFORM_PRESETS = [
  { id: "youtube", label: "YouTube Background", icon: Youtube, settings: "16:9, 1080p, Loop" },
  { id: "tiktok", label: "TikTok / Reels", icon: SiTiktok, settings: "9:16, 1080p" },
  { id: "instagram", label: "Instagram", icon: SiInstagram, settings: "1:1 or 9:16, 1080p" },
  { id: "desktop", label: "Desktop Wallpaper", icon: Monitor, settings: "16:9 or 21:9, 4K, Loop" },
];

interface ExportTabProps {
  projectName: string;
  loopMode: string;
  totalDuration: number;
}

export function ExportTab({
  projectName,
  loopMode,
  totalDuration,
}: ExportTabProps) {
  const { toast } = useToast();
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");
  const [soundMix, setSoundMix] = useState("ambient-only");
  const [enableLoop, setEnableLoop] = useState(loopMode === "seamless");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExported, setIsExported] = useState(false);
  const [exportedUrl, setExportedUrl] = useState("");
  
  const [title, setTitle] = useState(projectName || "Ambient Visual");
  const [description, setDescription] = useState("");

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setIsExported(true);
          setExportedUrl("https://storia.app/ambient/exported-video-123");
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(exportedUrl);
    toast({
      title: "Link Copied",
      description: "Video link copied to clipboard",
    });
  };

  const handleApplyPreset = (presetId: string) => {
    switch (presetId) {
      case "youtube":
        setAspectRatio("16:9");
        setResolution("1080p");
        setEnableLoop(true);
        break;
      case "tiktok":
        setAspectRatio("9:16");
        setResolution("1080p");
        setEnableLoop(false);
        break;
      case "instagram":
        setAspectRatio("1:1");
        setResolution("1080p");
        setEnableLoop(false);
        break;
      case "desktop":
        setAspectRatio("16:9");
        setResolution("4k");
        setEnableLoop(true);
        break;
    }
    toast({
      title: "Preset Applied",
      description: `Settings updated for ${PLATFORM_PRESETS.find(p => p.id === presetId)?.label}`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Export Your Ambient Visual</h2>
        <p className="text-muted-foreground">
          Configure output settings and download your video
        </p>
      </div>

      {isExported ? (
        /* Export Complete View */
        <Card className="max-w-2xl mx-auto border-green-500/50 bg-green-500/5">
          <CardContent className="p-8 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <h3 className="text-xl font-bold text-green-600">Export Complete!</h3>
              <p className="text-muted-foreground mt-1">Your ambient visual is ready</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <Input 
                value={exportedUrl} 
                readOnly 
                className="flex-1 bg-background"
                data-testid="input-exported-url"
              />
              <Button variant="outline" onClick={handleCopyLink} data-testid="button-copy-link">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" asChild data-testid="button-open-link">
                <a href={exportedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button size="lg" data-testid="button-download-final">
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
              <Button size="lg" variant="outline" data-testid="button-share-final">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Quick share to:</p>
              <div className="flex justify-center gap-3">
                {PLATFORM_PRESETS.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <Button key={platform.id} variant="outline" size="icon" data-testid={`button-share-${platform.id}`}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Presets */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold">Platform Presets</Label>
                <p className="text-sm text-muted-foreground">
                  Quick settings for popular platforms
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PLATFORM_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.id)}
                        className="p-4 rounded-lg border text-center transition-all hover-elevate border-border bg-muted/30"
                        data-testid={`button-preset-${preset.id}`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-medium text-sm">{preset.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{preset.settings}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold">Aspect Ratio</Label>
                <div className="grid grid-cols-4 gap-3">
                  {ASPECT_RATIOS.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                      <button
                        key={ratio.id}
                        onClick={() => setAspectRatio(ratio.id)}
                        className={`p-4 rounded-lg border text-center transition-all hover-elevate ${
                          aspectRatio === ratio.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30"
                        }`}
                        data-testid={`button-aspect-${ratio.id.replace(":", "-")}`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <div className="font-medium">{ratio.label}</div>
                        <div className="text-xs text-muted-foreground">{ratio.description}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Resolution */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold">Resolution</Label>
                <div className="grid grid-cols-3 gap-3">
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setResolution(res.id)}
                      className={`p-4 rounded-lg border text-center transition-all hover-elevate ${
                        resolution === res.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                      data-testid={`button-resolution-${res.id}`}
                    >
                      <div className="font-medium">{res.label}</div>
                      <div className="text-xs text-muted-foreground">{res.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sound & Loop Options */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Sound Mix</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SOUND_MIX_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSoundMix(opt.id)}
                          className={`p-3 rounded-lg border text-center transition-all hover-elevate ${
                            soundMix === opt.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/30"
                          }`}
                          data-testid={`button-sound-${opt.id}`}
                        >
                          <Icon className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-sm font-medium">{opt.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Repeat className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="font-medium">Export as Seamless Loop</Label>
                      <p className="text-xs text-muted-foreground">Optimize for endless replay</p>
                    </div>
                  </div>
                  <Switch
                    checked={enableLoop}
                    onCheckedChange={setEnableLoop}
                    data-testid="switch-loop-export"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metadata & Export */}
          <div className="space-y-6">
            {/* Video Metadata */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold">Video Details</Label>
                
                <div className="space-y-2">
                  <Label className="text-sm">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    data-testid="input-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for your ambient visual..."
                    rows={4}
                    data-testid="input-description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Export Summary */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <Label className="text-lg font-semibold">Export Summary</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aspect Ratio</span>
                    <span>{aspectRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span>{RESOLUTIONS.find(r => r.id === resolution)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sound</span>
                    <span>{SOUND_MIX_OPTIONS.find(s => s.id === soundMix)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loop</span>
                    <span>{enableLoop ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Button */}
            <Card>
              <CardContent className="p-6">
                {isExporting ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                    <div>
                      <h4 className="font-semibold">Exporting Video...</h4>
                      <p className="text-sm text-muted-foreground">{exportProgress}% complete</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleExport}
                    className="w-full"
                    size="lg"
                    data-testid="button-export"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Video
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
