// Video Loop Service using FFmpeg
// Repeats a video N times to create a seamless loop

import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { createWriteStream, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import type { LoopMultiplier } from "../types";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, "../../../../temp");

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

interface LoopOptions {
  videoUrl: string;
  multiplier: LoopMultiplier;
}

interface LoopResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Check if string is a local file path
 */
function isLocalPath(str: string): boolean {
  return str.startsWith("/temp/") || str.startsWith("\\temp\\") || existsSync(str);
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  // Handle local paths (from temp folder)
  if (isLocalPath(url)) {
    // If it's already a full path, use it directly
    if (existsSync(url)) {
      return; // File already exists, no need to copy
    }
    // If it's a /temp/ URL, construct the full path
    const localPath = path.join(TEMP_DIR, path.basename(url));
    if (existsSync(localPath)) {
      // Copy to output path
      const content = await import("fs/promises").then(fs => fs.readFile(localPath));
      await import("fs/promises").then(fs => fs.writeFile(outputPath, content));
      return;
    }
  }
  
  console.log("[video-looper] Downloading from URL:", url.substring(0, 80) + "...");
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  
  const fileStream = createWriteStream(outputPath);
  // @ts-ignore - Node 18+ supports this
  await pipeline(Readable.fromWeb(response.body), fileStream);
  console.log("[video-looper] Downloaded file to:", outputPath);
}

/**
 * Create a concat file for FFmpeg
 * Lists the same video file N times for looping
 */
function createConcatFile(videoPath: string, multiplier: number, concatFilePath: string): void {
  const lines: string[] = [];
  for (let i = 0; i < multiplier; i++) {
    // Use forward slashes and escape single quotes
    const escapedPath = videoPath.replace(/\\/g, "/").replace(/'/g, "'\\''");
    lines.push(`file '${escapedPath}'`);
  }
  writeFileSync(concatFilePath, lines.join("\n"));
  console.log("[video-looper] Created concat file with", multiplier, "entries");
}

/**
 * Loop a video by repeating it N times using FFmpeg concat
 */
export async function loopVideo(options: LoopOptions): Promise<LoopResult> {
  const { videoUrl, multiplier } = options;
  
  // If multiplier is 1 or less, no looping needed
  if (multiplier <= 1) {
    console.log("[video-looper] No looping needed (multiplier:", multiplier, ")");
    return {
      success: true,
      outputPath: videoUrl, // Return original
    };
  }
  
  console.log("[video-looper] ═══════════════════════════════════════════════");
  console.log("[video-looper] Starting loop process...");
  console.log("[video-looper] Multiplier:", multiplier, "x");
  console.log("[video-looper] Input:", videoUrl.substring(0, 80));
  
  const sessionId = randomUUID();
  const inputPath = path.join(TEMP_DIR, `${sessionId}_input.mp4`);
  const concatPath = path.join(TEMP_DIR, `${sessionId}_concat.txt`);
  const outputPath = path.join(TEMP_DIR, `${sessionId}_looped.mp4`);
  
  try {
    // Step 1: Get the video file locally
    console.log("[video-looper] Step 1: Preparing input video...");
    
    // Check if it's a /temp/ URL (already local)
    let actualInputPath: string;
    if (videoUrl.startsWith("/temp/")) {
      actualInputPath = path.join(TEMP_DIR, path.basename(videoUrl));
      console.log("[video-looper] Using existing temp file:", actualInputPath);
    } else if (existsSync(videoUrl)) {
      actualInputPath = videoUrl;
      console.log("[video-looper] Using existing file path:", actualInputPath);
    } else {
      // Download from URL
      await downloadFile(videoUrl, inputPath);
      actualInputPath = inputPath;
    }
    
    if (!existsSync(actualInputPath)) {
      throw new Error(`Input video not found: ${actualInputPath}`);
    }
    
    // Step 2: Create concat file
    console.log("[video-looper] Step 2: Creating concat list...");
    createConcatFile(actualInputPath, multiplier, concatPath);
    
    // Step 3: Run FFmpeg concat
    console.log("[video-looper] Step 3: Running FFmpeg concat...");
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatPath)
        .inputOptions([
          "-f concat",
          "-safe 0",
        ])
        .outputOptions([
          "-c copy", // Copy streams without re-encoding (fast!)
        ])
        .output(outputPath)
        .on("start", (cmd) => {
          console.log("[video-looper] FFmpeg command:", cmd);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`[video-looper] Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          console.log("[video-looper] Loop completed successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("[video-looper] FFmpeg error:", err);
          reject(err);
        })
        .run();
    });
    
    // Cleanup concat file
    try {
      unlinkSync(concatPath);
      // Only delete input if we downloaded it
      if (actualInputPath === inputPath) {
        unlinkSync(inputPath);
      }
    } catch (e) {
      console.warn("[video-looper] Cleanup warning:", e);
    }
    
    console.log("[video-looper] Output:", outputPath);
    
    return {
      success: true,
      outputPath,
    };
    
  } catch (error) {
    console.error("[video-looper] Loop failed:", error);
    
    // Cleanup on error
    [inputPath, concatPath, outputPath].forEach((p) => {
      try {
        if (existsSync(p)) unlinkSync(p);
      } catch (e) {}
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Loop a video and return a public URL
 * Used after merge to create extended looped version
 */
export async function loopAndServeVideo(
  videoUrl: string,
  multiplier: LoopMultiplier
): Promise<{ success: boolean; loopedVideoUrl?: string; error?: string }> {
  // No loop needed
  if (multiplier <= 1) {
    return {
      success: true,
      loopedVideoUrl: videoUrl,
    };
  }
  
  console.log("[video-looper] ═══════════════════════════════════════════════");
  console.log("[video-looper] Looping video", multiplier, "times...");
  
  const result = await loopVideo({
    videoUrl,
    multiplier,
  });
  
  if (!result.success || !result.outputPath) {
    return {
      success: false,
      error: result.error || "Loop failed",
    };
  }
  
  // Generate a public URL for the looped file
  const filename = path.basename(result.outputPath);
  const publicUrl = `/temp/${filename}`;
  
  console.log("[video-looper] Looped video available at:", publicUrl);
  
  return {
    success: true,
    loopedVideoUrl: publicUrl,
  };
}

