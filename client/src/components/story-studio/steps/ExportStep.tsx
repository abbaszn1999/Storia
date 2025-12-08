// Export Step - Final preview and export options
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  Share2, 
  Play, 
  Pause,
  Check,
  RefreshCw,
  Monitor,
  Smartphone,
  Square,
  Image,
  Film,
  Sparkles,
  Clock,
  Layers,
  Volume2,
  Music,
  ExternalLink,
  Copy,
  CheckCircle2,
  Video
} from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { StoryScene, StoryTemplate } from "../types";
import { useState, useRef, useEffect } from "react";

interface ExportStepProps {
  template: StoryTemplate;
  scenes: StoryScene[];
  aspectRatio: string;
  duration: number;
  selectedVoice: string;
  backgroundMusic: string;
  voiceVolume: number;
  musicVolume: number;
  exportFormat: string;
  exportQuality: string;
  isGenerating: boolean;
  generationProgress: number;
  onFormatChange: (format: string) => void;
  onQualityChange: (quality: string) => void;
  onExport: () => void;
  accentColor?: string;
}

const EXPORT_FORMATS = [
  { id: 'mp4', name: 'MP4', desc: 'Universal compatibility', icon: Film },
  { id: 'webm', name: 'WebM', desc: 'Web optimized', icon: Monitor },
  { id: 'gif', name: 'GIF', desc: 'Animated preview', icon: Image },
];

const QUALITY_OPTIONS = [
  { id: '720p', name: '720p HD', desc: 'Fast export', size: '~15MB' },
  { id: '1080p', name: '1080p Full HD', desc: 'Recommended', size: '~40MB' },
  { id: '4k', name: '4K Ultra HD', desc: 'Maximum quality', size: '~150MB' },
];

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube Shorts', icon: SiYoutube, gradient: 'from-red-600 to-red-700' },
  { id: 'tiktok', name: 'TikTok', icon: SiTiktok, gradient: 'from-gray-800 to-black' },
  { id: 'instagram', name: 'Instagram Reels', icon: SiInstagram, gradient: 'from-purple-600 via-pink-500 to-orange-400' },
  { id: 'facebook', name: 'Facebook Reels', icon: SiFacebook, gradient: 'from-blue-600 to-blue-700' },
];

export function ExportStep({
  template,
  scenes,
  aspectRatio,
  duration,
  selectedVoice,
  backgroundMusic,
  voiceVolume,
  musicVolume,
  exportFormat,
  exportQuality,
  isGenerating,
  generationProgress,
  onFormatChange,
  onQualityChange,
  onExport,
  accentColor = "primary"
}: ExportStepProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const currentScene = scenes[currentSceneIndex];

  // Simulate scene preview playback
  useEffect(() => {
    if (isPlaying && scenes.length > 0) {
      const timer = setInterval(() => {
        setCurrentSceneIndex(prev => (prev + 1) % scenes.length);
      }, (currentScene?.duration || 5) * 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentScene, scenes.length]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleCopyLink = () => {
    // Mock copy functionality
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16': return 'aspect-[9/16]';
      case '16:9': return 'aspect-video';
      case '1:1': return 'aspect-square';
      case '4:5': return 'aspect-[4/5]';
      default: return 'aspect-video';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
      {/* Left Column - Export Options */}
      <div className="space-y-5">
        {/* Video Summary */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Video Summary</h3>
                <p className="text-xs text-white/50">Ready to export</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">Scenes</span>
                </div>
                <p className="text-lg font-semibold">{scenes.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">Duration</span>
                </div>
                <p className="text-lg font-semibold">{totalDuration}s</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">Voice</span>
                </div>
                <p className="text-sm font-semibold capitalize">{selectedVoice}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Music className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/40">Music</span>
                </div>
                <p className="text-sm font-semibold capitalize">
                  {backgroundMusic === 'none' ? 'None' : backgroundMusic}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Export Quality */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-white/60" />
              <span className="font-medium text-sm">Export Quality</span>
            </div>

            <div className="space-y-2">
              {QUALITY_OPTIONS.map(quality => (
                <motion.button
                  key={quality.id}
                  onClick={() => onQualityChange(quality.id)}
                  className={cn(
                    "w-full p-4 rounded-xl text-left",
                    "border transition-all duration-200",
                    "flex items-center justify-between",
                    exportQuality === quality.id
                      ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div>
                    <span className="text-sm font-semibold">{quality.name}</span>
                    <p className="text-xs text-white/50">{quality.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">{quality.size}</span>
                    {exportQuality === quality.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-5 h-5 rounded-full",
                          "bg-gradient-to-br flex items-center justify-center",
                          accentClasses
                        )}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Format Selection */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-white/60" />
              <span className="font-medium text-sm">Export Format</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {EXPORT_FORMATS.map(format => {
                const Icon = format.icon;
                return (
                  <motion.button
                    key={format.id}
                    onClick={() => onFormatChange(format.id)}
                    className={cn(
                      "p-4 rounded-xl text-center",
                      "border transition-all duration-200",
                      exportFormat === format.id
                        ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-white/60" />
                    <span className="text-sm font-semibold block">{format.name}</span>
                    <span className="text-[10px] text-white/40">{format.desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </GlassPanel>

        {/* Share to Platforms */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-white/60" />
              <span className="font-medium text-sm">Share To (Optional)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <motion.button
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={cn(
                      "p-3 rounded-xl",
                      "border transition-all duration-200",
                      "flex items-center gap-3",
                      isSelected
                        ? "bg-white/10 border-white/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      "bg-gradient-to-br",
                      platform.gradient
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{platform.name}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-white/60 ml-auto" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Right Column - Video Preview */}
      <div className="space-y-5">
        <GlassPanel className="p-0 overflow-hidden">
          {/* Video Preview */}
          <div className={cn(
            "relative w-full flex items-center justify-center bg-black/60",
            getAspectRatioClass(),
            "max-h-[500px]"
          )}>
            {currentScene?.imageUrl ? (
              <motion.img
                key={currentSceneIndex}
                src={currentScene.imageUrl}
                alt={`Scene ${currentScene.sceneNumber}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white/30">
                <Film className="w-16 h-16 mb-4" />
                <p className="text-sm">Preview not available</p>
                <p className="text-xs mt-1">Generate images in Storyboard</p>
              </div>
            )}

            {/* Overlay gradient */}
            {currentScene?.imageUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            )}

            {/* Scene indicator */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/70">
                  Scene {currentSceneIndex + 1} of {scenes.length}
                </span>
                <span className="text-xs text-white/50">
                  {currentScene?.duration || 0}s
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 flex gap-1">
                {scenes.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all duration-300",
                      idx === currentSceneIndex 
                        ? cn("bg-gradient-to-r", accentClasses)
                        : idx < currentSceneIndex
                        ? "bg-white/40"
                        : "bg-white/20"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Play/Pause overlay */}
            <motion.button
              onClick={handlePlayPause}
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-black/0 hover:bg-black/30 transition-colors"
              )}
              whileHover={{ scale: 1 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "w-16 h-16 rounded-full",
                  "bg-white/10 backdrop-blur-sm",
                  "flex items-center justify-center",
                  "opacity-0 hover:opacity-100 transition-opacity"
                )}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </motion.div>
            </motion.button>

            {/* Aspect ratio badge */}
            <div className="absolute top-4 right-4">
              <span className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                "bg-black/60 backdrop-blur-sm text-white/70"
              )}>
                {aspectRatio}
              </span>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlassPanel>

        {/* Export Progress / Button */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassPanel>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full",
                      "bg-gradient-to-br flex items-center justify-center",
                      accentClasses
                    )}>
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Exporting Video...</p>
                      <p className="text-xs text-white/50">
                        {generationProgress < 30 && "Rendering scenes..."}
                        {generationProgress >= 30 && generationProgress < 60 && "Adding audio..."}
                        {generationProgress >= 60 && generationProgress < 90 && "Applying effects..."}
                        {generationProgress >= 90 && "Finalizing..."}
                      </p>
                    </div>
                    <span className="text-lg font-bold">{generationProgress}%</span>
                  </div>
                  
                  <Progress value={generationProgress} className="h-2" />
                </div>
              </GlassPanel>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={onExport}
                disabled={scenes.length === 0}
                className={cn(
                  "w-full h-16 text-lg font-semibold gap-3",
                  "bg-gradient-to-r shadow-lg",
                  accentClasses
                )}
              >
                <Download className="w-6 h-6" />
                Export Video
                {selectedPlatforms.length > 0 && (
                  <span className="text-sm font-normal opacity-80">
                    & Share to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Complete State */}
        {generationProgress === 100 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassPanel className="text-center">
              <div className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full",
                "bg-gradient-to-br flex items-center justify-center",
                "from-emerald-500 to-green-500"
              )}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Export Complete!</h3>
              <p className="text-sm text-white/50 mb-4">
                Your video is ready to download
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </div>
    </div>
  );
}

