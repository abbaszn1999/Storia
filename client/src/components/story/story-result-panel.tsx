import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Download,
  Share2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  X,
} from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";

interface Platform {
  id: string;
  name: string;
  icon: typeof SiYoutube;
  color: string;
  connected: boolean;
}

const PLATFORMS: Platform[] = [
  { id: "youtube", name: "YouTube Shorts", icon: SiYoutube, color: "bg-red-600", connected: false },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "bg-black", connected: false },
  { id: "instagram", name: "Instagram Reels", icon: SiInstagram, color: "bg-gradient-to-br from-purple-600 to-pink-500", connected: false },
  { id: "facebook", name: "Facebook Reels", icon: SiFacebook, color: "bg-blue-600", connected: false },
];

interface StoryResultPanelProps {
  videoUrl?: string;
  videoDuration?: number;
  aspectRatio?: string;
  isGenerating?: boolean;
  onClose?: () => void;
  onRegenerate?: () => void;
}

export function StoryResultPanel({
  videoUrl,
  videoDuration = 15,
  aspectRatio = "9:16",
  isGenerating = false,
  onClose,
  onRegenerate,
}: StoryResultPanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsDownloading(false);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsPublishing(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl || "https://storia.app/v/abc123");
  };

  if (isGenerating) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Generating your video...</p>
              <p className="text-sm text-muted-foreground">This usually takes 30-60 seconds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!videoUrl) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold">Video Ready</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              data-testid="button-close-result"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-4 border-b lg:border-b-0 lg:border-r">
            <div
              className={`mx-auto bg-gradient-to-br from-gray-900 to-purple-900 rounded-lg overflow-hidden relative ${
                aspectRatio === "9:16"
                  ? "aspect-[9/16] max-h-[400px]"
                  : aspectRatio === "16:9"
                  ? "aspect-video"
                  : aspectRatio === "4:5"
                  ? "aspect-[4/5] max-h-[350px]"
                  : "aspect-square max-h-[300px]"
              }`}
              data-testid="video-preview-container"
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
                <Badge variant="secondary" className="text-xs">
                  {videoDuration}s
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="text-xs bg-background/80">
                  {aspectRatio}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
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
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRegenerate}
                  data-testid="button-regenerate"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Publish To
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      onClick={() => handlePlatformToggle(platform.id)}
                      data-testid={`platform-${platform.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                        data-testid={`checkbox-${platform.id}`}
                      />
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${platform.color}`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{platform.name}</p>
                      </div>
                      {!platform.connected && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Connect
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption" className="text-sm">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Write a caption for your post..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[70px] resize-none text-sm"
                data-testid="textarea-caption"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Schedule for later</span>
              </div>
              <Switch
                checked={isScheduled}
                onCheckedChange={setIsScheduled}
                data-testid="switch-schedule"
              />
            </div>

            {isScheduled && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-date" className="text-xs">Date</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-9 text-sm"
                    data-testid="input-schedule-date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-time" className="text-xs">Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-9 text-sm"
                    data-testid="input-schedule-time"
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handlePublish}
              disabled={selectedPlatforms.length === 0 || isPublishing}
              data-testid="button-publish"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isScheduled ? "Scheduling..." : "Publishing..."}
                </>
              ) : (
                <>
                  {isScheduled ? (
                    <>
                      <Clock className="h-4 w-4" />
                      Schedule Post
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Publish Now
                    </>
                  )}
                </>
              )}
            </Button>

            {selectedPlatforms.length === 0 && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Select at least one platform to publish
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
