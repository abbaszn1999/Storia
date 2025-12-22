// ASMR Export Page - Professional Glassmorphism Design
// Matches the ASMR Generator page aesthetic

import { useState, useEffect, useCallback, useRef } from "react";
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
  Video,
  Wand2,
  Send,
  AlertCircle,
  Link2,
  Lock
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
import { lateApi, type PublishVideoInput, type LatePlatform } from "@/lib/api/late";
import { useWorkspace } from "@/contexts/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSocialAccounts } from "@/components/shared/social";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORMS = [
  { id: "youtube", name: "YouTube Shorts", icon: SiYoutube, color: "bg-red-600", gradient: "from-red-600 to-red-700", apiPlatform: "youtube" as LatePlatform },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "bg-black", gradient: "from-gray-800 to-black", apiPlatform: "tiktok" as LatePlatform },
  { id: "instagram", name: "Instagram Reels", icon: SiInstagram, gradient: "from-purple-600 via-pink-500 to-orange-400", apiPlatform: "instagram" as LatePlatform },
  { id: "facebook", name: "Facebook Reels", icon: SiFacebook, color: "bg-blue-600", gradient: "from-blue-600 to-blue-700", apiPlatform: "facebook" as LatePlatform },
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
  storyId?: string; // Database story ID for updating published_platforms
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
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  // Social accounts hook for connection status
  const { isLoading: isLoadingAccounts, isConnected, getConnectUrl, refetch: refetchAccounts } = useSocialAccounts();
  
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Metadata
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [socialCaption, setSocialCaption] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

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

  // Platform checks (needed by callbacks below)
  const hasYouTube = selectedPlatforms.includes("youtube");
  const hasSocialPlatforms = selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p));

  // Handle platform connection via OAuth
  const connectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleConnect = useCallback(async (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform?.apiPlatform) return;

    setConnectingPlatform(platformId);
    
    const url = await getConnectUrl(platform.apiPlatform);
    if (url) {
      window.open(url, '_blank', 'width=600,height=700');
      toast({
        title: "Connecting...",
        description: "Complete authentication in the new window, then return here.",
      });
      // Poll for connection - will be stopped by useEffect when connected
      connectIntervalRef.current = setInterval(async () => {
        await refetchAccounts();
      }, 3000);
      // Stop polling after 2 minutes
      setTimeout(() => {
        if (connectIntervalRef.current) {
          clearInterval(connectIntervalRef.current);
          connectIntervalRef.current = null;
        }
        setConnectingPlatform(null);
      }, 120000);
    } else {
      setConnectingPlatform(null);
      toast({
        title: "Connection failed",
        description: "Could not open connection page. Please try again.",
        variant: "destructive",
      });
    }
  }, [getConnectUrl, refetchAccounts, toast]);
  
  // Clear connecting state when platform becomes connected
  useEffect(() => {
    if (connectingPlatform) {
      const platform = PLATFORMS.find(p => p.id === connectingPlatform);
      if (platform?.apiPlatform && isConnected(platform.apiPlatform)) {
        // Clear the polling interval
        if (connectIntervalRef.current) {
          clearInterval(connectIntervalRef.current);
          connectIntervalRef.current = null;
        }
        setConnectingPlatform(null);
        toast({
          title: "Connected!",
          description: `${platform.name} has been connected successfully.`,
        });
      }
    }
  }, [connectingPlatform, isConnected, toast]);

  // Generate AI metadata using the real API
  const handleAIMetadata = useCallback(async (platform: string) => {
    if (!exportData) return;
    
    setIsGeneratingAI(true);
    try {
      const scriptText = visualPrompt || exportData.soundPrompt || `${category || 'ASMR'} relaxation video`;
      
      const res = await apiRequest("POST", "/api/stories/social/metadata", {
        platform: platform === 'youtube' ? 'youtube' : platform,
        scriptText,
        duration: exportData.duration,
      });
      
      const data = await res.json();
      
      if (platform === 'youtube') {
        if (data.title) setYoutubeTitle(data.title);
        if (data.description) setYoutubeDescription(data.description);
      } else {
        if (data.caption) setSocialCaption(data.caption);
      }
      
      toast({
        title: "Metadata generated",
        description: `AI generated ${platform} metadata successfully`,
      });
    } catch (error) {
      console.error('[ASMR Export] Failed to generate metadata:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate AI metadata. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [exportData, visualPrompt, category, toast]);

  // Publish to social media platforms
  const handlePublishToSocial = useCallback(async () => {
    if (!exportData || selectedPlatforms.length === 0) return;
    
    // Check workspace
    if (!currentWorkspace) {
      toast({
        title: "No workspace selected",
        description: "Please select a workspace to publish videos.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPublishing(true);
    console.log('[ASMR Export] Publishing to platforms:', selectedPlatforms);
    
    try {
      // Build publish input with correct structure
      const publishInput: PublishVideoInput = {
        videoUrl: exportData.videoUrl,
        platforms: selectedPlatforms.map(platformId => ({
          platform: platformId as 'youtube' | 'tiktok' | 'instagram' | 'facebook',
        })),
        metadata: {
          ...(hasYouTube && {
            youtube: {
              title: youtubeTitle || `${category || 'ASMR'} Video`,
              description: youtubeDescription || 'Created with Storia AI',
            },
          }),
          ...(selectedPlatforms.includes('tiktok') && {
            tiktok: {
              caption: socialCaption || `#ASMR #${(category || 'Relaxing').replace(/\s+/g, '')}`,
            },
          }),
          ...(selectedPlatforms.includes('instagram') && {
            instagram: {
              caption: socialCaption || `#ASMR #${(category || 'Relaxing').replace(/\s+/g, '')}`,
            },
          }),
          ...(selectedPlatforms.includes('facebook') && {
            facebook: {
              caption: socialCaption || `#ASMR #${(category || 'Relaxing').replace(/\s+/g, '')}`,
            },
          }),
        },
        publishNow: publishType === 'instant',
        scheduledFor: publishType === 'schedule' && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : undefined,
      };
      
      // Call Late.dev API
      const result = await lateApi.publishVideo(currentWorkspace.id, publishInput);
      
      console.log('[ASMR Export] Publish result:', result);
      
      // Update story record with published platforms info
      // Note: For ASMR, the story is already saved during generation
      // We need to update it with published_platforms
      if (exportData.storyId) {
        try {
          // Build published platforms object
          const publishedPlatformsData: Record<string, any> = {};
          for (const platformId of selectedPlatforms) {
            publishedPlatformsData[platformId] = {
              status: publishType === 'schedule' ? 'scheduled' : 'published',
              video_id: result.results?.find((r: any) => r.platform === platformId)?.videoId,
              published_at: new Date().toISOString(),
              scheduled_for: publishType === 'schedule' ? `${scheduleDate}T${scheduleTime}` : undefined,
            };
          }
          
          await apiRequest("PUT", `/api/stories/${exportData.storyId}/publish`, {
            publishedPlatforms: publishedPlatformsData,
          });
          console.log('[ASMR Export] Story publish info updated in database');
        } catch (dbError) {
          console.warn('[ASMR Export] Failed to update story in database:', dbError);
          // Don't fail the whole operation if DB update fails
        }
      }
      
      // Show success message
      const platformNames = selectedPlatforms.map(id => 
        PLATFORMS.find(p => p.id === id)?.name || id
      ).join(', ');
      
      toast({
        title: publishType === 'schedule' ? "Scheduled!" : "Published!",
        description: `Video ${publishType === 'schedule' ? 'scheduled for' : 'published to'} ${platformNames}`,
      });
      
    } catch (error: any) {
      console.error('[ASMR Export] Publish failed:', error);
      toast({
        title: "Publish failed",
        description: error.message || "Failed to publish video. Please check your social accounts are connected.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [exportData, selectedPlatforms, currentWorkspace, hasYouTube, youtubeTitle, youtubeDescription, socialCaption, publishType, scheduleDate, scheduleTime, category, toast]);
  
  // Validation for publish button
  const canPublish = selectedPlatforms.length > 0 && 
    exportData?.videoUrl &&
    (publishType === 'instant' || (scheduleDate && scheduleTime)) &&
    // Check metadata is filled for selected platforms
    (!hasYouTube || (youtubeTitle.trim() && youtubeDescription.trim())) &&
    (!hasSocialPlatforms || socialCaption.trim());

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
                    const platformConnected = platform.apiPlatform ? isConnected(platform.apiPlatform) : false;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    const isDisabled = !platformConnected;
                    
                    return (
                      <motion.div
                        key={platform.id}
                        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                        className={cn(
                          "p-3 rounded-xl transition-all duration-200",
                          "flex items-center gap-2",
                          "border relative",
                          isDisabled
                            ? "bg-white/[0.01] border-white/[0.04] opacity-60"
                            : isSelected
                              ? "bg-white/[0.08] border-primary/50"
                              : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                        )}
                        onClick={() => !isDisabled && handlePlatformToggle(platform.id)}
                      >
                        {/* Lock or checkbox icon */}
                        {platformConnected ? (
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-white/30"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        ) : (
                          <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                        )}
                        
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          "bg-gradient-to-br",
                          platform.gradient || platform.color,
                          isDisabled && "opacity-50"
                        )}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-xs font-medium block",
                            isDisabled && "text-white/50"
                          )}>
                            {platform.name}
                          </span>
                          {!platformConnected && (
                            <span className="text-[9px] text-amber-400">Not Connected</span>
                          )}
                        </div>
                        
                        {/* Connect button for unconnected */}
                        {!platformConnected && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(platform.id);
                            }}
                            disabled={connectingPlatform === platform.id}
                            className={cn(
                              "h-6 px-2 text-[10px] gap-1",
                              "bg-purple-500/10 border-purple-500/30 text-purple-300",
                              "hover:bg-purple-500/20",
                              "disabled:opacity-70"
                            )}
                          >
                            {connectingPlatform === platform.id ? (
                              <>
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Link2 className="w-2.5 h-2.5" />
                                Connect
                              </>
                            )}
                          </Button>
                        )}
                      </motion.div>
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
                  </div>

                  {hasYouTube && (
                    <div className={cn(
                      "p-3 rounded-xl space-y-3",
                      "bg-white/[0.02] border border-white/[0.06]"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SiYoutube className="h-4 w-4 text-red-500" />
                          <span className="text-xs font-medium">YouTube</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIMetadata('youtube')}
                          disabled={isGeneratingAI}
                          className="h-7 text-xs gap-1"
                        >
                          {isGeneratingAI ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          AI Generate
                        </Button>
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
                      <div className="flex items-center justify-between">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAIMetadata('tiktok')}
                          disabled={isGeneratingAI}
                          className="h-7 text-xs gap-1"
                        >
                          {isGeneratingAI ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          AI Generate
                        </Button>
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

        {/* Footer - Publish/Export Buttons */}
        <div className="flex-shrink-0 p-4 border-t border-white/[0.06] space-y-3">
          {/* Validation Warning */}
          {selectedPlatforms.length > 0 && !canPublish && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-300">
                {publishType === 'schedule' && (!scheduleDate || !scheduleTime)
                  ? "Please select date and time for scheduling"
                  : "Please fill in all required metadata fields"
                }
              </p>
            </div>
          )}
          
          {/* Publish Button - Only when platforms are selected */}
          {selectedPlatforms.length > 0 && (
            <Button
              onClick={handlePublishToSocial}
              disabled={!canPublish || isPublishing}
              className={cn(
                "w-full h-12 font-semibold",
                publishType === "schedule"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/25",
                "border-0 shadow-lg transition-all duration-300"
              )}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {publishType === "schedule" ? "Scheduling..." : "Publishing..."}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  {publishType === "schedule" ? "Schedule" : "Publish"} to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
          
          {/* Download Button - Always available */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant={selectedPlatforms.length > 0 ? "outline" : "default"}
            className={cn(
              "w-full h-12",
              selectedPlatforms.length > 0 
                ? "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]"
                : "bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 border-0 shadow-lg shadow-primary/25",
              "transition-all duration-300"
            )}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download Video
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
