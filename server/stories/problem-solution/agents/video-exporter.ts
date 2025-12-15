// Video Export Agent for Problem-Solution Mode
// Merges all scenes, audio, music, and subtitles into final video

import { randomUUID } from "crypto";
import path from "path";
import { existsSync, statSync } from "fs";
import { bunnyStorage, buildStoryModePath } from "../../../storage/bunny-storage";
import type { VideoExportInput, VideoExportOutput } from "../types";
import {
  downloadFile,
  concatenateVideos,
  createVideoFromImages,
  createStaticVideoWithTransitions,
  createVideoFromImagesWithAnimations,
  concatenateAudioFiles,
  mergeVoiceover,
  mixBackgroundMusic,
  getTempDir,
  cleanupFiles,
  getVideoDuration,
  adjustVideoSpeed,
  loopVideo,
} from "../services/ffmpeg-helpers";
import { burnSubtitles } from "../services/subtitle-generator";

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
  
  for (const scene of scenes) {
    // Download video or image based on animation mode
    if (animationMode === 'video') {
      // Video mode: download videos
      if (scene.videoUrl) {
        const videoPath = path.join(TEMP_DIR, `${randomUUID()}_scene${scene.sceneNumber}.mp4`);
        await downloadFile(scene.videoUrl, videoPath);
        videoFiles.push(videoPath);
        console.log(`[video-exporter] ✓ Downloaded video for scene ${scene.sceneNumber}`);
      } else {
        console.warn(`[video-exporter] ⚠ Scene ${scene.sceneNumber} missing videoUrl in video mode`);
      }
    } else {
      // 'off' or 'transition' mode: download images
      if (scene.imageUrl) {
        const imagePath = path.join(TEMP_DIR, `${randomUUID()}_scene${scene.sceneNumber}.jpg`);
        await downloadFile(scene.imageUrl, imagePath);
        imageFiles.push(imagePath);
        console.log(`[video-exporter] ✓ Downloaded image for scene ${scene.sceneNumber}`);
      } else {
        console.warn(`[video-exporter] ⚠ Scene ${scene.sceneNumber} missing imageUrl in ${animationMode} mode`);
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
  
  return { videoFiles, imageFiles, audioFiles };
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
  
  try {
    // Determine scenario
    const hasVoiceover = input.scenes.some(s => s.audioUrl);
    const hasMusic = input.backgroundMusic && input.backgroundMusic !== 'none';
    const hasTextOverlay = input.textOverlay && hasVoiceover; // Text overlay ONLY with voiceover
    
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] EXPORT SCENARIO ANALYSIS');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] Scene count:', input.scenes.length);
    console.log('[video-exporter] Animation mode:', input.animationMode);
    console.log('[video-exporter] Has voiceover:', hasVoiceover);
    console.log('[video-exporter] Has music:', hasMusic);
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
    
    if (input.animationMode === 'video') {
      // Scenario: Video mode (image-to-video generated with intelligent sync)
      if (assets.videoFiles.length === 0) {
        throw new Error('Video mode selected but no video files available');
      }
      console.log('[video-exporter] Mode: Video (image-to-video with intelligent sync)');
      
      // Intelligent sync: adjust video durations to match voiceover if present
      if (hasVoiceover && assets.audioFiles.length > 0) {
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        console.log('[video-exporter] Syncing videos with voiceover (professional mode)');
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        
        const adjustedVideos: string[] = [];
        
        for (let i = 0; i < assets.videoFiles.length; i++) {
          const videoPath = assets.videoFiles[i];
          const targetDuration = durations[i]; // من الصوت الفعلي
          
          try {
            const currentDuration = await getVideoDuration(videoPath);
            const diff = Math.abs(currentDuration - targetDuration);
            const diffPercent = (diff / targetDuration) * 100;
            
            console.log(`[video-exporter] Scene ${i + 1}: Video=${currentDuration.toFixed(2)}s, Voice=${targetDuration.toFixed(2)}s, Diff=${diff.toFixed(2)}s (${diffPercent.toFixed(1)}%)`);
            
            let adjustedVideo = videoPath;
            
            if (diff < 0.5) {
              // فرق صغير جداً (<0.5s): لا حاجة للتعديل
              console.log(`[video-exporter]   → No adjustment needed (difference < 0.5s)`);
              
            } else if (currentDuration < targetDuration) {
              // الفيديو أقصر من الصوت
              const speedRatio = currentDuration / targetDuration;
              
              if (speedRatio >= 0.7) {
                // فرق معقول: تبطيء الفيديو (0.7x-1.0x)
                console.log(`[video-exporter]   → Slowing down video (${speedRatio.toFixed(2)}x speed)`);
                adjustedVideo = await adjustVideoSpeed(videoPath, targetDuration);
                tempFiles.push(adjustedVideo);
                
              } else {
                // فرق كبير: loop الفيديو
                console.log(`[video-exporter]   → Looping video to extend duration`);
                adjustedVideo = await loopVideo(videoPath, targetDuration);
                tempFiles.push(adjustedVideo);
              }
              
            } else {
              // الفيديو أطول من الصوت
              const speedRatio = currentDuration / targetDuration;
              
              if (speedRatio <= 1.5) {
                // فرق معقول: تسريع الفيديو (1.0x-1.5x)
                console.log(`[video-exporter]   → Speeding up video (${speedRatio.toFixed(2)}x speed)`);
                adjustedVideo = await adjustVideoSpeed(videoPath, targetDuration);
                tempFiles.push(adjustedVideo);
                
              } else {
                // فرق كبير جداً: تسريع بحد أقصى 1.5x
                console.log(`[video-exporter]   → Speeding up video (max 1.5x speed, will trim excess)`);
                adjustedVideo = await adjustVideoSpeed(videoPath, targetDuration);
                tempFiles.push(adjustedVideo);
              }
            }
            
            adjustedVideos.push(adjustedVideo);
            
          } catch (error) {
            console.error(`[video-exporter] Failed to sync Scene ${i + 1}:`, error);
            // Fallback: use original video
            adjustedVideos.push(videoPath);
          }
        }
        
        console.log('[video-exporter] ✓ All videos synced with voiceover');
        console.log('[video-exporter] ═══════════════════════════════════════════════');
        
        videoTimeline = await concatenateVideos(adjustedVideos);
        
      } else {
        // No voiceover: just concatenate videos as-is
        console.log('[video-exporter] No voiceover - concatenating videos as-is');
        videoTimeline = await concatenateVideos(assets.videoFiles);
      }
      
    } else if (input.animationMode === 'transition') {
      // Scenario: Transition mode (CSS animations → FFmpeg filters)
      if (assets.imageFiles.length === 0) {
        throw new Error('Transition mode selected but no image files available');
      }
      console.log('[video-exporter] Mode: Transition (applying FFmpeg animations + effects)');
      const animations = input.scenes.map(s => s.imageAnimation || null);
      const effects = input.scenes.map(s => s.imageEffect || null);
      console.log('[video-exporter] Animations:', animations);
      console.log('[video-exporter] Effects:', effects);
      videoTimeline = await createVideoFromImagesWithAnimations(assets.imageFiles, durations, animations, effects);
      
    } else {
      // Scenario: Animation off (static images with smooth transitions)
      if (assets.imageFiles.length === 0) {
        throw new Error('Animation off mode selected but no image files available');
      }
      console.log('[video-exporter] Mode: Off (static images with smooth transitions)');
      videoTimeline = await createStaticVideoWithTransitions(
        assets.imageFiles, 
        durations,
        'fade',  // transition type: fade, wipeleft, wiperight, slideup, slidedown, dissolve
        0.5      // transition duration: 0.5 seconds
      );
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
    } else {
      console.log('[video-exporter] No voiceover audio - creating silent video');
    }
    
    // Step 4: Add background music (if enabled)
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 4: Background Music');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    
    if (hasMusic) {
      console.log('[video-exporter] Mixing background music...');
      console.log('[video-exporter] Music URL:', input.backgroundMusic);
      console.log('[video-exporter] Voice volume:', input.voiceVolume);
      console.log('[video-exporter] Music volume:', input.musicVolume);
      
      // Download music file
      const musicPath = path.join(TEMP_DIR, `${randomUUID()}_music.mp3`);
      await downloadFile(input.backgroundMusic!, musicPath);
      tempFiles.push(musicPath);
      console.log('[video-exporter] ✓ Music downloaded');
      
      const withMusic = await mixBackgroundMusic(
        finalVideo,
        musicPath,
        input.voiceVolume,
        input.musicVolume
      );
      tempFiles.push(withMusic);
      finalVideo = withMusic;
      console.log('[video-exporter] ✓ Background music mixed successfully');
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
      
      const scenesForSubtitles = input.scenes.map(s => ({
        sceneNumber: s.sceneNumber,
        narration: s.narration,
        duration: s.duration,
      }));
      
      console.log('[video-exporter] Scenes for subtitles:', scenesForSubtitles.length);
      scenesForSubtitles.forEach((s, i) => {
        console.log(`[video-exporter]   Scene ${i + 1}: "${s.narration.substring(0, 50)}..." (${s.duration}s)`);
      });
      
      const withSubtitles = await burnSubtitles(finalVideo, scenesForSubtitles);
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
    
    // Step 6: Upload to CDN
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] STEP 6: Upload to CDN');
    console.log('[video-exporter] ═══════════════════════════════════════════════');
    console.log('[video-exporter] Uploading final video to Bunny CDN...');
    
    const filename = `final_${Date.now()}.${input.exportFormat}`;
    const bunnyPath = buildStoryModePath({
      userId,
      workspaceName,
      toolMode: "problem-solution",
      projectName: input.projectName,
      filename: `Export/${filename}`,
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

