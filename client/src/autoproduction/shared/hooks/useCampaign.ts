import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { VideoCampaign, StoryCampaign } from '../types';

// ═══════════════════════════════════════════════════════════════
// VIDEO CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

// Fetch video campaign by ID
export function useVideoCampaign(id: string | undefined) {
  return useQuery<VideoCampaign>({
    queryKey: [`/api/autoproduction/video-campaigns/${id}`],
    enabled: !!id,
  });
}

// Fetch all video campaigns
export function useVideoCampaigns(filters?: { status?: string }) {
  const queryKey = ['/api/autoproduction/video-campaigns', filters];
  
  return useQuery<VideoCampaign[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      
      const res = await apiRequest('GET', `/api/autoproduction/video-campaigns?${params}`);
      return await res.json();
    },
  });
}

// Create video campaign
export function useCreateVideoCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<VideoCampaign>) => {
      const res = await apiRequest('POST', '/api/autoproduction/video-campaigns', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/video-campaigns'] });
    },
  });
}

// Update video campaign
export function useUpdateVideoCampaign(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<VideoCampaign>) => {
      const res = await apiRequest('PATCH', `/api/autoproduction/video-campaigns/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video-campaigns/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/video-campaigns'] });
    },
  });
}

// Delete video campaign
export function useDeleteVideoCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/autoproduction/video-campaigns/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/video-campaigns'] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// STORY CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

// Fetch story campaign by ID
export function useStoryCampaign(id: string | undefined) {
  return useQuery<StoryCampaign>({
    queryKey: [`/api/autoproduction/story-campaigns/${id}`],
    enabled: !!id,
  });
}

// Fetch all story campaigns
export function useStoryCampaigns(filters?: { status?: string }) {
  const queryKey = ['/api/autoproduction/story-campaigns', filters];
  
  return useQuery<StoryCampaign[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      
      const res = await apiRequest('GET', `/api/autoproduction/story-campaigns?${params}`);
      return await res.json();
    },
  });
}

// Create story campaign
export function useCreateStoryCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<StoryCampaign>) => {
      const res = await apiRequest('POST', '/api/autoproduction/story-campaigns', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/story-campaigns'] });
    },
  });
}

// Update story campaign
export function useUpdateStoryCampaign(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<StoryCampaign>) => {
      const res = await apiRequest('PATCH', `/api/autoproduction/story-campaigns/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story-campaigns/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/story-campaigns'] });
    },
  });
}

// Delete story campaign
export function useDeleteStoryCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/autoproduction/story-campaigns/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/story-campaigns'] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// BATCH GENERATION (Story Campaigns)
// ═══════════════════════════════════════════════════════════════

// Start batch generation
export function useStartBatchGeneration(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/autoproduction/auto-story/${campaignId}/generate-batch`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story-campaigns/${campaignId}`] });
    },
  });
}

// Get batch progress
export function useBatchProgress(campaignId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [`/api/autoproduction/auto-story/${campaignId}/batch-progress`],
    enabled: !!campaignId && enabled,
    refetchInterval: 2000, // Poll every 2 seconds during generation
  });
}

// Cancel batch generation
export function useCancelBatchGeneration(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/autoproduction/auto-story/${campaignId}/cancel-batch`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story-campaigns/${campaignId}`] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY (deprecated, use specific hooks above)
// ═══════════════════════════════════════════════════════════════

// Generic campaign hooks - kept for backward compatibility
export function useCampaign(id: string | undefined) {
  // Default to story campaign for backward compatibility
  return useStoryCampaign(id);
}

export function useCampaigns(filters?: { type?: 'auto-video' | 'auto-story'; status?: string }) {
  // Return based on type filter
  const videoCampaigns = useVideoCampaigns(filters?.type === 'auto-video' ? filters : undefined);
  const storyCampaigns = useStoryCampaigns(filters?.type === 'auto-story' ? filters : undefined);
  
  if (filters?.type === 'auto-video') {
    return videoCampaigns;
  }
  if (filters?.type === 'auto-story') {
    return storyCampaigns;
  }
  
  // If no type specified, return story campaigns by default
  return storyCampaigns;
}
