import { Router } from "express";
import { isAuthenticated, getCurrentUserId } from "../auth";
import { storage } from "../storage";

const router = Router();

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workspaceId = req.headers['x-workspace-id'] as string;
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID required" });
    }

    const { startDate, endDate, type } = req.query;

    const usage = await storage.getUsageByWorkspace(userId, workspaceId, {
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as string,
    });

    res.json({ usage });
  } catch (error) {
    console.error("[usage-routes] Error fetching usage:", error);
    res.status(500).json({ error: "Failed to fetch usage data" });
  }
});

export default router;
