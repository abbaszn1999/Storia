import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
import type { StoryScene } from "./storyboard-editor";

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

interface AudioSettingsProps {
  onNext: () => void;
  onBack: () => void;
  voiceover: string;
  setVoiceover: (voice: string) => void;
  backgroundMusic: string;
  setBackgroundMusic: (music: string) => void;
  voiceVolume: number;
  setVoiceVolume: (volume: number) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  scenes: StoryScene[];
  voiceoverEnabled: boolean;
}

export function AudioSettings({
  onNext,
  onBack,
  voiceover,
  setVoiceover,
  backgroundMusic,
  setBackgroundMusic,
  voiceVolume,
  setVoiceVolume,
  musicVolume,
  setMusicVolume,
  scenes,
  voiceoverEnabled,
}: AudioSettingsProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [playingScene, setPlayingScene] = useState<number | null>(null);
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

  const handlePlaySceneNarration = (index: number) => {
    if (playingScene === index) {
      setPlayingScene(null);
    } else {
      setPlayingScene(index);
      setTimeout(() => setPlayingScene(null), 2000);
    }
  };

  const handleSelectVoice = (voiceValue: string) => {
    setVoiceover(voiceValue);
    setVoiceDropdownOpen(false);
  };

  const selectedVoiceLabel = VOICE_OPTIONS.find(v => v.value === voiceover)?.label || "Select a voice";
  const selectedMusicLabel = MUSIC_OPTIONS.find(m => m.value === backgroundMusic)?.label || "Select music";

  const canProceed = voiceoverEnabled ? (voiceover && backgroundMusic) : backgroundMusic;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Audio Settings</h1>
        <p className="text-lg text-muted-foreground">
          Configure voiceover and background music for your video.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {voiceoverEnabled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                Voiceover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <span className={voiceover ? "font-medium" : "text-muted-foreground"}>
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
                            className="flex items-center gap-2 px-2 py-2.5 hover-elevate rounded-md cursor-pointer"
                            onClick={() => handleSelectVoice(option.value)}
                            data-testid={`option-voice-${option.value}`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              {voiceover === option.value && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                              <div className="flex-1">
                                <div className={voiceover === option.value ? "font-medium" : ""}>
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
                    onValueChange={([value]) => setVoiceVolume(value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                    data-testid="slider-voice-volume"
                  />
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <Select value={backgroundMusic} onValueChange={setBackgroundMusic}>
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

            {backgroundMusic && backgroundMusic !== "none" && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePlayMusic(backgroundMusic)}
                  data-testid="button-preview-music"
                >
                  {playingMusic === backgroundMusic ? (
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
                      onValueChange={([value]) => setMusicVolume(value)}
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
          </CardContent>
        </Card>
      </div>

      {voiceoverEnabled && scenes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Scene Narrations Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={`Scene ${scene.sceneNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        {scene.sceneNumber}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">Scene {scene.sceneNumber}</span>
                      <Badge variant="outline" className="text-[10px]">{scene.duration}s</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {scene.narration || "No narration"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handlePlaySceneNarration(index)}
                    disabled={!scene.narration}
                    data-testid={`button-play-scene-${index}`}
                  >
                    {playingScene === index ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          data-testid="button-next-export"
        >
          Next: Preview & Export
        </Button>
      </div>
    </div>
  );
}
