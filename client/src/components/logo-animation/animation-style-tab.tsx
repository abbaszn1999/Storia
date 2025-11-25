import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Sparkles,
  Eye,
  Layers,
  Zap,
  Wind,
  Box,
  Activity,
  Wand2,
  ArrowRight,
  RotateCw,
  MoveRight,
  Maximize
} from "lucide-react";

interface AnimationStyleTabProps {
  onNext: () => void;
  onPrev: () => void;
}

const ANIMATION_APPROACHES = [
  { 
    id: "reveal", 
    label: "Reveal", 
    icon: Eye,
    description: "Fade in, slide, or wipe on",
    preview: "Elegant entrance"
  },
  { 
    id: "build", 
    label: "Build", 
    icon: Layers,
    description: "Draw on or assemble pieces",
    preview: "Piece by piece"
  },
  { 
    id: "morph", 
    label: "Morph", 
    icon: Wand2,
    description: "Transform from another shape",
    preview: "Shape shifting"
  },
  { 
    id: "particle", 
    label: "Particle", 
    icon: Sparkles,
    description: "Form from or dissolve to particles",
    preview: "Magical assembly"
  },
  { 
    id: "kinetic", 
    label: "Kinetic", 
    icon: Zap,
    description: "Bouncy, energetic motion",
    preview: "High energy"
  },
  { 
    id: "elegant", 
    label: "Elegant", 
    icon: Wind,
    description: "Smooth, sophisticated easing",
    preview: "Refined motion"
  },
  { 
    id: "glitch", 
    label: "Glitch / Tech", 
    icon: Activity,
    description: "Digital, cyberpunk effects",
    preview: "Tech aesthetic"
  },
  { 
    id: "3d", 
    label: "3D", 
    icon: Box,
    description: "Depth, rotation, perspective",
    preview: "Dimensional"
  }
];

const EASING_STYLES = [
  { id: "linear", label: "Linear", description: "Constant speed" },
  { id: "ease-in-out", label: "Ease In-Out", description: "Smooth start & end" },
  { id: "bounce", label: "Bounce", description: "Playful bounce" },
  { id: "elastic", label: "Elastic", description: "Springy motion" },
  { id: "snap", label: "Snap", description: "Quick, decisive" },
  { id: "smooth", label: "Smooth", description: "Luxurious flow" }
];

const ELEMENT_SEQUENCING = [
  { id: "together", label: "All Together", icon: Maximize, description: "Elements animate simultaneously" },
  { id: "icon-first", label: "Icon First", icon: ArrowRight, description: "Symbol leads, text follows" },
  { id: "text-first", label: "Text First", icon: MoveRight, description: "Wordmark leads, icon follows" },
  { id: "staggered", label: "Staggered", icon: RotateCw, description: "Sequential cascade" }
];

export function AnimationStyleTab({ onNext, onPrev }: AnimationStyleTabProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Animation Approach */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Animation Approach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ANIMATION_APPROACHES.map((approach) => (
              <div
                key={approach.id}
                className="p-4 rounded-lg border border-border cursor-pointer hover-elevate transition-all group"
                data-testid={`button-approach-${approach.id}`}
              >
                <div className="aspect-video rounded-md bg-muted/50 mb-3 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <approach.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-medium">{approach.label}</p>
                <p className="text-xs text-muted-foreground">{approach.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motion Intensity */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Motion Intensity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Animation Energy</Label>
                <Badge variant="outline">Medium</Badge>
              </div>
              <Slider defaultValue={[50]} max={100} step={10} data-testid="slider-intensity" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtle</span>
                <span>Balanced</span>
                <span>Dynamic</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Animation Speed</Label>
                <Badge variant="outline">Normal</Badge>
              </div>
              <Slider defaultValue={[50]} max={100} step={10} data-testid="slider-speed" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Easing Style */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Wind className="h-4 w-4 text-primary" />
              Easing Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {EASING_STYLES.map((easing) => (
                <div
                  key={easing.id}
                  className="p-3 rounded-lg border border-border cursor-pointer hover-elevate transition-all"
                  data-testid={`button-easing-${easing.id}`}
                >
                  <p className="text-sm font-medium">{easing.label}</p>
                  <p className="text-xs text-muted-foreground">{easing.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Element Sequencing */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Element Sequencing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ELEMENT_SEQUENCING.map((sequence) => (
              <div
                key={sequence.id}
                className="p-4 rounded-lg border border-border cursor-pointer hover-elevate transition-all text-center"
                data-testid={`button-sequence-${sequence.id}`}
              >
                <sequence.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{sequence.label}</p>
                <p className="text-xs text-muted-foreground">{sequence.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Animation Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Animation Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gradient-to-br from-background to-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,63,255,0.1),transparent_70%)]" />
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <p className="text-lg font-semibold">Your Logo</p>
              <p className="text-sm text-muted-foreground">Animation preview will appear here</p>
            </div>

            <Button 
              variant="secondary" 
              size="sm" 
              className="absolute bottom-4 right-4"
              data-testid="button-preview-animation"
            >
              Preview Animation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} data-testid="button-back-logo">
          Back to Logo & Brand
        </Button>
        <Button onClick={onNext} size="lg" data-testid="button-continue-effects">
          Continue to Effects
        </Button>
      </div>
    </div>
  );
}
