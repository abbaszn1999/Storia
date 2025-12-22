// Character Vlog Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type VlogStepId = "script" | "elements" | "scenes" | "storyboard" | "animatic" | "export";

export interface VlogStep {
  id: VlogStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const VLOG_STEPS: VlogStep[] = [
  { id: "script", label: "Script Editor", shortLabel: "Script", icon: "📝" },
  { id: "elements", label: "Elements", shortLabel: "Elements", icon: "👤" },
  { id: "scenes", label: "Scene Breakdown", shortLabel: "Scenes", icon: "🎬" },
  { id: "storyboard", label: "Storyboard", shortLabel: "Storyboard", icon: "🎨" },
  { id: "animatic", label: "Animatic Preview", shortLabel: "Animatic", icon: "🎞️" },
  { id: "export", label: "Export & Publish", shortLabel: "Export", icon: "📤" },
];

