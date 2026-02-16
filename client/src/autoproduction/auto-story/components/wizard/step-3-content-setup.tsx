import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, FileText, Sparkles, Clock, Mic, Music, Play, Pause, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ELEVENLABS_VOICES, getVoicesByLanguage, type ElevenLabsVoice } from "@/constants/elevenlabs-voices";

interface Step3ContentSetupProps {
  campaignName: string;
  onCampaignNameChange: (value: string) => void;
  topics: string[];
  onTopicsChange: (topics: string[]) => void;
  duration: 15 | 30 | 45 | 60;
  onDurationChange: (value: 15 | 30 | 45 | 60) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  pacing: 'slow' | 'medium' | 'fast';
  onPacingChange: (value: 'slow' | 'medium' | 'fast') => void;
  hasVoiceover: boolean;
  onHasVoiceoverChange: (value: boolean) => void;
  voiceId: string;
  onVoiceIdChange: (value: string) => void;
  textOverlayEnabled: boolean;
  onTextOverlayEnabledChange: (value: boolean) => void;
  textOverlayStyle: 'modern' | 'cinematic' | 'bold';
  onTextOverlayStyleChange: (value: 'modern' | 'cinematic' | 'bold') => void;
  hasBackgroundMusic: boolean;
  onHasBackgroundMusicChange: (value: boolean) => void;
  backgroundMusic: string;
  onBackgroundMusicChange: (value: string) => void;
  musicVolume: number;
  onMusicVolumeChange: (value: number) => void;
  isAutoAsmr?: boolean;
}

const durationOptions = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
];

const pacingOptions = [
  { value: 'slow', label: 'Slow', emoji: '🐢' },
  { value: 'medium', label: 'Medium', emoji: '⚡' },
  { value: 'fast', label: 'Fast', emoji: '🚀' },
];

export function Step3ContentSetup({
  campaignName,
  onCampaignNameChange,
  topics,
  onTopicsChange,
  duration,
  onDurationChange,
  language,
  onLanguageChange,
  pacing,
  onPacingChange,
  hasVoiceover,
  onHasVoiceoverChange,
  voiceId,
  onVoiceIdChange,
  textOverlayEnabled,
  onTextOverlayEnabledChange,
  textOverlayStyle,
  onTextOverlayStyleChange,
  hasBackgroundMusic,
  onHasBackgroundMusicChange,
  backgroundMusic,
  onBackgroundMusicChange,
  musicVolume,
  onMusicVolumeChange,
  isAutoAsmr = false,
}: Step3ContentSetupProps) {
  const { toast } = useToast();
  const voicePreviewRef = useRef<HTMLAudioElement | null>(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const availableVoices = getVoicesByLanguage(language as 'ar' | 'en');
  const selectedVoice = ELEVENLABS_VOICES.find(v => v.id === voiceId);

  const handlePlayVoice = (voice: ElevenLabsVoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoiceId === voice.id) {
      if (voicePreviewRef.current) {
        voicePreviewRef.current.pause();
        voicePreviewRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
      return;
    }
    if (voicePreviewRef.current) {
      voicePreviewRef.current.pause();
      voicePreviewRef.current.currentTime = 0;
    }
    const audio = new Audio(voice.previewUrl);
    voicePreviewRef.current = audio;
    audio.play().catch(() => {
      toast({ title: "Preview Failed", description: "Could not play voice preview", variant: "destructive" });
      setPlayingVoiceId(null);
    });
    audio.onended = () => { setPlayingVoiceId(null); voicePreviewRef.current = null; };
    audio.onerror = () => { setPlayingVoiceId(null); voicePreviewRef.current = null; };
    setPlayingVoiceId(voice.id);
  };

  const topicsText = topics.join('\n');
  const topicCount = topics.filter(t => t.trim()).length;

  const handleTopicsChange = (text: string) => {
    const newTopics = text.split('\n').slice(0, 10); // Max 10 topics
    onTopicsChange(newTopics);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Animated Header */}
      <motion.div 
        className="text-center space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Content Setup
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          {isAutoAsmr 
            ? 'Set up your ASMR campaign with categories and visual descriptions'
            : 'Define your campaign basics and provide topics for generation'
          }
        </p>
      </motion.div>

      {/* Campaign Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Campaign Name</CardTitle>
                <CardDescription>
                  Give your campaign a memorable name
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Input
              placeholder="e.g., April Social Media Batch"
              value={campaignName}
              onChange={(e) => onCampaignNameChange(e.target.value)}
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Topics Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Story Topics</CardTitle>
                  <CardDescription>
                    Enter up to 10 topics (one per line). Each will become a video.
                  </CardDescription>
                </div>
              </div>
              <motion.div
                animate={topicCount === 10 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Badge 
                  variant={topicCount === 10 ? 'default' : 'secondary'}
                  className="text-sm font-bold"
                >
                  {topicCount}/10
                </Badge>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <Textarea
              placeholder={isAutoAsmr 
                ? `Satisfying soap cutting with crisp sounds
Raindrops on glass window close-up
Slime mixing with glitter and foam
Gentle hand tapping on wooden surfaces
...`
                : `كيف تستيقظ باكراً
أسرار القهوة المثالية
5 طرق لزيادة الإنتاجية
...`}
              value={topicsText}
              onChange={(e) => handleTopicsChange(e.target.value)}
              rows={10}
              className="font-mono transition-all duration-300 focus:ring-2 focus:ring-blue-500/20"
            />
            <motion.div 
              className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {isAutoAsmr
                  ? 'Enter one ASMR scene description per line. Each will become a satisfying video with AI-generated visuals and sounds.'
                  : 'Enter one topic per line. The AI will generate a complete story for each topic based on your selected template.'
                }
                {' '}You can enter between 1 and 10 topics.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>


      {/* Duration & Pacing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative z-10 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">Duration & Pacing</span>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-white/70">DURATION</Label>
                <span className="text-sm text-white/50">{duration}s</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onDurationChange(option.value as any)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      duration === option.value
                        ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pacing */}
            {!isAutoAsmr && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white/70">PACING</Label>
                <div className="grid grid-cols-3 gap-2">
                  {pacingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onPacingChange(option.value as any)}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        pacing === option.value
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Voiceover */}
      {!isAutoAsmr && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative z-10 p-6 space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                  <Mic className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold">Voiceover</span>
              </div>

              {/* Enable Voiceover */}
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Enable Voiceover</Label>
                <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => onHasVoiceoverChange(true)}
                    className={`py-1.5 px-4 text-sm font-medium transition-all ${
                      hasVoiceover
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >On</button>
                  <button
                    onClick={() => onHasVoiceoverChange(false)}
                    className={`py-1.5 px-4 text-sm font-medium transition-all ${
                      !hasVoiceover
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >Off</button>
                </div>
              </div>

              {/* Everything below hidden when voiceover is Off */}
              {hasVoiceover && (
                <>
                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">LANGUAGE</Label>
                    <Select value={language} onValueChange={onLanguageChange}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English (US)</SelectItem>
                        <SelectItem value="ar">🇸🇦 Arabic (العربية)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Selection with Preview */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">VOICE</Label>
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
                                No voices available for {language === 'ar' ? 'Arabic' : 'English'}
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

                  {/* Text Overlay */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">TEXT OVERLAY</Label>
                    <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
                      <button
                        onClick={() => onTextOverlayEnabledChange(true)}
                        className={`py-1.5 px-4 text-sm font-medium transition-all ${
                          textOverlayEnabled
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >On</button>
                      <button
                        onClick={() => onTextOverlayEnabledChange(false)}
                        className={`py-1.5 px-4 text-sm font-medium transition-all ${
                          !textOverlayEnabled
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >Off</button>
                    </div>
                  </div>

                  {/* Style */}
                  {textOverlayEnabled && (
                    <div className="space-y-2">
                      <Label className="text-sm text-white/70">STYLE</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'modern', label: 'Modern' },
                          { value: 'cinematic', label: 'Cinematic' },
                          { value: 'bold', label: 'Bold' },
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() => onTextOverlayStyleChange(style.value as any)}
                            className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                              textOverlayStyle === style.value
                                ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Background Music (separate card, always visible for non-ASMR) */}
      {!isAutoAsmr && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative z-10 p-6 space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                  <Music className="h-5 w-5" />
                </div>
                <span className="text-lg font-semibold">Background Music</span>
              </div>

              {/* Enable Background Music */}
              <div className="space-y-2">
                <Label className="text-sm text-white/70">Enable Music</Label>
                <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => onHasBackgroundMusicChange(true)}
                    className={`py-1.5 px-4 text-sm font-medium transition-all ${
                      hasBackgroundMusic
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >On</button>
                  <button
                    onClick={() => onHasBackgroundMusicChange(false)}
                    className={`py-1.5 px-4 text-sm font-medium transition-all ${
                      !hasBackgroundMusic
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >Off</button>
                </div>
              </div>

              {/* Everything below hidden when music is Off */}
              {hasBackgroundMusic && (
                <>
                  {/* Music Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm text-white/70">TRACK</Label>
                    <Select value={backgroundMusic} onValueChange={onBackgroundMusicChange}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cinematic">Cinematic Epic</SelectItem>
                        <SelectItem value="upbeat">Upbeat Happy</SelectItem>
                        <SelectItem value="calm">Calm Ambient</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="emotional">Emotional</SelectItem>
                        <SelectItem value="inspiring">Inspiring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Music Volume */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-white/70">VOLUME</Label>
                      <span className="text-sm text-white/50">{musicVolume}%</span>
                    </div>
                    <Slider
                      value={[musicVolume]}
                      onValueChange={([v]) => onMusicVolumeChange(v)}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
