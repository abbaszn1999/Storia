import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/workspace-context";
import { Youtube, Instagram, Check, Link2, Settings2, Loader2 } from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WorkspaceIntegration } from "@shared/schema";
import { useState } from "react";

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
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "");
  const [workspaceDescription, setWorkspaceDescription] = useState(currentWorkspace?.description || "");

  // Fetch workspace integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<WorkspaceIntegration[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'integrations'],
    enabled: !!currentWorkspace?.id,
  });

  // Mutation for updating workspace
  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest(`/api/workspaces/${currentWorkspace?.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (updatedWorkspace) => {
      setCurrentWorkspace(updatedWorkspace);
      toast({
        title: "Workspace Updated",
        description: "Your workspace settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workspace. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting integration
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      return apiRequest(`/api/workspaces/${currentWorkspace?.id}/integrations/${integrationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'integrations'] });
      toast({
        title: "Integration Removed",
        description: "Platform integration has been disconnected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove integration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveWorkspace = () => {
    if (!workspaceName.trim()) {
      toast({
        title: "Validation Error",
        description: "Workspace name is required.",
        variant: "destructive",
      });
      return;
    }
    updateWorkspaceMutation.mutate({
      name: workspaceName,
      description: workspaceDescription,
    });
  };

  const handleConnect = (platformId: string) => {
    toast({
      title: "Platform Integration",
      description: `${platformId} integration will be set up in the next phase. OAuth flow coming soon!`,
    });
  };

  const handleDisconnect = (integrationId: string) => {
    deleteIntegrationMutation.mutate(integrationId);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No workspace selected</p>
      </div>
    );
  }

  // Build a map of platform to integration for quick lookup
  const integrationMap = new Map(
    integrations.map((integration) => [integration.platform, integration])
  );

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
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  data-testid="input-workspace-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-description">Description</Label>
                <Textarea
                  id="workspace-description"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="Add a description for this workspace..."
                  data-testid="textarea-workspace-description"
                />
              </div>
              <Button 
                onClick={handleSaveWorkspace}
                disabled={updateWorkspaceMutation.isPending}
                data-testid="button-save-workspace"
              >
                {updateWorkspaceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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
              {integrationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const integration = integrationMap.get(platform.id);
                  const isConnected = !!integration && integration.isActive;

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
                          {isConnected && integration && (
                            <div className="flex items-center gap-2 mt-2">
                              {integration.platformProfileImage ? (
                                <img
                                  src={integration.platformProfileImage}
                                  alt={integration.platformUsername || "Profile"}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted" />
                              )}
                              <span className="text-sm">
                                {integration.platformUsername ? `@${integration.platformUsername}` : "Connected"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {isConnected && integration ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConnect(platform.id)}
                              data-testid={`button-settings-${platform.id}`}
                            >
                              <Settings2 className="mr-2 h-4 w-4" />
                              Settings
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnect(integration.id)}
                              disabled={deleteIntegrationMutation.isPending}
                              data-testid={`button-remove-${platform.id}`}
                            >
                              {deleteIntegrationMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
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
                })
              )}
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
