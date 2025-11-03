import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

import Dashboard from "@/pages/dashboard";
import Videos from "@/pages/videos";
import NarrativeMode from "@/pages/videos/narrative-mode";
import Stories from "@/pages/stories";
import StoryRouter from "@/pages/stories/story-router";
import Characters from "@/pages/characters";
import Calendar from "@/pages/calendar";
import History from "@/pages/history";
import NotFound from "@/pages/not-found";

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
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/videos" component={Videos} />
              <Route path="/stories" component={Stories} />
              <Route path="/history" component={History} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/assets/characters" component={Characters} />
              <Route path="/assets/brandkits" component={NotFound} />
              <Route path="/assets/uploads" component={NotFound} />
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
