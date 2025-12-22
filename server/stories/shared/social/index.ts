/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARED SOCIAL MEDIA MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Unified social media functionality for all story modes.
 * 
 * Features:
 * - AI metadata generation (YouTube, TikTok, Instagram, Facebook)
 * - Platform-specific prompts
 * - Shared routes
 */

// Types
export * from './types';

// Agents
export { 
  generateSocialMetadata, 
  generateSocialMetadataForPlatforms 
} from './agents/metadata-generator';

// Prompts
export {
  getSystemPromptForPlatform,
  buildSocialMetadataUserPrompt,
  YOUTUBE_SYSTEM_PROMPT,
  TIKTOK_SYSTEM_PROMPT,
  INSTAGRAM_SYSTEM_PROMPT,
  FACEBOOK_SYSTEM_PROMPT,
} from './prompts/metadata-prompts';

// Routes
export { socialRouter } from './routes';

