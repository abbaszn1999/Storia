/**
 * PlatformCard Component
 * ═══════════════════════════════════════════════════════════════════════════
 * Individual platform card with connection status, selection, and metadata
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, 
  Sparkles, 
  RefreshCw, 
  Link2, 
  AlertCircle,
  Lock
} from 'lucide-react';
import type { PlatformCardProps } from './types';

export function PlatformCard({
  platform,
  isSelected,
  isConnected,
  isCompatible,
  compatibilityReason,
  isExpanded,
  metadata,
  isGeneratingMetadata,
  onSelect,
  onExpand,
  onConnect,
  onMetadataChange,
  onGenerateMetadata,
}: PlatformCardProps) {
  const Icon = platform.icon;
  const isDisabled = !isCompatible || !isConnected;
  const showConnectButton = !isConnected && isCompatible;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-all duration-200",
      isDisabled
        ? "border-white/5 opacity-60"
        : isSelected 
          ? "border-purple-500/40 bg-purple-500/5" 
          : "border-white/10 hover:border-white/20"
    )}>
      {/* Platform Header Row */}
      <div className={cn(
        "w-full p-3 flex items-center gap-3",
        "transition-all duration-200",
        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
      )}>
        {/* Checkbox or Lock Icon */}
        {isConnected ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => !isDisabled && onSelect()}
            disabled={isDisabled}
            className={cn(
              "h-5 w-5 rounded border-white/20",
              "data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
            )}
          />
        ) : (
          <div className="h-5 w-5 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white/30" />
          </div>
        )}
        
        {/* Platform Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          platform.iconBg
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        
        {/* Platform Name & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium text-sm",
              isDisabled ? "text-white/40" : "text-white"
            )}>
              {platform.name}
            </span>
            
            {/* Connection Status Badge */}
            {!isConnected && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Not Connected
              </span>
            )}
          </div>
          
          {/* Compatibility Warning */}
          {!isCompatible && compatibilityReason && (
            <p className="text-[10px] text-amber-400/80 flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" />
              {compatibilityReason}
            </p>
          )}
        </div>
        
        {/* Connect Button (for unconnected platforms) */}
        {showConnectButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onConnect();
            }}
            className={cn(
              "h-7 px-3 text-xs gap-1.5",
              "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
              "hover:from-purple-500/20 hover:to-pink-500/20",
              "border-purple-500/30 text-purple-300",
              "transition-all duration-200"
            )}
          >
            <Link2 className="w-3 h-3" />
            Connect
          </Button>
        )}
        
        {/* Expand Arrow - only show if connected and compatible */}
        {isConnected && isCompatible && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-white/40" />
            </motion.div>
          </button>
        )}
      </div>

      {/* Expanded Content - Only show for connected & compatible platforms */}
      <AnimatePresence>
        {isExpanded && isConnected && isCompatible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 space-y-3 bg-white/[0.02] border-t border-white/[0.06]">
              {/* AI Generate Button */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onGenerateMetadata}
                  disabled={isGeneratingMetadata}
                  className={cn(
                    "h-6 px-2 text-[10px] gap-1",
                    "text-purple-400 hover:text-purple-300",
                    "hover:bg-purple-500/10"
                  )}
                >
                  {isGeneratingMetadata ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI Generate
                </Button>
              </div>

              {/* YouTube: Title + Description */}
              {platform.id.startsWith('youtube') && (
                <>
                  <div className="space-y-2">
                    <Input
                      value={metadata?.title || ''}
                      onChange={(e) => onMetadataChange('title', e.target.value)}
                      placeholder="Video title"
                      className={cn(
                        "bg-black/40 border-white/10 text-white text-sm",
                        "placeholder:text-white/30",
                        "focus:border-white/20 focus:ring-0"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      value={metadata?.description || ''}
                      onChange={(e) => onMetadataChange('description', e.target.value)}
                      placeholder="Description"
                      rows={3}
                      className={cn(
                        "bg-black/40 border-white/10 text-white text-sm resize-none",
                        "placeholder:text-white/30",
                        "focus:border-white/20 focus:ring-0"
                      )}
                    />
                  </div>
                </>
              )}

              {/* TikTok, Instagram, Facebook: Caption only */}
              {!platform.id.startsWith('youtube') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs text-white/50">Social Caption</span>
                  </div>
                  <Textarea
                    value={metadata?.caption || ''}
                    onChange={(e) => onMetadataChange('caption', e.target.value)}
                    placeholder="Write a caption..."
                    rows={3}
                    className={cn(
                      "bg-black/40 border-white/10 text-white text-sm resize-none",
                      "placeholder:text-white/30",
                      "focus:border-white/20 focus:ring-0"
                    )}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

