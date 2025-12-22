/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - FLOW DESIGN: SHOT COMPOSER AGENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates shots within each scene/segment.
 * Each shot defines an individual visual moment with camera movement and duration.
 */

import { callTextModel } from "../../../ai/service";
import { randomUUID } from "crypto";
import {
  buildShotComposerSystemPrompt,
  buildShotComposerUserPrompt,
  calculateOptimalShotCount,
} from "../prompts/flow-shot-composer-prompts";
import type {
  ShotComposerInput,
  ShotComposerOutput,
  Shot,
} from "../types";

const SHOT_COMPOSER_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

/**
 * Shot limits for validation
 */
const SHOT_LIMITS = {
  MIN: 1,
  MAX: 10,
  DURATION_MIN: 5,
  DURATION_MAX: 30,
};

/**
 * Parse AI response into Shot objects
 */
interface AIShotResponse {
  shots: Array<{
    shotNumber: number;
    shotType: string;
    cameraMovement: string;
    duration: number;
    description: string;
  }>;
  totalShots: number;
  totalDuration: number;
}

/**
 * Compose shots for a single scene
 */
export async function composeShots(
  input: ShotComposerInput,
  userId?: string,
  workspaceId?: string
): Promise<ShotComposerOutput> {
  const scene = input.scene;
  const sceneDuration = scene.duration || 60;
  const shotCount = calculateOptimalShotCount(
    sceneDuration,
    input.pacing,
    input.shotsPerSegment
  );

  console.log("[ambient-visual:shot-composer] Composing shots:", {
    sceneId: scene.id,
    sceneTitle: scene.title,
    sceneDuration,
    targetShotCount: shotCount,
    pacing: input.pacing,
    animationMode: input.animationMode,
  });

  const systemPrompt = buildShotComposerSystemPrompt(
    shotCount,
    sceneDuration,
    input.pacing,
    input.animationMode
  );
  const userPrompt = buildShotComposerUserPrompt(input);

  try {
    const response = await callTextModel(
      {
        provider: SHOT_COMPOSER_CONFIG.provider,
        model: SHOT_COMPOSER_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "shot_composition",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  shots: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        shotNumber: { type: "number" },
                        shotType: { type: "string" },
                        cameraMovement: { type: "string" },
                        duration: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["shotNumber", "shotType", "cameraMovement", "duration", "description"],
                      additionalProperties: false,
                    },
                  },
                  totalShots: { type: "number" },
                  totalDuration: { type: "number" },
                },
                required: ["shots", "totalShots", "totalDuration"],
                additionalProperties: false,
              },
            },
          },
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 800,
      }
    );

    // Parse the JSON response
    const parsed: AIShotResponse = JSON.parse(response.output.trim());

    // Validate response structure
    if (!parsed.shots || !Array.isArray(parsed.shots)) {
      throw new Error("Invalid response: missing shots array");
    }

    // Validate shot count
    let aiShots = parsed.shots;
    if (aiShots.length < SHOT_LIMITS.MIN) {
      console.warn(
        `[ambient-visual:shot-composer] Too few shots (${aiShots.length}), expected at least ${SHOT_LIMITS.MIN}`
      );
    }
    if (aiShots.length > SHOT_LIMITS.MAX) {
      console.warn(
        `[ambient-visual:shot-composer] Too many shots (${aiShots.length}), trimming to ${SHOT_LIMITS.MAX}`
      );
      aiShots = aiShots.slice(0, SHOT_LIMITS.MAX);
    }

    // Convert to Shot objects
    const now = new Date();
    const shots: Shot[] = aiShots.map((shot, index) => ({
      id: randomUUID(),
      sceneId: scene.id,
      shotNumber: index + 1, // Ensure sequential numbering
      shotType: shot.shotType || "Wide Shot",
      cameraMovement: shot.cameraMovement || "static",
      duration: Math.max(
        SHOT_LIMITS.DURATION_MIN,
        Math.min(SHOT_LIMITS.DURATION_MAX, shot.duration)
      ),
      description: shot.description,
      videoModel: null,
      imageModel: null,
      soundEffects: null,
      transition: null,
      currentVersionId: null,
      createdAt: now,
      updatedAt: now,
    }));

    // Calculate actual total duration
    const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);

    console.log("[ambient-visual:shot-composer] Shots composed:", {
      sceneId: scene.id,
      shotCount: shots.length,
      totalDuration,
      targetDuration: sceneDuration,
      cost: response.usage?.totalCostUsd,
    });

    return {
      shots,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error(
      "[ambient-visual:shot-composer] Failed to compose shots:",
      error
    );
    throw new Error(`Failed to compose shots for scene: ${scene.title}`);
  }
}

/**
 * Compose shots for multiple scenes in parallel
 */
export async function composeShotsForScenes(
  scenes: import("../types").Scene[],
  settings: {
    shotsPerSegment: "auto" | number;
    pacing: number;
    animationMode: import("../types").AnimationMode;
    artStyle?: string;
    visualElements?: string[];
  },
  userId?: string,
  workspaceId?: string
): Promise<{
  shots: Record<string, Shot[]>;
  totalCost: number;
}> {
  console.log("[ambient-visual:shot-composer] Composing shots for all scenes:", {
    sceneCount: scenes.length,
    pacing: settings.pacing,
    shotsPerSegment: settings.shotsPerSegment,
  });

  const results = await Promise.all(
    scenes.map(async (scene) => {
      const input: ShotComposerInput = {
        scene,
        shotsPerSegment: settings.shotsPerSegment,
        pacing: settings.pacing,
        animationMode: settings.animationMode,
        artStyle: settings.artStyle,
        visualElements: settings.visualElements,
      };
      
      const result = await composeShots(input, userId, workspaceId);
      return {
        sceneId: scene.id,
        shots: result.shots,
        cost: result.cost || 0,
      };
    })
  );

  // Aggregate results
  const shots: Record<string, Shot[]> = {};
  let totalCost = 0;

  for (const result of results) {
    shots[result.sceneId] = result.shots;
    totalCost += result.cost;
  }

  console.log("[ambient-visual:shot-composer] All shots composed:", {
    sceneCount: scenes.length,
    totalShots: Object.values(shots).flat().length,
    totalCost,
  });

  return { shots, totalCost };
}

