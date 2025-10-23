import { Video, Zap } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface HistoryItemProps {
  id: string;
  title: string;
  type: "video" | "story";
  status: string;
  updatedAt: Date;
  url: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  processing: "bg-chart-3 text-white",
  completed: "bg-chart-4 text-white",
  published: "bg-primary text-primary-foreground",
};

export function HistoryItem({ id, title, type, status, updatedAt, url }: HistoryItemProps) {
  const Icon = type === "video" ? Video : Zap;
  
  return (
    <Link href={url} data-testid={`link-history-${id}`}>
      <div
        className="flex items-start gap-2 p-2 rounded-md hover-elevate active-elevate-2 cursor-pointer"
      >
        <div className="p-1.5 rounded bg-muted shrink-0 mt-0.5">
          <Icon className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium line-clamp-2 leading-tight">{title}</h4>
            <Badge className={`${statusColors[status] || statusColors.draft} text-[10px] shrink-0`}>
              {status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(updatedAt, { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}
