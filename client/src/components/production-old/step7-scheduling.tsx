import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Clock, Zap, Settings2 } from "lucide-react";
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
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null);

  useEffect(() => {
    if (scheduleStartDate && scheduleEndDate && maxVideosPerDay > 0) {
      const start = new Date(scheduleStartDate);
      const end = new Date(scheduleEndDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const maxPossibleVideos = daysDiff * maxVideosPerDay;
      setEstimatedDays(daysDiff);

      if (maxPossibleVideos < videoCount) {
        setValidationError(
          `Cannot fit ${videoCount} videos in ${daysDiff} days with max ${maxVideosPerDay} video(s) per day.`
        );
      } else {
        setValidationError(null);
      }
    } else {
      setEstimatedDays(null);
      setValidationError(null);
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Schedule & Automation</h2>
        <p className="text-muted-foreground mt-2">
          Configure when and how your {videoCount} video{videoCount !== 1 ? 's' : ''} will be produced and published
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Automation Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onAutomationModeChange("manual")}
                className={`p-4 rounded-lg border text-left transition-all ${
                  automationMode === "manual"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                data-testid="button-mode-manual"
              >
                <p className="font-medium mb-1">Manual</p>
                <p className="text-xs text-muted-foreground">Review and approve each video before publishing</p>
              </button>
              <button
                type="button"
                onClick={() => onAutomationModeChange("auto")}
                className={`p-4 rounded-lg border text-left transition-all ${
                  automationMode === "auto"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                data-testid="button-mode-auto"
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">Automatic</p>
                  <Zap className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">AI handles everything end-to-end</p>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={scheduleStartDate}
                  onChange={(e) => onScheduleStartDateChange(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-xs">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={scheduleEndDate}
                  onChange={(e) => onScheduleEndDateChange(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            {estimatedDays && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Campaign Duration</span>
                <Badge variant="secondary">{estimatedDays} day{estimatedDays !== 1 ? 's' : ''}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Publishing Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="space-y-2 flex-1">
              <Label htmlFor="max-videos-per-day" className="text-xs">Max Videos Per Day</Label>
              <Input
                id="max-videos-per-day"
                type="number"
                min="1"
                max="10"
                value={maxVideosPerDay}
                onChange={(e) => onMaxVideosPerDayChange(parseInt(e.target.value) || 1)}
                className="w-24"
                data-testid="input-max-videos-per-day"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Videos to schedule</span>
                <Badge>{videoCount}</Badge>
              </div>
            </div>
          </div>

          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Preferred Publishing Hours</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={publishHoursMode === "ai" ? "default" : "outline"}
                  onClick={() => onPublishHoursModeChange("ai")}
                  data-testid="button-hours-mode-ai"
                >
                  AI Optimized
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={publishHoursMode === "user" ? "default" : "outline"}
                  onClick={() => onPublishHoursModeChange("user")}
                  data-testid="button-hours-mode-user"
                >
                  Custom Hours
                </Button>
              </div>
            </div>

            {publishHoursMode === "user" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Select hours when videos should be published (24-hour format)
                </p>
                <div className="grid grid-cols-12 gap-1.5">
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <Button
                      key={hour}
                      type="button"
                      variant={preferredPublishHours.includes(hour) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleHour(hour)}
                      className="w-full text-xs px-0"
                      data-testid={`button-hour-${hour}`}
                    >
                      {hour.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                {preferredPublishHours.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  AI will analyze your target audience and platform best practices to determine optimal publishing times for maximum engagement.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
