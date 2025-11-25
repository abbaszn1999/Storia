import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Zap, 
  MessageSquare,
  Play,
  Clock,
  MousePointerClick,
  TrendingUp,
  Sparkles,
  Gift,
  Eye,
  Users,
  Repeat,
  ShoppingBag
} from "lucide-react";

interface HookFormatTabProps {
  onNext: () => void;
  onPrev: () => void;
}

const HOOK_STYLES = [
  { 
    id: "problem-solution", 
    label: "Problem → Solution", 
    icon: Zap,
    example: '"Tired of tangled cords? This changes everything..."',
    description: "Start with a relatable problem"
  },
  { 
    id: "transformation", 
    label: "Before → After", 
    icon: Repeat,
    example: '"Watch this transformation..."',
    description: "Show dramatic results"
  },
  { 
    id: "social-proof", 
    label: "Social Proof", 
    icon: Users,
    example: '"Over 100K sold! Here\'s why..."',
    description: "Lead with credibility"
  },
  { 
    id: "curiosity", 
    label: "Curiosity Gap", 
    icon: Eye,
    example: '"The secret everyone\'s talking about..."',
    description: "Create intrigue"
  },
  { 
    id: "shock", 
    label: "Shock / Surprise", 
    icon: Sparkles,
    example: '"I didn\'t expect THIS to happen..."',
    description: "Unexpected reveal"
  },
  { 
    id: "unboxing", 
    label: "Unboxing / Reveal", 
    icon: Gift,
    example: '"Let me show you what\'s inside..."',
    description: "Build anticipation"
  },
  { 
    id: "trending", 
    label: "Trend-Jacking", 
    icon: TrendingUp,
    example: 'Use trending audio/format',
    description: "Ride viral trends"
  },
  { 
    id: "direct", 
    label: "Direct Pitch", 
    icon: MessageSquare,
    example: '"This is the best [product] you\'ll ever buy"',
    description: "Confident, straightforward"
  }
];

const VIDEO_FORMATS = [
  { id: "demo", label: "Product Demo", description: "Show it in action", icon: Play },
  { id: "review", label: "Review Style", description: "Authentic testimonial feel", icon: MessageSquare },
  { id: "comparison", label: "Comparison", description: "Us vs. them split-screen", icon: Repeat },
  { id: "tutorial", label: "Tutorial / How-To", description: "Educational approach", icon: Sparkles },
  { id: "lifestyle", label: "Lifestyle", description: "Product in real life context", icon: Users },
  { id: "ugc", label: "UGC Style", description: "User-generated content feel", icon: TrendingUp },
  { id: "asmr", label: "ASMR / Satisfying", description: "Sensory-focused content", icon: Eye },
  { id: "unboxing", label: "Unboxing", description: "First impressions experience", icon: Gift }
];

const DURATION_OPTIONS = [
  { value: 15, label: "15s", description: "Ultra short, punchy" },
  { value: 30, label: "30s", description: "Quick showcase" },
  { value: 45, label: "45s", description: "Detailed demo" },
  { value: 60, label: "60s", description: "Full story" }
];

const CTA_TYPES = [
  { id: "shop-now", label: "Shop Now", icon: ShoppingBag },
  { id: "link-bio", label: "Link in Bio", icon: MousePointerClick },
  { id: "comment", label: "Comment to Order", icon: MessageSquare },
  { id: "swipe", label: "Swipe Up", icon: TrendingUp },
  { id: "tap-tag", label: "Tap Product Tag", icon: Eye },
  { id: "dm", label: "DM to Buy", icon: MessageSquare }
];

export function HookFormatTab({ onNext, onPrev }: HookFormatTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Hook Style Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Hook Style
            <Badge variant="secondary" className="ml-2 text-xs">First 1-3 seconds</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {HOOK_STYLES.map((hook) => (
              <div
                key={hook.id}
                className="p-4 rounded-lg border border-border cursor-pointer hover-elevate transition-all group"
                data-testid={`button-hook-${hook.id}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <hook.icon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">{hook.label}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{hook.description}</p>
                <p className="text-xs italic text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                  {hook.example}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Format */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              Video Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {VIDEO_FORMATS.map((format) => (
                <div
                  key={format.id}
                  className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                  data-testid={`button-format-${format.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <format.icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">{format.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Duration & CTA */}
        <div className="space-y-6">
          {/* Duration */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Target Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {DURATION_OPTIONS.map((duration) => (
                  <div
                    key={duration.value}
                    className="flex-1 p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all text-center"
                    data-testid={`button-duration-${duration.value}`}
                  >
                    <p className="text-lg font-semibold">{duration.label}</p>
                    <p className="text-xs text-muted-foreground">{duration.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                Call to Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {CTA_TYPES.map((cta) => (
                  <div
                    key={cta.id}
                    className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all text-center"
                    data-testid={`button-cta-${cta.id}`}
                  >
                    <cta.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-medium">{cta.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pacing Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Pacing Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex">
                <div className="w-[15%] bg-primary/80 flex items-center justify-center text-xs font-medium text-primary-foreground">
                  Hook
                </div>
                <div className="w-[50%] bg-primary/50 flex items-center justify-center text-xs font-medium">
                  Features
                </div>
                <div className="w-[20%] bg-primary/30 flex items-center justify-center text-xs font-medium">
                  Demo
                </div>
                <div className="w-[15%] bg-primary/60 flex items-center justify-center text-xs font-medium text-primary-foreground">
                  CTA
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0s</span>
              <span>Hook grabs attention</span>
              <span>Features build desire</span>
              <span>CTA drives action</span>
              <span>30s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-product">
          Back to Product Setup
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-scene">
          Continue to Scene Builder
        </Button>
      </div>
    </div>
  );
}
