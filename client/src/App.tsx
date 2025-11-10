import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

import Dashboard from "@/pages/dashboard";
import Videos from "@/pages/videos";
import NarrativeMode from "@/pages/videos/narrative-mode";
import Stories from "@/pages/stories";
import StoryRouter from "@/pages/stories/story-router";
import Characters from "@/pages/characters";
import Locations from "@/pages/assets/locations";
import Voices from "@/pages/voices";
import BrandKits from "@/pages/brandkits";
import Uploads from "@/pages/uploads";
import Calendar from "@/pages/calendar";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Subscription from "@/pages/subscription";
import NotFound from "@/pages/not-found";
import { AssetsLayout } from "@/pages/assets/layout";

function MainLayout() {
  const [location] = useLocation();
  const isFullPageRoute = /^\/videos\/narrative\/[^/]+$/.test(location) || /^\/stories\/create\/[^/]+$/.test(location);

  if (isFullPageRoute) {
    return (
      <Switch>
        <Route path="/videos/narrative/:id" component={NarrativeMode} />
        <Route path="/stories/create/:template" component={StoryRouter} />
      </Switch>
    );
  }

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/videos" component={Videos} />
              <Route path="/stories" component={Stories} />
              <Route path="/history" component={History} />
              <Route path="/calendar" component={Calendar} />
              
              {/* Assets routes with shared layout */}
              <Route path="/assets">
                <Redirect to="/assets/characters" />
              </Route>
              <Route path="/assets/characters">
                {() => (
                  <AssetsLayout>
                    <Characters />
                  </AssetsLayout>
                )}
              </Route>
              <Route path="/assets/locations">
                {() => (
                  <AssetsLayout>
                    <Locations />
                  </AssetsLayout>
                )}
              </Route>
              <Route path="/assets/voices">
                {() => (
                  <AssetsLayout>
                    <Voices />
                  </AssetsLayout>
                )}
              </Route>
              <Route path="/assets/brandkits">
                {() => (
                  <AssetsLayout>
                    <BrandKits />
                  </AssetsLayout>
                )}
              </Route>
              <Route path="/assets/uploads">
                {() => (
                  <AssetsLayout>
                    <Uploads />
                  </AssetsLayout>
                )}
              </Route>
              
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route path="/subscription" component={Subscription} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <MainLayout />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
