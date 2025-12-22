/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARED SOCIAL MEDIA ROUTES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Unified social media API routes for all story modes:
 * - POST /api/stories/social/metadata - Generate AI metadata
 * 
 * Note: Publishing is handled via the Late.dev routes in workspaces:
 * - POST /api/workspaces/:id/late/publish
 */

import { Router, type Request, type Response } from "express";
import { isAuthenticated, getCurrentUserId } from "../../../../auth";
import { generateSocialMetadata } from "../agents/metadata-generator";
import type { SocialPlatform } from "../types";

const socialRouter = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// METADATA GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/stories/social/metadata
 * Generates platform-specific metadata for social media
 */
socialRouter.post(
  "/metadata",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { platform, scriptText, duration } = req.body || {};

      // Validate platform
      const validPlatforms: SocialPlatform[] = ['youtube', 'tiktok', 'instagram', 'facebook'];
      if (!platform || !validPlatforms.includes(platform)) {
        return res.status(400).json({ 
          error: "Invalid platform. Must be one of: youtube, tiktok, instagram, facebook" 
        });
      }

      if (!scriptText || !scriptText.trim()) {
        return res.status(400).json({ error: "scriptText is required" });
      }

      if (!duration || duration < 1) {
        return res.status(400).json({ error: "duration is required and must be > 0" });
      }

      console.log('[shared:social:routes] Generating social metadata:', {
        platform,
        scriptLength: scriptText.length,
        duration,
      });

      const result = await generateSocialMetadata(
        { platform, scriptText, duration },
        userId
      );

      console.log('[shared:social:routes] Metadata generated successfully');
      res.json(result);
    } catch (error) {
      console.error("[shared:social:routes] Error generating metadata:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to generate metadata",
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

socialRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    module: "shared-social",
    endpoints: ["/metadata"],
  });
});

export { socialRouter };

