// Calendar Month View Component
// ═══════════════════════════════════════════════════════════════════════════
// Month grid view for scheduled posts

import { useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  startOfWeek, 
  endOfWeek 
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { Calendar } from "lucide-react";
import type { CalendarPost, LatePlatform, LatePostStatus } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarMonthViewProps {
  posts: CalendarPost[];
  currentMonth: Date;
  onDayClick?: (date: Date) => void;
  onPostClick?: (postId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  youtube: SiYoutube,
  tiktok: SiTiktok,
  instagram: SiInstagram,
  facebook: SiFacebook,
};

const platformColors: Record<string, string> = {
  youtube: "bg-red-500",
  tiktok: "bg-black",
  instagram: "bg-pink-500",
  facebook: "bg-blue-600",
};

const statusDotColors: Record<LatePostStatus, string> = {
  draft: "bg-gray-400",
  scheduled: "bg-blue-500",
  publishing: "bg-yellow-500",
  published: "bg-green-500",
  failed: "bg-red-500",
  partial: "bg-orange-500",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getPostTitle(post: CalendarPost): string {
  // 1. Direct title field (YouTube videos have this)
  if (post.title) return post.title;
  
  // 2. Storia video/story data (if enriched)
  if (post.storiaVideo?.title) return post.storiaVideo.title;
  if (post.storiaStory?.projectName) return post.storiaStory.projectName;
  
  // 3. Storia metadata (mode-based fallback)
  if (post.storiaMetadata?.storiaContentMode) {
    const mode = post.storiaMetadata.storiaContentMode;
    return `${mode.charAt(0).toUpperCase() + mode.slice(1)} Video`;
  }
  
  // 4. Post content (caption) - truncate to first line or 30 chars (smaller for month view)
  if (post.content) {
    const firstLine = post.content.split('\n')[0].trim();
    const cleanContent = firstLine.replace(/#\w+/g, '').trim();
    if (cleanContent.length > 0) {
      return cleanContent.length > 30 
        ? cleanContent.substring(0, 27) + '...' 
        : cleanContent;
    }
  }
  
  // 5. Platform name as last resort
  const platform = post.platforms?.[0]?.platform;
  if (platform) {
    return `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
  }
  
  return "Untitled";
}

function getPostPlatforms(post: CalendarPost): LatePlatform[] {
  return post.platforms.map(p => p.platform);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function CalendarMonthView({ 
  posts, 
  currentMonth,
  onDayClick,
  onPostClick,
}: CalendarMonthViewProps) {
  // Generate all days for the calendar grid
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    
    posts.forEach(post => {
      if (!post.scheduledFor) return;
      const dateKey = format(new Date(post.scheduledFor), "yyyy-MM-dd");
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(post);
    });
    
    return map;
  }, [posts]);

  const getPostsForDate = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return postsByDate.get(dateKey) || [];
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div 
            key={day} 
            className="p-3 text-center text-sm font-medium border-b border-border"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {monthDays.map((day, index) => {
          const dayPosts = getPostsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={index}
              className={`min-h-32 p-2 border-b border-r border-border cursor-pointer transition-colors
                ${!isCurrentMonth ? "bg-muted/30" : "hover:bg-muted/50"}
                ${isToday ? "bg-primary/5" : ""}
              `}
              onClick={() => onDayClick?.(day)}
              data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    !isCurrentMonth ? "text-muted-foreground" : ""
                  } ${isToday ? "text-primary font-bold" : ""}`}
                >
                  {format(day, "d")}
                </span>
                {isToday && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    Today
                  </Badge>
                )}
              </div>

              {/* Posts for this day */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post, i) => {
                  const platforms = getPostPlatforms(post);
                  const title = getPostTitle(post);

                  return (
                    <div
                      key={post._id}
                      className="text-xs p-1.5 rounded bg-card border border-border hover:bg-accent cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick?.(post._id);
                      }}
                      data-testid={`calendar-item-${format(day, "yyyy-MM-dd")}-${i}`}
                    >
                      {/* Status dot + platforms */}
                      <div className="flex items-center gap-1 mb-1">
                        <div 
                          className={`h-2 w-2 rounded-full ${statusDotColors[post.status]}`} 
                          title={post.status}
                        />
                        {platforms.slice(0, 2).map(platform => {
                          const Icon = platformIcons[platform] || Calendar;
                          return (
                            <div
                              key={platform}
                              className={`p-0.5 rounded ${platformColors[platform]}`}
                            >
                              <Icon className="h-2 w-2 text-white" />
                            </div>
                          );
                        })}
                        {platforms.length > 2 && (
                          <span className="text-muted-foreground text-[10px]">
                            +{platforms.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <span className="font-medium truncate block">{title}</span>
                      
                      {/* Time */}
                      {post.scheduledFor && (
                        <span className="text-muted-foreground">
                          {format(new Date(post.scheduledFor), "h:mm a")}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Show more indicator */}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
