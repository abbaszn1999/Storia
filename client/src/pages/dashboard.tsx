import { useState } from "react";
import { Video, Zap, Calendar, TrendingUp, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { VideoCard } from "@/components/video-card";
import { ModeSelector } from "@/components/mode-selector";
import { TemplateSelector } from "@/components/template-selector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VIDEO_MODE_ROUTES, STORY_TEMPLATE_ROUTES } from "@/lib/routes";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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
        setLocation(route);
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
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your creative workspace.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2" data-testid="button-create-project">
              <Plus className="h-4 w-4" />
              New Project
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Videos"
          value={24}
          icon={Video}
          description="Active projects"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Stories Created"
          value={18}
          icon={Zap}
          description="Short-form content"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Scheduled Posts"
          value={7}
          icon={Calendar}
          description="Upcoming releases"
        />
        <StatCard
          title="Credits Used"
          value="750"
          icon={TrendingUp}
          description="500 remaining"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recent Projects</h2>
          <Button variant="ghost" data-testid="button-view-all">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VideoCard
            id="1"
            title="Summer Product Launch"
            mode="Narrative Video Mode"
            status="completed"
            duration={45}
            updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 2)}
          />
          <VideoCard
            id="2"
            title="Brand Story 2024"
            mode="Narrative Video Mode"
            status="processing"
            duration={60}
            updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 24)}
          />
          <VideoCard
            id="3"
            title="Customer Testimonials"
            mode="Narrative Video Mode"
            status="draft"
            updatedAt={new Date(Date.now() - 1000 * 60 * 60 * 48)}
          />
        </div>
      </div>
    </div>
  );
}
