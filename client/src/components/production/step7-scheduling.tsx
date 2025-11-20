import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Step7SchedulingProps {
  scheduleStartDate: string;
  onScheduleStartDateChange: (value: string) => void;
  scheduleEndDate: string;
  onScheduleEndDateChange: (value: string) => void;
  automationMode: "manual" | "auto";
  onAutomationModeChange: (value: "manual" | "auto") => void;
  publishHoursMode: "user" | "ai";
  onPublishHoursModeChange: (value: "user" | "ai") => void;
  preferredPublishHours: number[];
  onPreferredPublishHoursChange: (hours: number[]) => void;
  maxVideosPerDay: number;
  onMaxVideosPerDayChange: (value: number) => void;
  videoCount: number;
}

export function Step7Scheduling({
  scheduleStartDate,
  onScheduleStartDateChange,
  scheduleEndDate,
  onScheduleEndDateChange,
  automationMode,
  onAutomationModeChange,
  publishHoursMode,
  onPublishHoursModeChange,
  preferredPublishHours,
  onPreferredPublishHoursChange,
  maxVideosPerDay,
  onMaxVideosPerDayChange,
  videoCount,
}: Step7SchedulingProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleStartDate && scheduleEndDate && maxVideosPerDay > 0) {
      const start = new Date(scheduleStartDate);
      const end = new Date(scheduleEndDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const maxPossibleVideos = daysDiff * maxVideosPerDay;

      if (maxPossibleVideos < videoCount) {
        setValidationError(
          `Cannot fit ${videoCount} videos in ${daysDiff} days with max ${maxVideosPerDay} video(s) per day. You can only schedule ${maxPossibleVideos} videos.`
        );
      } else {
        setValidationError(null);
      }
    }
  }, [scheduleStartDate, scheduleEndDate, maxVideosPerDay, videoCount]);

  const toggleHour = (hour: number) => {
    if (preferredPublishHours.includes(hour)) {
      onPreferredPublishHoursChange(preferredPublishHours.filter((h) => h !== hour));
    } else {
      onPreferredPublishHoursChange([...preferredPublishHours, hour].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Scheduling</h2>
        <p className="text-muted-foreground mt-2">
          Set up when and how your videos will be published
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="automation-mode">Automation Mode</Label>
            <p className="text-sm text-muted-foreground">Choose manual approval or fully automated</p>
          </div>
          <Select value={automationMode} onValueChange={(v) => onAutomationModeChange(v as "manual" | "auto")}>
            <SelectTrigger id="automation-mode" className="w-48" data-testid="select-automation-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual (Requires Approval)</SelectItem>
              <SelectItem value="auto">Auto (Fully Automated)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={scheduleStartDate}
              onChange={(e) => onScheduleStartDateChange(e.target.value)}
              data-testid="input-start-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={scheduleEndDate}
              onChange={(e) => onScheduleEndDateChange(e.target.value)}
              data-testid="input-end-date"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-videos-per-day">Max Videos Per Day</Label>
          <Input
            id="max-videos-per-day"
            type="number"
            min="1"
            max="10"
            value={maxVideosPerDay}
            onChange={(e) => onMaxVideosPerDayChange(parseInt(e.target.value) || 1)}
            data-testid="input-max-videos-per-day"
          />
        </div>

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 border-t pt-4">
          <Label>Preferred Publishing Hours</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={publishHoursMode === "user" ? "default" : "outline"}
              onClick={() => onPublishHoursModeChange("user")}
              data-testid="button-hours-mode-user"
            >
              Select Hours
            </Button>
            <Button
              type="button"
              variant={publishHoursMode === "ai" ? "default" : "outline"}
              onClick={() => onPublishHoursModeChange("ai")}
              data-testid="button-hours-mode-ai"
            >
              AI Suggested
            </Button>
          </div>

          {publishHoursMode === "user" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Select the hours when you want videos to be published (24-hour format)
              </p>
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Button
                    key={hour}
                    type="button"
                    variant={preferredPublishHours.includes(hour) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleHour(hour)}
                    className="w-full"
                    data-testid={`button-hour-${hour}`}
                  >
                    {hour.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              {preferredPublishHours.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  {preferredPublishHours.map((hour) => (
                    <Badge key={hour} variant="secondary">
                      {hour.toString().padStart(2, "0")}:00
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {publishHoursMode === "ai" && (
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                AI will analyze your target audience and platform best practices to suggest optimal publishing times.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
