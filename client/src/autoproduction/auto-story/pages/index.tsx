import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Sparkles, Zap, Loader2, Trash2, Play, Pause } from "lucide-react";
import { useStoryCampaigns, useDeleteStoryCampaign } from "../../shared/hooks";
import { useStartBatchGeneration, useCancelBatch } from "../hooks";
import { StatusBadge } from "../../shared/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import type { 
  StoryCampaign, 
  StoryTopic,
  ItemStatusEntry,
} from "../../shared/types";
import { calculateProgress } from "../../shared/types";
import { format } from "date-fns";

export default function AutoStoryList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: campaigns = [], isLoading } = useStoryCampaigns();
  const deleteCampaign = useDeleteStoryCampaign();
  const startGeneration = useStartBatchGeneration();
  const cancelBatch = useCancelBatch();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Auto Story Production
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate multiple short-form stories automatically using proven templates
          </p>
        </div>
        <Button onClick={() => navigate("/autoproduction/story/create")}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No story campaigns yet</p>
            <Button onClick={() => navigate("/autoproduction/story/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign: StoryCampaign) => {
            // Calculate progress from itemStatuses
            const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatusEntry>) || {};
            const storyTopics = (campaign.storyTopics as StoryTopic[]) || [];
            const { totalItems, completedItems } = calculateProgress(itemStatuses);
            
            // Use storyTopics length if itemStatuses is empty
            const displayTotal = totalItems || storyTopics.length;
            
            // Get settings from campaignSettings JSONB (keys are prefixed with 'story')
            const settings = (campaign.campaignSettings as Record<string, unknown>) || {};
            const duration = (settings.storyDuration as number) || 45;
            const aspectRatio = (settings.storyAspectRatio as string) || '9:16';
            const isGenerating = campaign.status === 'generating';
            const canStart = campaign.status === 'draft' || campaign.status === 'paused';
            
            return (
              <Card
                key={campaign.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/autoproduction/story/${campaign.id}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-lg line-clamp-1">{campaign.name}</h3>
                      </div>
                      <StatusBadge status={campaign.status as any} />
                    </div>

                    {/* Template */}
                    {campaign.template && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {campaign.template.replace(/-/g, ' ')}
                        </Badge>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Stories</div>
                        <div className="font-semibold">
                          {completedItems}/{displayTotal}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Duration</div>
                        <div className="font-semibold">{duration}s</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Ratio</div>
                        <div className="font-semibold">{aspectRatio}</div>
                      </div>
                    </div>

                    {/* Actions + Date */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created {format(new Date(campaign.createdAt), "PP")}
                      </div>
                      <div className="flex items-center gap-1">
                        {canStart && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              startGeneration.mutate(campaign.id);
                              toast({ title: campaign.status === 'paused' ? 'Resuming...' : 'Starting generation...' });
                            }}
                            disabled={startGeneration.isPending}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isGenerating && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelBatch.mutate(campaign.id);
                              toast({ title: 'Pausing generation...' });
                            }}
                            disabled={cancelBatch.isPending}
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: campaign.id, name: campaign.name });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This will permanently delete all generated stories and their video/audio assets from storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  deleteCampaign.mutate(deleteTarget.id, {
                    onSuccess: () => {
                      toast({ title: 'Campaign deleted', description: `"${deleteTarget.name}" and all its assets have been removed.` });
                      setDeleteTarget(null);
                    },
                    onError: (err: any) => {
                      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
                    },
                  });
                }
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
