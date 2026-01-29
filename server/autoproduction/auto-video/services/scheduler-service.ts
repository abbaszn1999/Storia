/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SCHEDULER SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Calculates and manages publish schedules for video campaigns.
 * Supports continuous scheduling (evenly spread) and custom date assignments.
 */

import type { ItemSchedule, ContinuousScheduleOptions } from '../types';
import type { VideoCampaign } from '@shared/schema';

// ═══════════════════════════════════════════════════════════════
// CONTINUOUS SCHEDULING
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate continuous schedule: spread N videos evenly over time
 * 
 * @param startDate - Starting date for first video
 * @param videosPerDay - Number of videos to publish per day
 * @param videoCount - Total number of videos to schedule
 * @param preferredHours - Optional array of preferred hours (0-23)
 * @param skipWeekends - Optional flag to skip Saturday/Sunday
 * @returns Array of Date objects for each video
 */
export function calculateContinuousSchedule(
  startDate: Date,
  videosPerDay: number,
  videoCount: number,
  preferredHours?: number[],
  skipWeekends?: boolean
): Date[] {
  console.log('[scheduler] Calculating continuous schedule:', {
    startDate,
    videosPerDay,
    videoCount,
    preferredHours,
    skipWeekends
  });

  const schedules: Date[] = [];
  
  if (videosPerDay <= 0 || videoCount <= 0) {
    return schedules;
  }

  // Calculate interval between videos (in milliseconds)
  const hoursPerDay = 24;
  const intervalHours = hoursPerDay / videosPerDay;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  let currentDate = new Date(startDate);
  let videosScheduled = 0;

  // If preferred hours are specified, use them
  const usePreferredHours = preferredHours && preferredHours.length > 0;
  let preferredHourIndex = 0;

  while (videosScheduled < videoCount) {
    // Skip weekends if requested
    if (skipWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
      // Move to next Monday
      const daysToAdd = currentDate.getDay() === 0 ? 1 : 2;
      currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      currentDate.setHours(0, 0, 0, 0);
      continue;
    }

    // Use preferred hours if specified
    if (usePreferredHours && preferredHours) {
      const hour = preferredHours[preferredHourIndex % preferredHours.length];
      const scheduledDate = new Date(currentDate);
      scheduledDate.setHours(hour, 0, 0, 0);
      
      schedules.push(scheduledDate);
      videosScheduled++;
      preferredHourIndex++;

      // If we've used all preferred hours for today, move to next day
      if (preferredHourIndex % preferredHours.length === 0) {
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        currentDate.setHours(0, 0, 0, 0);
      }
    } else {
      // Evenly spread videos throughout the day
      schedules.push(new Date(currentDate));
      videosScheduled++;
      currentDate = new Date(currentDate.getTime() + intervalMs);
    }
  }

  console.log(`[scheduler] ✓ Generated ${schedules.length} schedule dates`);
  return schedules;
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build itemSchedules format from an array of dates
 * 
 * @param dates - Array of scheduled dates
 * @returns Record of itemSchedules {"0": {scheduledDate: ...}, "1": {...}, ...}
 */
export function buildItemSchedulesFromDates(dates: Date[]): Record<string, ItemSchedule> {
  const itemSchedules: Record<string, ItemSchedule> = {};
  
  dates.forEach((date, index) => {
    itemSchedules[index] = {
      scheduledDate: date,
      publishStatus: 'scheduled',
    };
  });

  return itemSchedules;
}

/**
 * Build itemSchedules from user-picked topic schedules
 * Converts from [{topic, date}, ...] to {"0": {scheduledDate}, ...}
 * 
 * @param topicSchedules - Array of {topic, scheduledDate} objects
 * @returns Record of itemSchedules
 */
export function buildItemSchedulesFromTopicSchedules(
  topicSchedules: Array<{ topic: string; scheduledDate: Date }>
): Record<string, ItemSchedule> {
  const itemSchedules: Record<string, ItemSchedule> = {};
  
  topicSchedules.forEach((schedule, index) => {
    itemSchedules[index] = {
      scheduledDate: schedule.scheduledDate,
      publishStatus: 'scheduled',
    };
  });

  return itemSchedules;
}

// ═══════════════════════════════════════════════════════════════
// CAMPAIGN SCHEDULE HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the next video scheduled to publish from a campaign
 * Useful for automation runners
 * 
 * @param campaign - The video campaign
 * @returns Next scheduled item or null
 */
export function getNextScheduledVideo(campaign: VideoCampaign): {
  index: number;
  scheduledDate: Date;
} | null {
  const itemSchedules = (campaign.itemSchedules as Record<string, ItemSchedule>) || {};
  const itemStatuses = (campaign.itemStatuses as Record<string, any>) || {};
  
  let nextVideo: { index: number; scheduledDate: Date } | null = null;
  let earliestDate: Date | null = null;

  Object.entries(itemSchedules).forEach(([index, schedule]) => {
    // Only consider completed videos that haven't been published yet
    const status = itemStatuses[index];
    if (status?.status !== 'completed' || schedule.publishStatus === 'published') {
      return;
    }

    const scheduledDate = schedule.scheduledDate ? new Date(schedule.scheduledDate) : null;
    if (!scheduledDate) {
      return;
    }

    // Check if this is the earliest scheduled date
    if (!earliestDate || scheduledDate < earliestDate) {
      earliestDate = scheduledDate;
      nextVideo = { index: parseInt(index), scheduledDate };
    }
  });

  return nextVideo;
}

/**
 * Get all videos scheduled for a specific date
 * 
 * @param campaign - The video campaign
 * @param date - Target date (will compare year/month/day only)
 * @returns Array of {index, scheduledDate, videoId}
 */
export function getVideosScheduledForDate(
  campaign: VideoCampaign,
  date: Date
): Array<{ index: number; scheduledDate: Date; videoId?: string }> {
  const itemSchedules = (campaign.itemSchedules as Record<string, ItemSchedule>) || {};
  const itemStatuses = (campaign.itemStatuses as Record<string, any>) || {};
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const videos: Array<{ index: number; scheduledDate: Date; videoId?: string }> = [];

  Object.entries(itemSchedules).forEach(([index, schedule]) => {
    const scheduledDate = schedule.scheduledDate ? new Date(schedule.scheduledDate) : null;
    if (!scheduledDate) {
      return;
    }

    const scheduleDay = new Date(scheduledDate);
    scheduleDay.setHours(0, 0, 0, 0);

    if (scheduleDay.getTime() === targetDate.getTime()) {
      videos.push({
        index: parseInt(index),
        scheduledDate,
        videoId: itemStatuses[index]?.videoId,
      });
    }
  });

  // Sort by time
  videos.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  return videos;
}

/**
 * Preview continuous schedule for a campaign
 * Useful for showing user the schedule before applying it
 * 
 * @param options - Scheduling options
 * @returns Array of preview dates
 */
export function previewContinuousSchedule(options: ContinuousScheduleOptions & { videoCount: number }): Date[] {
  return calculateContinuousSchedule(
    options.startDate,
    options.videosPerDay,
    options.videoCount,
    options.preferredHours,
    options.skipWeekends
  );
}
