export interface VoiceActor {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  accent: string;
  style: string;
  elevenLabsVoiceId: string;
  previewUrl: string;
}

export const VOICE_LIBRARY: VoiceActor[] = [
  {
    id: "voice-adam",
    name: "Adam",
    description: "Deep, authoritative male voice perfect for documentaries and narration",
    gender: "male",
    accent: "American",
    style: "Professional",
    elevenLabsVoiceId: "pNInz6obpgDQGcFmaJgB",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/4ec35e52-1f1e-40bb-b33e-fb1c6a49f97a.mp3",
  },
  {
    id: "voice-rachel",
    name: "Rachel",
    description: "Warm, friendly female voice ideal for storytelling and casual content",
    gender: "female",
    accent: "American",
    style: "Friendly",
    elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/65d80f52-703f-4cae-a91d-75d4e200ed02.mp3",
  },
  {
    id: "voice-domi",
    name: "Domi",
    description: "Confident, strong female voice great for motivational content",
    gender: "female",
    accent: "American",
    style: "Confident",
    elevenLabsVoiceId: "AZnzlk1XvdvUeBnXmlld",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4b61-a1ec-e41af9a04335.mp3",
  },
  {
    id: "voice-bella",
    name: "Bella",
    description: "Soft, soothing female voice perfect for relaxing and ASMR content",
    gender: "female",
    accent: "American",
    style: "Soothing",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04365bce-98cc-4e99-9f10-56b60680cda9.mp3",
  },
  {
    id: "voice-josh",
    name: "Josh",
    description: "Young, energetic male voice ideal for dynamic and upbeat content",
    gender: "male",
    accent: "American",
    style: "Energetic",
    elevenLabsVoiceId: "TxGEqnHWrfWFTfGW9XjX",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c6c80dc4-ca95-48a8-8cdd-9e1b0a0e5d9d.mp3",
  },
  {
    id: "voice-antoni",
    name: "Antoni",
    description: "Well-rounded, versatile male voice suitable for any content type",
    gender: "male",
    accent: "American",
    style: "Versatile",
    elevenLabsVoiceId: "ErXwobaYiN019PkySvjV",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f8f0-1b01-4f48-9a1d-b8a16e74b2a0.mp3",
  },
  {
    id: "voice-charlotte",
    name: "Charlotte",
    description: "Clear, articulate female voice excellent for educational content",
    gender: "female",
    accent: "British",
    style: "Educational",
    elevenLabsVoiceId: "XB0fDUnXU5powFXDhCwa",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3",
  },
  {
    id: "voice-callum",
    name: "Callum",
    description: "Mature, compelling male voice perfect for dramatic storytelling",
    gender: "male",
    accent: "British",
    style: "Dramatic",
    elevenLabsVoiceId: "N2lVS1w4EtoT3dr4eOWO",
    previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3",
  },
];
