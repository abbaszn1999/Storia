import { Button } from "@/components/ui/button";
import { Loader2, Play, RefreshCw, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { BeatStatus } from "@/types/commerce";
import { cn } from "@/lib/utils";

interface BeatGenerationButtonProps {
  status: BeatStatus;
  onGenerate: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  error?: string;
}

export function BeatGenerationButton({
  status,
  onGenerate,
  onRetry,
  disabled = false,
  error,
}: BeatGenerationButtonProps) {
  const isDisabled = disabled || status === 'locked' || status === 'generating';

  const getButtonContent = () => {
    switch (status) {
      case 'completed':
        return (
          <Button
            variant="outline"
            onClick={onRetry || onGenerate}
            className="w-full h-12 border-2 border-green-500/30 bg-green-500/10 hover:bg-green-500/20 font-semibold shadow-lg transition-all"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Regenerate Beat
          </Button>
        );
      case 'generating':
        return (
          <div className="space-y-3">
            <Button
              variant="outline"
              disabled
              className="w-full h-12 border-2 border-yellow-500/30 bg-yellow-500/10 font-semibold shadow-lg"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Video...
            </Button>
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 text-center">
                This may take 4-6 minutes. Please wait...
              </p>
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="space-y-3">
            <Button
              variant="destructive"
              onClick={onRetry || onGenerate}
              className="w-full h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Retry Generation
            </Button>
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        );
      case 'locked':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  disabled
                  className="w-full h-12 opacity-60 cursor-not-allowed border-2 border-gray-400/30 bg-gray-500/10 font-semibold"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Locked
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Complete the previous connected beat first</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'pending':
      default:
        return (
          <Button
            onClick={onGenerate}
            disabled={isDisabled}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="mr-2 h-5 w-5" />
            Generate Beat
          </Button>
        );
    }
  };

  return (
    <div className={cn("w-full space-y-3")}>
      {getButtonContent()}
    </div>
  );
}

