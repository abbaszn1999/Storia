// Auto-ASMR Template Entry Point
import { createStoryModeRouter } from "../shared/routes";

export const autoAsmrRouter = await createStoryModeRouter("auto-asmr");
export default autoAsmrRouter;

// Re-export types from shared
export * from "../shared/types";
export * from "./config";
