import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface StepResetWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  currentStepName: string;
}

export function StepResetWarningDialog({
  open,
  onOpenChange,
  onAccept,
  currentStepName,
}: StepResetWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-lg">
              You've Modified a Completed Step
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm space-y-3 pt-2">
            <p>
              You changed settings in <span className="font-semibold text-white">"{currentStepName}"</span> after completing it.
            </p>
            
            <div className="bg-white/5 rounded-md p-3 space-y-2">
              <p className="font-medium text-white text-xs">Continuing will:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Re-run the AI agent with your new settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Clear all work from subsequent steps (Product DNA, Environment, Shots, Media Planning)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Update the video from this point forward</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-amber-400/80 font-medium">
              ⚠️ This cannot be undone. Your previous agent outputs will be lost.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/5 hover:bg-white/10 border-white/10">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold"
          >
            Accept & Restart From Here
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

