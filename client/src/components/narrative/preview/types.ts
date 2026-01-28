/**
 * Shared types for Narrative Preview components
 * 
 * Simplified for Shotstack Studio SDK integration.
 * The SDK handles timeline/audio internally.
 */

// Render state for final export
export interface RenderState {
  id: string;
  status: 'queued' | 'rendering' | 'done' | 'failed';
  url?: string;
  progress?: number;
  error?: string;
}

// Shotstack Edit type (simplified - full type in server/integrations/shotstack/types.ts)
export interface ShotstackEdit {
  timeline: {
    tracks: Array<{
      clips: Array<{
        asset: {
          type: string;
          src?: string;
          [key: string]: unknown;
        };
        start: number;
        length: number;
        [key: string]: unknown;
      }>;
    }>;
    soundtrack?: {
      src: string;
      effect?: string;
      volume?: number;
    };
    background?: string;
  };
  output: {
    format: string;
    resolution: string;
    fps?: number;
    [key: string]: unknown;
  };
}

// Step6Data structure from backend
export interface Step6Data {
  shotstackEdit?: ShotstackEdit;
  finalRender?: RenderState;
}

