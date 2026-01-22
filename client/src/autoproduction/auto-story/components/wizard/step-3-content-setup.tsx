import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Info, FileText, Sparkles, Clock, Maximize2, Globe, Zap, Type } from "lucide-react";
import { motion } from "framer-motion";
import { ASPECT_RATIO_PLATFORMS, PACING_OPTIONS, TEXT_OVERLAY_STYLES } from "../../types";

interface Step3ContentSetupProps {
  campaignName: string;
  onCampaignNameChange: (value: string) => void;
  topics: string[];
  onTopicsChange: (topics: string[]) => void;
  duration: 30 | 45 | 60 | 90;
  onDurationChange: (value: 30 | 45 | 60 | 90) => void;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  onAspectRatioChange: (value: '9:16' | '16:9' | '1:1' | '4:5') => void;
  language: string;
  onLanguageChange: (value: string) => void;
  
  // NEW: Pacing
  pacing: 'slow' | 'medium' | 'fast';
  onPacingChange: (value: 'slow' | 'medium' | 'fast') => void;
  
  // NEW: Text Overlay
  textOverlayEnabled: boolean;
  onTextOverlayEnabledChange: (value: boolean) => void;
  textOverlayStyle: 'modern' | 'cinematic' | 'bold';
  onTextOverlayStyleChange: (value: 'modern' | 'cinematic' | 'bold') => void;
}

const durationOptions = [
  { value: 30, label: '30 seconds', description: 'Quick & punchy' },
  { value: 45, label: '45 seconds', description: 'Balanced' },
  { value: 60, label: '60 seconds', description: 'Standard' },
  { value: 90, label: '90 seconds', description: 'Detailed' },
];

const aspectRatios = [
  { value: '9:16', label: '9:16 (Vertical)', description: 'TikTok, Reels, Shorts' },
  { value: '16:9', label: '16:9 (Horizontal)', description: 'YouTube, Desktop' },
  { value: '1:1', label: '1:1 (Square)', description: 'Instagram Feed' },
  { value: '4:5', label: '4:5 (Portrait)', description: 'Instagram Posts' },
];

export function Step3ContentSetup({
  campaignName,
  onCampaignNameChange,
  topics,
  onTopicsChange,
  duration,
  onDurationChange,
  aspectRatio,
  onAspectRatioChange,
  language,
  onLanguageChange,
  pacing,
  onPacingChange,
  textOverlayEnabled,
  onTextOverlayEnabledChange,
  textOverlayStyle,
  onTextOverlayStyleChange,
}: Step3ContentSetupProps) {
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
          Define your campaign basics and provide topics for generation
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
              placeholder={`كيف تستيقظ باكراً
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
                Enter one topic per line. The AI will generate a complete story for each topic based on your selected template.
                You can enter between 1 and 10 topics.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Technical Settings - Grid Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Duration & Aspect Ratio */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Duration & Format</CardTitle>
                <CardDescription>
                  Video length and aspect ratio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {/* Duration */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Duration per Video
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {durationOptions.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        duration === option.value
                          ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-500/5 shadow-lg shadow-orange-500/20'
                          : 'hover:border-orange-500/50 hover:shadow-md'
                      }`}
                      onClick={() => onDurationChange(option.value as any)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`font-bold text-lg ${duration === option.value ? 'text-orange-500' : ''}`}>
                          {option.value}s
                        </div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-purple-500" />
                Aspect Ratio
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {aspectRatios.map((ratio, index) => (
                  <motion.div
                    key={ratio.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        aspectRatio === ratio.value
                          ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-500/5 shadow-lg shadow-purple-500/20'
                          : 'hover:border-purple-500/50 hover:shadow-md'
                      }`}
                      onClick={() => onAspectRatioChange(ratio.value as any)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`font-bold text-sm ${aspectRatio === ratio.value ? 'text-purple-500' : ''}`}>
                          {ratio.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{ratio.description}</div>
                        {/* Platform badges */}
                        {aspectRatio === ratio.value && (
                          <motion.div 
                            className="mt-2 flex flex-wrap gap-1 justify-center"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            {ASPECT_RATIO_PLATFORMS[ratio.value]?.map(platform => (
                              <Badge key={platform} variant="secondary" className="text-[10px]">
                                {platform}
                              </Badge>
                            ))}
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Pacing */}
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Language & Pacing</CardTitle>
                <CardDescription>
                  Voice language and narration speed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {/* Language */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Language
              </Label>
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="transition-all duration-300 hover:border-blue-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="ar">🇸🇦 Arabic (العربية)</SelectItem>
                  <SelectItem value="es">🇪🇸 Spanish (Español)</SelectItem>
                  <SelectItem value="fr">🇫🇷 French (Français)</SelectItem>
                  <SelectItem value="de">🇩🇪 German (Deutsch)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pacing */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Pacing
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {PACING_OPTIONS.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 ${
                        pacing === option.value
                          ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-lg shadow-green-500/20'
                          : 'hover:border-green-500/50 hover:shadow-md'
                      }`}
                      onClick={() => onPacingChange(option.value as any)}
                    >
                      <CardContent className="p-4 text-center">
                        <motion.div 
                          className="text-2xl mb-1"
                          animate={pacing === option.value ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {option.emoji}
                        </motion.div>
                        <div className={`font-bold text-sm ${pacing === option.value ? 'text-green-500' : ''}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Text Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Type className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Text Overlay / Subtitles</CardTitle>
                <CardDescription>
                  Add on-screen captions to your videos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            {/* Toggle */}
            <motion.div 
              className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-300 ${
                textOverlayEnabled 
                  ? 'bg-gradient-to-r from-pink-500/5 to-purple-500/5 border-pink-500/30' 
                  : 'hover:border-pink-500/30'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="space-y-1">
                <div className="font-medium flex items-center gap-2">
                  Enable Text Overlay
                  {textOverlayEnabled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Badge variant="default" className="text-xs">Active</Badge>
                    </motion.div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Display captions synchronized with narration
                </div>
              </div>
              <Switch
                checked={textOverlayEnabled}
                onCheckedChange={onTextOverlayEnabledChange}
              />
            </motion.div>

            {/* Style Selection (if enabled) */}
            {textOverlayEnabled && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-pink-500" />
                  Text Style
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {TEXT_OVERLAY_STYLES.map((style, index) => (
                    <motion.div
                      key={style.value}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-300 ${
                          textOverlayStyle === style.value
                            ? 'border-pink-500 bg-gradient-to-br from-pink-500/10 to-purple-500/5 shadow-lg shadow-pink-500/20'
                            : 'hover:border-pink-500/50 hover:shadow-md'
                        }`}
                        onClick={() => onTextOverlayStyleChange(style.value as any)}
                      >
                        <CardContent className="p-3 text-center">
                          <div className={`font-bold text-sm mb-1 ${textOverlayStyle === style.value ? 'text-pink-500' : ''}`}>
                            {style.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
