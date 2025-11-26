import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, ImagePlus, X, Package, Mic, Video, DollarSign, Clock, Volume2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProductDetails {
  title: string;
  price: string;
  description: string;
  cta: string;
}

interface ProductScriptEditorProps {
  productPhotos: string[];
  productDetails: ProductDetails;
  aspectRatio: string;
  duration: string;
  voiceOverEnabled: boolean;
  voiceActorId: string | null;
  voiceOverConcept: string;
  voiceOverScript: string;
  videoConcept: string;
  generatedScript: string;
  onProductPhotosChange: (photos: string[]) => void;
  onProductDetailsChange: (details: ProductDetails) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onDurationChange: (duration: string) => void;
  onVoiceOverToggle: (enabled: boolean) => void;
  onVoiceActorChange: (voiceActorId: string) => void;
  onVoiceOverConceptChange: (concept: string) => void;
  onVoiceOverScriptChange: (script: string) => void;
  onVideoConceptChange: (concept: string) => void;
  onScriptChange: (script: string) => void;
  onNext: () => void;
}

const ASPECT_RATIOS = [
  { id: "9:16", label: "9:16", description: "TikTok, Reels, Shorts" },
  { id: "16:9", label: "16:9", description: "YouTube, Landscape" },
  { id: "1:1", label: "1:1", description: "Instagram Feed" },
  { id: "4:5", label: "4:5", description: "Instagram Portrait" },
];

const DURATIONS = [
  { value: "15", label: "15s", description: "Quick hook" },
  { value: "30", label: "30s", description: "Standard ad" },
  { value: "60", label: "1 min", description: "Detailed showcase" },
  { value: "90", label: "90s", description: "Full story" },
];

const NARRATORS = [
  { id: "narrator-1", name: "Alex", voice: "Professional Male", style: "Energetic" },
  { id: "narrator-2", name: "Sarah", voice: "Professional Female", style: "Warm" },
  { id: "narrator-3", name: "Jordan", voice: "Neutral", style: "Conversational" },
  { id: "narrator-4", name: "Maya", voice: "Young Female", style: "Trendy" },
  { id: "narrator-5", name: "Marcus", voice: "Deep Male", style: "Authoritative" },
];

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 150;
  const seconds = Math.round((words / wordsPerMinute) * 60);
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `~${minutes}m ${remainingSeconds}s`;
}

export function ProductScriptEditor({
  productPhotos,
  productDetails,
  aspectRatio,
  duration,
  voiceOverEnabled,
  voiceActorId,
  voiceOverConcept,
  voiceOverScript,
  videoConcept,
  generatedScript,
  onProductPhotosChange,
  onProductDetailsChange,
  onAspectRatioChange,
  onDurationChange,
  onVoiceOverToggle,
  onVoiceActorChange,
  onVoiceOverConceptChange,
  onVoiceOverScriptChange,
  onVideoConceptChange,
  onScriptChange,
  onNext,
}: ProductScriptEditorProps) {
  const [hasGeneratedScriptOnce, setHasGeneratedScriptOnce] = useState(!!generatedScript);
  const [hasGeneratedVoiceOverOnce, setHasGeneratedVoiceOverOnce] = useState(!!voiceOverScript);
  const { toast } = useToast();

  const generateScriptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/commerce/script/generate', {
        productDetails,
        videoConcept,
        voiceOverConcept,
        duration: parseInt(duration),
        aspectRatio,
        voiceOverEnabled,
      });
      return await res.json();
    },
    onSuccess: (data: { script: string }) => {
      setHasGeneratedScriptOnce(true);
      onScriptChange(data.script);
      toast({
        title: "Script Generated",
        description: "Your product marketing script has been created. You can edit it below.",
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

  const generateVoiceOverMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/commerce/voiceover/generate', {
        productDetails,
        videoConcept,
        voiceOverConcept,
        duration: parseInt(duration),
        voiceActorId,
      });
      return await res.json();
    },
    onSuccess: (data: { script: string }) => {
      setHasGeneratedVoiceOverOnce(true);
      onVoiceOverScriptChange(data.script);
      toast({
        title: "Voiceover Script Generated",
        description: "Your voiceover script is ready. Edit it as needed.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate voiceover script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = () => {
    if (productPhotos.length >= 3) {
      toast({
        title: "Maximum Photos",
        description: "You can upload up to 3 product photos.",
        variant: "destructive",
      });
      return;
    }
    const placeholderUrl = `https://placehold.co/400x400/1a1a2e/ffffff?text=Product+${productPhotos.length + 1}`;
    onProductPhotosChange([...productPhotos, placeholderUrl]);
  };

  const handleRemovePhoto = (index: number) => {
    onProductPhotosChange(productPhotos.filter((_, i) => i !== index));
  };

  const updateProductDetail = (key: keyof ProductDetails, value: string) => {
    onProductDetailsChange({ ...productDetails, [key]: value });
  };

  const handleGenerateScript = () => {
    if (!productDetails.title.trim()) {
      toast({
        title: "Product Title Required",
        description: "Please enter your product title before generating a script.",
        variant: "destructive",
      });
      return;
    }
    if (!videoConcept.trim()) {
      toast({
        title: "Video Concept Required",
        description: "Please describe your video concept to generate a script.",
        variant: "destructive",
      });
      return;
    }
    generateScriptMutation.mutate();
  };

  const handleGenerateVoiceOver = () => {
    if (!productDetails.title.trim()) {
      toast({
        title: "Product Title Required",
        description: "Please enter your product title before generating voiceover.",
        variant: "destructive",
      });
      return;
    }
    if (!voiceActorId) {
      toast({
        title: "Narrator Required",
        description: "Please select a narrator before generating voiceover.",
        variant: "destructive",
      });
      return;
    }
    generateVoiceOverMutation.mutate();
  };

  const handleContinue = () => {
    if (productPhotos.length === 0) {
      toast({
        title: "Product Photo Required",
        description: "Please upload at least one product photo.",
        variant: "destructive",
      });
      return;
    }
    if (!productDetails.title.trim()) {
      toast({
        title: "Product Title Required",
        description: "Please enter your product title.",
        variant: "destructive",
      });
      return;
    }
    if (!generatedScript.trim() && !videoConcept.trim()) {
      toast({
        title: "Script or Concept Required",
        description: "Please generate a script or provide a video concept.",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  const wordCount = voiceOverScript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)]">
      {/* Left Column: Product Setup & Settings */}
      <div className="w-[380px] space-y-4 overflow-y-auto pr-2">
        {/* Product Photos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product Photos
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {productPhotos.length}/3
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {productPhotos.map((photo, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                >
                  <img 
                    src={photo} 
                    alt={`Product ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover-elevate"
                    data-testid={`button-remove-photo-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {productPhotos.length < 3 && (
                <button
                  onClick={handlePhotoUpload}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  data-testid="button-upload-photo"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload up to 3 product shots for your video.
            </p>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Product Title</Label>
              <Input
                placeholder="e.g., Premium Wireless Headphones"
                value={productDetails.title}
                onChange={(e) => updateProductDetail("title", e.target.value)}
                data-testid="input-product-title"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Price</Label>
              <Input
                placeholder="e.g., $99.99"
                value={productDetails.price}
                onChange={(e) => updateProductDetail("price", e.target.value)}
                data-testid="input-product-price"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                placeholder="Key features and benefits..."
                value={productDetails.description}
                onChange={(e) => updateProductDetail("description", e.target.value)}
                className="min-h-[60px] resize-none"
                data-testid="input-product-description"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Call to Action</Label>
              <Input
                placeholder="e.g., Shop Now, Learn More"
                value={productDetails.cta}
                onChange={(e) => updateProductDetail("cta", e.target.value)}
                data-testid="input-product-cta"
              />
            </div>
          </CardContent>
        </Card>

        {/* Video Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Aspect Ratio</Label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => onAspectRatioChange(ratio.id)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all hover-elevate ${
                      aspectRatio === ratio.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                    data-testid={`button-aspect-ratio-${ratio.id}`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {ASPECT_RATIOS.find(r => r.id === aspectRatio)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Duration</Label>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((dur) => (
                  <button
                    key={dur.value}
                    onClick={() => onDurationChange(dur.value)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all hover-elevate ${
                      duration === dur.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                    data-testid={`button-duration-${dur.value}`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {DURATIONS.find(d => d.value === duration)?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Voice Over Settings (Compact) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Over Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enable Voice Over</Label>
              <Switch
                checked={voiceOverEnabled}
                onCheckedChange={onVoiceOverToggle}
                data-testid="switch-voice-over"
              />
            </div>

            {voiceOverEnabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Narrator</Label>
                  <Select
                    value={voiceActorId || ""}
                    onValueChange={onVoiceActorChange}
                  >
                    <SelectTrigger data-testid="select-narrator">
                      <SelectValue placeholder="Select narrator" />
                    </SelectTrigger>
                    <SelectContent>
                      {NARRATORS.map((narrator) => (
                        <SelectItem key={narrator.id} value={narrator.id}>
                          <div className="flex flex-col">
                            <span>{narrator.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {narrator.voice} - {narrator.style}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Tone & Style</Label>
                  <Input
                    placeholder="e.g., Energetic, friendly, exciting"
                    value={voiceOverConcept}
                    onChange={(e) => onVoiceOverConceptChange(e.target.value)}
                    data-testid="input-voice-over-tone"
                  />
                  <p className="text-xs text-muted-foreground">
                    Brief tone guide for the AI narrator
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Video Concept, Script & Voiceover */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Video Concept */}
        <Card className="flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Video Concept
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Describe your video concept... e.g., 'Show the product in action with a lifestyle setting. Start with a problem, introduce the product as the solution, and end with happy customers using it.'"
              value={videoConcept}
              onChange={(e) => onVideoConceptChange(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="input-video-concept"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {videoConcept.length} characters
              </span>
              <Button
                onClick={handleGenerateScript}
                disabled={generateScriptMutation.isPending}
                size="sm"
                data-testid="button-generate-script"
              >
                {generateScriptMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {hasGeneratedScriptOnce ? "Regenerate Script" : "Generate Script"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two-column layout for Script and Voiceover */}
        <div className={`flex-1 flex gap-4 overflow-hidden ${voiceOverEnabled ? '' : ''}`}>
          {/* Generated Script */}
          <Card className={`flex-1 flex flex-col overflow-hidden ${voiceOverEnabled ? 'w-1/2' : 'w-full'}`}>
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Script
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <Textarea
                placeholder={hasGeneratedScriptOnce 
                  ? "Edit your generated script here..." 
                  : "Your AI-generated marketing script will appear here after you click 'Generate Script'..."
                }
                value={generatedScript}
                onChange={(e) => onScriptChange(e.target.value)}
                className="flex-1 resize-none min-h-[150px]"
                data-testid="input-generated-script"
              />
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-muted-foreground">
                  {generatedScript.length} characters
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Voiceover Script - Only shown when voice over is enabled */}
          {voiceOverEnabled && (
            <Card className="flex-1 flex flex-col overflow-hidden w-1/2 border-primary/20">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Voiceover Script
                  </CardTitle>
                  <Button
                    onClick={handleGenerateVoiceOver}
                    disabled={generateVoiceOverMutation.isPending}
                    size="sm"
                    variant="outline"
                    data-testid="button-generate-voiceover"
                  >
                    {generateVoiceOverMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {hasGeneratedVoiceOverOnce ? "Regenerate" : "Generate"}
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                <Textarea
                  placeholder="Write or generate the exact words the narrator will speak...

Example:
'Introducing the future of audio. Premium Wireless Headphones that deliver crystal-clear sound, all-day comfort, and 40 hours of battery life. 

Whether you're working, traveling, or relaxing — experience music the way it was meant to be heard.

Shop now and elevate your listening experience.'"
                  value={voiceOverScript}
                  onChange={(e) => onVoiceOverScriptChange(e.target.value)}
                  className="flex-1 resize-none min-h-[150px]"
                  data-testid="input-voiceover-script"
                />
                <div className="flex items-center justify-between pt-3 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {wordCount} words
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {estimateReadTime(voiceOverScript)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-end pt-2 flex-shrink-0">
          <Button
            onClick={handleContinue}
            disabled={!productDetails.title.trim() || productPhotos.length === 0}
            data-testid="button-continue"
          >
            Continue to World & Cast
          </Button>
        </div>
      </div>
    </div>
  );
}
