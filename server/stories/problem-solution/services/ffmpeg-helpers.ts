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

