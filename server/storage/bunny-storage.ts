/**
 * Bunny Storage Service
 * 
 * Provides CRUD operations for files stored in Bunny CDN Storage.
 * Files are accessed via the Bunny Storage API and served through CDN.
 */

import fs from "fs";
import path from "path";

// Load environment variables
function loadEnvIfNeeded() {
  if (process.env.BUNNY_ENV_LOADED) return;
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    process.env.BUNNY_ENV_LOADED = "true";
    return;
  }
  const contents = fs.readFileSync(envPath, "utf-8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
  process.env.BUNNY_ENV_LOADED = "true";
}

loadEnvIfNeeded();

// Configuration
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "";
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || "";
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "";
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || ""; // e.g., "ny", "la", "sg", "de", "uk", "se", "br", "jh", "syd"

// Build storage API URL based on region
function getStorageApiUrl(): string {
  if (BUNNY_STORAGE_REGION) {
    return `https://${BUNNY_STORAGE_REGION}.storage.bunnycdn.com`;
  }
  return "https://storage.bunnycdn.com";
}

const BUNNY_STORAGE_API_URL = getStorageApiUrl();

export interface BunnyFile {
  Guid: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  Length: number;
  LastChanged: string;
  ServerId: number;
  ArrayNumber: number;
  IsDirectory: boolean;
  UserId: string;
  ContentType: string;
  DateCreated: string;
  StorageZoneId: number;
  Checksum: string | null;
  ReplicatedZones: string | null;
}

export interface BunnyStorageConfig {
  storageZone: string;
  apiKey: string;
  cdnUrl: string;
  storageApiUrl: string;
}

/**
 * Build a Story_Mode path for Bunny storage.
 * Example: {userId}/{workspaceName}/Story_Mode/asmr/{projectName}_{date}/Rendered/{filename}
 */
export function buildStoryModePath(params: {
  userId: string;
  workspaceName: string;
  toolMode: string; // e.g., "asmr"
  projectName: string;
  filename: string;
  dateLabel?: string; // optional, default: today YYYYMMDD
}): string {
  const { userId, workspaceName, toolMode, projectName, filename, dateLabel } = params;
  const safeDate = dateLabel || new Date().toISOString().slice(0, 10).replace(/-/g, "");
  // Clean inputs for path safety
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_");
  const user = clean(userId);
  const workspace = clean(workspaceName);
  const tool = clean(toolMode);
  const project = clean(projectName);
  const file = filename.replace(/[^a-zA-Z0-9-_.]/g, "_");
  return `${user}/${workspace}/Story_Mode/${tool}/${project}_${safeDate}/Rendered/${file}`;
}

/**
 * Check if Bunny Storage is properly configured
 */
export function isBunnyConfigured(): boolean {
  return Boolean(BUNNY_STORAGE_ZONE && BUNNY_STORAGE_API_KEY && BUNNY_CDN_URL);
}

/**
 * Get the current Bunny configuration (without exposing the API key)
 */
export function getBunnyConfig(): Omit<BunnyStorageConfig, "apiKey"> & { isConfigured: boolean } {
  return {
    storageZone: BUNNY_STORAGE_ZONE,
    cdnUrl: BUNNY_CDN_URL,
    storageApiUrl: BUNNY_STORAGE_API_URL,
    isConfigured: isBunnyConfigured(),
  };
}

/**
 * Normalize a file path for Bunny Storage
 * - Removes leading slashes
 * - Ensures consistent forward slashes
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

/**
 * Upload a file to Bunny Storage
 * 
 * @param filePath - The destination path in storage (e.g., "user/workspace/Assets/image.png")
 * @param file - The file content as Buffer
 * @param contentType - Optional MIME type (auto-detected if not provided)
 * @returns The CDN URL of the uploaded file
 */
export async function uploadFile(
  filePath: string,
  file: Buffer,
  contentType?: string
): Promise<string> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured. Please set BUNNY_STORAGE_ZONE, BUNNY_STORAGE_API_KEY, and BUNNY_CDN_URL environment variables.");
  }

  const normalizedPath = normalizePath(filePath);
  const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;

  // Log upload details
  console.log(`[bunny-storage] Uploading file:`);
  console.log(`[bunny-storage]   Path: ${normalizedPath}`);
  console.log(`[bunny-storage]   Size: ${(file.length / 1024).toFixed(2)}KB`);
  console.log(`[bunny-storage]   Type: ${contentType || 'unknown'}`);

  const headers: Record<string, string> = {
    "AccessKey": BUNNY_STORAGE_API_KEY,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[bunny-storage] Upload failed: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to upload file to Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`);
  }

  console.log(`[bunny-storage] ✓ Upload successful`);
  
  return getPublicUrl(normalizedPath);
}

/**
 * Download a file from Bunny Storage
 * 
 * @param filePath - The path to the file in storage
 * @returns The file content as Buffer
 */
export async function downloadFile(filePath: string): Promise<Buffer> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured.");
  }

  const normalizedPath = normalizePath(filePath);
  const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "AccessKey": BUNNY_STORAGE_API_KEY,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`File not found: ${filePath}`);
    }
    const errorText = await response.text();
    throw new Error(`Failed to download file from Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete a file from Bunny Storage
 * 
 * @param filePath - The path to the file to delete
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured.");
  }

  const normalizedPath = normalizePath(filePath);
  const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "AccessKey": BUNNY_STORAGE_API_KEY,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete file from Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Delete a folder and all its contents recursively from Bunny Storage
 * 
 * @param folderPath - The path to the folder to delete
 */
export async function deleteFolder(folderPath: string): Promise<void> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured.");
  }

  let normalizedPath = normalizePath(folderPath);
  // Ensure folder path ends with /
  if (normalizedPath && !normalizedPath.endsWith("/")) {
    normalizedPath += "/";
  }

  try {
    // List all files and folders in this directory
    const items = await listFiles(normalizedPath);

    // Recursively delete all items
    for (const item of items) {
      const itemPath = `${normalizedPath}${item.ObjectName}`;
      if (item.IsDirectory) {
        // Recursively delete subdirectory
        await deleteFolder(itemPath);
      } else {
        // Delete file
        await deleteFile(itemPath);
      }
    }

    // After all contents are deleted, delete the folder itself
    const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "AccessKey": BUNNY_STORAGE_API_KEY,
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Failed to delete folder from Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    // If folder doesn't exist (404), it's fine
    if (error instanceof Error && error.message.includes('404')) {
      return;
    }
    throw error;
  }
}

/**
 * List files in a directory in Bunny Storage
 * 
 * @param folderPath - The folder path to list (e.g., "user/workspace/Assets/")
 * @returns Array of file/folder information
 */
export async function listFiles(folderPath: string): Promise<BunnyFile[]> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured.");
  }

  let normalizedPath = normalizePath(folderPath);
  // Ensure folder path ends with /
  if (normalizedPath && !normalizedPath.endsWith("/")) {
    normalizedPath += "/";
  }

  const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "AccessKey": BUNNY_STORAGE_API_KEY,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return []; // Empty folder or doesn't exist
    }
    const errorText = await response.text();
    throw new Error(`Failed to list files from Bunny Storage: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const files = await response.json() as BunnyFile[];
  return files;
}

/**
 * Check if a file exists in Bunny Storage
 * 
 * @param filePath - The path to check
 * @returns true if the file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured.");
  }

  const normalizedPath = normalizePath(filePath);
  const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;

  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      "AccessKey": BUNNY_STORAGE_API_KEY,
    },
  });

  return response.ok;
}

/**
 * Get the public CDN URL for a file
 * 
 * @param filePath - The path to the file in storage
 * @returns The public CDN URL
 */
export function getPublicUrl(filePath: string): string {
  if (!BUNNY_CDN_URL) {
    throw new Error("Bunny CDN URL is not configured.");
  }

  const normalizedPath = normalizePath(filePath);
  const cdnBase = BUNNY_CDN_URL.replace(/\/+$/, ""); // Remove trailing slashes
  return `${cdnBase}/${normalizedPath}`;
}

/**
 * Get file info/metadata from Bunny Storage
 * 
 * @param filePath - The path to the file
 * @returns File metadata or null if not found
 */
export async function getFileInfo(filePath: string): Promise<{ size: number; lastModified: string; contentType: string } | null> {
  if (!isBunnyConfigured()) {
    throw new Error("Bunny Storage is not configured.");
  }

  const normalizedPath = normalizePath(filePath);
  const url = `${BUNNY_STORAGE_API_URL}/${BUNNY_STORAGE_ZONE}/${normalizedPath}`;

  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      "AccessKey": BUNNY_STORAGE_API_KEY,
    },
  });

  if (!response.ok) {
    return null;
  }

  return {
    size: parseInt(response.headers.get("content-length") || "0", 10),
    lastModified: response.headers.get("last-modified") || "",
    contentType: response.headers.get("content-type") || "",
  };
}

// Export as a service object for convenience
export const bunnyStorage = {
  uploadFile,
  downloadFile,
  deleteFile,
  deleteFolder,
  listFiles,
  fileExists,
  getPublicUrl,
  getFileInfo,
  isBunnyConfigured,
  getBunnyConfig,
};

export default bunnyStorage;

