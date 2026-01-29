import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import type { BatchProgress } from '../../shared/types';

// Start batch generation for auto-video
export function useStartBatchGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest('POST', `/api/autoproduction/video/${campaignId}/generate`);
      return await res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video-campaigns/${campaignId}`] });
    },
  });
}

// Track batch generation progress
export function useBatchProgress(campaignId: string | undefined, enabled = true) {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef<string | null>(null);
  
  return useQuery<BatchProgress>({
    queryKey: [`/api/autoproduction/video/${campaignId}/progress`],
    enabled: !!campaignId && enabled,
    refetchInterval: (data) => {
      // Stop polling when generation is no longer active
      const status = data?.campaign?.status;
      if (status !== 'generating') {
        return false; // Disable polling
      }
      return 2000; // Poll every 2 seconds while generating
    },
    refetchIntervalInBackground: true,
    onSuccess: (data) => {
      const newStatus = data?.campaign?.status;
      
      // When status changes FROM 'generating' TO something else (review/completed/failed)
      if (prevStatusRef.current === 'generating' && newStatus !== 'generating') {
        console.log('[useBatchProgress] Generation complete, refreshing campaign and videos...');
        
        // Invalidate campaign data to update status badge and overall state
        queryClient.invalidateQueries({ 
          queryKey: [`/api/autoproduction/video-campaigns/${campaignId}`] 
        });
        
        // Invalidate videos list to show newly generated videos
        queryClient.invalidateQueries({ 
          queryKey: [`/api/autoproduction/video/${campaignId}/videos`] 
        });
      }
      
      // Track previous status for next comparison
      prevStatusRef.current = newStatus || null;
    },
  });
}

// Cancel batch generation
export function useCancelBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest('POST', `/api/autoproduction/video/${campaignId}/cancel-batch`);
      return await res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video-campaigns/${campaignId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video/${campaignId}/batch-progress`] });
    },
  });
}

// Fetch all videos for a campaign
export function useVideos(campaignId: string | undefined) {
  return useQuery({
    queryKey: [`/api/autoproduction/video/${campaignId}/videos`],
    enabled: !!campaignId,
  });
}

// Update video status (approve/reject)
export function useUpdateVideo(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/autoproduction/video/${campaignId}/videos/${itemId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video/${campaignId}/videos`] });
    },
  });
}

// Bulk actions
export function useApproveAll(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/autoproduction/video/${campaignId}/approve-all`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video/${campaignId}/videos`] });
    },
  });
}

export function useRegenerateFailed(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/autoproduction/video/${campaignId}/regenerate-failed`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/video/${campaignId}/videos`] });
    },
  });
}
