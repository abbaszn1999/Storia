import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Pause, Play, XCircle, ChevronDown, Video, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductionCampaign, CampaignVideo } from "@shared/schema";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "secondary",
  generating: "default",
  approved: "default",
  in_production: "default",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
};

export default function ProductionCampaignDashboard() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: campaign, isLoading: campaignLoading } = useQuery<ProductionCampaign>({
    queryKey: ["/api/production-campaigns", id],
    enabled: !!id,
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<CampaignVideo[]>({
    queryKey: ["/api/production-campaigns", id, "videos"],
    enabled: !!id,
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/production-campaigns/${id}/pause`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns", id] });
      toast({ title: "Campaign paused" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/production-campaigns/${id}/resume`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns", id] });
      toast({ title: "Campaign resumed" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/production-campaigns/${id}`, { status: "cancelled" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-campaigns", id] });
      toast({ title: "Campaign cancelled" });
    },
  });

  if (campaignLoading || videosLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const completedVideos = videos.filter((v) => v.status === "completed").length;
  const inProgressVideos = videos.filter((v) => v.status === "in_production" || v.status === "generating").length;
  const publishedVideos = videos.filter((v) => v.actualPublishDate).length;
  const overallProgress = (completedVideos / videos.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-campaign-name">
            {campaign.name}
            <Badge variant={campaign.status === "in_progress" ? "default" : "secondary"} data-testid="badge-campaign-status">
              {campaign.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-2">
            {campaign.storyIdeas && campaign.storyIdeas.length > 0 
              ? `${campaign.storyIdeas.length} story ${campaign.storyIdeas.length === 1 ? 'idea' : 'ideas'} / videos` 
              : "No story ideas"}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.status === "in_progress" ? (
            <Button variant="outline" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending} data-testid="button-pause">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : campaign.status === "paused" ? (
            <Button variant="default" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending} data-testid="button-resume">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          ) : null}
          <Button variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} data-testid="button-cancel">
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Campaign
          </Button>
        </div>
      </div>

      <Card data-testid="card-progress">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedVideos} of {videos.length} videos completed</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} data-testid="progress-overall" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card data-testid="card-stat-generated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Generated</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-generated">{campaign.videosGenerated}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-inprogress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-inprogress">{inProgressVideos}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-completed">{completedVideos}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-published">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-published">{publishedVideos}</div>
          </CardContent>
        </Card>
      </div>

      <Collapsible data-testid="collapsible-settings">
        <Card>
          <CollapsibleTrigger className="w-full" asChild>
            <CardHeader className="cursor-pointer hover-elevate active-elevate-2">
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Settings</CardTitle>
                <ChevronDown className="h-5 w-5 transition-transform" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Aspect Ratio</div>
                  <div className="font-semibold">{campaign.aspectRatio}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div className="font-semibold">{campaign.duration}s</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Language</div>
                  <div className="font-semibold">{campaign.language}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Art Style</div>
                  <div className="font-semibold">
                    {campaign.artStyle || (campaign.styleReferenceImageUrl ? "Reference Image" : "Not set")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Tone</div>
                  <div className="font-semibold">{campaign.tone || "Not set"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Genre</div>
                  <div className="font-semibold">{campaign.genre || "Not set"}</div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div>
        <h2 className="text-2xl font-display font-bold mb-4">Campaign Videos</h2>
        <div className="grid grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} data-testid={`video-card-${video.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base" data-testid={`text-video-title-${video.id}`}>{video.title}</CardTitle>
                  <Badge variant={statusColors[video.status] as any} data-testid={`badge-video-status-${video.id}`}>
                    {video.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                
                {video.status === "in_production" || video.status === "generating" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{video.generationProgress}%</span>
                    </div>
                    <Progress value={video.generationProgress} data-testid={`progress-video-${video.id}`} />
                  </div>
                ) : null}

                {video.scheduledPublishDate && (
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Scheduled: {format(new Date(video.scheduledPublishDate), "PPp")}
                  </div>
                )}

                {video.errorMessage && (
                  <div className="text-sm text-destructive flex items-start gap-1">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    {video.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
