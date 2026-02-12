/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO-VIDEO MODULE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Central module for auto-video campaign generation.
 * 
 * Structure:
 * - routes/ - API endpoints for generation, scheduling, publishing
 * - services/ - Batch processor, mode delegator, scheduler
 * - modes/{mode}/agents - Per-mode agents (ambient-visual, narrative, etc.)
 * - types.ts - Type definitions
 * 
 * Key distinction from auto-story:
 * - Auto-story: Same agents for all modes
 * - Auto-video: Separate agents per mode (auto-video/modes/{mode}/agents)
 */

// Export routes
export { autoVideoRoutes } from './routes';

// Export services
export * from './services';

// Export types
export * from './types';
