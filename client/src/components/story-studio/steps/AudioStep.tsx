// Audio Step - Voice selection with ElevenLabs
// ═══════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassPanel } from "../shared/GlassPanel";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Mic, 
  Music, 
  Volume2,
  Play,
  Pause,
  Check,
  Headphones,
  AudioWaveform,
  AlertCircle
} from "lucide-react";
import { StoryScene, StoryTemplate } from "../types";
import { useState, useRef, useEffect } from "react";
import { ELEVENLABS_VOICES, getVoicesByLanguage } from "@/constants/elevenlabs-voices";

interface AudioStepProps {
  template: StoryTemplate;
  scenes: StoryScene[];
  selectedVoice: string;
  backgroundMusic: string;
  voiceVolume: number;
  musicVolume: number;
  isGenerating: boolean;
  voiceoverEnabled: boolean;
  onVoiceChange: (voice: string) => void;
  onMusicChange: (music: string) => void;
  onVoiceVolumeChange: (volume: number) => void;
  onMusicVolumeChange: (volume: number) => void;
  onGenerateVoiceover?: () => void;
  accentColor?: string;
}

const MUSIC_TRACKS = [
  { id: 'none', name: 'No Music', desc: 'Voice only', icon: '🔇', url: '', duration: 0 },
  { id: 'upbeat', name: 'Upbeat Pop', desc: 'Energetic, modern', icon: '🎵', url: '/music/upbeat.mp3', duration: 120 },
  { id: 'chill', name: 'Chill Lofi', desc: 'Relaxed, ambient', icon: '🎧', url: '/music/chill.mp3', duration: 150 },
  { id: 'dramatic', name: 'Dramatic Cinematic', desc: 'Epic, emotional', icon: '🎬', url: '/music/dramatic.mp3', duration: 180 },
  { id: 'corporate', name: 'Corporate', desc: 'Professional, clean', icon: '💼', url: '/music/corporate.mp3', duration: 90 },
];

export function AudioStep({
  template,
  scenes,
  selectedVoice,
  backgroundMusic,
  voiceVolume,
  musicVolume,
  isGenerating,
  voiceoverEnabled,
  onVoiceChange,
  onMusicChange,
  onVoiceVolumeChange,
  onMusicVolumeChange,
  onGenerateVoiceover,
  accentColor = "primary",
}: AudioStepProps) {
  const [activeTab, setActiveTab] = useState<'ar' | 'en'>('ar');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate total narration and word count (only if voiceover enabled)
  const totalNarration = voiceoverEnabled 
    ? scenes.map(s => s.narration).join(' ')
    : '';
  const wordCount = voiceoverEnabled 
    ? totalNarration.split(/\s+/).filter(w => w.length > 0).length
    : 0;

  const arabicVoices = getVoicesByLanguage('ar');
  const englishVoices = getVoicesByLanguage('en');
  const currentVoices = activeTab === 'ar' ? arabicVoices : englishVoices;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Function to play voice preview
  const playPreview = (voiceId: string, previewUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingVoice === voiceId) {
      // Stop current playing audio
      audioRef.current?.pause();
      setPlayingVoice(null);
      audioRef.current = null;
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play new audio
      audioRef.current = new Audio(previewUrl);
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        setPlayingVoice(null);
      });
      setPlayingVoice(voiceId);
      
      // Auto-stop when finished
      audioRef.current.onended = () => {
        setPlayingVoice(null);
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Selection Section - Only if voiceoverEnabled */}
      {voiceoverEnabled && (
        <GlassPanel>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                )}>
                  <Mic className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Voice Selection</h3>
                  <p className="text-sm text-white/60">Choose a voice for your narration</p>
                </div>
              </div>

              {/* Language Tabs */}
              <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('ar')}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === 'ar'
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white/80"
                  )}
                >
                  العربية
                </button>
                <button
                  onClick={() => setActiveTab('en')}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all",
                    activeTab === 'en'
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white/80"
                  )}
                >
                  English
                </button>
              </div>
            </div>

            {/* Voice Grid - 2x3 layout for 6 voices */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="wait">
                {currentVoices.map((voice, index) => {
                  const isSelected = selectedVoice === voice.id;
                  const isPlaying = playingVoice === voice.id;

                  return (
                    <motion.div
                      key={`${voice.id}-${activeTab}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "relative rounded-xl transition-all overflow-hidden group cursor-pointer",
                        "border backdrop-blur-sm",
                        isSelected
                          ? "border-purple-500/60 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/20"
                          : "border-white/10 bg-white/[0.03] hover:border-purple-500/30 hover:bg-white/[0.06]"
                      )}
                      onClick={() => onVoiceChange(voice.id)}
                    >
                      {/* Selected Indicator */}
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2.5 right-2.5 z-10"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        </motion.div>
                      )}

                      {/* Voice Info */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg",
                            "bg-gradient-to-br",
                            isSelected 
                              ? "from-purple-500/30 to-pink-500/30" 
                              : "from-purple-500/10 to-pink-500/10"
                          )}>
                            {voice.gender === 'male' ? '👨' : '👩'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-semibold text-sm mb-0.5 truncate",
                              isSelected ? "text-white" : "text-white/90"
                            )}>
                              {voice.name}
                            </h4>
                            <p className="text-xs text-white/50 line-clamp-1 capitalize">
                              {voice.age === 'middle-aged' ? 'Middle-aged' : voice.age}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Preview Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playPreview(voice.id, voice.previewUrl, e);
                        }}
                        className={cn(
                          "w-full py-2 px-3 transition-all",
                          "flex items-center justify-center gap-1.5",
                          "border-t border-white/5",
                          "text-xs font-medium",
                          isPlaying
                            ? "bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white"
                            : "bg-white/[0.02] hover:bg-white/5 text-white/50 hover:text-white/70"
                        )}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Voiceover Summary - Compact */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <AudioWaveform className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Total Narration</p>
                  <p className="text-sm font-medium text-white">
                    {wordCount} words • ~{Math.ceil(wordCount / 150)} min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5">
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-white/60">
                  {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}
                </span>
              </div>
            </div>

            {/* Info Message - Auto generation notice */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5"
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <AudioWaveform className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/70">
                    <span className="text-purple-300 font-medium">🎙️ Voiceover auto-generated</span>
                    {' '}when you click "Continue to Export"
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </GlassPanel>
      )}

      {/* Background Music Section */}
      <GlassPanel>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
            )}>
              <Music className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Background Music</h3>
              <p className="text-sm text-white/60">Add music to enhance your video</p>
            </div>
          </div>

          {/* Music Grid - Compact 2 columns */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {MUSIC_TRACKS.map((track, index) => {
              const isSelected = backgroundMusic === track.id;

              return (
                <motion.button
                  key={track.id}
                  onClick={() => onMusicChange(track.id)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "relative p-3 rounded-xl transition-all text-left overflow-hidden",
                    "border backdrop-blur-sm",
                    isSelected
                      ? "border-blue-500/50 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 shadow-lg shadow-blue-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.06]"
                  )}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2.5 right-2.5 z-10"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-xl",
                      "bg-gradient-to-br",
                      isSelected 
                        ? "from-blue-500/20 to-cyan-500/20" 
                        : "from-blue-500/10 to-cyan-500/10"
                    )}>
                      {track.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{track.name}</div>
                      <div className="text-xs text-white/50 truncate">{track.desc}</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Volume Controls */}
          {voiceoverEnabled && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              {/* Voice Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/80 flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Voice Volume
                  </label>
                  <span className="text-sm text-white/60">{voiceVolume}%</span>
                </div>
                <Slider
                  value={[voiceVolume]}
                  onValueChange={([value]) => onVoiceVolumeChange(value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Music Volume */}
              {backgroundMusic !== 'none' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/80 flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Music Volume
                    </label>
                    <span className="text-sm text-white/60">{musicVolume}%</span>
                  </div>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={([value]) => onMusicVolumeChange(value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
