import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Loader2 } from "lucide-react";
import { useVideoCampaign } from "../../hooks";
import { 
  useStartBatchGeneration, 
  useBatchProgress, 
  useCancelBatch, 
  useVideos
} from "../../hooks";
import { StatusBadge } from "../../../shared/components/ui/status-badge";
import type { VideoIdea } from "@shared/schema";

export default function AutoVideoDashboard() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  const { data: campaign } = useVideoCampaign(id);
  const { data: progress } = useBatchProgress(id, campaign?.status === 'generating');
  const { data: videos = [] } = useVideos(id);
  
  const startGeneration = useStartBatchGeneration();
  const cancelGeneration = useCancelBatch();

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isGenerating = campaign.status === 'generating';
  const canStartGeneration = campaign.status === 'draft' || campaign.status === 'paused';
  const videoIdeas = (campaign.videoIdeas as VideoIdea[]) || [];
  const itemStatuses = (campaign.itemStatuses as Record<string, any>) || {};
  const totalVideos = videoIdeas.length;
  const completedVideos = Object.values(itemStatuses).filter((s: any) => s.status === 'completed').length;
  const failedVideos = Object.values(itemStatuses).filter((s: any) => s.status === 'failed').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/autoproduction/video")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">
              {campaign.videoMode} • {totalVideos} videos
            </p>
          </div>
        </div>
        <StatusBadge status={campaign.status as any} />
      </div>

      {/* Campaign Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{completedVideos}/{totalVideos}</div>
              <div className="text-xs text-muted-foreground mt-1">Generated</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{totalVideos - completedVideos - failedVideos}</div>
              <div className="text-xs text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-500">{failedVideos}</div>
              <div className="text-xs text-muted-foreground mt-1">Failed</div>
            </div>
          </div>

          {/* Generation Controls */}
          <div className="flex items-center gap-3 pt-2">
            {canStartGeneration && (
              <Button
                onClick={() => startGeneration.mutate(id!)}
                disabled={startGeneration.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                {startGeneration.isPending ? 'Starting...' : 'Start Generation'}
              </Button>
            )}
            
            {isGenerating && (
              <Button
                variant="destructive"
                onClick={() => cancelGeneration.mutate(id!)}
                disabled={cancelGeneration.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Cancel Generation
              </Button>
            )}
          </div>

          {/* Current Generation Status */}
          {isGenerating && progress?.currentItem && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="text-sm font-medium">
                  Generating: {progress.currentItem.topic}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos List */}
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {videos.map((video: any, idx: number) => {
                const itemStatus = Object.values(itemStatuses).find((s: any) => s.videoId === video.id);
                const idea = videoIdeas[idx]?.idea || video.title || 'Untitled';
                
                return (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="text-sm font-medium text-muted-foreground">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{idea}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Status: {video.status || 'draft'} • Step {video.currentStep || 2}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
