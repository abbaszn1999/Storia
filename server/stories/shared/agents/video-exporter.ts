// Video Export Agent
// Merges all scenes, audio, music, and subtitles into final video
// Works with all story modes: problem-solution, before-after, myth-busting, tease-reveal
// Uses Shotstack cloud rendering API for video assembly

import { randomUUID } from "crypto";
import path from "path";
import { statSync } from "fs";
import ffmpeg from "fluent-ffmpeg";
import { bunnyStorage, buildStoryModePath } from "../../../storage/bunny-storage";
import {
  downloadFile,
  getTempDir,
  cleanupFiles,
  getVideoDuration,
} from "../services/ffmpeg-helpers";
import { createSrtFile, type SubtitleScene } from "../services/subtitle-generator";
import type { StoryMode } from "./idea-generator";
import { getMusicPrompts } from "../prompts-loader";
import type { StoryModeForPrompts } from "../prompts-loader";
import {
  getShotstackClient,
  isShotstackConfigured,
  type ShotstackEdit,
  type Timeline,
  type Track,
  type Clip,
  type VideoAsset,
  type ImageAsset,
  type AudioAsset,
  type CaptionAsset,
  type Transition,
  type TransitionEffect,
  type Effect,
  type Soundtrack,
} from "../../../integrations/shotstack";

const TEMP_DIR = getTempDir();

/**
 * Create video exporter function for a specific story mode
 * 
 * @param mode - Story mode (problem-solution, before-after, myth-busting, tease-reveal)
 * @returns exportFinalVideo and remixVideo functions configured for the specified mode
 */
export async function createVideoExporter(mode: StoryMode) {
  const modeForPrompts = mode as StoryModeForPrompts;
  const musicPromptsModule = getMusicPrompts(modeForPrompts);
  const typesModule = await import(`../types`);

  const { isValidMusicStyle } = musicPromptsModule;
  const { createMusicGenerator } = await import("./music-generator");
  const generateMusic = await createMusicGenerator(mode);
  
  // Types will be inferred from usage
  type VideoExportInput = any;
  type VideoExportOutput = any;
  type SceneTransition = any;
  type ImageAnimation = any;
  type ImageEffect = any;
  type MusicStyle = any;

  /**
   * Export final video using Shotstack cloud rendering
   */
  async function exportFinalVideo(
    input: any,
    userId?: string,
    workspaceName?: string
  ): Promise<any> {
  const startTime = Date.now();
  
  // Track separated assets for real-time volume control
  let videoBaseUrl: string | undefined;
  let voiceoverUrl: string | undefined;
  let uploadedMusicUrl: string | undefined;
  
  try {
    // ── Verify Shotstack is configured ──────────────────────────────
    if (!isShotstackConfigured()) {
      throw new Error('Shotstack is not configured. Set SHOTSTACK_API_KEY environment variable.');
    }
    
    // ── Determine scenario ─────────────────────────────────────────
    // CRITICAL: For auto-asmr mode, audioUrl contains sound effects, NOT voiceover
    const hasVoiceover = mode === 'auto-asmr'
      ? false
      : input.scenes.some((s: any) => s.audioUrl);
    
    const hasSoundEffects = mode === 'auto-asmr'
      ? input.scenes.some((s: any) => s.audioUrl)
      : false;
    
    const hasCustomMusic = !!input.customMusicUrl;
    const hasLegacyMusic = input.backgroundMusic && input.backgroundMusic !== 'none';
    const hasAiMusic = input.musicStyle && input.musicStyle !== 'none' && isValidMusicStyle(input.musicStyle);
    const hasMusic = hasCustomMusic || hasLegacyMusic || hasAiMusic;
    const hasTextOverlay = input.textOverlay && hasVoiceover;
    const enableVolumeControl = hasVoiceover && hasMusic;
    
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] EXPORT VIA SHOTSTACK (cloud rendering)`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] Scene count:`, input.scenes.length);
      console.log(`[${mode}:video-exporter] Animation mode:`, input.animationMode);
      console.log(`[${mode}:video-exporter] Has voiceover:`, hasVoiceover);
      console.log(`[${mode}:video-exporter] Has sound effects:`, hasSoundEffects);
      const musicType = hasCustomMusic ? '(Custom Upload)' : 
      hasAiMusic ? '(AI Generated)' : 
      hasLegacyMusic ? '(Legacy URL)' : '';
      console.log(`[${mode}:video-exporter] Has music:`, hasMusic, musicType);
      console.log(`[${mode}:video-exporter] Text overlay enabled:`, input.textOverlay);
      console.log(`[${mode}:video-exporter] Will show subtitles:`, hasTextOverlay);
      console.log(`[${mode}:video-exporter] Aspect ratio:`, input.aspectRatio || '16:9');
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    // ── Step 1: Build Shotstack Timeline Clips ───────────────────────
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] STEP 1: Building Shotstack Timeline Clips`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    const videoClips: Clip[] = [];
    const audioClips: Clip[] = [];
    let timelinePosition = 0;
    
    // Add 1 second padding to last scene
    const durations = input.scenes.map((s: any, index: number) => {
      const isLastScene = index === input.scenes.length - 1;
      return isLastScene ? s.duration + 1 : s.duration;
    });
    
    for (let i = 0; i < input.scenes.length; i++) {
      const scene = input.scenes[i];
      const sceneDuration = durations[i];
      const hasAudio = !!scene.audioUrl;
      
      // Determine clip duration: use audio duration if available, otherwise scene duration
      const audioDuration = scene.actualDuration || sceneDuration;
      const clipDuration = hasAudio ? audioDuration : sceneDuration;
      
      // ── Build transition (except last scene) ──
      let transition: Transition | undefined;
      if (i < input.scenes.length - 1 && scene.transitionToNext && scene.transitionToNext !== 'none') {
        const transEffect = mapExporterTransition(scene.transitionToNext);
        const transDuration = scene.transitionDuration || 0.5;
        transition = {
          in: transEffect,
          out: transEffect,
        };
      }
      
      // ── Build video/image clip based on animation mode ──
      if (input.animationMode === 'video') {
        // Video mode: prefer videoUrl, fallback to imageUrl with Ken Burns
        if (scene.videoUrl) {
          // Calculate speed to sync video with audio
          const videoDuration = scene.videoDuration || sceneDuration;
          const speed = videoDuration / clipDuration;
          
          const videoAsset: VideoAsset = {
            type: 'video',
            src: scene.videoUrl,
            volume: 0, // Muted — audio is on separate track
            ...(Math.abs(speed - 1.0) > 0.05 ? { speed } : {}),
          };
          
          console.log(`[${mode}:video-exporter]   Scene ${i + 1}: Video speed ${speed.toFixed(2)}x (video=${videoDuration}s → clip=${clipDuration.toFixed(1)}s)`);
          
          videoClips.push({
            asset: videoAsset,
            start: timelinePosition,
            length: clipDuration,
            fit: 'cover',
            ...(transition ? { transition } : {}),
          });
        } else if (scene.imageUrl) {
          // Hybrid fallback: use image with Ken Burns effect
          const effect = mapExporterEffect(scene.imageAnimation || 'ken-burns');
          
          const imageAsset: ImageAsset = {
            type: 'image',
            src: scene.imageUrl,
          };
          
          console.log(`[${mode}:video-exporter]   Scene ${i + 1}: Image (hybrid fallback) with ${effect || 'no'} effect`);
          
          videoClips.push({
            asset: imageAsset,
            start: timelinePosition,
            length: clipDuration,
            fit: 'cover',
            ...(effect ? { effect } : {}),
            ...(transition ? { transition } : {}),
          });
        } else {
          console.warn(`[${mode}:video-exporter]   Scene ${i + 1}: ⚠ No video or image URL — skipping`);
          timelinePosition += clipDuration;
          continue;
        }
      } else if (input.animationMode === 'transition') {
        // Transition mode: images with Ken Burns
        if (!scene.imageUrl) {
          console.warn(`[${mode}:video-exporter]   Scene ${i + 1}: ⚠ No image URL — skipping`);
          timelinePosition += clipDuration;
          continue;
        }
        
        const effect = mapExporterEffect(scene.imageAnimation || 'ken-burns');
        
        const imageAsset: ImageAsset = {
          type: 'image',
          src: scene.imageUrl,
        };
        
        console.log(`[${mode}:video-exporter]   Scene ${i + 1}: Image with ${effect || 'ken-burns'} effect (${clipDuration}s)`);
        
        videoClips.push({
          asset: imageAsset,
          start: timelinePosition,
          length: clipDuration,
          fit: 'cover',
          ...(effect ? { effect } : {}),
          ...(transition ? { transition } : {}),
        });
      } else {
        // Animation off: static images
        if (!scene.imageUrl) {
          console.warn(`[${mode}:video-exporter]   Scene ${i + 1}: ⚠ No image URL — skipping`);
          timelinePosition += clipDuration;
          continue;
        }
        
        const imageAsset: ImageAsset = {
          type: 'image',
          src: scene.imageUrl,
        };
        
        console.log(`[${mode}:video-exporter]   Scene ${i + 1}: Static image (${clipDuration}s)`);
        
        videoClips.push({
          asset: imageAsset,
          start: timelinePosition,
          length: clipDuration,
          fit: 'cover',
          ...(transition ? { transition } : {}),
        });
      }
      
      // ── Build audio clip (voiceover or sound effects) ──
      if (hasAudio && scene.audioUrl) {
        const audioAsset: AudioAsset = {
          type: 'audio',
          src: scene.audioUrl,
          volume: 1,
        };
        
        audioClips.push({
          asset: audioAsset,
          start: timelinePosition,
          length: clipDuration,
        });
      }
      
      timelinePosition += clipDuration;
    }
    
    const totalDuration = timelinePosition;
    
      console.log(`[${mode}:video-exporter] ✓ Timeline clips built: { videoClips: ${videoClips.length}, audioClips: ${audioClips.length}, totalDuration: '${totalDuration.toFixed(1)}s' }`);
    
    // ── Step 2: Generate music URL (if needed) ───────────────────────
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] STEP 2: Music Processing`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    let musicUrl: string = '';
    
    if (hasMusic) {
      if (hasCustomMusic) {
          console.log(`[${mode}:video-exporter] Using custom uploaded music`);
        musicUrl = input.customMusicUrl!;
      } else if (hasAiMusic) {
          console.log(`[${mode}:video-exporter] Generating AI music...`);
        const totalDurationMs = input.scenes.reduce((sum: number, s: any) => sum + s.duration * 1000, 0);
        const fullNarration = input.scenes.map((s: any) => s.narration).filter(Boolean).join(' ');
        
        try {
          const musicResult = await generateMusic(
            {
              musicStyle: input.musicStyle as MusicStyle,
              durationMs: totalDurationMs,
              storyTopic: input.storyTopic,
              storyNarration: fullNarration,
              projectName: input.projectName,
              workspaceId: input.workspaceId,
            },
            input.userId,
            input.workspaceName,
            'story',
            input.storyMode || 'problem-solution'
          );
          musicUrl = musicResult.musicUrl;
            console.log(`[${mode}:video-exporter] ✓ AI music generated: ${musicUrl}`);
        } catch (musicError) {
            console.error(`[${mode}:video-exporter] AI music generation failed:`, musicError);
        }
      } else if (hasLegacyMusic) {
          console.log(`[${mode}:video-exporter] Using legacy music URL`);
        musicUrl = input.backgroundMusic!;
      }
      
      // Upload music URL for volume control
      if (musicUrl && enableVolumeControl) {
        uploadedMusicUrl = musicUrl; // Already a URL — no need to re-upload
      }
    } else {
        console.log(`[${mode}:video-exporter] Skipping music (not enabled)`);
    }
    
    // ── Step 3: Generate SRT subtitles ───────────────────────────────
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] STEP 3: Subtitle Generation`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    let srtCdnUrl: string | undefined;
    
    if (hasTextOverlay) {
      // Build subtitle scenes from input
      const subtitleScenes: SubtitleScene[] = input.scenes.map((s: any) => ({
        sceneNumber: s.sceneNumber,
        narration: s.narration,
        duration: s.duration,
        wordTimestamps: s.wordTimestamps,
        audioSpeed: 1.0, // Shotstack handles speed natively
      }));
      
      const hasWordSync = subtitleScenes.some(s => s.wordTimestamps && s.wordTimestamps.length > 0);
        console.log(`[${mode}:video-exporter] Generating SRT: ${subtitleScenes.length} scenes, word-sync: ${hasWordSync ? 'yes' : 'no'}`);
      
      const srtFilePath = createSrtFile(subtitleScenes);
        console.log(`[${mode}:video-exporter] ✓ SRT created at: ${srtFilePath}`);
      
      // Upload SRT to CDN for Shotstack
      const srtCdnPath = buildStoryModePath({
        userId: userId || "",
        workspaceName: workspaceName || "",
        toolMode: mode,
        projectName: input.projectName,
        subfolder: "Render",
        filename: `subtitles_${Date.now()}.srt`,
      });
      
      const srtBuffer = Buffer.from(
        await import('fs/promises').then(fs => fs.readFile(srtFilePath))
      );
      srtCdnUrl = await bunnyStorage.uploadFile(srtCdnPath, srtBuffer, 'text/plain');
        console.log(`[${mode}:video-exporter] ✓ SRT uploaded: ${srtCdnUrl}`);
    } else {
        console.log(`[${mode}:video-exporter] Skipping subtitles`);
    }
    
    // ── Step 4: Assemble Shotstack Edit JSON ─────────────────────────
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] STEP 4: Assembling Shotstack Edit JSON`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    const tracks: Track[] = [];
    
    // Track 1 (top): Caption overlay (if enabled)
    if (srtCdnUrl) {
      const isArabic = (input.language || 'en').startsWith('ar');
      
      const captionAsset: CaptionAsset = {
        type: 'caption',
        src: srtCdnUrl,
        font: {
          family: isArabic ? 'Cairo' : 'Montserrat SemiBold',
          color: '#FFFFFF',
          size: 32,
        },
        background: {
          color: '#000000',
          opacity: 0.5,
          borderRadius: 8,
          padding: 10,
        },
      };
      
      tracks.push({
        clips: [{
          asset: captionAsset,
          start: 0,
          length: totalDuration,
        }],
      });
    }
    
    // Track 2: Video/Image clips
    if (videoClips.length > 0) {
      tracks.push({ clips: videoClips });
    }
    
    // Track 3: Audio clips (voiceover / sound effects)
    if (audioClips.length > 0) {
      tracks.push({ clips: audioClips });
    }
    
    // Build timeline
    const timeline: Timeline = {
      tracks,
      background: '#000000',
      cache: true,
    };
    
    // Add music as soundtrack (if available)
    if (musicUrl) {
      const musicVolume = (input.musicVolume || 50) / 100;
      (timeline as any).soundtrack = {
        src: musicUrl,
        effect: 'fadeInFadeOut',
        volume: musicVolume,
      };
        console.log(`[${mode}:video-exporter] Music added as soundtrack (volume: ${musicVolume})`);
    }
    
    // Add Arabic font if needed (full TTF with Arabic glyphs, not a Latin subset)
    const isArabic = (input.language || 'en').startsWith('ar');
    if (isArabic && srtCdnUrl) {
      (timeline as any).fonts = [{
        src: 'https://fonts.gstatic.com/s/cairo/v31/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hD45W1Q.ttf',
      }];
    }
    
    // Map quality to Shotstack resolution
    const resolutionMap: Record<string, string> = {
      '720p': '720',
      '1080p': '1080',
      '4k': '4k',
    };
    
    const edit: ShotstackEdit = {
      timeline,
      output: {
        format: (input.exportFormat || 'mp4') as 'mp4' | 'gif' | 'jpg' | 'png' | 'bmp' | 'webm',
        resolution: (resolutionMap[input.exportQuality] || '1080') as any,
        aspectRatio: input.aspectRatio || '16:9',
        fps: 30,
        thumbnail: {
          capture: 1,
          scale: 0.5,
        },
      },
    };
    
    const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0);
      console.log(`[${mode}:video-exporter] ✓ Edit JSON built: { tracks: ${tracks.length}, clips: ${clipCount}, duration: '${totalDuration.toFixed(1)}s', hasSubtitles: ${!!srtCdnUrl}, hasMusic: ${!!musicUrl} }`);
    
    // ── Step 5: Submit render to Shotstack ───────────────────────────
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] STEP 5: Submitting Render to Shotstack`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    const client = getShotstackClient();
    const renderResponse = await client.render(edit);
    const renderId = renderResponse.response.id;
      console.log(`[${mode}:video-exporter] Render submitted. ID: ${renderId}`);
    
    // ── Step 6: Poll for completion ──────────────────────────────────
      console.log(`[${mode}:video-exporter] STEP 6: Polling render status...`);
    
    const finalStatus = await client.pollRenderStatus(
      renderId,
      5000,  // 5s interval
      120,   // 10 min max
      (status) => {
        console.log(`[${mode}:video-exporter] Render status: ${status.response.status}`);
      }
    );
    
    const exportDuration = finalStatus.response.duration || totalDuration;
      console.log(`[${mode}:video-exporter] ✓ Render complete: { url: '${(finalStatus.response.url || '').substring(0, 60)}', duration: ${exportDuration}, renderTime: ${finalStatus.response.renderTime} }`);
    
    // ── Step 7: Upload to Bunny CDN ──────────────────────────────────
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] STEP 7: Uploading to Bunny CDN`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    let finalVideoUrl: string | undefined;
    let finalThumbnailUrl: string | undefined;
    let finalFileSize = 0;
    
    if (finalStatus.response.url) {
      // Download video from Shotstack
      const videoResponse = await fetch(finalStatus.response.url);
      if (!videoResponse.ok) throw new Error(`Failed to download rendered video: ${videoResponse.status}`);
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      finalFileSize = videoBuffer.length;
        console.log(`[${mode}:video-exporter] Video size: ${(finalFileSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Upload to Bunny CDN
      const filename = `final_${Date.now()}.${input.exportFormat || 'mp4'}`;
      const bunnyPath = buildStoryModePath({
        userId: userId || "",
        workspaceName: workspaceName || "",
        toolMode: mode,
        projectName: input.projectName,
        subfolder: "Render",
        filename,
      });
      finalVideoUrl = await bunnyStorage.uploadFile(bunnyPath, videoBuffer, `video/${input.exportFormat || 'mp4'}`);
        console.log(`[${mode}:video-exporter] ✓ Video uploaded to Bunny CDN`);
      
      // Upload thumbnail if available
      if (finalStatus.response.thumbnail) {
        try {
          const thumbResponse = await fetch(finalStatus.response.thumbnail);
          if (thumbResponse.ok) {
            const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
            const thumbPath = buildStoryModePath({
              userId: userId || "",
              workspaceName: workspaceName || "",
              toolMode: mode,
              projectName: input.projectName,
              subfolder: "Render",
              filename: `thumbnail_${Date.now()}.jpg`,
            });
            finalThumbnailUrl = await bunnyStorage.uploadFile(thumbPath, thumbBuffer, 'image/jpeg');
              console.log(`[${mode}:video-exporter] ✓ Thumbnail uploaded to Bunny CDN`);
          }
        } catch (thumbError) {
          console.warn(`[${mode}:video-exporter] Thumbnail upload failed:`, thumbError);
        }
      }
      
      // For volume control: store voiceover URL from first scene that has audio
      if (enableVolumeControl && hasVoiceover) {
        // Collect all voiceover URLs — the first scene's audioUrl is good enough for reference
        const firstAudioScene = input.scenes.find((s: any) => s.audioUrl);
        if (firstAudioScene) {
          voiceoverUrl = firstAudioScene.audioUrl;
        }
        // For muted video base: render without audio for volume control
        // This is optional — we already have the voiceover and music URLs
        videoBaseUrl = finalVideoUrl; // The full video serves as base
      }
    } else {
      // Fallback to Shotstack URL
      finalVideoUrl = finalStatus.response.url;
      console.warn(`[${mode}:video-exporter] No Shotstack URL — render may have failed`);
    }
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] ✓✓✓ EXPORT COMPLETE! ✓✓✓`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] EXPORT SUMMARY:`);
      console.log(`[${mode}:video-exporter]   Video URL:`, finalVideoUrl);
      console.log(`[${mode}:video-exporter]   Duration:`, `${exportDuration}s`);
      console.log(`[${mode}:video-exporter]   File size:`, `${(finalFileSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`[${mode}:video-exporter]   Processing time:`, `${processingTime}s`);
      console.log(`[${mode}:video-exporter]   Animation mode:`, input.animationMode);
      console.log(`[${mode}:video-exporter]   Had voiceover:`, hasVoiceover);
      if (mode === 'auto-asmr') {
        console.log(`[${mode}:video-exporter]   Had sound effects:`, hasSoundEffects);
      }
      console.log(`[${mode}:video-exporter]   Had music:`, hasMusic);
      console.log(`[${mode}:video-exporter]   Had subtitles:`, hasTextOverlay);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    
    return {
      videoUrl: finalVideoUrl,
      videoBaseUrl: videoBaseUrl,
      voiceoverUrl: voiceoverUrl,
      musicUrl: uploadedMusicUrl,
      duration: exportDuration,
      format: input.exportFormat,
      size: finalFileSize,
    };
    
  } catch (error) {
      console.error(`[${mode}:video-exporter] Export failed:`, error);
    throw error;
  }
}

  /**
   * Remix video with new volume levels
   */
  async function remixVideo(
    input: any,
    userId?: string,
    workspaceName?: string
  ): Promise<any> {
  const startTime = Date.now();
  const tempFiles: string[] = [];
  
    console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:video-exporter] REMIX: Starting audio remix...`);
    console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
    console.log(`[${mode}:video-exporter] Voice volume:`, input.voiceVolume);
    console.log(`[${mode}:video-exporter] Music volume:`, input.musicVolume);
  
  try {
    // Step 1: Download muted video base
      console.log(`[${mode}:video-exporter] Downloading muted video base...`);
    const videoPath = path.join(TEMP_DIR, `${randomUUID()}_remix_video.mp4`);
    await downloadFile(input.videoBaseUrl, videoPath);
    tempFiles.push(videoPath);
      console.log(`[${mode}:video-exporter] ✓ Muted video downloaded`);
    
    // Step 2: Download voiceover
      console.log(`[${mode}:video-exporter] Downloading voiceover...`);
    const voicePath = path.join(TEMP_DIR, `${randomUUID()}_remix_voice.mp3`);
    await downloadFile(input.voiceoverUrl, voicePath);
    tempFiles.push(voicePath);
      console.log(`[${mode}:video-exporter] ✓ Voiceover downloaded`);
    
    // Step 3: Download music
      console.log(`[${mode}:video-exporter] Downloading music...`);
    const musicPath = path.join(TEMP_DIR, `${randomUUID()}_remix_music.mp3`);
    await downloadFile(input.musicUrl, musicPath);
    tempFiles.push(musicPath);
      console.log(`[${mode}:video-exporter] ✓ Music downloaded`);
    
    // Step 4: Mix voiceover + music with new volumes
      console.log(`[${mode}:video-exporter] Mixing audio with new volumes...`);
    
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
      console.log(`[${mode}:video-exporter] ✓ Audio remixed successfully`);
    
    // Step 4: Upload remixed video (overwrites final.mp4 - same file, updated audio mix)
      console.log(`[${mode}:video-exporter] Uploading remixed video as final.mp4...`);
    const filename = `final.mp4`;
    const bunnyPath = buildStoryModePath({
      userId: userId || "",
      workspaceName: workspaceName || "",
      toolMode: mode,
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
    
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter] ✓ REMIX COMPLETE`);
      console.log(`[${mode}:video-exporter] ═══════════════════════════════════════════════`);
      console.log(`[${mode}:video-exporter]   New video URL:`, cdnUrl);
      console.log(`[${mode}:video-exporter]   Duration:`, `${videoDuration}s`);
      console.log(`[${mode}:video-exporter]   File size:`, `${(fileStats.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`[${mode}:video-exporter]   Processing time:`, `${duration}s`);
    
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
      console.error(`[${mode}:video-exporter] Remix failed:`, error);
      cleanupFiles(tempFiles);
      throw error;
    }
  }

  return { exportFinalVideo, remixVideo };
}

/**
 * Export final video (backward compatibility - uses problem-solution mode by default)
 */
export async function exportFinalVideo(
  input: any,
  userId?: string,
  workspaceName?: string
): Promise<any> {
  const exporter = await createVideoExporter("problem-solution");
  return exporter.exportFinalVideo(input, userId, workspaceName);
}

/**
 * Remix video (backward compatibility - uses problem-solution mode by default)
 */
export async function remixVideo(
  input: any,
  userId?: string,
  workspaceName?: string
): Promise<any> {
  const exporter = await createVideoExporter("problem-solution");
  return exporter.remixVideo(input, userId, workspaceName);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOTSTACK MAPPING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map story transition names to Shotstack TransitionEffect values.
 */
function mapExporterTransition(transition: string): TransitionEffect {
  const map: Record<string, TransitionEffect> = {
    'fade': 'fade',
    'cross-dissolve': 'fade',
    'crossfade': 'fade',
    'dissolve': 'fade',
    'wipe-left': 'wipeLeft',
    'wipe-right': 'wipeRight',
    'wipe-up': 'wipeUp',
    'wipe-down': 'wipeDown',
    'slide-left': 'slideLeft',
    'slide-right': 'slideRight',
    'slide-up': 'slideUp',
    'slide-down': 'slideDown',
    'zoom': 'zoom',
    'zoom-in': 'zoom',
    'carousel-left': 'carouselLeft',
    'carousel-right': 'carouselRight',
    'reveal': 'reveal',
    'circle-open': 'fade',
    'smooth-blur': 'fade',
    'whip-pan': 'slideLeft',
  };
  return map[transition] || 'fade';
}

/**
 * Map image animation names to Shotstack Effect values.
 */
function mapExporterEffect(animationName?: string): Effect | undefined {
  if (!animationName) return 'zoomIn'; // Default Ken Burns
  
  const map: Record<string, Effect | undefined> = {
    'ken-burns': 'zoomIn',
    'ken-burns-in': 'zoomIn',
    'ken-burns-out': 'zoomOut',
    'zoom-in': 'zoomIn',
    'zoom-out': 'zoomOut',
    'pan-left': 'slideLeft',
    'pan-right': 'slideRight',
    'pan-up': 'slideUp',
    'pan-down': 'slideDown',
    'slide-left': 'slideLeft',
    'slide-right': 'slideRight',
    'rotate-cw': 'zoomIn',
    'rotate-ccw': 'zoomOut',
    'none': undefined,
  };
  
  const result = map[animationName];
  if (result === undefined && animationName !== 'none') return 'zoomIn';
  return result;
}
