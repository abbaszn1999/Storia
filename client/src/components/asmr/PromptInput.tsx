// ASMR Prompt Input - Modern Text Area with Magic Enhance

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  enhanceDisabled?: boolean;
  placeholder?: string;
  label?: string;
  maxLength?: number;
  minRows?: number;
  showEnhance?: boolean;  // Whether to show the Enhance button
}

export function PromptInput({
  value,
  onChange,
  onEnhance,
  isEnhancing = false,
  enhanceDisabled = false,
  placeholder = "Describe your scene...",
  label = "Visual Prompt",
  maxLength = 2000,
  minRows = 3,
  showEnhance = true,  // Default: always show Enhance button
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(value.length);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, minRows * 24)}px`;
    }
  }, [value, minRows]);

  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxLength) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative w-full">
      {/* Label & Actions Row */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-foreground/80">
          {label}
        </label>
        
        {/* Enhance with AI Button - Always visible when showEnhance is true */}
        {showEnhance && onEnhance && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEnhance}
            disabled={isEnhancing || enhanceDisabled}
            className={cn(
              "h-7 px-2.5 text-xs",
              "bg-primary/10 text-primary hover:bg-primary/20",
              "border border-primary/20",
              (isEnhancing || enhanceDisabled) && "opacity-70"
            )}
          >
            {isEnhancing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1.5" />
                Enhance
              </>
            )}
          </Button>
        )}
      </div>

      {/* Text Area Container */}
      <div
        className={cn(
          "relative rounded-xl overflow-hidden",
          "transition-all duration-300 ease-out",
          "bg-white/[0.03]",
          "border",
          isFocused
            ? "border-primary/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
            : "border-white/[0.08] hover:border-white/[0.12]"
        )}
      >
        {/* Glow Effect when focused */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={minRows}
          className={cn(
            "relative w-full px-4 py-3",
            "bg-transparent",
            "text-sm text-foreground",
            "placeholder:text-muted-foreground/50",
            "resize-none",
            "focus:outline-none",
            "scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          )}
          style={{ minHeight: `${minRows * 24 + 24}px` }}
        />

        {/* Character Count */}
        <div className="absolute bottom-2 right-3 flex items-center gap-2">
          <span className={cn(
            "text-[10px] tabular-nums",
            charCount > maxLength * 0.9
              ? "text-orange-400"
              : "text-muted-foreground/40"
          )}>
            {charCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Enhancement Progress Indicator */}
      <AnimatePresence>
        {isEnhancing && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary origin-left"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
