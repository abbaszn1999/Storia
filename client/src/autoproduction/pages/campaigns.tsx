import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Sparkles, Video, Zap } from "lucide-react";
import { useVideoCampaigns, useStoryCampaigns } from "@/autoproduction/shared/hooks";
import type { 
  VideoCampaign, 
  StoryCampaign, 
  ItemStatusEntry,
} from "@/autoproduction/shared/types";
import { calculateProgress } from "@/autoproduction/shared/types";
import { format } from "date-fns";

type CombinedCampaign = (VideoCampaign & { campaignType: 'video' }) | (StoryCampaign & { campaignType: 'story' });

export default function CampaignHistory() {
  const [, navigate] = useLocation();

  const { data: videoCampaigns = [], isLoading: isLoadingVideos } = useVideoCampaigns();
  const { data: storyCampaigns = [], isLoading: isLoadingStories } = useStoryCampaigns();
  
  const isLoading = isLoadingVideos || isLoadingStories;

  // Combine campaigns with type marker
  const campaigns: CombinedCampaign[] = [
    ...videoCampaigns.map(c => ({ ...c, campaignType: 'video' as const })),
    ...storyCampaigns.map(c => ({ ...c, campaignType: 'story' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "generating"
  );
  const pausedCampaigns = campaigns.filter((c) => c.status === "paused");
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const draftCampaigns = campaigns.filter((c) => c.status === "draft");
  const reviewCampaigns = campaigns.filter((c) => c.status === "review");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const CampaignCard = ({ campaign }: { campaign: CombinedCampaign }) => {
    const isStory = campaign.campaignType === 'story';
    const CampaignIcon = isStory ? Zap : Video;
    
    // Calculate progress from itemStatuses
    const itemStatuses = (campaign.itemStatuses as Record<string, ItemStatusEntry>) || {};
    const { totalItems, completedItems } = calculateProgress(itemStatuses);
    
    // Get settings from campaignSettings JSONB
    const settings = (campaign.campaignSettings as Record<string, unknown>) || {};
    const duration = (settings.duration as number) || 60;
    const aspectRatio = (settings.aspectRatio as string) || '9:16';
    
    // Get template/mode
    const templateOrMode = isStory 
      ? (campaign as StoryCampaign).template 
      : (campaign as VideoCampaign).videoMode;
    
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={() => {
          if (isStory) {
            navigate(`/autoproduction/story/${campaign.id}`);
          } else {
            navigate(`/autoproduction/video/${campaign.id}`);
          }
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <CampaignIcon className="h-5 w-5 text-primary" />
              {campaign.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {isStory ? "Story" : "Video"}
              </Badge>
              <Badge variant={campaign.status === "generating" ? "default" : "secondary"}>
                {campaign.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template/Mode Info */}
          {templateOrMode && (
            <p className="text-sm text-muted-foreground capitalize">
              {isStory ? 'Template' : 'Mode'}: {templateOrMode.replace(/-/g, ' ')}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Items</div>
              <div className="font-semibold">
                {completedItems}/{totalItems}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Duration</div>
              <div className="font-semibold">{duration}s</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ratio</div>
              <div className="font-semibold">{aspectRatio}</div>
            </div>
          </div>

          {/* Date */}
          <div className="text-xs text-muted-foreground">
            Created {format(new Date(campaign.createdAt), "PP")}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Campaign History
          </h1>
          <p className="text-muted-foreground mt-2">
            All your automated production campaigns in one place
          </p>
        </div>
        <Button onClick={() => navigate("/autoproduction")}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
          <TabsTrigger value="review">Review ({reviewCampaigns.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({pausedCampaigns.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCampaigns.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({draftCampaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <Button onClick={() => navigate("/autoproduction")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No active campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          {reviewCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No campaigns in review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          {pausedCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No paused campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pausedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No completed campaigns yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          {draftCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No draft campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
