import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Scissors, Download, Share2, Calendar, Youtube, Instagram } from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "2160p", label: "2160p (4K)" },
];

export interface ExportData {
  resolution: string;
  title: string;
  summary: string;
  hashtags: string;
  autoGenerateShorts: boolean;
  publishType: "instant" | "schedule";
  selectedPlatforms: string[];
  scheduleDate?: string;
  scheduleTime?: string;
}

interface ExportSettingsProps {
  onExport: (data: ExportData) => void;
}

const PLATFORMS = [
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "tiktok", name: "TikTok", icon: SiTiktok },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "facebook", name: "Facebook", icon: SiFacebook },
];

export function ExportSettings({ onExport }: ExportSettingsProps) {
  const [resolution, setResolution] = useState("1080p");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [autoGenerateShorts, setAutoGenerateShorts] = useState(false);
  
  // Publishing options
  const [publishType, setPublishType] = useState<"instant" | "schedule">("instant");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleExport = () => {
    onExport({
      resolution,
      title,
      summary,
      hashtags,
      autoGenerateShorts,
      publishType,
      selectedPlatforms,
      scheduleDate: publishType === "schedule" ? scheduleDate : undefined,
      scheduleTime: publishType === "schedule" ? scheduleTime : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger id="resolution" data-testid="select-resolution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Title, Summary, and Hashtags */}
      <Card>
        <CardHeader>
          <CardTitle>Video Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              placeholder="Write a brief description of your video..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              data-testid="textarea-summary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              placeholder="#video #content #creative"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              data-testid="input-hashtags"
            />
            <p className="text-xs text-muted-foreground">
              Separate hashtags with spaces
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Post-Processing Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Post-Processing Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Scissors className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold">Auto-generate Shorts</h4>
                <p className="text-sm text-muted-foreground">
                  Let AI find the best hooks and create short-form clips from your video.
                </p>
              </div>
            </div>
            <Switch
              checked={autoGenerateShorts}
              onCheckedChange={setAutoGenerateShorts}
              data-testid="switch-auto-generate-shorts"
            />
          </div>
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing & Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Publish Type */}
          <RadioGroup value={publishType} onValueChange={(value: "instant" | "schedule") => setPublishType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="instant" id="instant" data-testid="radio-instant" />
              <Label htmlFor="instant" className="font-normal cursor-pointer flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                Share Instantly
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="schedule" id="schedule" data-testid="radio-schedule" />
              <Label htmlFor="schedule" className="font-normal cursor-pointer flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Schedule for Later
              </Label>
            </div>
          </RadioGroup>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Select Platforms</Label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div
                    key={platform.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedPlatforms.includes(platform.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    onClick={() => handlePlatformToggle(platform.id)}
                    data-testid={`platform-${platform.id}`}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{platform.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Date & Time */}
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

      {/* Export Button */}
      <Button onClick={handleExport} className="w-full" size="lg" data-testid="button-export">
        <Download className="w-4 h-4 mr-2" />
        {publishType === "instant" && selectedPlatforms.length > 0
          ? "Export & Publish"
          : publishType === "schedule" && selectedPlatforms.length > 0
          ? "Export & Schedule"
          : "Export Video"}
      </Button>
    </div>
  );
}
