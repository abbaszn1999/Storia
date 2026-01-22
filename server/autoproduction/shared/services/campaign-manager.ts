/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAMPAIGN MANAGER SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Manages production campaigns (both auto-video and auto-story).
 */

import { storage } from '../../../storage';
import type { ProductionCampaign, InsertProductionCampaign } from '@shared/schema';

/**
 * Create a new campaign
 */
export async function createCampaign(data: InsertProductionCampaign): Promise<ProductionCampaign> {
  console.log('[campaign-manager] Creating campaign:', data.name);
  
  // Set initial values
  const totalItems = data.type === 'auto-story' 
    ? (data.storyTopics?.length || 0)
    : (data.storyIdeas?.length || 0);
  
  const campaignData = {
    ...data,
    totalItems,
    itemsGenerated: 0,
    itemsPublished: 0,
    status: 'draft',
  };
  
  const campaign = await storage.createProductionCampaign(campaignData as any);
  
  console.log('[campaign-manager] ✓ Campaign created:', campaign.id);
  return campaign;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(id: string): Promise<ProductionCampaign | null> {
  return await storage.getProductionCampaign(id);
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: string,
  data: Partial<ProductionCampaign>
): Promise<ProductionCampaign> {
  return await storage.updateProductionCampaign(id, data);
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  await storage.deleteProductionCampaign(id);
}

/**
 * List campaigns
 */
export async function listCampaigns(
  userId: string,
  filters?: { type?: string; status?: string }
): Promise<ProductionCampaign[]> {
  const campaigns = await storage.getProductionCampaignsByUserId(userId);
  
  let filtered = campaigns;
  
  if (filters?.type) {
    filtered = filtered.filter(c => c.type === filters.type);
  }
  
  if (filters?.status) {
    filtered = filtered.filter(c => c.status === filters.status);
  }
  
  return filtered;
}
