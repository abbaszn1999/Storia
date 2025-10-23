import { Home, Video, Zap, FolderOpen, Calendar, Settings, User, Plus, LayoutTemplate } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HistoryItem } from "@/components/history-item";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Videos", url: "/videos", icon: Video },
  { title: "Stories", url: "/stories", icon: Zap },
  { title: "Content Calendar", url: "/calendar", icon: Calendar },
];

const assetNavItems = [
  { title: "Characters", url: "/assets/characters", icon: User },
  { title: "Brand Kits", url: "/assets/brandkits", icon: LayoutTemplate },
  { title: "Uploads", url: "/assets/uploads", icon: FolderOpen },
];

const recentHistory = [
  {
    id: "1",
    title: "Summer Product Launch",
    type: "video" as const,
    status: "completed",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    url: "/videos/narrative/1",
  },
  {
    id: "2",
    title: "Brand Story 2024",
    type: "video" as const,
    status: "processing",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    url: "/videos/narrative/2",
  },
  {
    id: "3",
    title: "Quick Product Demo",
    type: "story" as const,
    status: "completed",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    url: "/stories/3",
  },
  {
    id: "4",
    title: "Customer Testimonials",
    type: "video" as const,
    status: "draft",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    url: "/videos/narrative/4",
  },
  {
    id: "5",
    title: "Team Introduction",
    type: "story" as const,
    status: "published",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    url: "/stories/5",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src="/storia-logo.png" alt="Storia" className="h-8 w-8" />
          <span className="text-xl font-display font-semibold">Storia</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <div className="flex items-center justify-between gap-2 px-2 mb-2">
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <Button variant="ghost" size="sm" className="text-xs" asChild data-testid="button-view-all-history">
              <Link href="/videos">View All</Link>
            </Button>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-64">
              <div className="space-y-1 px-2">
                {recentHistory.map((item) => (
                  <HistoryItem key={item.id} {...item} />
                ))}
              </div>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Assets Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {assetNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground">1,250 credits</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" data-testid="button-settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
