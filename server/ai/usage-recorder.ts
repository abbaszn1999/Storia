import { storage } from "../storage";

export interface RecordUsageOptions {
  userId: string;
  workspaceId?: string;
  type: string; // "video" | "story" | "assets"
  mode: string; // "ambient" | "problem-solution" | "character" | "location" etc
  provider: string;
  modelName: string;
  estimatedCostUsd: number;
  creditsDeducted: number;
}

export async function recordUsage(options: RecordUsageOptions): Promise<void> {
  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().slice(0, 5); // HH:mm

    await storage.createUsage({
      userId: options.userId,
      workspaceId: options.workspaceId,
      date,
      time,
      type: options.type,
      mode: options.mode,
      modelName: options.modelName,
      provider: options.provider,
      estimatedCostUsd: options.estimatedCostUsd.toFixed(6),
      creditsDeducted: options.creditsDeducted, // Store exact decimal value
    });
  } catch (error) {
    // Don't throw on usage recording failure - just log it
    // The AI call should succeed even if analytics fail
    console.error("[usage-recorder] Failed to record usage:", error);
  }
}
