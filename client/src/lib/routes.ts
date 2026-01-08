export const VIDEO_MODE_ROUTES: Record<string, string> = {
  narrative: "/videos/narrative/new",
  vlog: "/videos/vlog/new",
  ambient: "/videos/ambient/new",
  podcast: "/videos/podcast/new",
  commerce: "/videos/commerce/new",
  logo: "/videos/logo",
};

export const STORY_TEMPLATE_ROUTES: Record<string, string> = {
  "problem-solution": "/stories/create/problem-solution",
  "before-after": "/stories/create/before-after",
  "myth-busting": "/stories/create/myth-busting",
  "tease-reveal": "/stories/create/tease-reveal",
  "auto-asmr": "/stories/create/auto-asmr",
  "quick-tip": "/stories/new",
  "behind-scenes": "/stories/new",
  "product-showcase": "/stories/new",
  "testimonial": "/stories/new",
  "trending": "/stories/new",
  "inspirational": "/stories/new",
};

export function getHistoryItemUrl(item: { type: "video" | "story"; mode: string; id: string }): string {
  if (item.type === "story") {
    return `/stories/${item.id}`;
  }
  
  // Video routes based on mode
  const videoRoutes: Record<string, string> = {
    narrative: "/videos/narrative",
    ambient: "/videos/ambient",
    commerce: "/videos/commerce",
    vlog: "/videos/vlog",
    logo: "/videos/logo",
    podcast: "/videos/podcast",
  };
  
  const baseRoute = videoRoutes[item.mode] || "/videos";
  return `${baseRoute}/${item.id}`;
}
