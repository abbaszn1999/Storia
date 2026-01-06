import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronDown, ChevronUp, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SoraPromptViewerProps {
  prompt: string;
  className?: string;
}

export function SoraPromptViewer({ prompt, className }: SoraPromptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Prompt copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive",
      });
    }
  };

  // Show first 500 characters when collapsed
  const displayText = isExpanded ? prompt : prompt.substring(0, 500);
  const shouldShowExpand = prompt.length > 500;

  return (
    <Card className={cn("w-full border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-xl", className)}>
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <CardTitle className="text-base font-bold">Sora Prompt</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generated prompt for video generation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-9 border-border/50 hover:bg-primary/10"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            {shouldShowExpand && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-9 border-border/50 hover:bg-primary/10"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Expand
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
          <ScrollArea className={cn("w-full", isExpanded ? "h-[500px]" : "h-[250px]")}>
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground/90">
              {displayText}
              {!isExpanded && shouldShowExpand && (
                <span className="text-muted-foreground">...</span>
              )}
            </pre>
          </ScrollArea>
        </div>
        {shouldShowExpand && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">
              {prompt.length.toLocaleString()} characters total
            </p>
            <Badge variant="secondary" className="text-xs">
              {isExpanded ? 'Expanded' : 'Collapsed'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

