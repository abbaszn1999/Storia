import type { TemplateStructure } from '../types';

// Template definitions
export const TEMPLATE_STRUCTURES: Record<string, TemplateStructure> = {
  'problem-solution': {
    id: 'problem-solution',
    name: 'Problem-Solution',
    stages: ['Hook', 'Problem', 'Solution', 'Call-to-Action'],
    minScenes: 3,
    maxScenes: 7,
    optimalSceneCount: 4,
  },
  'tease-reveal': {
    id: 'tease-reveal',
    name: 'Tease & Reveal',
    stages: ['Hook', 'Tease', 'Buildup', 'Reveal'],
    minScenes: 3,
    maxScenes: 6,
    optimalSceneCount: 4,
  },
  'before-after': {
    id: 'before-after',
    name: 'Before & After',
    stages: ['Before State', 'Transformation', 'After State', 'Results'],
    minScenes: 4,
    maxScenes: 8,
    optimalSceneCount: 4,
  },
  'myth-busting': {
    id: 'myth-busting',
    name: 'Myth-Busting',
    stages: ['Common Myth', 'Why It\'s Wrong', 'The Truth', 'Takeaway'],
    minScenes: 3,
    maxScenes: 7,
    optimalSceneCount: 4,
  },
};

export function getTemplateStructure(template: string): TemplateStructure | undefined {
  return TEMPLATE_STRUCTURES[template];
}
