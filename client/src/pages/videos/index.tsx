import { useState } from "react";
import { Plus, Search, Video, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoCard } from "@/components/video-card";
import { ModeSelector } from "@/components/mode-selector";
import { TemplateSelector } from "@/components/template-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function Videos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectType, setProjectType] = useState<"video" | "story" | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

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
        setLocation(route);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your video projects
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" data-testid="button-create-video">
              <Plus className="h-4 w-4" />
              New Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                {!projectType && "Choose what type of project you want to create"}
                {projectType === "video" && "Choose a video creation mode"}
                {projectType === "story" && "Choose a story template"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {!projectType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => handleProjectTypeSelect("video")}
                    data-testid="card-type-video"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                          <Video className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle>Video</CardTitle>
                          <CardDescription className="mt-1">Create long-form video content</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => handleProjectTypeSelect("story")}
                    data-testid="card-type-story"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary text-primary-foreground">
                          <Zap className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle>Story</CardTitle>
                          <CardDescription className="mt-1">Create short-form viral content</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder={projectType === "video" ? "e.g., Summer Product Launch" : "e.g., Quick Product Demo"}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      data-testid="input-project-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{projectType === "video" ? "Select Mode" : "Select Template"}</Label>
                    {projectType === "video" ? (
                      <ModeSelector onSelect={handleModeSelect} />
                    ) : (
                      <TemplateSelector onSelect={handleTemplateSelect} />
                    )}
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button variant="outline" onClick={handleBack} data-testid="button-back">
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleDialogClose(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={!projectName || !selectedMode}
                        data-testid="button-create"
                      >
                        Create Project
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Videos</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <VideoCard
            key={i}
            id={String(i)}
            title={`Video Project ${i + 1}`}
            mode="Narrative Video Mode"
            status={["draft", "processing", "completed", "published"][i % 4]}
            duration={30 + i * 5}
            updatedAt={new Date(Date.now() - 1000 * 60 * 60 * i)}
          />
        ))}
      </div>
    </div>
  );
}
