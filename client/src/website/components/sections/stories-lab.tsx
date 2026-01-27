import { useState, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import BlurText from "../ui/blur-text";
import { 
  Lightbulb,
  FileText,
  LayoutGrid,
  ImageIcon,
  Film,
  Mic,
  Music,
  Play,
  Share2,
  ArrowRight,
  Sparkles,
  Wand2,
  Settings
} from "lucide-react";

// Stage definition - each stage contains two sub-items
interface StageItem {
  icon: React.ElementType;
  title: string;
  description: string;
  details?: string[];
}

interface Stage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  items: [StageItem, StageItem];
  initialX: number;
  initialY: number;
}

const stages: Stage[] = [
  {
    id: "ideation",
    number: 1,
    title: "Ideation",
    subtitle: "Concept & Setup",
    color: "#8B5CF6",
    gradientFrom: "#8B5CF6",
    gradientTo: "#A78BFA",
    items: [
      {
        icon: Lightbulb,
        title: "Your Idea",
        description: "Start with your creative concept",
        details: ["Story prompt", "Theme selection", "Target audience"]
      },
      {
        icon: Settings,
        title: "Story Settings",
        description: "Configure generation parameters",
        details: ["Genre: Sci-Fi", "Duration: 2-3 min", "Style: Cinematic"]
      }
    ],
    initialX: 60,
    initialY: 80,
  },
  {
    id: "breakdown",
    number: 2,
    title: "Story & Scenes",
    subtitle: "AI Generation",
    color: "#EC4899",
    gradientFrom: "#EC4899",
    gradientTo: "#F472B6",
    items: [
      {
        icon: FileText,
        title: "Generated Story",
        description: "AI creates your narrative",
        details: ["Plot structure", "Character arcs", "Dialogue"]
      },
      {
        icon: LayoutGrid,
        title: "Scene Breakdown",
        description: "Automatic scene segmentation",
        details: ["Scene 1: Opening", "Scene 2: Rising", "Scene 3: Climax"]
      }
    ],
    initialX: 340,
    initialY: 160,
  },
  {
    id: "production",
    number: 3,
    title: "Visual Production",
    subtitle: "Media Generation",
    color: "#F59E0B",
    gradientFrom: "#F59E0B",
    gradientTo: "#FBBF24",
    items: [
      {
        icon: ImageIcon,
        title: "Image Generation",
        description: "AI-powered visuals",
        details: ["Model: SDXL Pro", "Quality: 4K", "Style: Photorealistic"]
      },
      {
        icon: Film,
        title: "Video Animation",
        description: "Bring images to life",
        details: ["Model: Kling 2.1", "FPS: 24", "Motion: Smooth"]
      }
    ],
    initialX: 620,
    initialY: 80,
  },
  {
    id: "audio",
    number: 4,
    title: "Audio Production",
    subtitle: "Sound Design",
    color: "#06B6D4",
    gradientFrom: "#06B6D4",
    gradientTo: "#22D3EE",
    items: [
      {
        icon: Mic,
        title: "Voice Over",
        description: "AI narration & dialogue",
        details: ["Voice: Emma (US)", "Style: Narrative", "Emotion: Dynamic"]
      },
      {
        icon: Music,
        title: "Background Music",
        description: "AI-composed soundtrack",
        details: ["Genre: Cinematic", "Mood: Emotional", "Duration: Auto"]
      }
    ],
    initialX: 900,
    initialY: 160,
  },
  {
    id: "export",
    number: 5,
    title: "Export & Publish",
    subtitle: "Final Output",
    color: "#10B981",
    gradientFrom: "#10B981",
    gradientTo: "#34D399",
    items: [
      {
        icon: Play,
        title: "Final Render",
        description: "High-quality export",
        details: ["Resolution: 4K", "Format: MP4", "Quality: Maximum"]
      },
      {
        icon: Share2,
        title: "Publish & Share",
        description: "Multi-platform distribution",
        details: ["YouTube", "TikTok", "Instagram"]
      }
    ],
    initialX: 1180,
    initialY: 80,
  },
];

const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 520;
const CARD_WIDTH = 260;
const CARD_HEIGHT = 320;
const PADDING = 40;

export function StoriesLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const initial: Record<string, { x: number; y: number }> = {};
    stages.forEach(stage => {
      initial[stage.id] = { x: stage.initialX, y: stage.initialY };
    });
    return initial;
  });

  // Calculate connection path between all stages - passes BELOW the cards
  const getMainConnectionPath = useCallback(() => {
    const points: { x: number; y: number; color: string }[] = [];
    
    stages.forEach((stage, index) => {
      const pos = positions[stage.id];
      // Connection point is at the BOTTOM CENTER of each card
      const x = pos.x + CARD_WIDTH / 2;
      const y = pos.y + CARD_HEIGHT + 30; // 30px below the card
      points.push({ x, y, color: stage.color });
    });

    if (points.length < 2) return "";

    // Create smooth bezier curve through all points
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Control points for smooth curve
      const cpX1 = current.x + (next.x - current.x) * 0.4;
      const cpX2 = current.x + (next.x - current.x) * 0.6;
      
      path += ` C ${cpX1} ${current.y}, ${cpX2} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  }, [positions]);

  // Get gradient stops for the main connection line
  const getGradientStops = () => {
    return stages.map((stage, index) => ({
      offset: `${(index / (stages.length - 1)) * 100}%`,
      color: stage.color
    }));
  };

  // Handle drag
  const handleDrag = (stageId: string, e: any, info: any) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;
    
    const currentPos = positions[stageId];
    let newX = currentPos.x + info.delta.x;
    let newY = currentPos.y + info.delta.y;
    
    // Clamp to boundaries
    newX = Math.max(PADDING, Math.min(CANVAS_WIDTH - CARD_WIDTH - PADDING, newX));
    newY = Math.max(PADDING, Math.min(CANVAS_HEIGHT - CARD_HEIGHT - PADDING, newY));
    
    setPositions(prev => ({
      ...prev,
      [stageId]: { x: newX, y: newY }
    }));
  };

  const handleDragEnd = (stageId: string) => {
    setActiveStage(null);
  };

  return (
    <section ref={containerRef} className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-6"
          >
            <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
            <span className="text-xs sm:text-sm text-white/70">Interactive Workflow</span>
          </motion.div>
          
          <BlurText
            text="Stories Lab"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 font-heading"
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-sm sm:text-base md:text-lg text-white/50 max-w-3xl mx-auto px-2"
          >
            From idea to viral video in 5 simple stages. Drag the cards to explore our AI-powered creative workflow.
          </motion.p>
        </div>

        {/* Stage Progress Indicators - Horizontal scrollable on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-start md:justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-10 overflow-x-auto scrollbar-hide pb-2 px-1 -mx-4 sm:mx-0 sm:px-0"
        >
          {stages.map((stage, index) => (
            <motion.button
              key={stage.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              onClick={() => {
                // Scroll to card or highlight
                setActiveStage(stage.id);
                setTimeout(() => setActiveStage(null), 2000);
              }}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all duration-300 flex-shrink-0",
                activeStage === stage.id 
                  ? "border-white/30 bg-white/10" 
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <div 
                className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-sm font-bold text-white shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                  boxShadow: `0 0 20px ${stage.color}40`
                }}
              >
                {stage.number}
              </div>
              <span className="text-white/70 text-xs sm:text-sm font-medium whitespace-nowrap">{stage.title}</span>
              {index < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/20 ml-0.5 sm:ml-1 hidden sm:block" />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Mobile Cards - Vertical Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="md:hidden space-y-4"
        >
          {stages.map((stage, index) => {
            const isActive = activeStage === stage.id;
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="relative rounded-xl border border-white/10 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${stage.gradientFrom}15, ${stage.gradientTo}05)`,
                }}
                onClick={() => {
                  setActiveStage(stage.id);
                  setTimeout(() => setActiveStage(null), 2000);
                }}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                          boxShadow: `0 4px 15px ${stage.color}50`
                        }}
                      >
                        {(() => {
                          const HeaderIcon = stage.items[0].icon;
                          return <HeaderIcon className="w-4 h-4 text-white" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{stage.title}</h3>
                        <p className="text-white/40 text-xs">{stage.subtitle}</p>
                      </div>
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ 
                        background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                      }}
                    >
                      {stage.number}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {stage.items.map((item, itemIndex) => {
                      const ItemIcon = item.icon;
                      return (
                        <div
                          key={itemIndex}
                          className="rounded-lg p-3"
                          style={{ 
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${stage.color}20` }}
                            >
                              <ItemIcon className="w-3.5 h-3.5" style={{ color: stage.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-xs font-medium mb-0.5">{item.title}</h4>
                              <p className="text-white/40 text-[10px] leading-relaxed">{item.description}</p>
                              {item.details && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.details.slice(0, 2).map((detail, i) => (
                                    <span 
                                      key={i}
                                      className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/50"
                                    >
                                      {detail}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Connection line indicator */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center pb-2">
                    <div 
                      className="w-0.5 h-4 rounded-full"
                      style={{ backgroundColor: stages[index + 1].color }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Interactive Canvas - Desktop Only */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative mx-auto overflow-x-auto pb-6 hidden md:block"
        >
          <div 
            ref={canvasRef}
            className="relative mx-auto rounded-3xl border border-white/10 overflow-hidden"
            style={{ 
              width: `${CANVAS_WIDTH}px`, 
              height: `${CANVAS_HEIGHT}px`,
              minWidth: `${CANVAS_WIDTH}px`,
              background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)",
            }}
          >
            {/* Grid Pattern Background */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />

            {/* SVG Connection Line - Behind cards */}
            <svg 
              className="absolute inset-0 pointer-events-none z-0"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            >
              <defs>
                {/* Main gradient for the connection line */}
                <linearGradient id="main-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  {getGradientStops().map((stop, i) => (
                    <stop key={i} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </linearGradient>

                {/* Glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* Animated dash pattern */}
                <pattern id="flow-pattern" patternUnits="userSpaceOnUse" width="20" height="1">
                  <line x1="0" y1="0" x2="10" y2="0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </pattern>
              </defs>

              {/* Background glow line */}
              <motion.path
                d={getMainConnectionPath()}
                fill="none"
                stroke="url(#main-flow-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                opacity={0.3}
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
              />

              {/* Main connection line */}
              <motion.path
                d={getMainConnectionPath()}
                fill="none"
                stroke="url(#main-flow-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={isInView ? { pathLength: 1 } : {}}
                transition={{ duration: 2, delay: 0.8, ease: "easeInOut" }}
              />

              {/* Animated flow dots - below cards */}
              {stages.map((stage, index) => {
                const pos = positions[stage.id];
                const x = pos.x + CARD_WIDTH / 2;
                const y = pos.y + CARD_HEIGHT + 30; // 30px below the card
                
                return (
                  <motion.circle
                    key={`dot-${stage.id}`}
                    cx={x}
                    cy={y}
                    r="8"
                    fill={stage.color}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1 + index * 0.2 }}
                  >
                    <animate
                      attributeName="r"
                      values="6;10;6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="1;0.5;1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </motion.circle>
                );
              })}
            </svg>

            {/* Stage Cards - Above the connection line */}
            {stages.map((stage, index) => {
              const pos = positions[stage.id];
              const isActive = activeStage === stage.id;
              
              return (
                <motion.div
                  key={stage.id}
                  className={cn(
                    "absolute rounded-2xl cursor-grab active:cursor-grabbing select-none overflow-hidden z-10",
                    isActive && "z-30"
                  )}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isActive ? 1.02 : 1, 
                    y: 0,
                  }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  dragConstraints={canvasRef}
                  onDrag={(e, info) => handleDrag(stage.id, e, info)}
                  onDragStart={() => setActiveStage(stage.id)}
                  onDragEnd={() => handleDragEnd(stage.id)}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Card Background with Gradient Border */}
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${stage.gradientFrom}30, ${stage.gradientTo}10)`,
                      border: isActive 
                        ? `2px solid ${stage.color}` 
                        : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: isActive
                        ? `0 0 40px ${stage.color}40, 0 20px 60px rgba(0,0,0,0.5)`
                        : '0 10px 40px rgba(0,0,0,0.3)',
                    }}
                  />

                  {/* Inner glow on active */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at center, ${stage.color}15, transparent 70%)`,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}

                  {/* Card Content */}
                  <div className="relative h-full flex flex-col p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                            boxShadow: `0 4px 15px ${stage.color}50`
                          }}
                        >
                          {(() => {
                            const HeaderIcon = stage.items[0].icon;
                            return <HeaderIcon className="w-5 h-5 text-white" />;
                          })()}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm">{stage.title}</h3>
                          <p className="text-white/40 text-xs">{stage.subtitle}</p>
                        </div>
                      </div>
                      <Sparkles className="w-4 h-4 text-white/20" />
                    </div>

                    {/* Divider */}
                    <div 
                      className="h-px mb-4"
                      style={{ background: `linear-gradient(90deg, transparent, ${stage.color}40, transparent)` }}
                    />

                    {/* Two Items */}
                    <div className="flex-1 flex flex-col gap-3">
                      {stage.items.map((item, itemIndex) => {
                        const ItemIcon = item.icon;
                        return (
                          <motion.div
                            key={itemIndex}
                            className="flex-1 rounded-xl p-3 transition-all duration-300 hover:bg-white/5"
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${stage.color}20` }}
                              >
                                <ItemIcon className="w-4 h-4" style={{ color: stage.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white text-xs font-medium mb-1">{item.title}</h4>
                                <p className="text-white/40 text-[10px] leading-relaxed mb-2">{item.description}</p>
                                {item.details && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.details.slice(0, 2).map((detail, i) => (
                                      <span 
                                        key={i}
                                        className="px-2 py-0.5 rounded text-[9px] bg-white/5 text-white/50"
                                      >
                                        {detail}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.5 }}
          className="text-center mt-8 sm:mt-10 md:mt-12"
        >
          <motion.button
            className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-white text-sm sm:text-base overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)'
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 15px 50px rgba(139, 92, 246, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              Start Creating Your Story
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
          
          <p className="mt-3 sm:mt-4 text-white/30 text-xs sm:text-sm">
            No credit card required • Free to start
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default StoriesLab;
