import { Video, Clock, Calendar, MoreVertical, Scissors, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

// Map mode to route prefix
const MODE_ROUTES: Record<string, string> = {
  ambient: "/videos/ambient",
  narrative: "/videos/narrative",
  commerce: "/videos/commerce",
  vlog: "/videos/vlog",
  logo: "/videos/logo",
  podcast: "/videos/podcast",
};

interface VideoCardProps {
  id: string;
  title: string;
  mode: string;
  modeKey: string; // Raw mode key (e.g., "ambient", "narrative")
  status: string;
  duration?: number;
  updatedAt: Date;
  thumbnailUrl?: string;
  onDelete?: (id: string) => void;
}

export function VideoCard({ id, title, mode, modeKey, status, duration, updatedAt, thumbnailUrl, onDelete }: VideoCardProps) {
  const [, navigate] = useLocation();
  
  const canCreateShorts = status === "completed" && 
    (mode.toLowerCase().includes("narrative") || mode.toLowerCase().includes("vlog"));

  const handleCardClick = () => {
    const routePrefix = MODE_ROUTES[modeKey] || "/videos/narrative";
    navigate(`${routePrefix}/${id}`);
  };

  const handleCreateShorts = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shorts/create/${id}`);
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    processing: "bg-chart-3 text-white",
    completed: "bg-chart-4 text-white",
    published: "bg-primary text-primary-foreground",
  };

  return (
    <Card 
      className="overflow-hidden hover-elevate cursor-pointer group" 
      data-testid={`card-video-${id}`}
      onClick={handleCardClick}
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <Badge className={statusColors[status] || statusColors.draft}>
            {status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="secondary" 
                size="sm" 
                className="px-2 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                data-testid={`button-video-menu-${id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {canCreateShorts && (
                <DropdownMenuItem onClick={handleCreateShorts} data-testid={`menu-item-create-shorts-${id}`}>
                  <Scissors className="h-4 w-4 mr-2" />
                  Create Shorts
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete?.(id)} 
                className="text-destructive focus:text-destructive"
                data-testid={`menu-item-delete-${id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardHeader className="space-y-2 pb-3">
        <h3 className="font-semibold text-lg line-clamp-2" data-testid={`text-video-title-${id}`}>{title}</h3>
        <p className="text-sm text-muted-foreground">{mode}</p>
      </CardHeader>
      <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
        </div>
        {duration && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{duration}s</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
