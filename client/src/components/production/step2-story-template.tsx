import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lightbulb, Sparkles, RefreshCw, AlertCircle, Music } from "lucide-react";

interface Step2StoryTemplateProps {
  storyTemplate: string;
  onStoryTemplateChange: (template: string) => void;
}

const storyTemplates = [
  {
    id: "problem-solution",
    name: "Problem-Solution",
    description: "Present a problem and show how your product/idea solves it.",
    type: "narrative" as const,
    icon: Lightbulb,
    iconColor: "from-amber-500 to-orange-600",
    structure: ["Hook", "Problem", "Solution", "Call-to-Action"],
    estimatedDuration: "30-60s",
    useCases: ["Product launches", "Service demos", "Pain point marketing"],
    difficulty: "beginner",
    popular: true,
    category: "marketing",
  },
  {
    id: "tease-reveal",
    name: "Tease & Reveal",
    description: "Build curiosity with a teaser, then reveal the answer or product.",
    type: "narrative" as const,
    icon: Sparkles,
    iconColor: "from-violet-500 to-fuchsia-500",
    structure: ["Hook", "Tease", "Buildup", "Reveal"],
    estimatedDuration: "15-45s",
    useCases: ["Product reveals", "Announcements", "Mystery content"],
    difficulty: "intermediate",
    popular: true,
    category: "marketing",
  },
  {
    id: "before-after",
    name: "Before & After",
    description: "Showcase a transformation. Great for tutorials or testimonials.",
    type: "narrative" as const,
    icon: RefreshCw,
    iconColor: "from-blue-500 to-cyan-500",
    structure: ["Before State", "Transformation", "After State", "Results"],
    estimatedDuration: "30-90s",
    useCases: ["Testimonials", "Tutorials", "Case studies"],
    difficulty: "beginner",
    category: "educational",
  },
  {
    id: "myth-busting",
    name: "Myth-Busting",
    description: "Address a common misconception and reveal the truth.",
    type: "narrative" as const,
    icon: AlertCircle,
    iconColor: "from-rose-500 to-orange-500",
    structure: ["Common Myth", "Why It's Wrong", "The Truth", "Takeaway"],
    estimatedDuration: "30-60s",
    useCases: ["Educational content", "Industry insights", "Thought leadership"],
    difficulty: "intermediate",
    category: "educational",
  },
  {
    id: "asmr-sensory",
    name: "ASMR / Sensory",
    description: "Focus on satisfying sounds and visuals. No complex script needed.",
    type: "direct" as const,
    icon: Music,
    iconColor: "from-emerald-500 to-teal-500",
    estimatedDuration: "15-60s",
    useCases: ["Product showcases", "Relaxation content", "Visual appeal"],
    difficulty: "beginner",
    category: "entertainment",
  },
  {
    id: "auto-asmr",
    name: "Auto-ASMR",
    description: "AI-powered relaxing, meditative stories with satisfying visuals and sounds.",
    type: "narrative" as const,
    icon: Music,
    iconColor: "from-emerald-500 to-teal-500",
    structure: ["Peaceful Opening", "Sensory Journey", "Calm Closing"],
    estimatedDuration: "15-60s",
    useCases: ["Relaxation content", "Meditation videos", "Satisfying visuals", "Sleep content"],
    difficulty: "beginner",
    category: "entertainment",
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "intermediate":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "advanced":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function Step2StoryTemplate({ storyTemplate, onStoryTemplateChange }: Step2StoryTemplateProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Choose Story Template</h2>
        <p className="text-muted-foreground mt-2">
          Select a proven structure to guide your video creation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storyTemplates.map((template) => {
          const isSelected = storyTemplate === template.id;
          const TemplateIcon = template.icon;

          return (
            <Card
              key={template.id}
              className={`relative cursor-pointer transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => onStoryTemplateChange(template.id)}
              data-testid={`card-story-template-${template.id}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${template.iconColor}`}>
                    <TemplateIcon className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.popular && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {template.estimatedDuration}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.category}
                      </Badge>
                    </div>

                    {template.structure && (
                      <div className="flex flex-wrap gap-1">
                        {template.structure.map((step, index) => (
                          <span key={step} className="text-xs text-muted-foreground">
                            {step}{index < template.structure!.length - 1 && " →"}
                          </span>
                        ))}
                      </div>
                    )}

                    {template.type === "direct" && (
                      <p className="text-xs text-muted-foreground italic">
                        Prompt-based generation • No script required
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {storyTemplate && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm">
            <span className="font-medium">Selected: </span>
            {storyTemplates.find(t => t.id === storyTemplate)?.name}
            {storyTemplates.find(t => t.id === storyTemplate)?.type === "direct" && (
              <span className="text-muted-foreground ml-2">• Single-page prompt workflow</span>
            )}
            {storyTemplates.find(t => t.id === storyTemplate)?.type === "narrative" && (
              <span className="text-muted-foreground ml-2">• Multi-step script workflow</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export { storyTemplates };
