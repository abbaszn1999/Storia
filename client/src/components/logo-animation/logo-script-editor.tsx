import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  Image as ImageIcon,
  Clock,
  Maximize2,
  Lightbulb,
  Wand2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoScriptEditorProps {
  logoFile: File | null;
  logoPreviewUrl: string | null;
  aspectRatio: string;
  duration: string;
  videoIdea: string;
  storyConcept: string;
  onLogoUpload: (file: File) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onDurationChange: (duration: string) => void;
  onVideoIdeaChange: (idea: string) => void;
  onStoryConceptChange: (concept: string) => void;
  onNext: () => void;
}

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 - Landscape (YouTube, TV)" },
  { value: "9:16", label: "9:16 - Portrait (Reels, TikTok, Shorts)" },
  { value: "1:1", label: "1:1 - Square (Instagram, Feed)" },
  { value: "4:5", label: "4:5 - Portrait (Instagram Feed)" },
  { value: "21:9", label: "21:9 - Ultra-wide (Cinema)" },
];

const DURATIONS = [
  { value: "3", label: "3 seconds - Quick reveal" },
  { value: "5", label: "5 seconds - Standard intro" },
  { value: "7", label: "7 seconds - Detailed animation" },
  { value: "10", label: "10 seconds - Full story" },
  { value: "15", label: "15 seconds - Extended animation" },
];

export function LogoScriptEditor({
  logoFile,
  logoPreviewUrl,
  aspectRatio,
  duration,
  videoIdea,
  storyConcept,
  onLogoUpload,
  onAspectRatioChange,
  onDurationChange,
  onVideoIdeaChange,
  onStoryConceptChange,
  onNext,
}: LogoScriptEditorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        onLogoUpload(file);
        toast({
          title: "Logo uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, SVG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onLogoUpload(file);
      toast({
        title: "Logo uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleGenerateConcept = () => {
    if (!videoIdea.trim()) {
      toast({
        title: "Please enter a video idea",
        description: "Write a brief description of your logo animation vision.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const generatedConcept = `# Logo Animation Concept

## Opening (0-2s)
The scene opens with a dark, cinematic background. Subtle particles of light begin to gather and swirl, creating anticipation.

## Build-up (2-4s)
${videoIdea}

The particles intensify, forming abstract shapes that hint at the logo's form. Light rays emerge from the center, creating depth and dimension.

## Reveal (4-6s)
The logo materializes through an elegant morph effect. Each element of the logo animates with purpose - the icon rotates into place while the wordmark slides in with a subtle bounce.

## Settle (6-8s)
The animation settles into a hero pose. A gentle glow pulses around the logo, emphasizing its final form. Background elements fade to a clean finish.

## Closing (8-${duration}s)
The logo holds its position with subtle ambient motion. A tagline or call-to-action fades in below if applicable.

---
*Duration: ${duration} seconds | Aspect Ratio: ${aspectRatio}*`;

      onStoryConceptChange(generatedConcept);
      setIsGenerating(false);
      
      toast({
        title: "Concept generated!",
        description: "Your logo animation story concept is ready for review.",
      });
    }, 2000);
  };

  const canContinue = logoPreviewUrl && storyConcept.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Logo Animation Script</h2>
        <p className="text-muted-foreground mt-1">
          Upload your logo and describe your animation vision. AI will generate a detailed story concept.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Logo Upload & Settings */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Upload Logo
              </CardTitle>
              <CardDescription>
                Upload your logo in PNG, JPG, SVG, or WebP format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {logoPreviewUrl ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={logoPreviewUrl}
                        alt="Logo preview"
                        className="max-h-32 max-w-full mx-auto rounded-lg"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {logoFile?.name}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      data-testid="button-replace-logo"
                    >
                      Replace Logo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Drag and drop your logo here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      data-testid="button-upload-logo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-logo-file"
                />
              </div>
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
              <CardDescription>
                Configure aspect ratio and duration for your logo animation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4" />
                  Aspect Ratio
                </Label>
                <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
                  <SelectTrigger data-testid="select-aspect-ratio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </Label>
                <Select value={duration} onValueChange={onDurationChange}>
                  <SelectTrigger data-testid="select-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Video Idea */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Animation Idea
              </CardTitle>
              <CardDescription>
                Describe your vision for the logo animation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: A dramatic reveal where my logo emerges from swirling cosmic particles, with a cinematic glow effect and energetic motion..."
                value={videoIdea}
                onChange={(e) => onVideoIdeaChange(e.target.value)}
                className="min-h-[120px] resize-none"
                data-testid="input-video-idea"
              />
              <Button
                onClick={handleGenerateConcept}
                disabled={isGenerating || !videoIdea.trim()}
                className="w-full"
                data-testid="button-generate-concept"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Concept...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Story Concept
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Generated Concept */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Story Concept
              </CardTitle>
              <CardDescription>
                AI-generated animation story based on your idea
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storyConcept ? (
                <div className="space-y-4">
                  <Textarea
                    value={storyConcept}
                    onChange={(e) => onStoryConceptChange(e.target.value)}
                    className="min-h-[400px] resize-none font-mono text-sm"
                    placeholder="Your generated concept will appear here..."
                    data-testid="input-story-concept"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can edit the concept above to refine your animation story.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p className="font-medium">No concept generated yet</p>
                  <p className="text-sm mt-1">
                    Enter your animation idea and click "Generate Story Concept"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canContinue}
          data-testid="button-continue"
        >
          Continue to World Settings
        </Button>
      </div>
    </div>
  );
}
