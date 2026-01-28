import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, Calendar, Repeat } from "lucide-react";
import { motion } from "framer-motion";

type AutomationMode = 'continuous' | 'scheduled';

interface Platform {
  id: string;
  name: string;
  available: boolean;
}

const PLATFORMS: Platform[] = [
  { id: 'youtube', name: 'YouTube', available: true },
  { id: 'tiktok', name: 'TikTok', available: true },
  { id: 'instagram', name: 'Instagram', available: true },
  { id: 'facebook', name: 'Facebook', available: true },
];

const AUTOMATION_MODES: { value: AutomationMode; label: string; description: string }[] = [
  { value: 'continuous', label: 'Continuous', description: 'Auto-space videos evenly' },
  { value: 'scheduled', label: 'Scheduled', description: 'Pick date for each topic' },
];

// Video idea with index (from create.tsx)
interface VideoIdea {
  idea: string;
  index: number;
}

interface Step5SchedulePublishingProps {
  // Mode selection
  automationMode: AutomationMode;
  onAutomationModeChange: (value: AutomationMode) => void;
  
  // Continuous mode props
  scheduleStartDate: string;
  onScheduleStartDateChange: (value: string) => void;
  maxPerDay: number;
  onMaxPerDayChange: (value: number) => void;
  
  // Scheduled mode props
  videoIdeas: VideoIdea[];
  topicSchedules: Record<string, string>;
  onTopicSchedulesChange: (schedules: Record<string, string>) => void;
  
  // Publishing props
  selectedPlatforms: string[];
  onSelectedPlatformsChange: (platforms: string[]) => void;
}

export function Step5SchedulePublishing({
  automationMode,
  onAutomationModeChange,
  scheduleStartDate,
  onScheduleStartDateChange,
  maxPerDay,
  onMaxPerDayChange,
  videoIdeas,
  topicSchedules,
  onTopicSchedulesChange,
  selectedPlatforms,
  onSelectedPlatformsChange,
}: Step5SchedulePublishingProps) {
  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onSelectedPlatformsChange(selectedPlatforms.filter((p) => p !== platformId));
    } else {
      onSelectedPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  const updateTopicSchedule = (index: number, date: string) => {
    onTopicSchedulesChange({
      ...topicSchedules,
      [String(index)]: date,
    });
  };

  const availablePlatforms = PLATFORMS.filter((p) => p.available);
  const videoCount = videoIdeas.length;
  const today = new Date().toISOString().split('T')[0];

  // Continuous mode: Compute spacing and estimated completion
  const spacingHours = maxPerDay > 0 ? Math.floor(24 / maxPerDay) : 24;
  const daysToComplete = videoCount > 0 && maxPerDay > 0 ? Math.ceil(videoCount / maxPerDay) : 0;
  const estimatedCompletionDate = scheduleStartDate
    ? (() => {
        const start = new Date(scheduleStartDate);
        start.setDate(start.getDate() + daysToComplete);
        return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      })()
    : '—';

  return (
    <div className="space-y-8 w-full">
      {/* Page Title */}
      <div className="text-center space-y-3 pb-4">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <CalendarClock className="h-8 w-8 text-violet-500" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500">
            Schedule & Publishing
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Configure scheduling and publishing platforms
        </p>
      </div>

      {/* Automation Mode Selection */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <Label className="text-lg font-semibold text-white">Publishing Mode</Label>
          <p className="text-sm text-white/50">Choose how you want to schedule video publishing</p>
          <div className="grid grid-cols-2 gap-3">
            {AUTOMATION_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => onAutomationModeChange(mode.value)}
                className={`py-3 px-4 rounded-lg border text-left transition-all ${
                  automationMode === mode.value
                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {mode.value === 'continuous' ? (
                    <Repeat className={`h-4 w-4 ${automationMode === mode.value ? 'text-violet-400' : 'text-white/50'}`} />
                  ) : (
                    <Calendar className={`h-4 w-4 ${automationMode === mode.value ? 'text-violet-400' : 'text-white/50'}`} />
                  )}
                  <span className={`text-sm font-medium ${automationMode === mode.value ? 'text-violet-400' : 'text-white/70'}`}>
                    {mode.label}
                  </span>
                </div>
                <p className={`text-xs ${automationMode === mode.value ? 'text-violet-300/70' : 'text-white/40'}`}>
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Continuous Mode Settings */}
      {automationMode === 'continuous' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative z-10 p-6 space-y-6">
              <div>
                <Label className="text-lg font-semibold text-white">Continuous Publishing</Label>
                <p className="text-sm text-white/50 mt-1">Videos will be spaced evenly based on your settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => onScheduleStartDateChange(e.target.value)}
                    min={today}
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-white/40">When publishing begins</p>
                </div>

                {/* Videos Per Day */}
                <div className="space-y-2">
                  <Label>Videos Per Day</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => onMaxPerDayChange(num)}
                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                          maxPerDay === num
                            ? 'border-violet-500 bg-gradient-to-br from-violet-500/10 to-violet-500/5 text-violet-400'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              {videoCount > 0 && (
                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-medium text-violet-400">Schedule Summary</span>
                  </div>
                  <p className="text-sm text-white/70">
                    <span className="text-white font-medium">{videoCount} videos</span> at{' '}
                    <span className="text-white font-medium">{maxPerDay}/day</span> → one every{' '}
                    <span className="text-white font-medium">{spacingHours}h</span>
                    {scheduleStartDate && (
                      <span>
                        {' '}· Done by <span className="text-white font-medium">{estimatedCompletionDate}</span>
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scheduled Mode Settings */}
      {automationMode === 'scheduled' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative z-10 p-6 space-y-6">
              <div>
                <Label className="text-lg font-semibold text-white">Publish Date Per Topic</Label>
                <p className="text-sm text-white/50 mt-1">Choose when each video should be published</p>
              </div>

              {videoIdeas.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No video ideas added yet.</p>
                  <p className="text-xs mt-1">Add ideas in Step 2 to schedule them.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {videoIdeas.map((item, idx) => (
                    <div
                      key={item.index}
                      className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-violet-400">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate" title={item.idea}>
                          {item.idea.length > 50 ? item.idea.slice(0, 50) + '...' : item.idea}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Input
                          type="date"
                          value={topicSchedules[String(item.index)] || ''}
                          onChange={(e) => updateTopicSchedule(item.index, e.target.value)}
                          min={today}
                          className="w-[150px] bg-white/5 border-white/10 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Scheduled count summary */}
              {videoIdeas.length > 0 && (
                <div className="flex items-center justify-between text-sm text-white/50 pt-2 border-t border-white/10">
                  <span>
                    {Object.values(topicSchedules).filter(Boolean).length} of {videoIdeas.length} scheduled
                  </span>
                  {Object.values(topicSchedules).filter(Boolean).length < videoIdeas.length && (
                    <span className="text-amber-400/80">Please schedule all topics</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Publishing Platforms */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-semibold text-white">Publishing Platforms</Label>
              <p className="text-sm text-white/50 mt-1">Select platforms to publish your videos automatically</p>
            </div>
            <Badge variant="secondary">
              {selectedPlatforms.length} selected
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {availablePlatforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5 text-pink-400'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
