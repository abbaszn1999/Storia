// Video + Audio Merger Service using FFmpeg
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { createWriteStream, writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
console.log("[video-merger] FFmpeg path:", ffmpegInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, "../../../../temp");

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

interface MergeOptions {
  videoUrl: string;
  audioUrl: string;
  outputFormat?: "mp4" | "webm";
}

interface MergeResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Check if string is a data URI
 */
function isDataUri(str: string): boolean {
  return str.startsWith("data:");
}

/**
 * Save data URI to file
 */
function saveDataUriToFile(dataUri: string, outputPath: string): void {
  // Extract base64 data from data URI
  // Format: data:audio/mpeg;base64,XXXXX
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URI format");
  }
  
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  writeFileSync(outputPath, buffer);
  console.log("[video-merger] Saved data URI to file:", outputPath, "size:", buffer.length);
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  // Handle data URIs (base64 encoded)
  if (isDataUri(url)) {
    saveDataUriToFile(url, outputPath);
    return;
  }
  
  // Handle regular URLs
  console.log("[video-merger] Downloading from URL:", url.substring(0, 80) + "...");
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  
  const fileStream = createWriteStream(outputPath);
  // @ts-ignore - Node 18+ supports this
  await pipeline(Readable.fromWeb(response.body), fileStream);
  console.log("[video-merger] Downloaded file to:", outputPath);
}

/**
 * Merge video and audio files using FFmpeg
 */
export async function mergeVideoAudio(options: MergeOptions): Promise<MergeResult> {
  const { videoUrl, audioUrl, outputFormat = "mp4" } = options;
  
  console.log("[video-merger] ═══════════════════════════════════════════════");
  console.log("[video-merger] Starting merge process...");
  console.log("[video-merger] Video URL type:", isDataUri(videoUrl) ? "Data URI" : "URL");
  console.log("[video-merger] Audio URL type:", isDataUri(audioUrl) ? "Data URI" : "URL");
  console.log("[video-merger] Audio URL preview:", audioUrl.substring(0, 100));
  
  const sessionId = randomUUID();
  const videoPath = path.join(TEMP_DIR, `${sessionId}_video.mp4`);
  const audioPath = path.join(TEMP_DIR, `${sessionId}_audio.mp3`);
  const outputPath = path.join(TEMP_DIR, `${sessionId}_merged.${outputFormat}`);
  
  console.log("[video-merger] Temp paths:", { videoPath, audioPath, outputPath });
  
  try {
    console.log("[video-merger] Step 1: Downloading video and audio files...");
    
    // Download files in parallel
    await Promise.all([
      downloadFile(videoUrl, videoPath),
      downloadFile(audioUrl, audioPath),
    ]);
    
    // Verify files exist and have content
    const videoExists = existsSync(videoPath);
    const audioExists = existsSync(audioPath);
    console.log("[video-merger] Step 2: Files exist check:", { videoExists, audioExists });
    
    if (!videoExists || !audioExists) {
      throw new Error(`Files not downloaded properly: video=${videoExists}, audio=${audioExists}`);
    }
    
    console.log("[video-merger] Step 3: Starting FFmpeg merge...");
    
    // Merge using FFmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          "-c:v copy",           // Copy video codec (no re-encoding)
          "-c:a aac",            // Encode audio to AAC
          "-b:a 192k",           // Audio bitrate
          "-shortest",           // Match shortest stream duration
          "-map 0:v:0",          // Take video from first input
          "-map 1:a:0",          // Take audio from second input
        ])
        .output(outputPath)
        .on("start", (cmd) => {
          console.log("[video-merger] FFmpeg command:", cmd);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`[video-merger] Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          console.log("[video-merger] Merge completed successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("[video-merger] FFmpeg error:", err);
          reject(err);
        })
        .run();
    });
    
    // Cleanup input files
    try {
      unlinkSync(videoPath);
      unlinkSync(audioPath);
    } catch (e) {
      console.warn("[video-merger] Cleanup warning:", e);
    }
    
    return {
      success: true,
      outputPath,
    };
    
  } catch (error) {
    console.error("[video-merger] Merge failed:", error);
    
    // Cleanup on error
    [videoPath, audioPath, outputPath].forEach((p) => {
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
 * Cleanup a merged file after download
 */
export function cleanupMergedFile(filePath: string): void {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log("[video-merger] Cleaned up:", filePath);
    }
  } catch (e) {
    console.warn("[video-merger] Cleanup failed:", e);
  }
}

/**
 * Merge video and audio immediately after generation
 * Returns a URL path to the merged file that can be served statically
 */
export async function mergeAndUploadVideo(
  videoUrl: string,
  audioDataUri: string
): Promise<{ success: boolean; mergedVideoUrl?: string; error?: string }> {
  console.log("[video-merger] ═══════════════════════════════════════════════");
  console.log("[video-merger] Immediate merge: Video + Audio...");
  
  const result = await mergeVideoAudio({
    videoUrl,
    audioUrl: audioDataUri,
  });
  
  if (!result.success || !result.outputPath) {
    return {
      success: false,
      error: result.error || "Merge failed",
    };
  }
  
  // Generate a public URL for the merged file
  // The file is stored in /temp folder which we'll serve statically
  const filename = path.basename(result.outputPath);
  const publicUrl = `/temp/${filename}`;
  
  console.log("[video-merger] Merged video available at:", publicUrl);
  
  return {
    success: true,
    mergedVideoUrl: publicUrl,
  };
}

