import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play } from "lucide-react";

const MUSIC_STYLES = [
  "Cinematic Epic",
  "Upbeat Pop",
  "Ambient Chill",
  "Corporate",
  "Dramatic Tension",
  "Happy Acoustic",
  "Lo-fi Hip Hop",
  "Electronic Dance",
];

interface AnimaticPreviewProps {
  onNext: () => void;
}

export function AnimaticPreview({ onNext }: AnimaticPreviewProps) {
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(true);
  const [musicStyle, setMusicStyle] = useState("Cinematic Epic");
  const [volume, setVolume] = useState([50]);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitlePosition, setSubtitlePosition] = useState("bottom");
  const [subtitleSize, setSubtitleSize] = useState("medium");

  return (
    <div className="relative">
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Video Preview */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-card rounded-lg border border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="w-20 h-20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Animatic Preview</h3>
              <p className="mt-2">Your timed storyboard sequence will play here</p>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <aside className="w-96 space-y-6 overflow-y-auto pb-6">
          {/* Background Music */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="background-music" className="text-base font-semibold">
                  Background Music
                </Label>
                <Switch
                  id="background-music"
                  checked={backgroundMusicEnabled}
                  onCheckedChange={setBackgroundMusicEnabled}
                  data-testid="switch-background-music"
                />
              </div>

              {backgroundMusicEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="music-style" className="text-sm text-muted-foreground">
                      Music Style
                    </Label>
                    <Select value={musicStyle} onValueChange={setMusicStyle}>
                      <SelectTrigger id="music-style" data-testid="select-music-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSIC_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volume" className="text-sm text-muted-foreground">
                      Volume
                    </Label>
                    <Slider
                      id="volume"
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      className="w-full"
                      data-testid="slider-volume"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {volume[0]}%
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Subtitles */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="subtitles" className="text-base font-semibold">
                  Subtitles
                </Label>
                <Switch
                  id="subtitles"
                  checked={subtitlesEnabled}
                  onCheckedChange={setSubtitlesEnabled}
                  data-testid="switch-subtitles"
                />
              </div>

              {subtitlesEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle-position" className="text-sm text-muted-foreground">
                      Position
                    </Label>
                    <Select value={subtitlePosition} onValueChange={setSubtitlePosition}>
                      <SelectTrigger id="subtitle-position" data-testid="select-subtitle-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle-size" className="text-sm text-muted-foreground">
                      Size
                    </Label>
                    <Select value={subtitleSize} onValueChange={setSubtitleSize}>
                      <SelectTrigger id="subtitle-size" data-testid="select-subtitle-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Fixed Continue Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={onNext} data-testid="button-continue">
          Continue to Export
        </Button>
      </div>
    </div>
  );
}
