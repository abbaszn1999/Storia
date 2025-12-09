import { Router, type Request, type Response } from "express";
import { isAuthenticated, getCurrentUserId } from "../../../auth";
import { generateProblemSolutionIdea } from "../agents/idea-generator";
import type { ProblemSolutionIdeaRequest, ProblemSolutionIdeaResponse } from "../types";

const psRouter = Router();

/**
 * POST /api/problem-solution/idea
 * Triggered by the existing “Generate Script with AI” button.
 * Requires ideaText (frontend keeps button disabled until filled).
 */
psRouter.post(
  "/idea",
  isAuthenticated,
  async (req: Request<unknown, unknown, ProblemSolutionIdeaRequest>, res: Response<ProblemSolutionIdeaResponse>) => {
    try {
      const userId = getCurrentUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" } as any);
      }

      const { ideaText, durationSeconds, aspectRatio } = req.body || {};

      if (!ideaText || !ideaText.trim()) {
        return res.status(400).json({ error: "ideaText is required" } as any);
      }

      const result = await generateProblemSolutionIdea(
        {
          ideaText: ideaText.trim(),
          durationSeconds: durationSeconds || 45,
          aspectRatio: aspectRatio || "vertical",
        },
        userId,
        req.headers["x-workspace-id"] as string | undefined
      );

      res.json({
        idea: result.idea,
        hook: result.hook,
        angles: result.angles,
        cta: result.cta,
        cost: result.cost,
      });
    } catch (error) {
      console.error("[problem-solution:routes] idea error:", error);
      res.status(500).json({ error: "Failed to generate idea" } as any);
    }
  }
);

export { psRouter };
export default psRouter;
