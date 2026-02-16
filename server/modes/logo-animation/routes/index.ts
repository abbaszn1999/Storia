// Logo Animation API Routes

import { Router, type Request, type Response } from "express";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { generateLogoAnimation } from "../generator";
import { generateLogoIdea } from "../agents";
import type { LogoGenerateRequest } from "../types";

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// IDEA GENERATION ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/videos/logo-animation/generate-idea
 * Generate a creative visual prompt for logo animation
 */
router.post("/generate-idea", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { idea, duration, referenceImage } = req.body;

    // Validate required fields
    if (!idea || typeof idea !== "string" || !idea.trim()) {
      return res.status(400).json({ error: "Idea is required" });
    }

    if (!duration || ![4, 6, 8].includes(Number(duration))) {
      return res.status(400).json({ error: "Duration must be 4, 6, or 8 seconds" });
    }

    // Generate visual prompt
    const result = await generateLogoIdea(
      {
        idea: idea.trim(),
        duration: Number(duration),
        referenceImage: referenceImage || undefined,
      },
      userId,
      req.headers['x-workspace-id'] as string | undefined,
      'video',
      'logo-animation'
    );

    res.json({
      visualPrompt: result.visualPrompt,
      cost: result.cost,
    });
  } catch (error) {
    console.error("[logo-animation:routes] Generate idea error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate idea",
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/videos/logo-animation/generate
 * Start logo animation video generation
 */
router.post("/generate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      title,
      workspaceId,
      visualPrompt,
      referenceImage,
      aspectRatio,
      resolution,
      duration,
    } = req.body;

    // Validate required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!workspaceId || typeof workspaceId !== "string") {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    if (!visualPrompt || typeof visualPrompt !== "string" || !visualPrompt.trim()) {
      return res.status(400).json({ error: "Visual prompt is required" });
    }

    if (!aspectRatio || !resolution || !duration) {
      return res.status(400).json({ error: "Aspect ratio, resolution, and duration are required" });
    }

    const request: LogoGenerateRequest = {
      title: title.trim(),
      workspaceId,
      visualPrompt: visualPrompt.trim(),
      referenceImage,
      aspectRatio,
      resolution,
      duration: Number(duration),
    };

    console.log("[logo-animation:routes] Starting video generation...");

    // Call generateLogoAnimation and wait for it to complete (synchronous, like stories mode)
    const result = await generateLogoAnimation(
      request,
      userId,
      req.headers['x-workspace-id'] as string | undefined,
      'video',
      'logo-animation'
    );

    console.log("[logo-animation:routes] Video generation completed:", {
      taskId: result.taskId,
      hasVideoUrl: !!result.videoUrl,
      hasStoryId: !!result.storyId,
      cost: result.cost,
    });

    // Return the result directly (no polling needed)
    res.json({
      taskId: result.taskId,
      status: "completed",
      videoUrl: result.videoUrl,
      storyId: result.storyId,
      cost: result.cost,
    });
  } catch (error) {
    console.error("[logo-animation:routes] Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to start generation",
    });
  }
});

/**
 * GET /api/videos/logo-animation/status/:taskId
 * Status endpoint is no longer used - generation is now synchronous
 * Kept for backward compatibility but returns error
 */
router.get("/status/:taskId", isAuthenticated, async (req: Request, res: Response) => {
  res.status(410).json({
    error: "Status endpoint is no longer used. Generation is now synchronous.",
    taskId: req.params.taskId,
  });
});

export default router;

