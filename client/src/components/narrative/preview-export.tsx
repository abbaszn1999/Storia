import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Download, X } from "lucide-react";

const MUSIC_STYLES = [
  "Cinematic Epic",
  "Upbeat Pop",
  "Ambient Chill",
  "Dramatic Tension",
  "Inspiring Motivational",
  "Lo-fi Beats",
  "Corporate",
  "Acoustic Guitar",
];

const RESOLUTIONS = [
  { value: "2160p", label: "4K (2160p)" },
  { value: "1080p", label: "1080p (Full HD)" },
  { value: "720p", label: "720p (HD)" },
  { value: "480p", label: "480p (SD)" },
];

interface PreviewExportProps {
  videoId: string;
  backgroundMusicEnabled: boolean;
  musicStyle: string;
  musicVolume: number;
  resolution: string;
  subtitlesEnabled: boolean;
  title: string;
  summary: string;
  hashtags: string[];
  onBackgroundMusicToggle: (enabled: boolean) => void;
  onMusicStyleChange: (style: string) => void;
  onMusicVolumeChange: (volume: number) => void;
  onResolutionChange: (resolution: string) => void;
  onSubtitlesToggle: (enabled: boolean) => void;
  onTitleChange: (title: string) => void;
  onSummaryChange: (summary: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  onBack: () => void;
  onExport: () => void;
}

export function PreviewExport({ 
  videoId, 
  backgroundMusicEnabled,
  musicStyle,
  musicVolume,
  resolution,
  subtitlesEnabled,
  title,
  summary,
  hashtags,
  onBackgroundMusicToggle,
  onMusicStyleChange,
  onMusicVolumeChange,
  onResolutionChange,
  onSubtitlesToggle,
  onTitleChange,
  onSummaryChange,
  onHashtagsChange,
  onBack, 
  onExport 
}: PreviewExportProps) {
  const [hashtagInput, setHashtagInput] = useState("");

  const handleAddHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      onHashtagsChange([...hashtags, hashtagInput.trim()]);
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    onHashtagsChange(hashtags.filter(t => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Video Preview */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Video Preview</h3>
          <Button variant="outline" size="sm" data-testid="button-play-preview">
            <Play className="mr-2 h-4 w-4" />
            Play Preview
          </Button>
        </div>

        <Card className="flex-1 bg-muted/30">
          <CardContent className="h-full flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Play className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Video preview will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Animatic combining all your storyboard shots
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1" data-testid="button-back">
            Back to Storyboard
          </Button>
          <Button onClick={onExport} className="flex-1" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export Video
          </Button>
        </div>
      </div>

      {/* Right: Settings Sidebar */}
      <div className="w-80 space-y-4 overflow-y-auto">
        {/* Background Music */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Background Music</CardTitle>
              <Switch
                checked={backgroundMusicEnabled}
                onCheckedChange={onBackgroundMusicToggle}
                data-testid="toggle-background-music"
              />
            </div>
          </CardHeader>
          {backgroundMusicEnabled && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Music Style</Label>
                <Select value={musicStyle} onValueChange={onMusicStyleChange}>
                  <SelectTrigger className="h-9" data-testid="select-music-style">
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
                <Label className="text-sm text-muted-foreground">Volume</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(value) => onMusicVolumeChange(value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                    data-testid="slider-music-volume"
                  />
                  <span className="text-sm text-muted-foreground w-10 text-right">
                    {musicVolume}%
                  </span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Export Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Export Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Resolution</Label>
              <Select value={resolution} onValueChange={onResolutionChange}>
                <SelectTrigger className="h-9" data-testid="select-resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((res) => (
                    <SelectItem key={res.value} value={res.value}>
                      {res.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Subtitles</Label>
              <Switch
                checked={subtitlesEnabled}
                onCheckedChange={onSubtitlesToggle}
                data-testid="toggle-subtitles"
              />
            </div>
          </CardContent>
        </Card>

        {/* Title & Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Title & Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Video Title</Label>
              <Input
                placeholder="Enter video title..."
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="h-9"
                data-testid="input-video-title"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Write a description for your video..."
                value={summary}
                onChange={(e) => onSummaryChange(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                data-testid="textarea-video-summary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hashtags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hashtags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add hashtag..."
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-9 flex-1"
                data-testid="input-hashtag"
              />
              <Button
                size="sm"
                onClick={handleAddHashtag}
                disabled={!hashtagInput.trim()}
                data-testid="button-add-hashtag"
              >
                Add
              </Button>
            </div>

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1" data-testid={`badge-hashtag-${tag}`}>
                    #{tag}
                    <button
                      onClick={() => handleRemoveHashtag(tag)}
                      className="ml-1 hover:bg-accent rounded-sm"
                      data-testid={`button-remove-hashtag-${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
