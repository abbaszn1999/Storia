import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  summary?: React.ReactNode;
}

export function WizardNavigation({
  currentStep,
  isFirstStep,
  isLastStep,
  canGoNext,
  canGoBack,
  onBack,
  onNext,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create Campaign",
  summary,
}: WizardNavigationProps) {
  return (
    <>
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          onClick={isFirstStep ? onCancel : onBack}
          disabled={!canGoBack && !isFirstStep}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isFirstStep ? 'Cancel' : 'Back'}
        </Button>

        {summary && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {summary}
            </div>
          </>
        )}
      </div>

      {isLastStep ? (
        <Button
          onClick={onNext}
          disabled={isSubmitting || !canGoNext}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            "Creating..."
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {submitLabel}
            </>
          )}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canGoNext}>
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </>
  );
}
