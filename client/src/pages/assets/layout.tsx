import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User, MapPin, Mic, LayoutTemplate, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const assetNavItems = [
  { title: "Characters", url: "/assets/characters", icon: User },
  { title: "Locations", url: "/assets/locations", icon: MapPin },
  { title: "Voices", url: "/assets/voices", icon: Mic },
  { title: "Brand Kits", url: "/assets/brandkits", icon: LayoutTemplate },
  { title: "Uploads", url: "/assets/uploads", icon: FolderOpen },
];

const STORAGE_KEY = "assets-nav-collapsed";

interface AssetsLayoutProps {
  children: React.ReactNode;
}

export function AssetsLayout({ children }: AssetsLayoutProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  // Persist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="flex h-full gap-4">
      {/* Asset Library Navigation Aside */}
      <aside
        className={cn(
          "flex flex-col gap-4 border-r border-border pr-4 transition-all duration-300",
          isCollapsed ? "w-16" : "w-56"
        )}
      >
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-muted-foreground">ASSETS LIBRARY</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
            data-testid="button-toggle-assets-nav"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex flex-col gap-1">
          {assetNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.url;
            
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover-elevate",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                )}
                data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
