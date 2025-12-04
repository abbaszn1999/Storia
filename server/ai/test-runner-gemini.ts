import { callAi } from "./service";
import { calculateCostFromUsage } from "./credits/cost-calculators";
import { getModelConfig } from "./config";

async function main() {
  const provider = "gemini";
  const model = "gemini-2.5-flash";

  console.log(`=== Testing ${provider} (${model}) ===`);
  const response = await callAi({
    provider,
    model,
    task: "text-generation",
    payload: {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "List three inspirational quotes about creative teamwork.",
            },
          ],
        },
      ],
    },
  });

  console.log("Output:\n", JSON.stringify(response.output, null, 2));

  if (response.usage) {
    const modelConfig = getModelConfig(provider, model);
    const costUsd = calculateCostFromUsage({
      modelConfig,
      usage: response.usage,
    });

    console.log(
      "\nUsage:",
      JSON.stringify(response.usage, null, 2),
    );
    console.log(`Estimated cost: $${costUsd.toFixed(6)}`);
  } else {
    console.log("\nNo usage data returned from provider.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

