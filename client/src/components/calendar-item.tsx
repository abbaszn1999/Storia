import { Calendar, ExternalLink } from "lucide-react";
import { SiYoutube, SiTiktok, SiInstagram, SiFacebook } from "react-icons/si";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface CalendarItemProps {
  title: string;
  scheduledDate: Date;
  platform: string;
  status: string;
  publishedUrl?: string;
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  youtube: SiYoutube,
  tiktok: SiTiktok,
  instagram: SiInstagram,
  facebook: SiFacebook,
};

const statusColors: Record<string, string> = {
  scheduled: "bg-chart-3 text-white",
  published: "bg-chart-4 text-white",
  failed: "bg-destructive text-destructive-foreground",
};

export function CalendarItem({ title, scheduledDate, platform, status, publishedUrl }: CalendarItemProps) {
  const PlatformIcon = platformIcons[platform.toLowerCase()] || Calendar;

  return (
    <Card className="hover-elevate" data-testid="card-calendar-item">
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
        <Badge className={statusColors[status] || statusColors.scheduled}>
          {status}
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
