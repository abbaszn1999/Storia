// Story Templates - Premium Immersive Design
// Matches the Story Studio aesthetic with glassmorphism and ambient effects
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Lightbulb, 
  RefreshCw, 
  AlertCircle, 
  Music, 
  ArrowLeft, 
  Search, 
  Clock, 
  Star,
  ArrowRight,
  Filter,
  Zap,
  GraduationCap,
  PartyPopper,
  ShoppingBag,
  Play
} from "lucide-react";
import { STORY_TEMPLATES, type StoryTemplate } from "@/constants/story-templates";

type CategoryFilter = 'all' | 'marketing' | 'educational' | 'entertainment' | 'product';

const CATEGORIES: { id: CategoryFilter; label: string; icon: typeof Zap }[] = [
  { id: 'all', label: 'All Templates', icon: Filter },
  { id: 'marketing', label: 'Marketing', icon: Zap },
  { id: 'educational', label: 'Educational', icon: GraduationCap },
  { id: 'entertainment', label: 'Entertainment', icon: PartyPopper },
  { id: 'product', label: 'Product', icon: ShoppingBag },
];

// Template accent colors for icons only
const TEMPLATE_ACCENTS: Record<string, { iconColor: string; glow: string; solid: string }> = {
  'problem-solution': { 
    iconColor: 'text-amber-500', 
    glow: 'shadow-amber-500/20',
    solid: 'bg-amber-500'
  },
  'tease-reveal': { 
    iconColor: 'text-violet-500', 
    glow: 'shadow-violet-500/20',
    solid: 'bg-violet-500'
  },
  'before-after': { 
    iconColor: 'text-blue-500', 
    glow: 'shadow-blue-500/20',
    solid: 'bg-blue-500'
  },
  'myth-busting': { 
    iconColor: 'text-rose-500', 
    glow: 'shadow-rose-500/20',
    solid: 'bg-rose-500'
  },
  'auto-asmr': { 
    iconColor: 'text-emerald-500', 
    glow: 'shadow-emerald-500/20',
    solid: 'bg-emerald-500'
  },
  'asmr-sensory': { 
    iconColor: 'text-emerald-500', 
    glow: 'shadow-emerald-500/20',
    solid: 'bg-emerald-500'
  },
};

export default function Stories() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'problem-solution': return Lightbulb;
      case 'tease-reveal': return Sparkles;
      case 'before-after': return RefreshCw;
      case 'myth-busting': return AlertCircle;
      case 'auto-asmr': return Music;
      case 'asmr-sensory': return Music;
      default: return Sparkles;
    }
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'intermediate':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'advanced':
        return 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTemplates = STORY_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header Section */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl"
      >
        <div className="px-4 py-5">
          {/* Category Tabs with Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl",
                      "text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-muted text-foreground hover:bg-muted/80 border-0"
                    )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid={`button-category-${category.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </motion.button>
              );
            })}
            
            {/* Search Input */}
            <motion.div 
              className="relative flex-1 min-w-[200px] max-w-[300px] ml-auto"
              whileFocus={{ scale: 1.02 }}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-11 h-10 rounded-xl",
                  "bg-background border-border",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "transition-all duration-200"
                )}
                data-testid="input-search-templates"
              />
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-violet-500" />
            <h2 className="text-xl font-semibold text-foreground">
              {activeCategory === 'all' ? 'All Templates' : `${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
            </h2>
          </div>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* Templates Grid */}
        <AnimatePresence mode="wait">
          {filteredTemplates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "p-16 rounded-2xl text-center",
                "bg-muted/50 border-0",
                "backdrop-blur-xl"
              )}
            >
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No templates found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="bg-background border-0 hover:bg-muted"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredTemplates.map((template) => {
                const Icon = getTemplateIcon(template.id);
                const accent = TEMPLATE_ACCENTS[template.id] || TEMPLATE_ACCENTS['problem-solution'];
                const isHovered = hoveredCard === template.id;
                
                return (
                  <motion.div
                    key={template.id}
                    variants={cardVariants}
                    onHoverStart={() => setHoveredCard(template.id)}
                    onHoverEnd={() => setHoveredCard(null)}
                    className="relative group"
                  >
                    {/* Hover Glow */}
                    <div className={cn(
                      "absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100",
                      "bg-primary/20 blur-sm transition-opacity duration-500"
                    )} />
                    
                    <Link 
                      href={template.id === 'asmr-sensory' ? '/stories/asmr' : `/stories/create/${template.id}?new=true`} 
                      data-testid={`link-template-${template.id}`}
                    >
                      <div 
                        className={cn(
                          "relative h-full rounded-2xl overflow-hidden cursor-pointer",
                          "bg-card backdrop-blur-xl",
                          "border-0",
                          "transition-all duration-300",
                          "group-hover:translate-y-[-4px]",
                          isHovered && "shadow-2xl shadow-primary/10"
                        )}
                        data-testid={`card-template-${template.id}`}
                      >
                        {/* Card Header with Icon */}
                        <div className={cn(
                          "relative h-32 flex items-center justify-center overflow-hidden",
                          "bg-muted/50"
                        )}>
                          {/* Floating Icon */}
                          <motion.div 
                            className={cn(
                              "relative z-10 w-16 h-16 rounded-2xl",
                              accent.solid,
                              "flex items-center justify-center",
                              "shadow-md"
                            )}
                            animate={isHovered ? { 
                              y: [-2, 2, -2],
                              rotate: [0, 2, -2, 0]
                            } : {}}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "easeInOut" 
                            }}
                          >
                            <Icon className="h-8 w-8 text-white" />
                          </motion.div>

                          {/* Popular Badge */}
                          {template.popular && (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="absolute top-3 right-3"
                            >
                              <Badge className={cn(
                                "bg-primary/20 text-primary-foreground border-0",
                                "backdrop-blur-md px-2.5 py-1"
                              )}>
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Popular
                              </Badge>
                            </motion.div>
                          )}

                        </div>

                        {/* Card Content */}
                        <div className="p-5 pt-4">
                          {/* Title + Difficulty */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-foreground transition-colors">
                              {template.name}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "shrink-0 text-[10px] uppercase tracking-wider font-semibold",
                                getDifficultyStyle(template.difficulty)
                              )}
                            >
                              {template.difficulty}
                            </Badge>
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {template.description}
                          </p>

                          {/* Duration */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{template.estimatedDuration}</span>
                          </div>

                          {/* Structure Flow */}
                          {template.structure && (
                            <div className="mb-4 overflow-hidden">
                              <div className="flex items-center gap-1">
                                {template.structure.map((step, index) => (
                                  <div key={index} className="flex items-center shrink-0">
                                    <motion.div 
                                      className="flex items-center gap-1.5"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-full text-[10px] font-bold",
                                        "flex items-center justify-center",
                                        "bg-muted text-foreground",
                                        "border border-border"
                                      )}>
                                        {index + 1}
                                      </div>
                                      <span className="text-[11px] text-muted-foreground whitespace-nowrap max-w-[60px] truncate">
                                        {step}
                                      </span>
                                    </motion.div>
                                    {index < template.structure!.length - 1 && (
                                      <div className={cn(
                                        "w-4 h-0.5 mx-1 rounded-full",
                                        "bg-border",
                                        "opacity-50"
                                      )} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Use Cases Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {template.useCases.slice(0, 2).map((useCase, index) => (
                              <span 
                                key={index} 
                                className={cn(
                                  "text-[10px] px-2 py-1 rounded-md",
                                  "bg-muted text-muted-foreground",
                                  "border-0"
                                )}
                              >
                                {useCase}
                              </span>
                            ))}
                            {template.useCases.length > 2 && (
                              <span className={cn(
                                "text-[10px] px-2 py-1 rounded-md",
                                "bg-muted text-muted-foreground"
                              )}>
                                +{template.useCases.length - 2}
                              </span>
                            )}
                          </div>

                          {/* CTA Button */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button 
                              className={cn(
                                "w-full h-11 gap-2 font-semibold rounded-xl",
                                "bg-muted hover:bg-primary",
                                "border-0",
                                "text-foreground hover:text-primary-foreground",
                                "transition-all duration-300"
                              )}
                              data-testid={`button-select-${template.id}`}
                            >
                              <Play className="h-4 w-4" />
                              Use Template
                              <ArrowRight className={cn(
                                "h-4 w-4 transition-transform duration-300",
                                "group-hover:translate-x-1"
                              )} />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
