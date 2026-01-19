import { Router, Request, Response } from 'express';
import { isAuthenticated, getCurrentUserId } from '../../../../auth';
import { callAi } from '../../../../ai/service';
import { storage } from '../../../../storage';
import { bunnyStorage, buildVideoModePath } from '../../../../storage/bunny-storage';

const router = Router();

/**
 * Voice mood to ElevenLabs v3 audio tag mapping
 * These tags enhance emotional expression in the generated audio
 * 
 * NOTE: ElevenLabs v3 (Alpha) only accepts 3 stability values:
 * - 0.0 = Creative (most expressive, responds to audio tags)
 * - 0.5 = Natural (balanced)
 * - 1.0 = Robust (most stable, less responsive to tags)
 */
type VoiceMood = 'neutral' | 'happy' | 'sad' | 'excited' | 'angry' | 'whisper' | 'dramatic' | 'curious' | 'thoughtful' | 'surprised' | 'sarcastic' | 'nervous';

const MOOD_TO_AUDIO_TAGS: Record<VoiceMood, { prefix: string; stability: number }> = {
  neutral: { prefix: '', stability: 0.5 },
  happy: { prefix: '[happy] ', stability: 0.0 },
  sad: { prefix: '[sad] ', stability: 0.5 },
  excited: { prefix: '[excited] ', stability: 0.0 },
  angry: { prefix: '[angry] ', stability: 0.0 },
  whisper: { prefix: '[whispers] ', stability: 1.0 },
  dramatic: { prefix: '[dramatically] ', stability: 0.0 },
  curious: { prefix: '[curious] ', stability: 0.5 },
  thoughtful: { prefix: '[thoughtful] ', stability: 0.5 },
  surprised: { prefix: '[surprised] ', stability: 0.0 },
  sarcastic: { prefix: '[sarcastic] ', stability: 0.5 },
  nervous: { prefix: '[nervously] ', stability: 0.0 },
};

/**
 * Detect mood from text based on ElevenLabs audio tags
 */
function detectMoodFromText(text: string): { mood: VoiceMood; cleanText: string } {
  const moodPatterns: { pattern: RegExp; mood: VoiceMood }[] = [
    { pattern: /^\[happy\]\s*/i, mood: 'happy' },
    { pattern: /^\[sad\]\s*/i, mood: 'sad' },
    { pattern: /^\[excited\]\s*/i, mood: 'excited' },
    { pattern: /^\[angry\]\s*/i, mood: 'angry' },
    { pattern: /^\[whispers?\]\s*/i, mood: 'whisper' },
    { pattern: /^\[dramatically\]\s*/i, mood: 'dramatic' },
    { pattern: /^\[curious\]\s*/i, mood: 'curious' },
    { pattern: /^\[thoughtful\]\s*/i, mood: 'thoughtful' },
    { pattern: /^\[surprised\]\s*/i, mood: 'surprised' },
    { pattern: /^\[sarcastic\]\s*/i, mood: 'sarcastic' },
    { pattern: /^\[nervously\]\s*/i, mood: 'nervous' },
  ];

  for (const { pattern, mood } of moodPatterns) {
    if (pattern.test(text)) {
      return { mood, cleanText: text };
    }
  }

  return { mood: 'neutral', cleanText: text };
}

/**
 * Generate voiceover audio using ElevenLabs v3
 */
async function generateVoiceoverAudio(
  text: string,
  voiceId: string,
  userId: string,
  workspaceId: string,
  mood?: VoiceMood
): Promise<Buffer> {
  const { mood: detectedMood, cleanText } = detectMoodFromText(text);
  const finalMood = mood || detectedMood;
  const moodConfig = MOOD_TO_AUDIO_TAGS[finalMood] || MOOD_TO_AUDIO_TAGS.neutral;

  console.log('[VoiceoverPreview] Generating audio with ElevenLabs v3:', {
    textLength: text.length,
    voiceId,
    mood: finalMood,
    stability: moodConfig.stability,
  });

  const response = await callAi(
    {
      provider: "elevenlabs",
      model: "eleven-v3",
      task: "text-to-speech",
      payload: {
        text: cleanText,
        voice_id: voiceId,
        model_id: "eleven_v3",
        voice_settings: {
          stability: moodConfig.stability,
          similarity_boost: 0.75,
          style: finalMood === 'dramatic' ? 0.3 : 0,
          use_speaker_boost: true,
        },
      },
      userId,
      workspaceId,
    },
    {
      skipCreditCheck: false,
    }
  );

  let audioBuffer: Buffer;
  const output = response.output as any;

  if (output && output.audio) {
    audioBuffer = output.audio;
  } else if (Buffer.isBuffer(response.output)) {
    audioBuffer = response.output;
  } else if (output && output.audio_base64) {
    audioBuffer = Buffer.from(output.audio_base64, 'base64');
  } else {
    throw new Error("Invalid audio output received from ElevenLabs");
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error("Empty audio buffer received");
  }

  return audioBuffer;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /generate - Generate voiceover and save to Bunny CDN
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { videoId, beatId, text, voiceId } = req.body;
    const userId = getCurrentUserId(req);

    if (!videoId || !beatId || !text) {
      return res.status(400).json({ error: 'videoId, beatId, and text are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get video info
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get workspace info
    const workspace = await storage.getWorkspace(video.workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if audio already exists
    const step4Data = video.step4Data as any || {};
    if (step4Data.voiceoverAudios?.[beatId]?.audioUrl) {
      console.log('[VoiceoverGenerate] Audio already exists for beat:', beatId);
      return res.json({
        audioUrl: step4Data.voiceoverAudios[beatId].audioUrl,
        cached: true,
      });
    }

    // Default voice if not provided
    const selectedVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL';

    // Generate audio
    console.log('[VoiceoverGenerate] Generating audio for beat:', beatId);
    const audioBuffer = await generateVoiceoverAudio(
      text,
      selectedVoiceId,
      userId,
      video.workspaceId
    );

    // Build Bunny CDN path
    const audioFileName = `voiceover_${beatId}_${Date.now()}.mp3`;
    const audioPath = buildVideoModePath({
      userId,
      workspaceName: workspace.name,
      toolMode: 'commerce',
      projectName: video.title || 'untitled',
      subFolder: 'Voice-Over',
      filename: audioFileName,
    });

    // Upload to Bunny CDN
    console.log('[VoiceoverGenerate] Uploading audio to Bunny CDN...');
    const audioCdnUrl = await bunnyStorage.uploadFile(
      audioPath,
      audioBuffer,
      'audio/mpeg'
    );

    console.log('[VoiceoverGenerate] ✓ Audio uploaded to CDN:', audioCdnUrl);

    // Calculate approximate duration (based on file size, ~16kbps for mp3)
    // Duration is stored in SECONDS (see VoiceoverAudioData interface)
    let estimatedDuration = Math.round(audioBuffer.length / 2000);

    // Validate duration is reasonable (0-300 seconds)
    // If duration seems invalid, use default beat duration (12 seconds)
    if (estimatedDuration <= 0 || estimatedDuration > 300) {
      console.warn(`[VoiceoverGenerate] Unusual duration calculated: ${estimatedDuration}s (from ${audioBuffer.length} bytes), using default 12s`);
      estimatedDuration = 12; // Default to beat duration
    }

    // Log for debugging
    console.log(`[VoiceoverGenerate] Calculated duration: ${estimatedDuration}s (from ${audioBuffer.length} bytes, ~${Math.round(audioBuffer.length / 1024)}KB)`);

    // Update step4Data with voiceover audio
    const voiceoverAudios = step4Data.voiceoverAudios || {};
    voiceoverAudios[beatId] = {
      audioUrl: audioCdnUrl,
      generatedAt: new Date(),
      voiceId: selectedVoiceId,
      duration: estimatedDuration, // Stored in seconds
    };

    const updatedStep4Data = {
      ...step4Data,
      voiceoverAudios,
    };

    console.log('[VoiceoverGenerate] Saving to database:', {
      videoId,
      beatId,
      existingStep4DataKeys: Object.keys(step4Data),
      newVoiceoverAudios: JSON.stringify(voiceoverAudios),
    });

    try {
      await storage.updateVideo(videoId, {
        step4Data: updatedStep4Data,
      });
      console.log('[VoiceoverGenerate] ✓ Database update completed');
    } catch (dbError) {
      console.error('[VoiceoverGenerate] ✗ Database update FAILED:', dbError);
      // Still return success since audio was uploaded to CDN
      // User will need to regenerate to try saving again
    }

    // Verify the save worked
    try {
      const verifyVideo = await storage.getVideo(videoId);
      const savedVoiceoverAudios = (verifyVideo?.step4Data as any)?.voiceoverAudios;
      console.log('[VoiceoverGenerate] Verification:', {
        hasSavedAudios: !!savedVoiceoverAudios,
        savedBeatIds: savedVoiceoverAudios ? Object.keys(savedVoiceoverAudios) : [],
        savedData: savedVoiceoverAudios ? JSON.stringify(savedVoiceoverAudios) : 'null',
      });
    } catch (verifyError) {
      console.error('[VoiceoverGenerate] Verification failed:', verifyError);
    }

    res.json({
      audioUrl: audioCdnUrl,
      duration: estimatedDuration,
      cached: false,
    });
  } catch (error) {
    console.error('[VoiceoverGenerate] Error:', error);
    res.status(500).json({
      error: 'Failed to generate voiceover',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /audio/:videoId/:beatId - Get saved audio URL for a beat
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/audio/:videoId/:beatId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { videoId, beatId } = req.params;

    // Get video info
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get audio URL from step4Data
    const step4Data = video.step4Data as any || {};
    const audioData = step4Data.voiceoverAudios?.[beatId];

    if (!audioData?.audioUrl) {
      return res.status(404).json({ error: 'Audio not found for this beat' });
    }

    res.json({
      audioUrl: audioData.audioUrl,
      duration: audioData.duration,
      generatedAt: audioData.generatedAt,
      voiceId: audioData.voiceId,
    });
  } catch (error) {
    console.error('[VoiceoverAudio] Error:', error);
    res.status(500).json({
      error: 'Failed to get audio',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /regenerate - Regenerate voiceover (delete old + generate new)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/regenerate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { videoId, beatId, text, voiceId } = req.body;
    const userId = getCurrentUserId(req);

    if (!videoId || !beatId || !text) {
      return res.status(400).json({ error: 'videoId, beatId, and text are required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get video info
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get workspace info
    const workspace = await storage.getWorkspace(video.workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Delete old audio from Bunny if exists
    const step4Data = video.step4Data as any || {};
    const oldAudioUrl = step4Data.voiceoverAudios?.[beatId]?.audioUrl;
    if (oldAudioUrl) {
      try {
        // Extract path from URL and delete from Bunny
        const urlParts = new URL(oldAudioUrl);
        const bunnyPath = urlParts.pathname.substring(1); // Remove leading /
        await bunnyStorage.deleteFile(bunnyPath);
        console.log('[VoiceoverRegenerate] Deleted old audio:', bunnyPath);
      } catch (deleteError) {
        console.warn('[VoiceoverRegenerate] Failed to delete old audio:', deleteError);
        // Continue even if delete fails
      }
    }

    // Default voice if not provided
    const selectedVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL';

    // Generate new audio
    console.log('[VoiceoverRegenerate] Generating new audio for beat:', beatId);
    const audioBuffer = await generateVoiceoverAudio(
      text,
      selectedVoiceId,
      userId,
      video.workspaceId
    );

    // Build Bunny CDN path
    const audioFileName = `voiceover_${beatId}_${Date.now()}.mp3`;
    const audioPath = buildVideoModePath({
      userId,
      workspaceName: workspace.name,
      toolMode: 'commerce',
      projectName: video.title || 'untitled',
      subFolder: 'Voice-Over',
      filename: audioFileName,
    });

    // Upload to Bunny CDN
    console.log('[VoiceoverRegenerate] Uploading new audio to Bunny CDN...');
    const audioCdnUrl = await bunnyStorage.uploadFile(
      audioPath,
      audioBuffer,
      'audio/mpeg'
    );

    console.log('[VoiceoverRegenerate] ✓ New audio uploaded to CDN:', audioCdnUrl);

    // Calculate approximate duration
    const estimatedDuration = Math.round(audioBuffer.length / 2000);

    // Update step4Data with new voiceover audio
    const voiceoverAudios = step4Data.voiceoverAudios || {};
    voiceoverAudios[beatId] = {
      audioUrl: audioCdnUrl,
      generatedAt: new Date(),
      voiceId: selectedVoiceId,
      duration: estimatedDuration,
    };

    const updatedStep4Data = {
      ...step4Data,
      voiceoverAudios,
    };

    console.log('[VoiceoverRegenerate] Saving to database:', {
      videoId,
      beatId,
      existingStep4DataKeys: Object.keys(step4Data),
      newVoiceoverAudios: JSON.stringify(voiceoverAudios),
    });

    try {
      await storage.updateVideo(videoId, {
        step4Data: updatedStep4Data,
      });
      console.log('[VoiceoverRegenerate] ✓ Database update completed');
    } catch (dbError) {
      console.error('[VoiceoverRegenerate] ✗ Database update FAILED:', dbError);
    }

    // Verify the save worked
    try {
      const verifyVideo = await storage.getVideo(videoId);
      const savedVoiceoverAudios = (verifyVideo?.step4Data as any)?.voiceoverAudios;
      console.log('[VoiceoverRegenerate] Verification:', {
        hasSavedAudios: !!savedVoiceoverAudios,
        savedBeatIds: savedVoiceoverAudios ? Object.keys(savedVoiceoverAudios) : [],
      });
    } catch (verifyError) {
      console.error('[VoiceoverRegenerate] Verification failed:', verifyError);
    }

    res.json({
      audioUrl: audioCdnUrl,
      duration: estimatedDuration,
      regenerated: true,
    });
  } catch (error) {
    console.error('[VoiceoverRegenerate] Error:', error);
    res.status(500).json({
      error: 'Failed to regenerate voiceover',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /generate-preview - Quick preview (no save) - for testing voice
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/generate-preview', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { text, voiceId } = req.body;
    const userId = getCurrentUserId(req);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const selectedVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL';

    // Generate audio (skip credit check for preview)
    const { mood: detectedMood, cleanText } = detectMoodFromText(text);
    const moodConfig = MOOD_TO_AUDIO_TAGS[detectedMood] || MOOD_TO_AUDIO_TAGS.neutral;

    const response = await callAi(
      {
        provider: "elevenlabs",
        model: "eleven-v3",
        task: "text-to-speech",
        payload: {
          text: cleanText,
          voice_id: selectedVoiceId,
          model_id: "eleven_v3",
          voice_settings: {
            stability: moodConfig.stability,
            similarity_boost: 0.75,
            style: detectedMood === 'dramatic' ? 0.3 : 0,
            use_speaker_boost: true,
          },
        },
        userId: userId || 'anonymous',
        workspaceId: 'preview',
      },
      {
        skipCreditCheck: true,
      }
    );

    let audioBuffer: Buffer;
    const output = response.output as any;

    if (output && output.audio) {
      audioBuffer = output.audio;
    } else if (Buffer.isBuffer(response.output)) {
      audioBuffer = response.output;
    } else if (output && output.audio_base64) {
      audioBuffer = Buffer.from(output.audio_base64, 'base64');
    } else {
      throw new Error("Invalid audio output received from ElevenLabs");
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.send(audioBuffer);
  } catch (error) {
    console.error('[VoiceoverPreview] Error:', error);
    res.status(500).json({
      error: 'Failed to generate preview',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
