import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Video, 
  MessageSquare, 
  Sparkles, 
  ShoppingBag, 
  Clapperboard,
  Zap,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  Music,
  Plus,
  ArrowRight,
  Play,
  Clock,
  BarChart,
  User,
  MapPin,
  Mic,
  LayoutTemplate,
  FolderOpen,
  Calendar,
  TrendingUp,
  FileText,
  Sparkles as SparklesIcon,
  Search,
  AtSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuroraBackground } from "@/components/aurora-background";
import { useWorkspace } from "@/contexts/workspace-context";
import { apiRequest } from "@/lib/queryClient";
import { STORY_TEMPLATES } from "@/constants/story-templates";
import { VIDEO_MODE_ROUTES, STORY_TEMPLATE_ROUTES } from "@/lib/routes";
import type { Video as VideoType } from "@shared/schema";
import type { Story } from "@shared/schema";

// Video Modes
const VIDEO_MODES = [
  {
    id: "narrative",
    title: "Narrative Video",
    description: "Create story-driven videos from script to storyboard with full creative control over scenes and visual storytelling",
    icon: Video,
    gradient: "from-blue-500 to-cyan-500",
    route: "/videos"
  },
  {
    id: "vlog",
    title: "Character Vlog",
    description: "AI character presents content in engaging vlog format with personality and natural delivery for authentic storytelling",
    icon: MessageSquare,
    gradient: "from-purple-500 to-pink-500",
    route: "/videos"
  },
  {
    id: "ambient",
    title: "Ambient Visual",
    description: "Mood-driven visual storytelling with seamless loops perfect for relaxation, focus, or atmospheric background content",
    icon: Sparkles,
    gradient: "from-indigo-500 to-purple-500",
    route: "/videos"
  },
  {
    id: "commerce",
    title: "Social Commerce",
    description: "Product showcase and promotional videos designed to drive engagement and conversions on social media platforms",
    icon: ShoppingBag,
    gradient: "from-orange-500 to-red-500",
    route: "/videos"
  },
  {
    id: "logo",
    title: "Logo Animation",
    description: "Brand storytelling through motion graphics with professional logo animations that bring your brand identity to life",
    icon: Clapperboard,
    gradient: "from-violet-500 to-fuchsia-500",
    route: "/videos/logo"
  }
];

// Story Templates Icons Map
const STORY_ICONS: Record<string, typeof Lightbulb> = {
  'problem-solution': Lightbulb,
  'tease-reveal': SparklesIcon,
  'before-after': RefreshCw,
  'myth-busting': AlertCircle,
  'asmr-sensory': Music,
  'auto-asmr': Music,
};

// Glassmorphism card style to keep aurora visible in both themes
const GLASS_CARD =
  "bg-white/80 dark:bg-white/5 border border-white/30 dark:border-white/10 backdrop-blur-xl shadow-lg";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { currentWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch recent videos
  const { data: videos = [], isLoading: isLoadingVideos } = useQuery<VideoType[]>({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/videos`],
    enabled: !!currentWorkspace?.id,
    staleTime: 30000,
  });

  // Fetch recent stories
  const { data: stories = [], isLoading: isLoadingStories } = useQuery<Story[]>({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/stories`],
    enabled: !!currentWorkspace?.id,
    staleTime: 30000,
  });

  // Fetch production campaigns
  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: [`/api/workspaces/${currentWorkspace?.id}/campaigns`],
    enabled: !!currentWorkspace?.id,
    staleTime: 30000,
  });

  // Get current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase();

  // Get recent projects (last 6)
  const recentProjects = [
    ...videos.slice(0, 3).map(v => ({ ...v, type: 'video' as const })),
    ...stories.slice(0, 3).map(s => ({ ...s, type: 'story' as const }))
  ]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 6);

  // Stats
  const stats = {
    totalVideos: videos.length,
    totalStories: stories.length,
    activeCampaigns: campaigns.filter((c: any) => c.status === 'active').length,
    completedThisMonth: videos.filter((v: VideoType) => {
      const created = new Date(v.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  const handleCreateVideo = (modeId: string) => {
    setLocation(`/videos`);
    // The videos page will handle mode selection
  };

  const handleCreateStory = (templateId: string) => {
    // Handle ASMR templates
    if (templateId === 'asmr-sensory') {
      setLocation("/stories/asmr");
      return;
    }
    
    const route = STORY_TEMPLATE_ROUTES[templateId];
    if (route) {
      setLocation(route);
    } else {
      // Fallback to stories page
      setLocation("/stories");
    }
  };

  const handleViewProject = (project: any) => {
    if (project.type === 'video') {
      const video = project as VideoType;
      const modeRoutes: Record<string, string> = {
        narrative: "/videos/narrative",
        ambient: "/videos/ambient",
        commerce: "/videos/commerce",
        vlog: "/videos/vlog",
        logo: "/videos/logo",
      };
      const baseRoute = modeRoutes[video.mode || ''] || "/videos";
      setLocation(`${baseRoute}/${video.id}`);
    } else {
      const story = project as Story;
      if (story.storyMode) {
        setLocation(`/stories/${story.storyMode}/export`);
      } else {
        setLocation("/stories");
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Enhanced Aurora Background */}
      <AuroraBackground 
        colorStops={[
          "#5227FF",
          "#7cff67", 
          "#5227FF",
          "#ff6b9d"
        ]}
        amplitude={1.2}
        blend={0.6}
      />

      <div className="relative z-10 px-4 py-8">
        {/* Hero Section - Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          {/* Date */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm text-muted-foreground mb-6 font-medium"
          >
            {formattedDate}
          </motion.p>

          {/* Main Question */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-8"
          >
            What's on your mind today?
          </motion.h1>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="border-2 shadow-xl bg-background/80 backdrop-blur-xl max-w-4xl mx-auto">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Search Icon */}
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  
                  {/* Input */}
                  <Input
                    type="text"
                    placeholder="Ask anything"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  />

                  {/* Add Tools Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-dashed"
                  >
                    <span className="text-xs mr-1">@</span>
                    Add Tools
                  </Button>

                  {/* Icons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions - Video Modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Create Video
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/videos")}
              className="text-muted-foreground hover:text-foreground"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {VIDEO_MODES.map((mode, index) => {
              const Icon = mode.icon;
              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="h-full"
                >
                  <Card 
                    className={`${GLASS_CARD} hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col`}
                    onClick={() => handleCreateVideo(mode.id)}
                  >
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 shrink-0">
                        {mode.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                        {mode.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions - Story Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Create Story
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/stories")}
              className="text-muted-foreground hover:text-foreground"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {STORY_TEMPLATES.filter(t => t.id !== 'auto-asmr').map((template, index) => {
              const Icon = STORY_ICONS[template.id] || SparklesIcon;
              // Extended descriptions for each template
              const extendedDescriptions: Record<string, string> = {
                'problem-solution': 'Present a problem and show how your product or idea solves it effectively with clear before and after results',
                'tease-reveal': 'Build curiosity with a teaser, then reveal the answer or product in an engaging way that captivates your audience',
                'before-after': 'Showcase a transformation that demonstrates real results, perfect for tutorials, testimonials, and case studies',
                'myth-busting': 'Address common misconceptions and reveal the truth with compelling evidence that educates and engages viewers',
                'asmr-sensory': 'Focus on satisfying sounds and visuals that create a relaxing experience without needing complex scripts or narration'
              };
              const description = extendedDescriptions[template.id] || template.description;
              
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="h-full"
                >
                  <Card 
                    className={`${GLASS_CARD} hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col`}
                    onClick={() => handleCreateStory(template.id)}
                  >
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.iconColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-2 shrink-0">
                        {template.name}
                      </h3>
                      {template.popular && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mb-2 shrink-0 w-fit">
                          Popular
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                        {description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Recent Projects
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/history")}
                className="text-muted-foreground hover:text-foreground"
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {isLoadingVideos || isLoadingStories ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading projects...
                </div>
              ) : recentProjects.length === 0 ? (
                <Card className={GLASS_CARD}>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No projects yet</p>
                    <Button onClick={() => setLocation("/videos")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                recentProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.05, duration: 0.5 }}
                  >
                    <Card 
                      className={`${GLASS_CARD} hover:shadow-lg transition-all duration-300 cursor-pointer group`}
                      onClick={() => handleViewProject(project)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            project.type === 'video' 
                              ? 'bg-blue-500/20 text-blue-500' 
                              : 'bg-purple-500/20 text-purple-500'
                          }`}>
                            {project.type === 'video' ? (
                              <Video className="h-6 w-6" />
                            ) : (
                              <Zap className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {project.type === 'video' 
                                ? (project as VideoType).title 
                                : (project as Story).projectName
                              }
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {project.type === 'video' 
                                  ? (project as VideoType).mode || 'Video'
                                  : (project as Story).storyMode || 'Story'
                                }
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Links & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Production Campaigns */}
            {stats.activeCampaigns > 0 && (
              <Card className={GLASS_CARD}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Production Campaigns</h3>
                      <p className="text-sm text-muted-foreground">{stats.activeCampaigns} active</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation("/production")}
                  >
                    View Campaigns
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Assets Quick Links */}
            <Card className={GLASS_CARD}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-4">Assets Library</h3>
                <div className="space-y-2">
                  {[
                    { icon: User, label: "Characters", route: "/assets/characters" },
                    { icon: MapPin, label: "Locations", route: "/assets/locations" },
                    { icon: Mic, label: "Voices", route: "/assets/voices" },
                    { icon: LayoutTemplate, label: "Brand Kits", route: "/assets/brandkits" },
                    { icon: FolderOpen, label: "Uploads", route: "/assets/uploads" },
                  ].map((asset) => {
                    const Icon = asset.icon;
                    return (
                      <Button
                        key={asset.route}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setLocation(asset.route)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {asset.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className={GLASS_CARD}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-4">This Month</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Videos Created</span>
                    <span className="text-lg font-bold text-foreground">{stats.completedThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Projects</span>
                    <span className="text-lg font-bold text-foreground">{stats.totalVideos + stats.totalStories}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setLocation("/usage")}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  View Usage
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
