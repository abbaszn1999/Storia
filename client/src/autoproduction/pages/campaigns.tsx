import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Sparkles, Video, Zap } from "lucide-react";
import type { ProductionCampaign } from "@/autoproduction/shared/types";
import { format } from "date-fns";

export default function CampaignHistory() {
  const [, navigate] = useLocation();

  const { data: campaigns = [], isLoading } = useQuery<ProductionCampaign[]>({
    queryKey: ["/api/autoproduction/campaigns"],
  });

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "generating"
  );
  const pausedCampaigns = campaigns.filter((c) => c.status === "paused");
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const draftCampaigns = campaigns.filter((c) => c.status === "draft");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const CampaignCard = ({ campaign }: { campaign: ProductionCampaign }) => {
    const isStory = campaign.type === "auto-story";
    const CampaignIcon = isStory ? Zap : Video;
    
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
                {campaign.type === "auto-story" ? "Story" : "Video"}
              </Badge>
              <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                {campaign.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template/Mode Info */}
          {campaign.storyTemplate && (
            <p className="text-sm text-muted-foreground">
              Template: {campaign.storyTemplate}
            </p>
          )}
          {campaign.videoMode && (
            <p className="text-sm text-muted-foreground">
              Mode: {campaign.videoMode}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Items</div>
              <div className="font-semibold">
                {campaign.itemsGenerated || 0}/{campaign.totalItems || 0}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Duration</div>
              <div className="font-semibold">
                {campaign.storyDuration || campaign.duration || 0}s
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Ratio</div>
              <div className="font-semibold">
                {campaign.storyAspectRatio || campaign.aspectRatio || "9:16"}
              </div>
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
