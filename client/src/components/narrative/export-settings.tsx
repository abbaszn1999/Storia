import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Scissors, Download } from "lucide-react";

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "2160p", label: "2160p (4K)" },
];

interface ExportSettingsProps {
  onExport: () => void;
}

export function ExportSettings({ onExport }: ExportSettingsProps) {
  const [resolution, setResolution] = useState("1080p");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [autoGenerateShorts, setAutoGenerateShorts] = useState(false);

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

      {/* Export Button */}
      <Button onClick={onExport} className="w-full" size="lg" data-testid="button-export">
        <Download className="w-4 h-4 mr-2" />
        Export Video
      </Button>
    </div>
  );
}
