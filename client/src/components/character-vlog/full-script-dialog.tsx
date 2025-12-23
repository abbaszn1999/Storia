import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface FullScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: string;
}

export function FullScriptDialog({ open, onOpenChange, script }: FullScriptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Full Script
          </DialogTitle>
          <DialogDescription>
            Complete narration script for your video
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {script && script.trim().length > 0 ? (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {script}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No script available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
