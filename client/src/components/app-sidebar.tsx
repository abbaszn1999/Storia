import { 
  Home, 
  Video, 
  Zap, 
  Calendar, 
  History, 
  User, 
  MapPin, 
  Mic, 
  LayoutTemplate, 
  FolderOpen, 
  ChevronDown, 
  Sparkles, 
  Plus, 
  Archive, 
  BarChart, 
  Library
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"; 
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WorkspaceSwitcher } from "@/components/workspace-switcher"; 
import { cn } from "@/lib/utils";

// --- بيانات القوائم ---
const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Videos", url: "/videos", icon: Video },
  { title: "Stories", url: "/stories", icon: Zap },
  { title: "History", url: "/history", icon: History },
  { title: "Usage", url: "/usage", icon: BarChart },
  { title: "Content Calendar", url: "/calendar", icon: Calendar },
];

const assetNavItems = [
  { title: "Characters", url: "/assets/characters", icon: User },
  { title: "Locations", url: "/assets/locations", icon: MapPin },
  { title: "Voices", url: "/assets/voices", icon: Mic },
  { title: "Brand Kits", url: "/assets/brandkits", icon: LayoutTemplate },
  { title: "Uploads", url: "/assets/uploads", icon: FolderOpen },
];

const productionNavItems = [
  { title: "New Campaign", url: "/autoproduction", icon: Plus },
  { title: "Campaign History", url: "/autoproduction/campaigns", icon: Archive },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const { setOpen } = useSidebar();

  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const logoSrc = isDark ? "/storia-logo-white.png" : "/storia-logo-black.png";

  return (
    <Sidebar collapsible="icon">
      {/* --- Header / Logo --- */}
      <SidebarHeader className={cn(
        "bg-gradient-to-b from-sidebar/50 to-transparent p-4",
        "group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center"
      )}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center"
        >
          <img 
            src={logoSrc} 
            alt="Storia" 
            className="h-9 w-auto object-contain transition-all duration-300 group-data-[collapsible=icon]:h-6"
          />
        </motion.div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* --- Main Navigation --- */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url} 
                      tooltip={item.title}
                      className={cn(
                        "mx-2 transition-all duration-200",
                        // التعديل الجوهري هنا:
                        // 1. عند الإغلاق، نجعل العرض كامل (w-full)
                        // 2. نحذف الهوامش (mx-0)
                        // 3. نوسط المحتوى (justify-center) بدلاً من justify-start الافتراضي
                        "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
                        location === item.url 
                          ? "bg-primary/20 text-primary font-semibold shadow-sm shadow-primary/10"
                          : "text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn(
                          "transition-transform",
                          location === item.url && "scale-110"
                        )} />
                        {/* النص يختفي تلقائياً بفضل مكتبة sidebar لكن التنسيق يبقى مهماً */}
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </motion.div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* --- Auto Production Section --- */}
        <Collapsible defaultOpen className="group/production">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip="Auto Production"
                    // هنا أيضاً: عند الإغلاق نوسط الأيقونة
                    className={cn(
                      "w-full justify-between mx-2",
                      "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">Auto Production</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/production:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>
            </SidebarMenu>

            <CollapsibleContent>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {productionNavItems.map((item, index) => (
                    <SidebarMenuItem key={item.title}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <SidebarMenuButton 
                          asChild 
                          isActive={location === item.url} 
                          tooltip={item.title}
                          className={cn(
                            "mx-2 mb-1 pl-8", // pl-8 لعمل Indent للعناصر الفرعية
                            // عند الإغلاق: نلغي الـ Indent ونوسط الأيقونة
                            "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:pl-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full",
                            location === item.url 
                              ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                          )}
                        >
                          <Link
                            href={item.url}
                            onClick={() => {
                              setOpen(false);
                            }}
                          >
                            <item.icon />
                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                            {(item as any).badge && (
                              <span className="ml-auto text-xs px-1.5 py-0.5 bg-muted rounded">
                                {(item as any).badge}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator className="my-2" />

        {/* --- Assets Library Section --- */}
        <Collapsible defaultOpen className="group/assets">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip="Assets Library"
                    className={cn(
                      "w-full justify-between mx-2",
                      "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                    )}
                  >
                    <Library className="h-4 w-4" />
                    <span className="font-semibold text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">Assets Library</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/assets:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>
            </SidebarMenu>

            <CollapsibleContent>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {assetNavItems.map((item, index) => (
                    <SidebarMenuItem key={item.title}>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        <SidebarMenuButton 
                          asChild 
                          isActive={location === item.url} 
                          tooltip={item.title}
                          className={cn(
                            "mx-2 mb-1 pl-8", // Indent للعناصر الفرعية
                             // عند الإغلاق: نلغي الـ Indent ونوسط الأيقونة
                            "group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:pl-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full",
                            location === item.url 
                              ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"
                          )}
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t border-sidebar-border bg-gradient-to-t from-sidebar/50 to-transparent flex justify-center">
        <div className="group-data-[collapsible=icon]:hidden w-full">
          <WorkspaceSwitcher />
        </div>
        
        {/* أيقونة المستخدم تظهر فقط عند الإغلاق وتكون في الوسط */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
               <User className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}