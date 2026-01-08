/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LOGO ANIMATION MODE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Simple logo animation video creation mode.
 * 
 * Features:
 * - Single-page workflow (no multi-step process)
 * - VEO 3.1 video generation only
 * - Reference image support (optional)
 * - Seamless loop support (1x, 2x, 4x, 6x)
 * - 4-8 second duration
 */

// Routes
export { default as logoAnimationRoutes } from './routes';

// Generator
export { generateLogoAnimation } from './generator';

// Types
export * from './types';

