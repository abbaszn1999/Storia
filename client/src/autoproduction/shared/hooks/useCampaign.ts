import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ProductionCampaign } from '../types';

// Fetch campaign by ID
export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: [`/api/autoproduction/campaigns/${id}`],
    enabled: !!id,
  });
}

// Fetch all campaigns
export function useCampaigns(filters?: {
  type?: 'auto-video' | 'auto-story';
  status?: string;
}) {
  const queryKey = ['/api/autoproduction/campaigns', filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      
      const res = await apiRequest('GET', `/api/autoproduction/campaigns?${params}`);
      return await res.json();
    },
  });
}

// Create campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/autoproduction/campaigns', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/campaigns'] });
    },
  });
}

// Update campaign
export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ProductionCampaign>) => {
      const res = await apiRequest('PATCH', `/api/autoproduction/campaigns/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/autoproduction/campaigns/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/campaigns'] });
    },
  });
}

// Delete campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/autoproduction/campaigns/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/autoproduction/campaigns'] });
    },
  });
}
