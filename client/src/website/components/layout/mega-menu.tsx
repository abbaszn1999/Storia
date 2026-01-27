import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { features, featureHighlights } from "@/website/constants/navigation";
import { ArrowRight, ChevronRight, Sparkles, Zap, Play } from "lucide-react";
import { useState } from "react";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Spectacular container animation
const containerVariants = {
  hidden: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    rotateX: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.97,
    rotateX: -5,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    }
  },
};

const glowVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, delay: 0.2 }
  },
};

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <motion.div
      className="absolute top-full left-0 w-full pt-4 perspective-1000"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ perspective: "1000px" }}
    >
      <div className="container mx-auto px-4">
        <motion.div 
          className={cn(
            "relative backdrop-blur-2xl rounded-3xl border border-white/10",
            "shadow-[0_25px_80px_-15px_rgba(139,92,246,0.3),0_15px_40px_-10px_rgba(0,0,0,0.5)]",
            "overflow-hidden"
          )}
          style={{ 
            backgroundColor: "rgba(10, 10, 15, 0.97)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Animated Background Gradients */}
          <motion.div 
            className="absolute inset-0 pointer-events-none overflow-hidden"
            variants={glowVariants}
          >
            {/* Main glow */}
            <motion.div 
              className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px]"
              animate={{ 
                x: [0, 30, 0],
                y: [0, 20, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-500/15 rounded-full blur-[100px]"
              animate={{ 
                x: [0, -20, 0],
                y: [0, -30, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-cyan-500/10 rounded-full blur-[80px]"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </motion.div>

          {/* Animated border glow */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(236,72,153,0.3), transparent)",
              backgroundSize: "200% 100%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "200% 0%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className="absolute inset-[1px] rounded-3xl" style={{ backgroundColor: "rgba(10, 10, 15, 0.97)" }} />

          <div className="relative grid lg:grid-cols-[1fr_320px] gap-0">
            {/* Features Grid */}
            <div className="p-8">
              {/* Section Title */}
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-3 mb-6"
              >
                <motion.div 
                  className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </motion.div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Powerful Features
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
              </motion.div>

              <motion.div 
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
              >
                {features.map((feature, index) => (
                  <FeatureCard 
                    key={feature.id} 
                    feature={feature} 
                    index={index}
                    onClose={onClose}
                    isHovered={hoveredFeature === feature.id}
                    onHover={() => setHoveredFeature(feature.id)}
                    onLeave={() => setHoveredFeature(null)}
                  />
                ))}
              </motion.div>
            </div>

            {/* Sidebar - Highlights */}
            <div className="relative p-8 border-l border-white/10">
              {/* Sidebar background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
              
              <div className="relative">
                <motion.div variants={itemVariants} className="flex items-center gap-2 mb-6">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Why Storia?
                  </h4>
                </motion.div>
                
                <div className="space-y-4">
                  {featureHighlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className="relative flex items-start gap-4 group p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                      whileHover={{ x: 5 }}
                    >
                      {/* Animated icon container */}
                      <motion.div 
                        className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden"
                        whileHover={{ scale: 1.1 }}
                      >
                        {/* Icon glow */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-primary/40 to-pink-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                        <highlight.icon className="h-5 w-5 text-primary relative z-10 group-hover:text-white transition-colors" />
                      </motion.div>
                      
                      <div>
                        <h5 className="text-sm font-semibold text-white mb-1 group-hover:text-primary transition-colors">
                          {highlight.title}
                        </h5>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {highlight.description}
                        </p>
                      </div>

                      {/* Hover indicator */}
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-primary to-pink-500 rounded-full group-hover:h-8 transition-all duration-300"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Epic CTA Button */}
                <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/10">
                  <Link href="/features">
                    <motion.div
                      className="relative overflow-hidden p-4 rounded-2xl cursor-pointer group"
                      style={{
                        background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 100%)",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center"
                            animate={{ 
                              boxShadow: [
                                "0 0 20px rgba(139,92,246,0.3)",
                                "0 0 30px rgba(139,92,246,0.5)",
                                "0 0 20px rgba(139,92,246,0.3)",
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Play className="h-5 w-5 text-white fill-white" />
                          </motion.div>
                          <div>
                            <span className="text-sm font-bold text-white block">
                              Explore all features
                            </span>
                            <span className="text-xs text-white/50">
                              Discover the magic
                            </span>
                          </div>
                        </div>
                        <motion.div
                          className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
                          whileHover={{ x: 5 }}
                        >
                          <ArrowRight className="h-4 w-4 text-white" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
  onClose: () => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function FeatureCard({ feature, index, onClose, isHovered, onHover, onLeave }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <motion.div 
      variants={itemVariants}
      custom={index}
    >
      <Link href={feature.href} onClick={onClose}>
        <motion.div
          className={cn(
            "relative p-5 rounded-2xl cursor-pointer group overflow-hidden",
            "bg-gradient-to-br from-white/[0.05] to-transparent",
            "border border-white/5 hover:border-white/20",
            "transition-all duration-500"
          )}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          whileHover={{ 
            scale: 1.03, 
            y: -5,
            transition: { type: "spring", stiffness: 400, damping: 20 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Hover glow effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${feature.glowColor || 'rgba(139,92,246,0.15)'} 0%, transparent 70%)`,
            }}
          />

          {/* Animated border on hover */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${feature.borderColor || 'rgba(139,92,246,0.3)'} 0%, transparent 50%, ${feature.borderColor || 'rgba(236,72,153,0.3)'} 100%)`,
              padding: "1px",
            }}
          >
            <div className="w-full h-full rounded-2xl bg-[rgba(10,10,15,0.97)]" />
          </motion.div>

          {/* Badge */}
          <AnimatePresence>
            {feature.badge && (
              <motion.span 
                className={cn(
                  "absolute top-4 right-4 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                  feature.badge === "New" && "bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-400 border border-green-500/30",
                  feature.badge === "Popular" && "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-400 border border-blue-500/30"
                )}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 + index * 0.05 }}
              >
                {feature.badge}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Icon with glow */}
          <motion.div 
            className={cn(
              "relative h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 overflow-hidden",
              feature.color
            )}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            {/* Icon inner glow */}
            <motion.div
              className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <Icon className="h-6 w-6 text-white relative z-10" />
            
            {/* Sparkle effect */}
            <motion.div
              className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100"
              animate={isHovered ? { 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>

          {/* Content */}
          <div className="relative">
            <h4 className="text-base font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 group-hover:bg-clip-text transition-all duration-300">
              {feature.title}
            </h4>
            <p className="text-sm text-white/50 leading-relaxed line-clamp-2 group-hover:text-white/70 transition-colors">
              {feature.description}
            </p>
          </div>

          {/* Hover Arrow */}
          <motion.div 
            className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
          >
            <motion.div
              className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(139,92,246,0.3)" }}
            >
              <ChevronRight className="h-4 w-4 text-primary" />
            </motion.div>
          </motion.div>

          {/* Bottom gradient line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        </motion.div>
      </Link>
    </motion.div>
  );
}
