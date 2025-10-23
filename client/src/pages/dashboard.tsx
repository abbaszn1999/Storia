import { useState } from "react";
import { Video, Zap, Calendar, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { VideoCard } from "@/components/video-card";
import { ModeSelector } from "@/components/mode-selector";
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

export default function Dashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
  };

  const handleCreateProject = () => {
    console.log("Creating project:", projectName, selectedMode);
    setIsCreateDialogOpen(false);
    setProjectName("");
    setSelectedMode(null);
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                Choose a creation mode and give your project a name
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Summer Product Launch"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  data-testid="input-project-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Mode</Label>
                <ModeSelector onSelect={handleModeSelect} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel">
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
