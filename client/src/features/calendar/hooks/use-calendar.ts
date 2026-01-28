// Calendar Hooks
// ═══════════════════════════════════════════════════════════════════════════
// React Query hooks for the content calendar

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendar-api';
import type {
  CalendarQueryParams,
  SchedulePostInput,
  ReschedulePostInput,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const calendarKeys = {
  all: ['calendar'] as const,
  lists: () => [...calendarKeys.all, 'list'] as const,
  list: (workspaceId: string, params?: CalendarQueryParams) => 
    [...calendarKeys.lists(), workspaceId, params] as const,
  details: () => [...calendarKeys.all, 'detail'] as const,
  detail: (workspaceId: string, postId: string) => 
    [...calendarKeys.details(), workspaceId, postId] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook to fetch calendar posts for a workspace
 */
export function useCalendarPosts(
  workspaceId: string | undefined,
  params: CalendarQueryParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: calendarKeys.list(workspaceId || '', params),
    queryFn: () => calendarApi.getPosts(workspaceId!, params),
    enabled: !!workspaceId && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch a single calendar post
 */
export function useCalendarPost(
  workspaceId: string | undefined,
  postId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: calendarKeys.detail(workspaceId || '', postId || ''),
    queryFn: () => calendarApi.getPost(workspaceId!, postId!),
    enabled: !!workspaceId && !!postId && (options?.enabled !== false),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to schedule a new post
 */
export function useSchedulePost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SchedulePostInput) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      return calendarApi.schedulePost(workspaceId, input);
    },
    onSuccess: () => {
      // Invalidate calendar list to refetch
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
      }
    },
  });
}

/**
 * Hook to reschedule a post
 */
export function useReschedulePost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, input }: { postId: string; input: ReschedulePostInput }) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      return calendarApi.reschedulePost(workspaceId, postId, input);
    },
    onSuccess: (_, variables) => {
      // Invalidate both list and detail
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
        queryClient.invalidateQueries({ 
          queryKey: calendarKeys.detail(workspaceId, variables.postId) 
        });
      }
    },
  });
}

/**
 * Hook to cancel a scheduled post
 */
export function useCancelPost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      return calendarApi.cancelPost(workspaceId, postId);
    },
    onSuccess: () => {
      // Invalidate calendar list
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
      }
    },
  });
}

/**
 * Hook to retry a failed post
 */
export function useRetryPost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      return calendarApi.retryPost(workspaceId, postId);
    },
    onSuccess: (_, postId) => {
      // Invalidate both list and detail
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.lists() });
        queryClient.invalidateQueries({ 
          queryKey: calendarKeys.detail(workspaceId, postId) 
        });
      }
    },
  });
}
