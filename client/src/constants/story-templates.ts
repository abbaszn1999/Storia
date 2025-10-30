export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  type: 'narrative' | 'direct';
  iconColor: string;
  structure?: string[];
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'problem-solution',
    name: 'Problem-Solution',
    description: 'Present a problem and show how your product/idea solves it.',
    type: 'narrative',
    iconColor: 'from-yellow-500 to-orange-500',
    structure: ['Hook', 'Problem', 'Solution', 'Call-to-Action'],
  },
  {
    id: 'tease-reveal',
    name: 'Tease & Reveal',
    description: 'Build curiosity with a teaser, then reveal the answer or product.',
    type: 'narrative',
    iconColor: 'from-purple-500 to-pink-500',
    structure: ['Hook', 'Tease', 'Buildup', 'Reveal'],
  },
  {
    id: 'before-after',
    name: 'Before & After',
    description: 'Showcase a transformation. Great for tutorials or testimonials.',
    type: 'narrative',
    iconColor: 'from-blue-500 to-cyan-500',
    structure: ['Before State', 'Transformation', 'After State', 'Results'],
  },
  {
    id: 'myth-busting',
    name: 'Myth-Busting',
    description: 'Address a common misconception and reveal the truth.',
    type: 'narrative',
    iconColor: 'from-red-500 to-orange-500',
    structure: ['Common Myth', "Why It's Wrong", 'The Truth', 'Takeaway'],
  },
  {
    id: 'asmr-sensory',
    name: 'ASMR / Sensory',
    description: 'Focus on satisfying sounds and visuals. No complex script needed.',
    type: 'direct',
    iconColor: 'from-teal-500 to-green-500',
  },
];

export const IMAGE_EFFECTS = [
  { id: 'fade', name: 'Fade', description: 'Smooth fade transition' },
  { id: 'ken-burns', name: 'Ken Burns', description: 'Slow zoom effect' },
  { id: 'pan-left', name: 'Pan Left', description: 'Slide from right to left' },
  { id: 'pan-right', name: 'Pan Right', description: 'Slide from left to right' },
  { id: 'zoom-in', name: 'Zoom In', description: 'Zoom towards center' },
  { id: 'zoom-out', name: 'Zoom Out', description: 'Zoom away from center' },
];
