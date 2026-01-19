/**
 * Preview Tab Component (Phase 6)
 * 
 * Uses Shotstack Studio SDK for professional video preview with:
 * - Built-in video player with timeline
 * - Professional audio controls (volume, mute, per-track)
 * - Real-time playback without rendering
 * 
 * Final render is triggered via Continue button on the main page,
 * not from within this component.
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShotstackStudio, type ShotstackStudioRef } from './preview/shotstack-studio';
import type { ShotstackEdit } from './preview/types';

interface PreviewTabProps {
  videoId?: string;
}

// Expose getCurrentVolumes method for parent components
export interface PreviewTabRef {
  getCurrentVolumes: () => { master: number; sfx: number; voiceover: number; music: number } | null;
}

export const PreviewTab = forwardRef<PreviewTabRef, PreviewTabProps>(({ videoId }, ref) => {
  const studioRef = useRef<ShotstackStudioRef>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shotstack Edit for Studio SDK
  const [shotstackEdit, setShotstackEdit] = useState<ShotstackEdit | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [savedVolumes, setSavedVolumes] = useState<{ master: number; sfx: number; voiceover: number; music: number } | null>(null);
  const [animationMode, setAnimationMode] = useState<'image-transitions' | 'video-animation'>('video-animation');

  // Expose getCurrentVolumes to parent
  useImperativeHandle(ref, () => ({
    getCurrentVolumes: () => {
      if (studioRef.current?.getCurrentVolumes) {
        return studioRef.current.getCurrentVolumes();
      }
      return null;
    },
  }));

  // Fetch Shotstack Edit on mount
  useEffect(() => {
    if (!videoId) {
      setIsLoading(false);
      setError('No video ID provided');
      return;
    }

    const fetchStudioEdit = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/ambient-visual/videos/${videoId}/preview/studio-edit`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to load preview data');
        }

        const data = await response.json();

        console.log('[PreviewTab] Loaded Shotstack Edit:', {
          hasEdit: !!data.edit,
          trackCount: data.edit?.timeline?.tracks?.length,
          totalDuration: data.totalDuration,
          clipCount: data.clipCount,
          savedVolumes: data.savedVolumes,
          animationMode: data.animationMode,
        });

        if (data.edit) {
          setShotstackEdit(data.edit);
          setTotalDuration(data.totalDuration || 0);
        }
        
        // Pass saved volumes to ShotstackStudio if available
        if (data.savedVolumes) {
          setSavedVolumes(data.savedVolumes);
        }
        
        // Set animation mode from response
        if (data.animationMode) {
          setAnimationMode(data.animationMode);
        }
      } catch (err) {
        console.error('[PreviewTab] Error fetching studio edit:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudioEdit();
  }, [videoId]);

  // Handle edit changes from Studio SDK
  const handleEditChange = useCallback((edit: ShotstackEdit) => {
    setShotstackEdit(edit);
    // Optionally save changes back to server
    console.log('[PreviewTab] Edit changed:', edit);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-white/60">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-lg font-medium text-white">Error Loading Preview</h3>
          <p className="text-white/60">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No edit data
  if (!shotstackEdit) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md">
          <Film className="w-10 h-10 text-white/40 mx-auto" />
          <h3 className="text-lg font-medium text-white">No Preview Data</h3>
          <p className="text-white/60">
            Timeline data not found. Please complete the Soundscape step first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Preview</h2>
            <p className="text-sm text-white/50">
              {formatDuration(totalDuration)} • Shotstack Studio
            </p>
          </div>
        </div>

        {/* Info about export */}
        <div className="text-sm text-white/40">
          Click "Continue" to export your video
        </div>
      </div>

      {/* Shotstack Studio */}
      <div className="flex-1 p-4 overflow-hidden">
        <ShotstackStudio
          ref={studioRef}
          template={shotstackEdit}
          onEditChange={handleEditChange}
          className="w-full"
          height="calc(100vh - 200px)"
          initialVolumes={savedVolumes}
          animationMode={animationMode}
        />
      </div>
    </div>
  );
});

PreviewTab.displayName = 'PreviewTab';

// Format duration helper
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
