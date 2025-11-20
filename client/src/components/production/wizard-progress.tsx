import { Check } from "lucide-react";

interface WizardProgressProps {
  currentStep: number;
  steps: {
    number: number;
    title: string;
  }[];
}

export function WizardProgress({ currentStep, steps }: WizardProgressProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center flex-1 relative">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div
                  className={`flex-1 h-0.5 -ml-2 ${
                    currentStep > step.number - 1
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                />
              )}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep > step.number
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.number
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-indicator-${step.number}`}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 -mr-2 ${
                    currentStep > step.number
                      ? "bg-primary"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 text-sm font-medium text-center ${
                currentStep === step.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
