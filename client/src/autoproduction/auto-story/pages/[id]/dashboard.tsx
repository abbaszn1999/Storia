import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Play, Pause, RefreshCw, Trash2, Loader2, Circle, CheckCircle2 } from "lucide-react";
import { useCampaign, useDeleteStoryCampaign } from "../../../shared/hooks";
import { useStartBatchGeneration, useBatchProgress, useCancelBatch, useStories, useRegenerateFailed } from "../../hooks";
import { StatusBadge } from "../../../shared/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";

// Matches the actual response shape from GET /api/autoproduction/story/:id/stories
interface StoryListItem {
  index: number;
  topic: string;
  status: string;
  error?: string;
  story: {
    id: string;
    projectName: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    aspectRatio?: string;
    storyMode: string;
  } | null;
}

// All possible pipeline steps (server uses steps 1-8)
const ALL_PIPELINE_STEPS = [
  { step: 1, label: 'Script', key: 'script', alwaysShow: true },
  { step: 2, label: 'Scenes', key: 'scenes', alwaysShow: true },
  { step: 3, label: 'Storyboard', key: 'storyboard', alwaysShow: true },
  { step: 4, label: 'Images', key: 'images', alwaysShow: true },
  { step: 5, label: 'Videos', key: 'videos', alwaysShow: false },
  { step: 6, label: 'Voiceover', key: 'voiceover', alwaysShow: false },
  { step: 7, label: 'Music', key: 'music', alwaysShow: false },
  { step: 8, label: 'Export', key: 'export', alwaysShow: true },
];

/**
 * Filter pipeline steps based on campaign settings.
 * - Videos: only if mediaType=animated AND animationType=image-to-video (has videoModel)
 * - Voiceover: only if storyHasVoiceover is true
 * - Music: only if storyBackgroundMusicTrack is not 'none'
 */
function getActivePipelineSteps(campaignSettings: Record<string, any> | undefined) {
  const cs = campaignSettings || {};
  const hasVideo = !!cs.storyVideoModel;
  const hasVoiceover = cs.storyHasVoiceover === true;
  const hasMusic = cs.storyBackgroundMusicTrack && cs.storyBackgroundMusicTrack !== 'none';

  return ALL_PIPELINE_STEPS.filter(ps => {
    if (ps.alwaysShow) return true;
    if (ps.key === 'videos') return hasVideo;
    if (ps.key === 'voiceover') return hasVoiceover;
    if (ps.key === 'music') return hasMusic;
    return true;
  });
}

/**
 * Map server stage name to step number.
 * Server sends names like 'Generating story script', 'Breaking into scenes', etc.
 */
function mapStageToStep(stage: string | undefined): number {
  if (!stage) return 0;
  const lower = stage.toLowerCase();
  if (lower.includes('script') || lower.includes('story script')) return 1;
  if (lower.includes('scene') && !lower.includes('storyboard')) return 2;
  if (lower.includes('storyboard') || lower.includes('enhancing')) return 3;
  if (lower.includes('image')) return 4;
  if (lower.includes('video') && !lower.includes('export')) return 5;
  if (lower.includes('voiceover')) return 6;
  if (lower.includes('music')) return 7;
  if (lower.includes('export') || lower.includes('final')) return 8;
  return 0;
}

export default function AutoStoryDashboard() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const searchString = useSearch();
  const autostartTriggered = useRef(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Use campaign.status directly — no ref hack needed (matches auto-video pattern)
  const { data: campaign } = useCampaign(id, {
    refetchInterval: 5000, // Always poll to catch status changes
  });
  
  const isGenerating = campaign?.status === 'generating';
  const { data: progressData } = useBatchProgress(id, isGenerating);
  const progress = progressData?.progress;
  const { data: stories = [] } = useStories(id, {
    refetchInterval: isGenerating ? 5000 : false,
  }) as { data: StoryListItem[] };
  
  const startGeneration = useStartBatchGeneration();
  const cancelGeneration = useCancelBatch();
  const deleteCampaign = useDeleteStoryCampaign();
  const regenerateFailed = useRegenerateFailed(id!);

  // Auto-start generation when redirected from campaign creation with ?autostart=true
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (
      params.get('autostart') === 'true' &&
      campaign &&
      (campaign.status === 'draft' || campaign.status === 'paused') &&
      !autostartTriggered.current &&
      !startGeneration.isPending
    ) {
      autostartTriggered.current = true;
      startGeneration.mutate(id!);
      // Clean up the URL by removing the query param
      navigate(`/autoproduction/story/${id}`, { replace: true });
    }
  }, [campaign, searchString, id]);

  if (!campaign) {
    return <div>Loading...</div>;
  }

  // Derive active pipeline steps from campaign settings
  const cs = (campaign.campaignSettings || {}) as Record<string, any>;
  const activePipelineSteps = getActivePipelineSteps(cs);
  
  // Debug: trace what settings the dashboard reads
  console.log('[dashboard] campaignSettings:', {
    raw: campaign.campaignSettings,
    storyHasVoiceover: cs.storyHasVoiceover,
    storyBackgroundMusicTrack: cs.storyBackgroundMusicTrack,
    storyVideoModel: cs.storyVideoModel,
    storyMediaType: cs.storyMediaType,
    activeSteps: activePipelineSteps.map(s => s.label),
  });

  // Derive computed values from actual schema fields
  const storyTopics = (campaign.storyTopics as any[]) || [];
  const totalItems = storyTopics.length;
  const canStartGeneration = !isGenerating && (campaign.status === 'draft' || campaign.status === 'paused');
  const hasStories = stories.length > 0;
  const completedCount = stories.filter((s: StoryListItem) => s.status === 'completed').length;
  const failedCount = stories.filter((s: StoryListItem) => s.status === 'failed').length;

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
              {campaign.template} • {totalItems} stories
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={campaign.status as any} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{completedCount}/{totalItems}</div>
              <div className="text-sm text-muted-foreground">Generated</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalItems - completedCount - failedCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
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

      {/* Generation Controls — only show when there are actions available */}
      {(canStartGeneration || isGenerating || (failedCount > 0 && !isGenerating)) && (
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
                {campaign.status === 'paused' ? 'Resume Generation' : 'Start Generation'}
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

            {failedCount > 0 && !isGenerating && (
              <Button
                variant="outline"
                onClick={() => regenerateFailed.mutate()}
                disabled={regenerateFailed.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Failed ({failedCount})
              </Button>
            )}
          </div>

          {/* Overall Progress — only during generation */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress?.completed || 0}/{progress?.total || totalItems} ({Math.round(((progress?.completed || 0) / (progress?.total || totalItems || 1)) * 100)}%)
                </span>
              </div>
              <Progress value={((progress?.completed || 0) / (progress?.total || totalItems || 1)) * 100} className="h-2" />
            </div>
          )}

          {/* 8-Step Pipeline Progress */}
          {isGenerating && progress?.currentItem && (() => {
            const currentPipelineStep = mapStageToStep(progress.currentItem.stage);
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {progress.currentItem.stage || 'Processing'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {progress.currentItem.progress}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {activePipelineSteps.map((ps) => {
                    const isCompleted = currentPipelineStep > ps.step;
                    const isCurrent = currentPipelineStep === ps.step;
                    return (
                      <div key={ps.step} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-full transition-all
                          ${isCompleted ? 'bg-green-500 text-white' : ''}
                          ${isCurrent ? 'bg-primary text-white ring-2 ring-primary/30' : ''}
                          ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>
                        <span className={`
                          text-[10px] leading-tight text-center
                          ${isCurrent ? 'font-semibold text-primary' : ''}
                          ${isCompleted ? 'text-green-500' : ''}
                          ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
                        `}>
                          {ps.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Current Item Info */}
          {isGenerating && progress?.currentItem && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">
                Generating: {progress.currentItem.topic}
              </div>
              <div className="text-xs text-muted-foreground">
                Step {activePipelineSteps.findIndex(ps => ps.step === mapStageToStep(progress.currentItem?.stage)) + 1}/{activePipelineSteps.length}: {progress.currentItem?.stage} ({progress.currentItem?.progress}%)
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Stories Grid */}
      {hasStories && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stories.map((item: StoryListItem) => (
                <Card
                  key={item.index}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/autoproduction/story/${id}/stories/${item.index}`)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm line-clamp-2 flex-1">
                          {item.topic}
                        </div>
                        <StatusBadge status={item.status as any} className="shrink-0" />
                      </div>

                      {item.story?.videoUrl ? (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          <video
                            src={item.story.videoUrl}
                            poster={item.story.thumbnailUrl || undefined}
                            controls
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : item.story?.thumbnailUrl ? (
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={item.story.thumbnailUrl} 
                            alt={item.story.projectName || item.topic}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Story {item.index + 1}</span>
                        {item.story?.duration && (
                          <span>{item.story.duration}s</span>
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
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{campaign.name}"? This will permanently delete all generated stories and their video/audio assets from storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                deleteCampaign.mutate(id!, {
                  onSuccess: () => {
                    toast({ title: 'Campaign deleted', description: `"${campaign.name}" and all its assets have been removed.` });
                    navigate('/autoproduction/story');
                  },
                  onError: (err: any) => {
                    toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
                  },
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
