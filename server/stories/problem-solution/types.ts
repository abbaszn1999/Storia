export interface ProblemSolutionIdeaRequest {
  ideaText: string;
  durationSeconds?: number;
  aspectRatio?: string;
}

export interface ProblemSolutionIdeaResponse {
  idea: string;
  hook: string;
  angles: string[];
  cta: string;
  cost?: number;
}
