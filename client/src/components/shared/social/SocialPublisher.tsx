/**
 * SocialPublisher Component
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared component for publishing videos to social media platforms
 * Used across all story modes (Problem-Solution, ASMR, etc.)
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/workspace-context';
import { 
  Share2, 
  Sparkles, 
  RefreshCw, 
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from 'react-icons/si';
import { lateApi, type LatePlatform, type PublishVideoInput } from '@/lib/api/late';
import { useSocialAccounts } from './hooks/useSocialAccounts';
import { PlatformCard } from './PlatformCard';
import type { 
  SocialPublisherProps, 
  PlatformConfig, 
  PlatformMetadata,
  MetadataByPlatform,
  PublishMode 
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS: PlatformConfig[] = [
  { 
    id: 'youtube-short', 
    name: 'YouTube Shorts', 
    icon: SiYoutube, 
    gradient: 'from-red-600 to-red-700',
    iconBg: 'bg-red-600',
    fields: ['title', 'description'] as const,
    requirements: {
      aspectRatios: ['9:16'],
      maxDuration: 180,
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
      aspectRatios: ['16:9', '4:5', '1:1'],
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
      aspectRatios: ['9:16'],
      maxDuration: 180,
    },
    apiPlatform: 'tiktok',
  },
  { 
    id: 'instagram', 
    name: 'Instagram Reels', 
    icon: SiInstagram, 
    gradient: 'from-purple-600 via-pink-500 to-orange-400',
    iconBg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    fields: ['caption'] as const,
    requirements: {
      aspectRatios: ['9:16', '4:5', '1:1'],
      maxDuration: 90,
    },
    apiPlatform: 'instagram',
  },
  { 
    id: 'facebook', 
    name: 'Facebook Reels', 
    icon: SiFacebook, 
    gradient: 'from-blue-600 to-blue-700',
    iconBg: 'bg-blue-600',
    fields: ['caption'] as const,
    requirements: {
      aspectRatios: ['9:16', '16:9', '4:5', '1:1'],
      maxDuration: 90,
    },
    apiPlatform: 'facebook',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getPlatformCompatibility(
  platform: PlatformConfig, 
  aspectRatio: string, 
  duration: number
): { compatible: boolean; reason?: string } {
  if (!platform.requirements) {
    return { compatible: true };
  }

  const { aspectRatios, maxDuration } = platform.requirements;

  if (aspectRatios && !aspectRatios.includes(aspectRatio)) {
    const required = aspectRatios.join(' or ');
    return { compatible: false, reason: `Requires ${required} aspect ratio` };
  }

  if (maxDuration && duration > maxDuration) {
    const maxMinutes = Math.floor(maxDuration / 60);
    const maxSeconds = maxDuration % 60;
    const maxStr = maxSeconds > 0 ? `${maxMinutes}m ${maxSeconds}s` : `${maxMinutes} min`;
    return { compatible: false, reason: `Max duration: ${maxStr}` };
  }

  return { compatible: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function SocialPublisher({
  videoUrl,
  scriptText,
  aspectRatio,
  duration,
  accentColor = 'purple',
  onPublishStart,
  onPublishComplete,
  onPublishError,
  className,
}: SocialPublisherProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { accounts, isLoading: isLoadingAccounts, isConnected, getConnectUrl, refetch } = useSocialAccounts();

  // State
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [platformMetadata, setPlatformMetadata] = useState<MetadataByPlatform>({});
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  // Computed values
  const selectedCount = selectedPlatforms.length;
  const connectedPlatforms = useMemo(() => 
    PLATFORMS.filter(p => isConnected(p.apiPlatform)),
    [accounts, isConnected]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handlePlatformSelect = useCallback((platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  }, []);

  const handlePlatformExpand = useCallback((platformId: string) => {
    setExpandedPlatform(prev => prev === platformId ? null : platformId);
  }, []);

  const handleConnect = useCallback(async (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;

    const url = await getConnectUrl(platform.apiPlatform);
    if (url) {
      // Open in new tab
      window.open(url, '_blank', 'width=600,height=700');
      
      // Show toast with instructions
      toast({
        title: "Connecting...",
        description: "Complete the authentication in the new window, then return here.",
      });

      // Poll for connection (user might return after OAuth)
      const checkInterval = setInterval(async () => {
        await refetch();
      }, 3000);

      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(checkInterval), 120000);
    } else {
      toast({
        title: "Connection failed",
        description: "Could not open connection page. Please try again.",
        variant: "destructive",
      });
    }
  }, [getConnectUrl, refetch, toast]);

  const handleMetadataChange = useCallback((platformId: string, field: string, value: string) => {
    setPlatformMetadata(prev => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value,
      },
    }));
  }, []);

  const handleGenerateMetadata = useCallback(async (platformId: string) => {
    if (!scriptText?.trim()) {
      toast({
        title: "No content",
        description: "Script text is required for AI generation",
        variant: "destructive",
      });
      return;
    }

    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;

    setIsGeneratingMetadata(platformId);

    try {
      const response = await fetch('/api/stories/social/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.apiPlatform,
          scriptText: scriptText.trim(),
          duration,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate metadata');

      const data = await response.json();

      setPlatformMetadata(prev => ({
        ...prev,
        [platformId]: {
          title: data.title,
          description: data.description,
          caption: data.caption,
          hashtags: data.hashtags,
        },
      }));

      toast({
        title: "Metadata generated",
        description: `AI-generated content for ${platform.name}`,
      });
    } catch (error) {
      console.error('[SocialPublisher] Generate metadata error:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate metadata. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMetadata(null);
    }
  }, [scriptText, duration, toast]);

  const handleGenerateAllMetadata = useCallback(async () => {
    if (!scriptText?.trim() || selectedPlatforms.length === 0) return;

    setIsGeneratingMetadata('all');

    try {
      const promises = selectedPlatforms.map(async (platformId) => {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) return;

        const response = await fetch('/api/stories/social/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platform.apiPlatform,
            scriptText: scriptText.trim(),
            duration,
          }),
        });

        if (!response.ok) throw new Error(`Failed for ${platform.name}`);

        const data = await response.json();
        return { platformId, data };
      });

      const results = await Promise.allSettled(promises);

      const newMetadata = { ...platformMetadata };
      let successCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { platformId, data } = result.value;
          newMetadata[platformId] = {
            title: data.title,
            description: data.description,
            caption: data.caption,
            hashtags: data.hashtags,
          };
          successCount++;
        }
      });

      setPlatformMetadata(newMetadata);

      toast({
        title: "Metadata generated",
        description: `Generated for ${successCount} platform(s)`,
      });
    } catch (error) {
      console.error('[SocialPublisher] Generate all metadata error:', error);
      toast({
        title: "Generation failed",
        description: "Some platforms failed to generate",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingMetadata(null);
    }
  }, [scriptText, selectedPlatforms, duration, platformMetadata, toast]);

  const handlePublish = useCallback(async () => {
    if (!currentWorkspace?.id || !videoUrl || selectedPlatforms.length === 0) {
      toast({
        title: "Cannot publish",
        description: "Please select platforms and ensure video is ready",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    onPublishStart?.();

    try {
      // Build publish input
      const input: PublishVideoInput = {
        videoUrl,
        platforms: selectedPlatforms.map(id => {
          const platform = PLATFORMS.find(p => p.id === id);
          return { platform: platform?.apiPlatform || id as LatePlatform };
        }),
        metadata: {},
        publishNow: publishMode === 'now',
      };

      // Add metadata for each platform
      selectedPlatforms.forEach(platformId => {
        const platform = PLATFORMS.find(p => p.id === platformId);
        const meta = platformMetadata[platformId];
        
        if (platform && meta) {
          if (platform.apiPlatform === 'youtube') {
            input.metadata.youtube = {
              title: meta.title || 'Untitled',
              description: meta.description || '',
              tags: meta.hashtags,
            };
          } else if (platform.apiPlatform === 'tiktok') {
            input.metadata.tiktok = {
              caption: meta.caption || '',
              hashtags: meta.hashtags,
            };
          } else if (platform.apiPlatform === 'instagram') {
            input.metadata.instagram = {
              caption: meta.caption || '',
              hashtags: meta.hashtags,
            };
          } else if (platform.apiPlatform === 'facebook') {
            input.metadata.facebook = {
              caption: meta.caption || '',
              hashtags: meta.hashtags,
            };
          }
        }
      });

      console.log('[SocialPublisher] Publishing:', input);

      const result = await lateApi.publishVideo(currentWorkspace.id, input);
      setPublishResult(result);

      toast({
        title: "Published successfully!",
        description: `Video sent to ${selectedPlatforms.length} platform(s)`,
      });

      onPublishComplete?.(result);
    } catch (error) {
      console.error('[SocialPublisher] Publish error:', error);
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      onPublishError?.(error instanceof Error ? error : new Error('Publish failed'));
    } finally {
      setIsPublishing(false);
    }
  }, [
    currentWorkspace?.id, 
    videoUrl, 
    selectedPlatforms, 
    platformMetadata, 
    publishMode,
    onPublishStart,
    onPublishComplete,
    onPublishError,
    toast
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-white">Share To</h3>
        <span className="text-xs text-white/40">(Optional)</span>
        
        {/* Selected count badge */}
        {selectedCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {selectedCount} selected
          </span>
        )}
        
        {/* AI Generate All Button */}
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
            "disabled:opacity-40"
          )}
        >
          {isGeneratingMetadata === 'all' ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          AI Generate
        </Button>
      </div>

      {/* Loading State */}
      {isLoadingAccounts && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          <span className="ml-2 text-sm text-white/40">Loading connections...</span>
        </div>
      )}

      {/* Platform Cards */}
      {!isLoadingAccounts && (
        <div className="space-y-2">
          {PLATFORMS.map(platform => {
            const compatibility = getPlatformCompatibility(platform, aspectRatio, duration);
            const connected = isConnected(platform.apiPlatform);
            
            return (
              <PlatformCard
                key={platform.id}
                platform={platform}
                isSelected={selectedPlatforms.includes(platform.id)}
                isConnected={connected}
                isCompatible={compatibility.compatible}
                compatibilityReason={compatibility.reason}
                isExpanded={expandedPlatform === platform.id}
                metadata={platformMetadata[platform.id]}
                isGeneratingMetadata={isGeneratingMetadata === platform.id || isGeneratingMetadata === 'all'}
                onSelect={() => handlePlatformSelect(platform.id)}
                onExpand={() => handlePlatformExpand(platform.id)}
                onConnect={() => handleConnect(platform.id)}
                onMetadataChange={(field, value) => handleMetadataChange(platform.id, field, value)}
                onGenerateMetadata={() => handleGenerateMetadata(platform.id)}
              />
            );
          })}
        </div>
      )}

      {/* Publish Section */}
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-4 border-t border-white/10"
        >
          {/* Publish Mode Toggle */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={publishMode === 'now' ? 'default' : 'outline'}
              onClick={() => setPublishMode('now')}
              className={cn(
                "flex-1 gap-2",
                publishMode === 'now' 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                  : "border-white/20"
              )}
            >
              <Send className="w-4 h-4" />
              Publish Now
            </Button>
            <Button
              size="sm"
              variant={publishMode === 'schedule' ? 'default' : 'outline'}
              onClick={() => setPublishMode('schedule')}
              disabled // TODO: Implement scheduling
              className={cn(
                "flex-1 gap-2",
                publishMode === 'schedule' 
                  ? "bg-gradient-to-r from-purple-600 to-pink-600" 
                  : "border-white/20"
              )}
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          </div>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !videoUrl}
            className={cn(
              "w-full h-12 text-base font-semibold gap-2",
              "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500",
              "hover:from-purple-500 hover:via-pink-500 hover:to-orange-400",
              "disabled:opacity-50"
            )}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : publishResult ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Published!
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Publish to {selectedCount} Platform{selectedCount > 1 ? 's' : ''}
              </>
            )}
          </Button>

          {/* Connected platforms indicator */}
          <div className="flex items-center justify-center gap-2">
            {selectedPlatforms.map(platformId => {
              const platform = PLATFORMS.find(p => p.id === platformId);
              if (!platform) return null;
              const Icon = platform.icon;
              const connected = isConnected(platform.apiPlatform);
              
              return (
                <div
                  key={platformId}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    platform.iconBg,
                    !connected && "opacity-50"
                  )}
                >
                  <Icon className="w-3 h-3 text-white" />
                  {connected && (
                    <CheckCircle2 className="w-3 h-3 text-green-400 absolute -bottom-1 -right-1" />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

