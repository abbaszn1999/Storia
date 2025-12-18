import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Image, Video, ArrowRight, FileImage, GitCompare, Loader2 } from "lucide-react";

interface AmbientOnboardingProps {
  projectName: string;
  onComplete: (config: {
    animationMode: 'image-transitions' | 'video-animation';
    videoGenerationMode?: 'image-reference' | 'start-end-frame';
  }) => void;
  isCreating?: boolean;
}

export function AmbientOnboarding({ projectName, onComplete, isCreating = false }: AmbientOnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [animationMode, setAnimationMode] = useState<'image-transitions' | 'video-animation' | null>(null);
  const [videoGenerationMode, setVideoGenerationMode] = useState<'image-reference' | 'start-end-frame' | null>(null);

  const handleAnimationModeSelect = (mode: 'image-transitions' | 'video-animation') => {
    setAnimationMode(mode);
    
    if (mode === 'image-transitions') {
      // If image transitions, complete immediately
      onComplete({ animationMode: mode });
    } else {
      // If video animation, go to step 2
      setStep(2);
    }
  };

  const handleVideoModeSelect = (mode: 'image-reference' | 'start-end-frame') => {
    setVideoGenerationMode(mode);
    onComplete({
      animationMode: 'video-animation',
      videoGenerationMode: mode
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-slate-950 to-teal-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-block p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30"
                >
                  <Video className="w-12 h-12 text-cyan-400" />
                </motion.div>
                <h1 className="text-4xl font-bold text-white">
                  {projectName}
                </h1>
                <p className="text-lg text-white/60">
                  Choose your animation approach
                </p>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Transitions */}
                <Card 
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:scale-105",
                    "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10",
                    "overflow-hidden"
                  )}
                  onClick={() => handleAnimationModeSelect('image-transitions')}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                        <Image className="w-12 h-12 text-purple-400" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-bold text-white">
                        Image Transitions
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Create ambient visuals using static images with smooth motion effects like zoom, pan, and Ken Burns style animations
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Faster generation</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Ken Burns effects</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Smooth transitions</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      size="lg"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Select Image Transitions
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Video Animation */}
                <Card 
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:scale-105",
                    "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10",
                    "overflow-hidden"
                  )}
                  onClick={() => handleAnimationModeSelect('video-animation')}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 group-hover:from-cyan-500/30 group-hover:to-teal-500/30 transition-all">
                        <Video className="w-12 h-12 text-cyan-400" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-bold text-white">
                        Video Animation
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Generate AI-powered animated videos from images using advanced video models with natural motion and camera movements
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>AI video generation</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Natural motion</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Camera control</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                      size="lg"
                    >
                      Select Video Animation
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="inline-block p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30"
                >
                  <Video className="w-12 h-12 text-cyan-400" />
                </motion.div>
                <h1 className="text-4xl font-bold text-white">
                  Video Generation Mode
                </h1>
                <p className="text-lg text-white/60">
                  Choose how to generate your video animations
                </p>
              </div>

              {/* Options */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Reference Mode */}
                <Card 
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:scale-105",
                    "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10",
                    "overflow-hidden"
                  )}
                  onClick={() => handleVideoModeSelect('image-reference')}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all">
                        <FileImage className="w-12 h-12 text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-bold text-white">
                        Image Reference Mode
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Generate video from a single reference image. The AI will animate the scene based on your motion prompts
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Single image input</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Natural animation</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Simpler workflow</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      size="lg"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Use Image Reference
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Start/End Frame Mode */}
                <Card 
                  className={cn(
                    "group cursor-pointer transition-all duration-300 hover:scale-105",
                    "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10",
                    "overflow-hidden"
                  )}
                  onClick={() => handleVideoModeSelect('start-end-frame')}
                >
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 group-hover:from-emerald-500/30 group-hover:to-green-500/30 transition-all">
                        <GitCompare className="w-12 h-12 text-emerald-400" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-bold text-white">
                        Start/End Frame Mode
                      </h3>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Define both starting and ending frames. The AI will create smooth transitions between the two states
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Two image inputs</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Controlled transitions</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>Precise animation</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                      size="lg"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Use Start/End Frames
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Back Button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1);
                    setVideoGenerationMode(null);
                  }}
                  className="text-white/60 hover:text-white"
                >
                  ← Back to Animation Mode
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

