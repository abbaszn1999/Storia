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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, Check, ChevronDown } from "lucide-react";

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
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);

  const handlePlayVoice = (voiceValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleSelectVoice = (voiceValue: string) => {
    setVoiceover(voiceValue);
    setVoiceDropdownOpen(false);
  };

  const selectedVoiceLabel = VOICE_OPTIONS.find(v => v.value === voiceover)?.label || "Select a voice";

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
          <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={voiceDropdownOpen}
                className="w-full h-12 justify-between"
                data-testid="button-voice-selector"
              >
                <span className={voiceover ? "font-medium" : "text-muted-foreground"}>
                  {selectedVoiceLabel}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <ScrollArea className="max-h-[300px]">
                <div className="p-1">
                  {VOICE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center gap-2 px-2 py-2 hover-elevate rounded-md cursor-pointer"
                      onClick={() => handleSelectVoice(option.value)}
                      data-testid={`option-voice-${option.value}`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {voiceover === option.value && (
                          <Check className="h-4 w-4 text-primary" data-testid={`icon-selected-${option.value}`} />
                        )}
                        <span className={`flex-1 ${voiceover === option.value ? "font-medium" : ""}`}>
                          {option.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => handlePlayVoice(option.value, e)}
                        data-testid={`button-play-${option.value}`}
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
