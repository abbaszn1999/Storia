/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAMPAIGN MANAGER SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Manages production campaigns for both Auto Video and Auto Story features.
 * Provides separate CRUD operations for each campaign type.
 */

import { storage } from '../../../storage';
import type { 
  VideoCampaign, 
  InsertVideoCampaign,
  StoryCampaign,
  InsertStoryCampaign 
} from '@shared/schema';

// ═══════════════════════════════════════════════════════════════
// VIDEO CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new video campaign
 */
export async function createVideoCampaign(data: InsertVideoCampaign): Promise<VideoCampaign> {
  console.log('[campaign-manager] Creating video campaign:', data.name);
  
  // Sanitize date fields - convert strings to Date objects or null
  const sanitizedData = {
    ...data,
    status: 'draft',
    scheduleStartDate: parseDate(data.scheduleStartDate),
    scheduleEndDate: parseDate(data.scheduleEndDate),
  };
  
  const campaign = await storage.createVideoCampaign(sanitizedData);
  
  console.log('[campaign-manager] ✓ Video campaign created:', campaign.id);
  return campaign;
}

/**
 * Get video campaign by ID
 */
export async function getVideoCampaign(id: string): Promise<VideoCampaign | undefined> {
  return await storage.getVideoCampaign(id);
}

/**
 * Update video campaign
 */
export async function updateVideoCampaign(
  id: string,
  data: Partial<VideoCampaign>
): Promise<VideoCampaign> {
  // Sanitize date fields if present
  const sanitizedData = { ...data };
  if ('scheduleStartDate' in data) {
    sanitizedData.scheduleStartDate = parseDate(data.scheduleStartDate);
  }
  if ('scheduleEndDate' in data) {
    sanitizedData.scheduleEndDate = parseDate(data.scheduleEndDate);
  }
  
  return await storage.updateVideoCampaign(id, sanitizedData);
}

/**
 * Delete video campaign
 */
export async function deleteVideoCampaign(id: string): Promise<void> {
  await storage.deleteVideoCampaign(id);
}

/**
 * List video campaigns by user
 */
export async function listVideoCampaignsByUser(
  userId: string,
  filters?: { status?: string }
): Promise<VideoCampaign[]> {
  const campaigns = await storage.getVideoCampaignsByUserId(userId);
  
  if (filters?.status) {
    return campaigns.filter(c => c.status === filters.status);
  }
  
  return campaigns;
}

/**
 * List video campaigns by workspace
 */
export async function listVideoCampaignsByWorkspace(
  workspaceId: string,
  filters?: { status?: string }
): Promise<VideoCampaign[]> {
  const campaigns = await storage.getVideoCampaignsByWorkspaceId(workspaceId);
  
  if (filters?.status) {
    return campaigns.filter(c => c.status === filters.status);
  }
  
  return campaigns;
}

// ═══════════════════════════════════════════════════════════════
// STORY CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new story campaign
 */
export async function createStoryCampaign(data: InsertStoryCampaign): Promise<StoryCampaign> {
  console.log('[campaign-manager] Creating story campaign:', data.name);
  
  // Sanitize date fields - convert strings to Date objects or null
  const sanitizedData = {
    ...data,
    status: 'draft',
    scheduleStartDate: parseDate(data.scheduleStartDate),
    scheduleEndDate: parseDate(data.scheduleEndDate),
  };
  
  const campaign = await storage.createStoryCampaign(sanitizedData);
  
  console.log('[campaign-manager] ✓ Story campaign created:', campaign.id);
  return campaign;
}

/**
 * Get story campaign by ID
 */
export async function getStoryCampaign(id: string): Promise<StoryCampaign | undefined> {
  return await storage.getStoryCampaign(id);
}

/**
 * Update story campaign
 */
export async function updateStoryCampaign(
  id: string,
  data: Partial<StoryCampaign>
): Promise<StoryCampaign> {
  // Sanitize date fields if present
  const sanitizedData = { ...data };
  if ('scheduleStartDate' in data) {
    sanitizedData.scheduleStartDate = parseDate(data.scheduleStartDate);
  }
  if ('scheduleEndDate' in data) {
    sanitizedData.scheduleEndDate = parseDate(data.scheduleEndDate);
  }
  
  return await storage.updateStoryCampaign(id, sanitizedData);
}

/**
 * Delete story campaign
 */
export async function deleteStoryCampaign(id: string): Promise<void> {
  await storage.deleteStoryCampaign(id);
}

/**
 * List story campaigns by user
 */
export async function listStoryCampaignsByUser(
  userId: string,
  filters?: { status?: string }
): Promise<StoryCampaign[]> {
  const campaigns = await storage.getStoryCampaignsByUserId(userId);
  
  if (filters?.status) {
    return campaigns.filter(c => c.status === filters.status);
  }
  
  return campaigns;
}

/**
 * List story campaigns by workspace
 */
export async function listStoryCampaignsByWorkspace(
  workspaceId: string,
  filters?: { status?: string }
): Promise<StoryCampaign[]> {
  const campaigns = await storage.getStoryCampaignsByWorkspaceId(workspaceId);
  
  if (filters?.status) {
    return campaigns.filter(c => c.status === filters.status);
  }
  
  return campaigns;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate progress for a campaign based on itemStatuses
 */
export function calculateCampaignProgress(itemStatuses: Record<string, { status: string }>): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
} {
  const statuses = Object.values(itemStatuses);
  const total = statuses.length;
  
  return {
    total,
    completed: statuses.filter(s => s.status === 'completed').length,
    failed: statuses.filter(s => s.status === 'failed').length,
    pending: statuses.filter(s => s.status === 'pending').length,
    inProgress: statuses.filter(s => s.status === 'generating').length,
  };
}

/**
 * Parse a date value to a Date object or null
 * Handles: Date objects, ISO strings, null, undefined
 */
function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}
