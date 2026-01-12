import { useEffect, useRef } from "react";

interface AuroraBackgroundProps {
  className?: string;
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
}

export function AuroraBackground({
  className = "",
  colorStops = ["#5227FF", "#7cff67", "#5227FF"],
  amplitude = 1,
  blend = 0.5,
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Use same colors for both light and dark mode
      const stops = [
        "rgba(139, 92, 246, 0.15)", // Light purple
        "rgba(236, 72, 153, 0.1)", // Light pink
        "rgba(139, 92, 246, 0.15)", // Light purple
      ];

      stops.forEach((color, index) => {
        const offset = index / (stops.length - 1);
        gradient.addColorStop(offset, color);
      });

      // Create wave effect
      const wave1 = Math.sin(time) * amplitude * 50;
      const wave2 = Math.cos(time * 0.7) * amplitude * 30;
      const wave3 = Math.sin(time * 1.3) * amplitude * 40;

      ctx.fillStyle = gradient;
      // Slightly stronger alpha so the aurora shows through cards in dark mode too
      ctx.globalAlpha = blend; // use provided blend directly
      
      // Draw multiple overlapping waves for aurora effect
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const baseY = canvas.height / 2 + wave1;
        ctx.moveTo(0, baseY);
        
        for (let x = 0; x < canvas.width; x += 5) {
          const y = 
            baseY +
            Math.sin((x / canvas.width) * Math.PI * 2 + time + i * 0.5) * (amplitude * 80) +
            wave1 * Math.sin(x / 200 + time) +
            wave2 * Math.cos(x / 300 + time * 0.7) +
            wave3 * Math.sin(x / 400 + time * 1.2);
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colorStops, amplitude, blend]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none -z-10 ${className}`}
      style={{ 
        // Use a blend mode that remains visible on dark backgrounds
        mixBlendMode: "screen",
        opacity: 0.75,
      }}
    />
  );
}

