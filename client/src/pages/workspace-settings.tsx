import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/workspace-context";
import { Youtube, Instagram, Check, Link2, Loader2 } from "lucide-react";
import { SiTiktok, SiFacebook } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { lateApi } from "@/lib/api/late";
import type { WorkspaceIntegration, Workspace } from "@shared/schema";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

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
  const [location, setLocation] = useLocation();
  const { currentWorkspace, setCurrentWorkspace, updateWorkspace, refetch, isLoading: workspacesLoading } = useWorkspace();
  const { toast } = useToast();
  
  // Fix: If we're at /workspace/undefined, redirect to correct route
  useEffect(() => {
    if (location.includes('/workspace/undefined')) {
      console.log('[DEBUG] Detected /workspace/undefined, redirecting to /workspace/settings');
      setLocation('/workspace/settings');
    }
  }, [location, setLocation]);
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "");
  const [workspaceDescription, setWorkspaceDescription] = useState(currentWorkspace?.description || "");
  const [deletingIntegrationId, setDeletingIntegrationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name);
      setWorkspaceDescription(currentWorkspace.description || "");
    }
  }, [currentWorkspace]);

  // Check if user just returned from OAuth connection (success or error)
  useEffect(() => {
    const urlString = window.location.search;
    const params = new URLSearchParams(window.location.search);
    const connectedPlatform = params.get('connected');
    
    // Check for error in URL (Late.dev may append ?error=connection_failed with malformed URL)
    const hasError = urlString.includes('error=connection_failed');
    
    // Get platform from either the error params or connected param (handle malformed URLs)
    const errorPlatform = params.get('platform') || connectedPlatform?.split('?')[0];
    
    if (hasError && errorPlatform) {
      const platformName = PLATFORMS.find(p => p.id === errorPlatform)?.name || 'Account';
      
      // Build helpful error message based on platform
      let errorMessage = `Failed to connect ${platformName}.`;
      if (errorPlatform === 'youtube') {
        errorMessage += ' Make sure you have a YouTube channel created on this Google account.';
      } else if (errorPlatform === 'instagram') {
        errorMessage += ' Make sure you have a Business or Creator Instagram account connected to a Facebook Page.';
      } else if (errorPlatform === 'facebook') {
        errorMessage += ' Make sure you have admin access to a Facebook Page.';
      }
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/workspace/settings');
      return;
    }
    
    if (connectedPlatform && !hasError) {
      // Extract just the platform name (in case Late.dev appended extra params with ?)
      const cleanPlatform = connectedPlatform.split('?')[0];
      const platformName = PLATFORMS.find(p => p.id === cleanPlatform)?.name || 'Account';
      
      // Show success message
      toast({
        title: 'Account Connected',
        description: `Your ${platformName} account has been connected successfully!`,
      });
      
      // Refresh integrations list
      if (currentWorkspace?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace.id, 'integrations'] });
      }
      
      // Clean up URL
      window.history.replaceState({}, '', '/workspace/settings');
    }
  }, [currentWorkspace, queryClient, toast]);

  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<WorkspaceIntegration[]>({
    queryKey: ['/api/workspaces', currentWorkspace?.id, 'integrations'],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${currentWorkspace?.id}/integrations`);
      if (!response.ok) throw new Error("Failed to fetch integrations");
      return response.json();
    },
    enabled: !!currentWorkspace?.id,
  });

  // Auto-sync accounts from Late.dev when component mounts
  // This triggers the backend to fetch from Late.dev and sync to our database
  useEffect(() => {
    if (currentWorkspace?.id) {
      lateApi.getConnectedAccounts(currentWorkspace.id)
        .then(() => {
          // Refresh our integrations after sync
          queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace.id, 'integrations'] });
        })
        .catch(err => console.error('Failed to sync accounts:', err));
    }
  }, [currentWorkspace?.id]);

  const handleSaveWorkspaceSettings = async () => {
    if (!currentWorkspace || !workspaceName.trim()) {
      toast({
        title: "Validation Error",
        description: "Workspace name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateWorkspace(currentWorkspace.id, {
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || undefined,
      });
      setCurrentWorkspace(updated);
      toast({
        title: "Workspace Updated",
        description: "Your workspace settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workspace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      setDeletingIntegrationId(integrationId);
      const response = await apiRequest("DELETE", `/api/workspaces/${currentWorkspace?.id}/integrations/${integrationId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace?.id, 'integrations'] });
      setDeletingIntegrationId(null);
      toast({
        title: "Integration Removed",
        description: "Platform integration has been disconnected.",
      });
    },
    onError: () => {
      setDeletingIntegrationId(null);
      toast({
        title: "Error",
        description: "Failed to remove integration. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleConnect = async (platformId: string) => {
    if (!currentWorkspace) {
      toast({
        title: 'Error',
        description: 'No workspace selected. Please select or create a workspace first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setConnectingPlatform(platformId);
      
      // Build redirect URL back to this page with success indicator
      const redirectUrl = `${window.location.origin}/workspace/settings?connected=${platformId}`;
      
      // Get Late.dev connection URL with pre-selected platform and redirect
      const { connectUrl } = await lateApi.getConnectUrl(currentWorkspace.id, platformId, redirectUrl);
      
      if (!connectUrl) {
        throw new Error('Failed to get connection URL');
      }
      
      // Navigate in the same tab - user will be redirected back after OAuth
      window.location.href = connectUrl;
      
    } catch (error) {
      setConnectingPlatform(null);
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async (integration: WorkspaceIntegration) => {
    if (!currentWorkspace) return;

    // For Late.dev integrations, use the Late.dev API
    if (integration.source === 'late' && integration.lateAccountId) {
      try {
        setDeletingIntegrationId(integration.id);
        await lateApi.disconnectAccount(currentWorkspace.id, integration.lateAccountId);
        
        queryClient.invalidateQueries({ queryKey: ['/api/workspaces', currentWorkspace.id, 'integrations'] });
        setDeletingIntegrationId(null);
        
        toast({
          title: "Account Disconnected",
          description: "Your account has been disconnected successfully.",
        });
      } catch (error) {
        setDeletingIntegrationId(null);
        toast({
          title: "Error",
          description: "Failed to disconnect account. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // For direct OAuth integrations (future)
      deleteIntegrationMutation.mutate(integration.id);
    }
  };

  // Show loading while workspaces are being fetched
  if (workspacesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show message if no workspace is available
  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">No workspace selected</p>
        <p className="text-sm text-muted-foreground">Please create or select a workspace from the sidebar</p>
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

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            Integrations
          </TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">
            General
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
                onClick={handleSaveWorkspaceSettings}
                disabled={isSaving}
                data-testid="button-save-workspace"
              >
                {isSaving && (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(integration)}
                            disabled={deletingIntegrationId === integration.id}
                            data-testid={`button-remove-${platform.id}`}
                          >
                            {deletingIntegrationId === integration.id && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect(platform.id)}
                            disabled={connectingPlatform === platform.id}
                            data-testid={`button-connect-${platform.id}`}
                          >
                            {connectingPlatform === platform.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {connectingPlatform !== platform.id && <Link2 className="mr-2 h-4 w-4" />}
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
