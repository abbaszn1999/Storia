import { callTextModel } from "./service";
import { calculateCostFromUsage } from "./credits/cost-calculators";
import { getModelConfig } from "./config";

async function main() {
  const provider = "openai";
  const model = "gpt-5-nano";

  console.log(`=== Testing ${provider} (${model}) ===`);
  const response = await callTextModel({
    provider,
    model,
    cache: {
      key: "ai-test-runner",
    },
    payload: {
      instructions: "You are a concise copywriter.",
      input: [
        {
          role: "user",
          content: "Write a catchy tagline for an eco-friendly water bottle.",
        },
      ],
    },
  });

  console.log("Output:\n", response.output);

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

