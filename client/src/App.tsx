import { useState } from "react";
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
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Bell, Sun, Moon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import Landing from "@/pages/landing";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import ForgotPassword from "@/pages/auth/forgot-password";
import Dashboard from "@/pages/dashboard";

// Website pages
import Home from "@/website/pages/home";
import FeaturesPage from "@/website/pages/features";
import PricingPage from "@/website/pages/pricing";
import IntegrationsPage from "@/website/pages/integrations";
import StoryboardPage from "@/website/pages/features/storyboard";
import VideoGeneratorPage from "@/website/pages/features/video-generator";
import StoriesGeneratorPage from "@/website/pages/features/stories-generator";
import AutoProductionPage from "@/website/pages/features/auto-production";
import AssetsLibraryPage from "@/website/pages/features/assets-library";
import Videos from "@/pages/videos";
import NarrativeMode from "@/pages/videos/narrative-mode";
import CharacterVlogMode from "@/pages/videos/character-vlog-mode";
import AmbientVisualMode from "@/pages/videos/ambient-visual-mode";
import SocialCommerceMode from "@/pages/videos/social-commerce-mode";
import LogoAnimation from "@/pages/videos/logo-animation";
import Stories from "@/pages/stories";
import StoryRouter from "@/pages/stories/story-router";
import StoryPreviewExport from "@/pages/stories/story-preview-export";
import ASMRGenerator from "@/pages/stories/asmr";
import Characters from "@/pages/characters";
import Locations from "@/pages/assets/locations";
import Voices from "@/pages/voices";
import BrandKits from "@/pages/brandkits";
import Uploads from "@/pages/uploads";
import Calendar from "@/pages/calendar";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import WorkspaceSettings from "@/pages/workspace-settings";
import Subscription from "@/pages/subscription";
import CreateShorts from "@/pages/shorts/create";

// Auto Production (NEW)
import AutoProductionHome from "@/autoproduction/pages";
import CampaignHistory from "@/autoproduction/pages/campaigns";
import AutoStoryList from "@/autoproduction/auto-story/pages";
import AutoStoryCreate from "@/autoproduction/auto-story/pages/create";
import AutoStoryDashboard from "@/autoproduction/auto-story/pages/[id]/dashboard";
import StoryDetail from "@/autoproduction/auto-story/pages/[id]/stories/[storyId]";
import AutoVideoList from "@/autoproduction/auto-video/pages";
import AutoVideoCreate from "@/autoproduction/auto-video/pages/create";
import UsagePage from "@/pages/usage";
import Onboarding from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function MainLayout() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isFullPageRoute = /^\/videos\/narrative\/[^/]+$/.test(location) || /^\/videos\/vlog\/[^/]+$/.test(location) || /^\/videos\/ambient\/[^/]+$/.test(location) || /^\/videos\/commerce\/[^/]+$/.test(location) || /^\/videos\/logo$/.test(location) || /^\/stories\/create\/[^/]+$/.test(location) || /^\/stories\/asmr$/.test(location) || /^\/stories\/[^/]+\/export$/.test(location) || /^\/shorts\/create\/[^/]+$/.test(location) || /^\/autoproduction$/.test(location) || /^\/autoproduction\/story\/create$/.test(location) || /^\/autoproduction\/video\/create$/.test(location);

  // Get user display name
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email?.split("@")[0] || "User";
  
  const firstName = user?.firstName || displayName.split(" ")[0];
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (isFullPageRoute) {
    return (
      <Switch>
        <Route path="/videos/narrative/:id" component={NarrativeMode} />
        <Route path="/videos/vlog/:id" component={CharacterVlogMode} />
        <Route path="/videos/ambient/:id" component={AmbientVisualMode} />
        <Route path="/videos/commerce/:id" component={SocialCommerceMode} />
        <Route path="/videos/logo" component={LogoAnimation} />
        <Route path="/stories/create/:template" component={StoryRouter} />
        <Route path="/stories/asmr" component={ASMRGenerator} />
        <Route path="/stories/:storyType/export" component={StoryPreviewExport} />
        <Route path="/shorts/create/:videoId" component={CreateShorts} />
        
        {/* Auto Production - Full Screen Wizards */}
        <Route path="/autoproduction" component={AutoProductionHome} />
        <Route path="/autoproduction/story/create" component={AutoStoryCreate} />
        <Route path="/autoproduction/video/create" component={AutoVideoCreate} />
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
          <header className="px-4 pt-4 relative z-10">
            <Card className="border-0 rounded-2xl bg-sidebar shadow-lg relative">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-6">
                  {/* Left Side - Sidebar Trigger + Greeting */}
                  <div className="flex items-center gap-4 flex-1">
                    <SidebarTrigger 
                      data-testid="button-sidebar-toggle"
                      className="text-sidebar-foreground hover:bg-sidebar-accent"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-sidebar-foreground">
                          {getGreeting()}, {firstName}
                        </h2>
                        <span className="text-2xl">👋</span>
                      </div>
                      <p className="text-sm text-sidebar-foreground/70">
                        Let's jot down a{" "}
                        <span className="underline decoration-sidebar-foreground/30 underline-offset-2 cursor-pointer hover:text-sidebar-foreground transition-colors">
                          note
                        </span>
                        {" "}or draw up a{" "}
                        <span className="underline decoration-sidebar-foreground/30 underline-offset-2 cursor-pointer hover:text-sidebar-foreground transition-colors">
                          to-do list
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Right Side - Notifications, Profile */}
                  <div className="flex items-center gap-3">
                    {/* Notification Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>

                    {/* Theme Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
                        document.documentElement.classList.toggle("dark");
                        localStorage.setItem("storia-theme", theme);
                      }}
                      className="h-10 w-10 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>

                    {/* Profile Picture with UserMenu */}
                    <UserMenu />
                  </div>
                </div>
              </CardContent>
            </Card>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/videos" component={Videos} />
              <Route path="/stories" component={Stories} />
              <Route path="/history" component={History} />
              <Route path="/usage" component={UsagePage} />
              <Route path="/calendar" component={Calendar} />
              
              {/* Auto Production (NEW) */}
              <Route path="/autoproduction" component={AutoProductionHome} />
              <Route path="/autoproduction/campaigns" component={CampaignHistory} />
              <Route path="/autoproduction/story" component={AutoStoryList} />
              <Route path="/autoproduction/story/create" component={AutoStoryCreate} />
              <Route path="/autoproduction/story/:id" component={AutoStoryDashboard} />
              <Route path="/autoproduction/story/:id/stories/:storyId" component={StoryDetail} />
              <Route path="/autoproduction/video" component={AutoVideoList} />
              <Route path="/autoproduction/video/create" component={AutoVideoCreate} />
              
              {/* Assets Library */}
              <Route path="/assets">
                <Redirect to="/assets/characters" />
              </Route>
              <Route path="/assets/characters" component={Characters} />
              <Route path="/assets/locations" component={Locations} />
              <Route path="/assets/voices" component={Voices} />
              <Route path="/assets/brandkits" component={BrandKits} />
              <Route path="/assets/uploads" component={Uploads} />
              
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route path="/workspace/settings" component={WorkspaceSettings} />
              <Route path="/subscription" component={Subscription} />
              <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Website routes (public pages - accessible to everyone when not authenticated)
  const isWebsiteRoute = location.startsWith("/features") || 
    location === "/pricing" || 
    location === "/integrations" ||
    location === "/blog";

  if (isWebsiteRoute) {
    return (
      <Switch>
        <Route path="/features" component={FeaturesPage} />
        <Route path="/features/storyboard" component={StoryboardPage} />
        <Route path="/features/video-generator" component={VideoGeneratorPage} />
        <Route path="/features/stories-generator" component={StoriesGeneratorPage} />
        <Route path="/features/auto-production" component={AutoProductionPage} />
        <Route path="/features/assets-library" component={AssetsLibraryPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/integrations" component={IntegrationsPage} />
        <Route component={FeaturesPage} />
      </Switch>
    );
  }

  // Show website home page only for unauthenticated users
  if (!isAuthenticated && location === "/") {
    return <Home />;
  }

  if (location === "/auth/sign-in") {
    return <SignIn />;
  }

  if (location === "/auth/sign-up") {
    return <SignUp />;
  }

  if (location === "/auth/forgot-password") {
    return <ForgotPassword />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  // Check if user needs to complete onboarding
  if (user && !user.hasCompletedOnboarding) {
    if (location !== "/onboarding") {
      return <Onboarding />;
    }
    return <Onboarding />;
  }

  // If user completed onboarding but is still on onboarding page, redirect to home
  if (location === "/onboarding" && user?.hasCompletedOnboarding) {
    setLocation("/");
    return <LoadingScreen />;
  }

  return (
    <WorkspaceProvider>
      <MainLayout />
    </WorkspaceProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
