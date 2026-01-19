/**
 * GameCanvas Component - Optimized Version
 * 
 * High-performance canvas renderer for the Film Catcher game.
 * Simplified for smooth 60fps performance.
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { GameState, Particle, GameObject } from './types';

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

    useImperativeHandle(ref, () => ({
      getContext: () => canvasRef.current?.getContext('2d') || null,
    }));

    // Main render
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw simple gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw objects (no shadows for performance)
      gameState.objects.forEach(obj => {
        ctx.font = `${obj.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, obj.x + obj.width / 2, obj.y + obj.height / 2);
      });

      // Draw particles (simplified)
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        if (p.emoji) {
          ctx.font = `${p.size}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });

      // Draw basket
      const basket = gameState.basket;
      ctx.font = `${basket.width}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧺', basket.x + basket.width / 2, basket.y + basket.height / 2);

      // Draw progress bar at bottom
      const barHeight = 15;
      const barY = height - barHeight;
      
      // Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, barY, width, barHeight);
      
      // Progress
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, barY, (progress / 100) * width, barHeight);

    }, [width, height, gameState, particles, progress]);

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{ touchAction: 'none' }}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
