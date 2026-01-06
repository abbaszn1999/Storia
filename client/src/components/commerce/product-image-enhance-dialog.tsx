"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductImageEnhanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heroImageUrl: string;
  videoId: string;
  onGenerate: (enhancedImageUrl: string) => void;  // Called with enhanced image URL
  onReject: () => void;    // Called when user clicks "Use Uploaded Image"
}

export function ProductImageEnhanceDialog({
  open,
  onOpenChange,
  heroImageUrl,
  videoId,
  onGenerate,
  onReject,
}: ProductImageEnhanceDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!videoId || videoId === 'new') {
      toast({
        title: "Cannot generate",
        description: "Please save your video first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/social-commerce/videos/${videoId}/product-image/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          heroImageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || 'Failed to generate enhanced image');
      }

      const data = await response.json();

      if (!data.success || !data.imageUrl) {
        throw new Error('No image URL returned');
      }

      // Call onGenerate with the enhanced image URL
      onGenerate(data.imageUrl);

      toast({
        title: "Professional image generated",
        description: "Your enhanced product image is ready",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Image enhancement error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : 'Failed to generate enhanced image',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-orange-400" />
            Professional Product Image Recommended
          </DialogTitle>
          <DialogDescription className="text-white/60">
            This image will be used as the starting frame for your video campaign. 
            We recommend generating a professional product image optimized for your campaign 
            to ensure the best video quality.
          </DialogDescription>
        </DialogHeader>

        {/* Image Preview */}
        <div className="flex justify-center py-4">
          <div className="relative w-full max-w-[300px] aspect-square rounded-lg overflow-hidden border border-white/10">
            <img
              src={heroImageUrl}
              alt="Product hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
                <ImageIcon className="w-3 h-3" />
                <span>Current Image</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isGenerating}
            className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Use Uploaded Image
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Professional Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






