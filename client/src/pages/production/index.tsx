import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Sparkles, Video, Calendar } from "lucide-react";
import type { ProductionCampaign } from "@shared/schema";
import { format } from "date-fns";

export default function ProductionCampaigns() {
  const [, navigate] = useLocation();

  const { data: campaigns = [], isLoading } = useQuery<ProductionCampaign[]>({
    queryKey: ["/api/production-campaigns"],
  });

  const activeCampaigns = campaigns.filter((c) => c.status === "in_progress" || c.status === "review" || c.status === "generating_concepts");
  const pausedCampaigns = campaigns.filter((c) => c.status === "paused");
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const cancelledCampaigns = campaigns.filter((c) => c.status === "cancelled" || c.status === "draft");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const CampaignCard = ({ campaign }: { campaign: ProductionCampaign }) => (
    <Card
      className="cursor-pointer hover-elevate active-elevate-2"
      onClick={() => {
        if (campaign.status === "review") {
          navigate(`/production/${campaign.id}/review`);
        } else if (campaign.status === "in_progress" || campaign.status === "paused" || campaign.status === "completed") {
          navigate(`/production/${campaign.id}/dashboard`);
        } else {
          navigate(`/production/${campaign.id}/review`);
        }
      }}
      data-testid={`campaign-card-${campaign.id}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2" data-testid={`text-campaign-name-${campaign.id}`}>
            <Sparkles className="h-5 w-5 text-primary" />
            {campaign.name}
          </CardTitle>
          <Badge variant={campaign.status === "in_progress" ? "default" : "secondary"} data-testid={`badge-campaign-status-${campaign.id}`}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{campaign.conceptPrompt}</p>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Videos</div>
            <div className="font-semibold flex items-center gap-1">
              <Video className="h-3 w-3" />
              {campaign.videosGenerated}/{campaign.videoCount}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Duration</div>
            <div className="font-semibold">{campaign.duration}s</div>
          </div>
          <div>
            <div className="text-muted-foreground">Ratio</div>
            <div className="font-semibold">{campaign.aspectRatio}</div>
          </div>
        </div>

        {campaign.scheduleStartDate && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Starts {format(new Date(campaign.scheduleStartDate), "PP")}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Created {format(new Date(campaign.createdAt), "PP")}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Auto Production Campaigns
          </h1>
          <p className="text-muted-foreground mt-2">Automate your video production at scale</p>
        </div>
        <Button onClick={() => navigate("/production/new")} data-testid="button-new-campaign">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <Tabs defaultValue="all" data-testid="tabs-campaigns">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="paused" data-testid="tab-paused">
            Paused ({pausedCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            History ({completedCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled">
            Cancelled ({cancelledCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <Button onClick={() => navigate("/production/new")} data-testid="button-create-first">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-6">
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
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No active campaigns</p>
                <Button onClick={() => navigate("/production/new")} data-testid="button-create-first-active">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-6">
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
            <div className="grid grid-cols-3 gap-6">
              {pausedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {completedCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No completed campaigns yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-muted-foreground">No cancelled campaigns</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {cancelledCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
