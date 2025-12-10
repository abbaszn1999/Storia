// Character Image Generation Hook (Future: AI image generation)

import { useState } from "react";

/**
 * Hook for character image generation
 * Currently disabled - placeholder for future AI generation feature
 */
export function useCharacterImage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (appearance: string, personality?: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // TODO: Implement AI image generation when ready
      throw new Error("Image generation coming soon");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateImage,
    isGenerating,
    error,
  };
}

