/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CHARACTER VLOG - SHOT GENERATOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates shot breakdowns from scenes with continuity analysis for character vlog content.
 * Breaks down scenes into detailed, visually distinct shots.
 */

import { callTextModel } from "../../../../ai/service";
import { randomUUID } from "crypto";
import {
  SHOT_GENERATOR_SYSTEM_PROMPT,
  buildShotGeneratorUserPrompt,
} from "../../prompts/step-3-scenes/shot-generator-prompts";
import type {
  ShotGeneratorInput,
  ShotGeneratorOutput,
} from "../../types";

const SHOT_GENERATOR_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o", // As specified in prompt docs
};

/**
 * JSON Schema for shot generator output validation
 */
const SHOT_GENERATOR_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    shots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Shot name in format 'Shot {sceneNumber}.{shotNumber}: {Title}'",
          },
          description: {
            type: "string",
            description: "Detailed visual description (50-300 words) - action, composition, focus, atmosphere",
          },
          shotType: {
            type: "string",
            enum: ["1F", "2F"],
            description: "Frame type: '1F' (single image) or '2F' (start/end frames)",
          },
          cameraShot: {
            type: "string",
            description: "Camera angle from 10 preset options",
          },
          referenceTags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Character and location tags (e.g., ['@PrimaryCharacter', '@Location1'])",
          },
          duration: {
            type: "number",
            description: "Duration in seconds (must be from videoModelDurations array)",
          },
          isLinkedToPrevious: {
            type: "boolean",
            description: "Whether this shot links to the previous shot for continuity",
          },
          isFirstInGroup: {
            type: "boolean",
            description: "Whether this shot is the first in a continuity group",
          },
        },
        required: ["name", "description", "shotType", "cameraShot", "referenceTags", "duration", "isLinkedToPrevious", "isFirstInGroup"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 20,
    },
  },
  required: ["shots"],
  additionalProperties: false,
};

/**
 * Continuity group structure (matches client-side ContinuityGroup)
 */
interface ContinuityGroup {
  id: string;
  sceneId: string;
  groupNumber: number;
  shotIds: string[];
  description?: string | null;
  transitionType?: string | null;
  status: string;
  editedBy?: string | null;
  editedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

/**
 * Convert shot flags to continuity groups
 * Groups consecutive shots where isLinkedToPrevious is true
 * Returns groups with shot indices that will be mapped to IDs in routes
 */
function mapFlagsToContinuityGroups(
  shots: Array<{
    shotType: '1F' | '2F';
    isLinkedToPrevious: boolean;
    isFirstInGroup: boolean;
  }>,
  sceneId: string,
  referenceMode: '1F' | '2F' | 'AI'
): Array<{
  shotIndices: number[]; // 0-based indices to map to shot IDs in routes
  description: string;
  transitionType: string;
}> {
  // No groups in 1F mode
  if (referenceMode === '1F') {
    return [];
  }

  const groups: Array<{
    shotIndices: number[];
    description: string;
    transitionType: string;
  }> = [];
  let currentGroup: number[] | null = null;

  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];

    // Start a new group if this shot is first in group
    if (shot.isFirstInGroup) {
      // Finalize previous group if exists
      if (currentGroup && currentGroup.length >= 2) {
        // Validate first shot is 2F (for 2F and AI modes)
        const firstShotIndex = currentGroup[0];
        if (shots[firstShotIndex] && shots[firstShotIndex].shotType === '2F') {
          groups.push({
            shotIndices: [...currentGroup],
            description: `Continuity group with ${currentGroup.length} shots`,
            transitionType: 'flow',
          });
        }
      }
      // Start new group
      currentGroup = [i];
    }
    // Add to current group if linked to previous
    else if (shot.isLinkedToPrevious && currentGroup) {
      currentGroup.push(i);
    }
    // Not linked - finalize current group if exists
    else {
      if (currentGroup && currentGroup.length >= 2) {
        const firstShotIndex = currentGroup[0];
        if (shots[firstShotIndex] && shots[firstShotIndex].shotType === '2F') {
          groups.push({
            shotIndices: [...currentGroup],
            description: `Continuity group with ${currentGroup.length} shots`,
            transitionType: 'flow',
          });
        }
      }
      currentGroup = null;
    }
  }

  // Finalize last group if exists
  if (currentGroup && currentGroup.length >= 2) {
    const firstShotIndex = currentGroup[0];
    if (shots[firstShotIndex] && shots[firstShotIndex].shotType === '2F') {
      groups.push({
        shotIndices: [...currentGroup],
        description: `Continuity group with ${currentGroup.length} shots`,
        transitionType: 'flow',
      });
    }
  }

  return groups;
}

/**
 * Parse JSON response from AI, handling potential formatting issues
 */
function parseShotResponse(rawOutput: string): ShotGeneratorOutput {
  const trimmed = rawOutput.trim();
  
  // Try to extract JSON if wrapped in markdown code blocks
  let jsonStr = trimmed;
  const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid object');
    }
    
    if (!Array.isArray(parsed.shots)) {
      throw new Error('Response missing "shots" array');
    }
    
    // Validate each shot
    const shots = parsed.shots.map((shot: any, index: number) => {
      if (!shot || typeof shot !== 'object') {
        throw new Error(`Shot ${index + 1} is not a valid object`);
      }
      if (!shot.name || typeof shot.name !== 'string') {
        throw new Error(`Shot ${index + 1} missing or invalid "name" field`);
      }
      if (!shot.description || typeof shot.description !== 'string') {
        throw new Error(`Shot ${index + 1} missing or invalid "description" field`);
      }
      if (shot.shotType !== '1F' && shot.shotType !== '2F') {
        throw new Error(`Shot ${index + 1} has invalid "shotType" (must be "1F" or "2F")`);
      }
      if (!shot.cameraShot || typeof shot.cameraShot !== 'string') {
        throw new Error(`Shot ${index + 1} missing or invalid "cameraShot" field`);
      }
      if (!Array.isArray(shot.referenceTags)) {
        throw new Error(`Shot ${index + 1} missing or invalid "referenceTags" field (must be array)`);
      }
      if (typeof shot.duration !== 'number' || shot.duration <= 0) {
        throw new Error(`Shot ${index + 1} has invalid "duration" (must be positive number)`);
      }
      if (typeof shot.isLinkedToPrevious !== 'boolean') {
        throw new Error(`Shot ${index + 1} missing or invalid "isLinkedToPrevious" field (must be boolean)`);
      }
      if (typeof shot.isFirstInGroup !== 'boolean') {
        throw new Error(`Shot ${index + 1} missing or invalid "isFirstInGroup" field (must be boolean)`);
      }
      return {
        name: shot.name,
        description: shot.description,
        shotType: shot.shotType as '1F' | '2F',
        cameraShot: shot.cameraShot,
        referenceTags: shot.referenceTags,
        duration: shot.duration,
        // Keep flags for group conversion, but they're deprecated
        isLinkedToPrevious: shot.isLinkedToPrevious,
        isFirstInGroup: shot.isFirstInGroup,
      };
    });
    
    return {
      shots,
      cost: parsed.cost,
    };
  } catch (error) {
    console.error('[character-vlog:shot-generator] Failed to parse response:', error);
    throw new Error(`Failed to parse shot response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate shots from scene analysis.
 * 
 * @param input - The shot generation input (scene info, script, characters, locations, etc.)
 * @param userId - User ID for tracking/billing
 * @param workspaceId - Workspace ID for organization
 * @returns Generated shots and cost
 */
export async function generateShots(
  input: ShotGeneratorInput,
  userId?: string,
  workspaceId?: string
): Promise<ShotGeneratorOutput> {
  console.log('[character-vlog:shot-generator] Generating shots:', {
    sceneName: input.sceneName,
    sceneDuration: input.sceneDuration,
    referenceMode: input.referenceMode,
    shotsPerScene: input.shotsPerScene,
    videoModel: input.videoModel,
    availableDurations: input.videoModelDurations,
    characterCount: input.characters.length,
    locationCount: input.locations.length,
    worldDescription: input.worldDescription || 'None',
    userId,
    workspaceId,
  });

  // Build the user prompt with all shot generation parameters
  const userPrompt = buildShotGeneratorUserPrompt(input);

  try {
    const response = await callTextModel(
      {
        provider: SHOT_GENERATOR_CONFIG.provider,
        model: SHOT_GENERATOR_CONFIG.model,
        payload: {
          input: [
            { role: "system", content: SHOT_GENERATOR_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "shot_generator_output",
              strict: true,
              schema: SHOT_GENERATOR_OUTPUT_SCHEMA,
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 6000, // Shots can have multiple items with detailed descriptions
      }
    );

    const rawOutput = response.output.trim();
    
    console.log('[character-vlog:shot-generator] AI response received:', {
      outputLength: rawOutput.length,
      cost: response.usage?.totalCostUsd,
    });
    
    // Parse JSON response
    const parsed = parseShotResponse(rawOutput);
    
    // Validate reference mode constraints
    if (input.referenceMode === '1F') {
      const invalidShots = parsed.shots.filter(s => s.shotType !== '1F');
      if (invalidShots.length > 0) {
        console.warn('[character-vlog:shot-generator] Warning: Some shots are not 1F in 1F mode:', invalidShots.map(s => s.name));
      }
      // Ensure all continuity fields are false in 1F mode
      parsed.shots = parsed.shots.map(shot => ({
        ...shot,
        shotType: '1F' as const,
        isLinkedToPrevious: false,
        isFirstInGroup: false,
      }));
    } else if (input.referenceMode === '2F') {
      const invalidShots = parsed.shots.filter(s => s.shotType !== '2F');
      if (invalidShots.length > 0) {
        console.warn('[character-vlog:shot-generator] Warning: Some shots are not 2F in 2F mode:', invalidShots.map(s => s.name));
      }
      // Ensure all shots are 2F in 2F mode
      parsed.shots = parsed.shots.map(shot => ({
        ...shot,
        shotType: '2F' as const,
      }));
    }
    
    // Validate shot count if specified
    if (typeof input.shotsPerScene === 'number') {
      if (parsed.shots.length !== input.shotsPerScene) {
        console.warn(
          `[character-vlog:shot-generator] Shot count mismatch: expected ${input.shotsPerScene}, got ${parsed.shots.length}`
        );
      }
    }
    
    // Validate and FIX duration distribution
    let totalDuration = parsed.shots.reduce((sum, shot) => sum + shot.duration, 0);
    const durationTolerance = input.sceneDuration * 0.1; // ±10%
    
    // First, fix any invalid durations (not in allowed array)
    const sortedDurations = [...input.videoModelDurations].sort((a, b) => a - b);
    const maxDuration = sortedDurations[sortedDurations.length - 1];
    const minDuration = sortedDurations[0];
    
    parsed.shots = parsed.shots.map(shot => {
      if (!input.videoModelDurations.includes(shot.duration)) {
        // Find closest valid duration
        const closestDuration = sortedDurations.reduce((prev, curr) => 
          Math.abs(curr - shot.duration) < Math.abs(prev - shot.duration) ? curr : prev
        );
        console.log(`[character-vlog:shot-generator] Fixing invalid duration: ${shot.name} ${shot.duration}s → ${closestDuration}s`);
        return { ...shot, duration: closestDuration };
      }
      return shot;
    });
    
    // Recalculate total after fixing invalid durations
    totalDuration = parsed.shots.reduce((sum, shot) => sum + shot.duration, 0);
    
    // If total duration is significantly off, scale durations proportionally
    // This preserves the AI's relative duration choices (longer/shorter shots) while hitting target
    if (Math.abs(totalDuration - input.sceneDuration) > durationTolerance) {
      console.warn(
        `[character-vlog:shot-generator] Duration mismatch detected: sceneDuration ${input.sceneDuration}s, total ${totalDuration}s. Auto-correcting with proportional scaling...`
      );
      
      // Calculate scale factor to match scene duration
      const scaleFactor = input.sceneDuration / totalDuration;
      
      // Scale each shot's duration proportionally, snapping to valid durations
      // This preserves relative differences (e.g., action shot longer than static shot)
      let accumulatedDuration = 0;
      parsed.shots = parsed.shots.map((shot, index) => {
        const isLastShot = index === parsed.shots.length - 1;
        
        if (isLastShot) {
          // Last shot gets remaining duration to hit exact target (closest valid)
          const remainingDuration = input.sceneDuration - accumulatedDuration;
          const closestToRemaining = sortedDurations.reduce((prev, curr) => 
            Math.abs(curr - remainingDuration) < Math.abs(prev - remainingDuration) ? curr : prev
          );
          if (closestToRemaining !== shot.duration) {
            console.log(`[character-vlog:shot-generator] Scaled: ${shot.name} ${shot.duration}s → ${closestToRemaining}s (last shot, filling to target)`);
          }
          return { ...shot, duration: closestToRemaining };
        } else {
          // Scale this shot's duration proportionally
          const scaledDuration = shot.duration * scaleFactor;
          
          // Find closest valid duration that doesn't exceed remaining budget
          const remainingBudget = input.sceneDuration - accumulatedDuration;
          const minNeededForRemaining = minDuration * (parsed.shots.length - index - 1);
          const maxAllowed = Math.min(remainingBudget - minNeededForRemaining, maxDuration);
          
          // Find best valid duration within constraints
          const validOptions = sortedDurations.filter(d => d <= maxAllowed);
          const closestValid = validOptions.length > 0
            ? validOptions.reduce((prev, curr) => 
                Math.abs(curr - scaledDuration) < Math.abs(prev - scaledDuration) ? curr : prev
              )
            : minDuration; // Fallback to minimum if no valid options
          
          accumulatedDuration += closestValid;
          
          if (closestValid !== shot.duration) {
            console.log(`[character-vlog:shot-generator] Scaled: ${shot.name} ${shot.duration}s → ${closestValid}s (target: ${scaledDuration.toFixed(1)}s)`);
          }
          return { ...shot, duration: closestValid };
        }
      });
      
      // Final validation
      const newTotalDuration = parsed.shots.reduce((sum, shot) => sum + shot.duration, 0);
      console.log(
        `[character-vlog:shot-generator] Duration scaling complete: ${totalDuration}s → ${newTotalDuration}s (target: ${input.sceneDuration}s)`
      );
    }
    
    // Create continuity groups from flags (for 2F and AI modes)
    let continuityGroups: Array<{
      shotIndices: number[];
      description: string;
      transitionType: string;
    }> = [];
    
    if (input.referenceMode === '2F' || input.referenceMode === 'AI') {
      // Log flags before mapping
      const flagsSummary = parsed.shots.map((shot: any, idx: number) => ({
        index: idx,
        shotType: shot.shotType,
        isLinkedToPrevious: shot.isLinkedToPrevious,
        isFirstInGroup: shot.isFirstInGroup,
      }));
      console.log('[character-vlog:shot-generator] Flags from AI:', {
        referenceMode: input.referenceMode,
        shotCount: parsed.shots.length,
        flags: flagsSummary,
        linkedCount: flagsSummary.filter((f: any) => f.isLinkedToPrevious).length,
        firstInGroupCount: flagsSummary.filter((f: any) => f.isFirstInGroup).length,
      });
      
      continuityGroups = mapFlagsToContinuityGroups(
        parsed.shots,
        '', // sceneId will be set in routes
        input.referenceMode
      );
      
      console.log('[character-vlog:shot-generator] Continuity groups created:', {
        groupCount: continuityGroups.length,
        totalShotsInGroups: continuityGroups.reduce((sum, g) => sum + g.shotIndices.length, 0),
        groups: continuityGroups.map(g => ({
          shotIndices: g.shotIndices,
          description: g.description,
          transitionType: g.transitionType,
        })),
      });
    } else {
      console.log('[character-vlog:shot-generator] Skipping continuity groups (referenceMode is 1F)');
    }

    // Calculate final duration difference for logging
    const finalTotalDuration = parsed.shots.reduce((sum, shot) => sum + shot.duration, 0);
    const finalDurationDiff = Math.abs(finalTotalDuration - input.sceneDuration);
    
    console.log('[character-vlog:shot-generator] Shots generated:', {
      shotCount: parsed.shots.length,
      totalDuration: finalTotalDuration,
      sceneDuration: input.sceneDuration,
      durationDiff: finalDurationDiff,
      continuityGroupsCount: continuityGroups.length,
      cost: parsed.cost || response.usage?.totalCostUsd,
    });

    return {
      shots: parsed.shots,
      continuityGroups: continuityGroups.length > 0 ? continuityGroups : undefined,
      cost: parsed.cost || response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[character-vlog:shot-generator] Failed to generate shots:", error);
    throw new Error(`Failed to generate shots: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

