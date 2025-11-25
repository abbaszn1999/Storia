import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Lightbulb, 
  RefreshCw, 
  AlertCircle, 
  Music, 
  ArrowLeft, 
  Search, 
  Clock, 
  TrendingUp,
  Star,
  ArrowRight,
  Filter,
  Zap,
  GraduationCap,
  PartyPopper,
  ShoppingBag
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

export default function Stories() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'problem-solution':
        return Lightbulb;
      case 'tease-reveal':
        return Sparkles;
      case 'before-after':
        return RefreshCw;
      case 'myth-busting':
        return AlertCircle;
      case 'asmr-sensory':
        return Music;
      default:
        return Sparkles;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'intermediate':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'advanced':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
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

  const popularTemplates = STORY_TEMPLATES.filter(t => t.popular);

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top Row: Back Button & Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation('/')}
                data-testid="button-back-stories"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Story Templates</h1>
                <p className="text-sm text-muted-foreground">
                  Choose a proven framework to create engaging short-form videos
                </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-templates"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className="gap-2"
                  data-testid={`button-category-${category.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Featured Section - Only show when viewing all or marketing */}
        {(activeCategory === 'all' || activeCategory === 'marketing') && !searchQuery && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Popular Templates</h2>
              <Badge variant="secondary" className="text-xs">Recommended</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {popularTemplates.map((template) => {
                const Icon = getTemplateIcon(template.id);
                
                return (
                  <Link href={`/stories/create/${template.id}`} key={template.id} data-testid={`link-featured-${template.id}`}>
                    <Card 
                      className="group relative overflow-hidden hover-elevate cursor-pointer border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
                      data-testid={`card-featured-${template.id}`}
                    >
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary/90 text-primary-foreground gap-1">
                          <Star className="h-3 w-3" />
                          Popular
                        </Badge>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${template.iconColor} flex items-center justify-center shadow-lg`}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                              {template.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {template.description}
                            </p>
                            
                            {/* Metadata Row */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {template.estimatedDuration}
                              </span>
                              <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                                {template.difficulty}
                              </Badge>
                            </div>

                            {/* Structure Flow */}
                            {template.structure && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {template.structure.map((step, index) => (
                                  <div key={index} className="flex items-center">
                                    <span className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground font-medium">
                                      {step}
                                    </span>
                                    {index < template.structure!.length - 1 && (
                                      <ArrowRight className="h-3 w-3 text-muted-foreground/50 mx-1" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All Templates Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {activeCategory === 'all' ? 'All Templates' : `${CATEGORIES.find(c => c.id === activeCategory)?.label} Templates`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search or filter to find what you're looking for
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const Icon = getTemplateIcon(template.id);
                
                return (
                  <Link href={`/stories/create/${template.id}`} key={template.id} data-testid={`link-template-${template.id}`}>
                    <Card 
                      className="group h-full flex flex-col overflow-hidden hover-elevate cursor-pointer transition-all duration-200"
                      data-testid={`card-template-${template.id}`}
                    >
                      {/* Gradient Header */}
                      <div className={`h-24 bg-gradient-to-br ${template.iconColor} relative flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                        <div className="relative z-10 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        
                        {/* Popular Badge */}
                        {template.popular && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-0 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                            {template.name}
                          </h3>
                          <Badge variant="outline" className={`shrink-0 text-xs ${getDifficultyColor(template.difficulty)}`}>
                            {template.difficulty}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 flex-1">
                          {template.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{template.estimatedDuration}</span>
                        </div>

                        {/* Structure Flow */}
                        {template.structure && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                              {template.structure.map((step, index) => (
                                <div key={index} className="flex items-center shrink-0">
                                  <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                                      {index + 1}
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {step}
                                    </span>
                                  </div>
                                  {index < template.structure!.length - 1 && (
                                    <div className="w-4 h-px bg-border mx-1" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Use Cases */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {template.useCases.slice(0, 2).map((useCase, index) => (
                            <span key={index} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                              {useCase}
                            </span>
                          ))}
                          {template.useCases.length > 2 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                              +{template.useCases.length - 2} more
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <Button 
                          className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                          variant="outline"
                          data-testid={`button-select-${template.id}`}
                        >
                          Use Template
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
