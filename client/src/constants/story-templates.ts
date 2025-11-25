export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  type: 'narrative' | 'direct';
  iconColor: string;
  structure?: string[];
  estimatedDuration: string;
  useCases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popular?: boolean;
  category: 'marketing' | 'educational' | 'entertainment' | 'product';
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'problem-solution',
    name: 'Problem-Solution',
    description: 'Present a problem and show how your product/idea solves it.',
    type: 'narrative',
    iconColor: 'from-amber-500 to-orange-600',
    structure: ['Hook', 'Problem', 'Solution', 'Call-to-Action'],
    estimatedDuration: '30-60s',
    useCases: ['Product launches', 'Service demos', 'Pain point marketing'],
    difficulty: 'beginner',
    popular: true,
    category: 'marketing',
  },
  {
    id: 'tease-reveal',
    name: 'Tease & Reveal',
    description: 'Build curiosity with a teaser, then reveal the answer or product.',
    type: 'narrative',
    iconColor: 'from-violet-500 to-fuchsia-500',
    structure: ['Hook', 'Tease', 'Buildup', 'Reveal'],
    estimatedDuration: '15-45s',
    useCases: ['Product reveals', 'Announcements', 'Mystery content'],
    difficulty: 'intermediate',
    popular: true,
    category: 'marketing',
  },
  {
    id: 'before-after',
    name: 'Before & After',
    description: 'Showcase a transformation. Great for tutorials or testimonials.',
    type: 'narrative',
    iconColor: 'from-blue-500 to-cyan-500',
    structure: ['Before State', 'Transformation', 'After State', 'Results'],
    estimatedDuration: '30-90s',
    useCases: ['Testimonials', 'Tutorials', 'Case studies'],
    difficulty: 'beginner',
    category: 'educational',
  },
  {
    id: 'myth-busting',
    name: 'Myth-Busting',
    description: 'Address a common misconception and reveal the truth.',
    type: 'narrative',
    iconColor: 'from-rose-500 to-orange-500',
    structure: ['Common Myth', "Why It's Wrong", 'The Truth', 'Takeaway'],
    estimatedDuration: '30-60s',
    useCases: ['Educational content', 'Industry insights', 'Thought leadership'],
    difficulty: 'intermediate',
    category: 'educational',
  },
  {
    id: 'asmr-sensory',
    name: 'ASMR / Sensory',
    description: 'Focus on satisfying sounds and visuals. No complex script needed.',
    type: 'direct',
    iconColor: 'from-emerald-500 to-teal-500',
    estimatedDuration: '15-60s',
    useCases: ['Product showcases', 'Relaxation content', 'Visual appeal'],
    difficulty: 'beginner',
    category: 'entertainment',
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
