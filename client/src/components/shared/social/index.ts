/**
 * Shared Social Media Components
 * ═══════════════════════════════════════════════════════════════════════════
 * Reusable social media publishing components for all story modes
 */

// Main component
export { SocialPublisher } from './SocialPublisher';

// Sub-components
export { PlatformCard } from './PlatformCard';

// Hooks
export { useSocialAccounts } from './hooks/useSocialAccounts';

// Types
export type {
  SocialPublisherProps,
  PlatformCardProps,
  PlatformConfig,
  PlatformCompatibility,
  PlatformMetadata,
  MetadataByPlatform,
  PublishMode,
  PublishState,
  UseSocialAccountsResult,
} from './types';

