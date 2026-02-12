// Website router – unauthenticated visitors see the correct page for each path
import { Switch, Route } from "wouter";
import Home from "@/website/pages/home";
import FeaturesPage from "@/website/pages/features";
import StoryboardPage from "@/website/pages/features/storyboard";
import VideoGeneratorPage from "@/website/pages/features/video-generator";
import StoriesGeneratorPage from "@/website/pages/features/stories-generator";
import AutoProductionPage from "@/website/pages/features/auto-production";
import AssetsLibraryPage from "@/website/pages/features/assets-library";
import PricingPage from "@/website/pages/pricing";
import IntegrationsPage from "@/website/pages/integrations";
import BlogPage from "@/website/pages/blog";

export default function Landing() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/features/storyboard" component={StoryboardPage} />
      <Route path="/features/video-generator" component={VideoGeneratorPage} />
      <Route path="/features/stories-generator" component={StoriesGeneratorPage} />
      <Route path="/features/auto-production" component={AutoProductionPage} />
      <Route path="/features/assets-library" component={AssetsLibraryPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route component={Home} />
    </Switch>
  );
}
