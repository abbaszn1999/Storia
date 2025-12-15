import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Zap, Search, Calendar, MoreVertical, Scissors, Edit, Copy, Trash2, Loader2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Link, useLocation } from "wouter";
import { useWorkspace } from "@/contexts/workspace-context";
import { apiRequest } from "@/lib/queryClient";
import type { Story } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  processing: "bg-chart-3 text-white",
  completed: "bg-chart-4 text-white",
  published: "bg-primary text-primary-foreground",
};

export default function History() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch stories from API
  const { data: storiesData = [], isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: currentWorkspace ? [`/api/workspaces/${currentWorkspace.id}/stories`] : [],
    enabled: !!currentWorkspace,
    refetchOnMount: 'always',  // Force fresh data on every mount
    staleTime: 0,              // Treat data as always stale
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest("DELETE", `/api/stories/${storyId}`);
      return response.json();
    },
    onSuccess: () => {
      if (currentWorkspace) {
        queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace.id}/stories`] });
      }
      toast({
        title: "Story deleted",
        description: "The story has been deleted successfully.",
      });
      setPreviewStory(null);
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Map stories to history items format
  const historyItems = useMemo(() => {
    return storiesData.map(story => ({
      id: story.id,
      title: story.title,
      type: "story" as const,
      mode: story.template.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()), // "asmr-sensory" -> "Asmr Sensory"
      status: "completed" as const, // Stories are always completed when saved
      updatedAt: new Date(story.updatedAt),
      url: `/stories/${story.id}`,
      thumbnailUrl: story.thumbnailUrl || undefined,
      exportUrl: story.exportUrl || undefined,
      duration: story.duration,
      aspectRatio: story.aspectRatio,
    }));
  }, [storiesData]);

  // Generate available months from history data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    historyItems.forEach(item => {
      const monthKey = format(item.updatedAt, "yyyy-MM");
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [historyItems]);

  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      // Search filter
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== "all") {
        const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
        const monthEnd = endOfMonth(monthStart);
        matchesMonth = isWithinInterval(item.updatedAt, { start: monthStart, end: monthEnd });
      }
      
      return matchesSearch && matchesMonth;
    });
  }, [searchQuery, selectedMonth, historyItems]);

  // Currently only showing stories (videos would need to be fetched separately)
  const videos: typeof historyItems = []; // No videos yet, only stories
  const stories = filteredItems;

  const HistoryItemCard = ({ item }: { item: (typeof historyItems)[0] }) => {
    const Icon = Zap; // Currently only showing stories
    const canCreateShorts = false; // Shorts creation only available for videos
    
    const handleCreateShorts = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/shorts/create/${item.id}`);
    };

    const handlePreview = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const story = storiesData.find(s => s.id === item.id);
      if (story) {
        setPreviewStory(story);
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
        deleteMutation.mutate(item.id);
      }
    };
    
    return (
      <div className="hover-elevate active-elevate-2 cursor-pointer group" onClick={handlePreview}>
          <Card className="overflow-hidden" data-testid={`card-history-${item.id}`}>
            <div className="aspect-video bg-muted relative overflow-hidden group/video">
              {item.exportUrl ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.exportUrl}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    onMouseEnter={(e) => {
                      e.currentTarget.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div>';
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/50 rounded-full p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              ) : item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.title} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <Badge className={statusColors[item.status] || statusColors.draft}>
                  {item.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="px-2 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      data-testid={`button-history-menu-${item.id}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={handlePreview} data-testid={`menu-item-preview-${item.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    {canCreateShorts && (
                      <DropdownMenuItem onClick={handleCreateShorts} data-testid={`menu-item-create-shorts-${item.id}`}>
                        <Scissors className="h-4 w-4 mr-2" />
                        Create Shorts
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                      data-testid={`menu-item-delete-${item.id}`}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-base line-clamp-2 mb-2" data-testid={`text-history-title-${item.id}`}>
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{item.type}</span>
                <span>{formatDistanceToNow(item.updatedAt, { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  };

  // Show loading state until BOTH workspace and stories are ready
  if (isLoadingWorkspace || (currentWorkspace && isLoadingStories)) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please select a workspace to view history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground mt-1">
          View all your recently created videos and stories
        </p>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All ({filteredItems.length})</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="stories" data-testid="tab-stories">Stories ({stories.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48" data-testid="select-month">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(month + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-history"
              />
            </div>
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "No videos in your history yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "No stories in your history yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stories.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={!!previewStory} onOpenChange={(open) => !open && setPreviewStory(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewStory?.title}</DialogTitle>
          </DialogHeader>
          {previewStory && (
            <div className="space-y-4">
              {previewStory.exportUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={previewStory.exportUrl}
                    controls
                    className="w-full h-full"
                    autoPlay
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <p className="font-medium">{previewStory.template.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Aspect Ratio:</span>
                  <p className="font-medium">{previewStory.aspectRatio}</p>
                </div>
                {previewStory.duration && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{previewStory.duration}s</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{formatDistanceToNow(new Date(previewStory.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {previewStory.exportUrl && (
                  <Button
                    variant="outline"
                    disabled={isDownloading}
                    onClick={async () => {
                      try {
                        setIsDownloading(true);
                        
                        // Fetch video as blob
                        const response = await fetch(previewStory.exportUrl!);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // Create download link
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `${previewStory.title}.mp4`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Clean up blob URL
                        URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error("Download failed:", error);
                        toast({
                          title: "Download failed",
                          description: "Failed to download the video. Please try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsDownloading(false);
                      }
                    }}
                  >
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${previewStory.title}"? This action cannot be undone.`)) {
                      deleteMutation.mutate(previewStory.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
