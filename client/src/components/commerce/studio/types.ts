// Social Commerce Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type CommerceStepId = "setup" | "script" | "storyboard" | "voiceover" | "animatic" | "export";

export interface CommerceStep {
  id: CommerceStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const COMMERCE_STEPS: CommerceStep[] = [
  { id: "setup", label: "Campaign Configuration", shortLabel: "Setup", icon: "⚙️" },
  { id: "script", label: "Creative Spark & Beats", shortLabel: "Script", icon: "📝" },
  { id: "storyboard", label: "Storyboard", shortLabel: "Storyboard", icon: "🎬" },
  { id: "voiceover", label: "Voiceover", shortLabel: "Voiceover", icon: "🎤" },
  { id: "animatic", label: "Animatic Preview", shortLabel: "Animatic", icon: "🎞️" },
  { id: "export", label: "Export & Publish", shortLabel: "Export", icon: "📤" },
];

