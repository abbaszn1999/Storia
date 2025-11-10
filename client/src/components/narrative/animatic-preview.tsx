import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Clock } from "lucide-react";
import type { Scene, Shot } from "@shared/schema";

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
  onNext: () => void;
}

export function AnimaticPreview({ script, scenes, shots, onNext }: AnimaticPreviewProps) {
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(true);
  const [musicStyle, setMusicStyle] = useState("Cinematic Epic");
  const [volume, setVolume] = useState([50]);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [subtitlePosition, setSubtitlePosition] = useState("bottom");
  const [subtitleSize, setSubtitleSize] = useState("medium");

  // Calculate total duration
  const totalDuration = scenes.reduce((total, scene) => total + (scene.duration || 0), 0);

  return (
    <div className="relative flex flex-col gap-6 h-[calc(100vh-12rem)]">
      {/* Top Section: Preview and Script */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6 flex-1 min-h-0">
        {/* Video Preview */}
        <div className="flex flex-col min-w-0">
          <div className="flex-1 bg-card rounded-lg border border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="w-20 h-20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground">Animatic Preview</h3>
              <p className="mt-2">Your timed storyboard sequence will play here</p>
            </div>
          </div>
        </div>

        {/* Script Timeline */}
        <div className="flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Voiceover Script</CardTitle>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{totalDuration}s</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pt-0">
              {/* Full Script Display */}
              {script && script.trim().length > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg space-y-2 border border-border/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Full Script</Label>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {script}
                  </p>
                </div>
              )}

              {/* Scene & Shot Breakdown */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Shot-by-Shot Breakdown</Label>
              </div>

              {scenes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No scenes available</p>
                </div>
              ) : (
                scenes.map((scene, sceneIndex) => {
                  const sceneShots = shots[scene.id] || [];
                  
                  return (
                    <div key={scene.id} className="space-y-3" data-testid={`scene-${scene.id}`}>
                      {/* Scene Header */}
                      <div className="flex items-start gap-3 pb-2 border-b">
                        <Badge variant="secondary" className="shrink-0 mt-0.5">
                          Scene {scene.sceneNumber}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{scene.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {scene.description}
                          </p>
                          {scene.duration && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{scene.duration}s</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Shots */}
                      {sceneShots.length > 0 && (
                        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                          {sceneShots.map((shot, shotIndex) => (
                            <div 
                              key={shot.id} 
                              className="space-y-1.5 pb-2"
                              data-testid={`shot-${shot.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs shrink-0"
                                >
                                  Shot {shot.shotNumber}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {shot.shotType}
                                </span>
                                {shot.duration && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {shot.duration}s
                                  </span>
                                )}
                              </div>
                              {shot.description && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">Narration:</p>
                                  <p className="text-sm leading-relaxed bg-background/50 p-2 rounded border-l-2 border-primary/30">
                                    {shot.description}
                                  </p>
                                </div>
                              )}
                              {shot.soundEffects && (
                                <p className="text-xs text-muted-foreground italic">
                                  SFX: {shot.soundEffects}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Audio & Subtitle Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
