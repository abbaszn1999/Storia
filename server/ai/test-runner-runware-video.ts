import { randomUUID } from "crypto";
import { callAi } from "./service";
import { getRunwareModelId } from "./config";

async function main() {
  if (!process.env.RUNWARE_API_KEY) {
    console.error("RUNWARE_API_KEY is missing");
    process.exit(1);
  }

  // Use friendly model name - will be mapped to actual AIR ID
  const friendlyModelName = "hailuo-2.3"; // minimax:4@1 - cheapest video model
  const runwareModelId = getRunwareModelId(friendlyModelName);

  console.log(`Using model: ${friendlyModelName} → ${runwareModelId}`);

  const response = await callAi({
    provider: "runware",
    model: friendlyModelName, // For config lookup
    task: "video-generation",
    payload: [
      {
        taskType: "videoInference",
        taskUUID: randomUUID(),
        positivePrompt:
          "A cinematic drone shot flying over snowy mountains at sunrise",
        model: runwareModelId, // Use actual AIR ID in payload
        duration: 6, // Hailuo default is 6s
        numberResults: 1,
        deliveryMethod: "async",
        includeCost: true,
      },
    ],
    runware: { deliveryMethod: "async", timeoutMs: 180000 },
  });

  console.log("Video result:", JSON.stringify(response.output, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

