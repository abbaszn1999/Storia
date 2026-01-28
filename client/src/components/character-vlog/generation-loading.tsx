/**
 * Generation Loading Component
 * 
 * An elegant loading screen shown during scene and storyboard generation
 * Features circular progress, gradient effects, and smooth animations
 */

import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationLoadingProps {
  title: string;
  description?: string;
  currentStep?: string;
  progress: number; // 0-100
  showDetails?: boolean;
  details?: {
    current: number;
    total: number;
    label: string;
  };
}

export function GenerationLoading({
  title,
  description,
  currentStep,
  progress,
  showDetails = false,
  details,
}: GenerationLoadingProps) {
  // Ensure progress is between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Calculate circular progress (circumference)
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF4081]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF6B4A]/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative mb-12">
          {/* Background Circle */}
          <svg className="w-64 h-64 -rotate-90">
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle with Gradient */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF4081" />
                <stop offset="50%" stopColor="#FF5C8D" />
                <stop offset="100%" stopColor="#FF6B4A" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A] bg-clip-text text-transparent">
                {Math.round(clampedProgress)}%
              </div>
              {showDetails && details && (
                <div className="text-xs text-white/50 mt-2">
                  {details.current} / {details.total} {details.label}
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF4081] to-[#FF6B4A]"
              style={{
                left: `${50 + 45 * Math.cos((i * Math.PI) / 4)}%`,
                top: `${50 + 45 * Math.sin((i * Math.PI) / 4)}%`,
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        
        {/* Title and Description */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Wand2 className="w-5 h-5 text-[#FF4081]" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-[#FF6B4A]" />
            </motion.div>
          </div>
          {description && (
            <p className="text-sm text-white/60 max-w-md mx-auto">{description}</p>
          )}
        </motion.div>
        
        {/* Current Step */}
        {currentStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="text-sm text-white/80">
              <span className="text-white/50">Current: </span>
              <span className="font-medium">{currentStep}</span>
            </div>
          </motion.div>
        )}
        
        {/* Bottom Progress Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "400px", opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          {/* Label */}
          <div className="text-center mb-3">
            <span className="text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
              Processing
            </span>
          </div>
          
          {/* Bar Container */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF4081] via-[#FF5C8D] to-[#FF6B4A] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          {/* Shimmer Effect */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
        
        {/* Bottom Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-[#FF4081]" />
          </motion.div>
        </motion.div>
        
        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-white/30 mt-8 text-center max-w-sm"
        >
          This process typically takes 2-4 minutes. Please don't close this window.
        </motion.p>
      </div>
    </div>
  );
}
