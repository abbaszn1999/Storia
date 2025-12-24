export interface ASMRCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  imageUrl?: string;
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
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop',
    iconColor: 'from-orange-500 to-amber-500',
    suggestedVisualPrompt: 'Cinematic extreme close-up of elegant hands with clean manicured nails slowly slicing through fresh vibrant vegetables on a pristine white marble cutting board, ultra sharp Japanese chef knife catching golden hour light, satisfying precision cuts revealing perfect cross-sections, morning sunlight streaming through kitchen window creating warm volumetric rays, shallow depth of field with creamy bokeh background, slow motion 120fps capturing every juice droplet and fiber separation, steam gently rising, professional food photography lighting setup with soft diffused key light, rich saturated colors, 8K ultra detailed texture of food surfaces, ASMR visual aesthetic, meditative calming atmosphere, studio quality production value',
    suggestedSoundPrompt: 'Crystal clear high-fidelity ASMR audio capturing every crisp cutting sound, satisfying knife through vegetable crunch, juice releasing sounds, gentle chopping rhythm on wooden board, subtle kitchen ambient sounds, binaural 3D spatial audio recording, professional studio microphone quality',
    materials: ['food-crispy', 'food-soft', 'food-liquid', 'water', 'glass', 'metal'],
    exampleSounds: ['Knife cutting', 'Sizzling pan', 'Crunching chips', 'Pouring liquid'],
  },
  {
    id: 'triggers',
    name: 'Classic Triggers',
    description: 'Tapping, scratching, brushing, and clicking sounds',
    icon: 'Hand',
    imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=600&auto=format&fit=crop',
    iconColor: 'from-violet-500 to-purple-500',
    suggestedVisualPrompt: 'Ultra close-up macro shot of beautifully manicured feminine hands with glossy nude nails gently tapping and scratching on luxurious textured surfaces, soft ethereal purple and pink gradient lighting creating dreamy atmosphere, extreme shallow depth of field with silky smooth bokeh orbs floating in background, slow deliberate hypnotic finger movements tracing patterns, alternating between dark polished wood grain texture and frosted glass surface, intimate ASMR perspective as if viewer is inches away, gentle rhythmic tapping creating visual pulse, fingernails catching sparkles of light, velvet fabric underneath, professional studio lighting with soft rim light highlighting finger contours, 4K macro lens detail showing every skin texture and nail reflection, deeply relaxing meditative visual experience',
    suggestedSoundPrompt: 'Delicate binaural ASMR tapping sounds with perfect clarity, soft scratching textures creating tingles, gentle fingernail clicks on glass, hollow wood tapping resonance, fabric brushing whispers, layered multi-textural sound design, professional condenser microphone recording, 3D spatial audio positioning',
    materials: ['wood', 'glass', 'plastic', 'metal', 'fabric', 'leather'],
    exampleSounds: ['Fingernail tapping', 'Soft scratching', 'Glass clicks', 'Brush strokes'],
  },
  {
    id: 'nature',
    name: 'Nature & Ambient',
    description: 'Rain, forest, ocean, and natural soundscapes',
    icon: 'TreePine',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop',
    iconColor: 'from-emerald-500 to-green-500',
    suggestedVisualPrompt: 'Breathtaking cinematic nature scene of gentle rain droplets falling on lush green forest leaves in ultra slow motion, each water bead perfectly formed catching diffused overcast light like tiny diamonds, macro close-up of rain sliding down vibrant emerald leaf surface creating mesmerizing water trails, misty fog rolling through ancient moss-covered trees in background, soft natural daylight filtering through dense canopy creating god rays, peaceful Japanese zen garden aesthetic, dewdrops collecting and dripping from leaf tips, ripples forming in small crystal clear puddle, extreme detail showing leaf veins and water surface tension, tranquil meditation visual, professional nature documentary cinematography, 8K HDR capturing full dynamic range of greens and water reflections, slow graceful camera movement, deeply calming atmospheric scene',
    suggestedSoundPrompt: 'Immersive binaural nature soundscape with gentle rainfall on leaves, soft thunder in distance, forest bird songs, wind through trees, water droplets hitting various surfaces, creek bubbling, authentic field recording quality, layered ambient sound design, spatial 3D audio environment',
    materials: ['water', 'sand', 'wood', 'paper'],
    exampleSounds: ['Rainfall on leaves', 'Ocean waves', 'Crackling fire', 'Wind rustling'],
  },
  {
    id: 'crafts',
    name: 'Crafts & Making',
    description: 'Clay, slime, art supplies, and creative making',
    icon: 'Palette',
    imageUrl: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=600&auto=format&fit=crop',
    iconColor: 'from-pink-500 to-rose-500',
    suggestedVisualPrompt: 'Hypnotic overhead shot of skilled hands slowly manipulating glossy iridescent slime with perfect consistency, stretching and folding in mesmerizing patterns, rainbow holographic shimmer catching studio lights, satisfying texture deformation in extreme slow motion, pristine white workspace with minimalist aesthetic, secondary angle showing slime being pressed into satisfying shapes, bubbles forming and popping, perfect viscosity creating smooth flowing movements, vibrant saturated candy colors - pink purple blue gradient, ASMR crafting visual with professional ring light reflection visible in glossy surface, clean manicured hands with subtle nail art, ultra detailed 4K macro showing every sparkle particle suspended in clear slime, deeply satisfying visual triggers, therapeutic art creation atmosphere, studio production quality lighting',
    suggestedSoundPrompt: 'Deeply satisfying slime ASMR sounds with perfect squelching, stretching, and popping, bubble wrap crushing, clay molding wet sounds, crisp paper folding, kinetic sand crumbling, tactile material manipulation symphony, professional close-mic recording capturing every subtle texture sound',
    materials: ['clay', 'slime', 'paper', 'sand', 'soap', 'foam'],
    exampleSounds: ['Slime stretching', 'Clay molding', 'Paper folding', 'Sand crumbling'],
  },
  {
    id: 'unboxing',
    name: 'Unboxing & Products',
    description: 'Package opening, product reveals, and tactile interactions',
    icon: 'Package',
    imageUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=600&auto=format&fit=crop',
    iconColor: 'from-sky-500 to-blue-500',
    suggestedVisualPrompt: 'Elegant luxury product unboxing experience on pristine matte black surface, soft dramatic lighting from above creating cinematic shadows, beautifully manicured hands slowly peeling premium packaging tape with satisfying precision, high-end minimalist white box with embossed logo being carefully opened, tissue paper rustling and parting to reveal mystery product, extreme close-up of fingers running across textured premium cardboard, magnetic closure clicking open, slow reveal building anticipation, Apple-style product photography aesthetic, shallow depth of field focusing on hands and package, subtle dust particles floating in light beams, ASMR unboxing visual perfection, professional studio setup with soft fill lights, 4K detail showing every packaging texture and material quality, luxurious premium feel, satisfying methodical unwrapping sequence',
    suggestedSoundPrompt: 'Crisp premium packaging ASMR sounds, satisfying tape peeling, cardboard box opening creak, tissue paper crinkling and rustling, magnetic click closure, foam insert removal, product sliding from packaging, material handling sounds, high-fidelity close-microphone recording capturing every subtle crinkle and tap',
    materials: ['cardboard', 'bubble-wrap', 'paper', 'plastic', 'foam'],
    exampleSounds: ['Tape peeling', 'Bubble wrap', 'Box opening', 'Tissue rustling'],
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

// Video model configuration matching backend
export interface VideoModelConfig {
  value: string;
  label: string;
  generatesAudio: boolean;
  description: string;
  durations: number[];
  aspectRatios: string[];
  resolutions: string[];
  supportsFrameImages?: boolean;
  default?: boolean;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Seedance 1.0 Pro (Default) - ByteDance
  // Model AIR ID: bytedance:2@1
  // Duration: 1.2-12 seconds (0.1s increments) | FPS: 24 | Prompt: 2-3000 chars
  // Supports: Text-to-video, Image-to-video
  // Frame Images: ✅ First AND Last frame supported
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'seedance-1.0-pro',
    label: 'Seedance 1.0 Pro',
    generatesAudio: false,
    description: 'ByteDance flagship • 24 FPS • 2-12s • First & Last frame support',
    durations: [2, 4, 5, 6, 8, 10, 12],
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'],
    resolutions: ['480p', '720p', '1080p'],
    supportsFrameImages: true,
    default: true,
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // Seedance 1.5 Pro - ByteDance (Next Generation)
  // Model AIR ID: bytedance:seedance@1.5-pro
  // Duration: 4-12 seconds or "auto" | FPS: 24 | Prompt: 2-3000 chars
  // Supports: Text-to-video, Image-to-video
  // Frame Images: ✅ First AND Last frame supported
  // Audio: ✅ Native synchronized audio generation
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'seedance-1.5-pro',
    label: 'Seedance 1.5 Pro',
    generatesAudio: true,
    description: 'Next-gen ByteDance • Native audio • 24 FPS • 4-12s • First & Last frame',
    durations: [4, 5, 6, 8, 10, 12],
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'],
    resolutions: ['480p', '720p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI 2.1 Pro - Higher Frame Fidelity & Full HD
  // Model AIR ID: klingai:5@2 | Image-to-video ONLY | 24 FPS
  // Dimensions: 1920×1080, 1080×1080, 1080×1920 (Full HD 1080p)
  // Frame Images: ✅ First AND Last frame supported
  // CFG Scale: 0-1 (default: 0.5) for prompt adherence control
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'klingai-2.1-pro',
    label: 'KlingAI 2.1 Pro',
    generatesAudio: false,
    description: 'Full HD 1080p • Image-to-video only • 24 FPS • 5-10s • First & Last frame',
    durations: [5, 10],
    aspectRatios: ['16:9', '1:1', '9:16'],
    resolutions: ['1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // KlingAI 2.5 Turbo Pro
  // Model AIR ID: klingai:6@1 | Prompt: 2-2500 chars | 30 FPS
  // Dimensions: 1280×720, 720×720, 720×1280 (720p only)
  // Frame Images: ✅ First AND Last frame supported
  // CFG Scale: 0-1 (default: 0.5) for prompt adherence control
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'klingai-2.5-turbo-pro',
    label: 'KlingAI 2.5 Turbo Pro',
    generatesAudio: false,
    description: 'Turbo motion • 30 FPS • 720p only • 5-10s • First & Last frame',
    durations: [5, 10],
    aspectRatios: ['16:9', '1:1', '9:16'],
    resolutions: ['720p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Kling VIDEO 2.6 Pro - Next Generation with Native Audio
  // Model AIR ID: klingai:kling-video@2.6-pro | Prompt: 2-2500 chars
  // Dimensions: 1920×1080, 1080×1080, 1080×1920 (1080p)
  // Frame Images: ✅ First frame supported
  // Audio: ✅ Native synchronized audio (dialogue, sound effects, ambience)
  // CFG Scale: 0-1 (default: 0.5) for prompt adherence control
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'kling-video-2.6-pro',
    label: 'Kling VIDEO 2.6 Pro',
    generatesAudio: true,
    description: 'Native audio (dialogue, SFX) • 30 FPS • 1080p • 5-10s • First frame',
    durations: [5, 10],
    aspectRatios: ['16:9', '1:1', '9:16'],
    resolutions: ['1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Kling VIDEO O1 - Unified Multimodal Video Foundation Model
  // Model AIR ID: klingai:kling@o1 | Prompt: 2-2500 chars
  // Dimensions: 1920×1080, 1080×1080, 1080×1920 (1080p)
  // Frame Images: ✅ First AND Last frame (image-to-video only)
  // Reference Images: 1-7 images (reference-to-video), up to 4 (video-edit)
  // High-control workflows: generation + editing + visual compositing
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'kling-video-o1',
    label: 'Kling VIDEO O1',
    generatesAudio: false,
    description: 'High-control multimodal • 30 FPS • 1080p • 3-10s • First & Last frame',
    durations: [3, 5, 7, 10],
    aspectRatios: ['16:9', '1:1', '9:16'],
    resolutions: ['1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.0 (Has Native Audio - generateAudio)
  // Model AIR ID: google:3@0 | Duration: 8s | FPS: 24 | Prompt: 2-3000 chars
  // Native audio: dialogue, music, sound effects | enhancePrompt always ON
  // Frame Images: ✅ First frame supported
  // Image input: 300-2048px, 20MB max
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'veo-3.0',
    label: 'Google Veo 3.0',
    generatesAudio: true,
    description: 'Native audio (dialogue, music, SFX) • 24 FPS • 8s • First frame',
    durations: [8],
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3 Fast - Faster & Cost-Effective Variant
  // Model AIR ID: google:3@1 | Duration: 8s | FPS: 24 | Prompt: 2-3000 chars
  // Native audio: dialogue, music, sound effects | enhancePrompt always ON
  // Frame Images: ✅ First AND Last frame supported
  // Optimized for speed and affordability
  // Image input: 300-2048px, 20MB max
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'veo-3-fast',
    label: 'Google Veo 3 Fast',
    generatesAudio: true,
    description: 'Fast & affordable • Native audio • 24 FPS • 8s • First & Last frame',
    durations: [8],
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.1 (Has Native Audio - Natural Sound)
  // Model AIR ID: google:3@2 | Prompt: 2-3000 chars | 24 FPS
  // Duration: 8 seconds (or 7s for video extension)
  // Frame Images: ✅ First AND Last frame supported
  // Reference Images: ✅ Asset (up to 3) or Style (1) images
  // Video Extension: ✅ Extend videos by 7 seconds
  // Cinematic, story-driven with natural sound and smooth motion
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'veo-3.1',
    label: 'Google Veo 3.1',
    generatesAudio: true,
    description: 'Cinematic • Natural sound • 24 FPS • 8s • First & Last frame • Video extension',
    durations: [8],
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Google Veo 3.1 Fast - Ultra-Low Latency Variant
  // Model AIR ID: google:3@3 | Prompt: 2-3000 chars | 24 FPS
  // Duration: 8 seconds (or 7s for video extension)
  // Frame Images: ✅ First AND Last frame supported
  // Video Extension: ✅ Extend videos by 7 seconds
  // Optimized for high-speed generation with rapid creative iteration
  // Cinematic quality with ultra-low latency
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'veo-3.1-fast',
    label: 'Google Veo 3.1 Fast',
    generatesAudio: true,
    description: 'Ultra-low latency • Natural sound • 24 FPS • 8s • First & Last frame',
    durations: [8],
    aspectRatios: ['16:9', '9:16'],
    resolutions: ['720p', '1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PixVerse v5.5 (Has Native Audio + Multi-Image Fusion)
  // Model AIR ID: pixverse:1@6 | Prompt: 2-2048 chars
  // Duration: 5, 8s (10s unavailable at 1080p)
  // Frame Images: ✅ First AND Last frame supported
  // Audio: ✅ Background music, sound effects, dialogue
  // Multi-Shot: Camera control for dynamic cinematography
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'pixverse-v5.5',
    label: 'PixVerse v5.5',
    generatesAudio: true,
    description: 'Native audio • Multi-image fusion • 5-10s • First & Last frame',
    durations: [5, 8, 10],
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
    resolutions: ['360p', '540p', '720p', '1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MiniMax Hailuo 2.3 - Cinematic Storytelling
  // Model AIR ID: minimax:4@1 | Prompt: 2-2000 chars (optional with frameImages)
  // Duration: 6 or 10s (1366×768), 6s only (1920×1080) | FPS: 25
  // Frame Images: ✅ First frame supported
  // Lifelike human physics, expressive motion, precise prompt adherence
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'hailuo-2.3',
    label: 'MiniMax Hailuo 2.3',
    generatesAudio: false,
    description: 'Cinematic storytelling • 25 FPS • 6-10s • First frame',
    durations: [6, 10],
    aspectRatios: ['16:9'],
    resolutions: ['768p', '1080p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OpenAI Sora 2 Pro - Higher Quality Professional Variant
  // Model AIR ID: openai:3@2 | Prompt: 1-4000 chars
  // Duration: 4, 8, or 12 seconds | Refined control, better consistency
  // Frame Images: ✅ First frame supported (dimensions must match output)
  // Higher quality for demanding professional use cases
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'sora-2-pro',
    label: 'Sora 2 Pro',
    generatesAudio: false,
    description: 'OpenAI Pro • 30 FPS • 4-12s • Cinematic 7:4 • First frame',
    durations: [4, 8, 12],
    aspectRatios: ['16:9', '9:16', '7:4', '4:7'],
    resolutions: ['720p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LTX-2 Pro (Lightricks) - Professional Cinematic
  // Model AIR ID: lightricks:2@0 | Prompt: 2-10000 chars | 25/50 FPS
  // Duration: 6, 8, or 10 seconds (default: 6)
  // Realistic motion, precise lighting control
  // Supports up to 4K (2160p) | Only 16:9 aspect ratio
  // Frame Images: ✅ First frame supported (max 7MB)
  // Audio: ✅ Native audio generation via generateAudio
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'ltx-2-pro',
    label: 'LTX-2 Pro',
    generatesAudio: true,
    description: 'Pro cinematic • Native audio • Up to 4K • 25/50 FPS • 6-10s • First frame',
    durations: [6, 8, 10],
    aspectRatios: ['16:9'],
    resolutions: ['1080p', '1440p', '2160p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Runway Gen-4 Turbo - High-Speed Image-to-Video
  // Model AIR ID: runway:1@1 | Prompt: 1-1000 chars (optional)
  // Duration: 2-10 seconds (default: 10) | Image-to-video ONLY
  // Frame Images: ✅ First frame REQUIRED
  // Instant creative experimentation with exceptional fluidity and detail
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'runway-gen4-turbo',
    label: 'Runway Gen-4 Turbo',
    generatesAudio: false,
    description: 'High-speed I2V • 24 FPS • 2-10s • First frame required',
    durations: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    aspectRatios: ['16:9', '9:16', '1:1', '21:9', '4:3'],
    resolutions: ['720p', '832p', '960p'],
    supportsFrameImages: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Alibaba Wan 2.6 - Multimodal Video Generation with Native Audio
  // Model AIR ID: alibaba:wan@2.6 | Prompt: 1-1500 chars (EN/CN)
  // Duration: 5, 10, or 15 seconds (default: 5)
  // Frame Images: ✅ First frame (image-to-video only)
  // Reference Videos: ✅ Up to 3 videos (reference-to-video)
  // Audio: ✅ Native audio support + custom audio input
  // Multi-shot sequencing with temporal stability
  // ─────────────────────────────────────────────────────────────────────────
  {
    value: 'alibaba-wan-2.6',
    label: 'Alibaba Wan 2.6',
    generatesAudio: true,
    description: 'Native audio • Multi-shot • 24 FPS • 5-15s • First frame • Reference videos',
    durations: [5, 10, 15],
    aspectRatios: ['16:9', '9:16', '1:1', '17:13', '13:17'],
    resolutions: ['720p', '1080p'],
    supportsFrameImages: true,
  },
];

// Get default model
export const getDefaultVideoModel = (): VideoModelConfig => {
  return VIDEO_MODELS.find(m => m.default) || VIDEO_MODELS[0];
};

// All possible aspect ratios (filtered by model at runtime)
export const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)', description: 'YouTube, Desktop' },
  { value: '9:16', label: '9:16 (Portrait)', description: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1 (Square)', description: 'Instagram Posts' },
  { value: '7:4', label: '7:4 (Cinematic)', description: 'Sora cinematic widescreen' },
  { value: '4:7', label: '4:7 (Cinematic Portrait)', description: 'Sora cinematic portrait' },
  { value: '4:3', label: '4:3 (Classic)', description: 'Traditional TV format' },
  { value: '3:4', label: '3:4 (Portrait Classic)', description: 'Portrait traditional' },
  { value: '21:9', label: '21:9 (Ultrawide)', description: 'Cinematic ultrawide' },
  { value: '9:21', label: '9:21 (Tall)', description: 'Extra tall portrait' },
];

// All possible resolutions
export const RESOLUTIONS = [
  { value: '360p', label: '360p', description: 'Low - Fastest generation' },
  { value: '480p', label: '480p', description: 'SD - Fast generation' },
  { value: '540p', label: '540p', description: 'qHD - Balanced' },
  { value: '720p', label: '720p', description: 'HD - Good quality' },
  { value: '768p', label: '768p', description: 'XGA - 4:3 optimized' },
  { value: '1080p', label: '1080p', description: 'Full HD - High quality' },
  { value: '1440p', label: '1440p', description: '2K QHD - Professional' },
  { value: '2160p', label: '2160p', description: '4K UHD - Cinematic' },
];

// Duration options are now dynamic per model, but we keep this for reference
export const DURATION_OPTIONS = [
  { value: '2', label: '2 seconds' },
  { value: '4', label: '4 seconds' },
  { value: '5', label: '5 seconds' },
  { value: '6', label: '6 seconds' },
  { value: '8', label: '8 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '12', label: '12 seconds' },
];
