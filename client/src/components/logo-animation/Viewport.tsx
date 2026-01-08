// Logo Animation Viewport - Preview & Generation Display

import { motion, AnimatePresence } from "framer-motion";
import { Video, Sparkles, Download, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

interface ViewportProps {
  aspectRatio: string;
  isGenerating: boolean;
  generationStatus: string;
  generationProgress: number;
  generatedVideoUrl: string | null;
  referenceImage: string | null;
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
  referenceImage,
}: ViewportProps) {
  const aspectClass = aspectRatioClasses[aspectRatio] || aspectRatioClasses["16:9"];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Determine what to show: video > generating > image > empty
  const hasVideo = !!generatedVideoUrl;
  const hasImage = !!referenceImage;

  const handleDownload = async () => {
    if (!generatedVideoUrl) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logo-animation-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex-1 relative flex flex-col">
      {/* Top Bar */}
      <div className="flex-shrink-0 h-14 px-6 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Preview</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
          <span>{aspectRatio}</span>
          <span>•</span>
          <span>{aspectRatio === "16:9" ? "Landscape" : "Portrait"}</span>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className={cn(
          "w-full max-w-4xl",
          "flex items-center justify-center"
        )}>
          <div className={cn(
            "relative w-full rounded-xl overflow-hidden",
            "bg-black/60 border border-white/[0.08]",
            "shadow-2xl",
            aspectClass
          )}>
            <AnimatePresence mode="wait">
              {hasVideo ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full h-full"
                >
                  <video
                    ref={videoRef}
                    src={generatedVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                  
                  {/* Download Button Overlay */}
                  <div className="absolute top-4 right-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    >
                      {isDownloading ? (
                        <Sparkles className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download
                    </Button>
                  </div>
                </motion.div>
              ) : isGenerating ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
                    />
                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-foreground/80">
                      {generationStatus || "Generating logo animation..."}
                    </p>
                    {generationProgress > 0 && (
                      <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${generationProgress}%` }}
                          className="h-full bg-gradient-to-r from-primary to-purple-600"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : hasImage ? (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full h-full"
                >
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center space-y-2">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Reference image
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8"
                >
                  <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground/60">
                      Your video will appear here
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Upload a reference image and generate your logo animation
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Tips */}
      <div className="flex-shrink-0 h-12 px-6 flex items-center justify-center border-t border-white/[0.04]">
        <p className="text-xs text-muted-foreground/40 text-center">
          {isGenerating 
            ? "AI is crafting your logo animation. This may take a few moments..."
            : generatedVideoUrl
              ? "Your logo animation is ready! Click Download to save."
              : "Upload a reference image, enter your visual prompt, and generate your logo animation"
          }
        </p>
      </div>
    </div>
  );
}

