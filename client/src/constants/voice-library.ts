export interface VoiceActor {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  collection: string;
  style: string;
  elevenLabsVoiceId: string;
  previewUrl: string;
  language: "en" | "ar";
}

export const VOICE_LIBRARY: VoiceActor[] = [
  // ═══════════════════════════════════════════════════════════════
  // ENGLISH VOICES
  // ═══════════════════════════════════════════════════════════════

  // Characters & Animation
  {
    id: "voice-brock",
    name: "Brock",
    description: "Commanding and loud sergeant - harsh, barking tone",
    gender: "male",
    collection: "Characters & Animation",
    style: "Commanding",
    elevenLabsVoiceId: "DGzg6RaUqxGRTHSBjfgF",
    previewUrl: "/api/social-commerce/voice-preview/DGzg6RaUqxGRTHSBjfgF",
    language: "en",
  },
  {
    id: "voice-xavier",
    name: "Xavier",
    description: "Dominating, metalic announcer - perfect for gaming",
    gender: "male",
    collection: "Characters & Animation",
    style: "Announcer",
    elevenLabsVoiceId: "YOq2y2Up4RgXP2HyXjE5",
    previewUrl: "/api/social-commerce/voice-preview/YOq2y2Up4RgXP2HyXjE5",
    language: "en",
  },
  {
    id: "voice-carter",
    name: "Carter",
    description: "Rich, smooth and rugged voice",
    gender: "male",
    collection: "Characters & Animation",
    style: "Smooth",
    elevenLabsVoiceId: "qNkzaJoHLLdpvgh5tISm",
    previewUrl: "/api/social-commerce/voice-preview/qNkzaJoHLLdpvgh5tISm",
    language: "en",
  },
  {
    id: "voice-bartholomeus",
    name: "Bartholomeus",
    description: "Sensual and bold voice",
    gender: "male",
    collection: "Characters & Animation",
    style: "Bold",
    elevenLabsVoiceId: "L5Oo1OjjHdbIvJDQFgmN",
    previewUrl: "/api/social-commerce/voice-preview/L5Oo1OjjHdbIvJDQFgmN",
    language: "en",
  },

  // Narrative & Story (English)
  {
    id: "voice-andrea",
    name: "Andrea Wolff",
    description: "Clear, youthful, evenly paced voice",
    gender: "female",
    collection: "Narrative & Story",
    style: "Clear",
    elevenLabsVoiceId: "Crm8VULvkVs5ZBDa1Ixm",
    previewUrl: "/api/social-commerce/voice-preview/Crm8VULvkVs5ZBDa1Ixm",
    language: "en",
  },
  {
    id: "voice-ingmar",
    name: "Ingmar",
    description: "Intimately mysterious voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Mysterious",
    elevenLabsVoiceId: "xrNwYO0xeioXswMCcFNF",
    previewUrl: "/api/social-commerce/voice-preview/xrNwYO0xeioXswMCcFNF",
    language: "en",
  },
  {
    id: "voice-ian",
    name: "Ian Cartwell",
    description: "Suspense and mystery voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Suspense",
    elevenLabsVoiceId: "e5WNhrdI30aXpS2RSGm1",
    previewUrl: "/api/social-commerce/voice-preview/e5WNhrdI30aXpS2RSGm1",
    language: "en",
  },
  {
    id: "voice-martin",
    name: "Martin Osborne",
    description: "Deep and passionate voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Passionate",
    elevenLabsVoiceId: "Vpv1YgvVd6CHIzOTiTt8",
    previewUrl: "/api/social-commerce/voice-preview/Vpv1YgvVd6CHIzOTiTt8",
    language: "en",
  },
  {
    id: "voice-lily",
    name: "Lily Wolff",
    description: "Expressive and kind voice",
    gender: "female",
    collection: "Narrative & Story",
    style: "Expressive",
    elevenLabsVoiceId: "qBDvhofpxp92JgXJxDjB",
    previewUrl: "/api/social-commerce/voice-preview/qBDvhofpxp92JgXJxDjB",
    language: "en",
  },
  {
    id: "voice-clara",
    name: "Clara",
    description: "Whispery and intimate voice",
    gender: "female",
    collection: "Narrative & Story",
    style: "Whispery",
    elevenLabsVoiceId: "wNvqdMNs9MLd1PG6uWuY",
    previewUrl: "/api/social-commerce/voice-preview/wNvqdMNs9MLd1PG6uWuY",
    language: "en",
  },

  // Informative & Educational (English)
  {
    id: "voice-frederick",
    name: "Frederick",
    description: "Calm, soothing and gentle voice",
    gender: "male",
    collection: "Informative & Educational",
    style: "Calm",
    elevenLabsVoiceId: "g298lY8JIucgBDyOpRLj",
    previewUrl: "/api/social-commerce/voice-preview/g298lY8JIucgBDyOpRLj",
    language: "en",
  },
  {
    id: "voice-dio",
    name: "Dio",
    description: "Friendly, cheerful, and humorous voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Cheerful",
    elevenLabsVoiceId: "CV4xD6M8z1X1kya4Pepj",
    previewUrl: "/api/social-commerce/voice-preview/CV4xD6M8z1X1kya4Pepj",
    language: "en",
  },
  {
    id: "voice-david",
    name: "David Boles",
    description: "Well-spoken and calm voice",
    gender: "male",
    collection: "Informative & Educational",
    style: "Professional",
    elevenLabsVoiceId: "y1adqrqs4jNaANXsIZnD",
    previewUrl: "/api/social-commerce/voice-preview/y1adqrqs4jNaANXsIZnD",
    language: "en",
  },

  // Conversational (English)
  {
    id: "voice-ivanna",
    name: "Ivanna",
    description: "Seductive and intimate voice",
    gender: "female",
    collection: "Narrative & Story",
    style: "Seductive",
    elevenLabsVoiceId: "tQ4MEZFJOzsahSEEZtHK",
    previewUrl: "/api/social-commerce/voice-preview/tQ4MEZFJOzsahSEEZtHK",
    language: "en",
  },
  {
    id: "voice-mark",
    name: "Mark",
    description: "Natural conversations voice",
    gender: "male",
    collection: "Conversational",
    style: "Natural",
    elevenLabsVoiceId: "UgBBYS2sOqTuMpoF3BR0",
    previewUrl: "/api/social-commerce/voice-preview/UgBBYS2sOqTuMpoF3BR0",
    language: "en",
  },

  // Characters & Animation (English)
  {
    id: "voice-kelly",
    name: "Kelly Klein",
    description: "90s movie and TV voice",
    gender: "female",
    collection: "Characters & Animation",
    style: "Retro",
    elevenLabsVoiceId: "9sjP3TfMlzEjAa6uXh3A",
    previewUrl: "/api/social-commerce/voice-preview/9sjP3TfMlzEjAa6uXh3A",
    language: "en",
  },

  // Social Media (English)
  {
    id: "voice-arthur",
    name: "Arthur",
    description: "Energetic American male narrator",
    gender: "male",
    collection: "Social Media",
    style: "Energetic",
    elevenLabsVoiceId: "TtRFBnwQdH1k01vR0hMz",
    previewUrl: "/api/social-commerce/voice-preview/TtRFBnwQdH1k01vR0hMz",
    language: "en",
  },
  {
    id: "voice-joey",
    name: "Joey",
    description: "Upbeat popular news host",
    gender: "male",
    collection: "Social Media",
    style: "Upbeat",
    elevenLabsVoiceId: "mUfWEBhcigm8YlCDbmGP",
    previewUrl: "/api/social-commerce/voice-preview/mUfWEBhcigm8YlCDbmGP",
    language: "en",
  },
  {
    id: "voice-gian",
    name: "Gian",
    description: "Clear, upbeat and involving voice",
    gender: "male",
    collection: "Social Media",
    style: "Upbeat",
    elevenLabsVoiceId: "wytO3xyllSDjJKHNkchr",
    previewUrl: "/api/social-commerce/voice-preview/wytO3xyllSDjJKHNkchr",
    language: "en",
  },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC VOICES
  // ═══════════════════════════════════════════════════════════════

  // Narrative & Story (Arabic)
  {
    id: "voice-haytham-ar",
    name: "Haytham",
    description: "Energetic, warm and cheerful voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Cheerful",
    elevenLabsVoiceId: "IES4nrmZdUBHByLBde0P",
    previewUrl: "/api/social-commerce/voice-preview/IES4nrmZdUBHByLBde0P",
    language: "ar",
  },
  {
    id: "voice-abrar-ar",
    name: "Abrar Sabbah",
    description: "Attractive and smooth voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Smooth",
    elevenLabsVoiceId: "VwC51uc4PUblWEJSPzeo",
    previewUrl: "/api/social-commerce/voice-preview/VwC51uc4PUblWEJSPzeo",
    language: "ar",
  },
  {
    id: "voice-ghaida-ar",
    name: "Ghaida",
    description: "Soft, warm and expressive voice",
    gender: "female",
    collection: "Narrative & Story",
    style: "Expressive",
    elevenLabsVoiceId: "rFDdsCQRZCUL8cPOWtnP",
    previewUrl: "/api/social-commerce/voice-preview/rFDdsCQRZCUL8cPOWtnP",
    language: "ar",
  },
  {
    id: "voice-mo-ar",
    name: "Mo Wiseman",
    description: "Neutral and professional voice",
    gender: "male",
    collection: "Narrative & Story",
    style: "Professional",
    elevenLabsVoiceId: "DPd861uv5p6zeVV94qOT",
    previewUrl: "/api/social-commerce/voice-preview/DPd861uv5p6zeVV94qOT",
    language: "ar",
  },

  // Informative & Educational (Arabic)
  {
    id: "voice-maged-ar",
    name: "Maged Magdy",
    description: "Calm, natural and balanced voice",
    gender: "male",
    collection: "Informative & Educational",
    style: "Natural",
    elevenLabsVoiceId: "amSNjVC0vWYiE8iGimVb",
    previewUrl: "/api/social-commerce/voice-preview/amSNjVC0vWYiE8iGimVb",
    language: "ar",
  },
  {
    id: "voice-sara-educational-ar",
    name: "Sara (Educational)",
    description: "Friendly, professional and clear voice",
    gender: "female",
    collection: "Informative & Educational",
    style: "Professional",
    elevenLabsVoiceId: "gMB389pj77Qe5nErWNjd",
    previewUrl: "/api/social-commerce/voice-preview/gMB389pj77Qe5nErWNjd",
    language: "ar",
  },

  // Conversational (Arabic)
  {
    id: "voice-ghaida-conversational-ar",
    name: "Ghaida (Conversational)",
    description: "Friendly, charming and caring voice",
    gender: "female",
    collection: "Conversational",
    style: "Friendly",
    elevenLabsVoiceId: "Wim44P0dU9HtjyzNnFsv",
    previewUrl: "/api/social-commerce/voice-preview/Wim44P0dU9HtjyzNnFsv",
    language: "ar",
  },

  // Advertisement (Arabic)
  {
    id: "voice-farah-ar",
    name: "Farah",
    description: "Smooth, calm and warm voice",
    gender: "female",
    collection: "Advertisement",
    style: "Smooth",
    elevenLabsVoiceId: "4wf10lgibMnboGJGCLrP",
    previewUrl: "/api/social-commerce/voice-preview/4wf10lgibMnboGJGCLrP",
    language: "ar",
  },
  {
    id: "voice-mazen-ar",
    name: "Mazen Lawand",
    description: "Deep and professional voice",
    gender: "male",
    collection: "Advertisement",
    style: "Professional",
    elevenLabsVoiceId: "rPNcQ53R703tTmtue1AT",
    previewUrl: "/api/social-commerce/voice-preview/rPNcQ53R703tTmtue1AT",
    language: "ar",
  },

  // Social Media (Arabic)
  {
    id: "voice-sara-social-ar",
    name: "Sara (Social)",
    description: "Soft, calm and gentle voice",
    gender: "female",
    collection: "Social Media",
    style: "Calm",
    elevenLabsVoiceId: "jAAHNNqlbAX9iWjJPEtE",
    previewUrl: "/api/social-commerce/voice-preview/jAAHNNqlbAX9iWjJPEtE",
    language: "ar",
  },
  {
    id: "voice-khaled-ar",
    name: "Khaled Alnajjar",
    description: "Strong and expressive voice",
    gender: "male",
    collection: "Social Media",
    style: "Expressive",
    elevenLabsVoiceId: "drMurExmkWVIH5nW8snR",
    previewUrl: "/api/social-commerce/voice-preview/drMurExmkWVIH5nW8snR",
    language: "ar",
  },
];

// Helper function to get voices by language
export function getVoicesByLanguage(language: "en" | "ar"): VoiceActor[] {
  return VOICE_LIBRARY.filter(voice => voice.language === language);
}

// Helper function to get all voices
export function getAllVoices(): VoiceActor[] {
  return VOICE_LIBRARY;
}

// Helper function to get voices by collection
export function getVoicesByCollection(collection: string): VoiceActor[] {
  return VOICE_LIBRARY.filter(voice => voice.collection === collection);
}

// Get unique collections
export function getVoiceCollections(): string[] {
  return [...new Set(VOICE_LIBRARY.map(voice => voice.collection))];
}
