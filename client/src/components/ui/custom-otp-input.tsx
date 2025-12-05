import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CustomOTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function CustomOTPInput({
  length = 6,
  value = "",
  onChange,
  disabled = false,
  className,
  "data-testid": testId,
}: CustomOTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, "").slice(0, length).split("");

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  }, [length]);

  const handleChange = useCallback((index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);
    
    if (digit) {
      const newDigits = [...digits];
      newDigits[index] = digit;
      onChange(newDigits.join(""));
      
      if (index < length - 1) {
        setTimeout(() => focusInput(index + 1), 0);
      }
    }
  }, [digits, length, onChange, focusInput]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];
      
      if (digits[index]) {
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
    }
  }, [digits, length, onChange, focusInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    
    if (pastedData) {
      onChange(pastedData.padEnd(length, "").slice(0, length));
      const lastIndex = Math.min(pastedData.length, length - 1);
      setTimeout(() => focusInput(lastIndex), 0);
    }
  }, [length, onChange, focusInput]);

  return (
    <div 
      className={cn("flex items-center gap-2", className)}
      data-testid={testId}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => inputRefs.current[index]?.select()}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          aria-label={`Digit ${index + 1} of ${length}`}
          className={cn(
            "w-10 h-12 text-center text-lg font-semibold",
            "border border-input rounded-md",
            "bg-background text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-150"
          )}
          data-testid={testId ? `${testId}-slot-${index}` : undefined}
        />
      ))}
    </div>
  );
}
