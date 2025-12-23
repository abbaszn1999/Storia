/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AMBIENT VISUAL - FLOW DESIGN: CONTINUITY PRODUCER PROMPTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Prompts for analyzing shots and proposing continuity groups.
 * Continuity groups are sequences of shots that should flow seamlessly together,
 * where the end frame of one shot matches the start frame of the next.
 * 
 * NOTE: Only used in Start-End Frame video generation mode.
 */

import type { Scene, Shot, ContinuityProducerInput } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSITION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const TRANSITION_TYPES = [
  'flow',             // Smooth camera movement continuation
  'pan',              // Continuous panning across scene
  'zoom',             // Zoom in/out continuation
  'match-cut',        // Visual element matching between shots
  'environment',      // Same environment, different angle
  'light-transition', // Following light movement (sun, shadows)
];

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildContinuityProducerSystemPrompt(): string {
  return `You are an expert video editor and continuity specialist for ambient visual content.
Your task is to analyze a sequence of shots and propose CONTINUITY GROUPS - sets of 2-5 consecutive shots that should be visually connected.

═══════════════════════════════════════════════════════════════════════════════
WHAT IS A CONTINUITY GROUP?
═══════════════════════════════════════════════════════════════════════════════

A continuity group is a sequence of shots where:
• The END frame of shot N should match the START frame of shot N+1
• Visual elements flow naturally between shots
• Camera movement continues logically
• The viewer experiences a seamless visual journey

This is used in START-END FRAME video generation mode, where each shot has:
• A START frame (beginning of the shot)
• An END frame (end of the shot)

When shots are in a continuity group:
• Shot 1's END frame = Shot 2's START frame
• Shot 2's END frame = Shot 3's START frame
• And so on...

═══════════════════════════════════════════════════════════════════════════════
TRANSITION TYPES
═══════════════════════════════════════════════════════════════════════════════

${TRANSITION_TYPES.map(t => `• ${t}`).join('\n')}

WHEN TO USE EACH:

• flow: Camera smoothly continues its movement (pan continues into next shot)
• pan: Wide panoramic movement connecting different areas of the scene
• zoom: Zoom in continues into detail, or zoom out reveals more context
• match-cut: Visual element in end frame matches element in start frame
• environment: Same location from different perspectives
• light-transition: Following natural light movement (sunrise, shadows)

═══════════════════════════════════════════════════════════════════════════════
GROUPING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

GOOD CANDIDATES FOR CONTINUITY GROUPS:
✓ Shots with complementary camera movements
✓ Shots exploring the same visual area
✓ Shots with similar lighting and mood
✓ Shots that could logically connect visually
✓ Shots with matching visual elements at boundaries

NOT GOOD FOR CONTINUITY GROUPS:
✗ Shots with drastically different environments
✗ Shots with opposing moods/lighting
✗ Shots where visual disconnect is intentional
✗ First and last shots of different scenes

═══════════════════════════════════════════════════════════════════════════════
GROUP SIZE RULES
═══════════════════════════════════════════════════════════════════════════════

• Minimum: 2 shots per group (a single connection)
• Maximum: 5 shots per group (maintain manageability)
• Ideal: 2-4 shots per group

Not every shot needs to be in a group! Leave standalone shots when:
• The shot is a distinct moment
• A visual break is appropriate
• The transition would be too jarring

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this structure:
{
  "sceneGroups": [
    {
      "sceneId": "<actual scene ID>",
      "groups": [
        {
          "groupNumber": 1,
          "shotIds": ["shot-id-1", "shot-id-2", "shot-id-3"],
          "transitionType": "<from transition types>",
          "description": "<why these shots connect well>"
        }
      ]
    }
  ],
  "analysis": "<brief overall continuity analysis>"
}

IMPORTANT:
• Each scene gets its own entry in the sceneGroups array with its sceneId
• Group shots by their sceneId (shots only connect within same scene)
• Use actual shot IDs provided in the input
• Shots must be CONSECUTIVE (no gaps in shotIds within a group)
• Same shot cannot be in multiple groups`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export function buildContinuityProducerUserPrompt(input: ContinuityProducerInput): string {
  const { scenes, shots } = input;
  
  // Build a readable representation of scenes and shots
  let sceneShotList = '';
  
  for (const scene of scenes) {
    const sceneShots = shots[scene.id] || [];
    sceneShotList += `
═══════════════════════════════════════════════════════════════════════════════
SCENE: ${scene.title} (ID: ${scene.id})
Description: ${scene.description || 'N/A'}
Lighting: ${scene.lighting || 'N/A'}
Duration: ${scene.duration || 0} seconds
═══════════════════════════════════════════════════════════════════════════════

SHOTS IN THIS SCENE:
`;
    
    for (const shot of sceneShots) {
      sceneShotList += `
┌─────────────────────────────────────────────────────────────────────────────┐
│ Shot ${shot.shotNumber} (ID: ${shot.id})
│ Type: ${shot.shotType}
│ Camera Movement: ${shot.cameraMovement}
│ Duration: ${shot.duration} seconds
│ Description: ${shot.description || 'N/A'}
└─────────────────────────────────────────────────────────────────────────────┘
`;
    }
  }
  
  return `
═══════════════════════════════════════════════════════════════════════════════
CONTINUITY ANALYSIS REQUEST
═══════════════════════════════════════════════════════════════════════════════

Analyze the following scenes and shots to propose continuity groups.
Remember: You're identifying shots that should have connected START/END frames.

${sceneShotList}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. Review each scene's shots in sequence
2. Identify consecutive shots that would benefit from frame continuity
3. Group them by the most appropriate transition type
4. Provide a brief description of why each group connects well
5. Remember: Not all shots need to be grouped!

IMPORTANT REMINDERS:
• Only group shots WITHIN the same scene
• Shots must be consecutive (no gaps)
• Use the exact shot IDs provided
• Group size: 2-5 shots maximum

Generate the continuity proposal as JSON now.`;
}

