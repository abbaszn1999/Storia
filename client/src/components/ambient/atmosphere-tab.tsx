import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Sparkles, Cloud, Sun, Moon, Sunrise, Sunset, TreePine, Building2, Shapes, Stars, Home, Castle, Snowflake, CloudRain, CloudFog, Leaf } from "lucide-react";

const MOODS = [
  { id: "calm", label: "Calm", description: "Peaceful and serene" },
  { id: "mysterious", label: "Mysterious", description: "Enigmatic and intriguing" },
  { id: "energetic", label: "Energetic", description: "Dynamic and vibrant" },
  { id: "nostalgic", label: "Nostalgic", description: "Wistful and sentimental" },
  { id: "cozy", label: "Cozy", description: "Warm and comfortable" },
  { id: "dark", label: "Dark", description: "Moody and intense" },
  { id: "dreamy", label: "Dreamy", description: "Surreal and floating" },
  { id: "ethereal", label: "Ethereal", description: "Otherworldly and delicate" },
];

const THEMES = [
  { id: "nature", label: "Nature", icon: TreePine },
  { id: "urban", label: "Urban", icon: Building2 },
  { id: "abstract", label: "Abstract", icon: Shapes },
  { id: "cosmic", label: "Cosmic", icon: Stars },
  { id: "interior", label: "Interior", icon: Home },
  { id: "fantasy", label: "Fantasy", icon: Castle },
];

const TIME_CONTEXTS = [
  { id: "dawn", label: "Dawn", icon: Sunrise },
  { id: "day", label: "Day", icon: Sun },
  { id: "sunset", label: "Sunset", icon: Sunset },
  { id: "night", label: "Night", icon: Moon },
  { id: "timeless", label: "Timeless", icon: Sparkles },
];

const SEASONS = [
  { id: "spring", label: "Spring", icon: Leaf },
  { id: "summer", label: "Summer", icon: Sun },
  { id: "autumn", label: "Autumn", icon: Leaf },
  { id: "winter", label: "Winter", icon: Snowflake },
  { id: "rainy", label: "Rainy", icon: CloudRain },
  { id: "snowy", label: "Snowy", icon: Snowflake },
  { id: "foggy", label: "Foggy", icon: CloudFog },
  { id: "neutral", label: "Neutral", icon: Cloud },
];

const DURATIONS = [
  { value: "30s", label: "30 seconds" },
  { value: "1min", label: "1 minute" },
  { value: "3min", label: "3 minutes" },
  { value: "5min", label: "5 minutes" },
  { value: "10min", label: "10 minutes" },
  { value: "custom", label: "Custom" },
];

interface AtmosphereTabProps {
  mood: string;
  theme: string;
  timeContext: string;
  season: string;
  intensity: number;
  duration: string;
  moodDescription: string;
  onMoodChange: (mood: string) => void;
  onThemeChange: (theme: string) => void;
  onTimeContextChange: (timeContext: string) => void;
  onSeasonChange: (season: string) => void;
  onIntensityChange: (intensity: number) => void;
  onDurationChange: (duration: string) => void;
  onMoodDescriptionChange: (description: string) => void;
  onNext: () => void;
}

export function AtmosphereTab({
  mood,
  theme,
  timeContext,
  season,
  intensity,
  duration,
  moodDescription,
  onMoodChange,
  onThemeChange,
  onTimeContextChange,
  onSeasonChange,
  onIntensityChange,
  onDurationChange,
  onMoodDescriptionChange,
  onNext,
}: AtmosphereTabProps) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Define the Atmosphere</h2>
        <p className="text-muted-foreground">
          Set the emotional foundation for your ambient visual experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Primary Mood */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Primary Mood</Label>
              <p className="text-sm text-muted-foreground">
                What feeling should this video evoke?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onMoodChange(m.id)}
                    className={`p-4 rounded-lg border text-left transition-all hover-elevate ${
                      mood === m.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-mood-${m.id}`}
                  >
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme/Environment */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Theme / Environment</Label>
              <p className="text-sm text-muted-foreground">
                What type of visual world?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onThemeChange(t.id)}
                      className={`p-4 rounded-lg border text-center transition-all hover-elevate ${
                        theme === t.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                      data-testid={`button-theme-${t.id}`}
                    >
                      <Icon className="h-6 w-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{t.label}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Mood Description */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Mood Description</Label>
              <p className="text-sm text-muted-foreground">
                Describe the atmosphere in your own words for more nuanced results
              </p>
              <Textarea
                placeholder="e.g., A lonely coffee shop on a rainy evening, warm light spilling onto wet cobblestones..."
                value={moodDescription}
                onChange={(e) => onMoodDescriptionChange(e.target.value)}
                rows={4}
                className="resize-none"
                data-testid="input-mood-description"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Time Context */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Time of Day</Label>
              <div className="flex flex-wrap gap-2">
                {TIME_CONTEXTS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onTimeContextChange(t.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover-elevate ${
                        timeContext === t.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                      data-testid={`button-time-${t.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Season/Weather */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Season / Weather</Label>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSeasonChange(s.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover-elevate ${
                        season === s.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                      data-testid={`button-season-${s.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Intensity */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Visual Intensity</Label>
                <Badge variant="secondary">{intensity}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                How rich and dramatic should the visuals be?
              </p>
              <div className="pt-2">
                <Slider
                  value={[intensity]}
                  onValueChange={([val]) => onIntensityChange(val)}
                  min={0}
                  max={100}
                  step={10}
                  data-testid="slider-intensity"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Subtle & Minimal</span>
                  <span>Rich & Dramatic</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold">Target Duration</Label>
              <Select value={duration} onValueChange={onDurationChange}>
                <SelectTrigger data-testid="select-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!mood || !theme}
          size="lg"
          data-testid="button-continue-atmosphere"
        >
          Continue to Visual World
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
