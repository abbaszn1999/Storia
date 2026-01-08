import { useState, useMemo } from "react";
import { Plus, Search, Video, Zap, Loader2, Filter, FileText, RefreshCw, CheckCircle, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoCard } from "@/components/video-card";
import { ModeSelector } from "@/components/mode-selector";
import { TemplateSelector } from "@/components/template-selector";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VIDEO_MODE_ROUTES, STORY_TEMPLATE_ROUTES } from "@/lib/routes";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/workspace-context";
import { apiRequest } from "@/lib/queryClient";
import type { Video as VideoType } from "@shared/schema";

// Map mode values to display names
const MODE_DISPLAY_NAMES: Record<string, string> = {
  ambient: "Ambient Visual",
  narrative: "Narrative Video",
  commerce: "Social Commerce",
  vlog: "Character Vlog",
  logo: "Logo Animation",
  podcast: "Podcast",
};

type StatusFilter = 'all' | 'draft' | 'processing' | 'completed' | 'published';

const STATUS_FILTERS: { id: StatusFilter; label: string; icon: typeof Filter }[] = [
  { id: 'all', label: 'All Videos', icon: Filter },
  { id: 'draft', label: 'Draft', icon: FileText },
  { id: 'processing', label: 'Processing', icon: RefreshCw },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
  { id: 'published', label: 'Published', icon: Upload },
];

export default function Videos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectType, setProjectType] = useState<"video" | "story" | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  // Fetch videos from the API
  const { data: videos = [], isLoading } = useQuery<VideoType[]>({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/videos`],
    enabled: !!currentWorkspace?.id,
    staleTime: 0, // Always refetch on mount
    refetchOnMount: true,
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest("DELETE", `/api/videos/${videoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${currentWorkspace?.id}/videos`] });
      toast({
        title: "Video deleted",
        description: "The video has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter videos based on search and status
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || video.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [videos, searchQuery, statusFilter]);

  const handleDeleteVideo = (videoId: string) => {
    deleteMutation.mutate(videoId);
  };

  const handleProjectTypeSelect = (type: "video" | "story") => {
    setProjectType(type);
    setSelectedMode(null);
  };

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedMode(templateId);
  };

  const handleBack = () => {
    setProjectType(null);
    setSelectedMode(null);
  };

  const handleCreateProject = () => {
    console.log("Creating project:", { projectName, projectType, mode: selectedMode });
    
    if (projectType === "video" && selectedMode) {
      const route = VIDEO_MODE_ROUTES[selectedMode];
      if (route) {
        // Include the project name as a title query parameter
        const titleParam = projectName ? `?title=${encodeURIComponent(projectName)}` : '';
        setLocation(`${route}${titleParam}`);
      } else {
        toast({
          title: "Error",
          description: "Invalid video mode selected. Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else if (projectType === "story" && selectedMode) {
      const route = STORY_TEMPLATE_ROUTES[selectedMode];
      if (route) {
        // Add ?new=true to start fresh project
        setLocation(`${route}?new=true`);
      } else {
        toast({
          title: "Error",
          description: "Invalid story template selected. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsCreateDialogOpen(false);
    setProjectName("");
    setSelectedMode(null);
    setProjectType(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setProjectType(null);
      setSelectedMode(null);
      setProjectName("");
    } else {
      setProjectType("video");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b bg-background/80 backdrop-blur-xl">
        <div className="px-4 py-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = statusFilter === filter.id;
            return (
              <Button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
                data-testid={`button-filter-${filter.id}`}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
              </Button>
              );
            })}
            </div>
            
            <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] max-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-11 h-10 rounded-xl",
                "bg-background border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-200"
              )}
              data-testid="input-search"
            />
          </div>

          {/* New Video Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-video">
                <Plus className="h-4 w-4" />
                New Video
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[60%] max-w-none bg-popover border-popover-border p-0 overflow-hidden">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 border-b border-popover-border">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-foreground">Create New Video</DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  {!projectType && "Choose what type of content you want to create"}
                  {projectType === "video" && "Choose a video creation mode"}
                  {projectType === "story" && "Choose a story template"}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            {/* Content Section */}
            <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {!projectType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:bg-accent hover:border-primary/50"
                    onClick={() => handleProjectTypeSelect("video")}
                    data-testid="card-type-video"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                        <Video className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground text-lg">Video</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Create long-form video content</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:bg-accent hover:border-primary/50"
                    onClick={() => handleProjectTypeSelect("story")}
                    data-testid="card-type-story"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground text-lg">Story</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Create short-form viral content</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Video Name Input */}
                  <div className="space-y-3">
                    <Label htmlFor="project-name" className="text-foreground font-medium">Video Name</Label>
                    <Input
                      id="project-name"
                      placeholder={projectType === "video" ? "e.g., Summer Product Launch" : "e.g., Quick Product Demo"}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-12 rounded-xl"
                      data-testid="input-project-name"
                    />
                  </div>
                  
                  {/* Mode/Template Selection */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">{projectType === "video" ? "Select Mode" : "Select Template"}</Label>
                    {projectType === "video" ? (
                      <ModeSelector onSelect={handleModeSelect} selectedMode={selectedMode} />
                    ) : (
                      <TemplateSelector onSelect={handleTemplateSelect} />
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Footer Section */}
            <div className="px-8 py-5 border-t border-popover-border bg-muted/30">
              <div className="flex justify-between items-center">
                {projectType ? (
                  <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDialogClose(false)} 
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  {projectType && (
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectName || !selectedMode}
                      className="px-6"
                      data-testid="button-create"
                    >
                      Create Video
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Video className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No videos found</h3>
          <p className="text-muted-foreground mt-1">
            {videos.length === 0 
              ? "Get started by creating your first video project."
              : "Try adjusting your search or filter criteria."}
          </p>
          {videos.length === 0 && (
            <Button 
              className="mt-4 gap-2" 
              onClick={() => {
                setProjectType("video");
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Your First Video
            </Button>
          )}
        </div>
      )}

      {/* Video grid */}
      {!isLoading && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              mode={MODE_DISPLAY_NAMES[video.mode] || video.mode}
              modeKey={video.mode}
              status={video.status || "draft"}
              thumbnailUrl={video.thumbnailUrl || undefined}
              updatedAt={new Date(video.updatedAt)}
              onDelete={handleDeleteVideo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
