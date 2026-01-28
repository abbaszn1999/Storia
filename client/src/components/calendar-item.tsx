import { Calendar, ExternalLink, Clock, MoreVertical, RefreshCw, X, Edit } from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { CalendarPost, LatePlatform, LatePostStatus } from "@/features/calendar/types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarItemProps {
  post: CalendarPost;
  onReschedule?: (postId: string) => void;
  onCancel?: (postId: string) => void;
  onRetry?: (postId: string) => void;
  onViewDetails?: (postId: string) => void;
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
  instagram: "bg-gradient-to-tr from-purple-600 to-pink-500",
  facebook: "bg-blue-600",
};

const statusConfig: Record<LatePostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  publishing: { label: "Publishing...", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  published: { label: "Published", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  failed: { label: "Failed", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  partial: { label: "Partial", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getTitle(post: CalendarPost): string {
  // Try to get title from various sources (priority order)
  
  // 1. Direct title field (YouTube videos have this)
  if (post.title) return post.title;
  
  // 2. Storia video/story data (if enriched)
  if (post.storiaVideo?.title) return post.storiaVideo.title;
  if (post.storiaStory?.projectName) return post.storiaStory.projectName;
  
  // 3. Storia metadata (mode-based fallback)
  if (post.storiaMetadata?.storiaContentMode) {
    const mode = post.storiaMetadata.storiaContentMode;
    // Capitalize first letter
    return `${mode.charAt(0).toUpperCase() + mode.slice(1)} Video`;
  }
  
  // 4. Post content (caption) - truncate to first line or 50 chars
  if (post.content) {
    const firstLine = post.content.split('\n')[0].trim();
    // Remove hashtags and truncate
    const cleanContent = firstLine.replace(/#\w+/g, '').trim();
    if (cleanContent.length > 0) {
      return cleanContent.length > 50 
        ? cleanContent.substring(0, 47) + '...' 
        : cleanContent;
    }
  }
  
  // 5. Platform-specific custom content
  const customContent = post.platforms?.[0]?.customContent;
  if (customContent) {
    const firstLine = customContent.split('\n')[0].trim();
    const cleanContent = firstLine.replace(/#\w+/g, '').trim();
    if (cleanContent.length > 0) {
      return cleanContent.length > 50 
        ? cleanContent.substring(0, 47) + '...' 
        : cleanContent;
    }
  }
  
  // 6. Platform name as last resort
  const platform = post.platforms?.[0]?.platform;
  if (platform) {
    return `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`;
  }
  
  return "Untitled";
}

function getThumbnail(post: CalendarPost): string | null {
  if (post.storiaMetadata?.storiaThumbnailUrl) return post.storiaMetadata.storiaThumbnailUrl;
  if (post.storiaVideo?.thumbnailUrl) return post.storiaVideo.thumbnailUrl;
  if (post.storiaStory?.thumbnailUrl) return post.storiaStory.thumbnailUrl;
  // Try to get from media items
  if (post.mediaItems?.[0]?.url) return null; // Videos don't have inline thumbnails
  return null;
}

function getPlatforms(post: CalendarPost): LatePlatform[] {
  return post.platforms.map(p => p.platform);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function CalendarItem({ 
  post, 
  onReschedule, 
  onCancel, 
  onRetry, 
  onViewDetails 
}: CalendarItemProps) {
  const title = getTitle(post);
  const thumbnail = getThumbnail(post);
  const platforms = getPlatforms(post);
  const statusInfo = statusConfig[post.status] || statusConfig.scheduled;
  const scheduledDate = post.scheduledFor ? new Date(post.scheduledFor) : null;
  
  const canReschedule = post.status === 'scheduled' || post.status === 'draft';
  const canCancel = post.status !== 'published' && post.status !== 'publishing';
  const canRetry = post.status === 'failed' || post.status === 'partial';

  return (
    <Card className="hover:bg-muted/30 transition-colors" data-testid="card-calendar-item">
      <CardHeader className="flex flex-row items-start gap-3 p-4">
        {/* Thumbnail */}
        <div className="relative w-20 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 
                className="font-semibold truncate text-sm cursor-pointer hover:underline" 
                data-testid="text-calendar-title"
                onClick={() => onViewDetails?.(post._id)}
              >
                {title}
              </h3>
              
              {/* Date/Time */}
              {scheduledDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {format(scheduledDate, "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}

              {/* Platforms */}
              <div className="flex items-center gap-1.5 mt-2">
                {platforms.map(platform => {
                  const Icon = platformIcons[platform] || Calendar;
                  return (
                    <div
                      key={platform}
                      className={`p-1 rounded ${platformColors[platform] || 'bg-muted'}`}
                      title={platform}
                    >
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status + Actions */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                {statusInfo.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(post._id)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  
                  {canReschedule && onReschedule && (
                    <DropdownMenuItem onClick={() => onReschedule(post._id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Reschedule
                    </DropdownMenuItem>
                  )}
                  
                  {canRetry && onRetry && (
                    <DropdownMenuItem onClick={() => onRetry(post._id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </DropdownMenuItem>
                  )}
                  
                  {(onCancel || onRetry) && canCancel && <DropdownMenuSeparator />}
                  
                  {canCancel && onCancel && (
                    <DropdownMenuItem 
                      onClick={() => onCancel(post._id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Published URLs */}
      {post.status === 'published' && post.publishedUrls && Object.keys(post.publishedUrls).length > 0 && (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(post.publishedUrls).map(([platform, url]) => {
              const Icon = platformIcons[platform] || ExternalLink;
              return (
                <Button
                  key={platform}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  asChild
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-3 w-3" />
                    View on {platform}
                  </a>
                </Button>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY COMPONENT (for backward compatibility if needed)
// ─────────────────────────────────────────────────────────────────────────────

interface LegacyCalendarItemProps {
  title: string;
  scheduledDate: Date;
  platform: string;
  status: string;
  publishedUrl?: string;
}

export function LegacyCalendarItem({ 
  title, 
  scheduledDate, 
  platform, 
  status, 
  publishedUrl 
}: LegacyCalendarItemProps) {
  const PlatformIcon = platformIcons[platform.toLowerCase()] || Calendar;
  const statusInfo = statusConfig[status as LatePostStatus] || statusConfig.scheduled;

  return (
    <Card className="hover:bg-muted/30 transition-colors" data-testid="card-calendar-item">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-muted">
            <PlatformIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate" data-testid="text-calendar-title">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {format(scheduledDate, "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={statusInfo.className}>
          {statusInfo.label}
        </Badge>
      </CardHeader>
      {publishedUrl && (
        <CardContent className="pt-0">
          <Button variant="outline" size="sm" className="w-full" asChild data-testid="button-view-published">
            <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-2" />
              View Published
            </a>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
