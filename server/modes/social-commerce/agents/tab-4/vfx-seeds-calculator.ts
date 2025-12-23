/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VFX SEEDS CALCULATOR (Algorithmic Function)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Pure algorithmic function (no AI) that calculates VFX parameters based on
 * shot data. Converts shot metadata into technical VFX parameters for generation models.
 * 
 * INPUT:
 * - shot: Shot definition from Agent 4.1
 * - previousShot: Previous shot (optional)
 * - continuityLogic: Continuity logic from shot
 * 
 * OUTPUT:
 * - motion_bucket: Motion intensity (1-10, maps from motion_intensity)
 * - frame_consistency_scale: Consistency level (0.70-0.90)
 * - target_handover_image: Previous shot's end frame if connected
 */

export interface VfxSeeds {
  shot_id: string;
  motion_bucket: number; // 1-10, maps from motion_intensity
  frame_consistency_scale: number; // 0.70-0.90
  target_handover_image: string | null; // Previous shot's end frame if connected
}

export interface ShotForVfx {
  shot_id: string;
  technical_cinematography: {
    motion_intensity: number;
  };
  continuity_logic: {
    is_connected_to_previous: boolean;
  };
}

/**
 * Calculate VFX seeds for a shot
 * 
 * @param shot - Current shot definition
 * @param previousShot - Previous shot (optional, for handover image)
 * @param continuityLogic - Continuity logic from shot
 * @returns VFX seeds with motion bucket, consistency scale, and handover image
 */
export function calculateVfxSeeds(
  shot: ShotForVfx,
  previousShot: ShotForVfx | null,
  continuityLogic: { is_connected_to_previous: boolean }
): VfxSeeds {
  // Motion bucket: direct mapping from motion_intensity (1-10)
  const motion_bucket = shot.technical_cinematography.motion_intensity;

  // Frame consistency scale based on connection status
  let frame_consistency_scale: number;
  if (continuityLogic.is_connected_to_previous) {
    // Strong consistency for connected shots
    frame_consistency_scale = 0.90;
  } else if (!previousShot) {
    // First shot in sequence (no previous reference)
    frame_consistency_scale = 0.70;
  } else {
    // Standard consistency for standalone shots
    frame_consistency_scale = 0.75;
  }

  // Target handover image: only if connected to previous
  const target_handover_image = continuityLogic.is_connected_to_previous && previousShot
    ? `${previousShot.shot_id}_end_frame.png`
    : null;

  return {
    shot_id: shot.shot_id,
    motion_bucket,
    frame_consistency_scale,
    target_handover_image,
  };
}

