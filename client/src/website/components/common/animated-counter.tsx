import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 2, className = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    // Extract numeric part and suffix
    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const numericPart = parseFloat(match[1]);
    const suffix = match[2] || "";

    // Handle special cases
    if (value === "∞") {
      setDisplayValue("∞");
      return;
    }

    // Animate the number
    const startTime = Date.now();
    const durationMs = duration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = numericPart * easeOut;
      
      // Format the number
      let formatted: string;
      if (Number.isInteger(numericPart)) {
        formatted = Math.round(currentValue).toString();
      } else {
        formatted = currentValue.toFixed(1);
      }
      
      setDisplayValue(formatted + suffix);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  );
}

export default AnimatedCounter;
