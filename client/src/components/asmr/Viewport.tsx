// ASMR Viewport - Cinematic Preview & Generation Display

import { motion, AnimatePresence } from "framer-motion";
import { Video, Sparkles, Download, ArrowRight, Share2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";
import { downloadMergedVideo } from "@/lib/api/asmr";

interface ViewportProps {
  aspectRatio: string;
  isGenerating: boolean;
  generationStatus: string;
  generationProgress: number;
  generatedVideoUrl: string | null;
  /** Separate audio URL (from ElevenLabs) - null if model has native audio */
  generatedAudioUrl?: string | null;
  /** Audio source: "model", "elevenlabs", or "merged" */
  audioSource?: "model" | "elevenlabs" | "merged" | null;
  referenceImage: string | null;
  isGeneratingImage?: boolean;
  categoryColor?: string;
  onExport?: () => void;
}

// Aspect ratio to CSS class mapping
const aspectRatioClasses: Record<string, string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16] max-h-[500px]",
  "1:1": "aspect-square max-h-[400px]",
};

export function Viewport({
  aspectRatio,
  isGenerating,
  generationStatus,
  generationProgress,
  generatedVideoUrl,
  generatedAudioUrl,
  audioSource,
  referenceImage,
  isGeneratingImage = false,
  categoryColor = "from-primary to-purple-500",
  onExport,
}: ViewportProps) {
  const [, navigate] = useLocation();
  const aspectClass = aspectRatioClasses[aspectRatio] || aspectRatioClasses["16:9"];
  
  // Refs for synced playback
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  
  // Determine what to show: video > generating > image > empty
  const hasVideo = !!generatedVideoUrl;
  const hasImage = !!referenceImage;
  // Check if audio is separate (needs manual sync) or merged into video
  const hasSeparateAudio = !!generatedAudioUrl && audioSource === "elevenlabs";
  const hasMergedAudio = audioSource === "merged" || audioSource === "model";

  // Sync audio with video playback - unified control
  useEffect(() => {
    if (!hasSeparateAudio || !videoRef.current || !audioRef.current) return;

    const video = videoRef.current;
    const audio = audioRef.current;

    // Sync audio time with video
    const syncAudio = () => {
      const drift = Math.abs(video.currentTime - audio.currentTime);
      if (drift > 0.3) {
        audio.currentTime = video.currentTime;
      }
    };

    // When video plays, play audio too
    const handlePlay = () => {
      audio.currentTime = video.currentTime;
      audio.play().catch(console.warn);
    };

    // When video pauses, pause audio
    const handlePause = () => {
      audio.pause();
    };

    // Sync on seek
    const handleSeeked = () => {
      audio.currentTime = video.currentTime;
    };

    // When video ends
    const handleEnded = () => {
      audio.pause();
      audio.currentTime = 0;
    };

    // Sync volume: when user changes video volume, apply to audio
    const handleVolumeChange = () => {
      audio.muted = video.muted;
      audio.volume = video.volume;
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", syncAudio);
    video.addEventListener("volumechange", handleVolumeChange);

    // Initial sync if video is already playing
    if (!video.paused) {
      audio.currentTime = video.currentTime;
      audio.muted = video.muted;
      audio.volume = video.volume;
      audio.play().catch(console.warn);
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", syncAudio);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [hasSeparateAudio, generatedAudioUrl]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
    // Navigate with slide animation
    navigate("/stories/asmr/export");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Main Viewport Container */}
      <motion.div
        layout
        className={cn(
          "relative w-full max-w-2xl mx-auto",
          aspectClass,
          "rounded-2xl overflow-hidden",
          "bg-muted/50 dark:bg-black/40",
          "border border-[#e5e7eb] dark:border-border",
          "shadow-2xl shadow-black/50"
        )}
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />

        {/* Animated Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {hasVideo ? (
            // Video Result
            <motion.div
              key="video"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0"
            >
              <video
                ref={videoRef}
                src={generatedVideoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
              
              {/* Hidden Audio Element (synced with video controls) */}
              {hasSeparateAudio && (
                <audio
                  ref={audioRef}
                  src={generatedAudioUrl!}
                  loop
                  preload="auto"
                />
              )}
              
              {/* Audio Control Button - Only shows when there's separate ElevenLabs audio */}
              {hasSeparateAudio && (
                <div className="absolute bottom-16 right-4 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (audioRef.current) {
                        const newMuted = !isAudioMuted;
                        audioRef.current.muted = newMuted;
                        setIsAudioMuted(newMuted);
                        
                        // If unmuting and video is playing, start audio
                        if (!newMuted && videoRef.current && !videoRef.current.paused) {
                          audioRef.current.currentTime = videoRef.current.currentTime;
                          audioRef.current.play().catch(console.warn);
                        }
                      }
                    }}
                    className="h-9 w-9 bg-popover dark:bg-black/70 hover:bg-muted dark:hover:bg-black/90 backdrop-blur-sm rounded-full border border-[#e5e7eb] dark:border-border"
                  >
                    {isAudioMuted ? (
                      <VolumeX className="h-4 w-4 text-foreground/80 dark:text-white/80" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-foreground/80 dark:text-white/80" />
                    )}
                  </Button>
                  <span className="text-[10px] text-foreground/80 dark:text-white/70 bg-popover dark:bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
                    🎵 ASMR Audio
                  </span>
                </div>
              )}
            </motion.div>
          ) : isGenerating && hasImage ? (
            // Generating with Reference Image - Blur Effect
            <motion.div
              key="generating-with-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Blurred Reference Image */}
              <motion.img
                src={referenceImage!}
                alt="Reference"
                initial={{ filter: "blur(0px)", scale: 1 }}
                animate={{ 
                  filter: "blur(15px)", 
                  scale: 0.98,
                }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-background/60 dark:bg-black/40" />
              
              {/* Generation Progress Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                {/* Breathing Glow Effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={cn(
                    "absolute w-40 h-40 rounded-full blur-3xl",
                    "bg-gradient-to-br",
                    categoryColor
                  )}
                />

                {/* Icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="relative z-10 mb-6"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl",
                    "bg-gradient-to-br",
                    categoryColor,
                    "flex items-center justify-center",
                    "shadow-lg"
                  )}>
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </motion.div>

                {/* Status Text */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 text-sm font-medium text-foreground/80 mb-4"
                >
                  {generationStatus || "Transforming image to video..."}
                </motion.p>

                {/* Progress Bar */}
                <div className="relative z-10 w-48 h-1.5 bg-muted/50 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "h-full rounded-full",
                      "bg-gradient-to-r",
                      categoryColor
                    )}
                  />
                </div>

                {/* Progress Percentage */}
                <p className="relative z-10 text-xs text-muted-foreground/60 mt-2">
                  {generationProgress}%
                </p>
              </div>
            </motion.div>
          ) : isGenerating ? (
            // Generation in Progress (no reference image)
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
            >
              {/* Breathing Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={cn(
                  "absolute w-40 h-40 rounded-full blur-3xl",
                  "bg-gradient-to-br",
                  categoryColor
                )}
              />

              {/* Icon */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative z-10 mb-6"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl",
                  "bg-gradient-to-br",
                  categoryColor,
                  "flex items-center justify-center",
                  "shadow-lg"
                )}>
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </motion.div>

              {/* Status Text */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-sm font-medium text-foreground/80 mb-4"
              >
                {generationStatus || "Generating..."}
              </motion.p>

              {/* Progress Bar */}
              <div className="relative z-10 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "h-full rounded-full",
                    "bg-gradient-to-r",
                    categoryColor
                  )}
                />
              </div>

              {/* Progress Percentage */}
              <p className="relative z-10 text-xs text-muted-foreground/60 mt-2">
                {generationProgress}%
              </p>
            </motion.div>
          ) : hasImage ? (
            // Reference Image Preview (not generating)
            <motion.div
              key="image-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0"
            >
              <img
                src={referenceImage!}
                alt="Reference"
                className="w-full h-full object-cover"
              />
              
              {/* Image Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-popover dark:bg-black/60 backdrop-blur-sm border border-[#e5e7eb] dark:border-border">
                <span className="text-xs font-medium text-foreground/90 dark:text-white/80">Reference Image</span>
              </div>
              
              {/* Hint Text */}
              <div className="absolute bottom-4 inset-x-4 text-center">
                <p className="text-xs text-foreground/70 dark:text-white/60 bg-popover dark:bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 inline-block">
                  Click "Generate ASMR Video" to transform this image
                </p>
              </div>
            </motion.div>
          ) : (
            // Empty State
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8"
            >
              {/* Subtle Glow */}
              <div className={cn(
                "absolute w-32 h-32 rounded-full blur-3xl opacity-20",
                "bg-gradient-to-br",
                categoryColor
              )} />

              {/* Icon */}
              <div className="relative z-10 mb-4">
                <div className={cn(
                  "w-20 h-20 rounded-2xl",
                  "bg-muted/50 dark:bg-white/[0.03] border border-[#e5e7eb] dark:border-border",
                  "flex items-center justify-center"
                )}>
                  <Video className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </div>

              {/* Text */}
              <p className="relative z-10 text-sm text-muted-foreground/50 text-center">
                Your video will appear here
              </p>
              <p className="relative z-10 text-xs text-muted-foreground/30 mt-1 text-center">
                Generate an image or start video generation
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corner Decorations */}
        <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#e5e7eb] dark:border-border rounded-tl" />
        <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#e5e7eb] dark:border-border rounded-tr" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#e5e7eb] dark:border-border rounded-bl" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#e5e7eb] dark:border-border rounded-br" />
      </motion.div>

      {/* Aspect Ratio Label */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground/40">
        <span>Preview: {aspectRatio}</span>
      </div>

      {/* Export Button - Appears after video generation */}
      <AnimatePresence>
        {generatedVideoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
            className="mt-8 w-full max-w-md"
          >
            {/* Glow Effect Behind Button */}
            <div className="relative">
              <motion.div
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={cn(
                  "absolute inset-0 rounded-2xl blur-xl",
                  "bg-gradient-to-r from-primary via-purple-500 to-pink-500",
                  "opacity-50"
                )}
              />
              
              {/* Main Export Button */}
              <Button
                onClick={handleExport}
                className={cn(
                  "relative w-full h-14 text-base font-semibold",
                  "bg-gradient-to-r from-primary via-purple-500 to-pink-500",
                  "hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90",
                  "border-0 rounded-2xl",
                  "shadow-2xl shadow-primary/30",
                  "transition-all duration-300",
                  "group overflow-hidden"
                )}
              >
                {/* Shine Effect */}
                <motion.div
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "200%", opacity: [0, 1, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
                
                {/* Button Content */}
                <div className="relative flex items-center justify-center gap-3">
                  <Share2 className="h-5 w-5" />
                  <span>Export & Publish</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </div>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={isDownloading}
                className="text-muted-foreground/60 hover:text-foreground/80"
                onClick={async () => {
                  try {
                    setIsDownloading(true);
                    
                    // If there's separate audio (ElevenLabs), merge before download
                    if (hasSeparateAudio && generatedAudioUrl) {
                      console.log("[Viewport] Merging video and audio before download...");
                      await downloadMergedVideo(
                        generatedVideoUrl, 
                        generatedAudioUrl,
                        "asmr-video-with-audio.mp4"
                      );
                    } else {
                      // No separate audio, download video directly
                      const response = await fetch(generatedVideoUrl);
                      const blob = await response.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      
                      const link = document.createElement("a");
                      link.href = blobUrl;
                      link.download = "asmr-video.mp4";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      URL.revokeObjectURL(blobUrl);
                    }
                  } catch (error) {
                    console.error("Download failed:", error);
                  } finally {
                    setIsDownloading(false);
                  }
                }}
              >
                {isDownloading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"
                    />
                    {hasSeparateAudio ? "Merging..." : "Downloading..."}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Quick Download {hasSeparateAudio && "(with Audio)"}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
