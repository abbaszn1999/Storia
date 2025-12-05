import { useRef, useState, useEffect, useCallback } from "react";
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
  value,
  onChange,
  disabled = false,
  className,
  "data-testid": testId,
}: CustomOTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [localValues, setLocalValues] = useState<string[]>(
    Array(length).fill("")
  );

  useEffect(() => {
    const chars = value.split("").slice(0, length);
    const newValues = Array(length).fill("");
    chars.forEach((char, i) => {
      if (/^\d$/.test(char)) {
        newValues[i] = char;
      }
    });
    setLocalValues(newValues);
  }, [value, length]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  }, [length]);

  const updateValue = useCallback((newValues: string[]) => {
    setLocalValues(newValues);
    onChange(newValues.join(""));
  }, [onChange]);

  const handleChange = useCallback((index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);
    
    if (digit) {
      const newValues = [...localValues];
      newValues[index] = digit;
      updateValue(newValues);
      
      if (index < length - 1) {
        focusInput(index + 1);
      }
    }
  }, [localValues, length, updateValue, focusInput]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newValues = [...localValues];
      
      if (localValues[index]) {
        newValues[index] = "";
        updateValue(newValues);
      } else if (index > 0) {
        newValues[index - 1] = "";
        updateValue(newValues);
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
      const newValues = [...localValues];
      newValues[index] = "";
      updateValue(newValues);
    }
  }, [localValues, length, updateValue, focusInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    
    if (pastedData) {
      const newValues = Array(length).fill("");
      pastedData.split("").forEach((char, i) => {
        if (i < length) {
          newValues[i] = char;
        }
      });
      updateValue(newValues);
      
      const lastFilledIndex = Math.min(pastedData.length, length) - 1;
      if (lastFilledIndex >= 0) {
        focusInput(lastFilledIndex < length - 1 ? lastFilledIndex + 1 : lastFilledIndex);
      }
    }
  }, [length, updateValue, focusInput]);

  const handleFocus = useCallback((index: number) => {
    inputRefs.current[index]?.select();
  }, []);

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
          pattern="[0-9]*"
          maxLength={1}
          value={localValues[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
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
