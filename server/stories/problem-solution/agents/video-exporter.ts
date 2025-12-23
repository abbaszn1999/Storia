// Video Export Agent for Problem-Solution Mode
// Merges all scenes, audio, music, and subtitles into final video

import { randomUUID } from "crypto";
import path from "path";
import { existsSync, statSync } from "fs";
import ffmpeg from "fluent-ffmpeg";
import { bunnyStorage, buildStoryModePath } from "../../../storage/bunny-storage";
import type { VideoExportInput, VideoExportOutput } from "../types";
import {
  downloadFile,
  concatenateVideos,
  createVideoFromImages,
  createStaticVideoWithTransitions,
  createVideoFromImagesWithCreativeTransitions,
  createVideoWithCreativeTransitions,
  createSingleAnimatedClip,
  concatenateAudioFiles,
  mergeVoiceover,
  mixBackgroundMusic,
  getTempDir,
  cleanupFiles,
  getVideoDuration,
  adjustVideoSpeed,
  adjustAudioSpeed,
  calculateDualSpeedSync,
  createMutedVideo,
  loopVideo,
  trimVideo,
  type SyncResult,
} from "../services/ffmpeg-helpers";
import type { SceneTransition, ImageAnimation, ImageEffect } from "../types";
import { burnSubtitles } from "../services/subtitle-generator";
import { generateMusic } from "./music-generator";
import { isValidMusicStyle, type MusicStyle } from "../prompts/music-prompts";

const TEMP_DIR = getTempDir();

/**
 * Download all required assets (videos/images and audio files)
 */
async function downloadAssets(
  scenes: VideoExportInput['scenes'],
  animationMode: 'off' | 'transition' | 'video'
) {
  console.log('[video-exporter] ═══════════════════════════════════════════════');
  console.log('[video-exporter] Downloading assets...');
  console.log('[video-exporter] Animation mode:', animationMode);
  
  const videoFiles: string[] = [];
  const imageFiles: string[] = [];
  const audioFiles: string[] = [];
  // Track which scenes have video vs image (for hybrid mode)
  const sceneMediaType: ('video' | 'image')[] = [];
  
  for (const scene of scenes) {
    // Download video or image based on animation mode
    if (animationMode === 'video') {
      // Video mode with HYBRID support: prefer video, fallback to image
      if (scene.videoUrl) {
        // Scene has video - use it
        const videoPath = path.join(TEMP_DIR, `${randomUUID()}_scene${scene.sceneNumber}.mp4`);
        await downloadFile(scene.videoUrl, videoPath);
        videoFiles.push(videoPath);
        sceneMediaType.push('video');
        console.log(`[video-exporter] ✓ Downloaded video for scene ${scene.sceneNumber}`);
      } else if (scene.imageUrl) {
        // Fallback: Scene has only image - will animate it
        const imagePath = path.join(TEMP_DIR, `${randomUUID()}_scene${scene.sceneNumber}.jpg`);
        await downloadFile(scene.imageUrl, imagePath);
        imageFiles.push(imagePath);
        sceneMediaType.push('image');
        console.log(`[video-exporter] ✓ Downloaded image for scene ${scene.sceneNumber} (will animate)`);
      } else {
        console.warn(`[video-exporter] ⚠ Scene ${scene.sceneNumber} missing both videoUrl and imageUrl`);
        sceneMediaType.push('image'); // Placeholder
      }
    } else {
      // 'off' or 'transition' mode: download images
      if (scene.imageUrl) {
        const imagePath = path.join(TEMP_DIR, `${randomUUID()}_scene${scene.sceneNumber}.jpg`);
        await downloadFile(scene.imageUrl, imagePath);
        imageFiles.push(imagePath);
        sceneMediaType.push('image');
        console.log(`[video-exporter] ✓ Downloaded image for scene ${scene.sceneNumber}`);
      } else {
        console.warn(`[video-exporter] ⚠ Scene ${scene.sceneNumber} missing imageUrl in ${animationMode} mode`);
        sceneMediaType.push('image'); // Placeholder
      }
    }
    
    // Download audio (if voiceover enabled)
    if (scene.audioUrl) {
      const audioPath = path.join(TEMP_DIR, `${randomUUID()}_audio${scene.sceneNumber}.mp3`);
      await downloadFile(scene.audioUrl, audioPath);
      audioFiles.push(audioPath);
      console.log(`[video-exporter] ✓ Downloaded audio for scene ${scene.sceneNumber}`);
    }
  }
  
  console.log('[video-exporter] ═══════════════════════════════════════════════');
  console.log('[video-exporter] Assets download summary:');
  console.log('[video-exporter]   Videos:', videoFiles.length);
  console.log('[video-exporter]   Images:', imageFiles.length);
  console.log('[video-exporter]   Audio:', audioFiles.length);
  
  // Log hybrid mode info
  if (animationMode === 'video') {
    const videoCount = sceneMediaType.filter(t => t === 'video').length;
    const imageCount = sceneMediaType.filter(t => t === 'image').length;
    if (imageCount > 0) {
      console.log(`[video-exporter] HYBRID MODE: ${videoCount} videos, ${imageCount} images (will be animated)`);
    }
  }
  
  return { videoFiles, imageFiles, audioFiles, sceneMediaType };
}

/**
 * Get resolution dimensions based on quality and aspect ratio
 */
function getResolution(quality: string, aspectRatio: string): { width: number; height: number } {
  const resolutions: Record<string, { width: number; height: number }> = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 },
  };
  
  let res = resolutions[quality] || resolutions['1080p'];
  
  // Adjust for aspect ratio
  if (aspectRatio === '9:16') {
    // Vertical video - swap dimensions
    return { width: res.height, height: res.width };
  } else if (aspectRatio === '1:1') {
    // Square video
    return { width: res.height, height: res.height };
  }
  
  return res;
}

/**
 * Export final video with all scenes, audio, music, and effects
 * Handles all 12 scenarios based on voiceover, animation mode, music, and text overlay settings
 */
export async function exportFinalVideo(
  input: VideoExportInput,
  userId: string,
  workspaceName: string
): Promise<VideoExportOutput> {
  const startTime = Date.now();
  const tempFiles: string[] = [];
  
  // Track separated assets for real-time volume control
  let videoBaseUrl: string | undefined;  // MUTED video (no audio) for real-time preview
  let voiceoverUrl: string | undefined;  // Merged voiceover audio
  let uploadedMusicUrl: string | undefined;  // Music audio file
  
  try {
    // Determine scenario
    const hasVoiceover = input.scenes.some(s => s.audioUrl);
    const hasCustomMusic = !!input.customMusicUrl; // User-uploaded music (highest priority)
    const hasLegacyMusic = input.backgroundMusic && input.backgroundMusic !== 'none';
    const hasAiMusic = input.musicStyle && input.musicStyle !== 'none' && isValidMusicStyle(input.musicStyle);
    const hasMusic = hasCustomMusic || hasLegacyMusic || hasAiMusic;
    const hasTextOverlay = input.textOverlay && hasVoiceover; // Text overlay ONLY with voiceover
    
    // Should we save separated files for volume control?
    const enableVolumeControl = hasVoiceover && hasMusic;
    
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] EXPORT SCENARIO ANALYSIS');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] Scene count:', input.scenes.length);
    console.log('[video-exporter] Animation mode:', input.animationMode);
    console.log('[video-exporter] Has voiceover:', hasVoiceover);
    console.log('[video-exporter] Has music:', hasMusic, 
      hasCustomMusic ? '(Custom Upload)' : 
      hasAiMusic ? '(AI Generated)' : 
      hasLegacyMusic ? '(Legacy URL)' : ''
    );
    console.log('[video-exporter] Music source:', 
      hasCustomMusic ? 'custom-upload' : 
      hasAiMusic ? `ai-${input.musicStyle}` : 
      hasLegacyMusic ? 'legacy-url' : 'none'
    );
    console.log('[video-exporter] Text overlay enabled:', input.textOverlay);
    console.log('[video-exporter] Will show subtitles:', hasTextOverlay);
    console.log('[video-exporter] Export format:', input.exportFormat);
    console.log('[video-exporter] Export quality:', input.exportQuality);
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    // Step 1: Download all assets
    const assets = await downloadAssets(input.scenes, input.animationMode);
    tempFiles.push(...assets.videoFiles, ...assets.imageFiles, ...assets.audioFiles);
    
    // Step 2: Create video timeline based on animation mode
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 2: Creating Video Timeline');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    let videoTimeline: string;
    // Add 1 second padding to last scene to prevent cutting off last words
    const durations = input.scenes.map((s, index) => {
      const isLastScene = index === input.scenes.length - 1;
      return isLastScene ? s.duration + 1 : s.duration; // +1s for last scene
    });
    
    console.log('[video-exporter] Scene durations (with +1s padding on last):', durations);
    
    // Track audio speeds for subtitle timestamp adjustment (initialized for all modes)
    const audioSpeedsByScene: number[] = input.scenes.map(() => 1.0);
    
    if (input.animationMode === 'video') {
      // Scenario: Video mode - supports HYBRID (mix of videos and animated images)
      const isHybridMode = assets.sceneMediaType.includes('image');
      const videoSceneCount = assets.sceneMediaType.filter(t => t === 'video').length;
      const imageSceneCount = assets.sceneMediaType.filter(t => t === 'image').length;
      
      if (assets.videoFiles.length === 0 && assets.imageFiles.length === 0) {
        throw new Error('Video mode selected but no video or image files available');
      }
      
      console.log('[video-exporter] Mode: Video (image-to-video with intelligent sync)');
      if (isHybridMode) {
        console.log(`[video-exporter] HYBRID MODE: ${videoSceneCount} videos + ${imageSceneCount} animated images`);
      }
      
      // STEP: Create animated clips from images (for hybrid mode)
      // Build unified video clips array matching scene order
      let unifiedVideoClips: string[] = [];
      let videoIndex = 0;
      let imageIndex = 0;
      
      for (let i = 0; i < assets.sceneMediaType.length; i++) {
        if (assets.sceneMediaType[i] === 'video') {
          // Use existing video
          unifiedVideoClips.push(assets.videoFiles[videoIndex]);
          videoIndex++;
        } else {
          // Create animated clip from image
          console.log(`[video-exporter] Scene ${i + 1}: Creating animated clip from image...`);
          const imagePath = assets.imageFiles[imageIndex];
          const targetDuration = durations[i];
          try {
            const animatedClip = await createSingleAnimatedClip(imagePath, targetDuration, 'ken-burns', null, input.aspectRatio);
            tempFiles.push(animatedClip);
            unifiedVideoClips.push(animatedClip);
            console.log(`[video-exporter] Scene ${i + 1}: ✓ Created ${targetDuration}s animated clip`);
          } catch (error) {
            console.error(`[video-exporter] Scene ${i + 1}: Failed to create animated clip:`, error);
            throw new Error(`Failed to create animated clip for scene ${i + 1}`);
          }
          imageIndex++;
        }
      }
      
      console.log(`[video-exporter] Unified clips: ${unifiedVideoClips.length} total`);
      
      // Replace assets.videoFiles with unified clips for the rest of the processing
      const originalVideoFiles = assets.videoFiles;
      assets.videoFiles = unifiedVideoClips;
      
      // DUAL SPEED SYNC: Prefer slowdown over speedup (more natural)
      if (hasVoiceover && assets.audioFiles.length > 0) {
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        console.log('[video-exporter] DUAL SPEED SYNC (Prefer Slowdown Mode)');
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        console.log('[video-exporter] Strategy: Slow motion video + Natural audio');
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        
        const adjustedVideos: string[] = [];
        const adjustedAudios: string[] = [];
        
        for (let i = 0; i < assets.videoFiles.length; i++) {
          const videoPath = assets.videoFiles[i];
          const audioPath = assets.audioFiles[i];
          
          if (!audioPath) {
            // No audio for this scene - use video as-is
            console.log(`[video-exporter] Scene ${i + 1}: No audio - using video as-is`);
            adjustedVideos.push(videoPath);
            // audioSpeedsByScene[i] already initialized to 1.0
            continue;
          }
          
          try {
            // Get both durations
            const videoDuration = await getVideoDuration(videoPath);
            const audioDuration = durations[i]; // Target from scene config
            
            console.log(`[video-exporter] ─────────────────────────────────────────────`);
            console.log(`[video-exporter] Scene ${i + 1}:`);
            console.log(`[video-exporter]   Video: ${videoDuration.toFixed(2)}s`);
            console.log(`[video-exporter]   Audio: ${audioDuration.toFixed(2)}s`);
            
            // Calculate optimal speeds using Dual Speed Sync v2.0
            // Supports: slowdown, speedup, loop, and trim
            const sync = calculateDualSpeedSync(videoDuration, audioDuration);
            
            console.log(`[video-exporter]   Target: ${sync.targetDuration.toFixed(2)}s`);
            console.log(`[video-exporter]   Video speed: ${sync.videoSpeed.toFixed(3)}x`);
            console.log(`[video-exporter]   Audio speed: ${sync.audioSpeed.toFixed(3)}x`);
            console.log(`[video-exporter]   Method: ${sync.method}`);
            console.log(`[video-exporter]   Needs loop: ${sync.needsLoop}`);
            console.log(`[video-exporter]   Needs trim: ${sync.needsTrim}`);
            
            let adjustedVideo = videoPath;
            let adjustedAudio = audioPath;
            
            // Store audio speed for subtitle adjustment
            audioSpeedsByScene[i] = sync.audioSpeed;
            
            if (sync.method !== 'none') {
              // Step 1: Apply LOOP if needed (video shorter than audio)
              if (sync.needsLoop) {
                console.log(`[video-exporter]   → Looping video (2x)...`);
                const loopedVideo = await loopVideo(adjustedVideo, videoDuration * 2);
                if (adjustedVideo !== videoPath) tempFiles.push(adjustedVideo);
                adjustedVideo = loopedVideo;
                tempFiles.push(loopedVideo);
              }
              
              // Step 2: Apply TRIM if needed (video longer than audio)
              if (sync.needsTrim && sync.trimTo) {
                console.log(`[video-exporter]   → Trimming video to ${sync.trimTo.toFixed(2)}s...`);
                const trimmedVideo = await trimVideo(adjustedVideo, sync.trimTo);
                if (adjustedVideo !== videoPath) tempFiles.push(adjustedVideo);
                adjustedVideo = trimmedVideo;
                tempFiles.push(trimmedVideo);
              }
              
              // Step 3: Adjust video speed if needed
              if (Math.abs(sync.videoSpeed - 1.0) > 0.02) {
                console.log(`[video-exporter]   → Adjusting video speed to ${sync.videoSpeed.toFixed(2)}x...`);
                const speedAdjustedVideo = await adjustVideoSpeed(adjustedVideo, sync.targetDuration);
                if (adjustedVideo !== videoPath) tempFiles.push(adjustedVideo);
                adjustedVideo = speedAdjustedVideo;
                tempFiles.push(speedAdjustedVideo);
              }
              
              // Step 4: Adjust audio speed if needed
              if (Math.abs(sync.audioSpeed - 1.0) > 0.02) {
                console.log(`[video-exporter]   → Adjusting audio speed to ${sync.audioSpeed.toFixed(2)}x...`);
                adjustedAudio = await adjustAudioSpeed(audioPath, sync.targetDuration);
                tempFiles.push(adjustedAudio);
              }
              
              console.log(`[video-exporter]   ✓ Sync complete (method: ${sync.method})`);
            } else {
              console.log(`[video-exporter]   ✓ No adjustment needed (close enough)`);
            }
            
            adjustedVideos.push(adjustedVideo);
            adjustedAudios.push(adjustedAudio);
            
          } catch (error) {
            console.error(`[video-exporter] Failed to sync Scene ${i + 1}:`, error);
            // Fallback: use originals
            adjustedVideos.push(videoPath);
            adjustedAudios.push(audioPath);
            // audioSpeedsByScene[i] already initialized to 1.0
          }
        }
        
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        console.log('[video-exporter] ✓ All scenes synced with Prefer Slowdown strategy');
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        
        // Update assets with adjusted files
        assets.audioFiles = adjustedAudios;
        
        // Check if creative transitions are specified for video mode
        const transitions: Array<SceneTransition | null> = input.scenes.map((s, i) => {
          if (i === input.scenes.length - 1) return null;
          return (s.transitionToNext as SceneTransition) || null;
        });
        const transitionDurations: number[] = input.scenes.map((s, i) => {
          if (i === input.scenes.length - 1) return 0;
          return s.transitionDuration || 0.5;
        });
        
        const hasCreativeTransitions = transitions.some(t => t && t !== 'none');
        
        if (hasCreativeTransitions && adjustedVideos.length > 1) {
          console.log('[video-exporter] Applying creative transitions between video clips...');
          console.log('[video-exporter] Transitions:', transitions.filter(t => t));
          videoTimeline = await createVideoWithCreativeTransitions(
            adjustedVideos,
            durations,
            transitions,
            transitionDurations
          );
        } else {
          videoTimeline = await concatenateVideos(adjustedVideos);
        }
        
      } else {
        // No voiceover: concatenate videos with transitions if specified
        console.log('[video-exporter] No voiceover - checking for creative transitions...');
        
        const transitions: Array<SceneTransition | null> = input.scenes.map((s, i) => {
          if (i === input.scenes.length - 1) return null;
          return (s.transitionToNext as SceneTransition) || null;
        });
        const transitionDurations: number[] = input.scenes.map((s, i) => {
          if (i === input.scenes.length - 1) return 0;
          return s.transitionDuration || 0.5;
        });
        
        const hasCreativeTransitions = transitions.some(t => t && t !== 'none');
        
        if (hasCreativeTransitions && assets.videoFiles.length > 1) {
          console.log('[video-exporter] Applying creative transitions...');
          videoTimeline = await createVideoWithCreativeTransitions(
            assets.videoFiles,
            durations,
            transitions,
            transitionDurations
          );
        } else {
          videoTimeline = await concatenateVideos(assets.videoFiles);
        }
      }
      
    } else if (input.animationMode === 'transition') {
      // Scenario: Transition mode (Ken Burns animations + creative scene transitions)
      if (assets.imageFiles.length === 0) {
        throw new Error('Transition mode selected but no image files available');
      }
      console.log('[video-exporter] ═══════════════════════════════════════════════');
      console.log('[video-exporter] Mode: Transition (Ken Burns + Creative Transitions)');
      console.log('[video-exporter] ═══════════════════════════════════════════════');
      
      // Extract animations and effects for Ken Burns
      const animations: Array<ImageAnimation | null> = input.scenes.map(s => s.imageAnimation || 'ken-burns');
      const effects: Array<ImageEffect | null> = input.scenes.map(s => s.imageEffect || null);
      
      // Extract scene-to-scene transitions (2025 trending)
      const transitions: Array<SceneTransition | null> = input.scenes.map((s, i) => {
        // Last scene doesn't need transition
        if (i === input.scenes.length - 1) return null;
        return (s.transitionToNext as SceneTransition) || 'cross-dissolve';
      });
      const transitionDurations: number[] = input.scenes.map((s, i) => {
        if (i === input.scenes.length - 1) return 0;
        return s.transitionDuration || 0.5;
      });
      
      console.log('[video-exporter] Ken Burns Animations:', animations);
      console.log('[video-exporter] Visual Effects:', effects);
      console.log('[video-exporter] Scene Transitions:', transitions.slice(0, -1)); // Exclude last null
      console.log('[video-exporter] Transition Durations:', transitionDurations.slice(0, -1));
      
      // Use new creative transitions function
      videoTimeline = await createVideoFromImagesWithCreativeTransitions(
        assets.imageFiles,
        durations,
        animations,
        effects,
        transitions,
        transitionDurations,
        input.aspectRatio
      );
      
    } else {
      // Scenario: Animation off (static images with smooth transitions)
      if (assets.imageFiles.length === 0) {
        throw new Error('Animation off mode selected but no image files available');
      }
      console.log('[video-exporter] Mode: Off (static images with smooth transitions)');
      
      // Even in 'off' mode, apply creative transitions if specified
      const transitions: Array<SceneTransition | null> = input.scenes.map((s, i) => {
        if (i === input.scenes.length - 1) return null;
        return (s.transitionToNext as SceneTransition) || 'fade';
      });
      const transitionDurations: number[] = input.scenes.map((s, i) => {
        if (i === input.scenes.length - 1) return 0;
        return s.transitionDuration || 0.5;
      });
      
      // If any non-fade transitions, use creative transitions
      const hasCreativeTransitions = transitions.some(t => t && t !== 'fade' && t !== 'none');
      
      if (hasCreativeTransitions) {
        console.log('[video-exporter] Using creative transitions:', transitions.filter(t => t));
        videoTimeline = await createVideoFromImagesWithCreativeTransitions(
          assets.imageFiles,
          durations,
          input.scenes.map(() => null), // No Ken Burns animations
          input.scenes.map(() => null), // No effects
          transitions,
          transitionDurations,
          input.aspectRatio
        );
      } else {
        // Simple fade transitions
        videoTimeline = await createStaticVideoWithTransitions(
          assets.imageFiles, 
          durations,
          'fade',
          0.5,
          input.aspectRatio
        );
      }
    }
    
    tempFiles.push(videoTimeline);
    console.log('[video-exporter] ✓ Video timeline created:', videoTimeline);
    
    // Step 3: Merge voiceover audio (if available)
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 3: Audio Processing');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    let finalVideo = videoTimeline;
    
    if (hasVoiceover && assets.audioFiles.length > 0) {
      console.log('[video-exporter] Processing voiceover audio...');
      console.log('[video-exporter] Audio files count:', assets.audioFiles.length);
      
      let mergedAudio: string;
      
      if (assets.audioFiles.length > 1) {
        console.log('[video-exporter] Concatenating multiple audio files...');
        mergedAudio = await concatenateAudioFiles(assets.audioFiles);
        tempFiles.push(mergedAudio);
        console.log('[video-exporter] ✓ Audio concatenation complete');
      } else {
        console.log('[video-exporter] Single audio file, no concatenation needed');
        mergedAudio = assets.audioFiles[0];
      }
      
      console.log('[video-exporter] Merging audio with video timeline...');
      const withAudio = await mergeVoiceover(videoTimeline, mergedAudio);
      tempFiles.push(withAudio);
      finalVideo = withAudio;
      console.log('[video-exporter] ✓ Voiceover merged successfully');
      
      // Upload merged voiceover for volume control (if both voice & music enabled)
      if (enableVolumeControl) {
        console.log('[video-exporter] Uploading merged voiceover for volume control...');
        const voiceoverFilename = `voiceover_${Date.now()}.mp3`;
        const voiceoverPath = buildStoryModePath({
          userId,
          workspaceName,
          toolMode: "problem-solution",
          projectName: input.projectName,
          subfolder: "VoiceOver",
          filename: voiceoverFilename,
        });
        const voiceBuffer = await import('fs/promises').then(fs => fs.readFile(mergedAudio));
        voiceoverUrl = await bunnyStorage.uploadFile(voiceoverPath, voiceBuffer, 'audio/mpeg');
        console.log('[video-exporter] ✓ Voiceover uploaded:', voiceoverUrl);
      }
    } else {
      console.log('[video-exporter] No voiceover audio - creating silent video');
    }
    
    // Step 4: Add background music (if enabled)
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 4: Background Music');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    if (hasMusic) {
      let musicUrl: string;
      let musicNeedsTrimming = false; // Flag for custom music that needs trimming
      
      // Calculate total video duration (needed for trimming)
      const totalDuration = input.scenes.reduce((sum, s) => sum + s.duration, 0);
      
      // Option A: Custom uploaded music (highest priority)
      if (hasCustomMusic) {
        console.log('[video-exporter] Using custom uploaded music...');
        console.log('[video-exporter] Custom music URL:', input.customMusicUrl!.substring(0, 80) + '...');
        musicUrl = input.customMusicUrl!;
        musicNeedsTrimming = true; // Custom music needs to be trimmed to video length
      }
      // Option B: AI-generated music
      else if (hasAiMusic) {
        console.log('[video-exporter] Generating AI music...');
        console.log('[video-exporter] Music style:', input.musicStyle);
        
        // Calculate total video duration
        const totalDurationMs = input.scenes.reduce((sum, s) => sum + s.duration * 1000, 0);
        
        // Combine all scene narrations for story context
        const fullNarration = input.scenes
          .map(s => s.narration)
          .filter(Boolean)
          .join(' ');
        
        console.log('[video-exporter] Story narration length:', fullNarration.length, 'characters');
        
        try {
          const musicResult = await generateMusic(
            {
              musicStyle: input.musicStyle as MusicStyle,
              durationMs: totalDurationMs,
              storyTopic: input.storyTopic,
              storyNarration: fullNarration,  // Pass full story for context
              projectName: input.projectName,
              workspaceId: input.workspaceId,
            },
            userId,
            workspaceName
          );
          
          musicUrl = musicResult.musicUrl;
          console.log('[video-exporter] ✓ AI music generated:', musicUrl);
          console.log('[video-exporter]   Duration:', musicResult.durationMs / 1000, 's');
          console.log('[video-exporter]   Cost:', `$${musicResult.cost.toFixed(4)}`);
        } catch (musicError) {
          console.error('[video-exporter] AI music generation failed:', musicError);
          console.log('[video-exporter] Continuing without music...');
          musicUrl = '';
        }
      }
      // Option C: Legacy URL (backwards compatibility)
      else if (hasLegacyMusic) {
        console.log('[video-exporter] Using legacy music URL...');
        musicUrl = input.backgroundMusic!;
      } else {
        musicUrl = '';
      }
      
      // Mix music if URL available
      if (musicUrl) {
        console.log('[video-exporter] Mixing background music...');
        console.log('[video-exporter] Music URL:', musicUrl.substring(0, 80) + '...');
        console.log('[video-exporter] Voice volume:', input.voiceVolume);
        console.log('[video-exporter] Music volume:', input.musicVolume);
        
        // NOTE: Muted video will be created AFTER subtitles (at end of export)
        
        // Download music file
        let musicPath = path.join(TEMP_DIR, `${randomUUID()}_music.mp3`);
        await downloadFile(musicUrl, musicPath);
        tempFiles.push(musicPath);
        console.log('[video-exporter] ✓ Music downloaded');
        
        // Trim custom music to video length if needed
        if (musicNeedsTrimming) {
          console.log(`[video-exporter] Trimming custom music to ${totalDuration}s with fade out...`);
          const trimmedPath = path.join(TEMP_DIR, `${randomUUID()}_music_trimmed.mp3`);
          
          try {
            await new Promise<void>((resolve, reject) => {
              ffmpeg(musicPath)
                .setStartTime(0)
                .setDuration(totalDuration)
                // Add fade out in the last 1.5 seconds
                .audioFilters(`afade=t=out:st=${Math.max(0, totalDuration - 1.5)}:d=1.5`)
                .output(trimmedPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
            });
            
            tempFiles.push(trimmedPath);
            musicPath = trimmedPath; // Use trimmed version
            console.log('[video-exporter] ✓ Custom music trimmed with fade out');
          } catch (trimError) {
            console.warn('[video-exporter] Failed to trim music, using original:', trimError);
            // Continue with original music
          }
        }
        
        // Upload music for volume control (fixed name - gets replaced on re-export)
        if (enableVolumeControl) {
          console.log('[video-exporter] Uploading music file for volume control...');
          const musicFilename = `music_trimmed.mp3`;
          const musicUploadPath = buildStoryModePath({
            userId,
            workspaceName,
            toolMode: "problem-solution",
            projectName: input.projectName,
            subfolder: "Music",
            filename: musicFilename,
          });
          const musicBuffer = await import('fs/promises').then(fs => fs.readFile(musicPath));
          uploadedMusicUrl = await bunnyStorage.uploadFile(musicUploadPath, musicBuffer, 'audio/mpeg');
          console.log('[video-exporter] ✓ Music uploaded:', uploadedMusicUrl);
        }
        
        const withMusic = await mixBackgroundMusic(
          finalVideo,
          musicPath,
          input.voiceVolume,
          input.musicVolume
        );
        tempFiles.push(withMusic);
        finalVideo = withMusic;
        console.log('[video-exporter] ✓ Background music mixed successfully');
      }
    } else {
      console.log('[video-exporter] Skipping background music (not enabled)');
    }
    
    // Step 5: Add text overlay (ONLY if voiceover is enabled AND textOverlay is true)
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 5: Text Overlay / Subtitles');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    // Subtitles enabled with improved Windows compatibility
    const SUBTITLES_ENABLED = true;
    
    if (hasTextOverlay && SUBTITLES_ENABLED) {
      console.log('[video-exporter] Burning subtitles...');
      console.log('[video-exporter] Voiceover enabled:', hasVoiceover);
      console.log('[video-exporter] Text overlay setting:', input.textOverlay);
      console.log('[video-exporter] Text overlay style:', input.textOverlayStyle || 'modern');
      console.log('[video-exporter] Language:', input.language || 'en');
      
      // Pass wordTimestamps for synchronized karaoke-style subtitles
      // Also pass audioSpeed to adjust timestamps if audio was sped up/slowed
      const scenesForSubtitles = input.scenes.map((s, i) => ({
        sceneNumber: s.sceneNumber,
        narration: s.narration,
        duration: s.duration,
        wordTimestamps: s.wordTimestamps,  // ← Word-level sync data!
        audioSpeed: audioSpeedsByScene[i] || 1.0,  // ← Audio speed for timestamp adjustment
      }));
      
      const hasWordSync = scenesForSubtitles.some(s => s.wordTimestamps && s.wordTimestamps.length > 0);
      console.log('[video-exporter] Scenes for subtitles:', scenesForSubtitles.length);
      console.log('[video-exporter] Word-level sync:', hasWordSync ? '✓ Enabled (precise)' : '✗ Fallback mode');
      scenesForSubtitles.forEach((s, i) => {
        const syncInfo = s.wordTimestamps?.length ? `${s.wordTimestamps.length} words` : 'no timestamps';
        console.log(`[video-exporter]   Scene ${i + 1}: "${s.narration.substring(0, 40)}..." (${s.duration}s, ${syncInfo})`);
      });
      
      const withSubtitles = await burnSubtitles(
        finalVideo, 
        scenesForSubtitles,
        {
          style: input.textOverlayStyle || 'modern',
          language: input.language || 'en',
        }
      );
      tempFiles.push(withSubtitles);
      finalVideo = withSubtitles;
      console.log('[video-exporter] ✓ Subtitles burned successfully');
    } else {
      if (!SUBTITLES_ENABLED) {
        console.log('[video-exporter] Skipping subtitles (disabled)');
      } else if (!hasVoiceover) {
        console.log('[video-exporter] Skipping subtitles (no voiceover)');
      } else if (!input.textOverlay) {
        console.log('[video-exporter] Skipping subtitles (text overlay disabled)');
      } else {
        console.log('[video-exporter] Skipping subtitles (conditions not met)');
      }
    }
    
    // Step 5.5: Create MUTED video for real-time volume control (if enabled)
    if (enableVolumeControl) {
      console.log('[video-exporter] ═══════════════════════════════════════════════');
      console.log('[video-exporter] Creating MUTED video for real-time preview...');
      console.log('[video-exporter] ═══════════════════════════════════════════════');
      
      // Create muted video by stripping all audio from final video
      const mutedVideoPath = await createMutedVideo(finalVideo);
      tempFiles.push(mutedVideoPath);
      
      // Upload muted video (fixed name - gets replaced on re-export)
      const mutedFilename = `video_base.mp4`;
      const mutedPath = buildStoryModePath({
        userId,
        workspaceName,
        toolMode: "problem-solution",
        projectName: input.projectName,
        subfolder: "Render",
        filename: mutedFilename,
      });
      const mutedBuffer = await import('fs/promises').then(fs => fs.readFile(mutedVideoPath));
      videoBaseUrl = await bunnyStorage.uploadFile(mutedPath, mutedBuffer, 'video/mp4');
      console.log('[video-exporter] ✓ Muted video uploaded:', videoBaseUrl);
    }
    
    // Step 6: Upload to CDN
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 6: Upload to CDN');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] Uploading final video to Bunny CDN...');
    
    // Fixed filename - gets replaced on re-export (no duplicate files)
    const filename = `final.${input.exportFormat}`;
    const bunnyPath = buildStoryModePath({
      userId,
      workspaceName,
      toolMode: "problem-solution",
      projectName: input.projectName,
      subfolder: "Render",
      filename: filename,
    });
    
    console.log('[video-exporter] Final video path:', finalVideo);
    console.log('[video-exporter] CDN path:', bunnyPath);
    
    const fileBuffer = await import('fs/promises').then(fs => fs.readFile(finalVideo));
    console.log('[video-exporter] File buffer size:', `${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    const cdnUrl = await bunnyStorage.uploadFile(
      bunnyPath,
      fileBuffer,
      `video/${input.exportFormat}`
    );
    
    // Get file stats
    const fileStats = statSync(finalVideo);
    const totalDuration = input.scenes.reduce((sum, s) => sum + s.duration, 0);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] ✓✓✓ EXPORT COMPLETE! ✓✓✓');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] EXPORT SUMMARY:');
    console.log('[video-exporter]   Video URL:', cdnUrl);
    console.log('[video-exporter]   Duration:', `${totalDuration}s`);
    console.log('[video-exporter]   File size:', `${(fileStats.size / 1024 / 1024).toFixed(2)}MB`);
    console.log('[video-exporter]   Processing time:', `${duration}s`);
    console.log('[video-exporter]   Format:', input.exportFormat);
    console.log('[video-exporter]   Quality:', input.exportQuality);
    console.log('[video-exporter]   Animation mode:', input.animationMode);
    console.log('[video-exporter]   Had voiceover:', hasVoiceover);
    console.log('[video-exporter]   Had music:', hasMusic);
    console.log('[video-exporter]   Had subtitles:', hasTextOverlay);
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    // Step 7: Cleanup temp files
    console.log('[video-exporter] STEP 7: Cleanup');
    console.log('[video-exporter] Cleaning up', tempFiles.length, 'temporary files...');
    cleanupFiles(tempFiles);
    console.log('[video-exporter] ✓ Cleanup complete');
    
    return {
      videoUrl: cdnUrl,
      // Include separated assets for volume control (only if both voice & music)
      videoBaseUrl: videoBaseUrl,
      voiceoverUrl: voiceoverUrl,
      musicUrl: uploadedMusicUrl,
      duration: totalDuration,
      format: input.exportFormat,
      size: fileStats.size,
    };
    
  } catch (error) {
    console.error('[video-exporter] Export failed:', error);
    
    // Cleanup on error
    cleanupFiles(tempFiles);
    
    throw error;
  }
}

/**
 * Remix video with new volume levels
 * Takes MUTED video + voiceover + music and combines them with new volume levels
 */
export async function remixVideo(
  input: import("../types").VideoRemixInput,
  userId: string,
  workspaceName: string
): Promise<import("../types").VideoRemixOutput> {
  const startTime = Date.now();
  const tempFiles: string[] = [];
  
  console.log('[video-exporter] ═══════════════════════════════════════════════');
  console.log('[video-exporter] REMIX: Starting audio remix...');
  console.log('[video-exporter] ═══════════════════════════════════════════════');
  console.log('[video-exporter] Voice volume:', input.voiceVolume);
  console.log('[video-exporter] Music volume:', input.musicVolume);
  
  try {
    // Step 1: Download muted video base
    console.log('[video-exporter] Downloading muted video base...');
    const videoPath = path.join(TEMP_DIR, `${randomUUID()}_remix_video.mp4`);
    await downloadFile(input.videoBaseUrl, videoPath);
    tempFiles.push(videoPath);
    console.log('[video-exporter] ✓ Muted video downloaded');
    
    // Step 2: Download voiceover
    console.log('[video-exporter] Downloading voiceover...');
    const voicePath = path.join(TEMP_DIR, `${randomUUID()}_remix_voice.mp3`);
    await downloadFile(input.voiceoverUrl, voicePath);
    tempFiles.push(voicePath);
    console.log('[video-exporter] ✓ Voiceover downloaded');
    
    // Step 3: Download music
    console.log('[video-exporter] Downloading music...');
    const musicPath = path.join(TEMP_DIR, `${randomUUID()}_remix_music.mp3`);
    await downloadFile(input.musicUrl, musicPath);
    tempFiles.push(musicPath);
    console.log('[video-exporter] ✓ Music downloaded');
    
    // Step 4: Mix voiceover + music with new volumes
    console.log('[video-exporter] Mixing audio with new volumes...');
    
    // Convert volumes to FFmpeg filter values (0-1 range)
    const voiceVol = input.voiceVolume / 100;
    const musicVol = input.musicVolume / 100;
    
    // Create remixed video with voiceover and music at specified volumes
    const remixedVideo = path.join(TEMP_DIR, `${randomUUID()}_remixed.mp4`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .input(voicePath)
        .input(musicPath)
        .complexFilter([
          // Apply volume to voiceover
          `[1:a]volume=${voiceVol}[voice]`,
          // Apply volume to music and make it loop
          `[2:a]aloop=loop=-1:size=2147483647,volume=${musicVol}[music]`,
          // Mix voice and music together
          `[voice][music]amix=inputs=2:duration=first:dropout_transition=2[audio]`
        ])
        .outputOptions([
          '-map', '0:v',      // Use video from first input
          '-map', '[audio]',  // Use mixed audio
          '-c:v', 'copy',     // Copy video (no re-encoding)
          '-c:a', 'aac',      // Encode audio as AAC
          '-b:a', '192k',     // Audio bitrate
          '-shortest'         // End when shortest stream ends
        ])
        .output(remixedVideo)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    
    tempFiles.push(remixedVideo);
    console.log('[video-exporter] ✓ Audio remixed successfully');
    
    // Step 4: Upload remixed video (overwrites final.mp4 - same file, updated audio mix)
    console.log('[video-exporter] Uploading remixed video as final.mp4...');
    const filename = `final.mp4`;
    const bunnyPath = buildStoryModePath({
      userId,
      workspaceName,
      toolMode: "problem-solution",
      projectName: input.projectName,
      subfolder: "Render",
      filename: filename,
    });
    
    const fileBuffer = await import('fs/promises').then(fs => fs.readFile(remixedVideo));
    const cdnUrl = await bunnyStorage.uploadFile(bunnyPath, fileBuffer, 'video/mp4');
    
    // Get file stats
    const fileStats = statSync(remixedVideo);
    const videoDuration = await getVideoDuration(remixedVideo);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] ✓ REMIX COMPLETE');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter]   New video URL:', cdnUrl);
    console.log('[video-exporter]   Duration:', `${videoDuration}s`);
    console.log('[video-exporter]   File size:', `${(fileStats.size / 1024 / 1024).toFixed(2)}MB`);
    console.log('[video-exporter]   Processing time:', `${duration}s`);
    
    // Cleanup
    cleanupFiles(tempFiles);
    
    // Add cache buster to ensure browsers don't serve stale cached version
    const cacheBuster = Date.now();
    const videoUrlWithCacheBuster = `${cdnUrl}?v=${cacheBuster}`;
    
    return {
      videoUrl: videoUrlWithCacheBuster,
      duration: videoDuration,
      size: fileStats.size,
    };
    
  } catch (error) {
    console.error('[video-exporter] Remix failed:', error);
    cleanupFiles(tempFiles);
    throw error;
  }
}

