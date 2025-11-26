import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Download,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  Copy,
  Monitor,
  Subtitles,
} from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";

const PLATFORMS = [
  { id: "youtube", name: "YouTube Shorts", icon: SiYoutube, color: "bg-red-600", specs: "9:16, up to 60s" },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "bg-black", specs: "9:16, 15-60s" },
  { id: "instagram", name: "Instagram Reels", icon: SiInstagram, color: "bg-gradient-to-br from-purple-600 to-pink-500", specs: "9:16, 15-90s" },
  { id: "facebook", name: "Facebook Reels", icon: SiFacebook, color: "bg-blue-600", specs: "9:16, 15-90s" },
];

const RESOLUTIONS = [
  { value: "720p", label: "720p HD", description: "Faster export, smaller file" },
  { value: "1080p", label: "1080p Full HD", description: "Recommended for most platforms" },
  { value: "2160p", label: "4K Ultra HD", description: "Maximum quality" },
];

interface ExportVideoProps {
  onBack: () => void;
  onExport: () => void;
  sceneCount?: number;
  templateName?: string;
}

export function ExportVideo({ onBack, onExport, sceneCount = 4, templateName = "Problem-Solution" }: ExportVideoProps) {
  const [resolution, setResolution] = useState("1080p");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishType, setPublishType] = useState<"instant" | "schedule">("instant");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [youtubeTags, setYoutubeTags] = useState("");
  const [socialCaption, setSocialCaption] = useState("");
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDownloading(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsExporting(false);
    onExport();
  };

  const handleAIRecommendation = async () => {
    setIsGeneratingAI(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    if (selectedPlatforms.includes("youtube")) {
      setYoutubeTitle(`${templateName} Story - Engaging Content That Converts`);
      setYoutubeDescription(`Discover how to solve common problems with this engaging ${templateName.toLowerCase()} video. Perfect for marketers, entrepreneurs, and content creators. Created with Storia AI.`);
      setYoutubeTags(`${templateName.toLowerCase()}, marketing, storytelling, content creation, engaging videos, problem solution, business`);
    }
    
    if (selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p))) {
      setSocialCaption(`The solution you've been looking for\n\nWatch till the end to see how we solved this\n\n#Marketing #ContentCreation #StoryTelling #Business #Viral #FYP`);
    }
    
    setIsGeneratingAI(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://storia.app/v/demo");
  };

  const hasYouTube = selectedPlatforms.includes("youtube");
  const hasSocialPlatforms = selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p));

  const estimatedDuration = sceneCount * 8;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Export & Publish</h1>
        <p className="text-lg text-muted-foreground">
          Choose your export settings and publish to your favorite platforms.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Video Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div
                className="mx-auto bg-gradient-to-br from-gray-900 to-purple-900 rounded-lg overflow-hidden relative aspect-[9/16] max-h-[400px]"
                data-testid="video-preview"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,63,255,0.3),transparent_50%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="gap-2"
                    data-testid="button-play-preview"
                  >
                    <Play className="h-5 w-5" />
                    Play Preview
                  </Button>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs">~{estimatedDuration}s</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="text-xs bg-background/80">9:16</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-medium text-sm">Video Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Template</span>
                    <span>{templateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scenes</span>
                    <span>{sceneCount} scenes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>~{estimatedDuration} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aspect Ratio</span>
                    <span>9:16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span>{resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtitles</span>
                    <span className={subtitlesEnabled ? "text-emerald-500" : "text-muted-foreground"}>
                      {subtitlesEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  data-testid="button-download"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  data-testid="button-copy-link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Select Platforms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div
                    key={platform.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    onClick={() => handlePlatformToggle(platform.id)}
                    data-testid={`platform-${platform.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                        data-testid={`checkbox-${platform.id}`}
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.specs}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">Connect</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Export Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger data-testid="select-resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((res) => (
                      <SelectItem key={res.value} value={res.value}>
                        <div className="flex flex-col">
                          <span>{res.label}</span>
                          <span className="text-xs text-muted-foreground">{res.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Subtitles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Enable Subtitles</p>
                    <p className="text-xs text-muted-foreground">Add auto-generated captions to your video</p>
                  </div>
                </div>
                <Switch
                  checked={subtitlesEnabled}
                  onCheckedChange={setSubtitlesEnabled}
                  data-testid="switch-subtitles"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={publishType} onValueChange={(v: "instant" | "schedule") => setPublishType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instant" id="instant" data-testid="radio-instant" />
                  <Label htmlFor="instant" className="font-normal cursor-pointer flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    Publish Instantly
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="schedule" id="schedule" data-testid="radio-schedule" />
                  <Label htmlFor="schedule" className="font-normal cursor-pointer flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Schedule for Later
                  </Label>
                </div>
              </RadioGroup>

              {publishType === "schedule" && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date" className="text-sm">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      data-testid="input-schedule-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time" className="text-sm">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      data-testid="input-schedule-time"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedPlatforms.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Platform Metadata
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAIRecommendation}
                disabled={isGeneratingAI}
                className="gap-2"
                data-testid="button-ai-metadata"
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Suggestions
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasYouTube && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <SiYoutube className="w-4 h-4 text-red-600" />
                  <h4 className="font-semibold text-sm">YouTube Details</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube-title">Title</Label>
                  <Input
                    id="youtube-title"
                    placeholder="Enter video title"
                    value={youtubeTitle}
                    onChange={(e) => setYoutubeTitle(e.target.value)}
                    data-testid="input-youtube-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube-description">Description</Label>
                  <Textarea
                    id="youtube-description"
                    placeholder="Write a description for your video..."
                    value={youtubeDescription}
                    onChange={(e) => setYoutubeDescription(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="textarea-youtube-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube-tags">Tags</Label>
                  <Input
                    id="youtube-tags"
                    placeholder="Enter tags separated by commas"
                    value={youtubeTags}
                    onChange={(e) => setYoutubeTags(e.target.value)}
                    data-testid="input-youtube-tags"
                  />
                </div>
              </div>
            )}

            {hasSocialPlatforms && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-1">
                    {selectedPlatforms.includes("tiktok") && (
                      <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center ring-2 ring-background">
                        <SiTiktok className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {selectedPlatforms.includes("instagram") && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center ring-2 ring-background">
                        <SiInstagram className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {selectedPlatforms.includes("facebook") && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-background">
                        <SiFacebook className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm">Social Media Caption</h4>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social-caption">Caption</Label>
                  <Textarea
                    id="social-caption"
                    placeholder="Write a caption for your social media posts..."
                    value={socialCaption}
                    onChange={(e) => setSocialCaption(e.target.value)}
                    className="min-h-[120px]"
                    data-testid="textarea-social-caption"
                  />
                  <p className="text-xs text-muted-foreground">
                    This caption will be used for TikTok, Instagram, and Facebook
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isExporting}
          data-testid="button-back"
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleExport}
          disabled={isExporting}
          className="gap-2 min-w-[200px]"
          data-testid="button-export"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {publishType === "schedule" ? "Scheduling..." : "Publishing..."}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {selectedPlatforms.length > 0
                ? publishType === "schedule"
                  ? "Export & Schedule"
                  : "Export & Publish"
                : "Export Video"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
