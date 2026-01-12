/**
 * Shotstack API Types
 * 
 * TypeScript interfaces matching the Shotstack Edit API JSON schema.
 * See: https://shotstack.io/docs/api/
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main edit request structure
 */
export interface ShotstackEdit {
  timeline: Timeline;
  output: Output;
  merge?: MergeField[];
  callback?: string;
  disk?: 'local' | 'mount';
}

/**
 * Timeline containing tracks and optional soundtrack
 */
export interface Timeline {
  tracks: Track[];
  soundtrack?: Soundtrack;
  background?: string;
  fonts?: Font[];
  cache?: boolean;
}

/**
 * A track is a layer in the timeline containing clips
 */
export interface Track {
  clips: Clip[];
}

/**
 * A clip is a media element positioned on the timeline
 */
export interface Clip {
  asset: Asset;
  start: number;
  length: number;
  fit?: 'cover' | 'contain' | 'crop' | 'none';
  scale?: number;
  position?: 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft' | 'center';
  offset?: Offset;
  transition?: Transition;
  effect?: Effect;
  filter?: Filter;
  opacity?: number;
  transform?: Transform;
}

/**
 * Asset types
 */
export type Asset = VideoAsset | ImageAsset | TitleAsset | HtmlAsset | AudioAsset | LumaAsset;

/**
 * Video asset
 */
export interface VideoAsset {
  type: 'video';
  src: string;
  trim?: number;
  volume?: number;
  volumeEffect?: 'fadeIn' | 'fadeOut' | 'fadeInFadeOut';
  crop?: Crop;
}

/**
 * Image asset
 */
export interface ImageAsset {
  type: 'image';
  src: string;
  crop?: Crop;
}

/**
 * Title/text asset
 */
export interface TitleAsset {
  type: 'title';
  text: string;
  style?: string;
  color?: string;
  size?: 'xx-small' | 'x-small' | 'small' | 'medium' | 'large' | 'x-large' | 'xx-large';
  background?: string;
  position?: 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft' | 'center';
  offset?: Offset;
}

/**
 * HTML asset
 */
export interface HtmlAsset {
  type: 'html';
  html: string;
  css?: string;
  width?: number;
  height?: number;
  background?: string;
  position?: 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottom' | 'bottomLeft' | 'left' | 'topLeft' | 'center';
}

/**
 * Audio asset
 */
export interface AudioAsset {
  type: 'audio';
  src: string;
  trim?: number;
  volume?: number;
  effect?: 'fadeIn' | 'fadeOut' | 'fadeInFadeOut';
}

/**
 * Luma matte asset for transitions
 */
export interface LumaAsset {
  type: 'luma';
  src: string;
  trim?: number;
}

/**
 * Crop settings
 */
export interface Crop {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * Offset positioning
 */
export interface Offset {
  x?: number;
  y?: number;
}

/**
 * Transition between clips
 */
export interface Transition {
  in?: TransitionEffect;
  out?: TransitionEffect;
}

export type TransitionEffect = 
  | 'fade'
  | 'reveal'
  | 'wipeLeft'
  | 'wipeRight'
  | 'wipeUp'
  | 'wipeDown'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'carouselLeft'
  | 'carouselRight'
  | 'carouselUp'
  | 'carouselDown'
  | 'shuffleTopRight'
  | 'shuffleRightTop'
  | 'shuffleRightBottom'
  | 'shuffleBottomRight'
  | 'shuffleBottomLeft'
  | 'shuffleLeftBottom'
  | 'shuffleLeftTop'
  | 'shuffleTopLeft'
  | 'zoom';

/**
 * Motion effect
 */
export type Effect = 
  | 'zoomIn'
  | 'zoomOut'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown';

/**
 * Color filter
 */
export type Filter = 
  | 'boost'
  | 'contrast'
  | 'darken'
  | 'greyscale'
  | 'lighten'
  | 'muted'
  | 'negative'
  | 'sepia'
  | 'vintage'
  | 'warm';

/**
 * Transform settings
 */
export interface Transform {
  rotate?: Rotate;
  skew?: Skew;
  flip?: Flip;
}

export interface Rotate {
  angle?: number;
}

export interface Skew {
  x?: number;
  y?: number;
}

export interface Flip {
  horizontal?: boolean;
  vertical?: boolean;
}

/**
 * Background soundtrack
 */
export interface Soundtrack {
  src: string;
  effect?: 'fadeIn' | 'fadeOut' | 'fadeInFadeOut';
  volume?: number;
}

/**
 * Custom font
 */
export interface Font {
  src: string;
}

/**
 * Merge field for dynamic content
 */
export interface MergeField {
  find: string;
  replace: string | number;
}

/**
 * Output settings
 */
export interface Output {
  format: 'mp4' | 'gif' | 'jpg' | 'png' | 'bmp' | 'mp3' | 'webm';
  resolution?: 'preview' | 'mobile' | 'sd' | 'hd' | '1080' | '4k';
  aspectRatio?: string;
  size?: Size;
  fps?: number;
  scaleTo?: 'preview' | 'mobile' | 'sd' | 'hd' | '1080' | '4k';
  quality?: 'low' | 'medium' | 'high';
  repeat?: boolean;
  mute?: boolean;
  range?: Range;
  poster?: Poster;
  thumbnail?: Thumbnail;
  destinations?: Destination[];
}

export interface Size {
  width?: number;
  height?: number;
}

export interface Range {
  start?: number;
  length?: number;
}

export interface Poster {
  capture: number;
}

export interface Thumbnail {
  capture: number;
  scale: number;
}

export interface Destination {
  provider: string;
  options?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Render request response
 */
export interface RenderResponse {
  success: boolean;
  message: string;
  response: {
    id: string;
    owner: string;
    plan: string;
    status: RenderStatus;
    error?: string;
    duration?: number;
    billable?: number;
    renderTime?: number;
    url?: string;
    poster?: string;
    thumbnail?: string;
    created: string;
    updated: string;
  };
}

/**
 * Render status
 */
export type RenderStatus = 
  | 'queued'
  | 'fetching'
  | 'rendering'
  | 'saving'
  | 'done'
  | 'failed';

/**
 * Render status response
 */
export interface RenderStatusResponse {
  success: boolean;
  message: string;
  response: {
    id: string;
    owner: string;
    plan: string;
    status: RenderStatus;
    error?: string;
    duration?: number;
    billable?: number;
    renderTime?: number;
    url?: string;
    poster?: string;
    thumbnail?: string;
    data?: ShotstackEdit;
    created: string;
    updated: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INGEST API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ingest source request
 */
export interface IngestRequest {
  url: string;
}

/**
 * Ingest response
 */
export interface IngestResponse {
  success: boolean;
  message: string;
  response: {
    id: string;
    owner: string;
    status: IngestStatus;
    source?: string;
    url?: string;
    error?: string;
    created: string;
    updated: string;
  };
}

/**
 * Ingest status
 */
export type IngestStatus = 
  | 'queued'
  | 'importing'
  | 'ready'
  | 'failed'
  | 'deleted';

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Webhook payload from Shotstack
 */
export interface ShotstackWebhookPayload {
  type: 'render' | 'ingest';
  action: 'render' | 'status';
  id: string;
  owner: string;
  status: RenderStatus | IngestStatus;
  url?: string;
  error?: string;
  completed?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL TIMELINE BUILDER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Input for timeline builder from ambient-visual data
 */
export interface TimelineBuilderInput {
  scenes: TimelineScene[];
  shots: Record<string, TimelineShot[]>;
  shotVersions: Record<string, TimelineShotVersion[]>;
  audioTracks: {
    voiceover?: AudioTrackItem;
    music?: AudioTrackItem;
    ambient?: AudioTrackItem;
  };
  // SFX clips array - separate from audioTracks because each entry has start/duration
  sfxClips?: SfxClipItem[];
  volumes: VolumeSettings;
  output: OutputSettings;
}

// SFX clip item for pre-computed SFX timeline
export interface SfxClipItem {
  id: string;
  src: string;
  start: number;
  duration: number;
  shotId: string;
  volume?: number;
}

export interface TimelineScene {
  id: string;
  sceneNumber: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  loopCount?: number | null;
}

export interface TimelineShot {
  id: string;
  sceneId: string;
  shotNumber: number;
  duration: number;
  loopCount?: number | null;
  transition?: string | null;
  soundEffectDescription?: string | null;
  soundEffectUrl?: string | null;
}

export interface TimelineShotVersion {
  id: string;
  shotId: string;
  videoUrl?: string | null;
  soundEffectPrompt?: string | null;
}

export interface AudioTrackItem {
  src: string;
  volume?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

export interface VolumeSettings {
  master: number;
  sfx: number;
  voiceover: number;
  music: number;
  ambient: number;
}

export interface OutputSettings {
  format: 'mp4' | 'webm';
  resolution: 'sd' | 'hd' | '1080' | '4k';
  aspectRatio: string;
  fps?: number;
  // Thumbnail settings for final renders
  thumbnail?: {
    capture: number;  // Time in seconds to capture thumbnail
    scale: number;    // Scale factor (0.0 to 1.0)
  };
}

/**
 * Output from timeline builder
 */
export interface TimelineBuilderOutput {
  edit: ShotstackEdit;
  totalDuration: number;
  clipCount: number;
}

