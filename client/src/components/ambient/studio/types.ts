// Ambient Visual Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type AmbientStepId = 1 | 2 | 3 | 4 | 5 | 6;

export interface AmbientStep {
  id: AmbientStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const AMBIENT_STEPS: AmbientStep[] = [
  { id: 1, label: 'Atmosphere', shortLabel: 'Atmosphere', icon: '🌊' },
  { id: 2, label: 'Visual World', shortLabel: 'Visual', icon: '🎨' },
  { id: 3, label: 'Flow Design', shortLabel: 'Flow', icon: '⚡' },
  { id: 4, label: 'Composition', shortLabel: 'Compose', icon: '🎬' },
  { id: 5, label: 'Preview', shortLabel: 'Preview', icon: '👁️' },
  { id: 6, label: 'Export', shortLabel: 'Export', icon: '🚀' },
];

