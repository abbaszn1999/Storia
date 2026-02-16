// ElevenLabs Voice Library for Story Mode

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
  collection: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  // ENGLISH VOICES
  { id: "DGzg6RaUqxGRTHSBjfgF", name: "Brock", language: "en", gender: "male", age: "mature", description: "Commanding and loud sergeant", descriptionEn: "Commanding and loud sergeant", previewUrl: "/api/social-commerce/voice-preview/DGzg6RaUqxGRTHSBjfgF", accent: "american", useCase: "characters", collection: "Characters & Animation" },
  { id: "YOq2y2Up4RgXP2HyXjE5", name: "Xavier", language: "en", gender: "male", age: "mature", description: "Dominating, metalic announcer", descriptionEn: "Dominating, metalic announcer", previewUrl: "/api/social-commerce/voice-preview/YOq2y2Up4RgXP2HyXjE5", accent: "american", useCase: "characters", collection: "Characters & Animation" },
  { id: "qNkzaJoHLLdpvgh5tISm", name: "Carter", language: "en", gender: "male", age: "middle-aged", description: "Rich, smooth and rugged", descriptionEn: "Rich, smooth and rugged", previewUrl: "/api/social-commerce/voice-preview/qNkzaJoHLLdpvgh5tISm", accent: "american", useCase: "characters", collection: "Characters & Animation" },
  { id: "L5Oo1OjjHdbIvJDQFgmN", name: "Bartholomeus", language: "en", gender: "male", age: "mature", description: "Sensual and bold voice", descriptionEn: "Sensual and bold voice", previewUrl: "/api/social-commerce/voice-preview/L5Oo1OjjHdbIvJDQFgmN", accent: "american", useCase: "characters", collection: "Characters & Animation" },
  { id: "Crm8VULvkVs5ZBDa1Ixm", name: "Andrea Wolff", language: "en", gender: "female", age: "young", description: "Clear, youthful, evenly paced", descriptionEn: "Clear, youthful, evenly paced", previewUrl: "/api/social-commerce/voice-preview/Crm8VULvkVs5ZBDa1Ixm", accent: "american", useCase: "narration", collection: "Narrative & Story" },
  { id: "xrNwYO0xeioXswMCcFNF", name: "Ingmar", language: "en", gender: "male", age: "mature", description: "Intimately mysterious", descriptionEn: "Intimately mysterious", previewUrl: "/api/social-commerce/voice-preview/xrNwYO0xeioXswMCcFNF", accent: "american", useCase: "narration", collection: "Narrative & Story" },
  { id: "e5WNhrdI30aXpS2RSGm1", name: "Ian Cartwell", language: "en", gender: "male", age: "middle-aged", description: "Suspense and mystery", descriptionEn: "Suspense and mystery", previewUrl: "/api/social-commerce/voice-preview/e5WNhrdI30aXpS2RSGm1", accent: "british", useCase: "narration", collection: "Narrative & Story" },
  { id: "Vpv1YgvVd6CHIzOTiTt8", name: "Martin Osborne", language: "en", gender: "male", age: "mature", description: "Deep and passionate", descriptionEn: "Deep and passionate", previewUrl: "/api/social-commerce/voice-preview/Vpv1YgvVd6CHIzOTiTt8", accent: "british", useCase: "narration", collection: "Narrative & Story" },
  { id: "qBDvhofpxp92JgXJxDjB", name: "Lily Wolff", language: "en", gender: "female", age: "young", description: "Expressive and kind", descriptionEn: "Expressive and kind", previewUrl: "/api/social-commerce/voice-preview/qBDvhofpxp92JgXJxDjB", accent: "american", useCase: "narration", collection: "Narrative & Story" },
  { id: "wNvqdMNs9MLd1PG6uWuY", name: "Clara", language: "en", gender: "female", age: "young", description: "Whispery and intimate", descriptionEn: "Whispery and intimate", previewUrl: "/api/social-commerce/voice-preview/wNvqdMNs9MLd1PG6uWuY", accent: "american", useCase: "narration", collection: "Narrative & Story" },
  { id: "g298lY8JIucgBDyOpRLj", name: "Frederick", language: "en", gender: "male", age: "mature", description: "Calm, soothing and gentle", descriptionEn: "Calm, soothing and gentle", previewUrl: "/api/social-commerce/voice-preview/g298lY8JIucgBDyOpRLj", accent: "american", useCase: "educational", collection: "Informative & Educational" },
  { id: "CV4xD6M8z1X1kya4Pepj", name: "Dio", language: "en", gender: "male", age: "young", description: "Friendly, cheerful, and humorous", descriptionEn: "Friendly, cheerful, and humorous", previewUrl: "/api/social-commerce/voice-preview/CV4xD6M8z1X1kya4Pepj", accent: "american", useCase: "narration", collection: "Narrative & Story" },
  { id: "y1adqrqs4jNaANXsIZnD", name: "David Boles", language: "en", gender: "male", age: "middle-aged", description: "Well-spoken and calm", descriptionEn: "Well-spoken and calm", previewUrl: "/api/social-commerce/voice-preview/y1adqrqs4jNaANXsIZnD", accent: "american", useCase: "educational", collection: "Informative & Educational" },
  { id: "tQ4MEZFJOzsahSEEZtHK", name: "Ivanna", language: "en", gender: "female", age: "young", description: "Seductive and intimate", descriptionEn: "Seductive and intimate", previewUrl: "/api/social-commerce/voice-preview/tQ4MEZFJOzsahSEEZtHK", accent: "american", useCase: "narration", collection: "Narrative & Story" },
  { id: "UgBBYS2sOqTuMpoF3BR0", name: "Mark", language: "en", gender: "male", age: "middle-aged", description: "Natural conversations", descriptionEn: "Natural conversations", previewUrl: "/api/social-commerce/voice-preview/UgBBYS2sOqTuMpoF3BR0", accent: "american", useCase: "conversational", collection: "Conversational" },
  { id: "9sjP3TfMlzEjAa6uXh3A", name: "Kelly Klein", language: "en", gender: "female", age: "middle-aged", description: "90s movie and TV voice", descriptionEn: "90s movie and TV voice", previewUrl: "/api/social-commerce/voice-preview/9sjP3TfMlzEjAa6uXh3A", accent: "american", useCase: "characters", collection: "Characters & Animation" },
  { id: "TtRFBnwQdH1k01vR0hMz", name: "Arthur", language: "en", gender: "male", age: "young", description: "Energetic American narrator", descriptionEn: "Energetic American narrator", previewUrl: "/api/social-commerce/voice-preview/TtRFBnwQdH1k01vR0hMz", accent: "american", useCase: "social-media", collection: "Social Media" },
  { id: "mUfWEBhcigm8YlCDbmGP", name: "Joey", language: "en", gender: "male", age: "young", description: "Upbeat popular news host", descriptionEn: "Upbeat popular news host", previewUrl: "/api/social-commerce/voice-preview/mUfWEBhcigm8YlCDbmGP", accent: "american", useCase: "social-media", collection: "Social Media" },
  { id: "wytO3xyllSDjJKHNkchr", name: "Gian", language: "en", gender: "male", age: "young", description: "Clear, upbeat and involving", descriptionEn: "Clear, upbeat and involving", previewUrl: "/api/social-commerce/voice-preview/wytO3xyllSDjJKHNkchr", accent: "italian", useCase: "social-media", collection: "Social Media" },

  // ARABIC VOICES
  { id: "IES4nrmZdUBHByLBde0P", name: "Haytham", language: "ar", gender: "male", age: "middle-aged", description: "Energetic, warm and cheerful", descriptionEn: "Energetic, warm and cheerful", previewUrl: "/api/social-commerce/voice-preview/IES4nrmZdUBHByLBde0P", accent: "arabic", useCase: "narration", collection: "Narrative & Story" },
  { id: "VwC51uc4PUblWEJSPzeo", name: "Abrar Sabbah", language: "ar", gender: "male", age: "young", description: "Attractive and smooth", descriptionEn: "Attractive and smooth", previewUrl: "/api/social-commerce/voice-preview/VwC51uc4PUblWEJSPzeo", accent: "arabic", useCase: "narration", collection: "Narrative & Story" },
  { id: "rFDdsCQRZCUL8cPOWtnP", name: "Ghaida", language: "ar", gender: "female", age: "young", description: "Soft, warm and expressive", descriptionEn: "Soft, warm and expressive", previewUrl: "/api/social-commerce/voice-preview/rFDdsCQRZCUL8cPOWtnP", accent: "arabic", useCase: "narration", collection: "Narrative & Story" },
  { id: "DPd861uv5p6zeVV94qOT", name: "Mo Wiseman", language: "ar", gender: "male", age: "middle-aged", description: "Neutral and professional", descriptionEn: "Neutral and professional", previewUrl: "/api/social-commerce/voice-preview/DPd861uv5p6zeVV94qOT", accent: "arabic", useCase: "narration", collection: "Narrative & Story" },
  { id: "amSNjVC0vWYiE8iGimVb", name: "Maged Magdy", language: "ar", gender: "male", age: "middle-aged", description: "Calm, natural and balanced", descriptionEn: "Calm, natural and balanced", previewUrl: "/api/social-commerce/voice-preview/amSNjVC0vWYiE8iGimVb", accent: "arabic", useCase: "educational", collection: "Informative & Educational" },
  { id: "gMB389pj77Qe5nErWNjd", name: "Sara (Educational)", language: "ar", gender: "female", age: "young", description: "Friendly, professional, clear", descriptionEn: "Friendly, professional, clear", previewUrl: "/api/social-commerce/voice-preview/gMB389pj77Qe5nErWNjd", accent: "arabic", useCase: "educational", collection: "Informative & Educational" },
  { id: "Wim44P0dU9HtjyzNnFsv", name: "Ghaida (Conversational)", language: "ar", gender: "female", age: "young", description: "Friendly, charming and caring", descriptionEn: "Friendly, charming and caring", previewUrl: "/api/social-commerce/voice-preview/Wim44P0dU9HtjyzNnFsv", accent: "arabic", useCase: "conversational", collection: "Conversational" },
  { id: "4wf10lgibMnboGJGCLrP", name: "Farah", language: "ar", gender: "female", age: "young", description: "Smooth, calm and warm", descriptionEn: "Smooth, calm and warm", previewUrl: "/api/social-commerce/voice-preview/4wf10lgibMnboGJGCLrP", accent: "arabic", useCase: "advertisement", collection: "Advertisement" },
  { id: "rPNcQ53R703tTmtue1AT", name: "Mazen Lawand", language: "ar", gender: "male", age: "mature", description: "Deep and professional", descriptionEn: "Deep and professional", previewUrl: "/api/social-commerce/voice-preview/rPNcQ53R703tTmtue1AT", accent: "arabic", useCase: "advertisement", collection: "Advertisement" },
  { id: "jAAHNNqlbAX9iWjJPEtE", name: "Sara (Social)", language: "ar", gender: "female", age: "young", description: "Soft, calm and gentle", descriptionEn: "Soft, calm and gentle", previewUrl: "/api/social-commerce/voice-preview/jAAHNNqlbAX9iWjJPEtE", accent: "arabic", useCase: "social-media", collection: "Social Media" },
  { id: "drMurExmkWVIH5nW8snR", name: "Khaled Alnajjar", language: "ar", gender: "male", age: "young", description: "Strong and expressive", descriptionEn: "Strong and expressive", previewUrl: "/api/social-commerce/voice-preview/drMurExmkWVIH5nW8snR", accent: "arabic", useCase: "social-media", collection: "Social Media" },
];

// Default voice for each language (first narration voice)
export const DEFAULT_VOICE_BY_LANGUAGE: Record<string, string> = {
  en: 'Crm8VULvkVs5ZBDa1Ixm', // Andrea Wolff — Clear, youthful, evenly paced
  ar: 'IES4nrmZdUBHByLBde0P', // Haytham — Energetic, warm and cheerful
};

// Helper functions
export function getVoicesByLanguage(language: 'ar' | 'en'): ElevenLabsVoice[] {
  return ELEVENLABS_VOICES.filter(voice => voice.language === language);
}

export function getVoiceById(id: string): ElevenLabsVoice | undefined {
  return ELEVENLABS_VOICES.find(voice => voice.id === id);
}

export function getVoicesByCollection(collection: string): ElevenLabsVoice[] {
  return ELEVENLABS_VOICES.filter(voice => voice.collection === collection);
}
