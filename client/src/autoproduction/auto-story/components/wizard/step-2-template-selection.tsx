import { TemplateCard } from "../templates/template-card";
import { STORY_TEMPLATES } from "../../types";
import type { StoryTemplate } from "../../types";

interface Step2TemplateSelectionProps {
  value: StoryTemplate;
  onChange: (value: StoryTemplate) => void;
}

export function Step2TemplateSelection({ value, onChange }: Step2TemplateSelectionProps) {
  // Show all 5 templates (4 narrative + auto-asmr)
  const allTemplates = STORY_TEMPLATES;

  return (
    <div className="space-y-8 w-full">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-display font-bold">Select a Story Template</h2>
        <p className="text-lg text-muted-foreground">
          Choose a proven structure to guide your video creation
        </p>
      </div>

      {/* Full width grid with 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {allTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={value === template.id}
            onClick={() => template.available ? onChange(template.id) : undefined}
          />
        ))}
      </div>

      {/* Info card */}
      <div className="max-w-4xl mx-auto mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          Each template follows a proven structure optimized for engagement.
          Select the one that best fits your content goals.
        </p>
      </div>
    </div>
  );
}
