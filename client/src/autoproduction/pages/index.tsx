import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Zap, Check, ArrowLeft, ArrowRight, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Production types for Type Selection
const productionTypes = [
  {
    id: "video" as const,
    name: "Auto Video",
    description: "Automatically generate complete videos with AI-powered narratives, characters, and scenes",
    icon: Video,
    available: false,
    features: ["Narrative Videos", "Character Vlogs", "Ambient Visuals", "Multi-scene production"],
    gradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
    iconGradient: "from-blue-500 to-cyan-500",
    accentColor: "blue",
  },
  {
    id: "story" as const,
    name: "Auto Story",
    description: "Create short-form social content using proven templates for maximum engagement",
    icon: Zap,
    available: true,
    features: ["Template-driven", "15-60s videos", "Batch generation", "Social optimized"],
    gradient: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
    iconGradient: "from-purple-500 to-pink-500",
    accentColor: "purple",
  },
];

export default function AutoProductionHome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [productionType, setProductionType] = useState<"video" | "story">("story");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleContinue = () => {
    if (productionType === "story") {
      navigate("/autoproduction/story/create");
    } else if (productionType === "video") {
      toast({
        title: "Coming Soon",
        description: "Auto Video production is coming soon!",
        variant: "default",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* SVG Gradients Definition */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="icon-gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" />
            <stop offset="100%" stopColor="rgb(6, 182, 212)" />
          </linearGradient>
          <linearGradient id="icon-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(168, 85, 247)" />
            <stop offset="100%" stopColor="rgb(236, 72, 153)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-16 px-6 relative z-10">
        <div className="w-full max-w-6xl space-y-16">
          {/* Header */}
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Production</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground">
              Choose Production Mode
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select the type of automated content production you want to create
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {productionTypes.map((type, index) => {
              const isSelected = productionType === type.id;
              const isHovered = hoveredCard === type.id;
              const TypeIcon = type.icon;

              return (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  whileHover={{ y: -8 }}
                  onHoverStart={() => type.available && setHoveredCard(type.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <Card
                    className={`relative overflow-hidden cursor-pointer transition-all duration-500 h-full group ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30 shadow-2xl shadow-primary/20"
                        : type.available
                        ? "hover:border-primary/50 hover:shadow-xl border-border/50"
                        : "opacity-70 cursor-not-allowed border-border/30"
                    }`}
                    onClick={() => type.available && setProductionType(type.id)}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Animated Border Gradient */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 opacity-20"
                        animate={{
                          background: [
                            "linear-gradient(0deg, transparent, var(--primary))",
                            "linear-gradient(180deg, transparent, var(--primary))",
                            "linear-gradient(360deg, transparent, var(--primary))",
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <motion.div
                        className="absolute top-6 right-6 z-20"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <div className="relative">
                          <motion.div
                            className="absolute inset-0 bg-primary rounded-full blur-lg"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <div className="relative h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <Check className="h-6 w-6 text-primary-foreground" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Coming Soon Badge */}
                    {!type.available && (
                      <motion.div
                        className="absolute top-6 right-6 z-20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Badge variant="secondary" className="text-xs font-semibold shadow-lg">
                          Coming Soon
                        </Badge>
                      </motion.div>
                    )}
                    
                    <CardContent className="p-8 relative z-10">
                      <div className="flex flex-col items-center text-center space-y-8">
                        {/* Icon Container */}
                        <motion.div
                          className={`relative p-6 rounded-3xl transition-all duration-500 ${
                            isSelected 
                              ? "bg-primary/20 shadow-2xl shadow-primary/30" 
                              : "bg-muted/50 group-hover:bg-muted"
                          }`}
                          animate={isHovered || isSelected ? {
                            scale: [1, 1.05, 1],
                            rotate: [0, 5, -5, 0],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {/* Glow effect */}
                          {(isSelected || isHovered) && (
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-r ${type.iconGradient} rounded-3xl blur-2xl opacity-30`}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          
                          <TypeIcon 
                            className={`h-16 w-16 relative z-10 transition-all duration-500 ${
                              isSelected 
                                ? "" 
                                : "text-muted-foreground group-hover:text-foreground"
                            }`} 
                            style={isSelected ? {
                              stroke: `url(#icon-gradient-${type.accentColor})`,
                              fill: `url(#icon-gradient-${type.accentColor})`,
                              filter: 'drop-shadow(0 0 12px currentColor)',
                            } : {}} 
                          />
                        </motion.div>
                        
                        {/* Content */}
                        <div className="w-full space-y-4">
                          <div className="space-y-2">
                            <h3 className={`text-3xl font-bold transition-all duration-300 ${
                              isSelected ? `bg-clip-text text-transparent bg-gradient-to-r ${type.iconGradient}` : ""
                            }`}>
                              {type.name}
                            </h3>
                            <p className="text-base text-muted-foreground leading-relaxed">
                              {type.description}
                            </p>
                          </div>
                          
                          {/* Features */}
                          <div className="flex flex-wrap gap-2 justify-center pt-2">
                            {type.features.map((feature, idx) => (
                              <motion.div
                                key={feature}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 + idx * 0.05 + 0.5 }}
                              >
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs font-normal transition-all duration-300 ${
                                    isSelected 
                                      ? "border-primary/50 bg-primary/10 text-primary" 
                                      : "border-border/50 hover:border-primary/30"
                                  }`}
                                >
                                  <Star className="h-3 w-3 mr-1 inline" />
                                  {feature}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Decorative elements */}
                        {isSelected && (
                          <>
                            <motion.div
                              className="absolute top-4 left-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                            <motion.div
                              className="absolute bottom-4 right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"
                              animate={{
                                scale: [1.5, 1, 1.5],
                                opacity: [0.6, 0.3, 0.6],
                              }}
                              transition={{ duration: 4, repeat: Infinity }}
                            />
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Info Text */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Auto Production allows you to create content at scale with AI automation
              <Sparkles className="h-4 w-4" />
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer Navigation */}
      <motion.div
        className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/autoproduction/campaigns")}
              className="group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Cancel
            </Button>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleContinue}
                disabled={!productionType}
                size="lg"
                className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
