// Myth-Busting Template Entry Point
import { createStoryModeRouter } from "../shared/routes";

export const mbRouter = await createStoryModeRouter("myth-busting");
export default mbRouter;

// Re-export types from shared
export * from "../shared/types";
export * from "./config";
