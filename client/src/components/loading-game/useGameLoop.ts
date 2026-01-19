/**
 * Custom hook for game loop with requestAnimationFrame
 * Provides consistent 60fps game updates
 */

import { useRef, useEffect, useCallback } from 'react';

interface GameLoopOptions {
  /** Target FPS (default: 60) */
  targetFps?: number;
  /** Called every frame with deltaTime in ms */
  onUpdate: (deltaTime: number) => void;
  /** Called every frame for rendering */
  onRender: () => void;
  /** Whether the game loop is active */
  isActive: boolean;
}

export function useGameLoop({
  targetFps = 60,
  onUpdate,
  onRender,
  isActive,
}: GameLoopOptions) {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  
  const frameInterval = 1000 / targetFps;

  const gameLoop = useCallback((currentTime: number) => {
    if (!isActive) return;

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Accumulator for fixed time step
    accumulatorRef.current += deltaTime;

    // Update game logic at fixed intervals
    while (accumulatorRef.current >= frameInterval) {
      onUpdate(frameInterval);
      accumulatorRef.current -= frameInterval;
    }

    // Render every frame
    onRender();

    // Request next frame
    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isActive, frameInterval, onUpdate, onRender]);

  useEffect(() => {
    if (isActive) {
      lastTimeRef.current = performance.now();
      accumulatorRef.current = 0;
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isActive, gameLoop]);

  return {
    stop: () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    },
  };
}
