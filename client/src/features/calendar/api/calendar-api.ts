// Calendar API Client
// ═══════════════════════════════════════════════════════════════════════════
// Client-side API for the content calendar

import { apiRequest } from '@/lib/queryClient';
import type {
  CalendarPostsResponse,
  CalendarQueryParams,
  CalendarPost,
  SchedulePostInput,
  SchedulePostResult,
  ReschedulePostInput,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────────────────────────────────────

export const calendarApi = {
  /**
   * Get calendar posts for a workspace
   */
  async getPosts(
    workspaceId: string,
    params: CalendarQueryParams = {}
  ): Promise<CalendarPostsResponse> {
    const queryParams = new URLSearchParams();
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.status) queryParams.append('status', params.status);
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/api/calendar/${workspaceId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest('GET', url);
    return response.json();
  },

  /**
   * Get a single calendar post
   */
  async getPost(workspaceId: string, postId: string): Promise<{ post: CalendarPost }> {
    const response = await apiRequest('GET', `/api/calendar/${workspaceId}/${postId}`);
    return response.json();
  },

  /**
   * Schedule a video/story for publishing
   */
  async schedulePost(
    workspaceId: string,
    input: SchedulePostInput
  ): Promise<SchedulePostResult> {
    const response = await apiRequest('POST', `/api/calendar/${workspaceId}/schedule`, input);
    return response.json();
  },

  /**
   * Reschedule a post
   */
  async reschedulePost(
    workspaceId: string,
    postId: string,
    input: ReschedulePostInput
  ): Promise<SchedulePostResult> {
    const response = await apiRequest('PUT', `/api/calendar/${workspaceId}/${postId}`, input);
    return response.json();
  },

  /**
   * Cancel (delete) a scheduled post
   */
  async cancelPost(
    workspaceId: string,
    postId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('DELETE', `/api/calendar/${workspaceId}/${postId}`);
    return response.json();
  },

  /**
   * Retry a failed post
   */
  async retryPost(
    workspaceId: string,
    postId: string
  ): Promise<{ post: CalendarPost; message: string }> {
    const response = await apiRequest('POST', `/api/calendar/${workspaceId}/${postId}/retry`);
    return response.json();
  },
};
