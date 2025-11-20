import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Step4VideoSettingsProps {
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  duration: number;
  onDurationChange: (value: number) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  styleMode: "preset" | "reference";
  onStyleModeChange: (value: "preset" | "reference") => void;
  artStyle: string;
  onArtStyleChange: (value: string) => void;
  styleReferenceImageUrl: string;
  onStyleReferenceImageUrlChange: (value: string) => void;
  tone: string;
  onToneChange: (value: string) => void;
  genre: string;
  onGenreChange: (value: string) => void;
  imageModel: string;
  onImageModelChange: (value: string) => void;
  videoModel: string;
  onVideoModelChange: (value: string) => void;
  animateImages: boolean;
  onAnimateImagesChange: (value: boolean) => void;
  hasVoiceOver: boolean;
  onHasVoiceOverChange: (value: boolean) => void;
  voiceModel: string;
  onVoiceModelChange: (value: string) => void;
  voiceActorId: string;
  onVoiceActorIdChange: (value: string) => void;
  hasSoundEffects: boolean;
  onHasSoundEffectsChange: (value: boolean) => void;
  hasBackgroundMusic: boolean;
  onHasBackgroundMusicChange: (value: boolean) => void;
  resolution: string;
  onResolutionChange: (value: string) => void;
  targetAudience: string;
  onTargetAudienceChange: (value: string) => void;
}

export function Step4VideoSettings(props: Step4VideoSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Video Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure the technical and creative settings for your videos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
          <Select value={props.aspectRatio} onValueChange={props.onAspectRatioChange}>
            <SelectTrigger id="aspect-ratio" data-testid="select-aspect-ratio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
              <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
              <SelectItem value="4:5">4:5 (Portrait)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            min="15"
            max="300"
            value={props.duration}
            onChange={(e) => props.onDurationChange(parseInt(e.target.value) || 60)}
            data-testid="input-duration"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={props.language} onValueChange={props.onLanguageChange}>
            <SelectTrigger id="language" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution">Resolution</Label>
          <Select value={props.resolution} onValueChange={props.onResolutionChange}>
            <SelectTrigger id="resolution" data-testid="select-resolution">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
              <SelectItem value="4k">4K</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Visual Style</Label>
        <Tabs value={props.styleMode} onValueChange={(v) => props.onStyleModeChange(v as "preset" | "reference")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset" data-testid="tab-style-preset">Preset Style</TabsTrigger>
            <TabsTrigger value="reference" data-testid="tab-style-reference">Reference Image</TabsTrigger>
          </TabsList>
          <TabsContent value="preset" className="space-y-2 mt-4">
            <Select value={props.artStyle} onValueChange={props.onArtStyleChange}>
              <SelectTrigger data-testid="select-art-style">
                <SelectValue placeholder="Select art style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="cartoon">Cartoon</SelectItem>
                <SelectItem value="3d-render">3D Render</SelectItem>
                <SelectItem value="watercolor">Watercolor</SelectItem>
              </SelectContent>
            </Select>
          </TabsContent>
          <TabsContent value="reference" className="space-y-2 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Style reference image URL"
                value={props.styleReferenceImageUrl}
                onChange={(e) => props.onStyleReferenceImageUrlChange(e.target.value)}
                data-testid="input-style-reference-url"
              />
              <Button type="button" variant="outline" size="icon" data-testid="button-upload-style-reference">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tone">Tone</Label>
          <Select value={props.tone} onValueChange={props.onToneChange}>
            <SelectTrigger id="tone" data-testid="select-tone">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dramatic">Dramatic</SelectItem>
              <SelectItem value="humorous">Humorous</SelectItem>
              <SelectItem value="inspirational">Inspirational</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="mysterious">Mysterious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Select value={props.genre} onValueChange={props.onGenreChange}>
            <SelectTrigger id="genre" data-testid="select-genre">
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="action">Action</SelectItem>
              <SelectItem value="adventure">Adventure</SelectItem>
              <SelectItem value="comedy">Comedy</SelectItem>
              <SelectItem value="documentary">Documentary</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
              <SelectItem value="horror">Horror</SelectItem>
              <SelectItem value="sci-fi">Sci-Fi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="image-model">AI Image Model</Label>
          <Select value={props.imageModel} onValueChange={props.onImageModelChange}>
            <SelectTrigger id="image-model" data-testid="select-image-model">
              <SelectValue placeholder="Select image model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imagen-4">Imagen 4</SelectItem>
              <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
              <SelectItem value="midjourney">Midjourney</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-model">AI Video Model</Label>
          <Select value={props.videoModel} onValueChange={props.onVideoModelChange}>
            <SelectTrigger id="video-model" data-testid="select-video-model">
              <SelectValue placeholder="Select video model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kling">Kling</SelectItem>
              <SelectItem value="veo">Veo</SelectItem>
              <SelectItem value="runway">Runway</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="animate-images">Animate Images</Label>
            <p className="text-sm text-muted-foreground">Use AI video model to animate generated images</p>
          </div>
          <Switch
            id="animate-images"
            checked={props.animateImages}
            onCheckedChange={props.onAnimateImagesChange}
            data-testid="switch-animate-images"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="voice-over">Voice Over</Label>
            <p className="text-sm text-muted-foreground">Add AI-generated narration</p>
          </div>
          <Switch
            id="voice-over"
            checked={props.hasVoiceOver}
            onCheckedChange={props.onHasVoiceOverChange}
            data-testid="switch-voice-over"
          />
        </div>

        {props.hasVoiceOver && (
          <div className="grid grid-cols-2 gap-4 ml-6 pl-4 border-l-2">
            <div className="space-y-2">
              <Label htmlFor="voice-model">Voice Model</Label>
              <Select value={props.voiceModel} onValueChange={props.onVoiceModelChange}>
                <SelectTrigger id="voice-model" data-testid="select-voice-model">
                  <SelectValue placeholder="Select voice model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eleven-labs">Eleven Labs</SelectItem>
                  <SelectItem value="google-tts">Google TTS</SelectItem>
                  <SelectItem value="openai-tts">OpenAI TTS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-actor">Voice Actor</Label>
              <Select value={props.voiceActorId} onValueChange={props.onVoiceActorIdChange}>
                <SelectTrigger id="voice-actor" data-testid="select-voice-actor">
                  <SelectValue placeholder="Select voice actor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actor-1">Professional Male</SelectItem>
                  <SelectItem value="actor-2">Professional Female</SelectItem>
                  <SelectItem value="actor-3">Energetic Young</SelectItem>
                  <SelectItem value="actor-4">Calm Narrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="sound-effects">Sound Effects</Label>
            <p className="text-sm text-muted-foreground">Add AI-generated sound effects</p>
          </div>
          <Switch
            id="sound-effects"
            checked={props.hasSoundEffects}
            onCheckedChange={props.onHasSoundEffectsChange}
            data-testid="switch-sound-effects"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="background-music">Background Music</Label>
            <p className="text-sm text-muted-foreground">Add AI-generated background music</p>
          </div>
          <Switch
            id="background-music"
            checked={props.hasBackgroundMusic}
            onCheckedChange={props.onHasBackgroundMusicChange}
            data-testid="switch-background-music"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-audience">Target Audience (Optional)</Label>
        <Input
          id="target-audience"
          placeholder="e.g., Young adults 18-25"
          value={props.targetAudience}
          onChange={(e) => props.onTargetAudienceChange(e.target.value)}
          data-testid="input-target-audience"
        />
      </div>
    </div>
  );
}
