/**
 * Custom hook for game loop with requestAnimationFrame
 * Simplified for better performance
 */

import { useRef, useEffect, useCallback } from 'react';

interface GameLoopOptions {
  onUpdate: () => void;
  onRender: () => void;
  isActive: boolean;
}

export function useGameLoop({ onUpdate, onRender, isActive }: GameLoopOptions) {
  const frameRef = useRef<number>(0);

  const gameLoop = useCallback(() => {
    if (!isActive) return;

    onUpdate();
    onRender();

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isActive, onUpdate, onRender]);

  useEffect(() => {
    if (isActive) {
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
