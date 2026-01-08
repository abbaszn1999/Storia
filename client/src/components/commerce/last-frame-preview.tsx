import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LastFramePreviewProps {
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function LastFramePreview({
  imageUrl,
  isLoading = false,
  error,
  className,
}: LastFramePreviewProps) {
  return (
    <Card className={cn("w-full border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
            <span className="text-xl">🖼️</span>
          </div>
          <div>
            <CardTitle className="text-base font-bold">Input Frame</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last frame from previous beat (used as input)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
            <div className="text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading frame...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-500/30 bg-red-500/5">
            <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : imageUrl ? (
          <div className="group relative overflow-hidden rounded-xl border-2 border-border/50 bg-muted/20 shadow-inner">
            <img
              src={imageUrl}
              alt="Last frame from previous beat"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
            <div className="text-center">
              <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No frame available</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Previous beat must be completed first
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

