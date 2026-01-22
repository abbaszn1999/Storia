import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, Video, Volume2, Music, Upload, X } from "lucide-react";
import { ImageModelSelector } from "@/components/story-studio/shared/ImageModelSelector";
import { VideoModelSelector } from "@/components/story-studio/shared/VideoModelSelector";
import { getImageModelConfig, getDefaultImageModel } from "@/constants/image-models";
import { getVideoModelConfig, getDefaultVideoModel } from "@/constants/video-models";

const imageStyles = [
  { value: 'photorealistic', label: 'Photorealistic', description: 'Ultra-realistic photography' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-quality visuals' },
  { value: '3d-render', label: '3D Render', description: 'High-quality CGI' },
  { value: 'digital-art', label: 'Digital Art', description: 'Vibrant digital artwork' },
  { value: 'anime', label: 'Anime', description: 'Japanese animation style' },
  { value: 'illustration', label: 'Illustration', description: 'Hand-drawn style' },
  { value: 'watercolor', label: 'Watercolor', description: 'Soft watercolor painting' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple design' },
];

const transitionStyles = [
  { value: 'fade', label: 'Fade', description: 'Smooth crossfade' },
  { value: 'zoom', label: 'Zoom', description: 'Dynamic zoom transition' },
  { value: 'slide', label: 'Slide', description: 'Sliding motion' },
  { value: 'dissolve', label: 'Dissolve', description: 'Gentle dissolve' },
  { value: 'pan', label: 'Pan', description: 'Panning movement' },
];

interface Step4StyleSettingsProps {
  // Visual
  imageStyle: string;
  onImageStyleChange: (value: string) => void;
  imageModel: string;
  onImageModelChange: (value: string) => void;
  videoModel: string;
  onVideoModelChange: (value: string) => void;
  mediaType: 'static' | 'animated';
  onMediaTypeChange: (value: 'static' | 'animated') => void;
  transitionStyle?: string;
  onTransitionStyleChange: (value: string) => void;
  
  // NEW: Required for model selectors
  aspectRatio: string;
  
  // NEW: Resolutions
  imageResolution: string;
  onImageResolutionChange: (value: string) => void;
  videoResolution?: string;
  onVideoResolutionChange: (value: string) => void;
  
  // NEW: Reference Images (Optional)
  styleReferenceUrl?: string;
  onStyleReferenceUrlChange: (value: string) => void;
  characterReferenceUrl?: string;
  onCharacterReferenceUrlChange: (value: string) => void;
  
  // Audio
  hasVoiceover: boolean;
  onHasVoiceoverChange: (value: boolean) => void;
  voiceProfile?: string;
  onVoiceProfileChange: (value: string) => void;
  voiceVolume: number;
  onVoiceVolumeChange: (value: number) => void;
  backgroundMusic?: string;
  onBackgroundMusicChange: (value: string) => void;
  musicVolume: number;
  onMusicVolumeChange: (value: number) => void;
}

export function Step4StyleSettings({
  imageStyle,
  onImageStyleChange,
  imageModel,
  onImageModelChange,
  videoModel,
  onVideoModelChange,
  mediaType,
  onMediaTypeChange,
  transitionStyle,
  onTransitionStyleChange,
  aspectRatio,
  imageResolution,
  onImageResolutionChange,
  videoResolution,
  onVideoResolutionChange,
  styleReferenceUrl,
  onStyleReferenceUrlChange,
  characterReferenceUrl,
  onCharacterReferenceUrlChange,
  hasVoiceover,
  onHasVoiceoverChange,
  voiceProfile,
  onVoiceProfileChange,
  voiceVolume,
  onVoiceVolumeChange,
  backgroundMusic,
  onBackgroundMusicChange,
  musicVolume,
  onMusicVolumeChange,
}: Step4StyleSettingsProps) {
  return (
    <div className="space-y-8 w-full">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-display font-bold">Visual & Audio Style</h2>
        <p className="text-lg text-muted-foreground">
          Define how your stories will look and sound
        </p>
      </div>

      {/* Visual Style Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            <CardTitle>Visual Style</CardTitle>
          </div>
          <CardDescription>
            Configure the visual appearance of your stories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Style */}
          <div className="space-y-3">
            <Label>Image Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageStyles.map((style) => (
                <Card
                  key={style.value}
                  className={`cursor-pointer transition-all ${
                    imageStyle === style.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => onImageStyleChange(style.value)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Media Type */}
          <div className="space-y-3">
            <Label>Media Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  mediaType === 'static'
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onMediaTypeChange('static')}
              >
                <CardContent className="p-4 text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-bold">Static Images</div>
                  <div className="text-xs text-muted-foreground mt-1">With transitions</div>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${
                  mediaType === 'animated'
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onMediaTypeChange('animated')}
              >
                <CardContent className="p-4 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-bold">Animated Clips</div>
                  <div className="text-xs text-muted-foreground mt-1">AI-generated motion</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transition Style (only for static) */}
          {mediaType === 'static' && (
            <div className="space-y-2">
              <Label>Transition Style</Label>
              <Select value={transitionStyle} onValueChange={onTransitionStyleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transitionStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex items-center gap-2">
                        <span>{style.label}</span>
                        <span className="text-xs text-muted-foreground">- {style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI Models - Rich Selectors */}
          <div className="grid grid-cols-1 gap-4">
            {/* Image Model - Rich Selector */}
            <ImageModelSelector
              value={imageModel}
              onChange={onImageModelChange}
              selectedModelInfo={getImageModelConfig(imageModel) || getDefaultImageModel()}
            />

            {/* Image Resolution */}
            <div className="space-y-2">
              <Label>Image Resolution</Label>
              <Select value={imageResolution} onValueChange={onImageResolutionChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getImageModelConfig(imageModel)?.resolutions.map(res => (
                    <SelectItem key={res} value={res}>
                      {res === '1k' ? '1K (~1024px)' : res === '2k' ? '2K (~2048px)' : res === '4k' ? '4K (~4096px)' : res}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video Model - Rich Selector (for animated) */}
            {mediaType === 'animated' && (
              <>
                <VideoModelSelector
                  value={videoModel}
                  onChange={onVideoModelChange}
                  selectedModelInfo={getVideoModelConfig(videoModel) || getDefaultVideoModel()}
                  aspectRatio={aspectRatio}
                  imageModel={imageModel}
                  videoResolution={videoResolution}
                />

                {/* Video Resolution */}
                <div className="space-y-2">
                  <Label>Video Resolution</Label>
                  <Select value={videoResolution} onValueChange={onVideoResolutionChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getVideoModelConfig(videoModel)?.resolutions.map(res => (
                        <SelectItem key={res} value={res}>
                          {res}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reference Images (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Reference Images (Optional)</CardTitle>
          <CardDescription>
            Upload images to guide the AI's visual generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Style Reference */}
          <div className="space-y-2">
            <Label>Style Reference</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {styleReferenceUrl ? (
                <div className="relative">
                  <img src={styleReferenceUrl} alt="Style" className="max-h-32 mx-auto rounded" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-0 right-0"
                    onClick={() => onStyleReferenceUrlChange?.('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload a style reference image
                  </p>
                  <Button variant="outline" size="sm">
                    Browse
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Character Reference */}
          <div className="space-y-2">
            <Label>Character Reference</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {characterReferenceUrl ? (
                <div className="relative">
                  <img src={characterReferenceUrl} alt="Character" className="max-h-32 mx-auto rounded" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-0 right-0"
                    onClick={() => onCharacterReferenceUrlChange?.('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload a character/face reference
                  </p>
                  <Button variant="outline" size="sm">
                    Browse
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Style Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle>Audio Style</CardTitle>
          </div>
          <CardDescription>
            Configure voice and music settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voiceover Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium">Voiceover Narration</div>
              <div className="text-sm text-muted-foreground">
                Add AI-generated voice narration to your stories
              </div>
            </div>
            <Switch
              checked={hasVoiceover}
              onCheckedChange={onHasVoiceoverChange}
            />
          </div>

          {/* Voice Settings (if enabled) */}
          {hasVoiceover && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label>Voice Profile</Label>
                <Select value={voiceProfile} onValueChange={onVoiceProfileChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrator-soft">Narrator - Soft</SelectItem>
                    <SelectItem value="narrator-energetic">Narrator - Energetic</SelectItem>
                    <SelectItem value="narrator-dramatic">Narrator - Dramatic</SelectItem>
                    <SelectItem value="narrator-calm">Narrator - Calm</SelectItem>
                    <SelectItem value="narrator-upbeat">Narrator - Upbeat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Voice Volume</Label>
                  <Badge variant="secondary">{voiceVolume}%</Badge>
                </div>
                <Slider
                  value={[voiceVolume]}
                  onValueChange={([v]) => onVoiceVolumeChange(v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          )}

          {/* Background Music */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              <Label>Background Music</Label>
            </div>
            <Select value={backgroundMusic} onValueChange={onBackgroundMusicChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select background music" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uplifting-corporate">Uplifting Corporate</SelectItem>
                <SelectItem value="dramatic-orchestral">Dramatic Orchestral</SelectItem>
                <SelectItem value="calm-ambient">Calm Ambient</SelectItem>
                <SelectItem value="energetic-electronic">Energetic Electronic</SelectItem>
                <SelectItem value="emotional-piano">Emotional Piano</SelectItem>
                <SelectItem value="none">No Music</SelectItem>
              </SelectContent>
            </Select>

            {backgroundMusic && backgroundMusic !== 'none' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Music Volume</Label>
                  <Badge variant="secondary">{musicVolume}%</Badge>
                </div>
                <Slider
                  value={[musicVolume]}
                  onValueChange={([v]) => onMusicVolumeChange(v)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
