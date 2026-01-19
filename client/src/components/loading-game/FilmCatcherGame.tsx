/**
 * Film Catcher Game Component
 * 
 * Main game logic and UI for the loading screen mini-game.
 * Player moves a basket to catch falling film items and avoid bombs.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameCanvas } from './GameCanvas';
import { useGameLoop } from './useGameLoop';
import {
  type GameState,
  type GameObject,
  type Particle,
  type LoadingGameConfig,
  GOOD_ITEMS,
  BAD_ITEMS,
  GAME_CONFIG,
} from './types';

interface FilmCatcherGameProps extends LoadingGameConfig {
  className?: string;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export function FilmCatcherGame({
  progress,
  isComplete,
  title = 'Loading...',
  subtitle,
  onComplete,
  className,
}: FilmCatcherGameProps) {
  // Canvas dimensions
  const canvasWidth = GAME_CONFIG.CANVAS_WIDTH;
  const canvasHeight = GAME_CONFIG.CANVAS_HEIGHT;

  // Game state
  const [gameState, setGameState] = useState<GameState>(() => ({
    score: 0,
    highScore: parseInt(localStorage.getItem('filmCatcher_highScore') || '0'),
    isPlaying: true,
    isPaused: false,
    objects: [],
    basket: {
      x: canvasWidth / 2 - GAME_CONFIG.BASKET_WIDTH / 2,
      y: canvasHeight - 80,
      width: GAME_CONFIG.BASKET_WIDTH,
      height: GAME_CONFIG.BASKET_HEIGHT,
    },
    lives: GAME_CONFIG.LIVES,
    level: 1,
    combo: 0,
    lastCatch: null,
  }));

  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCombo, setShowCombo] = useState(false);

  // Refs for game logic
  const lastSpawnTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const basketTargetX = useRef(gameState.basket.x);

  // Calculate spawn rate based on level
  const spawnRate = useMemo(() => {
    return Math.max(
      GAME_CONFIG.MIN_SPAWN_RATE,
      GAME_CONFIG.INITIAL_SPAWN_RATE - (gameState.level - 1) * 150
    );
  }, [gameState.level]);

  // Calculate object speed based on level
  const objectSpeed = useMemo(() => {
    return Math.min(
      GAME_CONFIG.MAX_SPEED,
      GAME_CONFIG.INITIAL_SPEED + (gameState.level - 1) * 0.5
    );
  }, [gameState.level]);

  // Spawn new object
  const spawnObject = useCallback(() => {
    const isGood = Math.random() < GAME_CONFIG.GOOD_ITEM_CHANCE;
    const items = isGood ? GOOD_ITEMS : BAD_ITEMS;
    const item = items[Math.floor(Math.random() * items.length)];

    const newObject: GameObject = {
      id: generateId(),
      x: Math.random() * (canvasWidth - GAME_CONFIG.OBJECT_SIZE),
      y: -GAME_CONFIG.OBJECT_SIZE,
      width: GAME_CONFIG.OBJECT_SIZE,
      height: GAME_CONFIG.OBJECT_SIZE,
      speed: objectSpeed + Math.random() * 1,
      type: isGood ? 'good' : 'bad',
      emoji: item.emoji,
      points: item.points,
    };

    setGameState(prev => ({
      ...prev,
      objects: [...prev.objects, newObject],
    }));
  }, [canvasWidth, objectSpeed]);

  // Create catch particles
  const createParticles = useCallback((x: number, y: number, type: 'good' | 'bad', emoji: string) => {
    const particleCount = type === 'good' ? 8 : 5;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3;

      newParticles.push({
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        color: type === 'good' ? '#10b981' : '#ef4444',
        size: type === 'good' ? 8 : 6,
        emoji: i === 0 ? emoji : undefined,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Check collision between object and basket
  const checkCollision = useCallback((obj: GameObject, basket: typeof gameState.basket) => {
    return (
      obj.x < basket.x + basket.width &&
      obj.x + obj.width > basket.x &&
      obj.y < basket.y + basket.height &&
      obj.y + obj.height > basket.y
    );
  }, []);

  // Game update function
  const updateGame = useCallback((deltaTime: number) => {
    if (!gameState.isPlaying || gameState.isPaused || isComplete) return;

    const now = Date.now();

    // Spawn objects
    if (now - lastSpawnTime.current > spawnRate) {
      spawnObject();
      lastSpawnTime.current = now;
    }

    // Update basket position (smooth follow)
    setGameState(prev => {
      const basket = { ...prev.basket };
      const dx = basketTargetX.current - basket.x;
      basket.x += dx * 0.15; // Smooth interpolation

      // Keep basket in bounds
      basket.x = Math.max(0, Math.min(canvasWidth - basket.width, basket.x));

      // Update objects
      let newScore = prev.score;
      let newCombo = prev.combo;
      let newLives = prev.lives;
      let newLastCatch = prev.lastCatch;
      let caughtSomething = false;

      const updatedObjects = prev.objects
        .map(obj => ({
          ...obj,
          y: obj.y + obj.speed,
        }))
        .filter(obj => {
          // Check collision with basket
          if (checkCollision(obj, basket)) {
            caughtSomething = true;
            createParticles(
              obj.x + obj.width / 2,
              obj.y + obj.height / 2,
              obj.type,
              obj.emoji
            );

            if (obj.type === 'good') {
              const comboMultiplier = Math.min(1 + newCombo * 0.1, 2);
              newScore += Math.floor(obj.points * comboMultiplier);
              newCombo++;
              newLastCatch = 'good';
            } else {
              newScore = Math.max(0, newScore + obj.points);
              newCombo = 0;
              newLives--;
              newLastCatch = 'bad';
            }

            return false; // Remove caught object
          }

          // Remove objects that fell off screen
          if (obj.y > canvasHeight) {
            if (obj.type === 'good') {
              newCombo = 0; // Reset combo on miss
            }
            return false;
          }

          return true;
        });

      // Show combo notification
      if (caughtSomething && newCombo >= 3) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 500);
      }

      // Level up check
      let newLevel = prev.level;
      if (newScore >= GAME_CONFIG.LEVEL_UP_SCORE * newLevel) {
        newLevel++;
      }

      // Update high score
      let newHighScore = prev.highScore;
      if (newScore > newHighScore) {
        newHighScore = newScore;
        localStorage.setItem('filmCatcher_highScore', newHighScore.toString());
      }

      // Clear lastCatch indicator after delay
      if (newLastCatch !== prev.lastCatch) {
        setTimeout(() => {
          setGameState(p => ({ ...p, lastCatch: null }));
        }, 200);
      }

      return {
        ...prev,
        basket,
        objects: updatedObjects,
        score: newScore,
        highScore: newHighScore,
        combo: newCombo,
        lives: Math.max(0, newLives),
        level: newLevel,
        lastCatch: newLastCatch,
        isPlaying: newLives > 0,
      };
    });

    // Update particles
    setParticles(prev =>
      prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // Gravity
          life: p.life - 0.02,
        }))
        .filter(p => p.life > 0)
    );
  }, [
    gameState.isPlaying,
    gameState.isPaused,
    isComplete,
    spawnRate,
    spawnObject,
    canvasWidth,
    canvasHeight,
    checkCollision,
    createParticles,
  ]);

  // Render function (empty - canvas handles rendering)
  const render = useCallback(() => {
    // Canvas component handles rendering via useEffect
  }, []);

  // Start game loop
  useGameLoop({
    onUpdate: updateGame,
    onRender: render,
    isActive: gameState.isPlaying && !isComplete,
  });

  // Handle mouse/touch movement
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const canvasRect = container.querySelector('canvas')?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = e.clientX - canvasRect.left;
    basketTargetX.current = x - GAME_CONFIG.BASKET_WIDTH / 2;
  }, []);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        basketTargetX.current = Math.max(0, basketTargetX.current - 30);
      } else if (e.key === 'ArrowRight') {
        basketTargetX.current = Math.min(
          canvasWidth - GAME_CONFIG.BASKET_WIDTH,
          basketTargetX.current + 30
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasWidth]);

  // Restart game
  const restartGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      isPlaying: true,
      isPaused: false,
      objects: [],
      lives: GAME_CONFIG.LIVES,
      level: 1,
      combo: 0,
      lastCatch: null,
    }));
    setParticles([]);
    lastSpawnTime.current = Date.now();
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className={`relative flex flex-col items-center justify-center ${className || ''}`}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    >
      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h2 className="text-2xl font-bold text-white drop-shadow-lg">
          {title}
        </h2>
        {subtitle && (
          <p className="text-white/70 text-sm mt-1">{subtitle}</p>
        )}
      </motion.div>

      {/* Score Display */}
      <div className="flex items-center justify-between w-[550px] mb-2 px-2">
        <div className="flex items-center gap-4">
          <span className="text-white font-mono">
            Score: <span className="text-emerald-400 font-bold">{gameState.score}</span>
          </span>
          <span className="text-white/60 text-sm font-mono">
            Best: {gameState.highScore}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Lv.{gameState.level}</span>
          <div className="flex gap-1">
            {Array.from({ length: GAME_CONFIG.LIVES }).map((_, i) => (
              <span
                key={i}
                className={`text-lg ${i < gameState.lives ? 'opacity-100' : 'opacity-30'}`}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10">
        <GameCanvas
          width={canvasWidth}
          height={canvasHeight}
          gameState={gameState}
          particles={particles}
          progress={progress}
          className="cursor-none"
        />

        {/* Combo indicator */}
        <AnimatePresence>
          {showCombo && gameState.combo >= 3 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <span className="text-4xl font-bold text-yellow-400 drop-shadow-lg">
                {gameState.combo}x COMBO! 🔥
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over overlay */}
        <AnimatePresence>
          {!gameState.isPlaying && !isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <h3 className="text-3xl font-bold text-white mb-2">Game Over!</h3>
              <p className="text-white/70 mb-1">Score: {gameState.score}</p>
              {gameState.score >= gameState.highScore && gameState.score > 0 && (
                <p className="text-yellow-400 font-bold mb-4">🏆 New High Score!</p>
              )}
              <button
                onClick={restartGame}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Play Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Complete overlay */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <span className="text-6xl">✅</span>
              </motion.div>
              <h3 className="text-2xl font-bold text-white mt-4">Ready!</h3>
              <p className="text-white/70 mt-2">Final Score: {gameState.score}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="w-[550px] mt-4">
        <div className="flex items-center justify-between text-white/60 text-sm mb-1">
          <span>Loading Progress</span>
          <span>{Math.floor(progress)}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Instructions */}
      <p className="text-white/40 text-xs mt-4 text-center">
        Move mouse or use ← → to catch 🎬 and avoid 💣
      </p>
    </motion.div>
  );
}
