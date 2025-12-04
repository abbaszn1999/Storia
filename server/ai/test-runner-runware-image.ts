import { randomUUID } from "crypto";
import { callAi } from "./service";
import { getRunwareModelId } from "./config";

async function main() {
  if (!process.env.RUNWARE_API_KEY) {
    console.error("RUNWARE_API_KEY is missing");
    process.exit(1);
  }

  // Use friendly model name - will be mapped to "runware:100@1"
  // Note: Third-party models (gpt-image-1, midjourney, etc.) require $5+ balance
  const friendlyModelName = "nano-banana-2-pro";
  const runwareModelId = getRunwareModelId(friendlyModelName);

  console.log(`Using model: ${friendlyModelName} → ${runwareModelId}`);

  const response = await callAi({
    provider: "runware",
    model: friendlyModelName, // Use friendly name for config lookup
    task: "image-generation",
    payload: [
      {
        taskType: "imageInference",
        taskUUID: randomUUID(),
        positivePrompt: "Cyberpunk alley at night, neon rain reflections",
        model: runwareModelId, // Use actual Runware model ID in payload
        numberResults: 1,
        width: 1024,
        height: 1024,
        // Note: Different models support different dimensions
        // Most models support 1024x1024 as a standard size
        includeCost: true,
      },
    ],
    runware: {},
  });

  console.log("Image result:", JSON.stringify(response.output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

