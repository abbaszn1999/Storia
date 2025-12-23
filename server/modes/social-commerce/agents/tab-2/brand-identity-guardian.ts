/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 2.3: BRAND IDENTITY GUARDIAN
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Pure algorithmic conversion (no AI calls).
 * Converts brand settings (logo integrity, depth, colors) into generation-ready
 * parameters.
 */

import type { BrandIdentityInput, BrandIdentityOutput } from '../../types';

/**
 * Agent 2.3: Brand Identity Guardian
 * 
 * Converts UI slider values into semantic descriptors for downstream agents.
 * This is a pure function with no AI calls or external dependencies.
 * 
 * @param input - Brand settings from frontend
 * @returns Semantic brand identity parameters
 */
export function convertBrandIdentity(input: BrandIdentityInput): BrandIdentityOutput {
  console.log('[agent-2.3] Converting brand identity settings...', {
    logoIntegrity: input.logoIntegrity,
    logoDepth: input.logoDepth,
    hasLogo: !!input.logoUrl,
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERT LOGO INTEGRITY SLIDER (1-10) → SEMANTIC LEVEL
  // ═══════════════════════════════════════════════════════════════════════════
  
  let logo_integrity: BrandIdentityOutput['logo_integrity'];
  
  if (input.logoIntegrity >= 1 && input.logoIntegrity <= 3) {
    logo_integrity = 'flexible';
  } else if (input.logoIntegrity >= 4 && input.logoIntegrity <= 6) {
    logo_integrity = 'moderate';
  } else if (input.logoIntegrity >= 7 && input.logoIntegrity <= 9) {
    logo_integrity = 'strict';
  } else {
    logo_integrity = 'exact';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERT LOGO DEPTH SLIDER (1-5) → DEPTH DESCRIPTOR
  // ═══════════════════════════════════════════════════════════════════════════
  
  let logo_depth: BrandIdentityOutput['logo_depth'];
  
  if (input.logoDepth === 1) {
    logo_depth = 'flat';
  } else if (input.logoDepth === 2) {
    logo_depth = 'subtle';
  } else if (input.logoDepth === 3) {
    logo_depth = 'moderate';
  } else if (input.logoDepth === 4) {
    logo_depth = 'embossed';
  } else {
    logo_depth = 'extruded';
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND COLORS PASS-THROUGH
  // ═══════════════════════════════════════════════════════════════════════════
  
  const output: BrandIdentityOutput = {
    logo_integrity,
    logo_depth,
    brand_colors: {
      primary: input.brandPrimaryColor,
      secondary: input.brandSecondaryColor,
    },
  };
  
  console.log('[agent-2.3] Brand identity conversion complete:', {
    integrity: logo_integrity,
    depth: logo_depth,
    colors: output.brand_colors,
  });
  
  return output;
}

