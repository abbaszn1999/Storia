/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENT 5.2: VOICEOVER SCRIPT ARCHITECT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Voiceover Script Architect agent that generates precisely-timed voiceover
 * scripts for commercial video beats. Handles both user-provided dialogue and
 * generating scripts from scratch.
 * 
 * INPUT:
 * - Beat information from Agent 3.2
 * - Voiceover settings from Tab 1
 * - Strategic context from user inputs (replaces Agent 1.1)
 * - Product info from user inputs (replaces Agent 2.1)
 * - Narrative context from Agent 3.0/3.2
 * - Character info (if applicable) from user inputs (character planning removed)
 * 
 * OUTPUT:
 * - Precisely-timed voiceover scripts for each beat (8 seconds each)
 * - Dialogue lines with timestamps, durations, word counts
 * - Full script (when generated from scratch)
 */

import { callTextModel } from '../../../../ai/service';
import { getModelConfig } from '../../../../ai/config';
import {
  VOICEOVER_SCRIPT_ARCHITECT_SYSTEM_PROMPT,
  buildVoiceoverScriptUserPrompt,
  VOICEOVER_SCRIPT_SCHEMA,
} from '../../prompts/tab-3/voiceover-script-prompts';
import type {
  VoiceoverScriptInput,
  VoiceoverScriptOutput,
} from '../../types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-5.2', // High reasoning for script generation
  temperature: 0.7, // More creative for script writing
  maxRetries: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate voiceover scripts for all beats
 */
export async function generateVoiceoverScripts(
  input: VoiceoverScriptInput,
  userId: string,
  workspaceId: string
): Promise<VoiceoverScriptOutput> {
  const startTime = Date.now();
  
  console.log('[social-commerce:agent-5.2] Starting voiceover script generation:', {
    userId,
    workspaceId,
    beatCount: input.beats.length,
    hasUserDialogue: !!(input.voiceoverSettings.existingDialogue && input.voiceoverSettings.existingDialogue.length > 0),
    language: input.voiceoverSettings.language,
    tempo: input.voiceoverSettings.tempo,
    timestamp: new Date().toISOString(),
  });

  try {
    // Build prompts
    const systemPrompt = VOICEOVER_SCRIPT_ARCHITECT_SYSTEM_PROMPT;
    const userPrompt = buildVoiceoverScriptUserPrompt(input);

    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK REASONING SUPPORT
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Check if model supports reasoning
    let supportsReasoning = false;
    try {
      const modelConfig = getModelConfig(AGENT_CONFIG.provider, AGENT_CONFIG.model);
      supportsReasoning = modelConfig.metadata?.reasoning === true;
    } catch {
      // Model not found in config, assume no reasoning support
    }

    // Call AI model with structured output
    const response = await callTextModel(
      {
        provider: AGENT_CONFIG.provider,
        model: AGENT_CONFIG.model,
        task: 'generate',
        payload: {
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'voiceover_script_output',
              strict: true,
              schema: VOICEOVER_SCRIPT_SCHEMA,
            },
          },
          // Conditionally add reasoning if supported (temperature not supported with reasoning)
          ...(supportsReasoning ? { reasoning: { effort: "high" } } : { temperature: AGENT_CONFIG.temperature }),
        },
        userId,
        workspaceId,
      },
      {
        skipCreditCheck: false,
      }
    );

    // Parse and validate response
    const rawOutput = response.output.trim();
    const parsed = JSON.parse(rawOutput);
    const output = parsed as VoiceoverScriptOutput;

    if (!output || !output.beat_scripts || !Array.isArray(output.beat_scripts)) {
      throw new Error('Invalid response structure from voiceover script agent');
    }

    // Validate beat count matches
    if (output.beat_scripts.length !== input.beats.length) {
      console.warn('[social-commerce:agent-5.2] Beat count mismatch:', {
        expected: input.beats.length,
        received: output.beat_scripts.length,
      });
    }

    // Validate timing for each beat
    for (const beatScript of output.beat_scripts) {
      const totalDialogueDuration = beatScript.voiceoverScript.dialogue.reduce(
        (sum, line) => sum + line.duration,
        0
      );
      
      // Allow some tolerance (6.5-8.0 seconds is acceptable)
      if (totalDialogueDuration < 6.5 || totalDialogueDuration > 8.5) {
        console.warn(`[social-commerce:agent-5.2] Beat ${beatScript.beatId} timing warning:`, {
          totalDuration: totalDialogueDuration,
          expected: '6.5-8.0 seconds',
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log('[social-commerce:agent-5.2] Voiceover script generation completed:', {
      userId,
      workspaceId,
      beatCount: output.beat_scripts.length,
      durationMs: duration,
      durationSeconds: (duration / 1000).toFixed(2),
      hasFullScript: !!output.fullScript,
    });

    return output;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[social-commerce:agent-5.2] Error generating voiceover scripts:', {
      error: errorMessage,
      stack: errorStack,
      userId,
      workspaceId,
      timestamp: new Date().toISOString(),
    });
    
    throw new Error(`Failed to generate voiceover scripts: ${errorMessage}`);
  }
}

