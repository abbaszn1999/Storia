import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { BatchProgress, GenerationJob } from '../types';

// Track generation progress (polling)
export function useGenerationProgress(campaignId: string | undefined, enabled = true) {
  return useQuery<BatchProgress>({
    queryKey: [`/api/autoproduction/campaigns/${campaignId}/progress`],
    enabled: !!campaignId && enabled,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });
}

// Start generation
export function useStartGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation<GenerationJob, Error, string>({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest('POST', `/api/autoproduction/campaigns/${campaignId}/generate`);
      return await res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/campaigns/${campaignId}`] });
    },
  });
}

// Cancel generation
export function useCancelGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiRequest('POST', `/api/autoproduction/campaigns/${campaignId}/cancel`);
      return await res.json();
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/campaigns/${campaignId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/campaigns/${campaignId}/progress`] });
    },
  });
}
