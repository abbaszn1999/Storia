/**
 * Shotstack Timeline Builder
 * 
 * Converts ambient-visual scenes, shots, and audio data into
 * Shotstack Edit API timeline format with proper loop expansion.
 */

import type {
  ShotstackEdit,
  Timeline,
  Track,
  Clip,
  VideoAsset,
  AudioAsset,
  Transition,
  TransitionEffect,
  TimelineBuilderInput,
  TimelineBuilderOutput,
  TimelineScene,
  TimelineShot,
  TimelineShotVersion,
  VolumeSettings,
} from './types';

/**
 * Map transition names to Shotstack transition effects
 */
const TRANSITION_MAP: Record<string, TransitionEffect> = {
  'fade': 'fade',
  'wipe': 'wipeRight',
  'wipe-left': 'wipeLeft',
  'wipe-right': 'wipeRight',
  'wipe-up': 'wipeUp',
  'wipe-down': 'wipeDown',
  'slide': 'slideRight',
  'slide-left': 'slideLeft',
  'slide-right': 'slideRight',
  'slide-up': 'slideUp',
  'slide-down': 'slideDown',
  'zoom': 'zoom',
  'reveal': 'reveal',
};

/**
 * Build a Shotstack Edit from ambient-visual data
 * 
 * This is the main entry point for timeline building.
 * It handles the complete conversion including:
 * - Loop expansion (shots first, then scenes)
 * - Multi-track audio (SFX synced with video, plus voiceover/music/ambient)
 * - Transition effects between clips
 * - Volume normalization
 * 
 * @param input Timeline builder input data
 * @returns Shotstack Edit ready for rendering
 */
export function buildShotstackTimeline(input: TimelineBuilderInput): TimelineBuilderOutput {
  console.log('[TimelineBuilder] Building timeline:', {
    sceneCount: input.scenes.length,
    shotCount: Object.values(input.shots).flat().length,
    hasVoiceover: !!input.audioTracks.voiceover,
    hasMusic: !!input.audioTracks.music,
    hasAmbient: !!input.audioTracks.ambient,
  });

  // Debug: Log actual volume values being used
  console.log('[TimelineBuilder] Volume settings:', {
    master: input.volumes.master,
    sfx: input.volumes.sfx,
    voiceover: input.volumes.voiceover,
    music: input.volumes.music,
    ambient: input.volumes.ambient,
    sfxFinal: input.volumes.sfx * input.volumes.master,
    voiceoverFinal: input.volumes.voiceover * input.volumes.master,
    musicFinal: input.volumes.music * input.volumes.master,
    sfxClipsCount: input.sfxClips?.length || 0,
  });

  // Build video and SFX clips with loop expansion
  const { videoClips, sfxClips, totalDuration } = buildExpandedClips(
    input.scenes,
    input.shots,
    input.shotVersions,
    input.volumes
  );

  // Build tracks array (video on top, audio layers below)
  const tracks: Track[] = [];

  // Track 1: Video clips (silent - audio is separate)
  if (videoClips.length > 0) {
    tracks.push({ clips: videoClips });
  }

  // Track 2: Sound effects (from individual shot.soundEffectUrl)
  if (sfxClips.length > 0) {
    tracks.push({ clips: sfxClips });
  }

  // Track 2b: Sound effects from sfxClips array (ambient-visual mode)
  // This is used when SFX is stored as a separate array of audio tracks
  const sfxVolume = input.volumes.sfx * input.volumes.master;
  if (input.sfxClips && input.sfxClips.length > 0 && sfxVolume > 0) {
    const sfxClipsFromArray = input.sfxClips.map(sfx => 
      buildAudioClip(
        sfx.src,
        sfx.start,
        sfx.duration,
        sfxVolume
      )
    );
    tracks.push({ clips: sfxClipsFromArray });
    console.log('[TimelineBuilder] Added SFX track from array:', {
      clipCount: sfxClipsFromArray.length,
      volume: sfxVolume,
    });
  }

  // Track 3: Voiceover (if present AND volume > 0)
  const voiceoverVolume = input.volumes.voiceover * input.volumes.master;
  if (input.audioTracks.voiceover && voiceoverVolume > 0) {
    const voiceoverClip = buildAudioClip(
      input.audioTracks.voiceover.src,
      0,
      totalDuration, // Voiceover spans entire video
      voiceoverVolume,
      input.audioTracks.voiceover.fadeIn,
      input.audioTracks.voiceover.fadeOut
    );
    tracks.push({ clips: [voiceoverClip] });
  }

  // Track 4: Background music (if present AND volume > 0)
  const musicVolume = input.volumes.music * input.volumes.master;
  if (input.audioTracks.music && musicVolume > 0) {
    const musicClip = buildAudioClip(
      input.audioTracks.music.src,
      0,
      totalDuration, // Music spans entire video
      musicVolume,
      input.audioTracks.music.fadeIn,
      input.audioTracks.music.fadeOut
    );
    tracks.push({ clips: [musicClip] });
  }

  // Track 5: Ambient sound (if present AND volume > 0)
  const ambientVolume = input.volumes.ambient * input.volumes.master;
  if (input.audioTracks.ambient && ambientVolume > 0) {
    const ambientClip = buildAudioClip(
      input.audioTracks.ambient.src,
      0,
      totalDuration, // Ambient spans entire video
      ambientVolume,
      input.audioTracks.ambient.fadeIn,
      input.audioTracks.ambient.fadeOut
    );
    tracks.push({ clips: [ambientClip] });
  }

  // Build timeline
  const timeline: Timeline = {
    tracks,
    background: '#000000',
    cache: true,
  };

  // Build output settings
  const outputConfig: ShotstackEdit['output'] = {
    format: input.output.format,
    resolution: input.output.resolution,
    aspectRatio: input.output.aspectRatio,
    fps: input.output.fps || 30,
  };

  // Add thumbnail settings if provided (for final renders)
  if (input.output.thumbnail) {
    outputConfig.thumbnail = {
      capture: input.output.thumbnail.capture,
      scale: input.output.thumbnail.scale,
    };
  }

  const edit: ShotstackEdit = {
    timeline,
    output: outputConfig,
  };

  const clipCount = tracks.reduce((sum, track) => sum + track.clips.length, 0);

  console.log('[TimelineBuilder] Timeline built:', {
    trackCount: tracks.length,
    clipCount,
    totalDuration,
    format: input.output.format,
    resolution: input.output.resolution,
  });

  return {
    edit,
    totalDuration,
    clipCount,
  };
}

/**
 * Build video and SFX clips with loop expansion
 * 
 * Loop Expansion Order:
 * 1. Shot loops are applied first - each shot repeats by its loopCount
 * 2. Scene loops are applied second - entire scene (with shot loops) repeats
 */
function buildExpandedClips(
  scenes: TimelineScene[],
  shots: Record<string, TimelineShot[]>,
  shotVersions: Record<string, TimelineShotVersion[]>,
  volumes: VolumeSettings
): { videoClips: Clip[]; sfxClips: Clip[]; totalDuration: number } {
  const videoClips: Clip[] = [];
  const sfxClips: Clip[] = [];
  let currentTime = 0;

  // Sort scenes by sceneNumber
  const sortedScenes = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);

  for (const scene of sortedScenes) {
    const sceneLoopCount = scene.loopCount ?? 1;
    const sceneShots = (shots[scene.id] || []).sort((a, b) => a.shotNumber - b.shotNumber);

    if (sceneShots.length === 0) {
      console.warn(`[TimelineBuilder] Scene ${scene.id} has no shots, skipping`);
      continue;
    }

    // Repeat entire scene by scene loop count
    for (let sceneIteration = 0; sceneIteration < sceneLoopCount; sceneIteration++) {
      
      // Process each shot in the scene
      for (let shotIndex = 0; shotIndex < sceneShots.length; shotIndex++) {
        const shot = sceneShots[shotIndex];
        const shotLoopCount = shot.loopCount ?? 1;
        const version = getLatestVersion(shotVersions, shot.id);
        const isLastShotInScene = shotIndex === sceneShots.length - 1;
        const isLastSceneIteration = sceneIteration === sceneLoopCount - 1;

        if (!version?.videoUrl) {
          console.warn(`[TimelineBuilder] Shot ${shot.id} has no video URL, skipping`);
          continue;
        }

        // Repeat shot by shot loop count
        for (let shotIteration = 0; shotIteration < shotLoopCount; shotIteration++) {
          const isLastShotIteration = shotIteration === shotLoopCount - 1;
          
          // Determine transition (only on last iteration of shot, before next shot)
          let transition: Transition | undefined;
          if (isLastShotIteration && !isLastShotInScene) {
            // Apply transition between shots (within scene)
            transition = buildTransition(shot.transition);
          } else if (isLastShotIteration && isLastShotInScene && !isLastSceneIteration) {
            // Apply transition at end of scene iteration (before scene repeats)
            transition = buildTransition('fade');
          }

          // Add video clip (muted - audio comes from SFX track)
          const videoClip = buildVideoClip(
            version.videoUrl,
            currentTime,
            shot.duration,
            0, // Volume 0 - video is silent, audio is separate
            transition
          );
          videoClips.push(videoClip);

          // Add SFX clip if exists (synced with video)
          // Sound effects are stored separately as audio-only files
          if (shot.soundEffectUrl) {
            const sfxClip = buildAudioClip(
              shot.soundEffectUrl,
              currentTime,
              shot.duration,
              volumes.sfx * volumes.master
            );
            sfxClips.push(sfxClip);
          }

          currentTime += shot.duration;
        }
      }
    }
  }

  return { videoClips, sfxClips, totalDuration: currentTime };
}

/**
 * Get the latest version for a shot
 */
function getLatestVersion(
  shotVersions: Record<string, TimelineShotVersion[]>,
  shotId: string
): TimelineShotVersion | null {
  const versions = shotVersions[shotId];
  if (!versions || versions.length === 0) {
    return null;
  }
  return versions[versions.length - 1];
}

/**
 * Build a video clip
 */
function buildVideoClip(
  src: string,
  start: number,
  length: number,
  volume: number = 0,
  transition?: Transition
): Clip {
  const asset: VideoAsset = {
    type: 'video',
    src,
    volume,
  };

  const clip: Clip = {
    asset,
    start,
    length,
    fit: 'cover',
  };

  if (transition) {
    clip.transition = transition;
  }

  return clip;
}

/**
 * Build an audio clip
 */
function buildAudioClip(
  src: string,
  start: number,
  length: number,
  volume: number = 1,
  fadeIn?: boolean,
  fadeOut?: boolean
): Clip {
  let effect: 'fadeIn' | 'fadeOut' | 'fadeInFadeOut' | undefined;
  
  if (fadeIn && fadeOut) {
    effect = 'fadeInFadeOut';
  } else if (fadeIn) {
    effect = 'fadeIn';
  } else if (fadeOut) {
    effect = 'fadeOut';
  }

  const asset: AudioAsset = {
    type: 'audio',
    src,
    volume,
    effect,
  };

  return {
    asset,
    start,
    length,
  };
}

/**
 * Build a transition from transition name
 */
function buildTransition(transitionName?: string | null): Transition | undefined {
  if (!transitionName || transitionName === 'cut' || transitionName === 'none') {
    return undefined;
  }

  const effect = TRANSITION_MAP[transitionName.toLowerCase()] || 'fade';
  
  return {
    out: effect,
  };
}

/**
 * Calculate total duration with loops (useful for frontend display)
 */
export function calculateTotalDuration(
  scenes: TimelineScene[],
  shots: Record<string, TimelineShot[]>
): number {
  let total = 0;

  for (const scene of scenes) {
    const sceneLoopCount = scene.loopCount ?? 1;
    const sceneShots = shots[scene.id] || [];
    
    // Calculate single scene iteration duration
    let sceneDuration = 0;
    for (const shot of sceneShots) {
      const shotLoopCount = shot.loopCount ?? 1;
      sceneDuration += shot.duration * shotLoopCount;
    }
    
    // Multiply by scene loop count
    total += sceneDuration * sceneLoopCount;
  }

  return total;
}

/**
 * Validate timeline builder input
 */
export function validateTimelineInput(input: TimelineBuilderInput): string[] {
  const errors: string[] = [];

  if (!input.scenes || input.scenes.length === 0) {
    errors.push('No scenes provided');
  }

  if (!input.shots || Object.keys(input.shots).length === 0) {
    errors.push('No shots provided');
  }

  // Check that all scenes have shots
  for (const scene of input.scenes || []) {
    const sceneShots = input.shots[scene.id];
    if (!sceneShots || sceneShots.length === 0) {
      errors.push(`Scene ${scene.sceneNumber} (${scene.title}) has no shots`);
    }
  }

  // Check that all shots have video URLs
  for (const [sceneId, sceneShots] of Object.entries(input.shots || {})) {
    for (const shot of sceneShots) {
      const version = getLatestVersion(input.shotVersions, shot.id);
      if (!version?.videoUrl) {
        errors.push(`Shot ${shot.shotNumber} in scene ${sceneId} has no video`);
      }
    }
  }

  return errors;
}

