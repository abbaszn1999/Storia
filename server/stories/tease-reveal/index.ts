// Tease-Reveal Template Entry Point
import { createStoryModeRouter } from "../shared/routes";

export const trRouter = await createStoryModeRouter("tease-reveal");
export default trRouter;

// Re-export types from shared
export * from "../shared/types";
export * from "./config";
