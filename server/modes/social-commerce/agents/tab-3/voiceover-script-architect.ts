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
// POST-PROCESSING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Post-process voiceover scripts to validate output
 * IMPORTANT: We do NOT remove SSML tags or audio tags - ElevenLabs reads them directly!
 * This function only validates the structure and logs the results.
 */
function postProcessVoiceoverScripts(
  output: VoiceoverScriptOutput,
  input: VoiceoverScriptInput
): VoiceoverScriptOutput {
  console.log('[social-commerce:agent-5.2] Validating voiceover scripts (keeping SSML breaks and audio tags)...');

  // Log each beat script (no cleaning - we keep SSML tags and audio tags)
  output.beat_scripts.forEach(beatScript => {
    console.log(`[social-commerce:agent-5.2] Beat ${beatScript.beatId} script:`, {
      scriptLength: beatScript.voiceoverScript.script?.length || 0,
      scriptPreview: beatScript.voiceoverScript.script?.substring(0, 100) + '...',
      totalDuration: beatScript.voiceoverScript.totalDuration,
      totalWordCount: beatScript.voiceoverScript.totalWordCount,
    });
  });

  // Return output as-is (no cleaning - SSML breaks and audio tags are kept for ElevenLabs)
  return output;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate voiceover scripts for all beats
 */
export async function generateVoiceoverScripts(
  input: VoiceoverScriptInput,
  userId: string,
  workspaceId: string,
  usageType?: string,
  usageMode?: string
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
      metadata: { usageType, usageMode },
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
      console.error('[social-commerce:agent-5.2] Beat count mismatch:', {
        expected: input.beats.length,
        received: output.beat_scripts.length,
        expectedBeatIds: input.beats.map(b => b.beatId),
        receivedBeatIds: output.beat_scripts.map(b => b.beatId),
      });
      throw new Error(`Expected ${input.beats.length} beat scripts, but received ${output.beat_scripts.length}. Please ensure all beats are included.`);
    }

    // Validate all expected beats are present
    const expectedBeatIds = new Set(input.beats.map(b => b.beatId));
    const receivedBeatIds = new Set(output.beat_scripts.map(b => b.beatId));
    const missingBeats = Array.from(expectedBeatIds).filter(id => !receivedBeatIds.has(id));
    const extraBeats = Array.from(receivedBeatIds).filter(id => !expectedBeatIds.has(id));

    if (missingBeats.length > 0) {
      console.error('[social-commerce:agent-5.2] Missing beats:', {
        missingBeats,
        expectedBeatIds: Array.from(expectedBeatIds),
        receivedBeatIds: Array.from(receivedBeatIds),
      });
      throw new Error(`Missing beat scripts for: ${missingBeats.join(', ')}. Please ensure all beats are included.`);
    }

    if (extraBeats.length > 0) {
      console.warn('[social-commerce:agent-5.2] Extra beats (will be ignored):', {
        extraBeats,
        expectedBeatIds: Array.from(expectedBeatIds),
        receivedBeatIds: Array.from(receivedBeatIds),
      });
    }

    // Validate script text exists for each beat
    for (const beatScript of output.beat_scripts) {
      if (!beatScript.voiceoverScript.script || beatScript.voiceoverScript.script.trim().length === 0) {
        console.warn(`[social-commerce:agent-5.2] Beat ${beatScript.beatId} missing script text`);
      }
      
      // Validate duration is approximately 8 seconds
      const duration = beatScript.voiceoverScript.totalDuration;
      if (duration < 6 || duration > 10) {
        console.warn(`[social-commerce:agent-5.2] Beat ${beatScript.beatId} duration warning:`, {
          duration,
          expected: 'approximately 8 seconds',
        });
      }
    }

    // Post-process to add SSML breaks and audio tags
    const processedOutput = postProcessVoiceoverScripts(output, input);

    const duration = Date.now() - startTime;
    console.log('[social-commerce:agent-5.2] Voiceover script generation completed:', {
      userId,
      workspaceId,
      beatCount: processedOutput.beat_scripts.length,
      durationMs: duration,
      durationSeconds: (duration / 1000).toFixed(2),
      hasFullScript: !!processedOutput.fullScript,
    });

    return processedOutput;
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

