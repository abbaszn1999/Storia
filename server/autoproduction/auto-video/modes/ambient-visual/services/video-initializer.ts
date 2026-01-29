/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO INITIALIZER SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Creates video records in the database with proper step data.
 * Uses the exact same storage.createVideo() as the original ambient-visual mode
 * to ensure identical database structure.
 * 
 * Phase 1: Database save only - NO AI generation.
 */

import { storage } from '../../../../../storage';
import type { Step1Data, Step2Data } from '../../../../../modes/ambient-visual/types';

// Ambient-visual mode configuration (matching original)
const AMBIENT_VISUAL_MODE = 'ambient';

/**
 * Create an ambient video record in the database
 * 
 * This function creates a video record that is structurally identical
 * to videos created through the original ambient-visual mode flow.
 * 
 * @param title - Video title (from the idea/topic)
 * @param workspaceId - Workspace ID
 * @param step1Data - Atmosphere settings (with userStory set to the idea)
 * @param step2Data - Visual world settings
 * @returns The created video ID
 */
export async function createAmbientVideo(
  title: string,
  workspaceId: string,
  step1Data: Partial<Step1Data>,
  step2Data: Partial<Step2Data>
): Promise<string> {
  console.log('[video-initializer] Creating ambient video record:', title);

  // Create video using the exact same storage call as original ambient mode
  // Reference: server/modes/ambient-visual/routes/index.ts lines 94-102
  const video = await storage.createVideo({
    workspaceId,
    title,
    mode: AMBIENT_VISUAL_MODE,
    status: 'draft',
    currentStep: 2,        // Data populated for steps 1-2
    completedSteps: [],    // No steps "completed" yet (requires user review)
    step1Data,
    step2Data,
  });

  console.log('[video-initializer] Video created:', video.id);
  
  return video.id;
}
