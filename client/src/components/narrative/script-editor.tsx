import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ScriptEditorProps {
  initialScript?: string;
  onScriptChange: (script: string) => void;
  onNext: () => void;
}

export function ScriptEditor({ initialScript = "", onScriptChange, onNext }: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const [duration, setDuration] = useState("60");
  const [genre, setGenre] = useState("adventure");
  const [language, setLanguage] = useState("english");
  const { toast } = useToast();

  const generateScriptMutation = useMutation({
    mutationFn: async (userPrompt: string) => {
      return await apiRequest('/api/narrative/script/generate', {
        method: 'POST',
        body: JSON.stringify({
          duration: parseInt(duration),
          genre,
          language,
          aspectRatio: '16:9',
          userPrompt,
        }),
      });
    },
    onSuccess: (data) => {
      setScript(data.script);
      onScriptChange(data.script);
      toast({
        title: "Script Generated",
        description: "Your AI-generated script is ready for review.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScriptChange = (value: string) => {
    setScript(value);
    onScriptChange(value);
  };

  const handleGenerate = () => {
    const prompt = `Generate a ${genre} story in ${language} language`;
    generateScriptMutation.mutate(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration" data-testid="select-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
              <SelectItem value="90">90 seconds</SelectItem>
              <SelectItem value="120">2 minutes</SelectItem>
              <SelectItem value="180">3 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger id="genre" data-testid="select-genre">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adventure">Adventure</SelectItem>
              <SelectItem value="fantasy">Fantasy</SelectItem>
              <SelectItem value="scifi">Sci-Fi</SelectItem>
              <SelectItem value="comedy">Comedy</SelectItem>
              <SelectItem value="drama">Drama</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="spanish">Spanish</SelectItem>
              <SelectItem value="french">French</SelectItem>
              <SelectItem value="german">German</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="script">Your Script</Label>
        <Textarea
          id="script"
          placeholder="Write your script here... or use AI to generate one based on your settings."
          className="min-h-96 font-mono"
          value={script}
          onChange={(e) => handleScriptChange(e.target.value)}
          data-testid="input-script"
        />
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleGenerate}
          disabled={generateScriptMutation.isPending}
          data-testid="button-ai-assist"
        >
          {generateScriptMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate Script
            </>
          )}
        </Button>
        <Button onClick={onNext} disabled={!script.trim()} data-testid="button-next">
          Continue to Breakdown
        </Button>
      </div>
    </div>
  );
}
