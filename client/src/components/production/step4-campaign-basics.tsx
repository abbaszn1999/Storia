import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Upload, FileText, Sparkles, GripVertical, Cloud, Waves } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const AMBIENT_CATEGORIES = [
  { id: "nature", label: "Nature" },
  { id: "weather", label: "Weather" },
  { id: "urban", label: "Urban" },
  { id: "cozy", label: "Cozy" },
  { id: "abstract", label: "Abstract" },
  { id: "cosmic", label: "Cosmic" },
  { id: "underwater", label: "Underwater" },
  { id: "seasonal", label: "Seasonal" },
];

const AMBIENT_MOODS = [
  "Relaxing", "Meditative", "Calming", "Peaceful", "Dreamy", "Energizing",
  "Focused", "Mysterious", "Romantic", "Melancholic", "Uplifting", "Ethereal"
];

interface Step4CampaignBasicsProps {
  campaignName: string;
  onCampaignNameChange: (value: string) => void;
  storyIdeas: string[];
  onStoryIdeasChange: (ideas: string[]) => void;
  scripterModel: string;
  onScripterModelChange: (value: string) => void;
  videoMode?: string;
  ambientCategory?: string;
  onAmbientCategoryChange?: (value: string) => void;
  ambientMoods?: string[];
  onAmbientMoodsChange?: (moods: string[]) => void;
}

export function Step4CampaignBasics({
  campaignName,
  onCampaignNameChange,
  storyIdeas,
  onStoryIdeasChange,
  scripterModel,
  onScripterModelChange,
  videoMode = "narrative",
  ambientCategory = "",
  onAmbientCategoryChange,
  ambientMoods = [],
  onAmbientMoodsChange,
}: Step4CampaignBasicsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAmbientMode = videoMode === "ambient_visual";
  const ideasLabel = isAmbientMode ? "Atmosphere Descriptions" : "Story Ideas";
  const ideaPlaceholder = isAmbientMode 
    ? "Describe the atmosphere you want to create..." 
    : "Describe your story idea...";
  
  const toggleMood = (mood: string) => {
    if (!onAmbientMoodsChange) return;
    if (ambientMoods.includes(mood)) {
      onAmbientMoodsChange(ambientMoods.filter(m => m !== mood));
    } else if (ambientMoods.length < 3) {
      onAmbientMoodsChange([...ambientMoods, mood]);
    }
  };

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

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        const ideas = lines[0].toLowerCase().includes('story') || lines[0].toLowerCase().includes('idea')
          ? lines.slice(1)
          : lines;
        
        const filteredIdeas = ideas.filter(idea => idea.length > 0);
        
        if (filteredIdeas.length === 0) {
          toast({
            title: "No ideas found",
            description: "The CSV file appears to be empty",
            variant: "destructive",
          });
          return;
        }

        const updatedIdeas = [...storyIdeas];
        let csvIndex = 0;
        
        for (let i = 0; i < updatedIdeas.length && csvIndex < filteredIdeas.length; i++) {
          if (!updatedIdeas[i].trim()) {
            updatedIdeas[i] = filteredIdeas[csvIndex];
            csvIndex++;
          }
        }
        
        while (csvIndex < filteredIdeas.length) {
          updatedIdeas.push(filteredIdeas[csvIndex]);
          csvIndex++;
        }
        
        onStoryIdeasChange(updatedIdeas);
        
        toast({
          title: "CSV imported successfully",
          description: `Imported ${filteredIdeas.length} story ${filteredIdeas.length === 1 ? 'idea' : 'ideas'}`,
        });
      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description: "Failed to read the CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validIdeasCount = storyIdeas.filter(i => i.trim()).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold">Campaign Basics</h2>
        <p className="text-muted-foreground mt-2">
          {isAmbientMode 
            ? "Name your campaign and describe atmospheres - each description becomes one ambient video"
            : "Name your campaign and add story ideas - each idea becomes one video"
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                placeholder={isAmbientMode ? "e.g., Relaxation Ambience Pack" : "e.g., Summer Travel Series 2025"}
                value={campaignName}
                onChange={(e) => onCampaignNameChange(e.target.value)}
                data-testid="input-campaign-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scripter-model">AI {isAmbientMode ? "Atmosphere" : "Scripter"} Model</Label>
              <Select value={scripterModel} onValueChange={onScripterModelChange}>
                <SelectTrigger id="scripter-model" data-testid="select-scripter-model">
                  <SelectValue placeholder={isAmbientMode ? "Select AI atmosphere model" : "Select AI scripter model"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isAmbientMode 
                  ? "This model will enhance your atmosphere descriptions"
                  : "This model will generate scripts from your story ideas"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Campaign Summary</p>
                <p className="text-sm text-muted-foreground">Your production overview</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-primary/10">
                <span className="text-sm text-muted-foreground">{isAmbientMode ? "Ambiences" : "Videos"} to create</span>
                <Badge variant="secondary">{validIdeasCount}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-primary/10">
                <span className="text-sm text-muted-foreground">{isAmbientMode ? "Atmosphere" : "Scripter"} Model</span>
                <Badge variant="outline">{scripterModel.toUpperCase()}</Badge>
              </div>
              {isAmbientMode && ambientCategory && (
                <div className="flex justify-between items-center py-2 border-b border-primary/10">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="outline" className="capitalize">{ambientCategory}</Badge>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={campaignName && validIdeasCount > 0 ? "default" : "secondary"}>
                  {campaignName && validIdeasCount > 0 ? "Ready" : "Incomplete"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAmbientMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                Ambient Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AMBIENT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={ambientCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => onAmbientCategoryChange?.(cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Waves className="h-4 w-4 text-primary" />
                Moods
                <Badge variant="secondary" className="ml-2">{ambientMoods.length}/3</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AMBIENT_MOODS.map((mood) => (
                  <Badge
                    key={mood}
                    variant={ambientMoods.includes(mood) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      ambientMoods.includes(mood) 
                        ? "" 
                        : ambientMoods.length >= 3 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover-elevate"
                    }`}
                    onClick={() => toggleMood(mood)}
                    data-testid={`badge-mood-${mood.toLowerCase()}`}
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select up to 3 moods for your ambient videos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {isAmbientMode ? <Waves className="h-4 w-4 text-primary" /> : <Sparkles className="h-4 w-4 text-primary" />}
              {ideasLabel}
              <Badge variant="secondary" className="ml-2">{storyIdeas.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-csv"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={addStoryIdea}
                data-testid="button-add-story-idea"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAmbientMode ? "Add Atmosphere" : "Add Idea"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isAmbientMode 
              ? "Each atmosphere description will generate one ambient video with seamless loops"
              : "Each story idea will generate one complete video with script, scenes, and shots"
            }
          </p>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            data-testid="input-csv-file"
          />

          <div className="space-y-3">
            {storyIdeas.map((idea, index) => (
              <div 
                key={index} 
                className="flex gap-3 p-3 rounded-lg border bg-muted/30 group"
              >
                <div className="flex items-center text-muted-foreground">
                  <GripVertical className="h-4 w-4 opacity-50" />
                </div>
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                  {index + 1}
                </div>
                <Textarea
                  placeholder={isAmbientMode 
                    ? `Describe the atmosphere #${index + 1}... e.g., "Peaceful forest with gentle rain"` 
                    : `Describe your story idea #${index + 1}...`
                  }
                  value={idea}
                  onChange={(e) => updateStoryIdea(index, e.target.value)}
                  className="flex-1 min-h-[60px] resize-none border-0 bg-transparent focus-visible:ring-0 p-0"
                  data-testid={`textarea-story-idea-${index}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStoryIdea(index)}
                  disabled={storyIdeas.length === 1}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  data-testid={`button-remove-story-idea-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {storyIdeas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{isAmbientMode 
                ? "No atmosphere descriptions yet. Click \"Add Atmosphere\" to get started."
                : "No story ideas yet. Click \"Add Idea\" to get started."
              }</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
