/**
 * Problem-Solution Template Structure
 * 
 * Stage 1: Hook (3-5s)
 *   - Grab attention immediately
 *   - Introduce relatable problem or question
 * 
 * Stage 2: Problem (8-12s)
 *   - Elaborate on the problem
 *   - Make it relatable and emotional
 *   - Build pain points
 * 
 * Stage 3: Solution (12-18s)
 *   - Present the solution clearly
 *   - Show benefits and value
 *   - Demonstrate how it works
 * 
 * Stage 4: Call-to-Action (3-5s)
 *   - Clear, actionable CTA
 *   - Create urgency
 *   - Make it shareable
 */

export const PROBLEM_SOLUTION_STRUCTURE = {
  stages: [
    {
      name: 'Hook',
      minDuration: 3,
      maxDuration: 5,
      purpose: 'Grab attention',
    },
    {
      name: 'Problem',
      minDuration: 8,
      maxDuration: 12,
      purpose: 'Build pain points',
    },
    {
      name: 'Solution',
      minDuration: 12,
      maxDuration: 18,
      purpose: 'Present solution',
    },
    {
      name: 'Call-to-Action',
      minDuration: 3,
      maxDuration: 5,
      purpose: 'Drive action',
    },
  ],
};
