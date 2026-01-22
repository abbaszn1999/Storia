import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useCampaign } from "../../../shared/hooks";
import { useStartBatchGeneration, useBatchProgress, useCancelBatch, useStories, useApproveAll, useRegenerateFailed } from "../../hooks";
import { StatusBadge } from "../../../shared/components/ui/status-badge";
import { ProgressTracker } from "../../../shared/components/ui/progress-tracker";
import type { CampaignItem } from "../../../shared/types";

export default function AutoStoryDashboard() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  const { data: campaign } = useCampaign(id);
  const { data: progress } = useBatchProgress(id, campaign?.status === 'generating');
  const { data: stories = [] } = useStories(id);
  
  const startGeneration = useStartBatchGeneration();
  const cancelGeneration = useCancelBatch();
  const approveAll = useApproveAll(id!);
  const regenerateFailed = useRegenerateFailed(id!);

  if (!campaign) {
    return <div>Loading...</div>;
  }

  const isGenerating = campaign.status === 'generating';
  const canStartGeneration = campaign.status === 'draft' || campaign.status === 'paused';
  const hasStories = stories.length > 0;
  const completedCount = stories.filter((s: CampaignItem) => s.status === 'completed').length;
  const failedCount = stories.filter((s: CampaignItem) => s.status === 'failed').length;
  const approvedCount = stories.filter((s: CampaignItem) => s.status === 'approved').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/autoproduction/story")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">
              {campaign.storyTemplate} • {campaign.totalItems || 0} stories
            </p>
          </div>
        </div>
        <StatusBadge status={campaign.status as any} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{completedCount}/{campaign.totalItems || 0}</div>
              <div className="text-sm text-muted-foreground">Generated</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{campaign.itemsPublished || 0}</div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{failedCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {canStartGeneration && (
              <Button
                onClick={() => startGeneration.mutate(id!)}
                disabled={startGeneration.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Generation
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

            {failedCount > 0 && (
              <Button
                variant="outline"
                onClick={() => regenerateFailed.mutate()}
                disabled={regenerateFailed.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Failed ({failedCount})
              </Button>
            )}

            {completedCount > 0 && completedCount === campaign.totalItems && (
              <Button
                onClick={() => approveAll.mutate()}
                disabled={approveAll.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve All
              </Button>
            )}
          </div>

          {/* Progress Tracker */}
          {(isGenerating || progress) && (
            <ProgressTracker
              current={progress?.completed || campaign.itemsGenerated || 0}
              total={campaign.totalItems || 0}
              currentStage={progress?.currentItem?.stage}
              stageProgress={progress?.currentItem?.progress}
            />
          )}

          {/* Current Item Info */}
          {isGenerating && progress?.currentItem && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">
                Generating: {progress.currentItem.topic}
              </div>
              <div className="text-xs text-muted-foreground">
                Stage: {progress.currentItem.stage} ({progress.currentItem.progress}%)
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stories Grid */}
      {hasStories && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((story: CampaignItem) => (
                <Card
                  key={story.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/autoproduction/story/${id}/stories/${story.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm line-clamp-2 flex-1">
                          {story.sourceIdea}
                        </div>
                        <StatusBadge status={story.status as any} className="shrink-0" />
                      </div>

                      {story.previewUrl && (
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={story.previewUrl} 
                            alt={story.title || story.sourceIdea}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Story {story.orderIndex}</span>
                        {story.status === 'generating' && story.generationProgress !== undefined && (
                          <span>{story.generationProgress}%</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
