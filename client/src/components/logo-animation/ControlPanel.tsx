// Logo Animation Control Panel - Left Side Glass Panel

import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowLeft, Upload, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import type { LogoGeneratorState, LogoGeneratorActions } from "./useLogoGenerator";
import { VEO_3_1_CONFIG } from "./useLogoGenerator";

interface ControlPanelProps {
  state: LogoGeneratorState;
  actions: LogoGeneratorActions;
}

export function ControlPanel({ state, actions }: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspace();

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        actions.setReferenceImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!currentWorkspace?.id) {
      actions.generateVideo(""); // Will show error
      return;
    }
    await actions.generateVideo(currentWorkspace.id);
  };

  return (
    <div className={cn(
      "w-[40%] min-w-[400px] max-w-[600px] flex-shrink-0 h-full",
      "bg-black/40 backdrop-blur-xl",
      "border-r border-white/[0.06]",
      "flex flex-col"
    )}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/videos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-base font-semibold">Logo Animation</h1>
              <p className="text-xs text-muted-foreground">Create brand animations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Video Model - Display Only (VEO 3.1) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Video Model
            </label>
            <div className={cn(
              "h-9 px-3 rounded-md",
              "bg-white/[0.03] border border-white/[0.08]",
              "flex items-center justify-between",
              "text-sm text-muted-foreground"
            )}>
              <span>{VEO_3_1_CONFIG.label}</span>
              <span className="text-xs text-primary">{VEO_3_1_CONFIG.badge}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              {VEO_3_1_CONFIG.description}
            </p>
          </div>

          {/* Idea Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Logo Idea
            </label>
            <Input
              value={state.ideaInput}
              onChange={(e) => actions.setIdeaInput(e.target.value)}
              placeholder="e.g., Tech company logo, Fashion brand reveal..."
              className="h-9 bg-white/5 border-white/10 focus:border-primary/50"
            />
            <p className="text-[10px] text-muted-foreground/60">
              Enter a simple idea and upload a reference image, then click "AI Recommend" to create a detailed visual prompt
            </p>
          </div>

          {/* Visual Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Visual Prompt
              </label>
              <div className="relative group">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={actions.generateIdea}
                  disabled={state.isGeneratingIdea || !state.ideaInput.trim() || !state.referenceImage}
                  className={cn(
                    "h-7 px-2.5 text-xs",
                    "bg-primary/10 text-primary hover:bg-primary/20",
                    "border border-primary/20",
                    (state.isGeneratingIdea || !state.ideaInput.trim() || !state.referenceImage) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {state.isGeneratingIdea ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1.5" />
                      AI Recommend
                    </>
                  )}
                </Button>
                {/* Tooltip for disabled state */}
                {(!state.referenceImage || !state.ideaInput.trim()) && !state.isGeneratingIdea && (
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    <div className="text-[11px] text-muted-foreground">
                      {!state.referenceImage && !state.ideaInput.trim() ? (
                        <>Upload a logo image and enter an idea first</>
                      ) : !state.referenceImage ? (
                        <>Upload a logo image first</>
                      ) : (
                        <>Enter a logo idea first</>
                      )}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full right-4 -mt-px border-4 border-transparent border-t-[#1a1a1a]" />
                  </div>
                )}
              </div>
            </div>
            <Textarea
              value={state.visualPrompt}
              onChange={(e) => actions.setVisualPrompt(e.target.value)}
              placeholder="Describe your vision for the logo animation... (or generate from idea above)"
              className="min-h-[100px] bg-white/5 border-white/10 focus:border-primary/50 resize-none"
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60">
                {state.visualPrompt.length}/2000 characters
              </span>
            </div>
          </div>

          {/* Reference Image - Upload Only */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Reference Image</span>
              {state.referenceImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.setReferenceImage(null)}
                  className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Image Preview or Upload Button */}
            {state.referenceImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-lg overflow-hidden border border-white/10"
              >
                <img
                  src={state.referenceImage}
                  alt="Reference"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-3 text-xs bg-white/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Change Image
                  </Button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full h-32 rounded-lg border-2 border-dashed",
                  "border-white/[0.08] bg-white/[0.02]",
                  "flex flex-col items-center justify-center gap-2",
                  "hover:border-primary/50 hover:bg-white/[0.05]",
                  "transition-all cursor-pointer"
                )}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  PNG, JPG, SVG, or WebP
                </span>
              </button>
            )}
          </div>

          {/* Video Format */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground/80">Video Format</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Aspect</Label>
                <Select value={state.aspectRatio} onValueChange={actions.setAspectRatio}>
                  <SelectTrigger className="h-9 bg-white/[0.03] border-white/[0.08] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {VEO_3_1_CONFIG.aspectRatios.map((ratio) => (
                      <SelectItem key={ratio} value={ratio}>
                        <span className="text-xs">{ratio}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">Quality</Label>
                <Select value={state.resolution} onValueChange={actions.setResolution}>
                  <SelectTrigger className="h-9 bg-white/[0.03] border-white/[0.08] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {VEO_3_1_CONFIG.resolutions.map((res) => (
                      <SelectItem key={res} value={res}>
                        <span className="text-xs">{res}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">
                  Duration
                </Label>
                <Select 
                  value={String(state.duration)} 
                  onValueChange={(v) => actions.setDuration(Number(v))}
                  disabled={!!state.referenceImage}
                >
                  <SelectTrigger className={cn(
                    "h-9 bg-white/[0.03] border-white/[0.08] text-xs",
                    state.referenceImage && "opacity-60 cursor-not-allowed"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-white/10">
                    {VEO_3_1_CONFIG.durations.map((dur) => (
                      <SelectItem key={dur} value={String(dur)}>
                        <span className="text-xs">{dur}s</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{state.error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-6">
          <Button
            onClick={handleGenerate}
            disabled={state.isGenerating || !state.visualPrompt.trim()}
            className={cn(
              "w-full h-11 bg-gradient-to-r from-primary to-purple-600",
              "hover:from-primary/90 hover:to-purple-600/90",
              "text-white font-medium",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {state.isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Logo Animation
              </>
            )}
          </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

