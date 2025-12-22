// Social Commerce Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type CommerceStepId = "setup" | "script" | "environment" | "world" | "storyboard" | "animatic" | "export";

export interface CommerceStep {
  id: CommerceStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const COMMERCE_STEPS: CommerceStep[] = [
  { id: "setup", label: "Campaign Configuration", shortLabel: "Setup", icon: "⚙️" },
  { id: "script", label: "Product DNA", shortLabel: "DNA", icon: "📦" },
  { id: "environment", label: "Environment & Story", shortLabel: "Story", icon: "🎭" },
  { id: "world", label: "Scene & Continuity", shortLabel: "Scenes", icon: "🎬" },
  { id: "storyboard", label: "Storyboard", shortLabel: "Storyboard", icon: "🎬" },
  { id: "animatic", label: "Animatic Preview", shortLabel: "Animatic", icon: "🎞️" },
  { id: "export", label: "Export & Publish", shortLabel: "Export", icon: "📤" },
];

