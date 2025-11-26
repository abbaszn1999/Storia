import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Sparkles, FileText, Lightbulb, RefreshCw, AlertCircle } from "lucide-react";

interface Step3StoryTopicsProps {
  campaignName: string;
  onCampaignNameChange: (name: string) => void;
  storyTopics: string[];
  onStoryTopicsChange: (topics: string[]) => void;
  storyTemplate: string;
}

const templateStructures: Record<string, { name: string; icon: typeof Lightbulb; structure: string[] }> = {
  "problem-solution": {
    name: "Problem-Solution",
    icon: Lightbulb,
    structure: ["Hook", "Problem", "Solution", "Call-to-Action"],
  },
  "tease-reveal": {
    name: "Tease & Reveal",
    icon: Sparkles,
    structure: ["Hook", "Tease", "Buildup", "Reveal"],
  },
  "before-after": {
    name: "Before & After",
    icon: RefreshCw,
    structure: ["Before State", "Transformation", "After State", "Results"],
  },
  "myth-busting": {
    name: "Myth-Busting",
    icon: AlertCircle,
    structure: ["Common Myth", "Why It's Wrong", "The Truth", "Takeaway"],
  },
};

export function Step3StoryTopics({
  campaignName,
  onCampaignNameChange,
  storyTopics,
  onStoryTopicsChange,
  storyTemplate,
}: Step3StoryTopicsProps) {
  const [newTopic, setNewTopic] = useState("");
  
  const templateInfo = templateStructures[storyTemplate];
  const TemplateIcon = templateInfo?.icon || FileText;

  const addTopic = () => {
    if (newTopic.trim()) {
      onStoryTopicsChange([...storyTopics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    onStoryTopicsChange(storyTopics.filter((_, i) => i !== index));
  };

  const updateTopic = (index: number, value: string) => {
    const updated = [...storyTopics];
    updated[index] = value;
    onStoryTopicsChange(updated);
  };

  const validTopicsCount = storyTopics.filter(t => t.trim()).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Campaign Details</h2>
        <p className="text-muted-foreground mt-2">
          Name your campaign and add topics for video generation
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => onCampaignNameChange(e.target.value)}
              placeholder="e.g., Q1 Marketing Stories"
              className="w-full px-3 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-campaign-name"
            />
          </div>
        </CardContent>
      </Card>

      {templateInfo && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TemplateIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{templateInfo.name} Template</p>
                <p className="text-xs text-muted-foreground">Each topic will generate a video with this structure:</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {templateInfo.structure.map((step, index) => (
                <Badge key={step} variant="secondary" className="text-xs">
                  {index + 1}. {step}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Story Topics</h3>
            <p className="text-sm text-muted-foreground">
              Each topic will become one video using the {templateInfo?.name || "selected"} template
            </p>
          </div>
          <Badge variant="outline">
            {validTopicsCount} video{validTopicsCount !== 1 ? "s" : ""} planned
          </Badge>
        </div>

        <div className="space-y-3">
          {storyTopics.map((topic, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex items-center justify-center w-8 h-10 rounded-md bg-muted text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>
              <Textarea
                value={topic}
                onChange={(e) => updateTopic(index, e.target.value)}
                placeholder="Describe the topic for this video..."
                className="flex-1 min-h-[80px] resize-none"
                data-testid={`textarea-topic-${index}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTopic(index)}
                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                data-testid={`button-remove-topic-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <div className="w-8" />
            <Textarea
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Add a new topic..."
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  e.preventDefault();
                  addTopic();
                }
              }}
              data-testid="textarea-new-topic"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addTopic}
              disabled={!newTopic.trim()}
              className="h-10 w-10"
              data-testid="button-add-topic"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Press ⌘+Enter to quickly add a topic
        </p>
      </div>

      {validTopicsCount === 0 && (
        <div className="p-6 rounded-lg border border-dashed text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Add at least one topic to create videos
          </p>
        </div>
      )}
    </div>
  );
}
