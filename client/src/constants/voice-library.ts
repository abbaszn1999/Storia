export interface VoiceActor {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  accent: string;
  style: string;
  elevenLabsVoiceId: string;
  previewUrl: string;
  language: "en" | "ar";
}

export const VOICE_LIBRARY: VoiceActor[] = [
  // ═══════════════════════════════════════════════════════════════
  // ENGLISH VOICES
  // ═══════════════════════════════════════════════════════════════
  {
    id: "voice-adam",
    name: "Adam",
    description: "Deep, authoritative male voice perfect for documentaries and narration",
    gender: "male",
    accent: "American",
    style: "Professional",
    elevenLabsVoiceId: "pNInz6obpgDQGcFmaJgB",
    previewUrl: "/api/social-commerce/voice-preview/pNInz6obpgDQGcFmaJgB",
    language: "en",
  },
  {
    id: "voice-rachel",
    name: "Rachel",
    description: "Warm, friendly female voice ideal for storytelling and casual content",
    gender: "female",
    accent: "American",
    style: "Friendly",
    elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
    previewUrl: "/api/social-commerce/voice-preview/21m00Tcm4TlvDq8ikWAM",
    language: "en",
  },
  {
    id: "voice-domi",
    name: "Domi",
    description: "Confident, strong female voice great for motivational content",
    gender: "female",
    accent: "American",
    style: "Confident",
    elevenLabsVoiceId: "AZnzlk1XvdvUeBnXmlld",
    previewUrl: "/api/social-commerce/voice-preview/AZnzlk1XvdvUeBnXmlld",
    language: "en",
  },
  {
    id: "voice-bella",
    name: "Bella",
    description: "Soft, soothing female voice perfect for relaxing and ASMR content",
    gender: "female",
    accent: "American",
    style: "Soothing",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
    previewUrl: "/api/social-commerce/voice-preview/EXAVITQu4vr4xnSDxMaL",
    language: "en",
  },
  {
    id: "voice-josh",
    name: "Josh",
    description: "Young, energetic male voice ideal for dynamic and upbeat content",
    gender: "male",
    accent: "American",
    style: "Energetic",
    elevenLabsVoiceId: "TxGEqnHWrfWFTfGW9XjX",
    previewUrl: "/api/social-commerce/voice-preview/TxGEqnHWrfWFTfGW9XjX",
    language: "en",
  },
  {
    id: "voice-antoni",
    name: "Antoni",
    description: "Well-rounded, versatile male voice suitable for any content type",
    gender: "male",
    accent: "American",
    style: "Versatile",
    elevenLabsVoiceId: "ErXwobaYiN019PkySvjV",
    previewUrl: "/api/social-commerce/voice-preview/ErXwobaYiN019PkySvjV",
    language: "en",
  },
  {
    id: "voice-charlotte",
    name: "Charlotte",
    description: "Clear, articulate female voice excellent for educational content",
    gender: "female",
    accent: "British",
    style: "Educational",
    elevenLabsVoiceId: "XB0fDUnXU5powFXDhCwa",
    previewUrl: "/api/social-commerce/voice-preview/XB0fDUnXU5powFXDhCwa",
    language: "en",
  },
  {
    id: "voice-callum",
    name: "Callum",
    description: "Mature, compelling male voice perfect for dramatic storytelling",
    gender: "male",
    accent: "British",
    style: "Dramatic",
    elevenLabsVoiceId: "N2lVS1w4EtoT3dr4eOWO",
    previewUrl: "/api/social-commerce/voice-preview/N2lVS1w4EtoT3dr4eOWO",
    language: "en",
  },

  // ═══════════════════════════════════════════════════════════════
  // ARABIC VOICES (using multilingual voices with Arabic)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "voice-layla",
    name: "ليلى",
    description: "صوت نسائي شاب، واضح ومعبر",
    gender: "female",
    accent: "Arabic",
    style: "Expressive",
    elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
    previewUrl: "/api/social-commerce/voice-preview/21m00Tcm4TlvDq8ikWAM?lang=ar",
    language: "ar",
  },
  {
    id: "voice-ahmed",
    name: "أحمد",
    description: "صوت رجالي ناضج وقوي",
    gender: "male",
    accent: "Arabic",
    style: "Professional",
    elevenLabsVoiceId: "pNInz6obpgDQGcFmaJgB",
    previewUrl: "/api/social-commerce/voice-preview/pNInz6obpgDQGcFmaJgB?lang=ar",
    language: "ar",
  },
  {
    id: "voice-sara",
    name: "سارة",
    description: "صوت نسائي دافئ ومريح",
    gender: "female",
    accent: "Arabic",
    style: "Warm",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
    previewUrl: "/api/social-commerce/voice-preview/EXAVITQu4vr4xnSDxMaL?lang=ar",
    language: "ar",
  },
  {
    id: "voice-khaled",
    name: "خالد",
    description: "صوت رجالي شاب ونشيط",
    gender: "male",
    accent: "Arabic",
    style: "Energetic",
    elevenLabsVoiceId: "ErXwobaYiN019PkySvjV",
    previewUrl: "/api/social-commerce/voice-preview/ErXwobaYiN019PkySvjV?lang=ar",
    language: "ar",
  },
  {
    id: "voice-nora",
    name: "نورة",
    description: "صوت نسائي هادئ ومريح",
    gender: "female",
    accent: "Arabic",
    style: "Calm",
    elevenLabsVoiceId: "AZnzlk1XvdvUeBnXmlld",
    previewUrl: "/api/social-commerce/voice-preview/AZnzlk1XvdvUeBnXmlld?lang=ar",
    language: "ar",
  },
  {
    id: "voice-omar",
    name: "عمر",
    description: "صوت رجالي واثق ومؤثر",
    gender: "male",
    accent: "Arabic",
    style: "Confident",
    elevenLabsVoiceId: "TxGEqnHWrfWFTfGW9XjX",
    previewUrl: "/api/social-commerce/voice-preview/TxGEqnHWrfWFTfGW9XjX?lang=ar",
    language: "ar",
  },
];

// Helper function to get voices by language
export function getVoicesByLanguage(language: "en" | "ar"): VoiceActor[] {
  return VOICE_LIBRARY.filter(voice => voice.language === language);
}
