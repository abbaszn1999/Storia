export interface ASMRCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconColor: string;
  suggestedVisualPrompt: string;
  suggestedSoundPrompt: string;
  materials: string[];
  exampleSounds: string[];
}

export interface ASMRMaterial {
  id: string;
  name: string;
  category: string;
  soundHint: string;
}

export interface AmbientBackground {
  id: string;
  name: string;
  description: string;
}

export const ASMR_CATEGORIES: ASMRCategory[] = [
  {
    id: 'food',
    name: 'Food & Cooking',
    description: 'Slicing, sizzling, crunching, and cooking sounds',
    icon: 'UtensilsCrossed',
    iconColor: 'from-orange-500 to-amber-500',
    suggestedVisualPrompt: 'Close-up shot of hands preparing food on a clean marble surface, soft lighting, shallow depth of field',
    suggestedSoundPrompt: 'Crisp cutting sounds, satisfying slicing, ASMR quality audio with clear high-fidelity food preparation sounds',
    materials: ['food-crispy', 'food-soft', 'food-liquid', 'water', 'glass', 'metal'],
    exampleSounds: ['Slicing vegetables', 'Sizzling pan', 'Crunching chips', 'Pouring liquid'],
  },
  {
    id: 'triggers',
    name: 'Classic Triggers',
    description: 'Tapping, scratching, brushing, and clicking sounds',
    icon: 'Hand',
    iconColor: 'from-violet-500 to-purple-500',
    suggestedVisualPrompt: 'Elegant hands with manicured nails gently interacting with objects, soft bokeh background, intimate close-up',
    suggestedSoundPrompt: 'Gentle tapping sounds, soft scratching textures, delicate fingernail interactions, binaural ASMR quality',
    materials: ['wood', 'glass', 'plastic', 'metal', 'fabric', 'leather'],
    exampleSounds: ['Fingernail tapping', 'Soft scratching', 'Keyboard typing', 'Brush strokes'],
  },
  {
    id: 'nature',
    name: 'Nature & Ambient',
    description: 'Rain, forest, ocean, and natural soundscapes',
    icon: 'TreePine',
    iconColor: 'from-emerald-500 to-green-500',
    suggestedVisualPrompt: 'Serene nature scene with gentle movement, morning light filtering through, peaceful and calming atmosphere',
    suggestedSoundPrompt: 'Immersive nature sounds, gentle ambient audio, peaceful environmental soundscape, high-quality field recording style',
    materials: ['water', 'sand', 'wood', 'paper'],
    exampleSounds: ['Rainfall on leaves', 'Ocean waves', 'Crackling fire', 'Wind through trees'],
  },
  {
    id: 'crafts',
    name: 'Crafts & Making',
    description: 'Clay, slime, art supplies, and creative making',
    icon: 'Palette',
    iconColor: 'from-pink-500 to-rose-500',
    suggestedVisualPrompt: 'Hands creating art or craft, vibrant colors, satisfying textures, well-lit workspace with creative materials',
    suggestedSoundPrompt: 'Satisfying squelching, stretching sounds, tactile material manipulation, soothing creative process audio',
    materials: ['clay', 'slime', 'paper', 'sand', 'soap', 'foam'],
    exampleSounds: ['Slime stretching', 'Clay molding', 'Paper folding', 'Paint mixing'],
  },
  {
    id: 'unboxing',
    name: 'Unboxing & Products',
    description: 'Package opening, product reveals, and tactile interactions',
    icon: 'Package',
    iconColor: 'from-sky-500 to-blue-500',
    suggestedVisualPrompt: 'Elegant product unboxing on clean surface, premium packaging, careful hands revealing contents, soft ambient lighting',
    suggestedSoundPrompt: 'Crisp packaging sounds, tape peeling, cardboard opening, satisfying product reveal audio, premium unboxing experience',
    materials: ['cardboard', 'bubble-wrap', 'paper', 'plastic', 'foam'],
    exampleSounds: ['Tape peeling', 'Bubble wrap popping', 'Box opening', 'Tissue rustling'],
  },
];

export const ASMR_MATERIALS: ASMRMaterial[] = [
  { id: 'wood', name: 'Wood', category: 'solid', soundHint: 'hollow tapping, warm resonance' },
  { id: 'glass', name: 'Glass', category: 'solid', soundHint: 'clear tapping, crisp clinking' },
  { id: 'metal', name: 'Metal', category: 'solid', soundHint: 'metallic ringing, sharp taps' },
  { id: 'plastic', name: 'Plastic', category: 'solid', soundHint: 'soft clicks, muted tapping' },
  { id: 'fabric', name: 'Fabric/Cloth', category: 'soft', soundHint: 'soft rustling, gentle swishing' },
  { id: 'leather', name: 'Leather', category: 'soft', soundHint: 'creaking, smooth rubbing' },
  { id: 'paper', name: 'Paper', category: 'soft', soundHint: 'crisp crinkling, page turning' },
  { id: 'cardboard', name: 'Cardboard', category: 'soft', soundHint: 'muted tapping, scratchy texture' },
  { id: 'water', name: 'Water', category: 'liquid', soundHint: 'splashing, droplets, pouring' },
  { id: 'slime', name: 'Slime', category: 'tactile', soundHint: 'squelching, stretching, popping' },
  { id: 'clay', name: 'Clay', category: 'tactile', soundHint: 'molding, pressing, smooth shaping' },
  { id: 'sand', name: 'Sand/Kinetic Sand', category: 'tactile', soundHint: 'satisfying crumbling, flowing' },
  { id: 'soap', name: 'Soap', category: 'tactile', soundHint: 'cutting, carving, shaving' },
  { id: 'foam', name: 'Foam', category: 'tactile', soundHint: 'squeaking, pressing, releasing' },
  { id: 'bubble-wrap', name: 'Bubble Wrap', category: 'packaging', soundHint: 'satisfying popping' },
  { id: 'food-crispy', name: 'Crispy Food', category: 'food', soundHint: 'crunching, breaking, snapping' },
  { id: 'food-soft', name: 'Soft Food', category: 'food', soundHint: 'slicing, spreading, squishing' },
  { id: 'food-liquid', name: 'Liquid/Sauce', category: 'food', soundHint: 'pouring, drizzling, bubbling' },
];

export const AMBIENT_BACKGROUNDS: AmbientBackground[] = [
  { id: 'none', name: 'None', description: 'No background ambience' },
  { id: 'soft-rain', name: 'Soft Rain', description: 'Gentle rainfall in the background' },
  { id: 'fireplace', name: 'Fireplace', description: 'Crackling fire ambience' },
  { id: 'forest', name: 'Forest', description: 'Birds and gentle wind' },
  { id: 'ocean', name: 'Ocean Waves', description: 'Distant waves on shore' },
  { id: 'cafe', name: 'Cafe Ambience', description: 'Soft chatter and coffee sounds' },
  { id: 'night', name: 'Night Sounds', description: 'Crickets and evening atmosphere' },
  { id: 'white-noise', name: 'White Noise', description: 'Subtle static background' },
];

export const SOUND_INTENSITIES = [
  { id: 'subtle', name: 'Subtle', description: 'Soft, barely audible sounds' },
  { id: 'moderate', name: 'Moderate', description: 'Clear but not overpowering' },
  { id: 'pronounced', name: 'Pronounced', description: 'Bold, emphasized sounds' },
];

export const VIDEO_MODELS = [
  { value: 'veo3', label: 'Veo 3 (Google)', generatesAudio: true, description: 'Best quality with native audio' },
  { value: 'runway-gen3', label: 'Runway Gen-3', generatesAudio: true, description: 'Cinematic quality with audio' },
  { value: 'kling', label: 'Kling AI', generatesAudio: false, description: 'Fast generation, no audio' },
  { value: 'luma', label: 'Luma Dream Machine', generatesAudio: false, description: 'Creative motion, no audio' },
  { value: 'pika', label: 'Pika Labs', generatesAudio: false, description: 'Stylized motion, no audio' },
  { value: 'stable-video', label: 'Stable Video Diffusion', generatesAudio: false, description: 'Open source, no audio' },
];

export const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 Vertical', description: 'TikTok, Reels, Shorts' },
  { value: '16:9', label: '16:9 Horizontal', description: 'YouTube, Desktop' },
  { value: '1:1', label: '1:1 Square', description: 'Instagram Posts' },
  { value: '4:5', label: '4:5 Portrait', description: 'Instagram Feed' },
];

export const DURATION_OPTIONS = [
  { value: '5', label: '5 seconds', description: 'Quick loop' },
  { value: '10', label: '10 seconds', description: 'Short clip' },
  { value: '15', label: '15 seconds', description: 'Standard short' },
  { value: '30', label: '30 seconds', description: 'Extended clip' },
  { value: '60', label: '60 seconds', description: 'Full minute' },
];
