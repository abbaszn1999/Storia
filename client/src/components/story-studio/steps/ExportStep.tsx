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
  Video,
  Mic
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
  voiceoverEnabled: boolean;
  onFormatChange: (format: string) => void;
  onQualityChange: (quality: string) => void;
  onExport: () => Promise<string | null>;
  onGenerateVoiceover: () => Promise<void>;
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
  voiceoverEnabled,
  onFormatChange,
  onQualityChange,
  onExport,
  onGenerateVoiceover,
  accentColor = "primary"
}: ExportStepProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [voiceoverGenerated, setVoiceoverGenerated] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  // Dynamic export steps based on scenario
  const getExportSteps = () => {
    const steps = [
      { text: 'Downloading assets', status: 'pending' as const },
      { text: 'Creating video timeline', status: 'pending' as const },
    ];
    
    // Add voiceover step if enabled
    if (voiceoverEnabled && scenes.some(s => s.audioUrl)) {
      steps.push({ text: 'Merging voiceover', status: 'pending' as const });
    }
    
    // Add music step if enabled
    if (backgroundMusic && backgroundMusic !== 'none') {
      steps.push({ text: 'Mixing background music', status: 'pending' as const });
    }
    
    // Add subtitles step if voiceover enabled AND text overlay enabled
    if (voiceoverEnabled && scenes.some(s => s.audioUrl)) {
      steps.push({ text: 'Burning subtitles', status: 'pending' as const });
    }
    
    steps.push({ text: 'Uploading to CDN', status: 'pending' as const });
    
    return steps;
  };
  
  const [exportSteps, setExportSteps] = useState<Array<{text: string; status: 'pending' | 'active' | 'complete'}>>(getExportSteps());
  const hasAttemptedGeneration = useRef(false);
  const hasAttemptedExport = useRef(false);

  // Check if all scenes have audio
  const allScenesHaveAudio = scenes.every(s => s.audioUrl);

  // Auto-generate voiceover on mount if enabled
  useEffect(() => {
    if (voiceoverEnabled && 
        !voiceoverGenerated && 
        !hasAttemptedGeneration.current && 
        scenes.length > 0 &&
        !allScenesHaveAudio) {
      
      hasAttemptedGeneration.current = true; // Prevent multiple calls
      setIsGeneratingVoiceover(true);
      
      console.log('[ExportStep] Auto-generating voiceover...');
      onGenerateVoiceover()
        .then(() => {
          setVoiceoverGenerated(true);
          setIsGeneratingVoiceover(false);
          console.log('[ExportStep] Voiceover generation complete');
        })
        .catch(error => {
          console.error('[ExportStep] Voiceover generation failed:', error);
          hasAttemptedGeneration.current = false; // Allow retry on failure
          setIsGeneratingVoiceover(false);
        });
    } else if (allScenesHaveAudio) {
      // If all scenes already have audio, mark as generated
      setVoiceoverGenerated(true);
    } else if (!voiceoverEnabled) {
      // If voiceover is disabled, skip generation and mark as ready
      console.log('[ExportStep] Voiceover disabled - skipping generation');
      setVoiceoverGenerated(true);
    }
  }, [voiceoverEnabled, voiceoverGenerated, scenes.length, onGenerateVoiceover, allScenesHaveAudio]);

  // Auto-export on mount (after voiceover is ready)
  useEffect(() => {
    if (!isGeneratingVoiceover && 
        voiceoverGenerated && 
        !hasAttemptedExport.current && 
        !exportedVideoUrl &&
        scenes.length > 0) {
      
      hasAttemptedExport.current = true;
      handleAutoExport();
    }
  }, [isGeneratingVoiceover, voiceoverGenerated, exportedVideoUrl, scenes.length]);

  // Handle auto export with progress simulation
  const handleAutoExport = async () => {
    console.log('[ExportStep] Starting auto-export...');
    
    // Reset export steps based on current scenario
    const dynamicSteps = getExportSteps();
    setExportSteps(dynamicSteps);
    setIsExporting(true);
    setExportProgress(0);

    // Calculate progress increments based on number of steps
    const stepCount = dynamicSteps.length;
    const progressIncrement = 100 / stepCount;
    
    let currentStepIndex = 0;

    const updateProgress = () => {
      if (currentStepIndex < stepCount) {
        const progress = Math.min((currentStepIndex + 1) * progressIncrement, 95);
        
        setExportProgress(progress);
        setExportSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i < currentStepIndex ? 'complete' : i === currentStepIndex ? 'active' : 'pending'
        })));
        
        currentStepIndex++;
      }
    };

    // Start progress simulation (update every 2 seconds)
    const progressInterval = setInterval(updateProgress, 2000);

    try {
      const videoUrl = await onExport();
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
      
      if (videoUrl) {
        // Small delay to show 100% before showing video
        setTimeout(() => {
          setExportedVideoUrl(videoUrl);
          setIsExporting(false);
        }, 500);
      } else {
        setIsExporting(false);
      }
    } catch (error) {
      console.error('[ExportStep] Export failed:', error);
      clearInterval(progressInterval);
      setIsExporting(false);
    }
  };

  // Handle manual export (if needed)
  const handleExport = async () => {
    await handleAutoExport();
  };

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Column - Export Settings (Scrollable) */}
      <div className="w-full lg:w-2/5 space-y-5 overflow-y-auto max-h-[calc(100vh-12rem)] pb-6">
        {/* Voiceover Generation Loading */}
        {isGeneratingVoiceover && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassPanel className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Generating Voiceover...
                </h3>
                <p className="text-sm text-white/60">
                  Creating audio for {scenes.length} scene{scenes.length > 1 ? 's' : ''}. This may take a moment.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: scenes.length * 5, ease: "linear" }}
                />
              </div>
              <p className="text-xs text-white/40 mt-2 text-center">
                Please wait, do not navigate away...
              </p>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* Hide settings during voiceover generation */}
      {!isGeneratingVoiceover && (
        <>
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
        </>
      )}
      </div>

      {/* Right Column - Video Preview (Sticky) */}
      <div className="w-full lg:w-3/5 lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
        <GlassPanel className="h-full flex flex-col">
          {/* Loading State - Exporting */}
          {isExporting && !exportedVideoUrl && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-6 max-w-md">
                {/* Animated Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "w-20 h-20 mx-auto rounded-full",
                    "bg-gradient-to-br flex items-center justify-center",
                    "shadow-2xl",
                    accentClasses
                  )}
                >
                  <Film className="w-10 h-10 text-white" />
                </motion.div>

                {/* Status */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Exporting Video...
                  </h3>
                  <p className="text-white/60">
                    Creating your masterpiece
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-2 text-left">
                  {exportSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      {step.status === 'complete' && (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      )}
                      {step.status === 'active' && (
                        <RefreshCw className="w-5 h-5 text-orange-400 animate-spin flex-shrink-0" />
                      )}
                      {step.status === 'pending' && (
                        <Clock className="w-5 h-5 text-white/30 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        step.status === 'complete' && "text-white/70",
                        step.status === 'active' && "text-white font-medium",
                        step.status === 'pending' && "text-white/40"
                      )}>
                        {step.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <Progress value={exportProgress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">
                      {exportProgress}% complete
                    </span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-white/60"
                    >
                      Please wait...
                    </motion.span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Player State */}
          {!isExporting && exportedVideoUrl && (
            <div className="flex-1 flex flex-col">
              {/* Success Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Video Ready!
                  </h3>
                  <p className="text-sm text-white/60">
                    Your video has been exported successfully
                  </p>
                </div>
              </div>

              {/* Video Player */}
              <div className="flex-1 bg-black flex items-center justify-center">
                <video
                  src={exportedVideoUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                />
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <Button
                  onClick={() => window.open(exportedVideoUrl, '_blank')}
                  className={cn(
                    "flex-1 gap-2 bg-gradient-to-r",
                    accentClasses
                  )}
                >
                  <Download className="w-5 h-5" />
                  Download Video
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(exportedVideoUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>
          )}

          {/* Initial State - Waiting */}
          {!isExporting && !exportedVideoUrl && !isGeneratingVoiceover && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <div className={cn(
                  "w-16 h-16 mx-auto rounded-full",
                  "bg-gradient-to-br flex items-center justify-center",
                  accentClasses
                )}>
                  <Film className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Preparing Export
                  </h3>
                  <p className="text-sm text-white/60">
                    Your video will appear here shortly
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

