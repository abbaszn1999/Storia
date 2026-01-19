/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VIDEO IMAGE GENERATOR - BATCH PROCESSING (Agent 4.2)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Handles batch generation of keyframe images for all shots in a video.
 * 
 * KEY PRINCIPLE:
 * Shots are processed IN ORDER to support continuity inheritance.
 * Each shot in a continuity group (except the first) inherits its START frame
 * from the previous shot's END frame.
 * 
 * FLOW:
 * 1. Build continuity info map (which shots inherit from which)
 * 2. Process shots sequentially (required for inheritance chain)
 * 3. Track generated END frames for inheritance to next shot
 * 4. Update ShotVersions with generated URLs
 */

import { generateShotImages, retryShotImages } from "./video-image-generator";
import type {
  VideoImageGeneratorInput,
  VideoImageGeneratorOutput,
  VideoImageGeneratorBatchInput,
  VideoImageGeneratorBatchOutput,
  ContinuityGroup,
  AnimationMode,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  /** Delay between shot generations (ms) to avoid rate limiting */
  INTER_SHOT_DELAY_MS: 500,
  
  /** Maximum parallel generations (for non-continuity shots) */
  MAX_PARALLEL: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ShotContinuityInfo {
  groupId: string | null;
  isFirst: boolean;
  previousShotId: string | null;
}

interface ProcessedShot {
  shotId: string;
  result: VideoImageGeneratorOutput;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build continuity info map for all shots
 * Determines which shots inherit from which previous shots
 */
function buildContinuityInfoMap(
  shots: VideoImageGeneratorBatchInput['shots'],
  continuityGroups: ContinuityGroup[] = []
): Map<string, ShotContinuityInfo> {
  const continuityMap = new Map<string, ShotContinuityInfo>();
  
  // Initialize all shots as standalone (no inheritance)
  for (const shot of shots) {
    continuityMap.set(shot.shotId, {
      groupId: null,
      isFirst: true,
      previousShotId: null,
    });
  }
  
  // Process approved continuity groups
  const approvedGroups = continuityGroups.filter(g => g.status === 'approved');
  
  for (const group of approvedGroups) {
    const sortedShotIds = group.shotIds;
    
    for (let i = 0; i < sortedShotIds.length; i++) {
      const shotId = sortedShotIds[i];
      const existingInfo = continuityMap.get(shotId);
      
      if (i === 0) {
        // First shot in THIS group - but check if it already has inheritance from another group
        // BUGFIX: If shot is already marked as inheriting (isFirst: false), DON'T overwrite it!
        // This happens when a shot is first in Group B but second in Group A (overlapping groups)
        if (existingInfo && !existingInfo.isFirst) {
          // Shot already has inheritance from another group - keep it!
          console.log(`[batch] Shot ${shotId.substring(0, 8)}... is first in group ${group.id.substring(0, 8)}... but already inherits from group ${existingInfo.groupId ? existingInfo.groupId.substring(0, 8) : 'unknown'}..., keeping inheritance`);
        } else {
          // Either no existing info, or marked as first - set as first in this group
          continuityMap.set(shotId, {
            groupId: group.id,
            isFirst: true,
            previousShotId: null,
          });
        }
      } else {
        // Subsequent shots inherit from previous
        // BUGFIX: If shot already exists in map (from another group), only override if it's currently marked as "first"
        // This handles overlapping groups correctly: once a shot is marked as inheriting, it stays that way
        if (existingInfo) {
          // Shot already processed by another group
          if (existingInfo.isFirst) {
            // Currently marked as first - override with inheritance
            console.log(`[batch] Shot ${shotId} was first in group ${existingInfo.groupId || 'unknown'}, now inheriting from previous shot in group ${group.id.substring(0, 8)}...`);
            continuityMap.set(shotId, {
              groupId: group.id,
              isFirst: false,
              previousShotId: sortedShotIds[i - 1],
            });
          } else {
            // Already marked as inheriting - keep it
            console.log(`[batch] Shot ${shotId} already has inheritance from group ${existingInfo.groupId || 'unknown'}, keeping it`);
          }
        } else {
          // First time seeing this shot - mark as inheriting
          continuityMap.set(shotId, {
            groupId: group.id,
            isFirst: false,
            previousShotId: sortedShotIds[i - 1],
          });
        }
      }
    }
  }
  
  // Log continuity map for debugging
  console.log("[batch] Continuity info map:");
  continuityMap.forEach((info, shotId) => {
    if (info.groupId) {
      console.log(`  Shot ${shotId.substring(0, 8)}... -> Group ${info.groupId.substring(0, 8)}..., isFirst: ${info.isFirst}, prev: ${info.previousShotId?.substring(0, 8) || 'none'}...`);
    }
  });
  
  return continuityMap;
}

/**
 * Get processing order for shots
 * Continuity shots must be processed in sequence within their groups
 */
function getProcessingOrder(
  shots: VideoImageGeneratorBatchInput['shots'],
  continuityMap: Map<string, ShotContinuityInfo>
): VideoImageGeneratorBatchInput['shots'] {
  // Sort by scene and shot number to ensure proper ordering
  const sortedShots = [...shots].sort((a, b) => {
    if (a.sceneId !== b.sceneId) {
      return a.sceneId.localeCompare(b.sceneId);
    }
    return a.shotNumber - b.shotNumber;
  });
  
  return sortedShots;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BATCH FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate images for all shots in a video (batch processing)
 * 
 * @param input - Batch input with all shots and settings
 * @param userId - User ID for tracking
 * @param workspaceId - Workspace ID for tracking
 * @returns Batch output with all results
 */
export async function generateAllShotImages(
  input: VideoImageGeneratorBatchInput,
  userId: string,
  workspaceId?: string
): Promise<VideoImageGeneratorBatchOutput> {
  const {
    videoId,
    imageModel,
    aspectRatio,
    imageResolution,
    animationMode,
    videoGenerationMode,
    shots,
    continuityGroups = [],
  } = input;

  console.log("[batch] Starting batch image generation:", {
    videoId: videoId.substring(0, 8) + '...',
    shotCount: shots.length,
    animationMode,
    videoGenerationMode,
    imageModel,
    aspectRatio,
    imageResolution,
    continuityGroupCount: continuityGroups.length,
  });

  // Build continuity info map
  const continuityMap = buildContinuityInfoMap(shots, continuityGroups);
  
  // Get processing order (sequential for continuity support)
  const orderedShots = getProcessingOrder(shots, continuityMap);
  
  // Track results and generated end frames for inheritance
  const results: VideoImageGeneratorOutput[] = [];
  const endFrameUrlMap = new Map<string, string>(); // shotId -> endFrameUrl
  let totalCost = 0;
  let successCount = 0;
  let failureCount = 0;

  // BUGFIX: Pre-populate endFrameUrlMap with existing end frames for continuity inheritance
  // This ensures that shots with existing end frames can serve as reference for next shots
  for (const shot of orderedShots) {
    if (shot.existingEndFrameUrl) {
      endFrameUrlMap.set(shot.shotId, shot.existingEndFrameUrl);
      console.log(`[batch] Pre-loaded existing end frame for shot ${shot.shotId.substring(0, 8)}... for continuity inheritance`);
    }
  }

  console.log(`[batch] Processing ${orderedShots.length} shots sequentially...`);

  // Process shots sequentially (required for continuity inheritance)
  for (let i = 0; i < orderedShots.length; i++) {
    const shot = orderedShots[i];
    const continuityInfo = continuityMap.get(shot.shotId);
    
    console.log(`[batch] Processing shot ${i + 1}/${orderedShots.length}: Shot #${shot.shotNumber}`);

    // Determine if this shot should inherit start frame
    let previousShotEndFrameUrl: string | undefined;
    let inheritStartFrame = false;
    
    if (continuityInfo && !continuityInfo.isFirst && continuityInfo.previousShotId) {
      previousShotEndFrameUrl = endFrameUrlMap.get(continuityInfo.previousShotId);
      inheritStartFrame = !!previousShotEndFrameUrl;
      
      if (inheritStartFrame) {
        console.log(`[batch] Shot #${shot.shotNumber} will inherit start from shot ${continuityInfo.previousShotId.substring(0, 8)}...`);
      } else {
        console.log(`[batch] Shot #${shot.shotNumber} should inherit but previous shot's end frame not in memory (may use existing saved frame if available)`);
      }
    }

    // Build input for this shot
    const shotInput: VideoImageGeneratorInput = {
      shotId: shot.shotId,
      shotNumber: shot.shotNumber,
      sceneId: shot.sceneId,
      imagePrompt: shot.imagePrompt,
      startFramePrompt: shot.startFramePrompt,
      endFramePrompt: shot.endFramePrompt,
      animationMode,
      videoGenerationMode,
      imageModel,
      aspectRatio,
      imageResolution,
      isFirstInGroup: continuityInfo?.isFirst ?? true,
      isConnectedShot: !!continuityInfo?.groupId,
      previousShotEndFrameUrl,
      inheritStartFrame,
      // NEW: Pass existing frames for smart partial generation
      existingStartFrameUrl: shot.existingStartFrameUrl,
      existingEndFrameUrl: shot.existingEndFrameUrl,
    };

    // Generate images for this shot
    let result = await generateShotImages(shotInput, userId, workspaceId);

    // Retry if failed
    if (result.error) {
      console.log(`[batch] Shot #${shot.shotNumber} failed, retrying...`);
      result = await retryShotImages(shotInput, userId, workspaceId);
    }

    // Track result
    results.push(result);
    totalCost += result.cost || 0;

    if (result.error) {
      failureCount++;
      console.error(`[batch] Shot #${shot.shotNumber} failed:`, result.error);
    } else {
      successCount++;
      
      // Store end frame URL for inheritance by next shot (update if newly generated)
      if (result.endFrameUrl) {
        endFrameUrlMap.set(shot.shotId, result.endFrameUrl);
        console.log(`[batch] Shot #${shot.shotNumber} end frame ${shot.existingEndFrameUrl ? 'updated' : 'stored'} for inheritance`);
      }
    }

    // Small delay between shots
    if (i < orderedShots.length - 1) {
      await sleep(CONFIG.INTER_SHOT_DELAY_MS);
    }
  }

  console.log("[batch] Batch generation complete:", {
    total: shots.length,
    successful: successCount,
    failed: failureCount,
    totalCost,
  });

  return {
    videoId,
    results,
    totalCost,
    successCount,
    failureCount,
  };
}

/**
 * Update ShotVersions with generated image URLs
 * This is a helper to merge batch results back into step4Data
 */
export function mergeResultsIntoShotVersions(
  shotVersions: Record<string, Array<{
    id: string;
    shotId: string;
    versionNumber: number;
    imageUrl?: string | null;
    startFrameUrl?: string | null;
    endFrameUrl?: string | null;
    startFrameInherited?: boolean;
    status: string;
    errorMessage?: string | null;
    [key: string]: any;
  }>>,
  results: VideoImageGeneratorOutput[],
  versionIdMap: Map<string, string> // shotId -> versionId to update
): Record<string, Array<any>> {
  const updatedVersions = { ...shotVersions };

  for (const result of results) {
    const versionId = versionIdMap.get(result.shotId);
    if (!versionId) {
      console.warn(`[batch:merge] No version ID found for shot ${result.shotId}`);
      continue;
    }

    // Find the version to update
    for (const shotId of Object.keys(updatedVersions)) {
      const versions = updatedVersions[shotId];
      const versionIndex = versions.findIndex(v => v.id === versionId);
      
      if (versionIndex !== -1) {
        const version = versions[versionIndex];
        
        if (result.error) {
          // Update with error
          versions[versionIndex] = {
            ...version,
            status: 'failed',
            errorMessage: result.error,
          };
        } else {
          // Update with success
          versions[versionIndex] = {
            ...version,
            imageUrl: result.imageUrl || version.imageUrl,
            startFrameUrl: result.startFrameUrl || version.startFrameUrl,
            endFrameUrl: result.endFrameUrl || version.endFrameUrl,
            startFrameInherited: result.startFrameInherited ?? version.startFrameInherited,
            status: 'images_generated',
            errorMessage: null,
          };
        }
        
        console.log(`[batch:merge] Updated version ${versionId.substring(0, 8)}... for shot ${result.shotId.substring(0, 8)}...`);
        break;
      }
    }
  }

  return updatedVersions;
}

