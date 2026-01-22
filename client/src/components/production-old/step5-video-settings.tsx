import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Waves, Camera, Repeat, Sparkles } from "lucide-react";

const AMBIENT_DURATIONS = [
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
  { value: 1800, label: "30 min" },
  { value: 3600, label: "1 hour" },
  { value: 7200, label: "2 hours" },
];

const TRANSITION_STYLES = [
  { id: "crossfade", label: "Crossfade" },
  { id: "dissolve", label: "Dissolve" },
  { id: "drift", label: "Drift" },
  { id: "match-cut", label: "Match Cut" },
  { id: "morph", label: "Morph" },
  { id: "wipe", label: "Wipe" },
];

const VARIATION_TYPES = [
  { id: "evolving", label: "Evolving" },
  { id: "angles", label: "Angles" },
  { id: "elements", label: "Elements" },
  { id: "zoom", label: "Zoom" },
];

const CAMERA_MOTIONS = [
  { id: "static", label: "Static" },
  { id: "slow-pan", label: "Slow Pan" },
  { id: "gentle-drift", label: "Gentle Drift" },
  { id: "orbit", label: "Orbit" },
  { id: "push-in", label: "Push In" },
  { id: "pull-out", label: "Pull Out" },
  { id: "parallax", label: "Parallax" },
  { id: "float", label: "Float" },
];

const LOOP_MODES = [
  { id: "seamless", label: "Seamless" },
  { id: "one-way", label: "One Way" },
  { id: "boomerang", label: "Boomerang" },
  { id: "fade-loop", label: "Fade Loop" },
];

const VISUAL_RHYTHMS = [
  { id: "constant", label: "Constant" },
  { id: "breathing", label: "Breathing" },
  { id: "building", label: "Building" },
  { id: "wave", label: "Wave" },
];

const SEGMENT_COUNTS = [1, 3, 5, 7, 10];

interface Step5VideoSettingsProps {
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
  videoMode?: string;
  narrationStyle?: "third-person" | "first-person";
  onNarrationStyleChange?: (value: "third-person" | "first-person") => void;
  imageCustomInstructions?: string;
  onImageCustomInstructionsChange?: (value: string) => void;
  videoCustomInstructions?: string;
  onVideoCustomInstructionsChange?: (value: string) => void;
  ambientAnimationMode?: string;
  onAmbientAnimationModeChange?: (value: string) => void;
  ambientVoiceOverLanguage?: string;
  onAmbientVoiceOverLanguageChange?: (value: string) => void;
  ambientPacing?: number;
  onAmbientPacingChange?: (value: number) => void;
  ambientSegmentCount?: number;
  onAmbientSegmentCountChange?: (value: number) => void;
  ambientTransitionStyle?: string;
  onAmbientTransitionStyleChange?: (value: string) => void;
  ambientVariationType?: string;
  onAmbientVariationTypeChange?: (value: string) => void;
  ambientCameraMotion?: string;
  onAmbientCameraMotionChange?: (value: string) => void;
  ambientLoopMode?: string;
  onAmbientLoopModeChange?: (value: string) => void;
  ambientVisualRhythm?: string;
  onAmbientVisualRhythmChange?: (value: string) => void;
  ambientEnableParallax?: boolean;
  onAmbientEnableParallaxChange?: (value: boolean) => void;
}

export function Step5VideoSettings(props: Step5VideoSettingsProps) {
  const isAmbientMode = props.videoMode === "ambient_visual";
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{isAmbientMode ? "Ambient Settings" : "Video Settings"}</h2>
        <p className="text-muted-foreground mt-2">
          {isAmbientMode 
            ? "Configure the visual style and flow design for your ambient videos"
            : "Configure the technical and creative settings for your videos"
          }
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
              {!isAmbientMode && <SelectItem value="4:5">4:5 (Portrait)</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">{isAmbientMode ? "Duration" : "Duration (seconds)"}</Label>
          {isAmbientMode ? (
            <Select 
              value={props.duration.toString()} 
              onValueChange={(v) => props.onDurationChange(parseInt(v))}
            >
              <SelectTrigger id="duration" data-testid="select-ambient-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMBIENT_DURATIONS.map(d => (
                  <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="duration"
              type="number"
              min="15"
              max="300"
              value={props.duration}
              onChange={(e) => props.onDurationChange(parseInt(e.target.value) || 60)}
              data-testid="input-duration"
            />
          )}
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

      {props.videoMode === "character_vlog" && (
        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
          <Label htmlFor="narration-style">Narration Style</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Choose how your AI character will narrate the vlog
          </p>
          <Select 
            value={props.narrationStyle || "first-person"} 
            onValueChange={(v) => props.onNarrationStyleChange?.(v as "third-person" | "first-person")}
          >
            <SelectTrigger id="narration-style" data-testid="select-narration-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="first-person">
                First Person - "I walked through the forest..."
              </SelectItem>
              <SelectItem value="third-person">
                Third Person - "Luna walked through the forest..."
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isAmbientMode && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Waves className="h-4 w-4 text-primary" />
              Flow Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pacing</Label>
                  <Badge variant="secondary">{props.ambientPacing ?? 30}%</Badge>
                </div>
                <Slider
                  value={[props.ambientPacing ?? 30]}
                  onValueChange={(v) => props.onAmbientPacingChange?.(v[0])}
                  min={0}
                  max={100}
                  step={5}
                  data-testid="slider-pacing"
                />
                <p className="text-xs text-muted-foreground">Controls the speed of visual changes</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segments</Label>
                  <div className="flex gap-2">
                    {SEGMENT_COUNTS.map(count => (
                      <Button
                        key={count}
                        type="button"
                        variant={props.ambientSegmentCount === count ? "default" : "outline"}
                        size="sm"
                        onClick={() => props.onAmbientSegmentCountChange?.(count)}
                        data-testid={`button-segment-${count}`}
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Animation Mode</Label>
                  <Select 
                    value={props.ambientAnimationMode || "animate"} 
                    onValueChange={(v) => props.onAmbientAnimationModeChange?.(v)}
                  >
                    <SelectTrigger data-testid="select-animation-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="animate">Animate (Video)</SelectItem>
                      <SelectItem value="smooth-image">Smooth Image (Ken Burns)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Transition Style</Label>
                  <Select 
                    value={props.ambientTransitionStyle || "crossfade"} 
                    onValueChange={(v) => props.onAmbientTransitionStyleChange?.(v)}
                  >
                    <SelectTrigger data-testid="select-transition-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSITION_STYLES.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Variation Type</Label>
                  <Select 
                    value={props.ambientVariationType || "evolving"} 
                    onValueChange={(v) => props.onAmbientVariationTypeChange?.(v)}
                  >
                    <SelectTrigger data-testid="select-variation-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIATION_TYPES.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Camera Motion</Label>
                  <Select 
                    value={props.ambientCameraMotion || "static"} 
                    onValueChange={(v) => props.onAmbientCameraMotionChange?.(v)}
                  >
                    <SelectTrigger data-testid="select-camera-motion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMERA_MOTIONS.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Loop Mode</Label>
                  <Select 
                    value={props.ambientLoopMode || "seamless"} 
                    onValueChange={(v) => props.onAmbientLoopModeChange?.(v)}
                  >
                    <SelectTrigger data-testid="select-loop-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOOP_MODES.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visual Rhythm</Label>
                  <Select 
                    value={props.ambientVisualRhythm || "constant"} 
                    onValueChange={(v) => props.onAmbientVisualRhythmChange?.(v)}
                  >
                    <SelectTrigger data-testid="select-visual-rhythm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISUAL_RHYTHMS.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Parallax Effect</Label>
                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={props.ambientEnableParallax ?? false}
                      onCheckedChange={(v) => props.onAmbientEnableParallaxChange?.(v)}
                      data-testid="switch-parallax"
                    />
                    <span className="text-sm text-muted-foreground">
                      {props.ambientEnableParallax ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <SelectItem value="none">None (Natural)</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="vintage">Vintage</SelectItem>
                <SelectItem value="storybook">Storybook</SelectItem>
                {isAmbientMode && (
                  <>
                    <SelectItem value="3d-cartoon">3D Cartoon</SelectItem>
                    <SelectItem value="pixar">Pixar</SelectItem>
                    <SelectItem value="disney">Disney</SelectItem>
                    <SelectItem value="ghibli">Studio Ghibli</SelectItem>
                    <SelectItem value="clay">Claymation</SelectItem>
                    <SelectItem value="comic">Comic</SelectItem>
                  </>
                )}
                <SelectItem value="anime">Anime</SelectItem>
                {!isAmbientMode && (
                  <>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="3d-render">3D Render</SelectItem>
                    <SelectItem value="watercolor">Watercolor</SelectItem>
                  </>
                )}
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

      {!isAmbientMode && (
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
      )}

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

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="image-instructions">Image Generation Instructions</Label>
          <Textarea
            id="image-instructions"
            placeholder="e.g., Use warm color palette, soft lighting, cinematic framing..."
            value={props.imageCustomInstructions || ""}
            onChange={(e) => props.onImageCustomInstructionsChange?.(e.target.value)}
            className="min-h-[80px] resize-none"
            data-testid="textarea-image-instructions"
          />
          <p className="text-xs text-muted-foreground">Custom prompts to guide AI image generation</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-instructions">Video Generation Instructions</Label>
          <Textarea
            id="video-instructions"
            placeholder="e.g., Slow camera movements, smooth transitions, 24fps cinematic feel..."
            value={props.videoCustomInstructions || ""}
            onChange={(e) => props.onVideoCustomInstructionsChange?.(e.target.value)}
            className="min-h-[80px] resize-none"
            data-testid="textarea-video-instructions"
          />
          <p className="text-xs text-muted-foreground">Custom prompts to guide AI video generation</p>
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
