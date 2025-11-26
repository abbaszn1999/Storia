import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  Pause,
  Check,
  ChevronDown,
  Mic,
  Music,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Step4StoryAudioProps {
  hasVoiceOver: boolean;
  onHasVoiceOverChange: (enabled: boolean) => void;
  voiceProfile: string;
  onVoiceProfileChange: (profile: string) => void;
  backgroundMusicTrack: string;
  onBackgroundMusicTrackChange: (track: string) => void;
  voiceVolume: number;
  onVoiceVolumeChange: (volume: number) => void;
  musicVolume: number;
  onMusicVolumeChange: (volume: number) => void;
}

const VOICE_OPTIONS = [
  { value: "narrator-deep", label: "Narrator (Deep)", gender: "male", style: "authoritative" },
  { value: "narrator-soft", label: "Narrator (Soft)", gender: "female", style: "warm" },
  { value: "energetic-male", label: "Energetic Male", gender: "male", style: "upbeat" },
  { value: "energetic-female", label: "Energetic Female", gender: "female", style: "upbeat" },
  { value: "calm-male", label: "Calm Male", gender: "male", style: "soothing" },
  { value: "calm-female", label: "Calm Female", gender: "female", style: "soothing" },
  { value: "professional", label: "Professional", gender: "neutral", style: "corporate" },
];

const MUSIC_OPTIONS = [
  { value: "uplifting-corporate", label: "Uplifting Corporate", mood: "positive", tempo: "medium" },
  { value: "cinematic-epic", label: "Cinematic Epic", mood: "dramatic", tempo: "slow" },
  { value: "ambient-chill", label: "Ambient Chill", mood: "relaxed", tempo: "slow" },
  { value: "electronic-modern", label: "Electronic Modern", mood: "energetic", tempo: "fast" },
  { value: "acoustic-warm", label: "Acoustic Warm", mood: "friendly", tempo: "medium" },
  { value: "inspirational", label: "Inspirational", mood: "motivating", tempo: "medium" },
  { value: "none", label: "No Music", mood: "none", tempo: "none" },
];

export function Step4StoryAudio({
  hasVoiceOver,
  onHasVoiceOverChange,
  voiceProfile,
  onVoiceProfileChange,
  backgroundMusicTrack,
  onBackgroundMusicTrackChange,
  voiceVolume,
  onVoiceVolumeChange,
  musicVolume,
  onMusicVolumeChange,
}: Step4StoryAudioProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);

  const handlePlayVoice = (voiceValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoice === voiceValue) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceValue);
      setTimeout(() => setPlayingVoice(null), 2000);
    }
  };

  const handlePlayMusic = (musicValue: string) => {
    if (playingMusic === musicValue) {
      setPlayingMusic(null);
    } else {
      setPlayingMusic(musicValue);
      setTimeout(() => setPlayingMusic(null), 3000);
    }
  };

  const handleSelectVoice = (voiceValue: string) => {
    onVoiceProfileChange(voiceValue);
    setVoiceDropdownOpen(false);
  };

  const selectedVoiceLabel = VOICE_OPTIONS.find(v => v.value === voiceProfile)?.label || "Select a voice";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Audio Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure voiceover and background music for your videos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                Voiceover
              </CardTitle>
              <Switch
                checked={hasVoiceOver}
                onCheckedChange={onHasVoiceOverChange}
                data-testid="switch-voiceover-enabled"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasVoiceOver ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Voice Selection</Label>
                  <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={voiceDropdownOpen}
                        className="w-full h-11 justify-between"
                        data-testid="button-voice-selector"
                      >
                        <span className={voiceProfile ? "font-medium" : "text-muted-foreground"}>
                          {selectedVoiceLabel}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <ScrollArea className="max-h-[280px]">
                        <div className="p-1">
                          {VOICE_OPTIONS.map((option) => (
                            <div
                              key={option.value}
                              className="flex items-center gap-2 px-2 py-2.5 hover:bg-muted rounded-md cursor-pointer"
                              onClick={() => handleSelectVoice(option.value)}
                              data-testid={`option-voice-${option.value}`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {voiceProfile === option.value && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                                <div className="flex-1">
                                  <div className={voiceProfile === option.value ? "font-medium" : ""}>
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.gender} · {option.style}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={(e) => handlePlayVoice(option.value, e)}
                                data-testid={`button-play-voice-${option.value}`}
                              >
                                {playingVoice === option.value ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Voice Volume</Label>
                    <span className="text-sm font-medium">{voiceVolume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[voiceVolume]}
                      onValueChange={([value]) => onVoiceVolumeChange(value)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                      data-testid="slider-voice-volume"
                    />
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Voiceover is disabled
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              Background Music
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Music Track</Label>
              <Select value={backgroundMusicTrack} onValueChange={onBackgroundMusicTrackChange}>
                <SelectTrigger className="h-11" data-testid="select-music">
                  <SelectValue placeholder="Select background music" />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        {option.mood !== "none" && (
                          <Badge variant="outline" className="text-[10px]">
                            {option.mood}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {backgroundMusicTrack && backgroundMusicTrack !== "none" && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePlayMusic(backgroundMusicTrack)}
                  data-testid="button-preview-music"
                >
                  {playingMusic === backgroundMusicTrack ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Preview Music
                    </>
                  )}
                </Button>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Music Volume</Label>
                    <span className="text-sm font-medium">{musicVolume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[musicVolume]}
                      onValueChange={([value]) => onMusicVolumeChange(value)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                      data-testid="slider-music-volume"
                    />
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </>
            )}

            {(!backgroundMusicTrack || backgroundMusicTrack === "none") && (
              <div className="text-center py-4">
                <Music className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No background music selected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Audio Summary</p>
              <p className="text-sm text-muted-foreground">
                {hasVoiceOver && voiceProfile ? (
                  <>Voiceover: {VOICE_OPTIONS.find(v => v.value === voiceProfile)?.label} at {voiceVolume}%</>
                ) : (
                  "No voiceover"
                )}
                {" · "}
                {backgroundMusicTrack && backgroundMusicTrack !== "none" ? (
                  <>{MUSIC_OPTIONS.find(m => m.value === backgroundMusicTrack)?.label} at {musicVolume}%</>
                ) : (
                  "No background music"
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
