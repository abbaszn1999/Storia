import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/workspace-context";
import { Youtube, Instagram, Check, Link2, Settings2 } from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
  { 
    id: "youtube", 
    name: "YouTube", 
    icon: Youtube, 
    description: "Upload and manage videos on your YouTube channel",
    color: "text-red-500"
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    icon: SiTiktok, 
    description: "Share short-form videos on TikTok",
    color: "text-foreground"
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: Instagram, 
    description: "Post Reels and videos to Instagram",
    color: "text-pink-500"
  },
  { 
    id: "facebook", 
    name: "Facebook", 
    icon: SiFacebook, 
    description: "Publish videos to your Facebook page",
    color: "text-blue-500"
  },
];

export default function WorkspaceSettings() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  // Mock connected platforms (will be replaced with actual data from API)
  const connectedPlatforms = new Set<string>([]);

  const handleConnect = (platformId: string) => {
    toast({
      title: "Platform Integration",
      description: `${platformId} integration will be set up in the next phase. OAuth flow coming soon!`,
    });
  };

  const handleDisconnect = (platformId: string) => {
    toast({
      title: "Disconnect Platform",
      description: `Disconnecting ${platformId}...`,
    });
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No workspace selected</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspace preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" data-testid="tab-general">
            General
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team" disabled>
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>
                Update your workspace name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  defaultValue={currentWorkspace.name}
                  data-testid="input-workspace-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-description">Description</Label>
                <Textarea
                  id="workspace-description"
                  defaultValue={currentWorkspace.description || ""}
                  placeholder="Add a description for this workspace..."
                  data-testid="textarea-workspace-description"
                />
              </div>
              <Button data-testid="button-save-workspace">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Integrations</CardTitle>
              <CardDescription>
                Connect your social media accounts to publish content directly from Storia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isConnected = connectedPlatforms.has(platform.id);

                return (
                  <div
                    key={platform.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`platform-${platform.id}`}
                  >
                    <div className="flex gap-4 flex-1">
                      <div className={`mt-1 ${platform.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{platform.name}</h3>
                          {isConnected && (
                            <Badge variant="default" className="gap-1">
                              <Check className="w-3 h-3" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {platform.description}
                        </p>
                        {isConnected && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-muted" />
                            <span className="text-sm">@username_placeholder</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {isConnected ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                            data-testid={`button-disconnect-${platform.id}`}
                          >
                            <Settings2 className="mr-2 h-4 w-4" />
                            Settings
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                            data-testid={`button-remove-${platform.id}`}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                          data-testid={`button-connect-${platform.id}`}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage team members and permissions (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Team collaboration features will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
