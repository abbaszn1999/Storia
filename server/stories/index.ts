// Stories Mode - Main Router (Express)
// Combines all story template routes

import { Router, type Request, type Response } from "express";
import { asmrRouter } from "./asmr-sensory";
import { socialRouter } from "./shared/social";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN STORIES ROUTER
// ═══════════════════════════════════════════════════════════════════════════

const storiesRouter = Router();

// Mount ASMR routes
storiesRouter.use("/asmr", asmrRouter);

// Mount shared social media routes
// These are available to all story modes at /api/stories/social/*
storiesRouter.use("/social", socialRouter);

// Future template routes will be added here:
// storiesRouter.use("/problem-solution", problemSolutionRouter);
// storiesRouter.use("/tease-reveal", teaseRevealRouter);
// storiesRouter.use("/before-after", beforeAfterRouter);
// storiesRouter.use("/myth-busting", mythBustingRouter);

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

storiesRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    module: "stories",
    templates: ["asmr-sensory"],
    shared: ["social"],
  });
});

export { storiesRouter };
export default storiesRouter;
