import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone } from "lucide-react";

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "1440p", label: "1440p (2K)" },
  { value: "2160p", label: "2160p (4K)" },
];

interface ExportVideoProps {
  onBack: () => void;
  onExport: () => void;
}

export function ExportVideo({ onBack, onExport }: ExportVideoProps) {
  const [resolution, setResolution] = useState("1080p");
  const [isExporting, setIsExporting] = useState(false);

  const handleRenderVideo = async () => {
    setIsExporting(true);
    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsExporting(false);
    onExport();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Export Your Video</h1>
        <p className="text-lg text-muted-foreground">
          Choose your desired export settings.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-8 space-y-6">
        <div className="space-y-3">
          <Label className="text-base">Resolution</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger className="h-12" data-testid="select-resolution">
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

        <div className="space-y-3">
          <Label className="text-base">Format</Label>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">9:16 Vertical</span>
                <Badge variant="secondary" data-testid="badge-vertical">
                  Locked
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Optimized for TikTok, Instagram Reels, and YouTube Shorts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isExporting}
          data-testid="button-back"
        >
          Back
        </Button>
        <Button
          onClick={handleRenderVideo}
          disabled={isExporting}
          size="lg"
          className="px-8"
          data-testid="button-render-video"
        >
          {isExporting ? "Rendering..." : "Render Video"}
        </Button>
      </div>
    </div>
  );
}
