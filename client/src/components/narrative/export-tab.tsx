/**
 * Export Tab Component for Narrative Mode
 * 
 * Two-panel layout:
 * - Left panel: Video summary, export settings, platform publishing
 * - Right panel: Video preview with rendering progress
 * 
 * Uses pink/rose color palette to match Narrative mode styling.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  Share2, 
  Copy, 
  Check,
  Play,
  Pause,
  Loader2,
  ExternalLink,
  Clock,
  Monitor,
  CheckCircle2,
  Video,
  Wand2,
  Link2,
  Lock,
  Film,
  Music,
  Mic,
  Layers,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useSocialAccounts } from "@/components/shared/social";
import { useWorkspace } from "@/contexts/workspace-context";
import { apiRequest } from "@/lib/queryClient";
import { lateApi, type PublishVideoInput, type LatePlatform } from "@/lib/api/late";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORMS = [
  { id: "youtube_shorts", name: "YouTube Shorts", icon: SiYoutube, color: "bg-red-600", gradient: "from-red-600 to-red-700", apiPlatform: "youtube" as LatePlatform, requiresAspectRatio: false },
  { id: "youtube_video", name: "YouTube Video", icon: SiYoutube, color: "bg-red-600", gradient: "from-red-600 to-red-700", apiPlatform: "youtube" as LatePlatform, requiresAspectRatio: true, aspectRatioText: "Requires 16:9 or 4:5 or 1:1 aspect ratio." },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "bg-black", gradient: "from-gray-800 to-black", apiPlatform: "tiktok" as LatePlatform, requiresAspectRatio: false },
  { id: "instagram", name: "Instagram Reels", icon: SiInstagram, gradient: "from-purple-600 via-pink-500 to-orange-400", apiPlatform: "instagram" as LatePlatform, requiresAspectRatio: false },
  { id: "facebook", name: "Facebook Reels", icon: SiFacebook, color: "bg-blue-600", gradient: "from-blue-600 to-blue-700", apiPlatform: "facebook" as LatePlatform, requiresAspectRatio: false },
];

const RENDER_STEPS = [
  { id: 'downloading', label: 'Downloading assets', progress: 10 },
  { id: 'queued', label: 'Preparing timeline', progress: 20 },
  { id: 'fetching', label: 'Fetching media', progress: 40 },
  { id: 'rendering', label: 'Rendering video', progress: 60 },
  { id: 'saving', label: 'Saving video', progress: 85 },
  { id: 'uploading', label: 'Uploading to CDN', progress: 95 },
  { id: 'done', label: 'Complete', progress: 100 },
];

interface NarrativeExportTabProps {
  videoId?: string;
  videoTitle?: string;
  duration?: number;
  sceneCount?: number;
  aspectRatio?: string;
  hasVoiceover?: boolean;
  hasMusic?: boolean;
  imageModel?: string;
}

export function NarrativeExportTab({
  videoId,
  videoTitle = 'Untitled',
  duration = 0,
  sceneCount = 0,
  aspectRatio = '16:9',
  hasVoiceover = false,
  hasMusic = false,
  imageModel = 'AI Model',
}: NarrativeExportTabProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { isLoading: isLoadingAccounts, isConnected, getConnectUrl, refetch: refetchAccounts } = useSocialAccounts();
  
  // Render state
  const [renderStatus, setRenderStatus] = useState<string>('pending');
  const [renderProgress, setRenderProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Publishing state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishType, setPublishType] = useState<"instant" | "schedule">("instant");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  
  // Metadata
  const [youtubeTitle, setYoutubeTitle] = useState(videoTitle);
  const [youtubeDescription, setYoutubeDescription] = useState('');
  const [socialCaption, setSocialCaption] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Collapsible platform sections
  const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>([]);
  
  // Check export status and start render if needed
  useEffect(() => {
    if (!videoId) return;
    
    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;
    let hasStartedRender = false;
    
    const pollStatus = async (): Promise<boolean> => {
      try {
        const statusResponse = await fetch(
          `/api/narrative/videos/${videoId}/export/status`,
          { credentials: 'include' }
        );
        
        if (!statusResponse.ok) {
          const errData = await statusResponse.json();
          // If step7Data doesn't exist, this is an invalid state
          if (errData.error?.includes('not initialized')) {
            if (isMounted) {
              setError('Export was not properly initialized. Please go back to Preview and click Export Video again.');
              setRenderStatus('failed');
            }
            return false;
          }
          return true; // Keep polling for other errors
        }
        
        const data = await statusResponse.json();
        if (isMounted) {
          setRenderStatus(data.renderStatus);
          setRenderProgress(data.renderProgress || 0);
          
          if (data.exportUrl) {
            setExportUrl(data.exportUrl);
          }
          if (data.thumbnailUrl) {
            setThumbnailUrl(data.thumbnailUrl);
          }
          if (data.error) {
            setError(data.error);
          }
        }
        
        // Stop polling when done or failed
        if (data.renderStatus === 'done' || data.renderStatus === 'failed') {
          if (data.renderStatus === 'done' && isMounted) {
            toast({
              title: 'Export Complete!',
              description: 'Your video is ready to download or publish.',
            });
          }
          return false; // Stop polling
        }
        
        // Try to start render if pending and haven't tried yet
        if (data.renderStatus === 'pending' && !hasStartedRender) {
          hasStartedRender = true;
          console.log('[NarrativeExportTab] Attempting to start render...');
          
          try {
            const startResponse = await fetch(
              `/api/narrative/videos/${videoId}/export/start-render`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
              }
            );
            
            if (!startResponse.ok) {
              const errData = await startResponse.json();
              if (!errData.error?.includes('already')) {
                console.error('[NarrativeExportTab] Start render failed:', errData.error);
              }
            }
          } catch (startErr) {
            console.error('[NarrativeExportTab] Start render error:', startErr);
          }
        }
        
        return true; // Continue polling
      } catch (pollError) {
        console.error('[NarrativeExportTab] Poll error:', pollError);
        return true; // Continue polling on network errors
      }
    };
    
    const startPolling = async () => {
      // Initial poll
      const shouldContinue = await pollStatus();
      
      if (!shouldContinue || !isMounted) return;
      
      // Start interval polling (every 3 seconds)
      pollInterval = setInterval(async () => {
        const shouldContinue = await pollStatus();
        if (!shouldContinue && pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }, 3000);
    };
    
    startPolling();
    
    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [videoId, toast]);
  
  // Handlers
  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => {
      const newSelected = prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId];
      
      // If deselecting, also collapse it
      if (prev.includes(platformId)) {
        setExpandedPlatforms(current => current.filter(id => id !== platformId));
      }
      
      return newSelected;
    });
  };
  
  const togglePlatformExpand = (platformId: string) => {
    setExpandedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };
  
  const handleDownload = async () => {
    if (!exportUrl) return;
    
    try {
      const filename = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`;
      const response = await fetch(exportUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Download started',
        description: 'Your video is being downloaded.',
      });
    } catch (err) {
      console.error('[NarrativeExportTab] Download error:', err);
      toast({
        title: 'Download failed',
        description: 'Failed to download video. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCopyLink = () => {
    if (!exportUrl) return;
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link copied',
      description: 'Video URL copied to clipboard.',
    });
  };
  
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Platform connection
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
      connectIntervalRef.current = setInterval(async () => {
        await refetchAccounts();
      }, 3000);
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
  
  // AI metadata generation
  const handleAIMetadata = useCallback(async (platform: string) => {
    setIsGeneratingAI(true);
    try {
      // Build rich scriptText from available video data
      let scriptText = videoTitle;
      
      // Fetch video data for richer context
      if (videoId) {
        try {
          const videoResponse = await fetch(`/api/videos/${videoId}`, {
            credentials: 'include',
          });
          
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            const step1Data = videoData.step1Data;
            const step3Data = videoData.step3Data;
            
            // Build rich description combining:
            // 1. Video title
            // 2. Script (from step1Data)
            // 3. Scene descriptions (from step3Data)
            const parts: string[] = [];
            
            if (videoTitle && videoTitle !== 'Untitled') {
              parts.push(`Title: ${videoTitle}`);
            }
            
            if (step1Data?.script) {
              parts.push(`\nScript:\n${step1Data.script}`);
            }
            
            if (step3Data?.scenes && Array.isArray(step3Data.scenes) && step3Data.scenes.length > 0) {
              parts.push(`\nScenes:`);
              step3Data.scenes.forEach((scene: any, index: number) => {
                if (scene.title || scene.description) {
                  parts.push(`\nScene ${index + 1}: ${scene.title || 'Untitled'}`);
                  if (scene.description) {
                    parts.push(`${scene.description}`);
                  }
                }
              });
            }
            
            if (parts.length > 0) {
              scriptText = parts.join('\n');
            }
          }
        } catch (fetchError) {
          console.warn('[NarrativeExportTab] Could not fetch video data for metadata generation, using title only:', fetchError);
        }
      }
      
      const res = await apiRequest("POST", "/api/stories/social/metadata", {
        platform: platform === 'youtube' ? 'youtube' : platform,
        scriptText: scriptText,
        duration: duration,
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
      console.error('[NarrativeExportTab] Failed to generate metadata:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate AI metadata. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }, [videoId, videoTitle, duration, toast]);
  
  // Publish to social
  const hasYouTube = selectedPlatforms.some(p => ["youtube_shorts", "youtube_video"].includes(p));
  const hasSocialPlatforms = selectedPlatforms.some(p => ["tiktok", "instagram", "facebook"].includes(p));
  
  const handlePublish = useCallback(async () => {
    if (!exportUrl || selectedPlatforms.length === 0) return;
    
    if (!currentWorkspace) {
      toast({
        title: "No workspace selected",
        description: "Please select a workspace to publish videos.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPublishing(true);
    
    try {
      const publishInput: PublishVideoInput = {
        videoUrl: exportUrl,
        platforms: selectedPlatforms.map(id => {
          const platform = PLATFORMS.find(p => p.id === id);
          // Map both youtube_shorts and youtube_video to youtube platform
          let apiPlatform: LatePlatform;
          if (id === "youtube_shorts" || id === "youtube_video") {
            apiPlatform = "youtube";
          } else {
            apiPlatform = (platform?.apiPlatform || id) as LatePlatform;
          }
          return { platform: apiPlatform };
        }),
        metadata: {},
      };
      
      if (hasYouTube) {
        publishInput.metadata.youtube = {
          title: youtubeTitle || videoTitle,
          description: youtubeDescription,
        };
      }
      
      if (hasSocialPlatforms) {
        if (selectedPlatforms.includes('tiktok')) {
          publishInput.metadata.tiktok = { caption: socialCaption };
        }
        if (selectedPlatforms.includes('instagram')) {
          publishInput.metadata.instagram = { caption: socialCaption };
        }
        if (selectedPlatforms.includes('facebook')) {
          publishInput.metadata.facebook = { caption: socialCaption };
        }
      }
      
      publishInput.publishNow = publishType === 'instant';
      if (publishType === 'schedule' && scheduleDate && scheduleTime) {
        publishInput.scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }
      
      if (!currentWorkspace) {
        throw new Error('No workspace selected');
      }
      
      const result = await lateApi.publishVideo(currentWorkspace.id, publishInput);
      
      const platformNames = selectedPlatforms.map(id => 
        PLATFORMS.find(p => p.id === id)?.name || id
      ).join(', ');
      
      toast({
        title: publishType === 'schedule' ? "Scheduled!" : "Published!",
        description: `Video ${publishType === 'schedule' ? 'scheduled for' : 'published to'} ${platformNames}`,
      });
      
    } catch (error: any) {
      console.error('[NarrativeExportTab] Publish failed:', error);
      toast({
        title: "Publish failed",
        description: error.message || "Failed to publish video. Please check your social accounts are connected.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  }, [exportUrl, selectedPlatforms, currentWorkspace, hasYouTube, youtubeTitle, youtubeDescription, socialCaption, publishType, scheduleDate, scheduleTime, videoTitle, toast]);
  
  const canPublish = selectedPlatforms.length > 0 && 
    exportUrl &&
    renderStatus === 'done' &&
    (publishType === 'instant' || (scheduleDate && scheduleTime)) &&
    (!hasYouTube || (youtubeTitle.trim() && youtubeDescription.trim())) &&
    (!hasSocialPlatforms || socialCaption.trim());
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get current render step
  const getCurrentStep = () => {
    return RENDER_STEPS.find(s => s.id === renderStatus) || RENDER_STEPS[0];
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="h-full flex bg-[#0a0a0a] overflow-hidden">
      {/* Background Effects - Pink/Rose theme */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Left Panel - Control Panel */}
      <div className={cn(
        "w-[40%] min-w-[380px] max-w-[520px] flex-shrink-0",
        "h-full",
        "bg-black/40 backdrop-blur-xl",
        "border-r border-white/[0.06]",
        "flex flex-col relative z-10 overflow-hidden"
      )}>
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {renderStatus === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : renderStatus === 'failed' ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Loader2 className="h-4 w-4 text-pink-400 animate-spin" />
                )}
                <h1 className="text-base font-semibold">
                  {renderStatus === 'done' ? 'Export Complete' : 
                   renderStatus === 'failed' ? 'Export Failed' : 
                   'Exporting Video...'}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                {renderStatus === 'done' ? 'Your video is ready' :
                 renderStatus === 'failed' ? error || 'An error occurred' :
                 `${renderProgress}% complete`}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1" viewportClassName="bg-transparent">
          <div className="p-4 space-y-5 pb-40">
            {/* Video Summary */}
            <div className={cn(
              "p-4 rounded-xl",
              "bg-white/[0.02] border border-white/[0.06]"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Video className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium">Video Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="truncate ml-4 max-w-[180px]">{videoTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{formatDuration(duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scenes</span>
                  <span>{sceneCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aspect Ratio</span>
                  <span>{aspectRatio}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Audio</span>
                  <div className="flex items-center gap-2">
                    {hasVoiceover && (
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                        <Mic className="w-3 h-3 mr-1" />
                        Voiceover
                      </Badge>
                    )}
                    {hasMusic && (
                      <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-300">
                        <Music className="w-3 h-3 mr-1" />
                        Music
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Settings (read-only) */}
            <div className={cn(
              "p-4 rounded-xl",
              "bg-white/[0.02] border border-white/[0.06]"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium">Export Settings</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quality</span>
                  <span className="text-white">1080p Full HD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="text-white">MP4</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Share To Platforms */}
            {renderStatus === 'done' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-pink-400" />
                      <span className="text-sm font-medium">Share To (Optional)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          // Generate metadata for all selected platforms
                          if (hasYouTube) {
                            await handleAIMetadata('youtube');
                          }
                          if (hasSocialPlatforms) {
                            await handleAIMetadata('tiktok');
                          }
                        }}
                        disabled={isGeneratingAI || selectedPlatforms.length === 0}
                        className="h-7 text-xs gap-1 text-pink-400 hover:text-pink-300"
                      >
                        {isGeneratingAI ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        AI Generate
                      </Button>
                      {selectedPlatforms.length > 0 && (
                        <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-300">
                          {selectedPlatforms.length} selected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {PLATFORMS.map(platform => {
                        const Icon = platform.icon;
                        const platformConnected = platform.apiPlatform ? isConnected(platform.apiPlatform) : false;
                        const isSelected = selectedPlatforms.includes(platform.id);
                        const isExpanded = expandedPlatforms.includes(platform.id);
                        const isDisabled = !platformConnected;
                        const showMetadata = isExpanded;
                      
                      return (
                        <div key={platform.id} className="space-y-2">
                          <motion.div
                            whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                            whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                            className={cn(
                              "p-3 rounded-xl transition-all duration-200",
                              "flex items-center gap-3",
                              "border",
                              isDisabled
                                ? "bg-white/[0.01] border-white/[0.04] opacity-60"
                                : isSelected
                                  ? "bg-white/[0.08] border-pink-500/50"
                                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                            )}
                            onClick={() => !isDisabled && handlePlatformToggle(platform.id)}
                          >
                            {platformConnected ? (
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                isSelected
                                  ? "bg-pink-500 border-pink-500"
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
                              {platform.requiresAspectRatio && platform.aspectRatioText && (
                                <span className="text-[9px] text-muted-foreground block mt-0.5">
                                  {platform.aspectRatioText}
                                </span>
                              )}
                              {!platformConnected && !platform.requiresAspectRatio && (
                                <span className="text-[9px] text-amber-400 block mt-0.5">Not Connected</span>
                              )}
                            </div>
                            
                            {!platformConnected ? (
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
                                  "bg-pink-500/10 border-pink-500/30 text-pink-300",
                                  "hover:bg-pink-500/20",
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
                            ) : isSelected && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlatformExpand(platform.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-pink-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-pink-400" />
                                )}
                              </Button>
                            )}
                           </motion.div>
                           
                           {/* Metadata section for selected and expanded platforms */}
                           <AnimatePresence>
                             {showMetadata && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: "auto", opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 transition={{ duration: 0.2 }}
                                 className="overflow-hidden"
                               >
                              <div className={cn(
                                "p-3 rounded-xl space-y-3 ml-11",
                                "bg-white/[0.02] border border-white/[0.06]"
                              )}>
                                {(platform.id === 'youtube_shorts' || platform.id === 'youtube_video') && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-white/70">YouTube Details</span>
                                    </div>
                                    <Input
                                      placeholder="Video title"
                                      value={youtubeTitle}
                                      onChange={(e) => setYoutubeTitle(e.target.value)}
                                      className="bg-white/[0.03] border-white/[0.08] h-9 text-sm"
                                    />
                                    <Textarea
                                      placeholder="Video description"
                                      value={youtubeDescription}
                                      onChange={(e) => setYoutubeDescription(e.target.value)}
                                      className="bg-white/[0.03] border-white/[0.08] min-h-[80px] text-sm resize-none"
                                    />
                                  </>
                                )}
                                {(platform.id === 'tiktok' || platform.id === 'instagram' || platform.id === 'facebook') && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Music className="h-3 w-3 text-white/50" />
                                      <span className="text-xs font-medium text-white/70">Social Caption</span>
                                    </div>
                                    <Textarea
                                      placeholder="Write a caption..."
                                      value={socialCaption}
                                      onChange={(e) => setSocialCaption(e.target.value)}
                                      className="bg-white/[0.03] border-white/[0.08] min-h-[80px] text-sm resize-none"
                                    />
                                  </>
                                )}
                               </div>
                             </motion.div>
                             )}
                           </AnimatePresence>
                         </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            
            {/* Footer Actions - Inside ScrollArea */}
            {renderStatus === 'done' && (
              <div className="space-y-3 pt-5">
                {/* Warning message when metadata is missing */}
                {selectedPlatforms.length > 0 && !canPublish && (
                  <div className={cn(
                    "flex items-start gap-2 p-3 rounded-lg",
                    "bg-amber-500/10 border border-amber-500/20"
                  )}>
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-amber-300">
                        Fill in metadata for: {selectedPlatforms.map(id => 
                          PLATFORMS.find(p => p.id === id)?.name
                        ).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Publish Buttons */}
                {selectedPlatforms.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setPublishType('instant');
                        handlePublish();
                      }}
                      disabled={!canPublish || isPublishing}
                      className={cn(
                        "flex-1 bg-gradient-to-r from-purple-600 to-purple-700",
                        "hover:from-purple-500 hover:to-purple-600",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isPublishing && publishType === 'instant' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          Publish Now
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setPublishType('schedule')}
                      disabled={isPublishing}
                      variant="outline"
                      className="flex-1 border-white/10 hover:bg-white/5"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                )}
                
                {/* Schedule date/time picker - shown when Schedule button clicked */}
                {selectedPlatforms.length > 0 && publishType === 'schedule' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.08] h-9 text-sm"
                      placeholder="Date"
                    />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.08] h-9 text-sm"
                      placeholder="Time"
                    />
                  </div>
                )}
                
                {/* Final Publish Button */}
                {selectedPlatforms.length > 0 && (
                  <Button
                    onClick={handlePublish}
                    disabled={!canPublish || isPublishing}
                    className={cn(
                      "w-full h-11 font-medium",
                      "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600",
                      "hover:from-purple-500 hover:via-pink-500 hover:to-purple-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {publishType === 'schedule' ? 'Scheduling...' : 'Publishing...'}
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        {publishType === 'schedule' ? 'Schedule to' : 'Publish to'} {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Video Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
        {/* Rendering Progress */}
        {renderStatus !== 'done' && renderStatus !== 'failed' && (
          <div className="w-full max-w-lg text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-pink-400 animate-spin" />
              </div>
            </motion.div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">
                {getCurrentStep().label}...
              </h3>
              <p className="text-sm text-white/60">
                This may take a few minutes
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                initial={{ width: 0 }}
                animate={{ width: `${renderProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-white/40">{renderProgress}%</p>
            
            {/* Steps */}
            <div className="flex justify-center gap-2 flex-wrap">
              {RENDER_STEPS.filter(s => s.id !== 'done').map((step) => {
                const isCurrent = step.id === renderStatus;
                const isComplete = RENDER_STEPS.findIndex(s => s.id === step.id) < 
                                   RENDER_STEPS.findIndex(s => s.id === renderStatus);
                
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                      isCurrent ? "bg-pink-500/20 text-pink-300" :
                      isComplete ? "bg-white/5 text-white/40" :
                      "bg-white/[0.02] text-white/20"
                    )}
                  >
                    {isComplete && <Check className="w-3 h-3" />}
                    {isCurrent && <Loader2 className="w-3 h-3 animate-spin" />}
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Error State */}
        {renderStatus === 'failed' && (
          <div className="w-full max-w-md text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Export Failed</h3>
            <p className="text-sm text-white/60">{error || 'An error occurred during export'}</p>
            {error?.includes('not initialized') || error?.includes('not properly initialized') ? (
              <div className="space-y-3">
                <p className="text-xs text-white/40">
                  The export process was interrupted. Please go back to the Preview step and click "Export Video" again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="gap-2 border-white/10 hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Go Back to Preview
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2 border-white/10 hover:bg-white/5"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
          </div>
        )}
        
        {/* Video Player */}
        {renderStatus === 'done' && exportUrl && (
          <div className="w-full h-full max-w-6xl flex flex-col items-center justify-center space-y-4 pb-24">
            {/* Video Container with modern styling */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn(
                "relative w-full mx-auto",
                aspectRatio === "9:16" ? "aspect-[9/16] max-h-[85vh]" :
                aspectRatio === "1:1" ? "aspect-square max-h-[75vh]" :
                "aspect-video max-h-[70vh]",
                "rounded-xl overflow-hidden",
                "bg-black/60",
                "border border-white/[0.08]",
                "shadow-2xl shadow-black/50"
              )}
            >
              <video
                ref={videoRef}
                src={exportUrl}
                poster={thumbnailUrl || undefined}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controls
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-black/70 backdrop-blur-sm border-white/10 text-xs px-2.5 py-1">
                  <Clock className="w-3 h-3 mr-1.5" />
                  {formatDuration(duration)}
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="bg-black/70 backdrop-blur-sm border-white/10 text-xs px-2.5 py-1">
                  <Layers className="w-3 h-3 mr-1.5" />
                  {aspectRatio}
                </Badge>
              </div>

              {/* Corner Decorations - Pink theme */}
              <div className="absolute top-4 left-4 w-5 h-5 border-l-2 border-t-2 border-pink-500/30 rounded-tl pointer-events-none" />
              <div className="absolute top-4 right-4 w-5 h-5 border-r-2 border-t-2 border-pink-500/30 rounded-tr pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-l-2 border-b-2 border-pink-500/30 rounded-bl pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-r-2 border-b-2 border-pink-500/30 rounded-br pointer-events-none" />
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex items-center justify-center gap-3"
            >
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                asChild
                className="gap-2 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08]"
              >
                <a href={exportUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}







