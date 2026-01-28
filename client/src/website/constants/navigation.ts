import { 
  Layers, 
  Video, 
  BookOpen, 
  Wand2, 
  FolderOpen,
  Sparkles,
  Zap,
  Film,
  ImageIcon,
  Mic
} from "lucide-react";

export const features = [
  {
    id: "storyboard",
    title: "Storyboard",
    description: "Create visual storyboards with AI-powered scene generation",
    href: "/features/storyboard",
    icon: Layers,
    color: "from-violet-500 to-purple-600",
    glowColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.4)",
    badge: null,
  },
  {
    id: "video-generator",
    title: "Video Generator",
    description: "Transform scripts into stunning videos automatically",
    href: "/features/video-generator",
    icon: Video,
    color: "from-blue-500 to-cyan-500",
    glowColor: "rgba(59, 130, 246, 0.2)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    badge: "Popular",
  },
  {
    id: "stories-generator",
    title: "Stories Generator",
    description: "Generate engaging social media stories in seconds",
    href: "/features/stories-generator",
    icon: BookOpen,
    color: "from-pink-500 to-rose-500",
    glowColor: "rgba(236, 72, 153, 0.2)",
    borderColor: "rgba(236, 72, 153, 0.4)",
    badge: null,
  },
  {
    id: "auto-production",
    title: "Auto Production",
    description: "End-to-end automated video production pipeline",
    href: "/features/auto-production",
    icon: Wand2,
    color: "from-amber-500 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.2)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    badge: "New",
  },
  {
    id: "assets",
    title: "Assets Library",
    description: "Manage characters, locations, voices and brand assets",
    href: "/features/assets-library",
    icon: FolderOpen,
    color: "from-emerald-500 to-teal-500",
    glowColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    badge: null,
  },
];

export const navLinks = [
  {
    id: "features",
    label: "Features",
    href: "/features",
    hasMegaMenu: true,
  },
  {
    id: "pricing",
    label: "Pricing",
    href: "/pricing",
    hasMegaMenu: false,
  },
  {
    id: "blog",
    label: "Blog",
    href: "/blog",
    hasMegaMenu: false,
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/integrations",
    hasMegaMenu: false,
  },
];

export const featureHighlights = [
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Advanced AI for content creation",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate content in minutes",
  },
  {
    icon: Film,
    title: "Professional Quality",
    description: "Cinema-grade output",
  },
];
