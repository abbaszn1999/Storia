import { useState } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload, Video } from "lucide-react";

const DURATION_OPTIONS = [
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "60 seconds" },
  { value: "90", label: "90 seconds" },
];

const VIDEO_MODELS = [
  { value: "veo3", label: "Veo 3 (Google)", generatesAudio: true },
  { value: "runway-gen3", label: "Runway Gen-3", generatesAudio: true },
  { value: "kling", label: "Kling AI", generatesAudio: false },
  { value: "luma", label: "Luma Dream Machine", generatesAudio: false },
  { value: "pika", label: "Pika Labs", generatesAudio: false },
  { value: "stable-video", label: "Stable Video Diffusion", generatesAudio: false },
];

export default function ASMRGenerator() {
  const [, params] = useRoute("/stories/create/:template");
  const [prompt, setPrompt] = useState("");
  const [soundPrompt, setSoundPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [duration, setDuration] = useState("15");
  const [videoModel, setVideoModel] = useState("veo3");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedModel = VIDEO_MODELS.find(m => m.value === videoModel);
  const showSoundPrompt = !selectedModel?.generatesAudio;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    // Simulate video generation
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsGenerating(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">ASMR / Sensory Video Generator</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
              data-testid="button-close"
            >
              <Link href="/stories">
                <X className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground mb-8">
            {showSoundPrompt 
              ? "Describe the scene and sounds you want to create."
              : "Describe the visual scene you want to create. Audio will be generated automatically."}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              {/* Video Model Selection */}
              <div className="space-y-3">
                <Label htmlFor="video-model" className="text-base">
                  Video Model
                </Label>
                <Select value={videoModel} onValueChange={setVideoModel}>
                  <SelectTrigger className="h-12" data-testid="select-video-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel?.generatesAudio && (
                  <p className="text-xs text-muted-foreground">
                    This model generates audio with the video automatically
                  </p>
                )}
              </div>

              {/* Visual Prompt */}
              <div className="space-y-3">
                <Label htmlFor="prompt" className="text-base">
                  Visual Prompt
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A sharp knife cleanly slicing a crisp green apple on a clean white background."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  data-testid="textarea-prompt"
                />
              </div>

              {/* Sound Effect Prompt - Only shown for models that don't generate audio */}
              {showSoundPrompt && (
                <div className="space-y-3">
                  <Label htmlFor="sound-prompt" className="text-base">
                    Sound Effect Prompt
                  </Label>
                  <Textarea
                    id="sound-prompt"
                    placeholder="e.g., High-fidelity cutting sounds, crisp slicing, satisfying ASMR audio"
                    value={soundPrompt}
                    onChange={(e) => setSoundPrompt(e.target.value)}
                    className="min-h-[100px] resize-none"
                    data-testid="textarea-sound-prompt"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe the sounds you want to accompany the video
                  </p>
                </div>
              )}

              {/* Reference Image Upload */}
              <div className="space-y-3">
                <Label className="text-base">Reference Image (Optional)</Label>
                {referenceImage ? (
                  <div className="relative border-2 border-dashed rounded-lg p-4">
                    <img
                      src={referenceImage}
                      alt="Reference"
                      className="w-full h-48 object-contain rounded"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setReferenceImage(null)}
                      data-testid="button-remove-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 cursor-pointer hover-elevate"
                    data-testid="label-upload-area"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or{" "}
                      <span className="text-primary font-medium">browse</span>
                    </p>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      data-testid="input-image-upload"
                    />
                  </label>
                )}
              </div>

              {/* Aspect Ratio & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-base">Aspect Ratio</Label>
                  <Select value="9:16" disabled>
                    <SelectTrigger className="h-12" data-testid="select-aspect-ratio">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-12" data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div className="aspect-[9/16] max-h-[600px] mx-auto bg-muted/30 border-2 border-dashed rounded-lg flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Video className="h-16 w-16 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Your video will appear here.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 mt-8">
            <Button
              variant="outline"
              size="lg"
              asChild
              data-testid="button-back-to-templates"
            >
              <Link href="/stories">Back to Templates</Link>
            </Button>
            <Button
              onClick={handleGenerateVideo}
              disabled={!prompt || isGenerating}
              size="lg"
              className="px-8"
              data-testid="button-generate-video"
            >
              {isGenerating ? "Generating..." : "Generate Video"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
