import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Music,
  Mic,
  Type,
  Volume2,
  Sparkles,
  TrendingUp,
  VolumeX,
  Play,
  Wand2,
  MessageSquare,
  Subtitles,
  Bell
} from "lucide-react";

interface AudioCaptionsTabProps {
  onNext: () => void;
  onPrev: () => void;
}

const AUDIO_TYPES = [
  { 
    id: "trending", 
    label: "Trending Audio", 
    icon: TrendingUp,
    description: "Use viral platform sounds"
  },
  { 
    id: "voiceover", 
    label: "AI Voiceover", 
    icon: Mic,
    description: "Generated product pitch"
  },
  { 
    id: "music", 
    label: "Music Only", 
    icon: Music,
    description: "Background music track"
  },
  { 
    id: "asmr", 
    label: "ASMR / Product Sounds", 
    icon: Volume2,
    description: "Satisfying audio focus"
  },
  { 
    id: "none", 
    label: "No Audio", 
    icon: VolumeX,
    description: "Silent (platform muted)"
  }
];

const VOICE_STYLES = [
  { id: "enthusiastic", label: "Enthusiastic", description: "Energetic, excited tone" },
  { id: "professional", label: "Professional", description: "Clear, trustworthy delivery" },
  { id: "conversational", label: "Conversational", description: "Friendly, casual feel" },
  { id: "asmr", label: "ASMR Whisper", description: "Soft, intimate voice" },
  { id: "narrator", label: "Narrator", description: "Documentary style" },
  { id: "influencer", label: "Influencer", description: "Relatable creator vibe" }
];

const MUSIC_MOODS = [
  { id: "upbeat", label: "Upbeat", emoji: "🎵" },
  { id: "chill", label: "Chill", emoji: "😌" },
  { id: "dramatic", label: "Dramatic", emoji: "🎬" },
  { id: "inspiring", label: "Inspiring", emoji: "✨" },
  { id: "trendy", label: "Trendy", emoji: "🔥" },
  { id: "luxury", label: "Luxury", emoji: "💎" }
];

const CAPTION_STYLES = [
  { id: "auto", label: "Auto Captions", description: "Standard subtitles" },
  { id: "kinetic", label: "Kinetic Typography", description: "Animated text effects" },
  { id: "bar", label: "Subtitle Bar", description: "Bottom bar format" },
  { id: "none", label: "No Captions", description: "Video only" }
];

const SOUND_EFFECTS = [
  { id: "whoosh", label: "Whoosh", description: "Transition swoosh" },
  { id: "pop", label: "Pop", description: "Feature highlights" },
  { id: "cha-ching", label: "Cha-ching", description: "Price reveal" },
  { id: "notification", label: "Notification", description: "Alert sound" },
  { id: "click", label: "Click", description: "Button/tap sound" },
  { id: "sparkle", label: "Sparkle", description: "Magic effect" }
];

export function AudioCaptionsTab({ onNext, onPrev }: AudioCaptionsTabProps) {
  const [selectedAudioType, setSelectedAudioType] = useState("voiceover");
  const [voiceScript, setVoiceScript] = useState("");

  return (
    <div className="p-6 space-y-6">
      {/* Audio Type Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            Audio Track Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {AUDIO_TYPES.map((audio) => (
              <div
                key={audio.id}
                onClick={() => setSelectedAudioType(audio.id)}
                className={`p-4 rounded-lg border cursor-pointer hover-elevate transition-all text-center ${
                  selectedAudioType === audio.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                }`}
                data-testid={`button-audio-${audio.id}`}
              >
                <audio.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{audio.label}</p>
                <p className="text-xs text-muted-foreground">{audio.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voiceover Settings - Show when voiceover selected */}
        {selectedAudioType === "voiceover" && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                Voiceover Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Voice Style */}
                <div className="space-y-3">
                  <Label>Voice Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {VOICE_STYLES.map((voice) => (
                      <div
                        key={voice.id}
                        className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                        data-testid={`button-voice-${voice.id}`}
                      >
                        <p className="text-sm font-medium">{voice.label}</p>
                        <p className="text-xs text-muted-foreground">{voice.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Script */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Voiceover Script</Label>
                    <Button variant="outline" size="sm" data-testid="button-generate-script">
                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                      AI Generate
                    </Button>
                  </div>
                  <Textarea
                    value={voiceScript}
                    onChange={(e) => setVoiceScript(e.target.value)}
                    placeholder="Write your voiceover script or let AI generate one from your product details..."
                    className="min-h-[160px] resize-none"
                    data-testid="input-voice-script"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{voiceScript.length} characters</span>
                    <span>~{Math.ceil(voiceScript.length / 15)}s at normal pace</span>
                  </div>
                </div>
              </div>

              {/* Voice Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Speech Speed</Label>
                  <Badge variant="outline">1.2x</Badge>
                </div>
                <Slider defaultValue={[60]} max={100} step={10} data-testid="slider-voice-speed" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast (TikTok style)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Music Settings - Show when music selected */}
        {selectedAudioType === "music" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                Music Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {MUSIC_MOODS.map((mood) => (
                  <div
                    key={mood.id}
                    className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all text-center"
                    data-testid={`button-music-${mood.id}`}
                  >
                    <span className="text-2xl mb-1 block">{mood.emoji}</span>
                    <p className="text-xs font-medium">{mood.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Caption Style */}
        <Card className={selectedAudioType === "voiceover" ? "" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Subtitles className="h-4 w-4 text-primary" />
              Caption Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {CAPTION_STYLES.map((style) => (
                <div
                  key={style.id}
                  className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                  data-testid={`button-caption-${style.id}`}
                >
                  <p className="text-sm font-medium">{style.label}</p>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sound Effects */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Sound Effects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SOUND_EFFECTS.map((sfx) => (
                <div
                  key={sfx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`toggle-sfx-${sfx.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <div>
                      <p className="text-sm font-medium">{sfx.label}</p>
                      <p className="text-xs text-muted-foreground">{sfx.description}</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume Mixer */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            Volume Mixer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voiceover
                </Label>
                <span className="text-sm text-muted-foreground">80%</span>
              </div>
              <Slider defaultValue={[80]} max={100} data-testid="slider-volume-voice" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Music
                </Label>
                <span className="text-sm text-muted-foreground">40%</span>
              </div>
              <Slider defaultValue={[40]} max={100} data-testid="slider-volume-music" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Sound Effects
                </Label>
                <span className="text-sm text-muted-foreground">60%</span>
              </div>
              <Slider defaultValue={[60]} max={100} data-testid="slider-volume-sfx" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-visual">
          Back to Visual Style
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-export">
          Continue to Export
        </Button>
      </div>
    </div>
  );
}
