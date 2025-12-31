// Before-After Template Entry Point
import { createStoryModeRouter } from "../shared/routes";

export const baRouter = await createStoryModeRouter("before-after");
export default baRouter;

// Re-export types from shared
export * from "../shared/types";
export * from "./config";
