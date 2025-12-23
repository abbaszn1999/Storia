import type { Character } from '@shared/schema';

/**
 * Step 2: World & Cast Data
 * Contains all settings and data from the World & Cast step
 */
export interface Step2Data {
  // AI Model Settings
  imageModel: string;  // e.g., "Flux", "Midjourney", "Nano Banana", "GPT Image"
  
  // Visual Style Settings
  artStyle: string;  // e.g., "none", "cinematic", "vintage", etc.
  styleReference?: string[];  // Array of reference image URLs (when artStyle is "none")
  cinematicInspiration?: string;  // Text description for cinematic inspiration
  
  // World Description
  worldDescription: string;
  
  // Custom Instructions
  imageInstructions: string;  // Image generation instructions
  videoInstructions: string;  // Video/animation instructions
  
  // Characters & Locations
  characters: Character[];  // Full character objects with all fields
  locations: Array<{
    id: string;
    name: string;
    description: string;
    details?: string;
    imageUrl?: string | null;
  }>;  // Full location objects
}

