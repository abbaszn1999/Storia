/**
 * ElevenLabs Sound Effects Test Runner
 * 
 * Tests the ElevenLabs Sound Effects API integration.
 * 
 * Usage:
 *   npx tsx server/ai/test-runner-elevenlabs.ts
 * 
 * Prerequisites:
 *   - Set ELEVENLABS_API_KEY in .env
 */

import { callAi } from "./service";
import { calculateCostFromUsage } from "./credits/cost-calculators";
import { getModelConfig } from "./config";
import fs from "fs";
import path from "path";

async function main() {
  const provider = "elevenlabs";
  const model = "sound-effects";

  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  ElevenLabs Sound Effects Test`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Test 1: Simple sound effect
  console.log("Test 1: Generating cinematic sound effect...\n");
  
  try {
    const response = await callAi({
      provider,
      model,
      task: "sound-effects",
      payload: {
        text: "Cinematic Braam, Horror",
        duration_seconds: 3,
        prompt_influence: 0.5,
      },
    });

    console.log("✓ Sound effect generated successfully!\n");

    // Log output details
    const output = response.output as {
      audio_base64: string;
      format: string;
      content_type: string;
      size_bytes: number;
    };

    console.log("Output Details:");
    console.log("  - Format:", output.format);
    console.log("  - Content-Type:", output.content_type);
    console.log("  - Size:", (output.size_bytes / 1024).toFixed(2), "KB");
    console.log("  - Base64 length:", output.audio_base64.length, "chars");

    // Save audio file for verification
    const outputDir = path.join(process.cwd(), "test-outputs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `elevenlabs-sfx-test.${output.format}`);
    const audioBuffer = Buffer.from(output.audio_base64, "base64");
    fs.writeFileSync(outputPath, audioBuffer);
    console.log("  - Saved to:", outputPath);

    // Calculate cost
    if (response.usage) {
      const modelConfig = getModelConfig(provider, model);
      const costUsd = calculateCostFromUsage({
        modelConfig,
        usage: response.usage,
      });

      console.log("\nUsage & Cost:");
      console.log("  - Total Cost:", `$${costUsd.toFixed(4)}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  ✓ All tests passed!");
    console.log("═══════════════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("✗ Test failed!\n");
    console.error("Error:", error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes("Missing API key")) {
      console.log("\n💡 Make sure ELEVENLABS_API_KEY is set in your .env file");
    }
    
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

