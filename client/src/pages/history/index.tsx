import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Zap, Search, Calendar, MoreVertical, Scissors, Edit, Copy, Trash2, Loader2, Play, Filter, ArrowUpDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Link, useLocation } from "wouter";
import { useWorkspace } from "@/contexts/workspace-context";
import { apiRequest } from "@/lib/queryClient";
import type { Story, Video as VideoType } from "@shared/schema";
import { MODE_DISPLAY_NAMES, MODE_COLORS, formatModeName } from "@/constants/history-modes";
import { cn } from "@/lib/utils";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  processing: "bg-chart-3 text-white",
  completed: "bg-chart-4 text-white",
  published: "bg-primary text-primary-foreground",
};

// Unified History Item Type
interface HistoryItem {
  id: string;
  title: string;
  type: "video" | "story";
  mode: string;
  modeDisplayName: string;
  status: "draft" | "processing" | "completed" | "published";
  updatedAt: Date;
  createdAt: Date;
  url: string;
  thumbnailUrl?: string;
  exportUrl?: string;
  duration?: number;
  aspectRatio?: string;
}

const ITEMS_PER_PAGE = 12;

export default function History() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "duration">("newest");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoType | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { currentWorkspace, isLoading: isLoadingWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset to page 1 when filters or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMonth, selectedMode, sortBy, activeTab]);

  // Fetch stories from API
  const { data: storiesData = [], isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: currentWorkspace ? [`/api/workspaces/${currentWorkspace.id}/stories`] : [],
    enabled: !!currentWorkspace,
    refetchOnMount: 'always',  // Force fresh data on every mount
    staleTime: 0,              // Treat data as always stale
  });

  // Fetch videos from API
  const { data: videosData = [], isLoading: isLoadingVideos } = useQuery<VideoType[]>({
    queryKey: currentWorkspace ? [`/api/workspaces/${currentWorkspace.id}/videos`] : [],
    enabled: !!currentWorkspace,
    refetchOnMount: 'always',
    staleTime: 0,
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

  // Map stories and videos to unified history items format
  const historyItems = useMemo(() => {
    // Filter out logo-animation from stories (it's a video mode, not a story mode)
    const stories = storiesData
      .filter(story => story.storyMode !== "logo-animation")
      .map(story => ({
        id: story.id,
        title: story.projectName || "Untitled",
        type: "story" as const,
        mode: story.storyMode || "unknown",
        modeDisplayName: MODE_DISPLAY_NAMES[story.storyMode || ""] || formatModeName(story.storyMode || "unknown"),
        status: "completed" as const,
        updatedAt: new Date(story.updatedAt),
        createdAt: new Date(story.createdAt),
        url: `/stories/${story.id}`,
        thumbnailUrl: story.thumbnailUrl || undefined,
        exportUrl: story.videoUrl || undefined,
        duration: story.duration || undefined,
        aspectRatio: story.aspectRatio || undefined,
      }));
    
    // Handle logo-animation stories as videos (temporary until backend is fixed)
    // Logo Animation is a VIDEO mode, not a story mode
    const logoAnimationStories = storiesData
      .filter(story => story.storyMode === "logo-animation")
      .map(story => ({
        id: story.id,
        title: story.projectName || "Untitled",
        type: "video" as const,
        mode: "logo" as const,
        modeDisplayName: "Logo Animation",
        status: "completed" as const,
        updatedAt: new Date(story.updatedAt),
        createdAt: new Date(story.createdAt),
        url: `/videos/logo/${story.id}`,
        thumbnailUrl: story.thumbnailUrl || undefined,
        exportUrl: story.videoUrl || undefined,
        duration: story.duration || undefined,
        aspectRatio: story.aspectRatio || undefined,
      }));
    
    const videos = videosData.map(video => ({
      id: video.id,
      title: video.title || "Untitled",
      type: "video" as const,
      mode: video.mode || "unknown",
      modeDisplayName: MODE_DISPLAY_NAMES[video.mode || ""] || formatModeName(video.mode || "unknown"),
      status: (video.status || "draft") as "draft" | "processing" | "completed" | "published",
      updatedAt: new Date(video.updatedAt),
      createdAt: new Date(video.createdAt),
      url: `/videos/${video.mode}/${video.id}`,
      thumbnailUrl: video.thumbnailUrl || undefined,
      exportUrl: video.exportUrl || undefined,
      duration: undefined,
      aspectRatio: undefined,
    }));
    
    // Combine all items and sort by newest first (default)
    return [...stories, ...logoAnimationStories, ...videos]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [storiesData, videosData]);

  // Generate available months from history data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    historyItems.forEach(item => {
      const monthKey = format(item.updatedAt, "yyyy-MM");
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [historyItems]);

  // Generate available modes from history data
  const availableModes = useMemo(() => {
    const modes = new Set<string>();
    historyItems.forEach(item => {
      if (item.mode && item.mode !== "unknown") {
        modes.add(item.mode);
      }
    });
    return Array.from(modes).sort();
  }, [historyItems]);

  // Filter items by search, month, and mode
  const filteredItems = useMemo(() => {
    return historyItems.filter(item => {
      // Search filter
      const matchesSearch = item.title 
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase())
        : false;
      
      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== "all") {
        const monthStart = startOfMonth(new Date(selectedMonth + "-01"));
        const monthEnd = endOfMonth(monthStart);
        matchesMonth = isWithinInterval(item.updatedAt, { start: monthStart, end: monthEnd });
      }
      
      // Mode filter
      const matchesMode = selectedMode === "all" || item.mode === selectedMode;
      
      return matchesSearch && matchesMonth && matchesMode;
    });
  }, [searchQuery, selectedMonth, selectedMode, historyItems]);

  // Filter by tab (All, Videos, Stories)
  const filteredByTab = useMemo(() => {
    if (activeTab === "all") return filteredItems.filter(item => item.status === "completed");
    if (activeTab === "videos") return filteredItems.filter(item => item.type === "video" && item.status === "completed");
    if (activeTab === "stories") return filteredItems.filter(item => item.type === "story");
    return filteredItems;
  }, [activeTab, filteredItems]);

  // Sort items
  const sortedItems = useMemo(() => {
    const items = [...filteredByTab];
    
    switch (sortBy) {
      case "newest":
        return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      case "oldest":
        return items.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
      case "name":
        return items.sort((a, b) => a.title.localeCompare(b.title));
      case "duration":
        return items.sort((a, b) => (b.duration || 0) - (a.duration || 0));
      default:
        return items;
    }
  }, [filteredByTab, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Count videos and stories for tabs
  const allCount = useMemo(() => filteredItems.filter(item => item.status === "completed").length, [filteredItems]);
  const videosCount = useMemo(() => filteredItems.filter(item => item.type === "video" && item.status === "completed").length, [filteredItems]);
  const storiesCount = useMemo(() => filteredItems.filter(item => item.type === "story").length, [filteredItems]);

  // Pagination component helper
  const renderPagination = (totalItems: number) => {
    if (totalItems <= ITEMS_PER_PAGE) return null;
    
    const itemsTotalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(itemsTotalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                if (currentPage > 1) setCurrentPage(currentPage - 1);
              }}
              disabled={currentPage === 1}
              className="gap-1 pl-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <PaginationItem key={page}>
              <Button
                variant={currentPage === page ? "outline" : "ghost"}
                size="icon"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            </PaginationItem>
          ))}

          {endPage < itemsTotalPages && (
            <>
              {endPage < itemsTotalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(itemsTotalPages)}
                >
                  {itemsTotalPages}
                </Button>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                if (currentPage < itemsTotalPages) setCurrentPage(currentPage + 1);
              }}
              disabled={currentPage === itemsTotalPages}
              className="gap-1 pr-2.5"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const HistoryItemCard = ({ item }: { item: HistoryItem }) => {
    const Icon = item.type === "video" ? Video : Zap;
    const canCreateShorts = item.type === "video"; // Shorts creation only available for videos
    
    const handleCreateShorts = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/shorts/create/${item.id}`);
    };

    const handlePreview = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (item.type === "story") {
        const story = storiesData.find(s => s.id === item.id);
        if (story) {
          setPreviewStory(story);
          setPreviewVideo(null);
        }
      } else if (item.type === "video") {
        const video = videosData.find(v => v.id === item.id);
        if (video) {
          setPreviewVideo(video);
          setPreviewStory(null);
        }
      }
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
        if (item.type === "story") {
          deleteMutation.mutate(item.id);
        } else {
          // TODO: Implement video deletion
          toast({
            title: "Not implemented",
            description: "Video deletion is not yet implemented.",
            variant: "destructive",
          });
        }
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
              <div className="flex items-center justify-between text-xs">
                <Badge 
                  className={cn(
                    MODE_COLORS[item.mode]?.bg || "bg-muted",
                    MODE_COLORS[item.mode]?.text || "text-muted-foreground",
                    "text-[10px] px-2 py-0.5"
                  )}
                >
                  {item.modeDisplayName}
                </Badge>
                <span className="text-muted-foreground">{formatDistanceToNow(item.updatedAt, { addSuffix: true })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
    );
  };

  // Show loading state until workspace, stories, and videos are ready
  if (isLoadingWorkspace || (currentWorkspace && (isLoadingStories || isLoadingVideos))) {
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b bg-background/80 backdrop-blur-xl">
          <div className="px-4 py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All ({allCount})</TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-videos">Videos ({videosCount})</TabsTrigger>
            <TabsTrigger value="stories" data-testid="tab-stories">Stories ({storiesCount})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger className="w-48" data-testid="select-mode">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {availableModes.map(mode => (
                  <SelectItem key={mode} value={mode}>
                    {MODE_DISPLAY_NAMES[mode] || formatModeName(mode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40" data-testid="select-sort">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>

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

            {(searchQuery || selectedMode !== "all" || selectedMonth !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedMode("all");
                  setSelectedMonth("all");
                }}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1.5" />
                Clear Filters
              </Button>
            )}
            </div>
          </div>
        </div>
        </div>

        <TabsContent value="all" className="mt-6">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedMode !== "all" || selectedMonth !== "all"
                  ? "Try adjusting your filters"
                  : "No items in your history yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedItems.map((item) => (
                  <HistoryItemCard key={item.id} item={item} />
                ))}
              </div>
              {renderPagination(sortedItems.length)}
            </>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {sortedItems.filter(item => item.type === "video").length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedMode !== "all" || selectedMonth !== "all"
                  ? "Try adjusting your filters"
                  : "No videos in your history yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedItems.map((item) => (
                  <HistoryItemCard key={item.id} item={item} />
                ))}
              </div>
              {renderPagination(sortedItems.length)}
            </>
          )}
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          {sortedItems.filter(item => item.type === "story").length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedMode !== "all" || selectedMonth !== "all"
                  ? "Try adjusting your filters"
                  : "No stories in your history yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedItems.map((item) => (
                  <HistoryItemCard key={item.id} item={item} />
                ))}
              </div>
              {renderPagination(sortedItems.length)}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal for Stories */}
      <Dialog open={!!previewStory} onOpenChange={(open) => !open && setPreviewStory(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewStory?.projectName || "Untitled"}</DialogTitle>
          </DialogHeader>
          {previewStory && (
            <div className="space-y-4">
              {previewStory.videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={previewStory.videoUrl}
                    controls
                    className="w-full h-full"
                    autoPlay
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <p className="font-medium">{previewStory.storyMode 
                    ? previewStory.storyMode.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) 
                    : "Unknown"}</p>
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
                {previewStory.videoUrl && (
                  <Button
                    variant="outline"
                    disabled={isDownloading}
                    onClick={async () => {
                      try {
                        setIsDownloading(true);
                        
                        // Fetch video as blob
                        const response = await fetch(previewStory.videoUrl!);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // Create download link
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `${previewStory.projectName || "Untitled"}.mp4`;
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
                    if (confirm(`Are you sure you want to delete "${previewStory.projectName || "Untitled"}"? This action cannot be undone.`)) {
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

      {/* Preview Modal for Videos */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title || "Untitled"}</DialogTitle>
          </DialogHeader>
          {previewVideo && (
            <div className="space-y-4">
              {previewVideo.exportUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={previewVideo.exportUrl}
                    controls
                    className="w-full h-full"
                    autoPlay
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <p className="font-medium">{previewVideo.mode 
                    ? MODE_DISPLAY_NAMES[previewVideo.mode] || formatModeName(previewVideo.mode)
                    : "Unknown"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{previewVideo.status || "draft"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{formatDistanceToNow(new Date(previewVideo.createdAt), { addSuffix: true })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>
                  <p className="font-medium">{formatDistanceToNow(new Date(previewVideo.updatedAt), { addSuffix: true })}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {previewVideo.exportUrl && (
                  <Button
                    variant="outline"
                    disabled={isDownloading}
                    onClick={async () => {
                      try {
                        setIsDownloading(true);
                        
                        // Fetch video as blob
                        const response = await fetch(previewVideo.exportUrl!);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // Create download link
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = `${previewVideo.title || "Untitled"}.mp4`;
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
                    toast({
                      title: "Not implemented",
                      description: "Video deletion is not yet implemented.",
                      variant: "destructive",
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
