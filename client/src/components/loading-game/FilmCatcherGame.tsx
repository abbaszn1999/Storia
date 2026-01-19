/**
 * Film Catcher Game Component - Optimized Version
 * 
 * Features:
 * - Start screen with "Play Game" button
 * - Progressive difficulty (speed increases with score)
 * - Power-ups: heart, shield, magnet, slow-motion
 * - Optimized for 60fps performance
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
  type PowerUpType,
  type ActivePowerUp,
  GOOD_ITEMS,
  BAD_ITEMS,
  POWER_UP_ITEMS,
  GAME_CONFIG,
} from './types';
import { Play, Trophy, Gamepad2 } from 'lucide-react';

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
  const canvasWidth = GAME_CONFIG.CANVAS_WIDTH;
  const canvasHeight = GAME_CONFIG.CANVAS_HEIGHT;

  const [showGame, setShowGame] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>(() => ({
    score: 0,
    highScore: parseInt(localStorage.getItem('filmCatcher_highScore') || '0'),
    isPlaying: false,
    isPaused: false,
    gameStarted: false,
    objects: [],
    basket: {
      x: canvasWidth / 2 - GAME_CONFIG.BASKET_WIDTH / 2,
      y: canvasHeight - 80,
      width: GAME_CONFIG.BASKET_WIDTH,
      height: GAME_CONFIG.BASKET_HEIGHT,
    },
    lives: GAME_CONFIG.LIVES,
    maxLives: GAME_CONFIG.MAX_LIVES,
    level: 1,
    combo: 0,
    maxCombo: 0,
    lastCatch: null,
    activePowerUps: [],
    achievements: [],
    totalCatches: 0,
    playTime: 0,
    screenShake: 0,
  }));

  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCombo, setShowCombo] = useState(false);

  // Refs for game logic
  const lastSpawnTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const basketTargetX = useRef(gameState.basket.x);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate speed multiplier based on score (faster progression)
  // Returns a value from 0 to 100+ representing speed percentage
  const getSpeedMultiplier = useCallback((score: number) => {
    // Speed increases every 50 points, starts at 0%
    const speedLevel = Math.floor(score / 50);
    return speedLevel * 15; // 15% increase per level (0%, 15%, 30%, 45%...)
  }, []);

  // Calculate spawn rate based on score
  const getSpawnRate = useCallback((score: number) => {
    const baseRate = 800; // Start faster (was 1400)
    const minRate = 300; // Can go faster (was 400)
    const reduction = Math.floor(score / 30) * 50; // Reduce every 30 points
    return Math.max(minRate, baseRate - reduction);
  }, []);

  // Spawn new object
  const spawnObject = useCallback((currentScore: number, activePowerUps: ActivePowerUp[]) => {
    const now = Date.now();
    const hasSlowMo = activePowerUps.some(p => p.type === 'slowmo' && p.expiresAt > now);
    
    // Determine probabilities based on score
    const badChance = Math.min(0.25 + (currentScore / 500) * 0.15, 0.45); // Max 45% bad
    const powerUpChance = 0.08 + (currentScore / 1000) * 0.05; // Increases slightly
    
    const random = Math.random();
    let type: 'good' | 'bad' | 'powerup';
    let item;
    let powerUpType: PowerUpType | undefined;

    if (random < powerUpChance) {
      type = 'powerup';
      const powerUp = POWER_UP_ITEMS[Math.floor(Math.random() * POWER_UP_ITEMS.length)];
      item = { emoji: powerUp.emoji, points: 0 };
      powerUpType = powerUp.type;
    } else if (random < powerUpChance + (1 - badChance - powerUpChance)) {
      type = 'good';
      item = GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
    } else {
      type = 'bad';
      item = BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];
    }

    // Calculate speed
    const baseSpeed = 4; // Base speed
    const speedBonus = getSpeedMultiplier(currentScore) / 100; // Convert percentage to multiplier
    const slowMoMultiplier = hasSlowMo ? 0.4 : 1;
    const finalSpeed = baseSpeed * (1 + speedBonus) * slowMoMultiplier + Math.random() * 1.5;

    const newObject: GameObject = {
      id: generateId(),
      x: Math.random() * (canvasWidth - GAME_CONFIG.OBJECT_SIZE),
      y: -GAME_CONFIG.OBJECT_SIZE,
      width: GAME_CONFIG.OBJECT_SIZE,
      height: GAME_CONFIG.OBJECT_SIZE,
      speed: Math.min(finalSpeed, 12), // Cap at 12
      type,
      emoji: item.emoji,
      points: item.points,
      powerUp: powerUpType,
    };

    return newObject;
  }, [canvasWidth, getSpeedMultiplier]);

  // Create particles (simplified)
  const createParticles = useCallback((x: number, y: number, type: 'good' | 'bad' | 'powerup', emoji: string) => {
    const particleCount = 5;
    const newParticles: Particle[] = [];
    const colors = { good: '#10b981', bad: '#ef4444', powerup: '#fbbf24' };

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      newParticles.push({
        id: generateId(),
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3 - 2,
        life: 1,
        maxLife: 1,
        color: colors[type],
        size: 6,
        emoji: i === 0 ? emoji : undefined,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Check collision
  const checkCollision = useCallback((obj: GameObject, basket: typeof gameState.basket) => {
    return (
      obj.x < basket.x + basket.width &&
      obj.x + obj.width > basket.x &&
      obj.y < basket.y + basket.height &&
      obj.y + obj.height > basket.y
    );
  }, []);

  // Game update function (optimized)
  const updateGame = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || isComplete || !gameState.gameStarted) return;

    const now = Date.now();

    setGameState(prev => {
      // Clean up expired power-ups
      const activePowerUps = prev.activePowerUps.filter(p => p.expiresAt > now);
      
      // Spawn check
      const spawnRate = getSpawnRate(prev.score);
      let newObjects = [...prev.objects];
      
      if (now - lastSpawnTime.current > spawnRate) {
        newObjects.push(spawnObject(prev.score, activePowerUps));
        lastSpawnTime.current = now;
      }

      // Update basket position
      const basket = { ...prev.basket };
      const dx = basketTargetX.current - basket.x;
      basket.x += dx * 0.2;
      basket.x = Math.max(0, Math.min(canvasWidth - basket.width, basket.x));

      // Check power-ups
      const hasMagnet = activePowerUps.some(p => p.type === 'magnet');
      const hasShield = activePowerUps.some(p => p.type === 'shield');
      const hasDouble = activePowerUps.some(p => p.type === 'double');
      const hasSlowMo = activePowerUps.some(p => p.type === 'slowmo');

      let newScore = prev.score;
      let newCombo = prev.combo;
      let newMaxCombo = prev.maxCombo;
      let newLives = prev.lives;
      let newLastCatch = prev.lastCatch;
      let caughtGood = false;
      let newActivePowerUps = [...activePowerUps];

      // Update objects
      const updatedObjects = newObjects
        .map(obj => {
          let newX = obj.x;
          const speedMult = hasSlowMo ? 0.4 : 1;
          let newY = obj.y + obj.speed * speedMult;

          // Magnet effect
          if (hasMagnet && obj.type === 'good') {
            const basketCenterX = basket.x + basket.width / 2;
            const objCenterX = obj.x + obj.width / 2;
            const distance = Math.abs(basketCenterX - objCenterX);
            if (distance < 150) {
              const pull = 4 * (1 - distance / 150);
              newX += (basketCenterX > objCenterX ? pull : -pull);
            }
          }

          return { ...obj, x: newX, y: newY };
        })
        .filter(obj => {
          if (checkCollision(obj, basket)) {
            createParticles(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.type, obj.emoji);

            if (obj.type === 'powerup' && obj.powerUp) {
              // Apply power-up
              const config = POWER_UP_ITEMS.find(p => p.type === obj.powerUp);
              if (config) {
                if (obj.powerUp === 'heart' && prev.lives < prev.maxLives) {
                  newLives = prev.lives + 1;
                } else if (obj.powerUp === 'clear') {
                  // Will filter bad items below
                } else if (config.duration > 0) {
                  const existing = newActivePowerUps.findIndex(p => p.type === obj.powerUp);
                  if (existing >= 0) {
                    newActivePowerUps[existing].expiresAt = now + config.duration;
                  } else {
                    newActivePowerUps.push({
                      type: obj.powerUp!,
                      expiresAt: now + config.duration,
                      duration: config.duration,
                    });
                  }
                }
              }
            } else if (obj.type === 'good') {
              const comboMult = Math.min(1 + newCombo * 0.1, 2.5);
              const doubleMult = hasDouble ? 2 : 1;
              newScore += Math.floor(obj.points * comboMult * doubleMult);
              newCombo++;
              newMaxCombo = Math.max(newMaxCombo, newCombo);
              newLastCatch = 'good';
              caughtGood = true;
            } else if (obj.type === 'bad') {
              if (!hasShield) {
                newScore = Math.max(0, newScore + obj.points);
                newLives--;
                newLastCatch = 'bad';
              }
              newCombo = 0;
            }
            return false;
          }

          if (obj.y > canvasHeight) {
            if (obj.type === 'good') newCombo = 0;
            return false;
          }
          return true;
        });

      // Handle clear power-up
      const finalObjects = updatedObjects.filter(obj => {
        if (newActivePowerUps.some(p => p.type === 'clear')) {
          return obj.type !== 'bad';
        }
        return true;
      });

      // Remove clear from active (instant effect)
      newActivePowerUps = newActivePowerUps.filter(p => p.type !== 'clear');

      // Show combo
      if (caughtGood && newCombo >= 3) {
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        setShowCombo(true);
        comboTimeoutRef.current = setTimeout(() => setShowCombo(false), 400);
      }

      // Clear lastCatch
      if (newLastCatch !== prev.lastCatch) {
        if (lastCatchTimeoutRef.current) clearTimeout(lastCatchTimeoutRef.current);
        lastCatchTimeoutRef.current = setTimeout(() => {
          setGameState(p => ({ ...p, lastCatch: null }));
        }, 150);
      }

      // Calculate level based on score
      const newLevel = Math.floor(newScore / 100) + 1;

      // Update high score
      let newHighScore = prev.highScore;
      if (newScore > newHighScore) {
        newHighScore = newScore;
        localStorage.setItem('filmCatcher_highScore', newHighScore.toString());
      }

      return {
        ...prev,
        basket,
        objects: finalObjects,
        score: newScore,
        highScore: newHighScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
        lives: Math.max(0, newLives),
        level: newLevel,
        lastCatch: newLastCatch,
        activePowerUps: newActivePowerUps,
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
          vy: p.vy + 0.15,
          life: p.life - 0.04,
        }))
        .filter(p => p.life > 0)
    );
  }, [
    gameState.isPlaying,
    gameState.isPaused,
    gameState.gameStarted,
    isComplete,
    getSpawnRate,
    spawnObject,
    canvasWidth,
    canvasHeight,
    checkCollision,
    createParticles,
  ]);

  // Start game loop
  useGameLoop({
    onUpdate: updateGame,
    onRender: () => {},
    isActive: gameState.isPlaying && gameState.gameStarted && !isComplete,
  });

  // Handle mouse/touch
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gameState.gameStarted) return;
    const canvasRect = containerRef.current?.querySelector('canvas')?.getBoundingClientRect();
    if (!canvasRect) return;
    basketTargetX.current = e.clientX - canvasRect.left - GAME_CONFIG.BASKET_WIDTH / 2;
  }, [gameState.gameStarted]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.gameStarted) return;
      if (e.key === 'ArrowLeft') {
        basketTargetX.current = Math.max(0, basketTargetX.current - 40);
      } else if (e.key === 'ArrowRight') {
        basketTargetX.current = Math.min(canvasWidth - GAME_CONFIG.BASKET_WIDTH, basketTargetX.current + 40);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasWidth, gameState.gameStarted]);

  // Start game
  const startGame = useCallback(() => {
    setShowGame(true);
    lastSpawnTime.current = Date.now();
    setGameState(prev => ({
      ...prev,
      score: 0,
      isPlaying: true,
      isPaused: false,
      gameStarted: true,
      objects: [],
      lives: GAME_CONFIG.LIVES,
      level: 1,
      combo: 0,
      maxCombo: 0,
      lastCatch: null,
      activePowerUps: [],
    }));
    setParticles([]);
  }, []);

  // Restart game
  const restartGame = useCallback(() => {
    lastSpawnTime.current = Date.now();
    setGameState(prev => ({
      ...prev,
      score: 0,
      isPlaying: true,
      isPaused: false,
      gameStarted: true,
      objects: [],
      lives: GAME_CONFIG.LIVES,
      level: 1,
      combo: 0,
      maxCombo: 0,
      lastCatch: null,
      activePowerUps: [],
    }));
    setParticles([]);
  }, []);

  const activePowerUpsDisplay = gameState.activePowerUps.filter(p => p.expiresAt > Date.now());

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col items-center justify-center ${className || ''}`}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence mode="wait">
        {!showGame && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">{title}</h2>
              {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
            </motion.div>

            <motion.div className="relative w-[400px] h-[200px] mb-6 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl"
                    initial={{ x: (i * 80) % 400, y: -50, rotate: 0 }}
                    animate={{ y: 250, rotate: 360 }}
                    transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: "linear" }}
                  >
                    {['🎬', '🎥', '📽️', '🎞️', '⭐'][i]}
                  </motion.div>
                ))}
              </div>
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎬
                </motion.div>
                <p className="text-white/60 text-sm">Generating your video...</p>
              </div>
            </motion.div>

            <div className="w-[400px] mb-6">
              <div className="flex items-center justify-between text-white/60 text-sm mb-2">
                <span>Progress</span>
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

            {gameState.highScore > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-white/50 text-sm mb-4">
                <Trophy className="w-4 h-4" />
                <span>Best Score: {gameState.highScore}</span>
              </motion.div>
            )}

            <motion.button
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                <Gamepad2 className="w-6 h-6" />
                Play Mini-Game
                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <p className="text-white/40 text-xs mt-4 text-center">
              Play while you wait! Catch 🎬 and avoid 💣
            </p>
          </motion.div>
        )}

        {showGame && (
          <motion.div
            key="game-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="text-center mb-3">
              <h2 className="text-xl font-bold text-white drop-shadow-lg">🎬 Film Catcher</h2>
            </div>

            <div className="flex items-center justify-between w-[600px] mb-2 px-2">
              <div className="flex items-center gap-4">
                <span className="text-white font-mono">
                  Score: <span className="text-emerald-400 font-bold">{gameState.score}</span>
                </span>
                <span className="text-white/60 text-sm font-mono">Best: {gameState.highScore}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm px-2 py-0.5 bg-white/10 rounded">
                  Speed: +{getSpeedMultiplier(gameState.score)}%
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: gameState.maxLives }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < gameState.lives ? 'opacity-100' : 'opacity-30'}`}>
                      ❤️
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {activePowerUpsDisplay.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                {activePowerUpsDisplay.map((powerUp, index) => {
                  const config = POWER_UP_ITEMS.find(p => p.type === powerUp.type);
                  const remaining = Math.max(0, powerUp.expiresAt - Date.now());
                  const percentage = (remaining / powerUp.duration) * 100;
                  return (
                    <div key={`${powerUp.type}-${index}`} className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <span className="text-lg">{config?.emoji}</span>
                      <div className="w-10 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <GameCanvas
                width={canvasWidth}
                height={canvasHeight}
                gameState={gameState}
                particles={particles}
                progress={progress}
                className="cursor-none"
              />

              <AnimatePresence>
                {showCombo && gameState.combo >= 3 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <span className="text-4xl font-bold text-yellow-400 drop-shadow-lg">
                      {gameState.combo}x COMBO! 🔥
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!gameState.isPlaying && gameState.gameStarted && !isComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                  >
                    <div className="text-center">
                      <h3 className="text-4xl font-bold text-white mb-4">Game Over!</h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-white/60 text-sm">Final Score</p>
                          <p className="text-2xl font-bold text-emerald-400">{gameState.score}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-white/60 text-sm">Max Combo</p>
                          <p className="text-2xl font-bold text-yellow-400">{gameState.maxCombo}x</p>
                        </div>
                      </div>
                      {gameState.score >= gameState.highScore && gameState.score > 0 && (
                        <p className="text-yellow-400 font-bold text-xl mb-4">🏆 New High Score! 🏆</p>
                      )}
                      <button
                        onClick={restartGame}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
                      >
                        Play Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                  >
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                      <span className="text-6xl">✅</span>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mt-4">Ready!</h3>
                    <p className="text-white/70 mt-2">Final Score: {gameState.score}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-[600px] mt-4">
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

            <p className="text-white/40 text-xs mt-3 text-center">
              Move mouse or use ← → to catch 🎬 and avoid 💣 | Collect ❤️ 🛡️ 🧲 for power-ups!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
