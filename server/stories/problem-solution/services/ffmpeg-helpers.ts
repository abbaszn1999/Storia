// FFmpeg Helper Functions for Video Export
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import { writeFileSync, unlinkSync, existsSync, mkdirSync, createWriteStream, statSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// Set FFmpeg and FFprobe paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, "../../../../temp");

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Download a file from URL to local path with verification and retry
 * Using arrayBuffer instead of stream for more reliable downloads
 */
export async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log(`[ffmpeg-helpers] Downloading: ${url}`);
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`[ffmpeg-helpers] Attempt ${attempt}/${maxRetries}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      console.log(`[ffmpeg-helpers] Response status: ${response.status}`);
      console.log(`[ffmpeg-helpers] Response headers:`, {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      // Use arrayBuffer for more reliable download
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`[ffmpeg-helpers] Downloaded ${buffer.length} bytes`);
      
      if (buffer.length < 100) {
        throw new Error(`Downloaded data is too small: ${buffer.length} bytes - likely corrupted or empty`);
      }
      
      // Write to file
      writeFileSync(outputPath, buffer);
      
      // Verify file was written correctly
      if (existsSync(outputPath)) {
        const stats = statSync(outputPath);
        console.log(`[ffmpeg-helpers] ✓ Saved to: ${outputPath} (${(stats.size / 1024).toFixed(2)}KB)`);
        
        if (stats.size !== buffer.length) {
          throw new Error(`File size mismatch: expected ${buffer.length}, got ${stats.size}`);
        }
        
        return; // Success!
      } else {
        throw new Error('File was not created after write');
      }
      
    } catch (error) {
      console.error(`[ffmpeg-helpers] ✗ Download attempt ${attempt} failed:`, error);
      
      // Clean up failed download
      if (existsSync(outputPath)) {
        try {
          unlinkSync(outputPath);
          console.log(`[ffmpeg-helpers] Cleaned up failed download: ${outputPath}`);
        } catch (e) {
          console.warn(`[ffmpeg-helpers] Could not clean up: ${e}`);
        }
      }
      
      if (attempt >= maxRetries) {
        throw new Error(`Failed to download after ${maxRetries} attempts. Last error: ${error}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = 1000 * attempt;
      console.log(`[ffmpeg-helpers] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Download failed - should not reach here');
}

/**
 * Concatenate multiple video files into one
 */
export async function concatenateVideos(videoPaths: string[]): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_concat.mp4`);
  
  console.log(`[ffmpeg-helpers] Concatenating ${videoPaths.length} videos...`);
  
  // Create concat file for FFmpeg
  const concatFile = path.join(TEMP_DIR, `${randomUUID()}_concat.txt`);
  const fileList = videoPaths.map(p => `file '${p}'`).join('\n');
  writeFileSync(concatFile, fileList);
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatFile)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .outputOptions([
        '-c', 'copy', // Copy without re-encoding (faster)
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg concat command:', cmd);
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] Concatenation complete');
        unlinkSync(concatFile);
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] Concatenation error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Create video from static images with Ken Burns effect
 */
export async function createVideoFromImages(
  imagePaths: string[],
  durations: number[]
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_images.mp4`);
  
  console.log(`[ffmpeg-helpers] Creating video from ${imagePaths.length} images...`);
  
  // Build complex FFmpeg filter for Ken Burns effect on each image
  const filters: string[] = [];
  const inputs: string[] = [];
  
  for (let i = 0; i < imagePaths.length; i++) {
    const duration = durations[i];
    const fps = 25;
    const frames = duration * fps;
    
    // Zoom in effect: scale from 1.0 to 1.2 over the duration
    filters.push(
      `[${i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `zoompan=z='min(zoom+0.0015,1.2)':d=${frames}:s=1920x1080:fps=${fps}[v${i}]`
    );
    inputs.push(`[v${i}]`);
  }
  
  // Concatenate all zoomed clips
  filters.push(`${inputs.join('')}concat=n=${imagePaths.length}:v=1:a=0[outv]`);
  
  const command = ffmpeg();
  
  // Add all images as inputs
  imagePaths.forEach(img => command.input(img));
  
  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filters)
      .outputOptions([
        '-map', '[outv]',
        '-r', '25',
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg image-to-video command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[ffmpeg-helpers] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] Image-to-video complete');
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] Image-to-video error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Create video from STATIC images (NO Ken Burns, NO transitions)
 * Perfect for voiceover mode where images should be still
 * Simple and reliable approach using concat filter
 */
export async function createStaticVideoWithTransitions(
  imagePaths: string[],
  durations: number[],
  transitionType: 'fade' | 'wipeleft' | 'wiperight' | 'slideup' | 'slidedown' | 'dissolve' = 'fade',
  transitionDuration: number = 0.5
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_static_video.mp4`);
  
  console.log(`[ffmpeg-helpers] Creating static video from ${imagePaths.length} images...`);
  
  const tempClips: string[] = [];
  
  try {
    // Step 1: Convert each image to a video clip with exact duration
    for (let i = 0; i < imagePaths.length; i++) {
      const clipPath = path.join(TEMP_DIR, `${randomUUID()}_clip${i}.mp4`);
      const duration = durations[i];
      
      console.log(`[ffmpeg-helpers] Creating clip ${i + 1}/${imagePaths.length} (${duration}s)...`);
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(imagePaths[i])
          .inputOptions(['-loop', '1', '-t', duration.toString()])
          .outputOptions([
            '-vf', 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080',
            '-r', '25',
            '-pix_fmt', 'yuv420p',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
          ])
          .output(clipPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
      
      tempClips.push(clipPath);
    }
    
    console.log(`[ffmpeg-helpers] All clips created, concatenating...`);
    
    // Step 2: Concatenate clips using concat filter (simple, reliable)
    if (tempClips.length === 1) {
      // Single clip - just copy it
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(tempClips[0])
          .outputOptions(['-c', 'copy'])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    } else {
      // Multiple clips - use concat filter
      const filters: string[] = [];
      const inputs: string[] = [];
      
      for (let i = 0; i < tempClips.length; i++) {
        inputs.push(`[${i}:v]`);
      }
      
      filters.push(`${inputs.join('')}concat=n=${tempClips.length}:v=1:a=0[outv]`);
      
      const command = ffmpeg();
      tempClips.forEach(clip => command.input(clip));
      
      await new Promise<void>((resolve, reject) => {
        command
          .complexFilter(filters)
          .outputOptions([
            '-map', '[outv]',
            '-r', '25',
            '-pix_fmt', 'yuv420p',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
          ])
          .output(outputPath)
          .on('start', (cmd) => {
            console.log('[ffmpeg-helpers] FFmpeg concat command:', cmd);
          })
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    }
    
    console.log('[ffmpeg-helpers] ✓ Static video complete');
    return outputPath;
    
  } finally {
    // Cleanup temp clips
    for (const clip of tempClips) {
      try {
        if (existsSync(clip)) {
          unlinkSync(clip);
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
}

// Image Effect type for visual filters
type ImageEffect = 'none' | 'vignette' | 'sepia' | 'black-white' | 'warm' | 'cool' | 'grain' | 'dramatic' | 'cinematic' | 'dreamy' | 'glow';

// Image Animation type
type ImageAnimation = 'zoom-in' | 'zoom-out' | 'pan-right' | 'pan-left' | 'pan-up' | 'pan-down' | 'ken-burns' | 'rotate-cw' | 'rotate-ccw' | 'slide-left' | 'slide-right';

/**
 * Get FFmpeg filter string for an effect
 */
function getEffectFilter(effect: ImageEffect): string {
  switch (effect) {
    case 'vignette':
      return 'vignette=a=PI/4';
    case 'sepia':
      // Sepia color matrix
      return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
    case 'black-white':
      return 'hue=s=0';
    case 'warm':
      // Warm tones: increase red, saturation
      return 'eq=saturation=1.15:gamma_r=1.1:gamma_b=0.9';
    case 'cool':
      // Cool tones: increase blue, decrease red
      return 'eq=saturation=0.9:gamma_r=0.9:gamma_b=1.15';
    case 'grain':
      // Film grain effect
      return 'noise=c0s=12:c0f=t+u';
    case 'dramatic':
      // High contrast, saturated
      return 'eq=contrast=1.25:saturation=1.2:brightness=-0.02';
    case 'cinematic':
      // Cinematic look: contrast, slight color grade
      return 'eq=contrast=1.15:brightness=-0.03:saturation=1.1,colorbalance=rs=0.05:gs=-0.02:bs=0.08';
    case 'dreamy':
      // Soft, bright, slight blur (can't use gblur in chain, use brightness instead)
      return 'eq=brightness=0.05:contrast=0.95:saturation=0.9';
    case 'glow':
      // Bright glow effect
      return 'eq=brightness=0.08:contrast=1.05:saturation=1.1';
    case 'none':
    default:
      return '';
  }
}

/**
 * Create video from static images with custom CSS-to-FFmpeg animations and effects
 * Supports animations: zoom-in, zoom-out, pan-right, pan-left, pan-up, pan-down, rotate-cw, rotate-ccw, slide-left, slide-right, ken-burns
 * Supports effects: vignette, sepia, black-white, warm, cool, grain, dramatic, cinematic, dreamy, glow
 */
export async function createVideoFromImagesWithAnimations(
  imagePaths: string[],
  durations: number[],
  animations: Array<ImageAnimation | null>,
  effects?: Array<ImageEffect | null>
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_animated_images.mp4`);
  
  console.log(`[ffmpeg-helpers] Creating video from ${imagePaths.length} images with animations and effects...`);
  
  const filters: string[] = [];
  const inputs: string[] = [];
  const fps = 25;
  
  for (let i = 0; i < imagePaths.length; i++) {
    const duration = durations[i];
    const frames = duration * fps;
    const animation = animations[i] || 'ken-burns'; // Default to ken-burns if null
    const effect = effects?.[i] || 'none'; // Default to none if not provided
    
    console.log(`[ffmpeg-helpers] Scene ${i + 1}: ${animation} + ${effect} (${duration}s)`);
    
    let filter = `[${i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080`;
    
    // Apply animation-specific FFmpeg filters (smooth, continuous movements with easing - no jitter)
    switch (animation) {
      case 'zoom-in':
        // Smooth continuous zoom with ease-in-out (cinematic, no jitter)
        filter += `,zoompan=z='1+0.05*pow(on/${frames},1.5)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'zoom-out':
        // Smooth continuous zoom out with ease-in-out
        filter += `,zoompan=z='1.05-0.05*pow(on/${frames},1.5)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'pan-right':
        // Smooth gentle pan with easing (professional, no jitter)
        filter += `,zoompan=z='1.03':x='iw/2-(iw/zoom/2)-pow(on/${frames},1.5)*(iw/6)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'pan-left':
        // Smooth gentle pan from right to left with easing
        filter += `,zoompan=z='1.03':x='iw/2-(iw/zoom/2)+pow(on/${frames},1.5)*(iw/6)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'pan-up':
        // Smooth gentle pan from bottom to top with easing
        filter += `,zoompan=z='1.03':y='ih/2-(ih/zoom/2)+pow(on/${frames},1.5)*(ih/6)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'pan-down':
        // Smooth gentle pan from top to bottom with easing
        filter += `,zoompan=z='1.03':y='ih/2-(ih/zoom/2)-pow(on/${frames},1.5)*(ih/6)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
        case 'rotate-cw':
          // First use zoompan to generate frames, then apply rotation
          // Subtle rotation: starts at 0, ends at ~15 degrees (PI/12)
          filter += `,zoompan=z='1':d=${frames}:s=1920x1080:fps=${fps},pad=iw*1.5:ih*1.5:(ow-iw)/2:(oh-ih)/2,rotate='(PI/12)*t/${duration}':c=none,crop=1920:1080`;
          break;
          
        case 'rotate-ccw':
          // First use zoompan to generate frames, then apply counter-clockwise rotation
          filter += `,zoompan=z='1':d=${frames}:s=1920x1080:fps=${fps},pad=iw*1.5:ih*1.5:(ow-iw)/2:(oh-ih)/2,rotate='-(PI/12)*t/${duration}':c=none,crop=1920:1080`;
          break;
        
      case 'slide-left':
        // Smooth gentle slide with easing (no jitter)
        filter += `,zoompan=z='1':x='(iw*0.15)-pow(on/${frames},1.5)*(iw*0.15)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'slide-right':
        // Smooth gentle slide from left with easing
        filter += `,zoompan=z='1':x='-(iw*0.15)+pow(on/${frames},1.5)*(iw*0.15)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
        
      case 'ken-burns':
      default:
        // Smooth very subtle Ken Burns with easing (cinematic quality)
        filter += `,zoompan=z='1+0.03*pow(on/${frames},1.5)':d=${frames}:s=1920x1080:fps=${fps}`;
        break;
    }
    
    // Apply visual effect filter after animation
    const effectFilter = getEffectFilter(effect);
    if (effectFilter) {
      filter += `,${effectFilter}`;
    }
    
    filter += `[v${i}]`;
    filters.push(filter);
    inputs.push(`[v${i}]`);
  }
  
  // Concatenate all animated clips
  filters.push(`${inputs.join('')}concat=n=${imagePaths.length}:v=1:a=0[outv]`);
  
  const command = ffmpeg();
  
  // Add all images as inputs
  imagePaths.forEach(img => command.input(img));
  
  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filters)
      .outputOptions([
        '-map', '[outv]',
        '-r', '25',
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg animated image-to-video command:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[ffmpeg-helpers] Animation progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] ✓ Animated image-to-video complete');
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] ✗ Animated image-to-video error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Concatenate multiple audio files using filter_complex
 * Most reliable method - works with ElevenLabs MP3 files without needing list files
 */
export async function concatenateAudioFiles(audioPaths: string[]): Promise<string> {
  console.log(`[ffmpeg-helpers] Concatenating ${audioPaths.length} audio files...`);
  
  if (audioPaths.length === 1) {
    console.log('[ffmpeg-helpers] Single audio file, no concatenation needed');
    return audioPaths[0];
  }
  
  // Verify all files exist before processing
  for (const audioPath of audioPaths) {
    if (!existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }
    const stats = statSync(audioPath);
    console.log(`[ffmpeg-helpers] ✓ Verified: ${path.basename(audioPath)} (${(stats.size / 1024).toFixed(2)}KB)`);
  }
  
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_audio.mp3`);
  
  // Use filter_complex for reliable concatenation (no list file needed!)
  const command = ffmpeg();
  
  // Add all audio files as inputs
  audioPaths.forEach(audioPath => {
    command.input(audioPath);
  });
  
  // Build filter_complex: [0:a][1:a]concat=n=2:v=0:a=1[outa]
  const filterInputs = audioPaths.map((_, i) => `[${i}:a]`).join('');
  const filterComplex = `${filterInputs}concat=n=${audioPaths.length}:v=0:a=1[outa]`;
  
  console.log('[ffmpeg-helpers] Files to concatenate:', audioPaths.map(p => path.basename(p)));
  console.log('[ffmpeg-helpers] Filter complex:', filterComplex);
  
  try {
    await new Promise<void>((resolve, reject) => {
      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[outa]',
          '-c:a', 'libmp3lame',
          '-b:a', '192k',
          '-ar', '44100',
          '-ac', '2',
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('[ffmpeg-helpers] FFmpeg concat command:', cmd);
        })
        .on('end', () => {
          console.log('[ffmpeg-helpers] ✓ Audio concatenation complete');
          resolve();
        })
        .on('error', (err) => {
          console.error('[ffmpeg-helpers] ✗ Concat error:', err);
          reject(err);
        })
        .run();
    });
    
    return outputPath;
    
  } catch (error) {
    console.error('[ffmpeg-helpers] Audio concatenation failed:', error);
    throw error;
  }
}

/**
 * Merge voiceover audio with video
 */
export async function mergeVoiceover(
  videoPath: string,
  audioPath: string
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_with_audio.mp4`);
  
  console.log('[ffmpeg-helpers] Merging voiceover with video...');
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions([
        '-c:v', 'copy',  // Copy video
        '-c:a', 'aac',   // Encode audio to AAC
        '-b:a', '192k',
        // Removed -shortest to prevent cutting off last words
        '-map', '0:v:0',
        '-map', '1:a:0',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg merge command:', cmd);
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] Voiceover merge complete');
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] Merge error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Get audio duration from MP3 buffer using FFmpeg
 */
export async function getAudioDuration(audioBuffer: Buffer): Promise<number> {
  const tempPath = path.join(TEMP_DIR, `${randomUUID()}_temp_audio.mp3`);
  
  try {
    // Write buffer to temp file
    writeFileSync(tempPath, audioBuffer);
    
    // Get duration using ffprobe
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tempPath, (err, metadata) => {
        // Clean up temp file
        try {
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
        } catch (cleanupErr) {
          console.warn('[ffmpeg-helpers] Failed to cleanup temp audio file:', cleanupErr);
        }
        
        if (err) {
          console.error('[ffmpeg-helpers] FFprobe error:', err);
          reject(err);
          return;
        }
        
        const duration = metadata.format.duration;
        if (!duration) {
          reject(new Error('Could not determine audio duration'));
          return;
        }
        
        console.log(`[ffmpeg-helpers] Audio duration: ${duration.toFixed(2)}s`);
        resolve(Math.round(duration)); // Round to nearest second
      });
    });
  } catch (error) {
    // Clean up on error
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch (cleanupErr) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Get audio duration from URL by downloading and analyzing with FFprobe
 * More reliable than buffer method as it works with actual CDN files
 */
export async function getAudioDurationFromUrl(audioUrl: string): Promise<number> {
  const tempPath = path.join(TEMP_DIR, `${randomUUID()}_temp_audio_check.mp3`);
  
  try {
    // Download audio file
    console.log(`[ffmpeg-helpers] Downloading audio to check duration...`);
    const response = await fetch(audioUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to temp file
    writeFileSync(tempPath, buffer);
    console.log(`[ffmpeg-helpers] Audio file downloaded: ${(buffer.length / 1024).toFixed(2)}KB`);
    
    // Get duration using ffprobe
    return new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tempPath, (err, metadata) => {
        // Clean up temp file
        try {
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
        } catch (cleanupErr) {
          console.warn('[ffmpeg-helpers] Failed to cleanup temp audio file:', cleanupErr);
        }
        
        if (err) {
          console.error('[ffmpeg-helpers] FFprobe error:', err);
          reject(err);
          return;
        }
        
        const duration = metadata.format.duration;
        if (!duration) {
          reject(new Error('Could not determine audio duration'));
          return;
        }
        
        console.log(`[ffmpeg-helpers] Audio duration from URL: ${duration.toFixed(2)}s`);
        resolve(Math.round(duration)); // Round to nearest second
      });
    });
  } catch (error) {
    // Clean up on error
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch (cleanupErr) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Get video duration using ffprobe
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('[ffmpeg-helpers] FFprobe error:', err);
        reject(err);
        return;
      }
      
      const duration = metadata.format.duration;
      if (!duration) {
        reject(new Error('Could not determine video duration'));
        return;
      }
      
      console.log(`[ffmpeg-helpers] Video duration: ${duration.toFixed(2)}s`);
      resolve(duration);
    });
  });
}

/**
 * Adjust video speed to match target duration (professional sync)
 * Handles both speedup and slowdown smoothly
 */
export async function adjustVideoSpeed(
  videoPath: string,
  targetDuration: number
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_speed_adjusted.mp4`);
  
  // Get current duration
  const currentDuration = await getVideoDuration(videoPath);
  
  if (Math.abs(currentDuration - targetDuration) < 0.1) {
    // Duration is close enough, no adjustment needed
    console.log(`[ffmpeg-helpers] Video duration already matches target (${currentDuration.toFixed(2)}s ≈ ${targetDuration.toFixed(2)}s)`);
    return videoPath;
  }
  
  const speed = currentDuration / targetDuration;
  
  console.log(`[ffmpeg-helpers] Adjusting video speed: ${currentDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s (speed=${speed.toFixed(2)}x)`);
  
  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg(videoPath);
    
    // Video speed adjustment
    command.videoFilters(`setpts=${(1/speed).toFixed(4)}*PTS`);
    
    // Audio speed adjustment (if audio exists)
    // atempo filter only supports 0.5-2.0 range, so we may need to chain multiple
    if (speed >= 0.5 && speed <= 2.0) {
      command.audioFilters(`atempo=${speed.toFixed(4)}`);
    } else if (speed > 2.0) {
      // Chain multiple atempo filters for speeds > 2x
      const filters: string[] = [];
      let remainingSpeed = speed;
      while (remainingSpeed > 2.0) {
        filters.push('atempo=2.0');
        remainingSpeed /= 2.0;
      }
      filters.push(`atempo=${remainingSpeed.toFixed(4)}`);
      command.audioFilters(filters.join(','));
    } else {
      // Chain multiple atempo filters for speeds < 0.5x
      const filters: string[] = [];
      let remainingSpeed = speed;
      while (remainingSpeed < 0.5) {
        filters.push('atempo=0.5');
        remainingSpeed /= 0.5;
      }
      filters.push(`atempo=${remainingSpeed.toFixed(4)}`);
      command.audioFilters(filters.join(','));
    }
    
    command
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg speed adjust command:', cmd);
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] ✓ Video speed adjusted successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] ✗ Speed adjustment error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Loop video to extend duration (for short videos)
 */
export async function loopVideo(
  videoPath: string,
  targetDuration: number
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_looped.mp4`);
  
  const currentDuration = await getVideoDuration(videoPath);
  const loopCount = Math.ceil(targetDuration / currentDuration);
  
  console.log(`[ffmpeg-helpers] Looping video ${loopCount} times: ${currentDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s`);
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .inputOptions(['-stream_loop', (loopCount - 1).toString()])
      .outputOptions([
        '-t', targetDuration.toString(),
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg loop command:', cmd);
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] ✓ Video looped successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] ✗ Loop error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Mix background music with video
 */
export async function mixBackgroundMusic(
  videoPath: string,
  musicPath: string,
  voiceVolume: number,
  musicVolume: number
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_with_music.mp4`);
  
  console.log('[ffmpeg-helpers] Mixing background music...');
  
  // Calculate volume levels (0-100 to 0-1)
  const voiceVol = voiceVolume / 100;
  const musicVol = musicVolume / 100;
  
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(musicPath)
      .complexFilter([
        // Extract audio from video and adjust volume
        `[0:a]volume=${voiceVol}[voice]`,
        // Loop music if needed and adjust volume
        `[1:a]aloop=loop=-1:size=2e+09,volume=${musicVol}[music]`,
        // Mix both audio streams
        '[voice][music]amix=inputs=2:duration=first[aout]'
      ])
      .outputOptions([
        '-map', '0:v',    // Video from first input
        '-map', '[aout]', // Mixed audio
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        // Removed -shortest to prevent cutting off audio
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[ffmpeg-helpers] FFmpeg mix command:', cmd);
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] Music mixing complete');
        resolve();
      })
      .on('error', (err) => {
        console.error('[ffmpeg-helpers] Mix error:', err);
        reject(err);
      })
      .run();
  });
  
  return outputPath;
}

/**
 * Get temp directory path
 */
export function getTempDir(): string {
  return TEMP_DIR;
}

/**
 * Cleanup temp files
 */
export function cleanupFiles(filePaths: string[]): void {
  filePaths.forEach((filePath) => {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        console.log(`[ffmpeg-helpers] Cleaned up: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.warn(`[ffmpeg-helpers] Cleanup failed for ${filePath}:`, error);
    }
  });
}

/**
 * Create a muted copy of a video (remove all audio streams)
 * Used for real-time volume control preview
 */
export async function createMutedVideo(inputPath: string): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_muted.mp4`);
  
  console.log('[ffmpeg-helpers] Creating muted video...');
  console.log('[ffmpeg-helpers]   Input:', inputPath);
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v', 'copy',  // Copy video stream without re-encoding
        '-an',           // Remove all audio streams
      ])
      .output(outputPath)
      .on('start', (cmd: string) => {
        console.log('[ffmpeg-helpers] FFmpeg mute command:', cmd.substring(0, 100) + '...');
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] ✓ Muted video created:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[ffmpeg-helpers] Muted video creation failed:', err.message);
        reject(err);
      })
      .run();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUAL SPEED SYNC - Professional Audio/Video Synchronization
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Speed limits for professional quality
 * STRATEGY: Prefer slowdown over speedup (more natural)
 * - Slow motion video looks good
 * - Slow audio sounds natural
 * - Fast audio sounds robotic/unnatural
 */
const SPEED_LIMITS = {
  video: { min: 0.4, max: 1.5 },   // Video: prefer slowdown (0.4x-1.5x)
  audio: { min: 0.85, max: 1.1 },  // Audio: minimal change (0.85x-1.1x) - keep natural!
};

/**
 * Calculate optimal speeds with PREFER SLOWDOWN strategy
 * 
 * Philosophy:
 * - If video is shorter than audio → slow down video (slow motion is beautiful)
 * - If video is longer than audio → slow down audio slightly (natural), keep video as-is
 * - NEVER speed up audio beyond 1.1x (sounds robotic)
 * - Prefer longer target durations (gives breathing room)
 * 
 * @param videoDuration - Original video duration in seconds
 * @param audioDuration - Original audio duration in seconds
 * @returns Object with targetDuration, videoSpeed, audioSpeed
 */
export function calculateDualSpeedSync(
  videoDuration: number,
  audioDuration: number
): { targetDuration: number; videoSpeed: number; audioSpeed: number; method: string } {
  
  // If durations are very close (<0.3s difference), no adjustment needed
  const diff = Math.abs(videoDuration - audioDuration);
  if (diff < 0.3) {
    return {
      targetDuration: Math.max(videoDuration, audioDuration),
      videoSpeed: 1.0,
      audioSpeed: 1.0,
      method: 'none',
    };
  }
  
  let targetDuration: number;
  let videoSpeed: number;
  let audioSpeed: number;
  let method: string;
  
  if (videoDuration < audioDuration) {
    // ═══════════════════════════════════════════════════════════════
    // CASE 1: Video is SHORTER than Audio
    // Strategy: Slow down video to match audio (slow motion looks great!)
    // ═══════════════════════════════════════════════════════════════
    
    // Target = audio duration (keep audio natural at 1.0x)
    targetDuration = audioDuration;
    audioSpeed = 1.0;
    videoSpeed = videoDuration / targetDuration;
    
    // Check if video slowdown is within limits
    if (videoSpeed >= SPEED_LIMITS.video.min) {
      // Perfect! Just slow down video
      method = 'video-slowdown';
    } else {
      // Video would be too slow - need to help with audio slowdown too
      videoSpeed = SPEED_LIMITS.video.min;
      targetDuration = videoDuration / videoSpeed;
      audioSpeed = audioDuration / targetDuration;
      
      // Clamp audio slowdown
      if (audioSpeed < SPEED_LIMITS.audio.min) {
        audioSpeed = SPEED_LIMITS.audio.min;
        // Recalculate - use the longer resulting duration
        const fromVideo = videoDuration / SPEED_LIMITS.video.min;
        const fromAudio = audioDuration / SPEED_LIMITS.audio.min;
        targetDuration = Math.max(fromVideo, fromAudio);
        videoSpeed = videoDuration / targetDuration;
        audioSpeed = audioDuration / targetDuration;
      }
      method = 'dual-slowdown';
    }
    
  } else {
    // ═══════════════════════════════════════════════════════════════
    // CASE 2: Video is LONGER than Audio  
    // Strategy: Slow down audio slightly, keep video natural
    // ═══════════════════════════════════════════════════════════════
    
    // First try: keep video at 1.0x, slow down audio
    targetDuration = videoDuration;
    videoSpeed = 1.0;
    audioSpeed = audioDuration / targetDuration;
    
    if (audioSpeed >= SPEED_LIMITS.audio.min) {
      // Audio slowdown is acceptable
      method = 'audio-slowdown';
    } else {
      // Audio would be too slow - need to speed up video slightly
      audioSpeed = SPEED_LIMITS.audio.min;
      targetDuration = audioDuration / audioSpeed;
      videoSpeed = videoDuration / targetDuration;
      
      // Clamp video speedup
      if (videoSpeed > SPEED_LIMITS.video.max) {
        videoSpeed = SPEED_LIMITS.video.max;
        targetDuration = videoDuration / videoSpeed;
        audioSpeed = audioDuration / targetDuration;
      }
      method = 'balanced';
    }
  }
  
  // Final safety clamp
  videoSpeed = Math.max(SPEED_LIMITS.video.min, Math.min(SPEED_LIMITS.video.max, videoSpeed));
  audioSpeed = Math.max(SPEED_LIMITS.audio.min, Math.min(SPEED_LIMITS.audio.max, audioSpeed));
  
  return {
    targetDuration,
    videoSpeed,
    audioSpeed,
    method,
  };
}

/**
 * Adjust audio speed while preserving pitch (professional quality)
 * Uses FFmpeg's atempo filter with chaining for extreme speeds
 * 
 * @param audioPath - Path to input audio file
 * @param targetDuration - Desired duration in seconds
 * @returns Path to speed-adjusted audio file
 */
export async function adjustAudioSpeed(
  audioPath: string,
  targetDuration: number
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_audio_speed.mp3`);
  
  // Get current duration
  const currentDuration = await getAudioDurationFromFile(audioPath);
  
  if (Math.abs(currentDuration - targetDuration) < 0.1) {
    console.log(`[ffmpeg-helpers] Audio duration already matches target (${currentDuration.toFixed(2)}s ≈ ${targetDuration.toFixed(2)}s)`);
    return audioPath;
  }
  
  const speed = currentDuration / targetDuration;
  
  console.log(`[ffmpeg-helpers] Adjusting audio speed: ${currentDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s (speed=${speed.toFixed(3)}x)`);
  
  // Build atempo filter chain (atempo only supports 0.5-2.0 range)
  const atempoFilters = buildAtempoFilterChain(speed);
  
  return new Promise((resolve, reject) => {
    ffmpeg(audioPath)
      .audioFilters(atempoFilters)
      .outputOptions([
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        '-ar', '44100',
      ])
      .output(outputPath)
      .on('start', (cmd: string) => {
        console.log('[ffmpeg-helpers] FFmpeg audio speed command:', cmd.substring(0, 120) + '...');
      })
      .on('end', () => {
        console.log('[ffmpeg-helpers] ✓ Audio speed adjusted successfully');
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error('[ffmpeg-helpers] Audio speed adjustment failed:', err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Build atempo filter chain for extreme speed adjustments
 * atempo only supports 0.5-2.0, so we chain multiple filters
 */
function buildAtempoFilterChain(speed: number): string {
  const filters: string[] = [];
  let remainingSpeed = speed;
  
  if (speed >= 0.5 && speed <= 2.0) {
    // Direct application
    return `atempo=${speed.toFixed(4)}`;
  }
  
  if (speed > 2.0) {
    // Speed up: chain 2.0x filters
    while (remainingSpeed > 2.0) {
      filters.push('atempo=2.0');
      remainingSpeed /= 2.0;
    }
    if (remainingSpeed > 1.0) {
      filters.push(`atempo=${remainingSpeed.toFixed(4)}`);
    }
  } else {
    // Slow down: chain 0.5x filters
    while (remainingSpeed < 0.5) {
      filters.push('atempo=0.5');
      remainingSpeed *= 2.0;
    }
    if (remainingSpeed < 1.0) {
      filters.push(`atempo=${remainingSpeed.toFixed(4)}`);
    }
  }
  
  return filters.join(',');
}

/**
 * Get audio duration from file path
 */
async function getAudioDurationFromFile(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        console.error('[ffmpeg-helpers] Failed to get audio duration:', err);
        reject(err);
        return;
      }
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Sync video and audio using Dual Speed Adjustment (no looping!)
 * Both video and audio speeds are adjusted to meet at optimal target duration
 * 
 * @param videoPath - Path to video file
 * @param audioPath - Path to audio file  
 * @returns Object with adjusted video path, audio path, and sync info
 */
export async function syncVideoAudioDual(
  videoPath: string,
  audioPath: string
): Promise<{
  videoPath: string;
  audioPath: string;
  targetDuration: number;
  videoSpeed: number;
  audioSpeed: number;
  method: string;
}> {
  // Get durations
  const videoDuration = await getVideoDuration(videoPath);
  const audioDuration = await getAudioDurationFromFile(audioPath);
  
  console.log('[ffmpeg-helpers] ═══════════════════════════════════════════════');
  console.log('[ffmpeg-helpers] DUAL SPEED SYNC');
  console.log('[ffmpeg-helpers] ═══════════════════════════════════════════════');
  console.log(`[ffmpeg-helpers] Video: ${videoDuration.toFixed(2)}s`);
  console.log(`[ffmpeg-helpers] Audio: ${audioDuration.toFixed(2)}s`);
  console.log(`[ffmpeg-helpers] Difference: ${Math.abs(videoDuration - audioDuration).toFixed(2)}s`);
  
  // Calculate optimal speeds
  const sync = calculateDualSpeedSync(videoDuration, audioDuration);
  
  console.log(`[ffmpeg-helpers] Target: ${sync.targetDuration.toFixed(2)}s`);
  console.log(`[ffmpeg-helpers] Video speed: ${sync.videoSpeed.toFixed(3)}x`);
  console.log(`[ffmpeg-helpers] Audio speed: ${sync.audioSpeed.toFixed(3)}x`);
  console.log(`[ffmpeg-helpers] Method: ${sync.method}`);
  
  // Apply adjustments
  let adjustedVideoPath = videoPath;
  let adjustedAudioPath = audioPath;
  
  if (sync.method !== 'none') {
    // Adjust video speed
    if (Math.abs(sync.videoSpeed - 1.0) > 0.01) {
      console.log('[ffmpeg-helpers] Adjusting video speed...');
      adjustedVideoPath = await adjustVideoSpeed(videoPath, sync.targetDuration);
    }
    
    // Adjust audio speed
    if (Math.abs(sync.audioSpeed - 1.0) > 0.01) {
      console.log('[ffmpeg-helpers] Adjusting audio speed...');
      adjustedAudioPath = await adjustAudioSpeed(audioPath, sync.targetDuration);
    }
  }
  
  console.log('[ffmpeg-helpers] ✓ Dual speed sync complete');
  console.log('[ffmpeg-helpers] ═══════════════════════════════════════════════');
  
  return {
    videoPath: adjustedVideoPath,
    audioPath: adjustedAudioPath,
    targetDuration: sync.targetDuration,
    videoSpeed: sync.videoSpeed,
    audioSpeed: sync.audioSpeed,
    method: sync.method,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATIVE TRANSITIONS - 2025 Trending
// ═══════════════════════════════════════════════════════════════════════════════

import type { SceneTransition } from '../types';

/**
 * Create video with creative transitions between clips
 * Uses sequential xfade approach - one transition at a time
 */
export async function createVideoWithCreativeTransitions(
  clipPaths: string[],
  clipDurations: number[],
  transitions: Array<SceneTransition | null>,
  transitionDurations: number[]
): Promise<string> {
  if (clipPaths.length === 0) {
    throw new Error('No clips provided for transition video');
  }
  
  if (clipPaths.length === 1) {
    console.log('[ffmpeg-helpers] Single clip, no transitions needed');
    return clipPaths[0];
  }
  
  console.log(`[ffmpeg-helpers] ═══════════════════════════════════════════════`);
  console.log(`[ffmpeg-helpers] CREATIVE TRANSITIONS (sequential xfade)`);
  console.log(`[ffmpeg-helpers] ═══════════════════════════════════════════════`);
  console.log(`[ffmpeg-helpers] Clips: ${clipPaths.length}`);
  console.log(`[ffmpeg-helpers] Clip durations: ${clipDurations.join(', ')}s`);
  
  // Apply transitions one at a time to avoid complex filter chains
  let currentVideo = clipPaths[0];
  let currentDuration = clipDurations[0] || 5;
  const tempFiles: string[] = [];
  
  try {
    for (let i = 1; i < clipPaths.length; i++) {
      const nextClip = clipPaths[i];
      const nextDuration = clipDurations[i] || 5;
      const transition = transitions[i - 1] || 'fade';
      const transDur = Math.min(transitionDurations[i - 1] || 0.5, 0.8);
      
      console.log(`[ffmpeg-helpers] Applying transition ${i}: ${transition} (${transDur}s)`);
      
      const outputPath = path.join(TEMP_DIR, `${randomUUID()}_xfade_step${i}.mp4`);
      
      // xfade offset = when transition starts = current video duration - transition duration
      const offset = Math.max(0.1, currentDuration - transDur);
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(currentVideo)
          .input(nextClip)
          .complexFilter([
            `[0:v][1:v]xfade=transition=${getFFmpegTransition(transition)}:duration=${transDur.toFixed(2)}:offset=${offset.toFixed(2)}[outv]`
          ])
          .outputOptions([
            '-map', '[outv]',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-r', '30',
            '-pix_fmt', 'yuv420p',
          ])
          .output(outputPath)
          .on('start', (cmd) => {
            console.log(`[ffmpeg-helpers] xfade step ${i}: offset=${offset.toFixed(2)}`);
          })
          .on('end', () => {
            console.log(`[ffmpeg-helpers] ✓ Step ${i} complete`);
            resolve();
          })
          .on('error', (err: Error) => {
            console.error(`[ffmpeg-helpers] xfade step ${i} error:`, err.message);
            reject(err);
          })
          .run();
      });
      
      // Track for cleanup (but don't clean up input files from user)
      if (i > 1 && currentVideo.includes('_xfade_step')) {
        tempFiles.push(currentVideo);
      }
      
      currentVideo = outputPath;
      // New duration = old duration + next duration - transition overlap
      currentDuration = currentDuration + nextDuration - transDur;
    }
    
    console.log('[ffmpeg-helpers] ✓ All transitions applied');
    
    // Cleanup intermediate files
    for (const f of tempFiles) {
      try { if (existsSync(f)) unlinkSync(f); } catch (e) { /* ignore */ }
    }
    
    return currentVideo;
    
  } catch (error) {
    // Cleanup on error
    for (const f of tempFiles) {
      try { if (existsSync(f)) unlinkSync(f); } catch (e) { /* ignore */ }
    }
    
    // Fallback: simple concatenation without transitions
    console.log('[ffmpeg-helpers] xfade failed, falling back to simple concatenation');
    return await concatenateVideos(clipPaths);
  }
}

/**
 * Map our transition names to FFmpeg xfade transition names
 */
function getFFmpegTransition(transition: SceneTransition): string {
  const mapping: Record<SceneTransition, string> = {
    // Motion-based
    'whip-pan': 'slideleft',
    'zoom-punch': 'smoothup',
    'snap-zoom': 'circlecrop',
    'motion-blur-left': 'slideleft',
    'motion-blur-right': 'slideright',
    'motion-blur-up': 'slideup',
    'motion-blur-down': 'slidedown',
    // Light & Glow
    'flash-white': 'fadewhite',
    'flash-black': 'fadeblack',
    'light-leak': 'fadegrays',
    'lens-flare': 'hlwind',
    'luma-fade': 'hlslice',
    // Digital / Glitch
    'glitch': 'pixelize',
    'rgb-split': 'horzclose',
    'pixelate': 'pixelize',
    'vhs-noise': 'squeezev',
    // Shape reveals
    'circle-open': 'circleopen',
    'circle-close': 'circleclose',
    'heart-reveal': 'circleopen',
    'diamond-wipe': 'diagtl',
    'star-wipe': 'radial',
    'diagonal-tl': 'diagtl',
    'diagonal-br': 'diagbr',
    // 3D Effects
    'cube-rotate-left': 'horzopen',
    'cube-rotate-right': 'horzclose',
    'page-flip': 'wipebl',
    'parallax-slide': 'smoothleft',
    // Smooth & Elegant
    'smooth-blur': 'smoothdown',
    'cross-dissolve': 'dissolve',
    'wave-ripple': 'wipetl',
    'zoom-blur': 'radial',
    // Classic
    'fade': 'fade',
    'wipe-left': 'wipeleft',
    'wipe-right': 'wiperight',
    'wipe-up': 'wipeup',
    'wipe-down': 'wipedown',
    'none': 'fade',
  };
  return mapping[transition] || 'fade';
}

/**
 * Create video from static images with creative transitions
 * Each image becomes a clip, then xfade transitions are applied between them
 */
export async function createVideoFromImagesWithCreativeTransitions(
  imagePaths: string[],
  durations: number[],
  animations: Array<ImageAnimation | null>,
  effects: Array<ImageEffect | null>,
  transitions: Array<SceneTransition | null>,
  transitionDurations: number[]
): Promise<string> {
  console.log(`[ffmpeg-helpers] ═══════════════════════════════════════════════`);
  console.log(`[ffmpeg-helpers] IMAGE VIDEO WITH CREATIVE TRANSITIONS`);
  console.log(`[ffmpeg-helpers] ═══════════════════════════════════════════════`);
  console.log(`[ffmpeg-helpers] Images: ${imagePaths.length}`);
  console.log(`[ffmpeg-helpers] Durations: ${durations.join(', ')}s`);
  
  const tempClips: string[] = [];
  
  try {
    // Step 1: Create individual animated clips from each image
    console.log('[ffmpeg-helpers] Step 1: Creating animated clips from images...');
    
    for (let i = 0; i < imagePaths.length; i++) {
      const animation = animations[i];
      const effect = effects?.[i] || null;
      const duration = durations[i] || 5;
      
      console.log(`[ffmpeg-helpers] Clip ${i + 1}/${imagePaths.length}: ${animation || 'ken-burns'} (${duration}s)`);
      
      const clipPath = await createSingleAnimatedClip(
        imagePaths[i],
        duration,
        animation,
        effect
      );
      tempClips.push(clipPath);
    }
    
    console.log(`[ffmpeg-helpers] ✓ Created ${tempClips.length} clips`);
    
    // Step 2: Apply creative transitions between clips
    if (tempClips.length === 1) {
      console.log('[ffmpeg-helpers] Single clip, returning directly');
      return tempClips[0];
    }
    
    console.log('[ffmpeg-helpers] Step 2: Applying creative transitions...');
    
    const finalVideo = await createVideoWithCreativeTransitions(
      tempClips,
      durations,
      transitions,
      transitionDurations
    );
    
    // Cleanup temp clips after successful merge
    console.log('[ffmpeg-helpers] Cleaning up temporary clips...');
    for (const clip of tempClips) {
      try {
        if (existsSync(clip)) {
          unlinkSync(clip);
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    
    return finalVideo;
    
  } catch (error) {
    // Cleanup on error
    console.error('[ffmpeg-helpers] Error in createVideoFromImagesWithCreativeTransitions:', error);
    for (const clip of tempClips) {
      try {
        if (existsSync(clip)) {
          unlinkSync(clip);
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Create a single animated clip from an image
 * Applies Ken Burns / animation effects with SMOOTH motion (no jitter)
 * 
 * KEY TECHNIQUES to prevent jitter:
 * 1. Scale image to 4K internally for smoother panning
 * 2. Use linear interpolation formulas (on/n instead of min/max)
 * 3. Output at consistent 30fps with proper timing
 * 4. Use high-quality scaling flags
 */
async function createSingleAnimatedClip(
  imagePath: string,
  duration: number,
  animation: ImageAnimation | null,
  effect: ImageEffect | null
): Promise<string> {
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_animated_clip.mp4`);
  const fps = 30;
  const n = Math.ceil(duration * fps); // Total frames
  const anim = animation || 'ken-burns';
  
  console.log(`[ffmpeg-helpers] Creating smooth clip: ${anim} (${duration}s, ${n} frames)`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SMOOTH ZOOMPAN FORMULAS
  // ═══════════════════════════════════════════════════════════════════════════
  // Variables:
  //   on = current frame number (0 to n-1)
  //   n  = total frames
  //   iw, ih = input width/height (after scale)
  //   ow, oh = output width/height (1920x1080)
  //   zoom = current zoom level
  // 
  // Formula for smooth linear interpolation: start + (end - start) * (on/n)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Scale to 4K first for better quality panning, then zoompan outputs at 1080p
  // Using lanczos scaling for highest quality
  let filter = `scale=3840:2160:force_original_aspect_ratio=increase:flags=lanczos,crop=3840:2160,setsar=1`;
  
  // Output size for zoompan
  const outW = 1920;
  const outH = 1080;
  
  switch (anim) {
    // ═══════════════════════════════════════════════════════════════════════
    // ZOOM ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════════
    case 'zoom-in':
      // Smooth zoom from 1.0x to 1.15x, centered
      // z goes from 1 to 1.15 linearly
      filter += `,zoompan=z='1+0.15*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
      
    case 'zoom-out':
      // Smooth zoom from 1.15x to 1.0x, centered
      // z goes from 1.15 to 1 linearly
      filter += `,zoompan=z='1.15-0.15*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;

    // ═══════════════════════════════════════════════════════════════════════
    // PAN ANIMATIONS (fixed zoom, moving viewport)
    // ═══════════════════════════════════════════════════════════════════════
    case 'pan-right':
      // Pan from left edge to right edge with slight zoom
      // x starts at 0, ends at (iw/zoom - ow)
      filter += `,zoompan=z='1.2':x='(iw/zoom-${outW})*on/${n}':y='(ih/zoom-${outH})/2':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
      
    case 'pan-left':
      // Pan from right edge to left edge
      // x starts at (iw/zoom - ow), ends at 0
      filter += `,zoompan=z='1.2':x='(iw/zoom-${outW})*(1-on/${n})':y='(ih/zoom-${outH})/2':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
      
    case 'pan-up':
      // Pan from bottom to top
      // y starts at (ih/zoom - oh), ends at 0
      filter += `,zoompan=z='1.2':x='(iw/zoom-${outW})/2':y='(ih/zoom-${outH})*(1-on/${n})':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
      
    case 'pan-down':
      // Pan from top to bottom
      // y starts at 0, ends at (ih/zoom - oh)
      filter += `,zoompan=z='1.2':x='(iw/zoom-${outW})/2':y='(ih/zoom-${outH})*on/${n}':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;

    // ═══════════════════════════════════════════════════════════════════════
    // SLIDE ANIMATIONS (more dramatic pan)
    // ═══════════════════════════════════════════════════════════════════════
    case 'slide-left':
      // Slide from right to left with less zoom
      filter += `,zoompan=z='1.15':x='(iw/zoom-${outW})*(1-on/${n})':y='(ih/zoom-${outH})/2':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
      
    case 'slide-right':
      // Slide from left to right
      filter += `,zoompan=z='1.15':x='(iw/zoom-${outW})*on/${n}':y='(ih/zoom-${outH})/2':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;

    // ═══════════════════════════════════════════════════════════════════════
    // ROTATION ANIMATIONS (simulated with diagonal pan + zoom)
    // ═══════════════════════════════════════════════════════════════════════
    case 'rotate-cw':
      // Simulate clockwise rotation with diagonal pan + zoom
      filter += `,zoompan=z='1+0.12*on/${n}':x='iw/2-(iw/zoom/2)+(iw/zoom-${outW})/4*on/${n}':y='ih/2-(ih/zoom/2)+(ih/zoom-${outH})/4*on/${n}':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
      
    case 'rotate-ccw':
      // Simulate counter-clockwise rotation
      filter += `,zoompan=z='1+0.12*on/${n}':x='iw/2-(iw/zoom/2)-(iw/zoom-${outW})/4*on/${n}':y='ih/2-(ih/zoom/2)+(ih/zoom-${outH})/4*on/${n}':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;

    // ═══════════════════════════════════════════════════════════════════════
    // KEN BURNS (classic documentary style: zoom + subtle pan)
    // ═══════════════════════════════════════════════════════════════════════
    case 'ken-burns':
    default:
      // Classic Ken Burns: slow zoom in with slight diagonal drift
      // Creates cinematic, documentary feel
      filter += `,zoompan=z='1+0.1*on/${n}':x='iw/2-(iw/zoom/2)+(iw/zoom-${outW})/6*on/${n}':y='ih/2-(ih/zoom/2)+(ih/zoom-${outH})/8*on/${n}':d=${n}:s=${outW}x${outH}:fps=${fps}`;
      break;
  }
  
  // Apply visual effect if specified (after zoompan)
  if (effect && effect !== 'none') {
    const effectFilter = getEffectFilterString(effect);
    if (effectFilter) {
      filter += `,${effectFilter}`;
    }
  }
  
  // Final format enforcement for xfade compatibility
  filter += `,format=yuv420p`;
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop', '1'])
      .complexFilter(filter)
      .outputOptions([
        '-t', duration.toFixed(2),
        '-c:v', 'libx264',
        '-preset', 'medium',    // Better quality than 'fast'
        '-crf', '20',           // Higher quality (lower = better)
        '-r', String(fps),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-vsync', 'cfr',        // Constant frame rate (prevents jitter)
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`[ffmpeg-helpers] ✓ Smooth clip created: ${anim}`);
        resolve(outputPath);
      })
      .on('error', (err: Error) => {
        console.error(`[ffmpeg-helpers] Clip error:`, err.message);
        reject(err);
      })
      .run();
  });
}

/**
 * Get FFmpeg filter string for visual effect
 */
function getEffectFilterString(effect: ImageEffect): string {
  switch (effect) {
    case 'vignette':
      return 'vignette=a=PI/4';
    case 'sepia':
      return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
    case 'black-white':
      return 'hue=s=0';
    case 'warm':
      return 'eq=saturation=1.15:gamma_r=1.1:gamma_b=0.9';
    case 'cool':
      return 'eq=saturation=0.9:gamma_r=0.9:gamma_b=1.15';
    case 'grain':
      return 'noise=c0s=12:c0f=t+u';
    case 'dramatic':
      return 'eq=contrast=1.25:saturation=1.2:brightness=-0.02';
    case 'cinematic':
      return 'eq=contrast=1.15:brightness=-0.03:saturation=1.1,colorbalance=rs=0.05:gs=-0.02:bs=0.08';
    case 'dreamy':
      return 'eq=brightness=0.05:contrast=0.95:saturation=0.9';
    case 'glow':
      return 'eq=brightness=0.08:contrast=1.05:saturation=1.1';
    default:
      return '';
  }
}

