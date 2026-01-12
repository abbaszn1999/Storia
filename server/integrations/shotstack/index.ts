/**
 * Shotstack Integration Module
 * 
 * Cloud-based video editing API integration for Preview phase.
 * Provides timeline building, rendering, and status tracking.
 */

// Configuration
export {
  getShotstackConfig,
  isShotstackConfigured,
  SHOTSTACK_ENDPOINTS,
  type ShotstackConfig,
} from './config';

// Types
export type {
  // Edit API types
  ShotstackEdit,
  Timeline,
  Track,
  Clip,
  Asset,
  VideoAsset,
  ImageAsset,
  TitleAsset,
  HtmlAsset,
  AudioAsset,
  LumaAsset,
  Transition,
  TransitionEffect,
  Effect,
  Filter,
  Soundtrack,
  Output,
  MergeField,
  
  // Response types
  RenderResponse,
  RenderStatus,
  RenderStatusResponse,
  IngestRequest,
  IngestResponse,
  IngestStatus,
  
  // Webhook types
  ShotstackWebhookPayload,
  
  // Timeline builder types
  TimelineBuilderInput,
  TimelineBuilderOutput,
  TimelineScene,
  TimelineShot,
  TimelineShotVersion,
  AudioTrackItem,
  VolumeSettings,
  OutputSettings,
} from './types';

// Client
export {
  ShotstackClient,
  ShotstackAPIError,
  getShotstackClient,
} from './client';

// Timeline Builder
export {
  buildShotstackTimeline,
  calculateTotalDuration,
  validateTimelineInput,
} from './timeline-builder';

