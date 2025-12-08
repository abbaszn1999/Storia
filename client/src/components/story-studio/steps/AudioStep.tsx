// Audio Step - Voice selection, music, and volume controls
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
  Wand2,
  RefreshCw,
  Headphones,
  AudioWaveform
} from "lucide-react";
import { StoryScene, StoryTemplate } from "../types";
import { useState, useRef } from "react";

interface AudioStepProps {
  template: StoryTemplate;
  scenes: StoryScene[];
  selectedVoice: string;
  backgroundMusic: string;
  voiceVolume: number;
  musicVolume: number;
  isGenerating: boolean;
  onVoiceChange: (voice: string) => void;
  onMusicChange: (music: string) => void;
  onVoiceVolumeChange: (volume: number) => void;
  onMusicVolumeChange: (volume: number) => void;
  accentColor?: string;
}

const VOICES = [
  { id: 'alloy', name: 'Alloy', desc: 'Neutral, balanced', gender: 'neutral' },
  { id: 'echo', name: 'Echo', desc: 'Warm, conversational', gender: 'male' },
  { id: 'fable', name: 'Fable', desc: 'Expressive, British', gender: 'female' },
  { id: 'onyx', name: 'Onyx', desc: 'Deep, authoritative', gender: 'male' },
  { id: 'nova', name: 'Nova', desc: 'Friendly, engaging', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Clear, professional', gender: 'female' },
];

const MUSIC_TRACKS = [
  { id: 'none', name: 'No Music', desc: 'Voice only', icon: '🔇' },
  { id: 'upbeat', name: 'Upbeat Pop', desc: 'Energetic, modern', icon: '🎵' },
  { id: 'cinematic', name: 'Cinematic', desc: 'Epic, dramatic', icon: '🎬' },
  { id: 'chill', name: 'Lo-fi Chill', desc: 'Relaxed, calm', icon: '☁️' },
  { id: 'corporate', name: 'Corporate', desc: 'Professional, clean', icon: '💼' },
  { id: 'inspiring', name: 'Inspiring', desc: 'Motivational, uplifting', icon: '✨' },
];

export function AudioStep({
  template,
  scenes,
  selectedVoice,
  backgroundMusic,
  voiceVolume,
  musicVolume,
  isGenerating,
  onVoiceChange,
  onMusicChange,
  onVoiceVolumeChange,
  onMusicVolumeChange,
  accentColor = "primary"
}: AudioStepProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [generatingVoiceover, setGeneratingVoiceover] = useState(false);

  const accentClasses = {
    primary: "from-primary to-violet-500",
    orange: "from-orange-500 to-amber-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    rose: "from-rose-500 to-pink-500",
  }[accentColor] || "from-primary to-violet-500";

  const totalNarration = scenes
    .filter(s => s.voiceoverEnabled)
    .map(s => s.narration)
    .join(' ');

  const wordCount = totalNarration.split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.ceil(wordCount / 2.5); // ~150 wpm

  const handlePreviewVoice = (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceId);
      // Simulate playing
      setTimeout(() => setPlayingVoice(null), 3000);
    }
  };

  const handlePreviewMusic = (musicId: string) => {
    if (musicId === 'none') return;
    if (playingMusic === musicId) {
      setPlayingMusic(null);
    } else {
      setPlayingMusic(musicId);
      // Simulate playing
      setTimeout(() => setPlayingMusic(null), 5000);
    }
  };

  const handleGenerateVoiceover = async () => {
    setGeneratingVoiceover(true);
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setGeneratingVoiceover(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
      {/* Left Column - Voice Selection */}
      <div className="space-y-5">
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Voice Selection</h3>
                  <p className="text-xs text-white/50">Choose your narrator</p>
                </div>
              </div>
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-2 gap-3">
              {VOICES.map(voice => (
                <motion.button
                  key={voice.id}
                  onClick={() => onVoiceChange(voice.id)}
                  className={cn(
                    "relative p-4 rounded-xl text-left",
                    "border transition-all duration-200",
                    selectedVoice === voice.id
                      ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-semibold">{voice.name}</span>
                      <p className="text-xs text-white/50 mt-0.5">{voice.desc}</p>
                      <span className={cn(
                        "inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full",
                        "bg-white/10 text-white/60 capitalize"
                      )}>
                        {voice.gender}
                      </span>
                    </div>
                    
                    {/* Play Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVoice(voice.id);
                      }}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        "hover:bg-white/10"
                      )}
                    >
                      {playingVoice === voice.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Selected Indicator */}
                  {selectedVoice === voice.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute top-2 right-2 w-5 h-5 rounded-full",
                        "bg-gradient-to-br flex items-center justify-center",
                        accentClasses
                      )}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Voice Volume */}
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium">Voice Volume</span>
              </div>
              <span className="text-sm text-white/60">{voiceVolume}%</span>
            </div>
            <Slider
              value={[voiceVolume]}
              onValueChange={([v]) => onVoiceVolumeChange(v)}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        </GlassPanel>
      </div>

      {/* Right Column - Music & Preview */}
      <div className="space-y-5">
        <GlassPanel>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentClasses)}>
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Background Music</h3>
                <p className="text-xs text-white/50">Set the mood</p>
              </div>
            </div>

            {/* Music Grid */}
            <div className="grid grid-cols-2 gap-3">
              {MUSIC_TRACKS.map(track => (
                <motion.button
                  key={track.id}
                  onClick={() => onMusicChange(track.id)}
                  className={cn(
                    "relative p-4 rounded-xl text-left",
                    "border transition-all duration-200",
                    backgroundMusic === track.id
                      ? cn("bg-gradient-to-br border-white/20", accentClasses, "bg-opacity-20")
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{track.icon}</span>
                    <div>
                      <span className="text-sm font-semibold">{track.name}</span>
                      <p className="text-xs text-white/50">{track.desc}</p>
                    </div>
                  </div>

                  {/* Preview Button */}
                  {track.id !== 'none' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewMusic(track.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10"
                    >
                      {playingMusic === track.id ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  {backgroundMusic === track.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute bottom-2 right-2 w-5 h-5 rounded-full",
                        "bg-gradient-to-br flex items-center justify-center",
                        accentClasses
                      )}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Music Volume */}
        {backgroundMusic !== 'none' && (
          <GlassPanel>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-medium">Music Volume</span>
                </div>
                <span className="text-sm text-white/60">{musicVolume}%</span>
              </div>
              <Slider
                value={[musicVolume]}
                onValueChange={([v]) => onMusicVolumeChange(v)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </GlassPanel>
        )}

        {/* Audio Summary */}
        <GlassPanel variant="subtle">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AudioWaveform className="w-4 h-4 text-white/60" />
              <span className="text-sm font-medium">Voiceover Summary</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/40">Total Narration</p>
                <p className="text-lg font-semibold">{wordCount} words</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/40">Est. Duration</p>
                <p className="text-lg font-semibold">~{estimatedDuration}s</p>
              </div>
            </div>

            <Button
              onClick={handleGenerateVoiceover}
              disabled={generatingVoiceover || wordCount === 0}
              className={cn("w-full gap-2 bg-gradient-to-r", accentClasses)}
            >
              {generatingVoiceover ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Voiceover...
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4" />
                  Generate Voiceover
                </>
              )}
            </Button>

            <p className="text-[10px] text-white/30 text-center">
              Voiceover will be generated for {scenes.filter(s => s.voiceoverEnabled).length} scenes
            </p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

