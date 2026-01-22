import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lightbulb, Star, RefreshCw, AlertCircle, Volume2, Headphones, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { TemplateStructure } from "../../types";

const iconMap: Record<string, any> = {
  Lightbulb,
  Star,
  RefreshCw,
  AlertCircle,
  Volume2,
  Headphones,
};

const colorGradients: Record<string, { from: string; to: string; glow: string }> = {
  orange: { from: 'from-orange-500/20', to: 'to-amber-500/20', glow: 'orange-500' },
  purple: { from: 'from-purple-500/20', to: 'to-pink-500/20', glow: 'purple-500' },
  blue: { from: 'from-blue-500/20', to: 'to-cyan-500/20', glow: 'blue-500' },
  red: { from: 'from-red-500/20', to: 'to-rose-500/20', glow: 'red-500' },
  green: { from: 'from-green-500/20', to: 'to-emerald-500/20', glow: 'green-500' },
  teal: { from: 'from-teal-500/20', to: 'to-cyan-500/20', glow: 'teal-500' },
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface TemplateCardProps {
  template: TemplateStructure;
  selected: boolean;
  onClick: () => void;
}

export function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[template.icon];
  const gradient = colorGradients[template.color];
  const difficultyColor = difficultyColors[template.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={template.available ? { 
        y: -8,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      } : {}}
      onHoverStart={() => template.available && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={`relative cursor-pointer transition-all h-full overflow-hidden group ${
          selected
            ? 'border-primary ring-2 ring-primary/30 shadow-2xl shadow-primary/20'
            : template.available
            ? 'hover:border-primary/50 hover:shadow-xl border-border/50'
            : 'opacity-60 cursor-not-allowed border-border/30'
        }`}
        onClick={() => template.available && onClick()}
      >
        {/* Animated Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        {/* Animated Border Gradient for Selected */}
        {selected && (
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

        {/* Popular Badge */}
        {(template.id === 'problem-solution' || template.id === 'tease-reveal') && template.available && !selected && (
          <motion.div
            className="absolute top-4 right-4 z-20"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Badge className="text-xs font-semibold bg-primary/20 border-primary/30 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          </motion.div>
        )}

        {/* Selected Checkmark */}
        {selected && (
          <motion.div
            className="absolute top-4 right-4 z-20"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-primary rounded-full blur-lg"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Check className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Coming Soon Badge */}
        {!template.available && (
          <motion.div
            className="absolute top-4 right-4 z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge variant="outline" className="text-xs font-semibold backdrop-blur-sm">
              Coming Soon
            </Badge>
          </motion.div>
        )}

        <CardContent className="p-6 relative z-10">
          <div className="space-y-5">
            {/* Enhanced Icon Container */}
            <motion.div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient.from} ${gradient.to} ${
                selected ? 'shadow-2xl' : 'shadow-lg'
              }`}
              animate={isHovered || selected ? {
                scale: [1, 1.05, 1],
                rotate: [0, 3, -3, 0],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Glow ring */}
              {(isHovered || selected) && (
                <motion.div
                  className={`absolute inset-0 bg-${gradient.glow} rounded-2xl blur-xl opacity-40`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              <Icon className={`h-7 w-7 relative z-10 text-${gradient.glow.split('-')[0]}-500`} />
            </motion.div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className={`text-xl font-bold transition-all duration-300 ${
                selected ? `bg-clip-text text-transparent bg-gradient-to-r ${gradient.from.replace('/20', '')} ${gradient.to.replace('/20', '')}` : ''
              }`}>
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed min-h-[2.5rem]">
                {template.description}
              </p>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge variant="outline" className="text-xs font-medium bg-muted/50 border-border/50">
                  {template.duration}
                </Badge>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Badge className={`text-xs font-medium ${difficultyColor}`}>
                  {template.difficulty}
                </Badge>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="outline" className="text-xs font-medium bg-muted/50 border-border/50">
                  {template.category}
                </Badge>
              </motion.div>
            </div>

            {/* Structure Flow */}
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Structure
                </span>
              </div>
              <div className="text-sm font-medium leading-relaxed">
                {template.structure}
              </div>
            </div>

            {/* Hover Glow Effect */}
            {(isHovered || selected) && (
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
}
