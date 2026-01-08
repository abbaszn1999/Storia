// History Page Mode Display Names and Colors

export const MODE_DISPLAY_NAMES: Record<string, string> = {
  // Video Modes
  narrative: "Narrative Video",
  ambient: "Ambient Visual",
  commerce: "Social Commerce",
  vlog: "Character Vlog",
  logo: "Logo Animation", // Logo Animation is a VIDEO mode, not a story mode
  podcast: "Video Podcast",
  
  // Story Modes
  "problem-solution": "Problem Solution",
  "before-after": "Before After",
  "myth-busting": "Myth Busting",
  "tease-reveal": "Tease & Reveal",
  "asmr-sensory": "ASMR Sensory",
  "auto-asmr": "Auto ASMR",
};

export const MODE_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  // Video Modes
  "logo": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  "narrative": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  "ambient": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  "commerce": { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  "vlog": { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  "podcast": { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
  
  // Story Modes
  "asmr-sensory": { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30" },
  "auto-asmr": { bg: "bg-teal-500/20", text: "text-teal-400", border: "border-teal-500/30" },
  "problem-solution": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  "before-after": { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  "myth-busting": { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
  "tease-reveal": { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
};

export function formatModeName(mode: string): string {
  return mode
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

