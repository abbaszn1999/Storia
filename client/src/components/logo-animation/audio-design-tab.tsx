import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { LogoAnimationSettings } from "@/components/logo-animation-workflow";
import { 
  Music,
  Volume2,
  VolumeX,
  Wind,
  Zap,
  Sparkles,
  Mic,
  Play,
  Clock
} from "lucide-react";

interface AudioDesignTabProps {
  settings: LogoAnimationSettings;
  onUpdate: (updates: Partial<LogoAnimationSettings>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const SOUND_TYPES = [
  { 
    id: "whoosh-impact", 
    label: "Whoosh + Impact", 
    icon: Wind,
    description: "Classic logo reveal sound"
  },
  { 
    id: "musical-sting", 
    label: "Musical Sting", 
    icon: Music,
    description: "Short melodic signature"
  },
  { 
    id: "ambient-texture", 
    label: "Ambient Texture", 
    icon: Sparkles,
    description: "Atmospheric soundscape"
  },
  { 
    id: "voice-tag", 
    label: "Voice Tag", 
    icon: Mic,
    description: "Spoken brand name"
  },
  { 
    id: "silent", 
    label: "Silent", 
    icon: VolumeX,
    description: "No audio"
  }
];

const SOUND_CHARACTERS = [
  { id: "techy", label: "Techy", description: "Digital, electronic" },
  { id: "organic", label: "Organic", description: "Natural, acoustic" },
  { id: "cinematic", label: "Cinematic", description: "Epic, theatrical" },
  { id: "playful", label: "Playful", description: "Fun, whimsical" },
  { id: "elegant", label: "Elegant", description: "Refined, sophisticated" },
  { id: "powerful", label: "Powerful", description: "Bold, impactful" }
];

const TIMING_MARKERS = [
  { id: "start", label: "Animation Start", time: "0.0s" },
  { id: "reveal", label: "Logo Reveal", time: "0.5s" },
  { id: "settle", label: "Settle Point", time: "1.5s" },
  { id: "end", label: "Animation End", time: "3.0s" }
];

function formatTime(value: number): string {
  return `${(value / 100).toFixed(1)}s`;
}

export function AudioDesignTab({ settings, onUpdate, onNext, onPrev }: AudioDesignTabProps) {
  const handleVolumeChange = (key: keyof LogoAnimationSettings["volume"], value: number) => {
    onUpdate({
      volume: {
        ...settings.volume,
        [key]: value
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Sound Type Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            Sound Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {SOUND_TYPES.map((sound) => (
              <button
                key={sound.id}
                onClick={() => onUpdate({ soundType: sound.id })}
                className={`p-4 rounded-lg border text-center transition-all ${
                  settings.soundType === sound.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover-elevate"
                }`}
                data-testid={`button-sound-${sound.id}`}
              >
                <sound.icon className={`h-8 w-8 mx-auto mb-2 ${
                  settings.soundType === sound.id ? "text-primary" : "text-muted-foreground"
                }`} />
                <p className="text-sm font-medium">{sound.label}</p>
                <p className="text-xs text-muted-foreground">{sound.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sound Character */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Sound Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {SOUND_CHARACTERS.map((character) => (
                <button
                  key={character.id}
                  onClick={() => onUpdate({ soundCharacter: character.id })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.soundCharacter === character.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-character-${character.id}`}
                >
                  <p className="text-sm font-medium">{character.label}</p>
                  <p className="text-xs text-muted-foreground">{character.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Volume Controls */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-primary" />
              Volume & Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Master Volume</Label>
                <span className="text-sm text-muted-foreground">{settings.volume.master}%</span>
              </div>
              <Slider 
                value={[settings.volume.master]} 
                onValueChange={([value]) => handleVolumeChange("master", value)}
                max={100} 
                data-testid="slider-master-volume" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fade In</Label>
                <span className="text-sm text-muted-foreground">{formatTime(settings.volume.fadeIn)}</span>
              </div>
              <Slider 
                value={[settings.volume.fadeIn]} 
                onValueChange={([value]) => handleVolumeChange("fadeIn", value)}
                max={100} 
                data-testid="slider-fade-in" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fade Out</Label>
                <span className="text-sm text-muted-foreground">{formatTime(settings.volume.fadeOut)}</span>
              </div>
              <Slider 
                value={[settings.volume.fadeOut]} 
                onValueChange={([value]) => handleVolumeChange("fadeOut", value)}
                max={100} 
                data-testid="slider-fade-out" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timing Sync */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Timing Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visual Timeline */}
          <div className="relative">
            <div className="h-16 bg-muted rounded-lg overflow-hidden relative">
              {/* Waveform Visualization */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                  <path
                    d="M0,30 Q50,10 100,30 T200,30 T300,30 T400,30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                  />
                </svg>
              </div>
              
              {/* Timeline Markers */}
              <div className="absolute inset-0 flex items-end">
                {TIMING_MARKERS.map((marker, index) => (
                  <div
                    key={marker.id}
                    className="flex-1 flex flex-col items-center justify-end pb-2 border-r border-border/50 last:border-r-0"
                  >
                    <div className="w-1 h-4 bg-primary rounded-full mb-1" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Marker Labels */}
            <div className="flex mt-2">
              {TIMING_MARKERS.map((marker) => (
                <div key={marker.id} className="flex-1 text-center">
                  <p className="text-xs font-medium">{marker.label}</p>
                  <p className="text-[10px] text-muted-foreground">{marker.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Options */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Sync to Animation</p>
                <p className="text-xs text-muted-foreground">Match sound to motion</p>
              </div>
              <Switch 
                checked={settings.syncToAnimation}
                onCheckedChange={(checked) => onUpdate({ syncToAnimation: checked })}
                data-testid="switch-sync-animation" 
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Impact on Reveal</p>
                <p className="text-xs text-muted-foreground">Hit sound at logo reveal</p>
              </div>
              <Switch 
                checked={settings.impactOnReveal}
                onCheckedChange={(checked) => onUpdate({ impactOnReveal: checked })}
                data-testid="switch-impact-reveal" 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Audio Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" data-testid="button-play-audio">
              <Play className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full" />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>0:00</span>
                <span>0:03</span>
              </div>
            </div>
            <Badge variant="secondary">
              {SOUND_TYPES.find(s => s.id === settings.soundType)?.label || "Audio"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-effects">
          Back to Effects
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-export">
          Continue to Export
        </Button>
      </div>
    </div>
  );
}
