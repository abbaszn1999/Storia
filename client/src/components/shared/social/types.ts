/**
 * Social Publisher Types
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared types for social media publishing across all story modes
 */

import type { LateAccount, LatePlatform, PublishVideoResult } from '@/lib/api/late';

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformConfig {
  id: string;                    // Unique ID (e.g., 'youtube-short', 'tiktok')
  name: string;                  // Display name
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;              // Tailwind gradient classes
  iconBg: string;                // Icon background color
  fields: readonly ('title' | 'description' | 'caption')[];
  requirements?: {
    aspectRatios?: string[];     // Supported aspect ratios
    maxDuration?: number;        // Max duration in seconds
  };
  apiPlatform: LatePlatform;     // API platform name
}

export interface PlatformCompatibility {
  compatible: boolean;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformMetadata {
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
}

export type MetadataByPlatform = Record<string, PlatformMetadata>;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISHING
// ─────────────────────────────────────────────────────────────────────────────

export type PublishMode = 'now' | 'schedule';

export interface PublishState {
  isPublishing: boolean;
  publishProgress: number;
  publishResult: PublishVideoResult | null;
  publishError: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────────────────────────────────

export interface SocialPublisherProps {
  /** Video URL to publish (from BunnyCDN) */
  videoUrl: string;
  
  /** Script/narration text for AI metadata generation */
  scriptText: string;
  
  /** Current video aspect ratio for compatibility check */
  aspectRatio: string;
  
  /** Video duration in seconds */
  duration: number;
  
  /** Accent color for styling */
  accentColor?: string;
  
  /** Callback when publishing starts */
  onPublishStart?: () => void;
  
  /** Callback when publishing completes */
  onPublishComplete?: (result: PublishVideoResult) => void;
  
  /** Callback when publishing fails */
  onPublishError?: (error: Error) => void;
  
  /** Custom className */
  className?: string;
}

export interface PlatformCardProps {
  platform: PlatformConfig;
  isSelected: boolean;
  isConnected: boolean;
  isCompatible: boolean;
  compatibilityReason?: string;
  isExpanded: boolean;
  metadata: PlatformMetadata | undefined;
  isGeneratingMetadata: boolean;
  onSelect: () => void;
  onExpand: () => void;
  onConnect: () => void;
  onMetadataChange: (field: string, value: string) => void;
  onGenerateMetadata: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export interface UseSocialAccountsResult {
  accounts: LateAccount[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isConnected: (platform: LatePlatform) => boolean;
  getConnectUrl: (platform: LatePlatform) => Promise<string | null>;
}

