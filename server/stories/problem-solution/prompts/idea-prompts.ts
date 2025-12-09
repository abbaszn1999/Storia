// Problem-Solution Idea Prompts
// Builds prompt payloads for the Problem-Solution idea agent

export const PROBLEM_SOLUTION_SYSTEM_PROMPT = `
You are an expert short-form video ideation coach.
You specialize in the Problem → Agitation → Solution structure with a sharp hook
and a concise CTA. Your output must be brief and actionable.

Always keep content platform-friendly and avoid sensitive or medical claims.
`;

export function buildIdeaUserPrompt(
  ideaText: string,
  durationSeconds: number,
  aspectRatio: string
): string {
  const durationHint =
    durationSeconds <= 20
      ? "Ultra-brief: 15-20s, 2-3 sentences total."
      : durationSeconds <= 45
      ? "Compact: ~45s, 3-4 sentences."
      : "Longer short-form: ~60s, up to 5-6 sentences.";

  return [
    `User idea: ${ideaText.trim()}`,
    `Desired duration: ${durationSeconds}s (${durationHint})`,
    `Aspect ratio / platform style: ${aspectRatio}`,
    `Return a JSON-friendly outline with:`,
    `- idea: a one-line improved topic`,
    `- hook: a punchy opener (max 120 chars)`,
    `- angles: 3 bullet ideas (each <= 2 short sentences)`,
    `- cta: a concise call-to-action`,
  ].join("\n");
}

