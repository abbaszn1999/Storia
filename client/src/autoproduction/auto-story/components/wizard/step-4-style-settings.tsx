import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Image, Video, Upload, X } from "lucide-react";
import { ImageModelSelector } from "@/components/story-studio/shared/ImageModelSelector";
import { VideoModelSelector } from "@/components/story-studio/shared/VideoModelSelector";
import { getImageModelConfig, getDefaultImageModel } from "@/constants/image-models";
import { getVideoModelConfig, getDefaultVideoModel, getCompatibleVideoModel, isModelCompatibleWithAspectRatio, getSupportedResolutionsForAspectRatio } from "@/constants/video-models";

const imageStyles = [
  { value: 'photorealistic', label: 'Photo', emoji: '📷' },
  { value: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { value: '3d-render', label: '3D', emoji: '🎮' },
  { value: 'digital-art', label: 'Digital', emoji: '🎨' },
  { value: 'anime', label: 'Anime', emoji: '🌸' },
  { value: 'illustration', label: 'Illust.', emoji: '✏️' },
  { value: 'watercolor', label: 'Watercolor', emoji: '🎭' },
  { value: 'minimalist', label: 'Minimal', emoji: '◻️' },
];

const aspectRatioOptions = [
  { value: '9:16', label: 'Vertical', ratio: '9:16' },
  { value: '16:9', label: 'Horizontal', ratio: '16:9' },
  { value: '1:1', label: 'Square', ratio: '1:1' },
  { value: '4:3', label: 'Classic', ratio: '4:3' },
  { value: '3:2', label: 'Landscape', ratio: '3:2' },
  { value: '2:3', label: 'Portrait', ratio: '2:3' },
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
  animationType: 'transition' | 'image-to-video';
  onAnimationTypeChange: (value: 'transition' | 'image-to-video') => void;
  transitionStyle?: string;
  onTransitionStyleChange: (value: string) => void;
  
  // Aspect Ratio (moved from Content Setup)
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  
  // Resolutions
  imageResolution: string;
  onImageResolutionChange: (value: string) => void;
  videoResolution?: string;
  onVideoResolutionChange: (value: string) => void;
  
  // Reference Images (Optional)
  styleReferenceUrl?: string;
  onStyleReferenceUrlChange: (value: string) => void;
  characterReferenceUrl?: string;
  onCharacterReferenceUrlChange: (value: string) => void;
  
  // ASMR-specific
  isAutoAsmr?: boolean;
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
  animationType,
  onAnimationTypeChange,
  transitionStyle,
  onTransitionStyleChange,
  aspectRatio,
  onAspectRatioChange,
  imageResolution,
  onImageResolutionChange,
  videoResolution,
  onVideoResolutionChange,
  styleReferenceUrl,
  onStyleReferenceUrlChange,
  characterReferenceUrl,
  onCharacterReferenceUrlChange,
  isAutoAsmr = false,
}: Step4StyleSettingsProps) {
  const isAnimated = mediaType === 'animated';
  const selectedImageModel = getImageModelConfig(imageModel) || getDefaultImageModel();
  const selectedVideoModel = getVideoModelConfig(videoModel) || getDefaultVideoModel();

  // Auto-correct aspect ratio when image model changes
  useEffect(() => {
    if (selectedImageModel && aspectRatio) {
      const supportedRatios = selectedImageModel.aspectRatios || [];
      if (supportedRatios.length > 0 && !supportedRatios.includes(aspectRatio)) {
        onAspectRatioChange(supportedRatios[0] || '9:16');
      }
    }
  }, [imageModel]);

  // Auto-correct video model when aspect ratio changes
  useEffect(() => {
    if (isAnimated && aspectRatio && videoModel) {
      if (!isModelCompatibleWithAspectRatio(videoModel, aspectRatio)) {
        const compatible = getCompatibleVideoModel(aspectRatio);
        onVideoModelChange(compatible.value);
      }
    }
  }, [aspectRatio, isAnimated]);

  // Auto-correct video resolution when aspect ratio or video model changes
  useEffect(() => {
    if (isAnimated && videoModel && aspectRatio && videoResolution) {
      const supported = getSupportedResolutionsForAspectRatio(videoModel, aspectRatio);
      if (supported.length > 0 && !supported.includes(videoResolution)) {
        onVideoResolutionChange(supported[0]);
      }
    }
  }, [isAnimated, videoModel, aspectRatio, videoResolution]);

  // Filter aspect ratios by image model support
  const filteredAspectRatios = aspectRatioOptions.filter(option => {
    if (!selectedImageModel?.aspectRatios) return true;
    return selectedImageModel.aspectRatios.includes(option.value);
  });

  // Get video resolutions filtered by model + aspect ratio
  const filteredVideoResolutions = isAnimated && videoModel && aspectRatio
    ? getSupportedResolutionsForAspectRatio(videoModel, aspectRatio)
    : (getVideoModelConfig(videoModel)?.resolutions || ['480p', '720p', '1080p']);


  return (
    <div className="space-y-8 w-full">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-display font-bold">
          {isAutoAsmr ? 'Visual & Sound Style' : 'Style'}
        </h2>
        <p className="text-lg text-muted-foreground">
          Configure the visual appearance of your stories
        </p>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* Image Settings Card */}
      {/* ═══════════════════════════════════════ */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Image className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Image Settings</span>
          </div>

          {/* Image Model */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/70">Image Model</Label>
            <ImageModelSelector
              value={imageModel}
              onChange={onImageModelChange}
              selectedModelInfo={selectedImageModel}
            />
            {selectedImageModel && (
              <p className="text-xs text-white/40 mt-1">
                {filteredAspectRatios.length} aspect ratio{filteredAspectRatios.length > 1 ? 's' : ''}
                {selectedImageModel.resolutions.includes('custom') ? ' • custom' : ` • ${selectedImageModel.resolutions.join(', ')}`}
              </p>
            )}
          </div>

          {/* Aspect Ratio — filtered by image model */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/70">ASPECT RATIO</Label>
            <div className={`grid gap-2 ${filteredAspectRatios.length <= 3 ? 'grid-cols-3' : filteredAspectRatios.length <= 4 ? 'grid-cols-4' : 'grid-cols-3 md:grid-cols-6'}`}>
              {filteredAspectRatios.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onAspectRatioChange(option.value)}
                  className={`py-3 px-2 rounded-lg border text-center transition-all ${
                    aspectRatio === option.value
                      ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className={`text-xs mt-0.5 ${
                    aspectRatio === option.value ? 'text-white/80' : 'text-white/40'
                  }`}>{option.ratio}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/70">RESOLUTION</Label>
            <div className="flex gap-2">
              {(getImageModelConfig(imageModel)?.resolutions || ['1k']).map((res) => (
                <button
                  key={res}
                  onClick={() => onImageResolutionChange(res)}
                  className={`py-2.5 px-6 rounded-lg border text-sm font-bold uppercase transition-all ${
                    imageResolution === res
                      ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 flex-1'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/70">VISUAL STYLE</Label>
            <div className="grid grid-cols-4 gap-2">
              {imageStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => onImageStyleChange(style.value)}
                  className={`py-3 px-2 rounded-lg border text-center transition-all ${
                    imageStyle === style.value
                      ? 'border-orange-500 bg-gradient-to-br from-orange-500/15 to-orange-500/5 shadow-lg shadow-orange-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xl mb-1">{style.emoji}</div>
                  <div className={`text-xs font-medium ${
                    imageStyle === style.value ? 'text-orange-400' : 'text-white/70'
                  }`}>{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Reference (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">STYLE REFERENCE (OPTIONAL)</Label>
            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-colors">
              {styleReferenceUrl ? (
                <div className="relative inline-block">
                  <img src={styleReferenceUrl} alt="Style" className="max-h-32 rounded" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => onStyleReferenceUrlChange?.('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-6 w-6 mx-auto text-white/30" />
                  <p className="text-sm text-white/50">Upload reference image</p>
                  <p className="text-xs text-white/30">AI will generate images in this style</p>
                </div>
              )}
            </div>
          </div>

          {/* Character Reference (Optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/70">CHARACTER REFERENCE (OPTIONAL)</Label>
            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-white/20 transition-colors">
              {characterReferenceUrl ? (
                <div className="relative inline-block">
                  <img src={characterReferenceUrl} alt="Character" className="max-h-32 rounded" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={() => onCharacterReferenceUrlChange?.('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-6 w-6 mx-auto text-white/30" />
                  <p className="text-sm text-white/50">Upload character image</p>
                  <p className="text-xs text-white/30">Face or character to include in images</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════ */}
      {/* Animation Mode Card */}
      {/* ═══════════════════════════════════════ */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Animation Mode</span>
          </div>

          {/* Animation Type */}
          <div className="space-y-3">
            <Label className="text-sm text-white/70">ANIMATION TYPE</Label>
            {isAutoAsmr ? (
              /* Auto-ASMR: Always image-to-video, no transition option */
              <div className="py-2.5 px-3 rounded-lg border border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 text-sm font-medium text-center">
                Image to Video
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onAnimationTypeChange('transition');
                    onMediaTypeChange('static');
                  }}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                    animationType === 'transition'
                      ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >Transition</button>
                <button
                  onClick={() => {
                    onAnimationTypeChange('image-to-video');
                    onMediaTypeChange('animated');
                  }}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                    animationType === 'image-to-video'
                      ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >Image to Video</button>
              </div>
            )}
          </div>

          {/* Transition Style (only for Transition mode — not relevant for Image to Video) */}
          {animationType === 'transition' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/70">TRANSITION STYLE</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'fade', label: 'Fade' },
                  { value: 'slide', label: 'Slide' },
                  { value: 'zoom', label: 'Zoom' },
                  { value: 'wipe', label: 'Wipe' },
                  { value: 'dissolve', label: 'Dissolve' },
                  { value: 'cross-dissolve', label: 'Cross Dissolve' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onTransitionStyleChange(t.value)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      transitionStyle === t.value
                        ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Model + Resolution (only when animation type is image-to-video) */}
          {animationType === 'image-to-video' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/70">Video Model</Label>
                <VideoModelSelector
                  value={videoModel}
                  onChange={onVideoModelChange}
                  selectedModelInfo={selectedVideoModel}
                  aspectRatio={aspectRatio}
                  imageModel={imageModel}
                  videoResolution={videoResolution}
                />
                {selectedVideoModel && (
                  <p className="text-xs text-white/40 mt-1">
                    {selectedVideoModel.durations?.join(', ')}s • {filteredVideoResolutions.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/70">VIDEO RESOLUTION</Label>
                <div className="grid grid-cols-3 gap-2">
                  {filteredVideoResolutions.map((res) => (
                    <button
                      key={res}
                      onClick={() => onVideoResolutionChange(res)}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        videoResolution === res
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
