/**
 * GameCanvas Component
 * 
 * High-performance canvas renderer for the Film Catcher game.
 * Handles all drawing operations with smooth animations.
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { GameState, Particle, GAME_CONFIG } from './types';

interface GameCanvasProps {
  width: number;
  height: number;
  gameState: GameState;
  particles: Particle[];
  progress: number;
  className?: string;
}

export interface GameCanvasHandle {
  getContext: () => CanvasRenderingContext2D | null;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ width, height, gameState, particles, progress, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Expose canvas context to parent
    useImperativeHandle(ref, () => ({
      getContext: () => canvasRef.current?.getContext('2d') || null,
    }));

    // Initialize offscreen canvas for double buffering
    useEffect(() => {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = width;
      offscreenCanvasRef.current.height = height;
    }, [width, height]);

    // Main render function
    useEffect(() => {
      const canvas = canvasRef.current;
      const offscreen = offscreenCanvasRef.current;
      if (!canvas || !offscreen) return;

      const ctx = canvas.getContext('2d');
      const offCtx = offscreen.getContext('2d');
      if (!ctx || !offCtx) return;

      // Clear offscreen canvas
      offCtx.clearRect(0, 0, width, height);

      // Draw background with gradient
      drawBackground(offCtx, width, height, progress);

      // Draw falling objects
      gameState.objects.forEach(obj => {
        drawObject(offCtx, obj);
      });

      // Draw particles
      particles.forEach(particle => {
        drawParticle(offCtx, particle);
      });

      // Draw basket
      drawBasket(offCtx, gameState.basket, gameState.lastCatch);

      // Draw ground with progress
      drawGround(offCtx, width, height, progress);

      // Copy to visible canvas
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(offscreen, 0, 0);

    }, [width, height, gameState, particles, progress]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{ 
          imageRendering: 'pixelated',
          touchAction: 'none',
        }}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';

// === Drawing Functions ===

function drawBackground(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  progress: number
) {
  // Create gradient based on loading progress
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  
  // Colors shift from dark to vibrant as loading progresses
  const progressRatio = progress / 100;
  
  // Top color
  const topR = Math.floor(15 + progressRatio * 10);
  const topG = Math.floor(20 + progressRatio * 30);
  const topB = Math.floor(35 + progressRatio * 20);
  
  // Bottom color
  const bottomR = Math.floor(10 + progressRatio * 15);
  const bottomG = Math.floor(15 + progressRatio * 40);
  const bottomB = Math.floor(30 + progressRatio * 30);
  
  gradient.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
  gradient.addColorStop(1, `rgb(${bottomR}, ${bottomG}, ${bottomB})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw stars/sparkles
  drawStars(ctx, width, height, progress);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number
) {
  const starCount = Math.floor(15 + (progress / 100) * 20);
  
  ctx.save();
  for (let i = 0; i < starCount; i++) {
    // Deterministic positions based on index
    const x = (i * 31.7) % width;
    const y = (i * 17.3) % (height - 100);
    const size = 1 + (i % 3);
    const twinkle = Math.sin(Date.now() / 500 + i) * 0.5 + 0.5;
    
    ctx.globalAlpha = 0.3 + twinkle * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawObject(
  ctx: CanvasRenderingContext2D,
  obj: { x: number; y: number; width: number; height: number; emoji: string; type: 'good' | 'bad' }
) {
  ctx.save();
  
  // Add glow effect for good items
  if (obj.type === 'good') {
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 15;
  } else {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
  }
  
  // Draw emoji
  ctx.font = `${obj.width}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(obj.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2);
  
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.save();
  
  const lifeRatio = particle.life / particle.maxLife;
  ctx.globalAlpha = lifeRatio;
  
  if (particle.emoji) {
    ctx.font = `${particle.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(particle.emoji, particle.x, particle.y);
  } else {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * lifeRatio, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawBasket(
  ctx: CanvasRenderingContext2D,
  basket: { x: number; y: number; width: number; height: number },
  lastCatch: 'good' | 'bad' | null
) {
  ctx.save();
  
  // Basket glow based on last catch
  if (lastCatch === 'good') {
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 20;
  } else if (lastCatch === 'bad') {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
  }
  
  // Draw basket emoji
  ctx.font = `${basket.width}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧺', basket.x + basket.width / 2, basket.y + basket.height / 2);
  
  ctx.restore();
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number
) {
  const groundHeight = 20;
  const y = height - groundHeight;
  
  // Background track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, y, width, groundHeight);
  
  // Progress fill with gradient
  const progressWidth = (progress / 100) * width;
  const gradient = ctx.createLinearGradient(0, y, progressWidth, y);
  gradient.addColorStop(0, '#10b981');
  gradient.addColorStop(1, '#14b8a6');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, progressWidth, groundHeight);
  
  // Shine effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(0, y, progressWidth, 4);
  
  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, y, width, groundHeight);
}
