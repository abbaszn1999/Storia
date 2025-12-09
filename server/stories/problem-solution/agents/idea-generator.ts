import { callTextModel } from "../../../ai/service";
import { PROBLEM_SOLUTION_SYSTEM_PROMPT, buildIdeaUserPrompt } from "../prompts/idea-prompts";

export interface ProblemSolutionIdeaInput {
  ideaText: string; // required (button disabled until filled)
  durationSeconds: number;
  aspectRatio: string;
}

export interface ProblemSolutionIdeaOutput {
  idea: string;
  hook: string;
  angles: string[];
  cta: string;
  cost?: number;
}

const IDEA_CONFIG = {
  provider: "openai" as const,
  model: "gpt-5",
};

export async function generateProblemSolutionIdea(
  input: ProblemSolutionIdeaInput,
  userId?: string,
  workspaceId?: string
): Promise<ProblemSolutionIdeaOutput> {
  const { ideaText, durationSeconds, aspectRatio } = input;

  const userPrompt = buildIdeaUserPrompt(ideaText, durationSeconds, aspectRatio);

  try {
    const response = await callTextModel(
      {
        provider: IDEA_CONFIG.provider,
        model: IDEA_CONFIG.model,
        payload: {
          reasoning: { effort: "low" },
          input: [
            { role: "system", content: PROBLEM_SOLUTION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        },
        userId,
        workspaceId,
      },
      {
        expectedOutputTokens: 400,
      }
    );

    const raw = response.output.trim();

    // Minimal parse: expect lines; fallback to defaults if parse fails
    const parsed = safeParse(raw, ideaText);

    return {
      ...parsed,
      cost: response.usage?.totalCostUsd,
    };
  } catch (error) {
    console.error("[problem-solution:idea-generator] Failed to generate idea:", error);
    // Fallback: return the original idea with simple hook/angles
    return {
      idea: ideaText,
      hook: "Here’s a quick way to solve this problem.",
      angles: [
        "State the problem and why it’s painful.",
        "Reveal the key solution in one step.",
        "CTA: try it now and share results.",
      ],
      cta: "Try it now and share your results.",
    };
  }
}

function safeParse(raw: string, fallbackIdea: string): Omit<ProblemSolutionIdeaOutput, "cost"> {
  try {
    // Heuristic: try JSON parse first
    const maybeJson = raw.trim();
    if (maybeJson.startsWith("{") || maybeJson.startsWith("[")) {
      const data = JSON.parse(maybeJson);
      return {
        idea: data.idea || fallbackIdea,
        hook: data.hook || "Here’s a quick way to solve this problem.",
        angles: data.angles || [],
        cta: data.cta || "Try it now.",
      };
    }
  } catch (_) {
    // ignore
  }

  // Fallback: split lines
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const idea = lines[0] || fallbackIdea;
  const hook = lines.find((l) => l.toLowerCase().startsWith("hook")) || lines[1] || "Here’s a quick way to solve this problem.";
  const cta = lines.find((l) => l.toLowerCase().includes("cta")) || "Try it now.";
  const angles = lines.slice(1, 4);

  return {
    idea,
    hook,
    angles,
    cta,
  };
}

