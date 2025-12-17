import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipBack, SkipForward, FileText, Music, Subtitles, Clock, Film, List, Eye } from "lucide-react";
import type { Scene, Shot } from "@/types/storyboard";
import { FullScriptDialog } from "./full-script-dialog";
import { ShotDetailsDialog } from "./shot-details-dialog";
import { cn } from "@/lib/utils";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  
  const [isFullScriptOpen, setIsFullScriptOpen] = useState(false);
  const [isShotDetailsOpen, setIsShotDetailsOpen] = useState(false);

  const accentClasses = "from-purple-500 to-pink-500";

  // Calculate total duration
  const allShots = Object.values(shots).flat();
  const totalDuration = allShots.reduce((acc, shot) => acc + (shot.duration || 3), 0);
  const totalScenes = scenes.length;
  const totalShots = allShots.length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* LEFT COLUMN: TIMELINE & CONTROLS (35% width) */}
      <div
        className={cn(
          "w-[35%] min-w-[350px] max-w-[500px] flex-shrink-0 h-full",
          "bg-black/40 backdrop-blur-xl",
          "border-r border-white/[0.06]",
          "flex flex-col overflow-hidden"
        )}
      >
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">
            {/* Project Info */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Project Overview</Label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 mb-1">Scenes</div>
                    <div className="text-xl font-bold text-white">{totalScenes}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 mb-1">Shots</div>
                    <div className="text-xl font-bold text-white">{totalShots}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 mb-1">Duration</div>
                    <div className="text-xl font-bold text-white">{formatDuration(totalDuration)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scene Timeline */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <List className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Scene Timeline</Label>
                </div>
                <div className="space-y-2">
                  {scenes.map((scene, index) => {
                    const sceneShots = shots[scene.id] || [];
                    const sceneDuration = sceneShots.reduce((acc, s) => acc + (s.duration || 3), 0);
                    const isActive = currentSceneIndex === index;
                    
                    return (
                      <button
                        key={scene.id}
                        onClick={() => setCurrentSceneIndex(index)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all hover-elevate",
                          isActive
                            ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-purple-400">Scene {index + 1}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/5 border-white/10 text-white/60">
                                {sceneShots.length} shots
                              </Badge>
                            </div>
                            <div className="text-sm text-white font-medium truncate">
                              {scene.title || scene.description}
                            </div>
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {formatDuration(sceneDuration)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <Label className="text-lg font-semibold text-white">Quick Actions</Label>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => setIsFullScriptOpen(true)}
                  data-testid="button-full-script"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Full Script</div>
                    <div className="text-xs text-white/50">View complete narration</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => setIsShotDetailsOpen(true)}
                  data-testid="button-shot-details"
                >
                  <Film className="h-4 w-4 shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Shot Breakdown</div>
                    <div className="text-xs text-white/50">Scene & shot details</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Background Music */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-purple-400" />
                    <Label className="text-lg font-semibold text-white">Background Music</Label>
                  </div>
                  <Switch
                    checked={backgroundMusicEnabled}
                    onCheckedChange={setBackgroundMusicEnabled}
                    className="ml-auto"
                    data-testid="switch-background-music"
                  />
                </div>

                {backgroundMusicEnabled && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="music-style" className="text-xs text-white/50 uppercase tracking-wider">
                        Music Style
                      </Label>
                      <Select value={musicStyle} onValueChange={setMusicStyle}>
                        <SelectTrigger id="music-style" className="bg-white/5 border-white/10 text-white" data-testid="select-music-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          {MUSIC_STYLES.map((style) => (
                            <SelectItem 
                              key={style} 
                              value={style}
                              className="focus:bg-purple-500/20 focus:text-white"
                            >
                              {style}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="volume" className="text-xs text-white/50 uppercase tracking-wider">
                          Volume
                        </Label>
                        <span className="text-xs text-purple-400 font-medium">{volume[0]}%</span>
                      </div>
                      <Slider
                        id="volume"
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="w-full"
                        data-testid="slider-volume"
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Subtitles */}
            <Card className="bg-white/[0.02] border-white/[0.06]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Subtitles className="w-5 h-5 text-purple-400" />
                    <Label className="text-lg font-semibold text-white">Subtitles</Label>
                  </div>
                  <Switch
                    checked={subtitlesEnabled}
                    onCheckedChange={setSubtitlesEnabled}
                    className="ml-auto"
                    data-testid="switch-subtitles"
                  />
                </div>

                {subtitlesEnabled && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="subtitle-position" className="text-xs text-white/50 uppercase tracking-wider">
                        Position
                      </Label>
                      <Select value={subtitlePosition} onValueChange={setSubtitlePosition}>
                        <SelectTrigger id="subtitle-position" className="bg-white/5 border-white/10 text-white" data-testid="select-subtitle-position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          <SelectItem value="top" className="focus:bg-purple-500/20 focus:text-white">Top</SelectItem>
                          <SelectItem value="center" className="focus:bg-purple-500/20 focus:text-white">Center</SelectItem>
                          <SelectItem value="bottom" className="focus:bg-purple-500/20 focus:text-white">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitle-size" className="text-xs text-white/50 uppercase tracking-wider">
                        Size
                      </Label>
                      <Select value={subtitleSize} onValueChange={setSubtitleSize}>
                        <SelectTrigger id="subtitle-size" className="bg-white/5 border-white/10 text-white" data-testid="select-subtitle-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0a0a0a] border-white/10">
                          <SelectItem value="small" className="focus:bg-purple-500/20 focus:text-white">Small</SelectItem>
                          <SelectItem value="medium" className="focus:bg-purple-500/20 focus:text-white">Medium</SelectItem>
                          <SelectItem value="large" className="focus:bg-purple-500/20 focus:text-white">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT COLUMN: VIDEO PLAYER (65% width) */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full p-6">
        {/* Video Player */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black/60 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden">
            <div className="text-center text-white/60">
              <div className={cn("w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br", accentClasses, "bg-opacity-20 flex items-center justify-center")}>
                <Play className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Animatic Preview</h3>
              <p className="text-white/50">Your timed storyboard sequence will play here</p>
              <div className="mt-4 px-6 py-2 rounded-lg bg-white/5 border border-white/10 inline-block">
                <span className="text-sm text-white/70">Scene {currentSceneIndex + 1} of {totalScenes}</span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-white hover:bg-white/10"
                disabled={currentSceneIndex === 0}
                onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              
              <Button
                size="icon"
                className={cn("h-12 w-12 bg-gradient-to-r", accentClasses)}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 text-white hover:bg-white/10"
                disabled={currentSceneIndex >= scenes.length - 1}
                onClick={() => setCurrentSceneIndex(Math.min(scenes.length - 1, currentSceneIndex + 1))}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full bg-gradient-to-r transition-all", accentClasses)}
                  style={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
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
