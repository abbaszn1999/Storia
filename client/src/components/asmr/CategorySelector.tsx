// ASMR Category Selector - Horizontal Scroll with Animated Cards

import { motion } from "framer-motion";
import { 
  UtensilsCrossed, 
  Hand, 
  TreePine, 
  Palette, 
  Package,
  Sparkles,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ASMR_CATEGORIES, type ASMRCategory } from "@/constants/asmr-presets";

const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    UtensilsCrossed,
    Hand,
    TreePine,
    Palette,
    Package,
  };
  return icons[iconName] || Sparkles;
};

// Color themes for each category
const categoryThemes: Record<string, { gradient: string; glow: string; bg: string }> = {
  food: {
    gradient: "from-orange-500 to-amber-500",
    glow: "shadow-orange-500/30",
    bg: "rgba(249, 115, 22, 0.1)",
  },
  triggers: {
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/30",
    bg: "rgba(139, 92, 246, 0.1)",
  },
  nature: {
    gradient: "from-emerald-500 to-green-500",
    glow: "shadow-emerald-500/30",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  crafts: {
    gradient: "from-pink-500 to-rose-500",
    glow: "shadow-pink-500/30",
    bg: "rgba(236, 72, 153, 0.1)",
  },
  unboxing: {
    gradient: "from-sky-500 to-blue-500",
    glow: "shadow-sky-500/30",
    bg: "rgba(14, 165, 233, 0.1)",
  },
};

interface CategorySelectorProps {
  selectedCategory: ASMRCategory | null;
  onSelect: (category: ASMRCategory) => void;
}

export function CategorySelector({ selectedCategory, onSelect }: CategorySelectorProps) {
  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground/80">Choose Style</span>
      </div>

      {/* Categories Grid */}
      <div className="relative">
        <div className="flex gap-2 flex-wrap">
          {ASMR_CATEGORIES.map((category, index) => {
            const Icon = getCategoryIcon(category.icon);
            const isSelected = selectedCategory?.id === category.id;
            const theme = categoryThemes[category.id] || categoryThemes.triggers;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => onSelect(category)}
                className={cn(
                  "relative flex-1 min-w-[100px] max-w-[120px] h-[120px] group",
                  "rounded-xl overflow-hidden",
                  "transition-all duration-300 ease-out",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected && `ring-2 ring-primary shadow-lg ${theme.glow}`
                )}
              >
                {/* Card Background Image */}
                {category.imageUrl ? (
                  <>
                    <img 
                      src={category.imageUrl} 
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Overlay Gradient for Text readability */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent",
                      "transition-opacity duration-300",
                      isSelected ? "opacity-80" : "opacity-60 group-hover:opacity-70"
                    )} />
                  </>
                ) : (
                  // Fallback to gradient if no image
                  <div className={cn(
                    "absolute inset-0 rounded-xl",
                    "bg-white/[0.03] backdrop-blur-sm",
                    "border border-white/[0.06]",
                    "transition-all duration-300",
                    isSelected && "bg-white/[0.08] border-white/[0.15]",
                    !isSelected && "group-hover:bg-white/[0.06] group-hover:border-white/[0.1]"
                  )} />
                )}

                {/* Content */}
                <div className="relative h-full p-2 flex flex-col justify-end items-center z-10">
                  {/* Icon Container (Small & Floating) */}
                  <div className={cn(
                    "mb-auto mt-1 p-1.5 rounded-full backdrop-blur-md",
                    "bg-white/10 border border-white/20",
                    "transition-transform duration-300",
                    "group-hover:scale-110",
                    isSelected && "bg-primary text-white border-primary"
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Text */}
                  <div className="space-y-0 w-full">
                    <h4 className={cn(
                      "text-[11px] font-semibold truncate text-center text-white",
                      "drop-shadow-md"
                    )}>
                      {category.name.split(' ')[0]}
                    </h4>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute top-2 right-2",
                        "w-5 h-5 rounded-full",
                        "bg-primary text-white",
                        "flex items-center justify-center",
                        "shadow-lg border border-white/20"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </div>

                {/* Hover Glow Effect - only if no image or subtle overlay */}
                {!category.imageUrl && (
                  <div className={cn(
                    "absolute inset-0 rounded-xl opacity-0",
                    "bg-gradient-to-t from-white/5 to-transparent",
                    "transition-opacity duration-300",
                    "group-hover:opacity-100",
                    isSelected && "opacity-100"
                  )} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* No fade edges - show all categories */}
      </div>
    </div>
  );
}
