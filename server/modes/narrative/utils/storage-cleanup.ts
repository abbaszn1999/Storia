export interface CleanupOptions {
  videoId: string;
  keepFinalVideo?: boolean;
  keepCharacterSheets?: boolean;
  gracePeriodDays?: number;
}

export class StorageCleanup {
  static async cleanupVideoFiles(options: CleanupOptions): Promise<void> {
    const {
      videoId,
      keepFinalVideo = true,
      keepCharacterSheets = true,
      gracePeriodDays = 0,
    } = options;

    console.log(`[Storage Cleanup] Starting cleanup for video ${videoId}`);

    const pathsToDelete = [
      `/videos/${videoId}/scenes/`,
      `/videos/${videoId}/shots/`,
      `/videos/${videoId}/audio/raw/`,
      `/videos/${videoId}/temp/`,
    ];

    const pathsToKeep = [];
    if (keepFinalVideo) {
      pathsToKeep.push(`/videos/${videoId}/final.mp4`);
    }
    if (keepCharacterSheets) {
      pathsToKeep.push(`/characters/`);
    }

    console.log(`[Storage Cleanup] Paths to delete:`, pathsToDelete);
    console.log(`[Storage Cleanup] Paths to keep:`, pathsToKeep);
  }

  static async scheduleCleanup(videoId: string, delayDays: number = 7): Promise<void> {
    console.log(`[Storage Cleanup] Scheduled cleanup for video ${videoId} in ${delayDays} days`);
  }

  static async moveToAssetLibrary(
    sourceUrl: string,
    assetType: 'character' | 'brandkit',
    assetId: string
  ): Promise<string> {
    const targetPath = `/${assetType}s/${assetId}/reference.png`;
    console.log(`[Storage] Moving ${sourceUrl} to asset library: ${targetPath}`);
    
    return targetPath;
  }
}
