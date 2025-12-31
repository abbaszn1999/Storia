// Problem-Solution Template Entry Point
import { createStoryModeRouter } from "../shared/routes";

export const psRouter = await createStoryModeRouter("problem-solution");
export default psRouter;

// Re-export types from shared
export * from "../shared/types";
export * from "./config";
