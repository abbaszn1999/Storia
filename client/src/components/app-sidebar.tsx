import { Home, Video, Zap, Calendar, Settings, History, User, MapPin, Mic, LayoutTemplate, FolderOpen, ChevronDown } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Videos", url: "/videos", icon: Video },
  { title: "Stories", url: "/stories", icon: Zap },
  { title: "History", url: "/history", icon: History },
  { title: "Content Calendar", url: "/calendar", icon: Calendar },
];

const assetNavItems = [
  { title: "Characters", url: "/assets/characters", icon: User },
  { title: "Locations", url: "/assets/locations", icon: MapPin },
  { title: "Voices", url: "/assets/voices", icon: Mic },
  { title: "Brand Kits", url: "/assets/brandkits", icon: LayoutTemplate },
  { title: "Uploads", url: "/assets/uploads", icon: FolderOpen },
];


export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <img src="/storia-logo.png" alt="Storia" className="h-8 w-8" />
          <span className="text-xl font-display font-semibold">Storia</span>
        </div>
        <WorkspaceSwitcher />
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

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between hover-elevate active-elevate-2 rounded-md px-2 py-1.5" data-testid="button-toggle-assets">
                Assets Library
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/workspace/settings"} data-testid="link-workspace-settings">
              <Link href="/workspace/settings">
                <Settings className="h-4 w-4" />
                <span>Workspace Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
