import { Lightbulb, Camera, ShoppingCart, Heart, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const templates = [
  {
    id: "quick-tip",
    title: "Quick Tip",
    description: "Share helpful tips and tricks in seconds",
    icon: Lightbulb,
    available: true,
  },
  {
    id: "behind-scenes",
    title: "Behind the Scenes",
    description: "Show your creative process",
    icon: Camera,
    available: true,
  },
  {
    id: "product-showcase",
    title: "Product Showcase",
    description: "Highlight your products or services",
    icon: ShoppingCart,
    available: true,
  },
  {
    id: "testimonial",
    title: "Testimonial",
    description: "Share customer success stories",
    icon: Heart,
    available: false,
  },
  {
    id: "trending",
    title: "Trending Topic",
    description: "Jump on viral trends and challenges",
    icon: TrendingUp,
    available: false,
  },
  {
    id: "inspirational",
    title: "Inspirational",
    description: "Motivate and inspire your audience",
    icon: Sparkles,
    available: false,
  },
];

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all ${
            template.available
              ? "hover-elevate active-elevate-2"
              : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => template.available && onSelect(template.id)}
          data-testid={`card-template-${template.id}`}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${template.available ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <template.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{template.title}</CardTitle>
                {!template.available && (
                  <span className="text-xs text-muted-foreground">Coming soon</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{template.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
