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
import { Loader2 } from "lucide-react";

import Landing from "@/pages/landing";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import ForgotPassword from "@/pages/auth/forgot-password";
import Dashboard from "@/pages/dashboard";
import Videos from "@/pages/videos";
import NarrativeMode from "@/pages/videos/narrative-mode";
import CharacterVlogMode from "@/pages/videos/character-vlog-mode";
import AmbientVisualMode from "@/pages/videos/ambient-mode";
import SocialCommerceMode from "@/pages/videos/social-commerce-mode";
import LogoAnimationMode from "@/pages/videos/logo-animation-mode";
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
import ProductionCampaigns from "@/pages/production";
import ProductionCampaignCreate from "@/pages/production/create";
import ProductionCampaignReview from "@/pages/production/review";
import ProductionCampaignDashboard from "@/pages/production/dashboard";
import CreateShorts from "@/pages/shorts/create";
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
  const isFullPageRoute = /^\/videos\/narrative\/[^/]+$/.test(location) || /^\/videos\/vlog\/[^/]+$/.test(location) || /^\/videos\/ambient\/[^/]+$/.test(location) || /^\/videos\/commerce\/[^/]+$/.test(location) || /^\/videos\/logo\/[^/]+$/.test(location) || /^\/stories\/create\/[^/]+$/.test(location) || /^\/stories\/asmr$/.test(location) || /^\/stories\/[^/]+\/export$/.test(location) || /^\/shorts\/create\/[^/]+$/.test(location);

  if (isFullPageRoute) {
    return (
      <Switch>
        <Route path="/videos/narrative/:id" component={NarrativeMode} />
        <Route path="/videos/vlog/:id" component={CharacterVlogMode} />
        <Route path="/videos/ambient/:id" component={AmbientVisualMode} />
        <Route path="/videos/commerce/:id" component={SocialCommerceMode} />
        <Route path="/videos/logo/:id" component={LogoAnimationMode} />
        <Route path="/stories/create/:template" component={StoryRouter} />
        <Route path="/stories/asmr" component={ASMRGenerator} />
        <Route path="/stories/:storyType/export" component={StoryPreviewExport} />
        <Route path="/shorts/create/:videoId" component={CreateShorts} />
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
              <Route path="/usage" component={UsagePage} />
              <Route path="/calendar" component={Calendar} />
              
              {/* Production Campaigns */}
              <Route path="/production" component={ProductionCampaigns} />
              <Route path="/production/new" component={ProductionCampaignCreate} />
              <Route path="/production/:id/review" component={ProductionCampaignReview} />
              <Route path="/production/:id/dashboard" component={ProductionCampaignDashboard} />
              
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
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
