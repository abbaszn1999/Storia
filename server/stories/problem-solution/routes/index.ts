import { Router, type Request, type Response } from "express";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { generateStory } from "../agents/idea-generator";
import { generateScenes } from "../agents/scene-generator";

const psRouter = Router();

/**
 * POST /api/problem-solution/idea
 * Generates a story from idea text
 */
psRouter.post(
  "/idea",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { ideaText, durationSeconds, aspectRatio } = req.body || {};

      if (!ideaText || !ideaText.trim()) {
        return res.status(400).json({ error: "ideaText is required" });
      }

      const result = await generateStory(
        {
          ideaText: ideaText.trim(),
          durationSeconds: durationSeconds || 30,
          aspectRatio: aspectRatio || "9:16",
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      res.json({
        story: result.story,
        cost: result.cost,
      });
    } catch (error) {
      console.error("[problem-solution:routes] story generation error:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  }
);

/**
 * POST /api/problem-solution/scenes
 * Generates scene breakdown from story
 */
psRouter.post(
  "/scenes",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { storyText, duration, aspectRatio, voiceoverEnabled, imageMode } = req.body || {};

      if (!storyText || !storyText.trim()) {
        return res.status(400).json({ error: "storyText is required" });
      }

      const result = await generateScenes(
        {
          storyText: storyText.trim(),
          duration: duration || 30,
          aspectRatio: aspectRatio || "9:16",
          voiceoverEnabled: voiceoverEnabled ?? true,
          imageMode: imageMode || "none",
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      res.json(result);
    } catch (error) {
      console.error("[problem-solution:routes] scene generation error:", error);
      res.status(500).json({ error: "Failed to generate scenes" });
    }
  }
);

export { psRouter };
export default psRouter;
