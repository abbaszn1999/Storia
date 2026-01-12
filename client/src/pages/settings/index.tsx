import { useState } from "react";
import { Bell, Globe, Plug, Shield, Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      emailUpdates: true,
      videoComplete: true,
      weeklyDigest: false,
      marketingEmails: false,
    },
    general: {
      language: "en",
      timezone: "UTC-8",
      defaultVideoQuality: "1080p",
      autoSave: true,
    },
    integrations: {
      youtube: false,
      tiktok: false,
      instagram: false,
    },
    advanced: {
      apiAccess: false,
      webhooks: false,
      dataExport: true,
    },
  });

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 text-foreground">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <div className="border-b bg-background/80 backdrop-blur-xl">
          <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-1">
            <TabsTrigger 
              value="general" 
              className="gap-2 px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg" 
              data-testid="tab-general"
            >
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="gap-2 px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg" 
              data-testid="tab-notifications"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="integrations" 
              className="gap-2 px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg" 
              data-testid="tab-integrations"
            >
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="gap-2 px-6 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-t-lg" 
              data-testid="tab-advanced"
            >
              <Shield className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-0">
          <Card className="bg-background/70 backdrop-blur-xl border-input">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl mb-1">General Settings</CardTitle>
              <CardDescription>Configure your basic preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium text-muted-foreground">Language</Label>
                <Select
                  value={settings.general.language}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, language: value },
                    })
                  }
                >
                  <SelectTrigger id="language" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium text-muted-foreground">Timezone</Label>
                <Select
                  value={settings.general.timezone}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, timezone: value },
                    })
                  }
                >
                  <SelectTrigger id="timezone" data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="UTC+0">UTC</SelectItem>
                    <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-quality" className="text-sm font-medium text-muted-foreground">Default Video Quality</Label>
                <Select
                  value={settings.general.defaultVideoQuality}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, defaultVideoQuality: value },
                    })
                  }
                >
                  <SelectTrigger id="video-quality" data-testid="select-video-quality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p HD</SelectItem>
                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                    <SelectItem value="1440p">1440p 2K</SelectItem>
                    <SelectItem value="2160p">2160p 4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save" className="text-sm font-medium">Auto-save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your work every 30 seconds
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={settings.general.autoSave}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, autoSave: checked },
                    })
                  }
                  data-testid="switch-auto-save"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card className="bg-background/70 backdrop-blur-xl border-input">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl mb-1">Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-updates" className="text-sm font-medium">Email Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Switch
                  id="email-updates"
                  checked={settings.notifications.emailUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, emailUpdates: checked },
                    })
                  }
                  data-testid="switch-email-updates"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="video-complete" className="text-sm font-medium">Video Processing Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your videos finish processing
                  </p>
                </div>
                <Switch
                  id="video-complete"
                  checked={settings.notifications.videoComplete}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, videoComplete: checked },
                    })
                  }
                  data-testid="switch-video-complete"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-digest" className="text-sm font-medium">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your activity
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={settings.notifications.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, weeklyDigest: checked },
                    })
                  }
                  data-testid="switch-weekly-digest"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails" className="text-sm font-medium">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news, tips, and promotional content
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, marketingEmails: checked },
                    })
                  }
                  data-testid="switch-marketing-emails"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-0">
          <Card className="bg-background/70 backdrop-blur-xl border-input">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl mb-1">Publishing Integrations</CardTitle>
              <CardDescription>Connect your social media accounts for seamless publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-input bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">YT</span>
                  </div>
                  <div>
                    <p className="font-medium text-base">YouTube</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.integrations.youtube ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings.integrations.youtube ? "outline" : "default"}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      integrations: { ...settings.integrations, youtube: !settings.integrations.youtube },
                    })
                  }
                  data-testid="button-youtube-integration"
                >
                  {settings.integrations.youtube ? "Disconnect" : "Connect"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-input bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">TT</span>
                  </div>
                  <div>
                    <p className="font-medium text-base">TikTok</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.integrations.tiktok ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings.integrations.tiktok ? "outline" : "default"}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      integrations: { ...settings.integrations, tiktok: !settings.integrations.tiktok },
                    })
                  }
                  data-testid="button-tiktok-integration"
                >
                  {settings.integrations.tiktok ? "Disconnect" : "Connect"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-input bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">IG</span>
                  </div>
                  <div>
                    <p className="font-medium text-base">Instagram</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.integrations.instagram ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings.integrations.instagram ? "outline" : "default"}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      integrations: { ...settings.integrations, instagram: !settings.integrations.instagram },
                    })
                  }
                  data-testid="button-instagram-integration"
                >
                  {settings.integrations.instagram ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-0 space-y-6">
          <Card className="bg-background/70 backdrop-blur-xl border-input">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl mb-1">Advanced Settings</CardTitle>
              <CardDescription>Configure advanced features and developer options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="api-access" className="text-sm font-medium">API Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable programmatic access to your account
                  </p>
                </div>
                <Switch
                  id="api-access"
                  checked={settings.advanced.apiAccess}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      advanced: { ...settings.advanced, apiAccess: checked },
                    })
                  }
                  data-testid="switch-api-access"
                />
              </div>

              {settings.advanced.apiAccess && (
                <div className="grid gap-3 pl-4 border-l-2 border-primary/20">
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-key"
                      value="sk_live_************************"
                      readOnly
                      data-testid="input-api-key"
                    />
                    <Button variant="outline" data-testid="button-regenerate-api-key">
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="webhooks" className="text-sm font-medium">Webhooks</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time event notifications
                  </p>
                </div>
                <Switch
                  id="webhooks"
                  checked={settings.advanced.webhooks}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      advanced: { ...settings.advanced, webhooks: checked },
                    })
                  }
                  data-testid="switch-webhooks"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-export" className="text-sm font-medium">Data Export</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow exporting your data in JSON format
                  </p>
                </div>
                <Switch
                  id="data-export"
                  checked={settings.advanced.dataExport}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      advanced: { ...settings.advanced, dataExport: checked },
                    })
                  }
                  data-testid="switch-data-export"
                />
              </div>

              {settings.advanced.dataExport && (
                <div className="pl-4 border-l-2 border-primary/20">
                  <Button variant="outline" data-testid="button-export-data">
                    Export All Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/70 backdrop-blur-xl border-destructive/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-destructive text-xl mb-1">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" data-testid="button-delete-account">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
