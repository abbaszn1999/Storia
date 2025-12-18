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
          <DialogContent className="max-w-4xl bg-[#0d1117] border-white/10 p-0 overflow-hidden">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-white">Create New Project</DialogTitle>
                <DialogDescription className="text-white/60 mt-2">
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
                    className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05] hover:border-primary/50"
                    onClick={() => handleProjectTypeSelect("video")}
                    data-testid="card-type-video"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                        <Video className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">Video</h3>
                        <p className="text-sm text-white/50 mt-0.5">Create long-form video content</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05] hover:border-primary/50"
                    onClick={() => handleProjectTypeSelect("story")}
                    data-testid="card-type-story"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">Story</h3>
                        <p className="text-sm text-white/50 mt-0.5">Create short-form viral content</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Project Name Input */}
                  <div className="space-y-3">
                    <Label htmlFor="project-name" className="text-white/80 font-medium">
                      {projectType === "video" ? "Video Name" : "Story Name"}
                    </Label>
                    <Input
                      id="project-name"
                      placeholder={projectType === "video" ? "e.g., Summer Product Launch" : "e.g., Quick Product Demo"}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus:border-primary/50 focus:ring-primary/20"
                      data-testid="input-project-name"
                    />
                  </div>
                  
                  {/* Mode/Template Selection */}
                  <div className="space-y-3">
                    <Label className="text-white/80 font-medium">{projectType === "video" ? "Select Mode" : "Select Template"}</Label>
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
            <div className="px-8 py-5 border-t border-white/5 bg-white/[0.01]">
              <div className="flex justify-between items-center">
                {projectType ? (
                  <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    className="text-white/60 hover:text-white hover:bg-white/5"
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
                    className="text-white/60 hover:text-white hover:bg-white/5"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  {projectType && (
                    <Button
                      onClick={handleCreateProject}
                      disabled={!projectName || !selectedMode}
                      className="bg-primary hover:bg-primary/90 text-white px-6"
                      data-testid="button-create"
                    >
                      Create {projectType === "video" ? "Video" : "Story"}
                    </Button>
                  )}
                </div>
              </div>
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
