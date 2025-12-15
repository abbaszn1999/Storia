// ElevenLabs Voice Library
// Arabic + English voices for narration

export interface ElevenLabsVoice {
  id: string;
  name: string;
  language: 'ar' | 'en';
  gender: 'male' | 'female';
  age: 'young' | 'middle-aged' | 'mature';
  description: string;
  descriptionEn: string;
  previewUrl: string;
  accent: string;
  useCase: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  // ═══════════════════════════════════════════════════════════════
  // ARABIC VOICES (6 voices for Arabic narration)
  // ElevenLabs multilingual voices - same voice IDs work for Arabic
  // ═══════════════════════════════════════════════════════════════
  {
    id: "21m00Tcm4TlvDq8ikWAM", // Rachel - works great for Arabic
    name: "Layla",
    language: "ar",
    gender: "female",
    age: "young",
    description: "Young female voice, clear and expressive",
    descriptionEn: "Young female voice, clear and expressive",
    previewUrl: "/api/problem-solution/voice-preview/21m00Tcm4TlvDq8ikWAM?lang=ar",
    accent: "modern-standard-arabic",
    useCase: "narration",
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9", // Daniel
    name: "Ahmed",
    language: "ar",
    gender: "male",
    age: "middle-aged",
    description: "Mature male voice, strong and clear",
    descriptionEn: "Mature male voice, strong and clear",
    previewUrl: "/api/problem-solution/voice-preview/onwK4e9ZLuTAKqWW03F9?lang=ar",
    accent: "modern-standard-arabic",
    useCase: "narration",
  },
  {
    id: "XrExE9yKIg1WjnnlVkGX", // Matilda
    name: "Sara",
    language: "ar",
    gender: "female",
    age: "mature",
    description: "Mature female voice, warm and comfortable",
    descriptionEn: "Mature female voice, warm and comfortable",
    previewUrl: "/api/problem-solution/voice-preview/XrExE9yKIg1WjnnlVkGX?lang=ar",
    accent: "modern-standard-arabic",
    useCase: "narration",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL", // Bella
    name: "Nora",
    language: "ar",
    gender: "female",
    age: "young",
    description: "Calm female voice, perfect for narration",
    descriptionEn: "Calm female voice, perfect for narration",
    previewUrl: "/api/problem-solution/voice-preview/EXAVITQu4vr4xnSDxMaL?lang=ar",
    accent: "modern-standard-arabic",
    useCase: "narration",
  },
  {
    id: "ErXwobaYiN019PkySvjV", // Antoni
    name: "Khaled",
    language: "ar",
    gender: "male",
    age: "young",
    description: "Young male voice, energetic and lively",
    descriptionEn: "Young male voice, energetic and lively",
    previewUrl: "/api/problem-solution/voice-preview/ErXwobaYiN019PkySvjV?lang=ar",
    accent: "modern-standard-arabic",
    useCase: "narration",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB", // Adam
    name: "Omar",
    language: "ar",
    gender: "male",
    age: "mature",
    description: "Mature, authoritative male voice",
    descriptionEn: "Mature, authoritative male voice",
    previewUrl: "/api/problem-solution/voice-preview/pNInz6obpgDQGcFmaJgB?lang=ar",
    accent: "modern-standard-arabic",
    useCase: "narration",
  },

  // ═══════════════════════════════════════════════════════════════
  // ENGLISH VOICES (6 voices for English narration)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "21m00Tcm4TlvDq8ikWAM", // Rachel
    name: "Rachel",
    language: "en",
    gender: "female",
    age: "young",
    description: "Calm female voice, perfect for narration",
    descriptionEn: "Calm female voice, perfect for narration",
    previewUrl: "/api/problem-solution/voice-preview/21m00Tcm4TlvDq8ikWAM",
    accent: "american",
    useCase: "narration",
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld", // Domi
    name: "Domi",
    language: "en",
    gender: "female",
    age: "young",
    description: "Strong, confident female voice",
    descriptionEn: "Strong, confident female voice",
    previewUrl: "/api/problem-solution/voice-preview/AZnzlk1XvdvUeBnXmlld",
    accent: "american",
    useCase: "narration",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL", // Bella
    name: "Bella",
    language: "en",
    gender: "female",
    age: "middle-aged",
    description: "Soft, pleasant female voice",
    descriptionEn: "Soft, pleasant female voice",
    previewUrl: "/api/problem-solution/voice-preview/EXAVITQu4vr4xnSDxMaL",
    accent: "american",
    useCase: "narration",
  },
  {
    id: "ErXwobaYiN019PkySvjV", // Antoni
    name: "Antoni",
    language: "en",
    gender: "male",
    age: "young",
    description: "Well-rounded, pleasant male voice",
    descriptionEn: "Well-rounded, pleasant male voice",
    previewUrl: "/api/problem-solution/voice-preview/ErXwobaYiN019PkySvjV",
    accent: "american",
    useCase: "narration",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB", // Adam
    name: "Adam",
    language: "en",
    gender: "male",
    age: "mature",
    description: "Deep, mature male voice",
    descriptionEn: "Deep, mature male voice",
    previewUrl: "/api/problem-solution/voice-preview/pNInz6obpgDQGcFmaJgB",
    accent: "american",
    useCase: "narration",
  },
  {
    id: "TxGEqnHWrfWFTfGW9XjX", // Josh
    name: "Josh",
    language: "en",
    gender: "male",
    age: "young",
    description: "Young, energetic male voice",
    descriptionEn: "Young, energetic male voice",
    previewUrl: "/api/problem-solution/voice-preview/TxGEqnHWrfWFTfGW9XjX",
    accent: "american",
    useCase: "narration",
  },
];

// Helper functions
export function getVoicesByLanguage(language: 'ar' | 'en'): ElevenLabsVoice[] {
  return ELEVENLABS_VOICES.filter(voice => voice.language === language);
}

export function getVoiceById(id: string): ElevenLabsVoice | undefined {
  return ELEVENLABS_VOICES.find(voice => voice.id === id);
}

