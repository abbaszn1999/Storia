import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Play, Pause, Check } from "lucide-react";

const VOICE_OPTIONS = [
  { value: "narrator-deep", label: "Narrator (Deep)" },
  { value: "narrator-soft", label: "Narrator (Soft)" },
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "professional", label: "Professional" },
];

const MUSIC_OPTIONS = [
  { value: "uplifting-corporate", label: "Uplifting Corporate" },
  { value: "cinematic-epic", label: "Cinematic Epic" },
  { value: "ambient-chill", label: "Ambient Chill" },
  { value: "electronic-modern", label: "Electronic Modern" },
  { value: "none", label: "No Music" },
];

interface AddAudioProps {
  onNext: () => void;
  onBack: () => void;
  voiceover: string;
  setVoiceover: (voice: string) => void;
  backgroundMusic: string;
  setBackgroundMusic: (music: string) => void;
}

export function AddAudio({
  onNext,
  onBack,
  voiceover,
  setVoiceover,
  backgroundMusic,
  setBackgroundMusic,
}: AddAudioProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const handlePlayVoice = (voiceValue: string) => {
    if (playingVoice === voiceValue) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceValue);
      // Simulate audio playback - stop after 2 seconds
      setTimeout(() => {
        setPlayingVoice(null);
      }, 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Add Audio</h1>
        <p className="text-lg text-muted-foreground">
          Choose a voice for narration and select background music.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base">Voiceover</Label>
          <div className="space-y-2">
            {VOICE_OPTIONS.map((option) => (
              <Card
                key={option.value}
                className={`p-4 cursor-pointer hover-elevate transition-all ${
                  voiceover === option.value ? "border-primary" : ""
                }`}
                onClick={() => setVoiceover(option.value)}
                data-testid={`card-voice-${option.value}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    {voiceover === option.value && (
                      <Check className="h-5 w-5 text-primary" data-testid={`icon-selected-${option.value}`} />
                    )}
                    <span className={voiceover === option.value ? "font-medium" : ""}>
                      {option.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoice(option.value);
                    }}
                    data-testid={`button-play-${option.value}`}
                  >
                    {playingVoice === option.value ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base">Background Music</Label>
          <Select value={backgroundMusic} onValueChange={setBackgroundMusic}>
            <SelectTrigger className="h-12" data-testid="select-music">
              <SelectValue placeholder="Select background music" />
            </SelectTrigger>
            <SelectContent>
              {MUSIC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-8">
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!voiceover || !backgroundMusic}
          data-testid="button-preview-video"
        >
          Preview Video
        </Button>
      </div>
    </div>
  );
}
