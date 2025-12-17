import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, FileText, Info, Music, Subtitles } from "lucide-react";
import type { Scene, Shot } from "@/types/storyboard";
import { FullScriptDialog } from "./full-script-dialog";
import { ShotDetailsDialog } from "./shot-details-dialog";

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
  script: string;
  scenes: Scene[];
  shots: { [sceneId: string]: Shot[] };
  voiceOverEnabled?: boolean;
  onNext: () => void;
}

export function AnimaticPreview({ script, scenes, shots, voiceOverEnabled = false, onNext }: AnimaticPreviewProps) {
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(true);
  const [musicStyle, setMusicStyle] = useState("Cinematic Epic");
  const [volume, setVolume] = useState([50]);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitlePosition, setSubtitlePosition] = useState("bottom");
  const [subtitleSize, setSubtitleSize] = useState("medium");
  
  const [isFullScriptOpen, setIsFullScriptOpen] = useState(false);
  const [isShotDetailsOpen, setIsShotDetailsOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)] gap-6">
      {/* Main Video Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 bg-card rounded-lg border flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Play className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground">Ambient Preview</h3>
            <p className="mt-2 text-muted-foreground">Your visual flow sequence will play here</p>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
        {/* Full Narration Button - only show when voiceover is enabled */}
        {voiceOverEnabled && (
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-start gap-2"
            onClick={() => setIsFullScriptOpen(true)}
            data-testid="button-full-narration"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <div className="flex-1 text-left">
              <div className="font-medium">Full Narration</div>
              <div className="text-xs text-muted-foreground">View complete voiceover script</div>
            </div>
          </Button>
        )}

        {/* Shot Details Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-2"
          onClick={() => setIsShotDetailsOpen(true)}
          data-testid="button-shot-details"
        >
          <Info className="h-4 w-4 shrink-0" />
          <div className="flex-1 text-left">
            <div className="font-medium">View in Details</div>
            <div className="text-xs text-muted-foreground">Segment & shot breakdown</div>
          </div>
        </Button>

        {/* Background Music */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Music className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Background Music</Label>
              <Switch
                checked={backgroundMusicEnabled}
                onCheckedChange={setBackgroundMusicEnabled}
                className="ml-auto"
                data-testid="switch-background-music"
              />
            </div>

            {backgroundMusicEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="music-style" className="text-xs text-muted-foreground uppercase">
                    Music Style
                  </Label>
                  <Select value={musicStyle} onValueChange={setMusicStyle}>
                    <SelectTrigger id="music-style" className="h-9" data-testid="select-music-style">
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
                  <Label htmlFor="volume" className="text-xs text-muted-foreground uppercase">
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

        {/* Subtitles - only show when voiceover is enabled */}
        {voiceOverEnabled && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Subtitles className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Subtitles</Label>
                <Switch
                  checked={subtitlesEnabled}
                  onCheckedChange={setSubtitlesEnabled}
                  className="ml-auto"
                  data-testid="switch-subtitles"
                />
              </div>

              {subtitlesEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle-position" className="text-xs text-muted-foreground uppercase">
                      Position
                    </Label>
                    <Select value={subtitlePosition} onValueChange={setSubtitlePosition}>
                      <SelectTrigger id="subtitle-position" className="h-9" data-testid="select-subtitle-position">
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
                    <Label htmlFor="subtitle-size" className="text-xs text-muted-foreground uppercase">
                      Size
                    </Label>
                    <Select value={subtitleSize} onValueChange={setSubtitleSize}>
                      <SelectTrigger id="subtitle-size" className="h-9" data-testid="select-subtitle-size">
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
        )}

        {/* Continue Button */}
        <Button onClick={onNext} size="lg" className="w-full mt-4" data-testid="button-continue">
          Continue to Export
        </Button>
      </div>

      {/* Dialogs */}
      <FullScriptDialog
        open={isFullScriptOpen}
        onOpenChange={setIsFullScriptOpen}
        script={script}
      />
      
      <ShotDetailsDialog
        open={isShotDetailsOpen}
        onOpenChange={setIsShotDetailsOpen}
        scenes={scenes}
        shots={shots}
      />
    </div>
  );
}
