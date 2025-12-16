// Ambient Visual Studio Types
// ═══════════════════════════════════════════════════════════════════════════

export type AmbientStepId = 0 | 1 | 2 | 3 | 4 | 5;

export interface AmbientStep {
  id: AmbientStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const AMBIENT_STEPS: AmbientStep[] = [
  { id: 0, label: 'Atmosphere', shortLabel: 'Atmosphere', icon: '🌊' },
  { id: 1, label: 'Visual World', shortLabel: 'Visual', icon: '🎨' },
  { id: 2, label: 'Flow Design', shortLabel: 'Flow', icon: '⚡' },
  { id: 3, label: 'Composition', shortLabel: 'Compose', icon: '🎬' },
  { id: 4, label: 'Preview', shortLabel: 'Preview', icon: '👁️' },
  { id: 5, label: 'Export', shortLabel: 'Export', icon: '🚀' },
];

