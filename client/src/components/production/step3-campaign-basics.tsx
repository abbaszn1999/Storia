import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Step3CampaignBasicsProps {
  campaignName: string;
  onCampaignNameChange: (value: string) => void;
  storyIdeas: string[];
  onStoryIdeasChange: (ideas: string[]) => void;
  scripterModel: string;
  onScripterModelChange: (value: string) => void;
}

export function Step3CampaignBasics({
  campaignName,
  onCampaignNameChange,
  storyIdeas,
  onStoryIdeasChange,
  scripterModel,
  onScripterModelChange,
}: Step3CampaignBasicsProps) {
  const addStoryIdea = () => {
    onStoryIdeasChange([...storyIdeas, ""]);
  };

  const removeStoryIdea = (index: number) => {
    onStoryIdeasChange(storyIdeas.filter((_, i) => i !== index));
  };

  const updateStoryIdea = (index: number, value: string) => {
    const newIdeas = [...storyIdeas];
    newIdeas[index] = value;
    onStoryIdeasChange(newIdeas);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Campaign Basics</h2>
        <p className="text-muted-foreground mt-2">
          Name your campaign and provide story ideas - each idea will become one video
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Campaign Name</Label>
          <Input
            id="campaign-name"
            placeholder="e.g., Summer Travel Series"
            value={campaignName}
            onChange={(e) => onCampaignNameChange(e.target.value)}
            data-testid="input-campaign-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scripter-model">Scripter Model</Label>
          <Select value={scripterModel} onValueChange={onScripterModelChange}>
            <SelectTrigger id="scripter-model" data-testid="select-scripter-model">
              <SelectValue placeholder="Select AI scripter model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Story Ideas ({storyIdeas.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStoryIdea}
              data-testid="button-add-story-idea"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Idea
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Each story idea will generate one video in your campaign
          </p>

          <div className="space-y-3 mt-4">
            {storyIdeas.map((idea, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  placeholder={`Story idea #${index + 1}`}
                  value={idea}
                  onChange={(e) => updateStoryIdea(index, e.target.value)}
                  className="flex-1"
                  rows={2}
                  data-testid={`textarea-story-idea-${index}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStoryIdea(index)}
                  disabled={storyIdeas.length === 1}
                  data-testid={`button-remove-story-idea-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
