import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Zap, Loader2 } from "lucide-react";
import { useStoryCampaigns } from "../../shared/hooks";
import { StatusBadge } from "../../shared/components/ui/status-badge";
import type { 
  StoryCampaign, 
  StoryTopic,
  ItemStatusEntry,
} from "../../shared/types";
import { calculateProgress } from "../../shared/types";
import { format } from "date-fns";

export default function AutoStoryList() {
  const [, navigate] = useLocation();
  const { data: campaigns = [], isLoading } = useStoryCampaigns();

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
            
            // Get settings from campaignSettings JSONB
            const settings = (campaign.campaignSettings as Record<string, unknown>) || {};
            const duration = (settings.duration as number) || 45;
            const aspectRatio = (settings.aspectRatio as string) || '9:16';
            
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

                    {/* Date */}
                    <div className="text-xs text-muted-foreground">
                      Created {format(new Date(campaign.createdAt), "PP")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
