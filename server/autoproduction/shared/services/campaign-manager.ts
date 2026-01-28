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
  
  const campaign = await storage.createVideoCampaign({
    ...data,
    status: 'draft',
  });
  
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
  return await storage.updateVideoCampaign(id, data);
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
  
  const campaign = await storage.createStoryCampaign({
    ...data,
    status: 'draft',
  });
  
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
  return await storage.updateStoryCampaign(id, data);
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
