/**
 * Types for Film Reel Catcher Loading Game
 * Enhanced with power-ups, achievements, and progressive difficulty
 */

export interface LoadingGameConfig {
  /** Loading progress (0-100) */
  progress: number;
  /** Whether loading is complete */
  isComplete: boolean;
  /** Title to display */
  title?: string;
  /** Subtitle/message */
  subtitle?: string;
  /** Callback when game ends */
  onComplete?: () => void;
}

export type ObjectType = 'good' | 'bad' | 'powerup';
export type PowerUpType = 'heart' | 'shield' | 'magnet' | 'slowmo' | 'double' | 'clear';

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: ObjectType;
  emoji: string;
  points: number;
  powerUp?: PowerUpType;
}

export interface Basket {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  expiresAt: number;
  duration: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameState {
  score: number;
  highScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameStarted: boolean; // New: tracks if player clicked "Play Game"
  objects: GameObject[];
  basket: Basket;
  lives: number;
  maxLives: number;
  level: number;
  combo: number;
  maxCombo: number;
  lastCatch: 'good' | 'bad' | null;
  activePowerUps: ActivePowerUp[];
  achievements: Achievement[];
  totalCatches: number;
  playTime: number; // seconds
  screenShake: number; // shake intensity (0-1)
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  emoji?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

export const GOOD_ITEMS = [
  { emoji: '🎬', points: 10, name: 'Clapperboard' },
  { emoji: '🎥', points: 15, name: 'Movie Camera' },
  { emoji: '📽️', points: 20, name: 'Film Projector' },
  { emoji: '🎞️', points: 25, name: 'Film Frames' },
  { emoji: '⭐', points: 50, name: 'Star Bonus' },
  { emoji: '🏆', points: 100, name: 'Trophy' },
];

export const BAD_ITEMS = [
  { emoji: '💣', points: -30, name: 'Bomb' },
  { emoji: '🔥', points: -20, name: 'Fire' },
  { emoji: '❌', points: -15, name: 'X Mark' },
  { emoji: '☠️', points: -25, name: 'Skull' },
];

export const POWER_UP_ITEMS: { emoji: string; type: PowerUpType; name: string; duration: number; description: string }[] = [
  { emoji: '❤️', type: 'heart', name: 'Extra Life', duration: 0, description: '+1 Life' },
  { emoji: '🛡️', type: 'shield', name: 'Shield', duration: 5000, description: 'Block bombs for 5s' },
  { emoji: '🧲', type: 'magnet', name: 'Magnet', duration: 5000, description: 'Attract good items' },
  { emoji: '⏱️', type: 'slowmo', name: 'Slow Motion', duration: 4000, description: 'Slow everything down' },
  { emoji: '💎', type: 'double', name: 'Double Points', duration: 8000, description: '2x points for 8s' },
  { emoji: '🌟', type: 'clear', name: 'Clear Screen', duration: 0, description: 'Clear all bad items' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_catch', name: 'First Catch', description: 'Catch your first item', emoji: '🎯' },
  { id: 'score_100', name: 'Beginner', description: 'Score 100 points', emoji: '🥉' },
  { id: 'score_500', name: 'Intermediate', description: 'Score 500 points', emoji: '🥈' },
  { id: 'score_1000', name: 'Expert', description: 'Score 1000 points', emoji: '🥇' },
  { id: 'score_2000', name: 'Master', description: 'Score 2000 points', emoji: '👑' },
  { id: 'combo_5', name: 'Combo Starter', description: 'Get a 5x combo', emoji: '🔥' },
  { id: 'combo_10', name: 'Combo Master', description: 'Get a 10x combo', emoji: '💥' },
  { id: 'combo_20', name: 'Combo Legend', description: 'Get a 20x combo', emoji: '⚡' },
  { id: 'level_5', name: 'Level Up', description: 'Reach level 5', emoji: '📈' },
  { id: 'level_10', name: 'High Level', description: 'Reach level 10', emoji: '🚀' },
  { id: 'survivor_60', name: 'Survivor', description: 'Play for 60 seconds', emoji: '⏰' },
  { id: 'survivor_120', name: 'Endurance', description: 'Play for 2 minutes', emoji: '💪' },
  { id: 'no_damage', name: 'Untouchable', description: 'Reach level 3 without losing a life', emoji: '🛡️' },
  { id: 'powerup_collector', name: 'Power Collector', description: 'Collect 5 power-ups in one game', emoji: '✨' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// GAME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const GAME_CONFIG = {
  // Canvas dimensions
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 500,
  
  // Basket
  BASKET_WIDTH: 80,
  BASKET_HEIGHT: 55,
  
  // Objects
  OBJECT_SIZE: 50,
  
  // Spawn rates (ms)
  INITIAL_SPAWN_RATE: 1400,
  MIN_SPAWN_RATE: 400,
  SPAWN_RATE_DECREASE_PER_LEVEL: 100,
  
  // Speed
  INITIAL_SPEED: 2.5,
  MAX_SPEED: 8,
  SPEED_INCREASE_PER_LEVEL: 0.4,
  SLOWMO_SPEED_MULTIPLIER: 0.4,
  
  // Lives
  LIVES: 3,
  MAX_LIVES: 5,
  
  // Scoring
  LEVEL_UP_SCORE: 150,
  
  // Probabilities
  GOOD_ITEM_CHANCE: 0.70,
  POWER_UP_CHANCE: 0.08, // 8% chance for power-up
  POWER_UP_CHANCE_INCREASE_PER_LEVEL: 0.01,
  
  // Difficulty scaling
  BAD_ITEM_CHANCE_INCREASE_PER_LEVEL: 0.02,
  
  // Magnet effect
  MAGNET_PULL_STRENGTH: 3,
  MAGNET_RANGE: 150,
  
  // Visual effects
  SCREEN_SHAKE_DURATION: 300,
  SCREEN_SHAKE_INTENSITY: 8,
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIFFICULTY LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export interface DifficultyLevel {
  level: number;
  speedMultiplier: number;
  spawnRateMultiplier: number;
  badItemChance: number;
  powerUpChance: number;
  description: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { level: 1, speedMultiplier: 1.0, spawnRateMultiplier: 1.0, badItemChance: 0.25, powerUpChance: 0.08, description: 'Easy Start' },
  { level: 2, speedMultiplier: 1.1, spawnRateMultiplier: 0.95, badItemChance: 0.27, powerUpChance: 0.09, description: 'Warming Up' },
  { level: 3, speedMultiplier: 1.2, spawnRateMultiplier: 0.90, badItemChance: 0.30, powerUpChance: 0.10, description: 'Getting Harder' },
  { level: 4, speedMultiplier: 1.35, spawnRateMultiplier: 0.85, badItemChance: 0.32, powerUpChance: 0.11, description: 'Challenge Mode' },
  { level: 5, speedMultiplier: 1.5, spawnRateMultiplier: 0.80, badItemChance: 0.35, powerUpChance: 0.12, description: 'Intense!' },
  { level: 6, speedMultiplier: 1.65, spawnRateMultiplier: 0.75, badItemChance: 0.37, powerUpChance: 0.13, description: 'Expert Zone' },
  { level: 7, speedMultiplier: 1.8, spawnRateMultiplier: 0.70, badItemChance: 0.40, powerUpChance: 0.14, description: 'Hardcore' },
  { level: 8, speedMultiplier: 2.0, spawnRateMultiplier: 0.65, badItemChance: 0.42, powerUpChance: 0.15, description: 'Insane!' },
  { level: 9, speedMultiplier: 2.2, spawnRateMultiplier: 0.60, badItemChance: 0.45, powerUpChance: 0.16, description: 'Legendary' },
  { level: 10, speedMultiplier: 2.5, spawnRateMultiplier: 0.55, badItemChance: 0.48, powerUpChance: 0.18, description: 'MAXIMUM!' },
];

export function getDifficultyForLevel(level: number): DifficultyLevel {
  const maxLevel = DIFFICULTY_LEVELS.length;
  const clampedLevel = Math.min(level, maxLevel);
  return DIFFICULTY_LEVELS[clampedLevel - 1] || DIFFICULTY_LEVELS[maxLevel - 1];
}
