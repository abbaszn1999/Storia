import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { BatchProgress } from '../../shared/types';

// Start batch generation for auto-story
export function useStartBatchGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest('POST', `/api/autoproduction/story/${campaignId}/generate-batch`);
      return await res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story/${campaignId}`] });
    },
  });
}

// Track batch generation progress
export function useBatchProgress(campaignId: string | undefined, enabled = true) {
  return useQuery<BatchProgress>({
    queryKey: [`/api/autoproduction/story/${campaignId}/batch-progress`],
    enabled: !!campaignId && enabled,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });
}

// Cancel batch generation
export function useCancelBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest('POST', `/api/autoproduction/story/${campaignId}/cancel-batch`);
      return await res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story/${campaignId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story/${campaignId}/batch-progress`] });
    },
  });
}

// Fetch all stories for a campaign
export function useStories(campaignId: string | undefined) {
  return useQuery({
    queryKey: [`/api/autoproduction/story/${campaignId}/stories`],
    enabled: !!campaignId,
  });
}

// Approve/reject/regenerate a story
export function useUpdateStory(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: any }) => {
      const res = await apiRequest('PATCH', `/api/autoproduction/story/${campaignId}/stories/${itemId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story/${campaignId}/stories`] });
    },
  });
}

// Bulk actions
export function useApproveAll(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/autoproduction/story/${campaignId}/approve-all`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story/${campaignId}/stories`] });
    },
  });
}

export function useRegenerateFailed(campaignId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/autoproduction/story/${campaignId}/regenerate-failed`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/story/${campaignId}/stories`] });
    },
  });
}
