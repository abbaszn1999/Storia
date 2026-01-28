// Character Vlog Studio Types
// ═══════════════════════════════════════════════════════════════════════════

import { LucideIcon, FileText, Users, Film, Image, Play, Eye, Download } from "lucide-react";

export type VlogStepId = "script" | "elements" | "scenes" | "storyboard" | "animatic" | "preview" | "export";

export interface VlogStep {
  id: VlogStepId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const VLOG_STEPS: VlogStep[] = [
  { id: "script", label: "Script Editor", shortLabel: "Script", icon: FileText },
  { id: "elements", label: "Elements", shortLabel: "Elements", icon: Users },
  { id: "scenes", label: "Scene Breakdown", shortLabel: "Scenes", icon: Film },
  { id: "storyboard", label: "Storyboard", shortLabel: "Storyboard", icon: Image },
  { id: "animatic", label: "Animatic & Sound", shortLabel: "Sound", icon: Play },
  { id: "preview", label: "Preview", shortLabel: "Preview", icon: Eye },
  { id: "export", label: "Export & Publish", shortLabel: "Export", icon: Download },
];

