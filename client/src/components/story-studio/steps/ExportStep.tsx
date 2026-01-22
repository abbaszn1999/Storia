// Export Step - Final preview and export options
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Mic,
  ChevronDown,
  ChevronRight,
  Wand2,
  Send,
  CheckSquare,
  SquareIcon,
  Calendar,
  Zap,
  AlertCircle,
  Link2,
  Lock
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { StoryScene, StoryTemplate } from "../types";
import { getVideoModelConfig } from "@/constants/video-models";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { useWorkspace } from "@/contexts/workspace-context";
import { lateApi, type PublishVideoInput, type LatePlatform } from "@/lib/api/late";
import { useToast } from "@/hooks/use-toast";
import { useSocialAccounts } from "@/components/shared/social";
import { apiRequest } from "@/lib/queryClient";

// Export result with separated audio assets
interface ExportResult {
  videoUrl: string;
  videoBaseUrl?: string;    // Video with voiceover, no music (for remix)
  voiceoverUrl?: string;    // Voiceover audio file
  musicUrl?: string;        // Music audio file
  duration: number;
  size: number;
}

interface ExportStepProps {
  template: StoryTemplate;
  scenes: StoryScene[];
  scriptText: string;       // The story script/topic for AI metadata generation
  aspectRatio: string;
  duration: number;
  selectedVoice: string;
  backgroundMusic: string;
  musicStyle: string;       // Music style for volume control check
  customMusicUrl: string;   // User-uploaded custom music URL
  voiceVolume: number;
  musicVolume: number;
  isGenerating: boolean;
  generationProgress: number;
  voiceoverEnabled: boolean;
  imageModel: string;       // Image model used for generation
  videoModel?: string;      // Video model ID to check hasAudio (for auto-asmr sound effects)
  isFinalExporting?: boolean;  // Is final export in progress
  hasGeneratedVoiceover: boolean;  // Track if voiceover has been auto-generated once
  hasExportedVideo: boolean;       // Track if video has been auto-exported once
  storyId?: string;                // Database story ID for updating published_platforms
  lastExportResult?: {             // Previous export result to restore on re-entry
    videoUrl: string;
    videoBaseUrl?: string;
    voiceoverUrl?: string;
    musicUrl?: string;
  };
  onExport: () => Promise<ExportResult | null>;
  onRemix: (videoBaseUrl: string, voiceoverUrl: string, musicUrl: string, voiceVolume: number, musicVolume: number) => Promise<string | null>;
  onFinalExport: (audioAssets: { videoBaseUrl?: string; voiceoverUrl?: string; musicUrl?: string } | null, voiceVolume: number, musicVolume: number) => Promise<void>;  // Called by Export Video button
  onGenerateVoiceover: () => Promise<void>;
  onVoiceVolumeChange: (volume: number) => void;  // Update parent state
  onMusicVolumeChange: (volume: number) => void;  // Update parent state
  onBusyStateChange?: (isBusy: boolean) => void;  // Notify parent when busy (voiceover, export, publish)
  accentColor?: string;
}

// Platform configuration with metadata fields and requirements
interface PlatformRequirements {
  aspectRatios?: string[];  // Allowed aspect ratios
  maxDuration?: number;     // Max duration in seconds
}

interface PlatformConfig {
  id: string;
  name: string;
  icon: typeof SiYoutube;
  gradient: string;
  iconBg: string;
  fields: readonly ('title' | 'description' | 'caption')[];
  requirements?: PlatformRequirements;
  apiPlatform?: string; // The actual platform name to send to API (e.g., 'youtube' for both shorts and video)
}

const PLATFORMS: PlatformConfig[] = [
  { 
    id: 'youtube-short', 
    name: 'YouTube Shorts', 
    icon: SiYoutube, 
    gradient: 'from-red-600 to-red-700',
    iconBg: 'bg-red-600',
    fields: ['title', 'description'] as const,
    requirements: {
      aspectRatios: ['9:16'],  // Vertical only
      maxDuration: 180,        // 3 minutes max
    },
    apiPlatform: 'youtube',
  },
  { 
    id: 'youtube-video', 
    name: 'YouTube Video', 
    icon: SiYoutube, 
    gradient: 'from-red-600 to-red-700',
    iconBg: 'bg-red-600',
    fields: ['title', 'description'] as const,
    requirements: {
      aspectRatios: ['16:9', '4:5', '1:1'],  // Horizontal or square
    },
    apiPlatform: 'youtube',
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: SiTiktok, 
    gradient: 'from-gray-800 to-black',
    iconBg: 'bg-black',
    fields: ['caption'] as const,
    requirements: {
      aspectRatios: ['9:16'],  // Vertical only
      maxDuration: 180,        // 3 minutes max
    },
    apiPlatform: 'tiktok' as LatePlatform,
  },
  { 
    id: 'instagram', 
    name: 'Instagram Reels', 
    icon: SiInstagram, 
    gradient: 'from-purple-600 via-pink-500 to-orange-400',
    iconBg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    fields: ['caption'] as const,
    requirements: {
      aspectRatios: ['9:16', '4:5', '1:1'],  // Vertical, portrait, or square
      maxDuration: 90,  // 90 seconds max for Reels
    },
    apiPlatform: 'instagram' as LatePlatform,
  },
  { 
    id: 'facebook', 
    name: 'Facebook Reels', 
    icon: SiFacebook, 
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-600',
    fields: ['caption'] as const,
    requirements: {
      aspectRatios: ['9:16', '16:9', '4:5', '1:1'],  // Most formats
      maxDuration: 90,  // 90 seconds max for Reels
    },
    apiPlatform: 'facebook' as LatePlatform,
  },
];

// Helper to check platform compatibility and get reason if incompatible
function getPlatformCompatibility(
  platform: PlatformConfig, 
  aspectRatio: string, 
  duration: number
): { compatible: boolean; reason?: string } {
  if (!platform.requirements) {
    return { compatible: true };
  }

  const { aspectRatios, maxDuration } = platform.requirements;

  // Check aspect ratio
  if (aspectRatios && !aspectRatios.includes(aspectRatio)) {
    const required = aspectRatios.join(' or ');
    return { 
      compatible: false, 
      reason: `Requires ${required} aspect ratio` 
    };
  }

  // Check duration
  if (maxDuration && duration > maxDuration) {
    const maxMinutes = Math.floor(maxDuration / 60);
    const maxSeconds = maxDuration % 60;
    const maxStr = maxSeconds > 0 ? `${maxMinutes}m ${maxSeconds}s` : `${maxMinutes} min`;
    return { 
      compatible: false, 
      reason: `Max duration: ${maxStr}` 
    };
  }

  return { compatible: true };
}

// Type for platform metadata
interface PlatformMetadata {
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
}

export function ExportStep({
  template,
  scenes,
  scriptText,
  aspectRatio,
  duration,
  selectedVoice,
  backgroundMusic,
  musicStyle,
  customMusicUrl,
  voiceVolume,
  musicVolume,
  isGenerating,
  generationProgress,
  voiceoverEnabled,
  imageModel,
  videoModel,
  isFinalExporting = false,
  hasGeneratedVoiceover,
  hasExportedVideo,
  storyId,
  lastExportResult,
  onExport,
  onRemix,
  onFinalExport,
  onGenerateVoiceover,
  onVoiceVolumeChange,
  onMusicVolumeChange,
  onBusyStateChange,
  accentColor = "primary"
}: ExportStepProps) {
  // Get workspace for publishing
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  // Social accounts hook for connection status
  const { isLoading: isLoadingAccounts, isConnected, getConnectUrl, refetch: refetchAccounts } = useSocialAccounts();

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [platformMetadata, setPlatformMetadata] = useState<Record<string, PlatformMetadata>>({
    'youtube-short': { title: '', description: '' },
    'youtube-video': { title: '', description: '' },
    tiktok: { caption: '' },
    instagram: { caption: '' },
    facebook: { caption: '' },
  });
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  
  // Scheduling state
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  // Initialize from lastExportResult if returning to this step
  const [voiceoverGenerated, setVoiceoverGenerated] = useState(hasGeneratedVoiceover);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(lastExportResult?.videoUrl || null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Volume control state - initialize from lastExportResult if returning
  const [audioAssets, setAudioAssets] = useState<{
    videoBaseUrl?: string;
    voiceoverUrl?: string;
    musicUrl?: string;
  } | null>(lastExportResult ? {
    videoBaseUrl: lastExportResult.videoBaseUrl,
    voiceoverUrl: lastExportResult.voiceoverUrl,
    musicUrl: lastExportResult.musicUrl,
  } : null);
  const [localVoiceVolume, setLocalVoiceVolume] = useState(voiceVolume);
  const [localMusicVolume, setLocalMusicVolume] = useState(musicVolume);
  const [volumeChanged, setVolumeChanged] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  
  // Refs for real-time audio preview
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFY PARENT ABOUT BUSY STATE
  // ═══════════════════════════════════════════════════════════════════════════
  // Notify parent when any busy state changes (voiceover, export, remix, publish)
  useEffect(() => {
    const isBusy = isGeneratingVoiceover || isExporting || isRemixing || isPublishing;
    onBusyStateChange?.(isBusy);
  }, [isGeneratingVoiceover, isExporting, isRemixing, isPublishing, onBusyStateChange]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECT DOWNLOAD FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════
  const handleDirectDownload = useCallback(async (url: string, filename: string) => {
    setIsDownloading(true);
    try {
      console.log('[ExportStep] Starting direct download:', filename);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      console.log('[ExportStep] Download complete');
    } catch (error) {
      console.error('[ExportStep] Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  }, []);
  
  // Get formatted filename for download (always 1080p MP4)
  const getDownloadFilename = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `storia-video-${timestamp}-1080p.mp4`;
  }, []);
  
  // Check if real-time volume control mode should be enabled
  // We need videoBaseUrl (muted video) + at least one of voiceoverUrl or musicUrl
  const hasAudioAssets = audioAssets?.videoBaseUrl && 
    (audioAssets?.voiceoverUrl || audioAssets?.musicUrl);
  
  // Track if onFinalExport was called this render
  const hasFinalExportTriggered = useRef(false);
  
  // Clear connecting state when platform becomes connected
  useEffect(() => {
    if (connectingPlatform) {
      const platform = PLATFORMS.find(p => p.id === connectingPlatform);
      if (platform?.apiPlatform && isConnected(platform.apiPlatform as LatePlatform)) {
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
  
  // When isFinalExporting changes to true, call onFinalExport
  useEffect(() => {
    if (isFinalExporting && !hasFinalExportTriggered.current && exportedVideoUrl) {
      hasFinalExportTriggered.current = true;
      console.log('[ExportStep] Final export triggered, calling onFinalExport');
      onFinalExport(audioAssets, localVoiceVolume, localMusicVolume);
    } else if (!isFinalExporting) {
      hasFinalExportTriggered.current = false;
    }
  }, [isFinalExporting, exportedVideoUrl, audioAssets, localVoiceVolume, localMusicVolume, onFinalExport]);
  // Show volume controls if there's voiceover AND (AI music OR custom music)
  const hasAnyMusic = musicStyle !== 'none' || !!customMusicUrl;
  const showVolumeControls = voiceoverEnabled && hasAnyMusic && 
    exportedVideoUrl && hasAudioAssets;
  
  // Debug logging for volume controls
  if (exportedVideoUrl && !showVolumeControls) {
    console.log('[ExportStep] Volume controls hidden:', {
      voiceoverEnabled,
      musicStyle,
      customMusicUrl: !!customMusicUrl,
      hasAnyMusic,
      hasAudioAssets,
      audioAssets: audioAssets ? {
        videoBaseUrl: !!audioAssets.videoBaseUrl,
        voiceoverUrl: !!audioAssets.voiceoverUrl,
        musicUrl: !!audioAssets.musicUrl,
      } : null,
    });
  }
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
  const hasAttemptedGenerationLocal = useRef(false);  // Local tracking for this mount cycle
  const hasAttemptedExportLocal = useRef(false);      // Local tracking for this mount cycle

  // Check if all scenes have audio
  const allScenesHaveAudio = scenes.every(s => s.audioUrl);
  
  // For auto-asmr: check if we should show sound effects section
  // CRITICAL: Check if video model supports native audio
  const isAutoAsmr = template?.id === 'auto-asmr';
  const modelConfig = useMemo(() => {
    if (!videoModel) return null;
    return getVideoModelConfig(videoModel);
  }, [videoModel]);
  
  const hasNativeAudio = modelConfig?.hasAudio ?? false;
  // In auto-asmr mode, only show sound effects if model doesn't support native audio
  const shouldShowSoundEffects = isAutoAsmr && !hasNativeAudio;
  
  console.log('[ExportStep] Audio configuration:', {
    isAutoAsmr,
    videoModel: videoModel || 'unknown',
    hasNativeAudio,
    shouldShowSoundEffects,
    voiceoverEnabled,
  });

  // Auto-generate voiceover/sound effects on mount if enabled (ONCE ONLY - uses parent state flag)
  // For auto-asmr mode: generate sound effects if video model doesn't support native audio
  useEffect(() => {
    // Skip if already generated globally (parent state tracks this)
    if (hasGeneratedVoiceover) {
        setVoiceoverGenerated(true);
      return;
    }
    
    // For auto-asmr: check if video model supports native audio
    // If not, we need to generate sound effects
    // For other modes: check voiceoverEnabled
    // CRITICAL: In auto-asmr mode, NEVER use voiceoverEnabled
    const shouldGenerateAudio = isAutoAsmr
      ? (shouldShowSoundEffects && scenes.some(s => s.soundDescription && s.soundDescription.trim().length > 0))
      : voiceoverEnabled; // Only use voiceoverEnabled for non-auto-asmr modes
    
    if (shouldGenerateAudio && 
        !voiceoverGenerated && 
        !hasAttemptedGenerationLocal.current && 
        scenes.length > 0 &&
        !allScenesHaveAudio) {
      
      hasAttemptedGenerationLocal.current = true; // Prevent multiple calls in this mount
      setIsGeneratingVoiceover(true);
      
      const audioType = shouldShowSoundEffects ? 'sound effects' : 'voiceover';
      console.log(`[ExportStep] Auto-generating ${audioType} (first time only)...`);
      onGenerateVoiceover()
        .then(() => {
          setVoiceoverGenerated(true);
          setIsGeneratingVoiceover(false);
        console.log(`[ExportStep] ${audioType} generation complete`);
        })
        .catch(error => {
          console.error(`[ExportStep] ${audioType} generation failed:`, error);
          hasAttemptedGenerationLocal.current = false; // Allow retry on failure
          setIsGeneratingVoiceover(false);
        });
    } else if (allScenesHaveAudio) {
      // If all scenes already have audio, mark as generated
      setVoiceoverGenerated(true);
    } else if (!shouldGenerateAudio) {
      // If audio generation is not needed, skip and mark as ready
      const audioType = shouldShowSoundEffects ? 'sound effects' : 'voiceover';
      console.log(`[ExportStep] ${audioType} generation not needed - skipping`);
      setVoiceoverGenerated(true);
    }
  }, [voiceoverEnabled, voiceoverGenerated, scenes.length, onGenerateVoiceover, allScenesHaveAudio, hasGeneratedVoiceover, shouldShowSoundEffects]);

  // Auto-export on mount (after voiceover is ready) - ONCE ONLY
  useEffect(() => {
    // Skip if already exported globally (parent state tracks this)
    if (hasExportedVideo) {
      return;
    }
    
    if (!isGeneratingVoiceover && 
        voiceoverGenerated && 
        !hasAttemptedExportLocal.current && 
        !exportedVideoUrl &&
        scenes.length > 0) {
      
      hasAttemptedExportLocal.current = true;
      handleAutoExport();
    }
  }, [isGeneratingVoiceover, voiceoverGenerated, exportedVideoUrl, scenes.length, hasExportedVideo]);

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
      const result = await onExport();
      
      clearInterval(progressInterval);
      setExportProgress(100);
      setExportSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
      
      if (result) {
        const { videoUrl, videoBaseUrl, voiceoverUrl, musicUrl } = result;
        
        // Save audio assets for volume control
        console.log('[ExportStep] Audio assets from export:', {
          videoBaseUrl: videoBaseUrl ? '✓' : '✗',
          voiceoverUrl: voiceoverUrl ? '✓' : '✗',
          musicUrl: musicUrl ? '✓' : '✗',
        });
        
        if (videoBaseUrl && musicUrl) {
          setAudioAssets({ videoBaseUrl, voiceoverUrl, musicUrl });
          console.log('[ExportStep] Audio assets saved for volume control');
        } else {
          console.log('[ExportStep] Missing audio assets, volume control disabled');
        }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME AUDIO SYNCHRONIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Initialize audio volumes when assets are loaded
  useEffect(() => {
    if (hasAudioAssets) {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.volume = localVoiceVolume / 100;
      }
      if (musicAudioRef.current) {
        musicAudioRef.current.volume = localMusicVolume / 100;
      }
    }
  }, [hasAudioAssets, localVoiceVolume, localMusicVolume]);

  // Handle video play - sync all audio
  const handleVideoPlay = useCallback(() => {
    if (!hasAudioAssets) return;
    
    const video = videoRef.current;
    const voiceAudio = voiceAudioRef.current;
    const musicAudio = musicAudioRef.current;
    
    if (video && voiceAudio && musicAudio) {
      // Sync times
      voiceAudio.currentTime = video.currentTime;
      musicAudio.currentTime = video.currentTime;
      
      // Play both audio elements
      voiceAudio.play().catch(console.error);
      musicAudio.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [hasAudioAssets]);

  // Handle video pause - pause all audio
  const handleVideoPause = useCallback(() => {
    if (!hasAudioAssets) return;
    
    const voiceAudio = voiceAudioRef.current;
    const musicAudio = musicAudioRef.current;
    
    if (voiceAudio) voiceAudio.pause();
    if (musicAudio) musicAudio.pause();
    setIsPlaying(false);
  }, [hasAudioAssets]);

  // Handle video seek - sync audio positions
  const handleVideoSeeked = useCallback(() => {
    if (!hasAudioAssets) return;
    
    const video = videoRef.current;
    const voiceAudio = voiceAudioRef.current;
    const musicAudio = musicAudioRef.current;
    
    if (video && voiceAudio && musicAudio) {
      voiceAudio.currentTime = video.currentTime;
      musicAudio.currentTime = video.currentTime;
    }
  }, [hasAudioAssets]);

  // Periodic sync to prevent drift
  useEffect(() => {
    if (!isPlaying || !hasAudioAssets) return;
    
    const syncInterval = setInterval(() => {
      const video = videoRef.current;
      const voiceAudio = voiceAudioRef.current;
      const musicAudio = musicAudioRef.current;
      
      if (video && voiceAudio && musicAudio) {
        const drift = Math.abs(video.currentTime - voiceAudio.currentTime);
        if (drift > 0.1) {
          voiceAudio.currentTime = video.currentTime;
          musicAudio.currentTime = video.currentTime;
        }
      }
    }, 500);
    
    return () => clearInterval(syncInterval);
  }, [isPlaying, hasAudioAssets]);

  // Handle volume change - REAL-TIME preview + update parent state
  const handleVoiceVolumeChange = useCallback((value: number) => {
    setLocalVoiceVolume(value);
    setVolumeChanged(true);
    
    // Apply immediately to audio element for preview
    if (voiceAudioRef.current) {
      voiceAudioRef.current.volume = value / 100;
    }
    
    // Update parent state for final export
    onVoiceVolumeChange(value);
  }, [onVoiceVolumeChange]);

  const handleMusicVolumeChange = useCallback((value: number) => {
    setLocalMusicVolume(value);
    setVolumeChanged(true);
    
    // Apply immediately to audio element for preview
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = value / 100;
    }
    
    // Update parent state for final export
    onMusicVolumeChange(value);
  }, [onMusicVolumeChange]);

  // Handle remix (re-export with new volumes)
  const handleRemix = useCallback(async () => {
    if (!audioAssets?.videoBaseUrl || !audioAssets?.voiceoverUrl || !audioAssets?.musicUrl) return;
    
    setIsRemixing(true);
    console.log('[ExportStep] Starting remix with volumes:', {
      voice: localVoiceVolume,
      music: localMusicVolume,
      videoBaseUrl: audioAssets.videoBaseUrl,
      voiceoverUrl: audioAssets.voiceoverUrl,
      musicUrl: audioAssets.musicUrl,
    });
    
    try {
      const newVideoUrl = await onRemix(
        audioAssets.videoBaseUrl,
        audioAssets.voiceoverUrl,
        audioAssets.musicUrl,
        localVoiceVolume,
        localMusicVolume
      );
      
      if (newVideoUrl) {
        setExportedVideoUrl(newVideoUrl);
        setVolumeChanged(false);
        console.log('[ExportStep] Remix complete:', newVideoUrl);
      }
    } catch (error) {
      console.error('[ExportStep] Remix failed:', error);
    } finally {
      setIsRemixing(false);
    }
  }, [audioAssets, localVoiceVolume, localMusicVolume, onRemix]);

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  // Toggle platform expansion (accordion behavior)
  const handlePlatformExpand = (platformId: string) => {
    setExpandedPlatform(prev => prev === platformId ? null : platformId);
    // Auto-select platform when expanded
    if (!selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(prev => [...prev, platformId]);
    }
  };

  // Handle platform connection via OAuth
  const connectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleConnect = useCallback(async (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform?.apiPlatform) return;

    setConnectingPlatform(platformId);
    
    const url = await getConnectUrl(platform.apiPlatform as LatePlatform);
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

  // Update platform metadata
  const handleMetadataChange = (platformId: string, field: keyof PlatformMetadata, value: string) => {
    setPlatformMetadata(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value,
      },
    }));
  };

  // Generate metadata for ALL selected platforms at once
  const handleGenerateAllMetadata = useCallback(async () => {
    if (!scriptText?.trim() || selectedPlatforms.length === 0) {
      console.warn('[ExportStep] No script text or no platforms selected');
      return;
    }

    // Filter only compatible platforms
    const compatiblePlatforms = selectedPlatforms.filter(id => {
      const platform = PLATFORMS.find(p => p.id === id);
      if (!platform) return false;
      return getPlatformCompatibility(platform, aspectRatio, duration).compatible;
    });

    if (compatiblePlatforms.length === 0) {
      console.warn('[ExportStep] No compatible platforms to generate for');
      return;
    }

    setIsGeneratingMetadata('all'); // Use 'all' to indicate generating for all
    
    try {
      console.log('[ExportStep] Generating metadata for all platforms:', compatiblePlatforms);
      
      // Generate metadata for each platform in parallel
      const promises = compatiblePlatforms.map(async (platformId) => {
        // Determine the API platform type (youtube-short/youtube-video -> youtube)
        const apiPlatform = platformId.startsWith('youtube') ? 'youtube' : platformId;
        
        const response = await fetch('/api/stories/social/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: apiPlatform,
            scriptText: scriptText.trim(),
            duration: totalDuration,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error for ${platformId}: ${response.status}`);
        }

        const data = await response.json();
        return { platformId, data };
      });

      const results = await Promise.allSettled(promises);
      
      // Update metadata for successful generations
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { platformId, data } = result.value;
          const isYouTube = platformId.startsWith('youtube');
          
          if (isYouTube) {
            setPlatformMetadata(prev => ({
              ...prev,
              [platformId]: {
                title: data.title || '',
                description: data.description || '',
              },
            }));
          } else {
            setPlatformMetadata(prev => ({
              ...prev,
              [platformId]: {
                caption: data.caption || '',
              },
            }));
          }
        } else {
          console.error('[ExportStep] Failed for platform:', result.reason);
        }
      });

      console.log('[ExportStep] Generated metadata for all platforms');
    } catch (error) {
      console.error('[ExportStep] Failed to generate metadata for all:', error);
    } finally {
      setIsGeneratingMetadata(null);
    }
  }, [scriptText, totalDuration, selectedPlatforms, aspectRatio, duration]);

  // Toggle platform selection for publishing
  const handlePlatformToggle = (platformId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent expanding when clicking checkbox
    }
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  // Check if platform metadata is valid (required fields filled)
  const isPlatformMetadataValid = useCallback((platformId: string): boolean => {
    const metadata = platformMetadata[platformId];
    if (!metadata) return false;
    
    // YouTube platforms require title and description
    if (platformId.startsWith('youtube')) {
      return Boolean(metadata.title?.trim() && metadata.description?.trim());
    } else {
      // Other platforms require caption
      return Boolean(metadata.caption?.trim());
    }
  }, [platformMetadata]);

  // Get platforms with missing metadata
  const platformsWithMissingMetadata = useMemo(() => {
    return selectedPlatforms.filter(id => !isPlatformMetadataValid(id));
  }, [selectedPlatforms, isPlatformMetadataValid]);

  // Check if all selected platforms have valid metadata
  const canPublish = selectedPlatforms.length > 0 && 
    platformsWithMissingMetadata.length === 0 && 
    exportedVideoUrl &&
    (scheduleMode === 'now' || (scheduleMode === 'scheduled' && scheduledDateTime));

  // Handle publish to selected platforms
  const handlePublishToSocial = useCallback(async () => {
    if (!canPublish) return;
    
    setIsPublishing(true);
    console.log('[ExportStep] Publishing to platforms:', selectedPlatforms);
    
    try {
      // Step 1: If audio assets exist, remix with current volume settings first
      let finalVideoUrl = exportedVideoUrl;
      
      if (audioAssets?.videoBaseUrl && audioAssets?.voiceoverUrl && audioAssets?.musicUrl) {
        console.log('[ExportStep] Remixing video with current volume settings before publish...');
        console.log('[ExportStep] Voice volume:', localVoiceVolume, 'Music volume:', localMusicVolume);
        
        const remixedUrl = await onRemix(
          audioAssets.videoBaseUrl,
          audioAssets.voiceoverUrl,
          audioAssets.musicUrl,
          localVoiceVolume,
          localMusicVolume
        );
        
        if (remixedUrl) {
          finalVideoUrl = remixedUrl;
          // Update local state with the new final.mp4 URL
          setExportedVideoUrl(remixedUrl);
          console.log('[ExportStep] Remix complete, updated final video to:', finalVideoUrl);
        }
      }
      
      // Step 2: Validate workspace
      if (!currentWorkspace?.id) {
        toast({
          title: 'Error',
          description: 'No workspace selected. Please select a workspace first.',
          variant: 'destructive',
        });
        return;
      }

      // Step 3: Build publish input
      // Map platform IDs to API platform names (youtube-short/youtube-video -> youtube)
      const getApiPlatform = (id: string): 'youtube' | 'tiktok' | 'instagram' | 'facebook' => {
        const platform = PLATFORMS.find(p => p.id === id);
        return (platform?.apiPlatform || id) as 'youtube' | 'tiktok' | 'instagram' | 'facebook';
      };

      // Get YouTube metadata from whichever YouTube platform is selected
      const youtubeMetadata = platformMetadata['youtube-short'] || platformMetadata['youtube-video'];
      const selectedYouTubePlatform = selectedPlatforms.find(id => id.startsWith('youtube'));

      const publishInput: PublishVideoInput = {
        videoUrl: finalVideoUrl,
        platforms: selectedPlatforms.map(id => ({
          platform: getApiPlatform(id),
        })),
        metadata: {
          youtube: selectedYouTubePlatform && platformMetadata[selectedYouTubePlatform] ? {
            title: platformMetadata[selectedYouTubePlatform].title || '',
            description: platformMetadata[selectedYouTubePlatform].description || '',
            tags: platformMetadata[selectedYouTubePlatform].hashtags,
          } : undefined,
          tiktok: platformMetadata.tiktok ? {
            caption: platformMetadata.tiktok.caption || '',
            hashtags: platformMetadata.tiktok.hashtags,
          } : undefined,
          instagram: platformMetadata.instagram ? {
            caption: platformMetadata.instagram.caption || '',
            hashtags: platformMetadata.instagram.hashtags,
          } : undefined,
          facebook: platformMetadata.facebook ? {
            caption: platformMetadata.facebook.caption || '',
            hashtags: platformMetadata.facebook.hashtags,
          } : undefined,
        },
        publishNow: scheduleMode === 'now',
        scheduledFor: scheduleMode === 'scheduled' && scheduledDateTime 
          ? new Date(scheduledDateTime).toISOString() 
          : undefined,
        // Storia metadata for calendar integration
        storiaStoryId: storyId,
        storiaContentType: 'story',
        storiaContentMode: template.id,
        storiaDuration: duration,
        storiaAspectRatio: aspectRatio,
      };

      console.log('[ExportStep] Publishing to Late.dev:', publishInput);

      // Step 4: Call Late.dev API
      const result = await lateApi.publishVideo(currentWorkspace.id, publishInput);

      console.log('[ExportStep] Publish result:', result);

      // Step 5: Show success message
      // Map API platform names back to display names
      const successPlatforms = result.platforms
        .filter(p => p.status === 'published' || p.status === 'pending')
        .map(p => {
          // Find the platform config (handle youtube mapping)
          const platformConfig = PLATFORMS.find(pl => 
            pl.apiPlatform === p.platform || pl.id === p.platform
          );
          return platformConfig?.name || p.platform;
        })
        .filter(Boolean);

      if (scheduleMode === 'scheduled' && scheduledDateTime) {
        const scheduledDate = new Date(scheduledDateTime);
        toast({
          title: 'Post Scheduled! 📅',
          description: `Your video will be published on ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });
      } else {
        toast({
          title: 'Publishing Started! 🎉',
          description: result.status === 'published' 
            ? `Video published to ${successPlatforms.join(', ')}!`
            : `Video is being published to ${successPlatforms.join(', ')}...`,
        });
      }

      // Show any failed platforms
      const failedPlatforms = result.platforms.filter(p => p.status === 'failed');
      if (failedPlatforms.length > 0) {
        toast({
          title: 'Some platforms failed',
          description: failedPlatforms.map(p => `${p.platform}: ${p.error}`).join('; '),
          variant: 'destructive',
        });
      }
      
      // Step 6: Update story record in database with published_platforms
      if (storyId) {
        try {
          // Build published platforms object
          const publishedPlatformsData: Record<string, any> = {};
          for (const platformResult of result.platforms) {
            if (platformResult.status === 'published' || platformResult.status === 'pending') {
              publishedPlatformsData[platformResult.platform] = {
                status: scheduleMode === 'scheduled' ? 'scheduled' : 'published',
                published_url: platformResult.publishedUrl,
                published_at: new Date().toISOString(),
                scheduled_for: scheduleMode === 'scheduled' && scheduledDateTime ? scheduledDateTime : undefined,
              };
            }
          }
          
          await apiRequest("PUT", `/api/stories/${storyId}/publish`, {
            publishedPlatforms: publishedPlatformsData,
          });
          console.log('[ExportStep] Story publish info updated in database');
        } catch (dbError) {
          console.warn('[ExportStep] Failed to update story in database:', dbError);
          // Don't fail the whole operation if DB update fails
        }
      }
      
    } catch (error) {
      console.error('[ExportStep] Publishing failed:', error);
      toast({
        title: 'Publishing Failed',
        description: error instanceof Error ? error.message : 'An error occurred while publishing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }, [canPublish, selectedPlatforms, exportedVideoUrl, audioAssets, localVoiceVolume, localMusicVolume, onRemix, platformMetadata, currentWorkspace, toast, scheduleMode, scheduledDateTime, storyId]);

  return (
    <div className="flex w-full h-[calc(100vh-12rem)] gap-0 overflow-hidden">
      {/* Left Column - Export Settings (Scrollable with modern sidebar style) */}
      <div className={cn(
        "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
        "bg-card/80 dark:bg-black/40 backdrop-blur-xl",
        "border-r border-[#e5e7eb] dark:border-border",
        "flex flex-col overflow-hidden"
      )}>
        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6 pb-12">
            {/* Voiceover/Sound Effects Generation Status - Styled like other sections */}
            {(voiceoverEnabled || shouldShowSoundEffects) && (
              <GlassPanel>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      shouldShowSoundEffects 
                        ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                        : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                    )}>
                      {shouldShowSoundEffects ? (
                        <Music className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Mic className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {shouldShowSoundEffects ? "Sound Effects" : "Voiceover"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {shouldShowSoundEffects ? "AI-generated sound effects" : "AI-generated narration"}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    {isGeneratingVoiceover ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                        <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                        <span className="text-xs font-medium text-orange-300">Generating...</span>
                      </div>
                    ) : voiceoverGenerated || allScenesHaveAudio ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-medium text-green-300">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 dark:bg-white/10 border border-[#e5e7eb] dark:border-border">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Pending</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar - Only when generating */}
                  {isGeneratingVoiceover && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <div className="h-2 bg-muted/50 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: scenes.length * 5, ease: "linear" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Creating audio for {scenes.length} scene{scenes.length > 1 ? 's' : ''}...
                      </p>
                    </motion.div>
                  )}
           {/* Info ext */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 dark:bg-white/[0.03]">
                    <Volume2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {isGeneratingVoiceover 
                        ? "Please wait, do not navigate away..."
                        : voiceoverGenerated || allScenesHaveAudio
                          ? "Voiceover ready for all scenes"
                          : "Voiceover will be generated automatically"
                      }
                    </p>
                  </div>
                </div>
              </GlassPanel>
            )}

        {/* Video Summary */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Video Summary</h3>
                <p className="text-xs text-muted-foreground">Ready to export</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                      {/* Scenes Count */}
              <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-[#e5e7eb] dark:border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Scenes</span>
                </div>
                <p className="text-lg font-semibold">{scenes.length}</p>
              </div>
                      
                      {/* Duration */}
              <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-[#e5e7eb] dark:border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Duration</span>
                </div>
                <p className="text-lg font-semibold">{totalDuration}s</p>
              </div>
                      
                      {/* Image Model */}
              <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-[#e5e7eb] dark:border-border">
                <div className="flex items-center gap-2 mb-1">
                          <Image className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Image Model</span>
                </div>
                        <p className="text-sm font-semibold truncate" title={imageModel}>
                          {imageModel || 'Default'}
                        </p>
              </div>
                      
                      {/* Voice Over Status */}
              <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-[#e5e7eb] dark:border-border">
                <div className="flex items-center gap-2 mb-1">
                          <Mic className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Voice Over</span>
                </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            voiceoverEnabled ? "bg-green-400" : "bg-muted-foreground/30"
                          )} />
                          <p className={cn(
                            "text-sm font-semibold",
                            voiceoverEnabled ? "text-green-400" : "text-muted-foreground"
                          )}>
                            {voiceoverEnabled ? 'ON' : 'OFF'}
                          </p>
                        </div>
              </div>
            </div>
          </div>
        </GlassPanel>

                {/* Export Info - Fixed settings */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-foreground">Export Settings</h3>
            </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Quality */}
                      <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-[#e5e7eb] dark:border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Monitor className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Quality</span>
                  </div>
                        <p className="text-sm font-semibold text-foreground">1080p Full HD</p>
                  </div>
                      
                      {/* Format */}
                      <div className="p-3 rounded-xl bg-muted/50 dark:bg-white/5 border border-[#e5e7eb] dark:border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Film className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Format</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">MP4</p>
                      </div>
            </div>
          </div>
        </GlassPanel>

                {/* Share to Platforms - Accordion Style */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-foreground">Share To</h3>
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                      
                      {/* AI Generate All Button - Only for selected platforms */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleGenerateAllMetadata}
                        disabled={selectedPlatforms.length === 0 || isGeneratingMetadata !== null}
                    className={cn(
                          "ml-auto h-7 px-3 text-xs gap-1.5",
                          "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
                          "hover:from-purple-500/30 hover:to-pink-500/30",
                          "border border-purple-500/30 text-purple-300",
                          "transition-all duration-200",
                          "disabled:opacity-40 disabled:cursor-not-allowed"
                        )}
                      >
                        {isGeneratingMetadata ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3" />
                        )}
                        AI Generate
                      </Button>
                      
                      {selectedPlatforms.length > 0 && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                          {selectedPlatforms.length} selected
                        </span>
                      )}
            </div>

                    {/* Platform Accordion List */}
                    <div className="space-y-2">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                        const isExpanded = expandedPlatform === platform.id;
                const isSelected = selectedPlatforms.includes(platform.id);
                        const metadata = platformMetadata[platform.id];
                        
                        // Check platform compatibility with current video settings
                        const compatibility = getPlatformCompatibility(platform, aspectRatio, duration);
                        const platformConnected = platform.apiPlatform ? isConnected(platform.apiPlatform as LatePlatform) : false;
                        const isDisabled = !compatibility.compatible || !platformConnected;

                return (
                          <div key={platform.id} className={cn(
                            "overflow-hidden rounded-xl border transition-all duration-200",
                            isDisabled
                              ? "border-[#e5e7eb] dark:border-border opacity-60"
                              : isSelected 
                                ? "border-purple-500/40 bg-purple-500/5" 
                                : "border-[#e5e7eb] dark:border-border hover:border-purple-500/40"
                          )}>
                            {/* Platform Header Row */}
                            <div className={cn(
                              "w-full p-3 flex items-center gap-3",
                              "transition-all duration-200",
                              isDisabled
                                ? "bg-muted/30 dark:bg-white/[0.01] cursor-not-allowed"
                                : isExpanded
                                  ? "bg-muted dark:bg-white/10"
                                  : "bg-muted/50 dark:bg-white/[0.03]"
                            )}>
                              {/* Checkbox or Lock Icon */}
                              {platformConnected ? (
                                <button
                                  onClick={(e) => !isDisabled && handlePlatformToggle(platform.id, e)}
                                  disabled={isDisabled}
                    className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                    isDisabled
                                      ? "border-[#e5e7eb] dark:border-border cursor-not-allowed"
                                      : isSelected
                                        ? "bg-purple-500 border-purple-500"
                                        : "border-[#e5e7eb] dark:border-border hover:border-purple-500"
                                  )}
                                >
                                  {isSelected && !isDisabled && <Check className="w-3 h-3 text-white" />}
                                </button>
                              ) : (
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}

                              {/* Platform Icon */}
                    <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                isDisabled ? "opacity-50" : "",
                                platform.iconBg
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                              
                              {/* Platform Name and Status */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-sm font-medium",
                                    isDisabled ? "text-muted-foreground" : "text-foreground"
                                  )}>
                                    {platform.name}
                                  </span>
                                  
                                  {/* Connection Status Badge */}
                                  {!platformConnected && compatibility.compatible && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      Not Connected
                                    </span>
                                  )}
            </div>
                                {/* Show incompatibility reason */}
                                {!compatibility.compatible && compatibility.reason && (
                                  <p className="text-[10px] text-red-400/70 mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {compatibility.reason}
                                  </p>
                                )}
      </div>

                              {/* Connect Button for unconnected platforms */}
                              {!platformConnected && compatibility.compatible && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConnect(platform.id);
                                  }}
                                  disabled={connectingPlatform === platform.id}
                                  className={cn(
                                    "h-7 px-3 text-xs gap-1.5",
                                    "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
                                    "hover:from-purple-500/20 hover:to-pink-500/20",
                                    "border-purple-500/30 text-purple-300",
                                    "transition-all duration-200",
                                    "disabled:opacity-70"
                                  )}
                                >
                                  {connectingPlatform === platform.id ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <Link2 className="w-3 h-3" />
                                      Connect
                                    </>
                                  )}
                                </Button>
                              )}
                              
                              {/* Expand Arrow - only show if connected and compatible */}
                              {platformConnected && compatibility.compatible && (
                                <button
                                  onClick={() => handlePlatformExpand(platform.id)}
                                  className="p-1 hover:bg-muted/50 dark:hover:bg-white/10 rounded transition-colors"
                                >
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  </motion.div>
                                </button>
                              )}
                            </div>

                            {/* Expanded Content - Only show for compatible platforms */}
                            <AnimatePresence>
                              {isExpanded && !isDisabled && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-3 space-y-3 bg-muted/30 dark:bg-white/[0.02] border-t border-[#e5e7eb] dark:border-border">
                                    {/* YouTube Shorts/Video: Title + Description */}
                                    {platform.id.startsWith('youtube') && (
                                      <>
                                        <div className="space-y-2">
                                          <Input
                                            value={metadata?.title || ''}
                                            onChange={(e) => handleMetadataChange(platform.id, 'title', e.target.value)}
                                            placeholder="Video title"
                                            className={cn(
                                              "bg-muted/50 dark:bg-black/40 border-[#e5e7eb] dark:border-border text-foreground text-sm",
                                              "placeholder:text-muted-foreground/50 dark:placeholder:text-white/30",
                                              "focus:border-primary focus:ring-0"
                                            )}
                                          />
              </div>
                                        <div className="space-y-2">
                                          <Textarea
                                            value={metadata?.description || ''}
                                            onChange={(e) => handleMetadataChange(platform.id, 'description', e.target.value)}
                                            placeholder="Description"
                                            rows={3}
                                            className={cn(
                                              "bg-muted/50 dark:bg-black/40 border-[#e5e7eb] dark:border-border text-foreground text-sm resize-none",
                                              "placeholder:text-muted-foreground/50 dark:placeholder:text-white/30",
                                              "focus:border-primary focus:ring-0"
                                            )}
                                          />
                                        </div>
                                      </>
                                    )}

                                    {/* TikTok, Instagram, Facebook: Caption only */}
                                    {!platform.id.startsWith('youtube') && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">Social Caption</span>
                                        </div>
                                        <Textarea
                                          value={metadata?.caption || ''}
                                          onChange={(e) => handleMetadataChange(platform.id, 'caption', e.target.value)}
                                          placeholder="Write a caption..."
                                          rows={3}
                    className={cn(
                                            "bg-muted/50 dark:bg-black/40 border-[#e5e7eb] dark:border-border text-foreground text-sm resize-none",
                                            "placeholder:text-muted-foreground/50 dark:placeholder:text-white/30",
                                            "focus:border-primary focus:ring-0"
                                          )}
                                        />
              </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
            </div>

                    {/* Schedule Options */}
                    <AnimatePresence>
                      {selectedPlatforms.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Publish Mode Toggle */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setScheduleMode('now')}
              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
                                "border transition-all duration-200",
                                scheduleMode === 'now'
                                  ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 text-white"
                                  : "bg-muted/50 dark:bg-white/5 border-[#e5e7eb] dark:border-border text-muted-foreground hover:bg-muted dark:hover:bg-white/10 hover:text-foreground"
                              )}
                            >
                              <Zap className="w-4 h-4" />
                              <span className="text-sm font-medium">Publish Now</span>
                            </button>
                            <button
                              onClick={() => setScheduleMode('scheduled')}
                className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl",
                                "border transition-all duration-200",
                                scheduleMode === 'scheduled'
                                  ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-blue-500/50 text-white"
                                  : "bg-muted/50 dark:bg-white/5 border-[#e5e7eb] dark:border-border text-muted-foreground hover:bg-muted dark:hover:bg-white/10 hover:text-foreground"
                              )}
                            >
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-medium">Schedule</span>
                            </button>
                          </div>

                          {/* Date/Time Picker - Only when scheduled */}
                          <AnimatePresence>
                            {scheduleMode === 'scheduled' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                                  <div className="flex items-center gap-2 text-blue-300">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-medium">Select Date & Time</span>
                                  </div>
                                  <input
                                    type="datetime-local"
                                    value={scheduledDateTime}
                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className={cn(
                                      "w-full px-4 py-3 rounded-xl",
                                      "bg-muted/50 dark:bg-white/10 border border-[#e5e7eb] dark:border-border",
                                      "text-foreground placeholder:text-muted-foreground/50 dark:placeholder:text-white/40",
                                      "focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50",
                                      "transition-all duration-200",
                                      "[color-scheme:dark]"
                                    )}
                                  />
                                  {scheduledDateTime && (
                                    <p className="text-xs text-blue-300/70 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Scheduled for {new Date(scheduledDateTime).toLocaleDateString()} at {new Date(scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Publish Button */}
                    <AnimatePresence>
                      {selectedPlatforms.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3"
                        >
                          {/* Warning for missing metadata */}
                          {platformsWithMissingMetadata.length > 0 && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                              <p className="text-xs text-orange-300 flex items-center gap-2">
                                <span className="text-base">⚠️</span>
                                <span>
                                  Fill in metadata for: {platformsWithMissingMetadata.map(id => 
                                    PLATFORMS.find(p => p.id === id)?.name
                                  ).join(', ')}
              </span>
                              </p>
            </div>
                          )}

                          {/* Warning for missing schedule date */}
                          {scheduleMode === 'scheduled' && !scheduledDateTime && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                              <p className="text-xs text-blue-300 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Please select a date and time to schedule</span>
                              </p>
          </div>
                          )}

                <Button
                            onClick={handlePublishToSocial}
                            disabled={!canPublish || isPublishing}
                            className={cn(
                              "w-full h-12 text-sm font-semibold",
                              scheduleMode === 'scheduled'
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25",
                              "border-0 shadow-lg",
                              "transition-all duration-300",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            {isPublishing ? (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                {scheduleMode === 'scheduled' ? 'Scheduling...' : 'Publishing...'}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {scheduleMode === 'scheduled' ? (
                                  <>
                                    <Calendar className="w-4 h-4" />
                                    Schedule for {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                                    <Send className="w-4 h-4" />
                                    Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                    </>
                  )}
              </div>
                            )}
                          </Button>
                          
                          {/* Selected platforms preview with validation status */}
                          <div className="flex items-center justify-center gap-2">
                            {selectedPlatforms.map(platformId => {
                              const platform = PLATFORMS.find(p => p.id === platformId);
                              if (!platform) return null;
                              const Icon = platform.icon;
                              const isValid = isPlatformMetadataValid(platformId);
                              return (
                                <div
                                  key={platformId}
                                  className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center relative",
                                    platform.iconBg
                                  )}
                                  title={`${platform.name}${isValid ? ' ✓' : ' - Missing metadata'}`}
                                >
                                  <Icon className="w-3.5 h-3.5 text-white" />
                                  {!isValid && (
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center border border-black/50">
                                      <span className="text-[8px] text-white font-bold">!</span>
                                    </div>
                                  )}
                                  {isValid && (
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center border border-black/50">
                                      <Check className="w-2 h-2 text-white" />
            </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
          </div>
        </GlassPanel>
          </div>
        </ScrollArea>
      </div>

      {/* Right Column - Video Preview */}
      <div className="flex-1 relative flex flex-col overflow-hidden h-full">
        <GlassPanel className="h-full flex flex-col m-6 ml-0">
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Exporting Video...
                  </h3>
                  <p className="text-muted-foreground">
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
                        <Clock className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        step.status === 'complete' && "text-foreground/80",
                        step.status === 'active' && "text-foreground font-medium",
                        step.status === 'pending' && "text-muted-foreground"
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
                    <span className="text-muted-foreground">
                      {exportProgress}% complete
                    </span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-muted-foreground/80"
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
            <div className="flex-1 flex flex-col overflow-auto">
              {/* Success Header - Preview Ready */}
              <div className="flex items-center gap-3 p-4 border-b border-[#e5e7eb] dark:border-border shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    Preview Ready
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust settings below, then click "Export Video" to download
                      </p>
                    </div>
                {/* Regenerate Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    hasAttemptedExportLocal.current = false;
                    setExportedVideoUrl(null);
                    setAudioAssets(null);
                    handleAutoExport();
                  }}
                  disabled={isExporting}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
                  </div>
                  
              {/* Video Player - Fill available space with aspect-ratio aware sizing */}
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                {/* When we have separate audio assets, use muted video + audio elements */}
                {hasAudioAssets ? (
                  <>
                    <video
                      ref={videoRef}
                      src={audioAssets.videoBaseUrl}
                      controls
                      autoPlay
                      muted
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      onSeeked={handleVideoSeeked}
                      onEnded={handleVideoPause}
                      className={cn(
                        "rounded-xl shadow-2xl",
                        // Portrait videos (9:16): limit height, auto width
                        aspectRatio === '9:16' && "max-h-full w-auto",
                        // Landscape videos (16:9): limit width, auto height
                        aspectRatio === '16:9' && "max-w-full h-auto",
                        // Square or other ratios: fit within container
                        !['9:16', '16:9'].includes(aspectRatio) && "max-w-full max-h-full"
                      )}
                    />
                    {/* Hidden audio elements for voiceover and music */}
                    <audio
                      ref={voiceAudioRef}
                      src={audioAssets.voiceoverUrl}
                      preload="auto"
                    />
                    <audio
                      ref={musicAudioRef}
                      src={audioAssets.musicUrl}
                      preload="auto"
                      loop
                    />
                  </>
                ) : (
                  /* Fallback: regular video with built-in audio */
                  <video
                    ref={videoRef}
                    src={exportedVideoUrl}
                    controls
                    autoPlay
                className={cn(
                      "rounded-xl shadow-2xl",
                      // Portrait videos (9:16): limit height, auto width
                      aspectRatio === '9:16' && "max-h-full w-auto",
                      // Landscape videos (16:9): limit width, auto height
                      aspectRatio === '16:9' && "max-w-full h-auto",
                      // Square or other ratios: fit within container
                      !['9:16', '16:9'].includes(aspectRatio) && "max-w-full max-h-full"
                    )}
                  />
                )}
              </div>

              {/* Volume Controls - Only when both voiceover AND music */}
              {showVolumeControls && (
                <div className="px-4 py-3 border-t border-[#e5e7eb] dark:border-border space-y-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Audio Mix
                    </h4>
                    {volumeChanged && (
                      <span className="text-xs text-orange-400">Changes pending</span>
                    )}
                  </div>
                  
                  {/* Voice Volume Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" />
                        Voice
                      </label>
                      <span className="text-xs text-muted-foreground font-mono">{localVoiceVolume}%</span>
                    </div>
                    <Slider
                      value={[localVoiceVolume]}
                      onValueChange={([value]) => handleVoiceVolumeChange(value)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Music Volume Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5" />
                        Music
                      </label>
                      <span className="text-xs text-muted-foreground font-mono">{localMusicVolume}%</span>
                    </div>
                    <Slider
                      value={[localMusicVolume]}
                      onValueChange={([value]) => handleMusicVolumeChange(value)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  </div>
              )}
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
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Preparing Export
                  </h3>
                  <p className="text-sm text-muted-foreground">
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

