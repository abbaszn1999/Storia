import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowRight, 
  Play, 
  Pause, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Loader2,
  Maximize2,
  SkipBack,
  SkipForward,
  Music,
  Wand2,
  CheckCircle2
} from "lucide-react";

interface Segment {
  id: string;
  keyframeUrl: string | null;
  duration: number;
  motionDirection: "up" | "down" | "left" | "right" | "static";
  layers: {
    background: boolean;
    midground: boolean;
    foreground: boolean;
  };
  effects: {
    particles: boolean;
    lightRays: boolean;
    fog: boolean;
  };
}

interface PreviewTabProps {
  segments: Segment[];
  loopMode: string;
  duration: string;
  onNext: () => void;
}

const AMBIENT_SOUNDS = [
  { id: "none", label: "No Sound" },
  { id: "rain", label: "Rain" },
  { id: "ocean", label: "Ocean Waves" },
  { id: "forest", label: "Forest" },
  { id: "fireplace", label: "Fireplace" },
  { id: "wind", label: "Wind" },
  { id: "city", label: "City Ambience" },
  { id: "cafe", label: "Cafe" },
];

export function PreviewTab({
  segments,
  loopMode,
  duration,
  onNext,
}: PreviewTabProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoopPreview, setIsLoopPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [ambientSound, setAmbientSound] = useState("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevSegment = () => {
    setCurrentSegment(prev => Math.max(0, prev - 1));
  };

  const handleNextSegment = () => {
    setCurrentSegment(prev => Math.min(segments.length - 1, prev + 1));
  };

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setIsGenerated(true);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const currentKeyframe = segments[currentSegment]?.keyframeUrl;

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Preview & Generate</h2>
        <p className="text-muted-foreground">
          Review your ambient visual and generate the final video
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Preview Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            {/* Video Preview */}
            <div className="aspect-video bg-black relative">
              {currentKeyframe ? (
                <img 
                  src={currentKeyframe} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  No keyframes generated
                </div>
              )}

              {/* Playback Overlay */}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-white/80 text-sm">Playing preview...</div>
                </div>
              )}

              {/* Segment Indicator */}
              <Badge className="absolute top-4 left-4" variant="secondary">
                Segment {currentSegment + 1} / {segments.length}
              </Badge>

              {/* Fullscreen Button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                data-testid="button-fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              {/* Loop Indicator */}
              {isLoopPreview && (
                <Badge className="absolute bottom-4 right-4 gap-1" variant="secondary">
                  <Repeat className="h-3 w-3" />
                  Loop Preview
                </Badge>
              )}
            </div>

            {/* Playback Controls */}
            <CardContent className="p-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={[progress]}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                  data-testid="slider-progress"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0:00</span>
                  <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePrevSegment}
                    disabled={currentSegment === 0}
                    data-testid="button-prev-segment"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="icon"
                    onClick={handlePlay}
                    data-testid="button-play"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNextSegment}
                    disabled={currentSegment === segments.length - 1}
                    data-testid="button-next-segment"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Loop Toggle */}
                  <div className="flex items-center gap-2">
                    <Repeat className={`h-4 w-4 ${isLoopPreview ? "text-primary" : "text-muted-foreground"}`} />
                    <Switch
                      checked={isLoopPreview}
                      onCheckedChange={setIsLoopPreview}
                      data-testid="switch-loop-preview"
                    />
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsMuted(!isMuted)}
                      data-testid="button-mute"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={([val]) => setVolume(val)}
                      max={100}
                      className="w-24"
                      data-testid="slider-volume"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segment Timeline */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-semibold mb-3 block">Segment Timeline</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {segments.map((segment, index) => (
                  <button
                    key={segment.id}
                    onClick={() => setCurrentSegment(index)}
                    className={`flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                      currentSegment === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-muted"
                    }`}
                    data-testid={`button-timeline-segment-${index + 1}`}
                  >
                    <div className="aspect-video bg-muted">
                      {segment.keyframeUrl ? (
                        <img 
                          src={segment.keyframeUrl} 
                          alt={`Segment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-center py-1 bg-muted/50">
                      {segment.duration}s
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Sound Layer */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <Label className="text-lg font-semibold">Ambient Sound</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add optional background audio
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AMBIENT_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setAmbientSound(sound.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all hover-elevate ${
                      ambientSound === sound.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                    data-testid={`button-sound-${sound.id}`}
                  >
                    {sound.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Video Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-lg font-semibold">Video Summary</Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Segments</span>
                  <span>{segments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loop Mode</span>
                  <span className="capitalize">{loopMode.replace("-", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambient Sound</span>
                  <span>{AMBIENT_SOUNDS.find(s => s.id === ambientSound)?.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card className={isGenerated ? "border-green-500/50 bg-green-500/5" : ""}>
            <CardContent className="p-4 space-y-4">
              {isGenerated ? (
                <div className="text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                  <div>
                    <h4 className="font-semibold text-green-600">Video Generated!</h4>
                    <p className="text-sm text-muted-foreground">Ready for export</p>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="text-center space-y-3">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <div>
                    <h4 className="font-semibold">Generating Video...</h4>
                    <p className="text-sm text-muted-foreground">{progress}% complete</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h4 className="font-semibold">Generate Full Video</h4>
                    <p className="text-sm text-muted-foreground">
                      Create the final ambient visual
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateVideo}
                    className="w-full"
                    size="lg"
                    data-testid="button-generate-video"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Video
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          size="lg"
          disabled={!isGenerated}
          data-testid="button-continue-preview"
        >
          Continue to Export
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
