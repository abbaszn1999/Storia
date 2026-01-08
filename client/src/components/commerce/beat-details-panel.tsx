import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SoraPromptViewer } from "./sora-prompt-viewer";
import { 
  Link2, 
  Clock, 
  Film, 
  Image as ImageIcon, 
  Sparkles, 
  ArrowRight,
  FileText,
  Settings,
  Music,
  Video as VideoIcon,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { BeatPrompt, VoiceoverScriptOutput } from "@/types/commerce";
import type { BeatStatus } from "@/types/commerce";

interface BeatDetailsPanelProps {
  beat: BeatPrompt | null;
  status: BeatStatus;
  lastFrameUrl?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  error?: string;
  onGenerate: () => void;
  onRetry?: () => void;
  videoId?: string;
  beatId?: string;
  voiceoverScripts?: VoiceoverScriptOutput;
}

export function BeatDetailsPanel({
  beat,
  status,
  lastFrameUrl,
  heroImageUrl,
  videoUrl,
  error,
  onGenerate,
  onRetry,
  videoId,
  beatId,
  voiceoverScripts,
}: BeatDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPolling, setIsPolling] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Find voiceover script for current beat
  const voiceoverScript = beat && voiceoverScripts
    ? voiceoverScripts.beat_scripts.find(bs => bs.beatId === beat.beatId)?.voiceoverScript
    : undefined;

  // Poll for status updates when generating
  useEffect(() => {
    if (status === 'generating' && videoId && beatId && !isPolling) {
      setIsPolling(true);
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/social-commerce/videos/${videoId}/beats/${beatId}/status`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'completed') {
              setIsPolling(false);
              clearInterval(pollInterval);
              // Trigger a refresh - parent component should handle this
              window.dispatchEvent(new CustomEvent('beat-status-updated', { 
                detail: { beatId, status: data.status, videoUrl: data.videoUrl, lastFrameUrl: data.lastFrameUrl } 
              }));
            } else if (data.status === 'failed') {
              setIsPolling(false);
              clearInterval(pollInterval);
              window.dispatchEvent(new CustomEvent('beat-status-updated', { 
                detail: { beatId, status: data.status, error: data.error } 
              }));
            }
          }
        } catch (error) {
          console.error('[BeatDetailsPanel] Polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    } else if (status !== 'generating') {
      setIsPolling(false);
    }
  }, [status, videoId, beatId, isPolling]);

  if (!beat) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/10 via-transparent to-muted/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
            <VideoIcon className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground mb-2">Select a Beat</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a beat from the sidebar to view its details, prompt, and generation settings
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isLocked = status === 'locked';
  const isHeroImage = beat.input_image_type === 'hero';
  const isPreviousFrame = beat.input_image_type === 'previous_frame';
  const inputImageUrl = isHeroImage ? heroImageUrl : lastFrameUrl;

  // Video Player Component
  const VideoPlayer = () => {
    if (status === 'generating' || isPolling) {
      return (
        <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 animate-pulse" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 backdrop-blur-sm shadow-lg">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-foreground">Generating Video</p>
              <p className="text-sm text-muted-foreground">
                Creating your {beat?.total_duration || 8}-second beat with Sora
              </p>
              <div className="flex items-center gap-2 justify-center mt-4">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'failed' || error) {
      return (
        <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 via-destructive/5 to-muted/20 shadow-xl">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground mb-1">Generation Failed</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {error || 'An error occurred while generating the video'}
              </p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm" className="shadow-md">
                  <Zap className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (status === 'completed' && videoUrl) {
      return (
        <div className="relative group overflow-hidden rounded-xl border-2 border-border/60 bg-muted/30 shadow-2xl">
          <video
            src={videoUrl}
            controls
            className="h-full w-full object-cover"
            preload="metadata"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      );
    }

    // Pending or locked state
    return (
      <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/20 via-muted/10 to-transparent">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <VideoIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground mb-1">
              {status === 'locked' ? 'Beat Locked' : 'Ready to Generate'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {status === 'locked' 
                ? 'Complete the previous connected beat first'
                : 'Click generate to create this beat\'s video'
              }
            </p>
            {status !== 'locked' && (
              <Button onClick={onGenerate} size="lg" className="shadow-lg">
                <Zap className="h-4 w-4 mr-2" />
                Generate Video
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* Beat Header - Sticky-like appearance */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-2xl backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 shadow-lg">
                      <Zap className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold mb-2">{beat.beatName}</CardTitle>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className="font-bold uppercase tracking-wider text-xs px-3 py-1 border-primary/40 bg-primary/10 text-primary"
                        >
                          {beat.beatId}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{beat.total_duration}s</span>
                        </div>
                        {beat.isConnectedToPrevious && (
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                            <Link2 className="h-4 w-4" />
                            <span>Connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1.5 rounded-xl border border-border/50">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="prompt" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Prompt
            </TabsTrigger>
            <TabsTrigger 
              value="audio" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg"
            >
              <Music className="h-4 w-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger 
              value="shots" 
              className="data-[state=active]:bg-background data-[state=active]:shadow-md rounded-lg"
            >
              <Film className="h-4 w-4 mr-2" />
              Shots
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Input Image Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg",
                        isHeroImage 
                          ? "bg-gradient-to-br from-purple-500/20 via-purple-500/15 to-purple-500/10"
                          : "bg-gradient-to-br from-blue-500/20 via-blue-500/15 to-blue-500/10"
                      )}>
                        {isHeroImage ? (
                          <Sparkles className="h-6 w-6 text-purple-500" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Input Image</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reference image sent to Sora
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "font-bold uppercase tracking-wider text-xs px-3 py-1.5 border-2 shadow-sm",
                        isHeroImage
                          ? "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-400"
                          : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      )}
                    >
                      {isHeroImage ? 'Hero' : 'Previous Frame'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Beat Type Indicator */}
                  <div className={cn(
                    "rounded-xl border-2 p-4 shadow-inner",
                    isHeroImage
                      ? "border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent"
                      : "border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl shadow-md",
                        isHeroImage
                          ? "bg-purple-500/20"
                          : "bg-blue-500/20"
                      )}>
                        {isHeroImage ? (
                          <Sparkles className="h-7 w-7 text-purple-500" />
                        ) : (
                          <ArrowRight className="h-7 w-7 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold mb-1">
                          {isHeroImage ? 'Hero Product Image' : 'Last Frame from Previous Beat'}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isHeroImage 
                            ? 'Using the original hero product image as the identity reference for this beat'
                            : 'Using the final frame from the previous beat to ensure seamless visual continuity'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Image Preview - Compact Thumbnail */}
                  <div className="relative">
                    {inputImageUrl ? (
                      <div 
                        className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-border/60 bg-muted/30 shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={() => setImageModalOpen(true)}
                      >
                        {/* Small thumbnail box */}
                        <div className="aspect-square w-32 h-32 mx-auto">
                          <img
                            src={inputImageUrl}
                            alt={isHeroImage ? "Hero product image" : "Last frame from previous beat"}
                            className="h-full w-full object-cover"
                          />
                          {/* Hover overlay with expand icon */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Maximize2 className="h-6 w-6 text-white" />
                              <p className="text-xs font-semibold text-white">Click to view</p>
                            </div>
                          </div>
                        </div>
                        {/* Badge at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 backdrop-blur-sm">
                          <p className="text-[10px] font-semibold text-white text-center">
                            {isHeroImage ? 'Hero Image' : 'Previous Frame'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/20">
                        <div className="text-center space-y-2">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground">
                              {isHeroImage 
                                ? 'Hero image not available'
                                : isPreviousFrame
                                ? 'Previous beat must be completed first'
                                : 'No input image'
                              }
                            </p>
                            {isPreviousFrame && (
                              <p className="mt-1 text-[10px] text-muted-foreground/70">
                                Complete the previous beat to see its final frame
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Modal for Full Size View */}
                  {inputImageUrl && (
                    <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                      <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-xl border-2 border-border/60">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isHeroImage ? (
                                <Sparkles className="h-5 w-5 text-purple-500" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                              )}
                              <span>
                                {isHeroImage ? 'Hero Product Image' : 'Previous Beat Final Frame'}
                              </span>
                            </div>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "font-bold uppercase tracking-wider text-xs px-3 py-1.5 border-2",
                                isHeroImage
                                  ? "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-400"
                                  : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              )}
                            >
                              {isHeroImage ? 'Hero' : 'Previous Frame'}
                            </Badge>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="relative mt-4 rounded-xl overflow-hidden border-2 border-border/50 bg-muted/20">
                          <img
                            src={inputImageUrl}
                            alt={isHeroImage ? "Hero product image" : "Last frame from previous beat"}
                            className="w-full h-auto max-h-[70vh] object-contain"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                            <p className="text-sm font-semibold text-white">
                              Reference image sent to Sora with prompt
                            </p>
                            <p className="text-xs text-white/70 mt-1">
                              {isHeroImage 
                                ? 'This hero product image will be used as the identity reference for Sora generation'
                                : 'This final frame from the previous beat ensures seamless visual continuity'
                              }
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Video Player Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-md">
                        <VideoIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Video Preview</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {status === 'completed' ? 'Generated video' : status === 'generating' ? 'Generating...' : 'Not generated yet'}
                        </p>
                      </div>
                    </div>
                    {status === 'completed' && videoUrl && (
                      <Badge variant="outline" className="border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <VideoPlayer />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Prompt Tab */}
          <TabsContent value="prompt" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SoraPromptViewer prompt={beat.sora_prompt.text} />
            </motion.div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="mt-0 space-y-6">
            {/* Voiceover Script (from Agent 5.2) */}
            {voiceoverScript && voiceoverScript.enabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 shadow-md">
                          <span className="text-xl">🎤</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">Voiceover Script</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {voiceoverScript.scriptSummary || 'Generated voiceover script'}
                          </p>
                        </div>
                      </div>
                      {voiceoverScripts?.fullScript && (
                        <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          Full Script Available
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Language</p>
                        <p className="text-sm font-bold">{voiceoverScript.language || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tempo</p>
                        <p className="text-sm font-bold">{voiceoverScript.tempo || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Volume</p>
                        <p className="text-sm font-bold">{voiceoverScript.volume || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {voiceoverScript.dialogue && voiceoverScript.dialogue.length > 0 && (
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dialogue</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{voiceoverScript.totalWordCount} words</span>
                            <span>•</span>
                            <span>{voiceoverScript.totalDuration.toFixed(1)}s</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {voiceoverScript.dialogue.map((line, idx) => (
                            <div key={idx} className="rounded-lg border border-border/30 bg-background/50 p-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-primary min-w-[80px]">
                                    {line.timestamp.toFixed(1)}s - {(line.timestamp + line.duration).toFixed(1)}s
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {line.pacing}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {line.wordCount} words
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground italic">{line.emotionalTone}</span>
                              </div>
                              <p className="text-sm font-medium leading-relaxed">{line.line}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {voiceoverScripts?.fullScript && (
                      <div className="rounded-lg border-2 border-purple-500/20 bg-purple-500/5 p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Full Script</p>
                        <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                          {voiceoverScripts.fullScript.text}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{voiceoverScripts.fullScript.totalWordCount} words</span>
                          <span>•</span>
                          <span>{voiceoverScripts.fullScript.totalDuration.toFixed(1)}s total</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Sound Effects and Music (from Agent 5.1) */}
            {beat.audio_guidance ? (
              <>
                {beat.audio_guidance.sound_effects && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 shadow-md">
                              <span className="text-xl">🔊</span>
                            </div>
                            <CardTitle className="text-lg font-bold">Sound Effects</CardTitle>
                          </div>
                          <Badge variant={beat.audio_guidance.sound_effects.enabled ? "default" : "outline"} className={beat.audio_guidance.sound_effects.enabled ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}>
                            {beat.audio_guidance.sound_effects.enabled ? "User Customized" : "AI Generated"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Preset</p>
                            <p className="text-sm font-bold">{beat.audio_guidance.sound_effects.preset || 'N/A'}</p>
                          </div>
                          {beat.audio_guidance.sound_effects.timing_sync && beat.audio_guidance.sound_effects.timing_sync.length > 0 && (
                            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Timing Sync</p>
                              <div className="space-y-2">
                                {beat.audio_guidance.sound_effects.timing_sync.map((sync, idx) => (
                                  <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/30 bg-background/50 p-2">
                                    <span className="font-mono text-xs font-bold text-primary min-w-[60px]">{sync.timestamp.toFixed(1)}s</span>
                                    <span className="text-xs text-muted-foreground flex-1">{sync.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {beat.audio_guidance.sound_effects.customInstructions && (
                            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Custom Instructions</p>
                              <p className="text-sm text-foreground/90">{beat.audio_guidance.sound_effects.customInstructions}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                {beat.audio_guidance.music && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 shadow-md">
                              <span className="text-xl">🎶</span>
                            </div>
                            <CardTitle className="text-lg font-bold">Music</CardTitle>
                          </div>
                          <Badge variant={beat.audio_guidance.music.enabled ? "default" : "outline"} className={beat.audio_guidance.music.enabled ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}>
                            {beat.audio_guidance.music.enabled ? "User Customized" : "AI Generated"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Preset</p>
                              <p className="text-sm font-bold">{beat.audio_guidance.music.preset || 'N/A'}</p>
                            </div>
                            {beat.audio_guidance.music.mood && (
                              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Mood</p>
                                <p className="text-sm font-bold">{beat.audio_guidance.music.mood}</p>
                              </div>
                            )}
                            {beat.audio_guidance.music.energy_level && (
                              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Energy Level</p>
                                <p className="text-sm font-bold capitalize">{beat.audio_guidance.music.energy_level}</p>
                              </div>
                            )}
                          </div>
                          {beat.audio_guidance.music.customInstructions && (
                            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Custom Instructions</p>
                              <p className="text-sm text-foreground/90">{beat.audio_guidance.music.customInstructions}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                <p className="text-sm text-muted-foreground">No audio guidance available</p>
              </div>
            )}
          </TabsContent>

          {/* Shots Tab */}
          <TabsContent value="shots" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-border/60 bg-gradient-to-br from-card via-card/95 to-card/90 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 shadow-md">
                        <Film className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardTitle className="text-lg font-bold">Shots in Beat</CardTitle>
                    </div>
                    <Badge variant="secondary" className="font-bold text-sm px-3 py-1">
                      {beat.shots_in_beat.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {beat.shots_in_beat.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {beat.shots_in_beat.map((shotId) => (
                        <div
                          key={shotId}
                          className="group flex items-center gap-3 rounded-xl border-2 border-border/50 bg-muted/30 p-4 transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-md"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Film className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-mono text-sm font-bold truncate">{shotId}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                      <p className="text-sm text-muted-foreground">No shots in this beat</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
