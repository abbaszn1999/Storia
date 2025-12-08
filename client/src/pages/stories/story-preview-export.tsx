// ASMR Export Page - Professional Glassmorphism Design
// Matches the ASMR Generator page aesthetic

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Copy, 
  Check,
  Play,
  Pause,
  Sparkles,
  Loader2,
  ExternalLink,
  Clock,
  Calendar,
  Monitor,
  CheckCircle2,
  Video
} from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/page-transition";
import { downloadMergedVideo } from "@/lib/api/asmr";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORMS = [
  { id: "youtube", name: "YouTube Shorts", icon: SiYoutube, color: "bg-red-600", gradient: "from-red-600 to-red-700" },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "bg-black", gradient: "from-gray-800 to-black" },
  { id: "instagram", name: "Instagram Reels", icon: SiInstagram, gradient: "from-purple-600 via-pink-500 to-orange-400" },
  { id: "facebook", name: "Facebook Reels", icon: SiFacebook, color: "bg-blue-600", gradient: "from-blue-600 to-blue-700" },
];

const RESOLUTIONS = [
  { value: "720p", label: "720p HD", desc: "Faster export" },
  { value: "1080p", label: "1080p Full HD", desc: "Recommended" },
  { value: "2160p", label: "4K Ultra HD", desc: "Maximum quality" },
];

interface StoryExportData {
  videoUrl: string;
  audioUrl?: string;
  audioSource?: "model" | "elevenlabs" | "merged";
  duration: number;
  aspectRatio: string;
  resolution?: string;
  storyType: string;
  category?: string;
  visualPrompt?: string;
  soundPrompt?: string;
  videoModel?: string;
  modelLabel?: string;
  cost?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function StoryPreviewExport() {
  const [, navigate] = useLocation();
  
  // Load export data from localStorage
  const [exportData, setExportData] = useState<StoryExportData | null>(() => {
    const storedData = localStorage.getItem("storia_story_export_data");
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch {
        return null;
      }
    }
    return null;
  });
  
  // Redirect if no data
  useEffect(() => {
    if (!exportData) {
      navigate("/stories/asmr");
    }
  }, [exportData, navigate]);

  // State
  const [resolution, setResolution] = useState(exportData?.resolution || "1080p");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishType, setPublishType] = useState<"instant" | "schedule">("instant");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Metadata
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [socialCaption, setSocialCaption] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!exportData) return null;

  const { videoUrl, audioUrl, audioSource, duration, aspectRatio, category, visualPrompt } = exportData;
  const hasSeparateAudio = !!audioUrl && audioSource === "elevenlabs";

  // Handlers
  const handleBack = () => {
    navigate("/stories/asmr");
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename = `storia-${category?.toLowerCase() || "asmr"}-${Date.now()}.mp4`;
      
      // If there's separate audio (ElevenLabs), merge before download
      if (hasSeparateAudio && audioUrl) {
        console.log("[Export] Merging video and audio before download...");
        await downloadMergedVideo(videoUrl, audioUrl, filename);
      } else {
        // No separate audio, download video directly
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsExporting(false);
  };

  const handleAIMetadata = async () => {
    setIsGeneratingAI(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const categoryName = category || "ASMR";
    
    if (selectedPlatforms.includes("youtube")) {
      setYoutubeTitle(`Satisfying ${categoryName} Experience - Ultimate Relaxation`);
      setYoutubeDescription(`Experience pure relaxation with this calming ${categoryName.toLowerCase()} video. Perfect for sleep, study, or unwinding. Created with Storia AI.`);
    }
    
    if (selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p))) {
      setSocialCaption(`Pure ${categoryName.toLowerCase()} relaxation vibes ✨\n\nLet these satisfying sounds wash over you\n\n#ASMR #${categoryName.replace(/\s+/g, "")} #Satisfying #Relaxing`);
    }
    
    setIsGeneratingAI(false);
  };

  const hasYouTube = selectedPlatforms.includes("youtube");
  const hasSocialPlatforms = selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p));

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <PageTransition className="h-screen flex bg-[#0a0a0a]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Left Panel - Control Panel */}
      <div className={cn(
        "w-[40%] min-w-[400px] max-w-[550px] flex-shrink-0 h-full",
        "bg-black/40 backdrop-blur-xl",
        "border-r border-white/[0.06]",
        "flex flex-col relative z-10"
      )}>
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h1 className="text-base font-semibold">Export & Publish</h1>
              </div>
              <p className="text-xs text-muted-foreground">Your video is ready</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <StaggerContainer className="p-4 space-y-5">
            {/* Video Summary */}
            <StaggerItem>
              <div className={cn(
                "p-4 rounded-xl",
                "bg-white/[0.02] border border-white/[0.06]"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <Video className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Video Summary</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span>{category || "ASMR"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aspect Ratio</span>
                    <span>{aspectRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span>{exportData.modelLabel || "AI Video"}</span>
                  </div>
                  {exportData.cost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost</span>
                      <span className="text-emerald-400">${exportData.cost.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            </StaggerItem>

            {/* Resolution */}
            <StaggerItem>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Export Resolution</Label>
                </div>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="h-10 bg-white/[0.03] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {RESOLUTIONS.map(res => (
                      <SelectItem key={res.value} value={res.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{res.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{res.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </StaggerItem>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Platforms */}
            <StaggerItem>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Publish To</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(platform => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <motion.button
                        key={platform.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlatformToggle(platform.id)}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          "flex items-center gap-2",
                          "border",
                          isSelected
                            ? "bg-white/[0.08] border-primary/50"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          "bg-gradient-to-br",
                          platform.gradient || platform.color
                        )}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-medium">{platform.name}</span>
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary ml-auto" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </StaggerItem>

            {/* Publishing Options */}
            <StaggerItem>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Publishing</span>
                </div>
                <RadioGroup value={publishType} onValueChange={(v: "instant" | "schedule") => setPublishType(v)}>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer",
                    "bg-white/[0.02] border border-white/[0.06]",
                    publishType === "instant" && "border-primary/50 bg-white/[0.05]"
                  )}
                  onClick={() => setPublishType("instant")}
                  >
                    <RadioGroupItem value="instant" id="instant" />
                    <Label htmlFor="instant" className="cursor-pointer flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-emerald-400" />
                      <span>Publish Instantly</span>
                    </Label>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer",
                    "bg-white/[0.02] border border-white/[0.06]",
                    publishType === "schedule" && "border-primary/50 bg-white/[0.05]"
                  )}
                  onClick={() => setPublishType("schedule")}
                  >
                    <RadioGroupItem value="schedule" id="schedule" />
                    <Label htmlFor="schedule" className="cursor-pointer flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span>Schedule for Later</span>
                    </Label>
                  </div>
                </RadioGroup>

                <AnimatePresence>
                  {publishType === "schedule" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={e => setScheduleDate(e.target.value)}
                          className="h-9 bg-white/[0.03] border-white/[0.08]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Time</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={e => setScheduleTime(e.target.value)}
                          className="h-9 bg-white/[0.03] border-white/[0.08]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </StaggerItem>

            {/* Platform Metadata */}
            <AnimatePresence>
              {selectedPlatforms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Metadata</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAIMetadata}
                      disabled={isGeneratingAI}
                      className="h-7 text-xs"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      AI Generate
                    </Button>
                  </div>

                  {hasYouTube && (
                    <div className={cn(
                      "p-3 rounded-xl space-y-3",
                      "bg-white/[0.02] border border-white/[0.06]"
                    )}>
                      <div className="flex items-center gap-2">
                        <SiYoutube className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-medium">YouTube</span>
                      </div>
                      <Input
                        placeholder="Video title"
                        value={youtubeTitle}
                        onChange={e => setYoutubeTitle(e.target.value)}
                        className="h-9 bg-white/[0.03] border-white/[0.08] text-sm"
                      />
                      <Textarea
                        placeholder="Description"
                        value={youtubeDescription}
                        onChange={e => setYoutubeDescription(e.target.value)}
                        className="min-h-[80px] bg-white/[0.03] border-white/[0.08] text-sm resize-none"
                      />
                    </div>
                  )}

                  {hasSocialPlatforms && (
                    <div className={cn(
                      "p-3 rounded-xl space-y-3",
                      "bg-white/[0.02] border border-white/[0.06]"
                    )}>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {selectedPlatforms.includes("tiktok") && (
                            <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center ring-2 ring-[#0a0a0a]">
                              <SiTiktok className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {selectedPlatforms.includes("instagram") && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center ring-2 ring-[#0a0a0a]">
                              <SiInstagram className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {selectedPlatforms.includes("facebook") && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-[#0a0a0a]">
                              <SiFacebook className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium">Social Caption</span>
                      </div>
                      <Textarea
                        placeholder="Write a caption..."
                        value={socialCaption}
                        onChange={e => setSocialCaption(e.target.value)}
                        className="min-h-[100px] bg-white/[0.03] border-white/[0.08] text-sm resize-none"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </StaggerContainer>
        </ScrollArea>

        {/* Footer - Export Button */}
        <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "w-full h-12",
              "bg-gradient-to-r from-primary to-purple-500",
              "hover:from-primary/90 hover:to-purple-500/90",
              "border-0 shadow-lg shadow-primary/25",
              "transition-all duration-300"
            )}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {publishType === "schedule" ? "Scheduling..." : "Exporting..."}
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                {selectedPlatforms.length > 0
                  ? publishType === "schedule" ? "Export & Schedule" : "Export & Publish"
                  : "Export Video"
                }
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Panel - Video Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cn(
            "relative w-full max-w-2xl mx-auto",
            aspectRatio === "9:16" ? "aspect-[9/16] max-h-[600px]" :
            aspectRatio === "1:1" ? "aspect-square max-h-[500px]" :
            "aspect-video max-h-[450px]",
            "rounded-2xl overflow-hidden",
            "bg-black/60",
            "border border-white/[0.08]",
            "shadow-2xl shadow-black/50"
          )}
        >
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            muted={!isPlaying}
            className="w-full h-full object-contain"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-black/60 backdrop-blur-sm border-white/10 text-xs">
              {duration}s
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-black/60 backdrop-blur-sm border-white/10 text-xs">
              {aspectRatio}
            </Badge>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-white/10 rounded-tl pointer-events-none" />
          <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-white/10 rounded-tr pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-white/10 rounded-bl pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-white/10 rounded-br pointer-events-none" />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6 flex items-center gap-3"
        >
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </motion.div>

        {/* Prompt Preview */}
        {visualPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={cn(
              "mt-6 p-4 rounded-xl max-w-lg",
              "bg-white/[0.02] border border-white/[0.06]"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">Generated from:</p>
            <p className="text-sm text-foreground/70 line-clamp-2">{visualPrompt}</p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
