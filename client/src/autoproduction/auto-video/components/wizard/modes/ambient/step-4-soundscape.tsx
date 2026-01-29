import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Music, Mic, Waves, Sparkles, Upload, Play, Pause, Clock, Trash2, Loader2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import type { AmbientMusicStyle } from "./types";
import { ELEVENLABS_VOICES, getVoicesByLanguage, type ElevenLabsVoice } from "@/constants/elevenlabs-voices";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Step4SoundscapeProps {
  // Voiceover
  voiceoverEnabled: boolean;
  onVoiceoverEnabledChange: (value: boolean) => void;
  voiceoverScript: string;
  onVoiceoverScriptChange: (value: string) => void;
  voiceId: string;
  onVoiceIdChange: (value: string) => void;
  voiceLanguage: string;
  onVoiceLanguageChange: (value: string) => void;
  
  // Background Music
  backgroundMusicEnabled: boolean;
  onBackgroundMusicEnabledChange: (value: boolean) => void;
  musicStyle: AmbientMusicStyle;
  onMusicStyleChange: (value: AmbientMusicStyle) => void;
  customMusicUrl: string;
  customMusicDuration: number;
  hasCustomMusic: boolean;
  onCustomMusicChange: (url: string, duration: number) => void;
  onClearCustomMusic: () => void;
  videoId?: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'ar', label: 'Arabic (العربية)' },
  { value: 'en', label: 'English' },
];

const MUSIC_STYLES = [
  { id: 'cinematic', name: 'Cinematic Epic', desc: 'Dramatic, powerful', icon: '🎬' },
  { id: 'upbeat', name: 'Upbeat Happy', desc: 'Energetic, positive', icon: '😊' },
  { id: 'calm', name: 'Calm Ambient', desc: 'Peaceful, relaxing', icon: '😌' },
  { id: 'corporate', name: 'Corporate', desc: 'Professional, clean', icon: '💼' },
  { id: 'electronic', name: 'Electronic', desc: 'Modern, tech vibes', icon: '🎸' },
  { id: 'emotional', name: 'Emotional', desc: 'Touching, heartfelt', icon: '❤️' },
  { id: 'inspiring', name: 'Inspiring', desc: 'Motivational, uplifting', icon: '🔥' },
];

export function Step4Soundscape({
  voiceoverEnabled,
  onVoiceoverEnabledChange,
  voiceoverScript,
  onVoiceoverScriptChange,
  voiceId,
  onVoiceIdChange,
  voiceLanguage,
  onVoiceLanguageChange,
  backgroundMusicEnabled,
  onBackgroundMusicEnabledChange,
  musicStyle,
  onMusicStyleChange,
  customMusicUrl,
  customMusicDuration,
  hasCustomMusic,
  onCustomMusicChange,
  onClearCustomMusic,
  videoId,
}: Step4SoundscapeProps) {
  const { toast } = useToast();
  const musicInputRef = useRef<HTMLInputElement>(null);
  const musicPreviewRef = useRef<HTMLAudioElement>(null);
  const voicePreviewRef = useRef<HTMLAudioElement>(null);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Get voices based on selected language
  const availableVoices = getVoicesByLanguage(voiceLanguage as 'ar' | 'en');
  const selectedVoice = ELEVENLABS_VOICES.find(v => v.id === voiceId);

  // Set default voice when voiceover is enabled and no voice is selected
  useEffect(() => {
    if (voiceoverEnabled && !voiceId && availableVoices.length > 0) {
      onVoiceIdChange(availableVoices[0].id);
    }
  }, [voiceoverEnabled, voiceId, availableVoices, onVoiceIdChange]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle custom music upload
  const handleMusicUpload = async (file: File) => {
    if (!videoId) {
      toast({
        title: "Cannot upload",
        description: "Please save your project first",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3, WAV, M4A, or OGG file",
        variant: "destructive",
      });
      return;
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingMusic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/ambient-visual/videos/${videoId}/custom-music/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onCustomMusicChange(data.url, data.duration);
      
      toast({
        title: "Music uploaded",
        description: `${file.name} (${formatDuration(data.duration)}) ready to use`,
      });
    } catch (error) {
      console.error('Music upload error:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload custom music",
        variant: "destructive",
      });
    } finally {
      setIsUploadingMusic(false);
      if (musicInputRef.current) {
        musicInputRef.current.value = '';
      }
    }
  };

  // Toggle music preview playback
  const toggleMusicPreview = () => {
    const audio = musicPreviewRef.current;
    if (!audio) return;
    
    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      audio.play();
      setIsMusicPlaying(true);
    }
  };

  // Handle voice preview (matching original ambient workflow)
  const handlePlayVoice = (voice: ElevenLabsVoice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If already playing this voice, stop it
    if (playingVoiceId === voice.id) {
      if (voicePreviewRef.current) {
        voicePreviewRef.current.pause();
        voicePreviewRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
      return;
    }
    
    // Stop any currently playing audio
    if (voicePreviewRef.current) {
      voicePreviewRef.current.pause();
      voicePreviewRef.current.currentTime = 0;
    }
    
    // Create and play new audio
    const audio = new Audio(voice.previewUrl);
    voicePreviewRef.current = audio;
    
    audio.play().catch(error => {
      console.error('[Step4Soundscape] Error playing voice preview:', error);
      toast({
        title: "Preview Failed",
        description: "Could not play voice preview",
        variant: "destructive",
      });
      setPlayingVoiceId(null);
    });
    
    audio.onended = () => {
      setPlayingVoiceId(null);
      voicePreviewRef.current = null;
    };
    
    audio.onerror = () => {
      console.error('[Step4Soundscape] Error loading voice preview');
      setPlayingVoiceId(null);
      voicePreviewRef.current = null;
    };
    
    setPlayingVoiceId(voice.id);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Page Title */}
      <div className="text-center space-y-3 pb-4">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Waves className="h-8 w-8 text-violet-500" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500">
            Soundscape
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Configure voiceover and background music for your videos
        </p>
      </div>

      {/* Voiceover */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Mic className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <Label className="text-lg font-semibold text-white">Voiceover</Label>
              </div>
            </div>
            <Switch
              checked={voiceoverEnabled}
              onCheckedChange={onVoiceoverEnabledChange}
            />
          </div>

          {voiceoverEnabled && (
            <div className="space-y-6 pt-4 border-t border-white/10">
              {/* Language */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Language</label>
                <Select value={voiceLanguage} onValueChange={onVoiceLanguageChange}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Selection - Using Popover like original ambient mode */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Voice Selection</label>
                <Popover open={voiceDropdownOpen} onOpenChange={setVoiceDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={voiceDropdownOpen}
                      className="w-full h-12 justify-between bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <span className={selectedVoice ? "font-medium" : "text-muted-foreground"}>
                        {selectedVoice ? selectedVoice.name : "Select a voice..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10" align="start">
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      <div className="p-1">
                        {availableVoices.length === 0 ? (
                          <div className="p-4 text-center text-sm text-white/50">
                            No voices available for {voiceLanguage === 'ar' ? 'Arabic' : 'English'}
                          </div>
                        ) : (
                          <>
                            <div className="px-3 py-2 border-b border-white/10">
                              <p className="text-xs text-white/50">
                                {availableVoices.length} voice{availableVoices.length > 1 ? 's' : ''} available
                              </p>
                            </div>
                            {availableVoices.map((voice) => (
                              <div
                                key={voice.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors",
                                  selectedVoice?.id === voice.id
                                    ? "bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white"
                                    : "hover:bg-white/5 text-white/70"
                                )}
                                onClick={() => {
                                  onVoiceIdChange(voice.id);
                                  setVoiceDropdownOpen(false);
                                }}
                              >
                                <div className="flex-1 min-w-0 mr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{voice.name}</span>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-white/10 border-white/20 text-white/70">
                                      {voice.gender}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-white/50 mt-0.5 truncate">{voice.descriptionEn}</p>
                                  <p className="text-[10px] text-white/40 mt-0.5">{voice.collection} • {voice.useCase}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 shrink-0"
                                  onClick={(e) => handlePlayVoice(voice, e)}
                                >
                                  {playingVoiceId === voice.id ? (
                                    <Pause className="h-4 w-4 text-violet-400" />
                                  ) : (
                                    <Play className="h-4 w-4 text-white/50 hover:text-violet-400" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedVoice && (
                  <p className="text-xs text-white/50 mt-1">
                    {selectedVoice.collection} • {selectedVoice.useCase} • {selectedVoice.descriptionEn}
                  </p>
                )}
              </div>

              {/* Narration Theme - Required field matching original */}
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">
                  Narration Theme <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-white/30">This will guide the AI to generate the narration</p>
                <Textarea
                  placeholder="Describe what the voiceover narration should be about... (e.g., 'A meditation guiding the viewer through a peaceful forest journey, focusing on breath and present moment awareness')"
                  value={voiceoverScript}
                  onChange={(e) => onVoiceoverScriptChange(e.target.value)}
                  rows={4}
                  className="bg-white/5 border-white/10 resize-none"
                  required
                />
                <p className="text-xs text-white/40">
                  This will guide the AI to generate narration that matches your vision.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background Music */}
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative z-10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Music className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <Label className="text-lg font-semibold text-white">Background Music</Label>
                <p className="text-sm text-white/50">AI-generated music to enhance your video</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* AI Badge */}
              <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Switch
                checked={backgroundMusicEnabled}
                onCheckedChange={onBackgroundMusicEnabledChange}
              />
            </div>
          </div>

          {backgroundMusicEnabled && (
            <div className="space-y-6 pt-4 border-t border-white/10">
              {/* Music Style Grid - Hidden when custom music is uploaded */}
              {!hasCustomMusic && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {MUSIC_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => onMusicStyleChange(style.id as AmbientMusicStyle)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        musicStyle === style.id
                          ? 'border-pink-500 bg-gradient-to-br from-pink-500/10 to-pink-500/5'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <div className={`font-semibold text-sm ${musicStyle === style.id ? 'text-pink-400' : 'text-white'}`}>
                        {style.name}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Music Upload Section */}
              <div className={cn("pt-4", !hasCustomMusic && "border-t border-white/10")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/60">Or Upload Your Own</span>
                  </div>
                  <span className="text-xs text-white/40">MP3, WAV, M4A, OGG • Max 5 min</span>
                </div>

                {/* Hidden file input */}
                <input
                  ref={musicInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMusicUpload(file);
                  }}
                />

                {/* Hidden audio element for preview */}
                {customMusicUrl && (
                  <audio
                    ref={musicPreviewRef}
                    src={customMusicUrl}
                    onEnded={() => setIsMusicPlaying(false)}
                  />
                )}

                {hasCustomMusic && customMusicUrl ? (
                  /* Uploaded Music Display */
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    {/* Play/Pause Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMusicPreview}
                      className="h-10 w-10 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400"
                    >
                      {isMusicPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">Custom Music</div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(customMusicDuration || 0)}</span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onClearCustomMusic();
                        setIsMusicPlaying(false);
                      }}
                      className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  /* Upload Area */
                  <button
                    onClick={() => musicInputRef.current?.click()}
                    disabled={isUploadingMusic}
                    className={cn(
                      "w-full p-6 rounded-xl border-2 border-dashed transition-all",
                      "flex flex-col items-center justify-center gap-2",
                      isUploadingMusic
                        ? "border-pink-500/50 bg-pink-500/5 cursor-wait"
                        : "border-white/10 hover:border-pink-500/30 hover:bg-white/[0.02] cursor-pointer"
                    )}
                  >
                    {isUploadingMusic ? (
                      <>
                        <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                        <span className="text-sm text-white/60">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-white/40" />
                        <span className="text-sm text-white/60">Click to upload custom music</span>
                        <span className="text-xs text-white/40">Custom music takes priority over AI-generated music</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Info Message */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <p className="text-xs text-white/50">
                  {hasCustomMusic 
                    ? "Your custom music will be used. AI music generation will be skipped."
                    : "Music will be AI-generated based on your selected style during video processing."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
